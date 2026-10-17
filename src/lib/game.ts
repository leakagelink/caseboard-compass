import { CASES, type GameCase } from '@/data/cases';

export type Verdict = 'relevant' | 'misleading';
export type CaseProgress = { inspected: string[]; verdicts: Record<string, Verdict>; accused?: string; deduced?: boolean; solved?: boolean; attempts?: number };
export type Save = { cases: Record<string, CaseProgress>; xp: number; hints: number; flawless: string[] };
export type CaseOverride = Partial<Pick<GameCase, 'title' | 'summary' | 'difficulty' | 'status' | 'rewardXp' | 'order'>>;
export const emptyCase: CaseProgress = { inspected: [], verdicts: {} };
export const emptySave: Save = { cases: {}, xp: 0, hints: 3, flawless: [] };
export function completeCase(s: Save, c: GameCase, flawless: boolean): Save {
  const prev = s.cases[c.id] ?? emptyCase;
  if (prev.solved) return s;
  return { ...s, xp: s.xp + c.rewardXp + (flawless ? 50 : 0), flawless: flawless ? [...s.flawless, c.id] : s.flawless, cases: { ...s.cases, [c.id]: { ...prev, solved: true } } };
}
export function isUnlocked(cases: GameCase[], save: Save, c: GameCase) {
  const published = cases.filter(x => x.status === 'published' && x.campaign === c.campaign).sort((a,b) => a.order - b.order);
  const i = published.findIndex(x => x.id === c.id);
  const previous = published[i - 1];
  return i >= 0 && (i === 0 || Boolean(previous && save.cases[previous.id]?.solved));
}
export const level = (xp: number) => Math.floor(xp / 200) + 1;
export const ACHIEVEMENTS = [
  { id: 'first-clue', name: 'First Glimpse', desc: 'Inspect your first clue', test: (s: Save) => Object.values(s.cases).some(c => c.inspected.length > 0) },
  { id: 'first-deduction', name: 'Sharp Mind', desc: 'Make a correct deduction', test: (s: Save) => Object.values(s.cases).some(c => c.deduced) },
  { id: 'first-solve', name: 'Rest in Peace', desc: 'Solve your first case', test: (s: Save) => Object.values(s.cases).some(c => c.solved) },
  { id: 'flawless', name: 'Untouchable', desc: 'Win an encounter above 70% health', test: (s: Save) => s.flawless.length > 0 },
  { id: 'all-cases', name: 'Case Zero', desc: 'Solve all three cases', test: (s: Save) => CASES.every(c => s.cases[c.id]?.solved) },
];