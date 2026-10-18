import type { GameCase } from '@/data/cases';
import type { CloudSave } from './game-engine';
import { isUnlocked } from './game';

export class GameFault extends Error {
  constructor(public code: string, public status: number, message: string) { super(message); }
}
export type MutationKey = { expectedRevision: number; requestId: string; fingerprint: string };
export function checkRequest(state: CloudSave, revision: number, key: MutationKey) {
  const receipt = state.receipts?.find(r => r.requestId === key.requestId);
  if (receipt) {
    if (receipt.fingerprint !== key.fingerprint) throw new GameFault('REQUEST_ID_REUSED', 409, 'Request ID was used for another action.');
    return receipt;
  }
  if (revision !== key.expectedRevision) throw new GameFault('REVISION_CONFLICT', 409, 'Progress changed. Read progress before submitting a new action.');
  return undefined;
}
export function recordRequest(state: CloudSave, revision: number, key: MutationKey, now: number, message?: string): CloudSave {
  const rate = state.nativeRate && now - state.nativeRate.windowAt < 60000 ? state.nativeRate : { windowAt: now, count: 0 };
  if (rate.count >= 120) throw new GameFault('RATE_LIMITED', 429, 'Too many actions. Wait before trying again.');
  return { ...state, nativeRate: { ...rate, count: rate.count + 1 }, receipts: [...(state.receipts ?? []), { requestId: key.requestId, fingerprint: key.fingerprint, revision, ...(message ? { message } : {}) }].slice(-128) };
}
export function nativeProgress(state: CloudSave, revision: number, cases: GameCase[]) {
  return {
    revision, xp: state.xp, hints: state.hints, flawless: state.flawless,
    selectedArea: state.selectedArea ?? null, progress: state.cases, encounters: state.encounters ?? {},
    cases: cases.filter(c => c.status === 'published').map(c => {
      const solved = Boolean(state.cases[c.id]?.solved);
      const inspected = state.cases[c.id]?.inspected ?? [];
      return {
        id: c.id, slug: c.slug, campaign: c.campaign ?? null, order: c.order,
        title: c.title, summary: c.summary, difficulty: c.difficulty, location: c.location, date: c.date,
        unlocked: isUnlocked(cases, state, c), rewardXp: c.rewardXp, timeline: c.timeline, objectives: c.objectives,
        deductionQuestion: c.deductionQuestion, suspects: c.suspects,
        clues: c.clues.map(clue => ({ id: clue.id, name: clue.name, location: clue.location, description: clue.description, ...(inspected.includes(clue.id) ? { inspection: clue.inspection } : {}) })),
        ghost: { name: c.ghost.name, temperament: c.ghost.temperament, abilities: c.ghost.abilities, hp: c.ghost.hp, power: c.ghost.power, attackEvery: c.ghost.attackEvery, mode: c.ghost.mode, ...(solved ? { trueName: c.ghost.trueName } : {}) },
        ...(solved ? { reveal: c.reveal } : {}),
      };
    }),
  };
}