import { useEffect, useState } from "react";
import { CASES, type GameCase } from "@/data/cases";

export type Verdict = "relevant" | "misleading";
export type CaseProgress = {
  inspected: string[];
  verdicts: Record<string, Verdict>;
  accused?: string;
  deduced?: boolean;
  solved?: boolean;
  attempts?: number;
};
export type Save = {
  cases: Record<string, CaseProgress>;
  xp: number;
  hints: number;
  flawless: string[];
};

const KEY = "casezero-save-v1";
const ADMIN_KEY = "casezero-admin-v1";
const emptySave: Save = { cases: {}, xp: 0, hints: 3, flawless: [] };
export const emptyCase: CaseProgress = { inspected: [], verdicts: {} };

// Simple pub/sub so every mounted hook stays in sync.
const listeners = new Set<() => void>();
function read<T>(k: string, d: T): T {
  try {
    const r = localStorage.getItem(k);
    return r ? { ...d, ...JSON.parse(r) } : d;
  } catch {
    return d;
  }
}

export function useSave() {
  const [save, setSave] = useState<Save>(emptySave);
  useEffect(() => {
    const sync = () => setSave(read(KEY, emptySave));
    sync();
    listeners.add(sync);
    return () => void listeners.delete(sync);
  }, []);
  const update = (fn: (s: Save) => Save) => {
    const next = fn(read(KEY, emptySave));
    localStorage.setItem(KEY, JSON.stringify(next));
    listeners.forEach((l) => l());
  };
  const updateCase = (id: string, fn: (c: CaseProgress) => CaseProgress) =>
    update((s) => ({ ...s, cases: { ...s.cases, [id]: fn(s.cases[id] ?? emptyCase) } }));
  const resetAll = () => update(() => emptySave);
  return { save, update, updateCase, resetAll };
}

/** Award XP only the first time a case is solved. */
export function completeCase(s: Save, c: GameCase, flawless: boolean): Save {
  const prev = s.cases[c.id] ?? emptyCase;
  if (prev.solved) return s;
  return {
    ...s,
    xp: s.xp + c.rewardXp + (flawless ? 50 : 0),
    flawless: flawless ? [...s.flawless, c.id] : s.flawless,
    cases: { ...s.cases, [c.id]: { ...prev, solved: true } },
  };
}

export function isUnlocked(cases: GameCase[], save: Save, c: GameCase) {
  const pub = cases.filter((x) => x.status === "published").sort((a, b) => a.order - b.order);
  const i = pub.findIndex((x) => x.id === c.id);
  if (i < 0) return false;
  return i === 0 || !!save.cases[pub[i - 1].id]?.solved;
}

export const level = (xp: number) => Math.floor(xp / 200) + 1;

export const ACHIEVEMENTS = [
  { id: "first-clue", name: "First Glimpse", desc: "Inspect your first clue", test: (s: Save) => Object.values(s.cases).some((c) => c.inspected.length > 0) },
  { id: "first-deduction", name: "Sharp Mind", desc: "Make a correct deduction", test: (s: Save) => Object.values(s.cases).some((c) => c.deduced) },
  { id: "first-solve", name: "Rest in Peace", desc: "Solve your first case", test: (s: Save) => Object.values(s.cases).some((c) => c.solved) },
  { id: "flawless", name: "Untouchable", desc: "Win an encounter above 70% health", test: (s: Save) => s.flawless.length > 0 },
  { id: "all-cases", name: "Case Zero", desc: "Solve all three cases", test: (s: Save) => CASES.every((c) => s.cases[c.id]?.solved) },
];

// ---- Admin overrides (local prototype) ----
export type CaseOverride = Partial<Pick<GameCase, "title" | "summary" | "difficulty" | "status" | "rewardXp" | "order">>;

export function useCases() {
  const [overrides, setOverrides] = useState<Record<string, CaseOverride>>({});
  useEffect(() => {
    const sync = () => setOverrides(read(ADMIN_KEY, {}));
    sync();
    listeners.add(sync);
    return () => void listeners.delete(sync);
  }, []);
  const cases = CASES.map((c) => ({ ...c, ...overrides[c.id] })).sort((a, b) => a.order - b.order);
  const saveOverride = (id: string, o: CaseOverride) => {
    const all = read<Record<string, CaseOverride>>(ADMIN_KEY, {});
    localStorage.setItem(ADMIN_KEY, JSON.stringify({ ...all, [id]: { ...all[id], ...o } }));
    listeners.forEach((l) => l());
  };
  const resetOverrides = () => {
    localStorage.removeItem(ADMIN_KEY);
    listeners.forEach((l) => l());
  };
  return { cases, saveOverride, resetOverrides };
}
