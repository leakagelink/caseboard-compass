import { createServerOnlyFn } from '@tanstack/react-start';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { CASES } from '@/data/cases';
import { emptySave } from './game';
import { applyAction, type CloudSave, type GameAction } from './game-engine';
import { makeLocationCases } from './location-cases';
import { checkRequest, GameFault, recordRequest, type MutationKey } from './native-protocol';

export type PlayerContext = { userId: string; supabase: SupabaseClient<Database> };
export const readGame = createServerOnlyFn(async (context: PlayerContext) => {
  const [row, settings] = await Promise.all([
    context.supabase.from('game_saves').select('state,revision').eq('user_id', context.userId).maybeSingle(),
    context.supabase.from('case_settings').select('*'),
  ]);
  if (row.error || settings.error) throw new GameFault('UNAVAILABLE', 503, 'Progress is temporarily unavailable.');
  const state = (row.data?.state ?? structuredClone(emptySave)) as unknown as CloudSave;
  const cases = [...CASES.map(c => {
    const o = settings.data.find(x => x.case_id === c.id);
    return { ...c, title: o?.title ?? c.title, summary: o?.summary ?? c.summary, difficulty: o?.difficulty ?? c.difficulty, status: (o?.status ?? c.status) as 'published' | 'draft', rewardXp: o?.reward_xp ?? c.rewardXp, order: o?.sort_order ?? c.order };
  }), ...(state.locationCases ?? [])];
  return { state, revision: row.data?.revision ?? 0, cases };
});

type Command = { type: 'area'; area: string } | { type: 'action'; action: GameAction };
export const mutateGame = createServerOnlyFn(async (context: PlayerContext, command: Command, key?: MutationKey) => {
  // Only reached after trusted authentication. Ordinary reads above use the player's RLS client.
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const init = await supabaseAdmin.from('game_saves').upsert({ user_id: context.userId }, { onConflict: 'user_id', ignoreDuplicates: true });
  if (init.error) throw new GameFault('UNAVAILABLE', 503, 'Could not open progress.');
  const receivedAt = Date.now();
  for (let attempt = 0; attempt < 4; attempt++) {
    const game = await readGame(context);
    if (key) {
      const receipt = checkRequest(game.state, game.revision, key);
      if (receipt) return { ...game, message: receipt.message, replayed: true, appliedRevision: receipt.revision };
    }
    let state: CloudSave;
    let message: string | undefined;
    if (command.type === 'area') {
      const existing = game.state.locationCases ?? [];
      const campaign = `area:${command.area}`;
      const assigned = existing.some(c => c.campaign === campaign);
      if (!assigned && existing.length >= 60) throw new GameFault('ARCHIVE_FULL', 409, 'Your area archive is full. Continue an existing case.');
      state = { ...game.state, selectedArea: command.area, locationCases: assigned ? existing : [...existing, ...makeLocationCases(command.area)] };
    } else {
      try {
        const result = applyAction(game.state, game.cases, command.action, receivedAt);
        state = result.state; message = result.message;
      } catch (error) { throw new GameFault('ACTION_REJECTED', 422, error instanceof Error ? error.message : 'Action rejected.'); }
      const e = state.encounters?.[command.action.caseId];
      const processing = Math.max(0, Date.now() - receivedAt);
      if (e?.phase === 'fight') {
        e.lastAttack += processing;
        if (e.revealedUntil > receivedAt) e.revealedUntil += processing;
        if (e.dodgeUntil > receivedAt) e.dodgeUntil += processing;
      }
    }
    const revision = game.revision + 1;
    if (key) state = recordRequest(state, revision, key, receivedAt, message);
    const write = await supabaseAdmin.from('game_saves').update({ state: JSON.parse(JSON.stringify(state)), revision, updated_at: new Date().toISOString() }).eq('user_id', context.userId).eq('revision', game.revision).select('revision');
    if (write.error) throw new GameFault('UNAVAILABLE', 503, 'Could not save progress.');
    if (write.data.length) return { state, revision, cases: [...game.cases.filter(c => !c.campaign), ...(state.locationCases ?? [])], message, replayed: false, appliedRevision: revision };
    // Reread to replay an identical winning request, or reject a stale new request.
  }
  throw new GameFault('REVISION_CONFLICT', 409, 'Another action is saving. Read progress and retry.');
});