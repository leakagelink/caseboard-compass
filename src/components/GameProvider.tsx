import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { CASES } from '@/data/cases';
import { emptySave, type CaseOverride } from '@/lib/game';
import type { CloudSave, GameAction } from '@/lib/game-engine';
import { editCase, gameAction } from '@/lib/game.functions';

function useGameState() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actionLock = useRef(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const runAction = useServerFn(gameAction);
  const runEdit = useServerFn(editCase);
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => { if (active) { setUser(data.session?.user ?? null); setAuthLoading(false); if (error) setError('Could not check your sign-in.'); } });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!['SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event)) return;
      setUser(session?.user ?? null); setAuthLoading(false);
      void router.invalidate();
      if (event === 'SIGNED_OUT') queryClient.removeQueries({ queryKey: ['player'] });
      else void queryClient.invalidateQueries({ queryKey: ['player'] });
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [queryClient, router]);
  const settings = useQuery({ queryKey: ['case-settings'], queryFn: async () => { const r = await supabase.from('case_settings').select('*'); if (r.error) throw new Error('Case settings could not load.'); return r.data; }, staleTime: 30000 });
  const progress = useQuery({ queryKey: ['player', user?.id, 'save'], enabled: Boolean(user), queryFn: async () => { if (!user) return emptySave; const r = await supabase.from('game_saves').select('state').eq('user_id', user.id).maybeSingle(); if (r.error) throw new Error('Online progress could not load.'); return (r.data?.state ?? emptySave) as unknown as CloudSave; } });
  const role = useQuery({ queryKey: ['player', user?.id, 'role'], enabled: Boolean(user), queryFn: async () => { if (!user) return false; const r = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }); if (r.error) throw new Error('Access could not be checked.'); return r.data; } });
  const cases = CASES.map(c => { const o = settings.data?.find(x => x.case_id === c.id); return { ...c, title: o?.title ?? c.title, summary: o?.summary ?? c.summary, difficulty: o?.difficulty ?? c.difficulty, status: (o?.status ?? c.status) as 'published' | 'draft', rewardXp: o?.reward_xp ?? c.rewardXp, order: o?.sort_order ?? c.order }; }).sort((a,b) => a.order - b.order);
  const act = async (action: GameAction) => {
    if (!user) { setError('Sign in to save your investigation.'); return null; }
    if (actionLock.current) return null;
    actionLock.current = true;
    setBusy(true); setError(null);
    try { const r = await runAction({ data: action }); queryClient.setQueryData(['player', user.id, 'save'], r.state); return r; }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save. Please retry.'); return null; }
    finally { actionLock.current = false; setBusy(false); }
  };
  const saveOverride = async (id: string, o: CaseOverride) => {
    setBusy(true); setError(null);
    try { await runEdit({ data: { caseId: id, ...o } }); await queryClient.invalidateQueries({ queryKey: ['case-settings'] }); return true; }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save case.'); return false; }
    finally { setBusy(false); }
  };
  const retry = () => { setError(null); void settings.refetch(); if (user) { void progress.refetch(); void role.refetch(); } };
  return { user, authLoading, loading: authLoading || (Boolean(user) && progress.isPending), adminLoading: authLoading || (Boolean(user) && role.isPending), isAdmin: Boolean(role.data), save: (progress.data ?? emptySave) as CloudSave, cases, act, saveOverride, busy, error: error ?? progress.error?.message ?? settings.error?.message ?? role.error?.message, retry };
}
type GameContext = ReturnType<typeof useGameState>;
const Context = createContext<GameContext | null>(null);
export function GameProvider({ children }: { children: ReactNode }) { const value = useGameState(); return <Context.Provider value={value}>{children}</Context.Provider>; }
export function useGame() { const context = useContext(Context); if (!context) throw new Error('Game provider is missing.'); return context; }