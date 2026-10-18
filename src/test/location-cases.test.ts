import { describe, it, expect } from 'vitest';
import { locationArea, makeLocationCases } from '@/lib/location-cases';
import { emptySave, isUnlocked } from '@/lib/game';
import { CASES } from '@/data/cases';

describe('location-specific fictional cases', () => {
  it('assigns distinct plots and thief stories to Kolkata and Delhi areas', () => {
    const a = makeLocationCases('2257:8836');
    const b = makeLocationCases('2861:7720');
    expect(a[0]?.title).not.toBe(b[0]?.title);
    expect(a[0]?.clues[0]?.inspection).not.toBe(b[0]?.clues[0]?.inspection);
    expect(new Set(a.map(c => c.title)).size).toBe(3);
  });
  it('uses collision-free area identities and varied culprits across the catalogue', () => {
    const cases = Array.from({ length: 100 }, (_, i) => makeLocationCases(`${i}:100`)).flat();
    expect(new Set(cases.map(c => c.id)).size).toBe(300);
    expect(new Set(cases.map(c => c.title)).size).toBe(12);
    expect(new Set(cases.map(c => c.culprit))).toEqual(new Set(['partner', 'fence', 'keeper']));
  });
  it('gives different areas different thieves and case identities', () => {
    const a = makeLocationCases(locationArea(22.57, 88.36));
    const b = makeLocationCases(locationArea(28.61, 77.20));
    expect(a[0]?.id).not.toBe(b[0]?.id);
    expect(a[0]?.ghost.trueName).not.toBe(b[0]?.ghost.trueName);
    expect(a[0]?.reveal).not.toBe(b[0]?.reveal);
  });
  it('retains the same cases when the same area is revisited', () => {
    expect(makeLocationCases('2257:8836')).toEqual(makeLocationCases('2257:8836'));
  });
  it('locks the next location level until the previous case is solved', () => {
    const cases = makeLocationCases('2257:8836');
    const [first, second] = cases;
    if (!first || !second) throw new Error('Missing location levels');
    expect(isUnlocked([...CASES, ...cases], emptySave, first)).toBe(true);
    expect(isUnlocked([...CASES, ...cases], emptySave, second)).toBe(false);
    expect(isUnlocked(cases, { ...emptySave, cases: { [first.id]: { inspected: [], verdicts: {}, solved: true } } }, second)).toBe(true);
  });
  it('rejects invalid coordinates rather than assigning a case', () => {
    expect(() => locationArea(91, 10)).toThrow('Invalid location');
    expect(() => locationArea(10, Number.NaN)).toThrow('Invalid location');
  });
});