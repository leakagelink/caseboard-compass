import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { completeCase, isUnlocked } from "@/lib/progress";

const empty = { cases: {}, xp: 0, hints: 3, flawless: [] };

describe("progression", () => {
  it("only case 001 is unlocked at start", () => {
    expect(isUnlocked(CASES, empty, CASES[0])).toBe(true);
    expect(isUnlocked(CASES, empty, CASES[1])).toBe(false);
  });
  it("solving 001 unlocks 002 and awards XP once", () => {
    const s1 = completeCase(empty, CASES[0], false);
    expect(s1.xp).toBe(150);
    expect(isUnlocked(CASES, s1, CASES[1])).toBe(true);
    expect(completeCase(s1, CASES[0], true).xp).toBe(150);
  });
});
