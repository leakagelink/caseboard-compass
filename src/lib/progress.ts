import { useEffect, useState } from "react";

export type Verdict = "relevant" | "misleading";
export type Progress = {
  inspected: string[];
  verdicts: Record<string, Verdict>;
  accused?: string;
};

const KEY = "case001-progress";
const empty: Progress = { inspected: [], verdicts: {} };

export function useProgress() {
  const [p, setP] = useState<Progress>(empty);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setP(JSON.parse(raw));
    } catch {}
  }, []);
  const update = (fn: (p: Progress) => Progress) =>
    setP((prev) => {
      const next = fn(prev);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  const reset = () => update(() => empty);
  return { p, update, reset };
}
