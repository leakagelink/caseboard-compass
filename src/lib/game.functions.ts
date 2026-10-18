import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { CASES } from '@/data/cases';
import { actionSchema, areaSchema } from './game-input';
import { mutateGame } from './game-service';

export const assignLocation = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(input => areaSchema.parse(input))
  .handler(async ({ data, context }) => (await mutateGame(context, { type: 'area', area: data.area })).state);
export const gameAction = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(input => actionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const result = await mutateGame(context, { type: 'action', action: data });
    return { state: result.state, message: result.message };
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