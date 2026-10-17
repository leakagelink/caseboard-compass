import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { CASES } from '@/data/cases';
import { applyAction, type CloudSave } from './game-engine';
import { emptySave } from './game';

const actionSchema = z.object({ caseId: z.string(), kind: z.enum(['inspect','judge','accuse','hint','start','tick','scan','strike','dodge']), clueId: z.string().optional(), verdict: z.enum(['relevant','misleading']).optional(), suspectId: z.string().optional() });
export const gameAction = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => actionSchema.parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const settings = await context.supabase.from('case_settings').select('*');
  if (settings.error) throw new Error('Case settings are unavailable. Please retry.');
  const cases = CASES.map(c => { const o = settings.data.find(x => x.case_id === c.id); return { ...c, title: o?.title ?? c.title, summary: o?.summary ?? c.summary, difficulty: o?.difficulty ?? c.difficulty, status: (o?.status ?? c.status) as 'published' | 'draft', rewardXp: o?.reward_xp ?? c.rewardXp, order: o?.sort_order ?? c.order }; });
  const { error: initError } = await supabaseAdmin.from('game_saves').upsert({ user_id: context.userId }, { onConflict: 'user_id', ignoreDuplicates: true });
  if (initError) throw new Error('Could not open your saved progress.');
  for (let retry = 0; retry < 4; retry++) {
    const row = await supabaseAdmin.from('game_saves').select('state,revision').eq('user_id', context.userId).single();
    if (row.error) throw new Error('Could not load progress.');
    const state = (row.data.state ?? emptySave) as unknown as CloudSave;
    const result = applyAction(state, cases, data, Date.now());
    const write = await supabaseAdmin.from('game_saves').update({ state: JSON.parse(JSON.stringify(result.state)), revision: row.data.revision + 1, updated_at: new Date().toISOString() }).eq('user_id', context.userId).eq('revision', row.data.revision).select('revision');
    if (write.error) throw new Error('Could not save progress. Please retry.');
    if (write.data.length) return result;
  }
  throw new Error('Another action is saving. Please retry.');
});

export const editCase = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => z.object({ caseId: z.string(), title: z.string().min(1).max(120).optional(), summary: z.string().min(1).max(3000).optional(), difficulty: z.string().min(1).max(40).optional(), status: z.enum(['published','draft']).optional(), rewardXp: z.number().int().min(0).max(1000).optional(), order: z.number().int().min(1).max(3).optional() }).parse(input)).handler(async ({ data, context }) => {
  const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (role.error || !role.data) throw new Error('Admin access required.');
  if (!CASES.some(c => c.id === data.caseId)) throw new Error('Unknown case.');
  const patch = { case_id: data.caseId, ...(data.title !== undefined ? { title: data.title } : {}), ...(data.summary !== undefined ? { summary: data.summary } : {}), ...(data.difficulty !== undefined ? { difficulty: data.difficulty } : {}), ...(data.status !== undefined ? { status: data.status } : {}), ...(data.rewardXp !== undefined ? { reward_xp: data.rewardXp } : {}), ...(data.order !== undefined ? { sort_order: data.order } : {}), updated_at: new Date().toISOString() };
  const { error } = await context.supabase.from('case_settings').upsert(patch);
  if (error) throw new Error('Case changes could not be saved.');
  return { ok: true };
});