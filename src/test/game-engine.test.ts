import { describe, expect, it } from 'vitest';
import { CASES } from '@/data/cases';
import { applyAction, type CloudSave } from '@/lib/game-engine';
import { emptySave } from '@/lib/game';

const first = CASES.find(c => c.id === 'CASE-001');
if (!first) throw new Error('Missing Case 001');
const c = first;
const start = 100000;
function deduced(): CloudSave {
  let state: CloudSave = structuredClone(emptySave);
  for (const clue of c.clues) {
    state = applyAction(state, CASES, { caseId: c.id, kind: 'inspect', clueId: clue.id }, start).state;
    state = applyAction(state, CASES, { caseId: c.id, kind: 'judge', clueId: clue.id, verdict: clue.relevant ? 'relevant' : 'misleading' }, start).state;
  }
  return applyAction(state, CASES, { caseId: c.id, kind: 'accuse', suspectId: c.culprit }, start).state;
}
describe('online gameplay validation', () => {
  it('starting an active encounter cannot restore player health or reset cooldowns', () => {
    let state = applyAction(deduced(), CASES, { caseId: c.id, kind: 'start' }, start).state;
    state = applyAction(state, CASES, { caseId: c.id, kind: 'scan' }, start + 3201).state;
    const encounter = structuredClone(state.encounters?.[c.id]);
    state = applyAction(state, CASES, { caseId: c.id, kind: 'start' }, start + 3300).state;
    expect(state.encounters?.[c.id]).toEqual(encounter);
    expect(state.encounters?.[c.id]?.hp).toBe(88);
  });
  it('pause freezes health, scanner visibility and strike cooldowns across resume', () => {
    let state = applyAction(deduced(), CASES, { caseId: c.id, kind: 'start' }, start).state;
    state = applyAction(state, CASES, { caseId: c.id, kind: 'scan' }, start + 10).state;
    state = applyAction(state, CASES, { caseId: c.id, kind: 'strike' }, start + 20).state;
    state = applyAction(state, CASES, { caseId: c.id, kind: 'pause' }, start + 100).state;
    state = applyAction(state, CASES, { caseId: c.id, kind: 'strike' }, start + 60100).state;
    expect(state.encounters?.[c.id]?.hp).toBe(100);
    expect(state.encounters?.[c.id]?.ghostHp).toBe(85);
    state = applyAction(state, CASES, { caseId: c.id, kind: 'resume' }, start + 60100).state;
    expect(state.encounters?.[c.id]?.revealedUntil).toBe(start + 63010);
    state = applyAction(state, CASES, { caseId: c.id, kind: 'strike' }, start + 60101).state;
    expect(state.encounters?.[c.id]?.ghostHp).toBe(85);
    expect(state.encounters?.[c.id]?.lastAttack).toBe(start + 60000);
  });
  it('expires paused encounters after 15 minutes instead of reviving them', () => {
    let state = applyAction(deduced(), CASES, { caseId: c.id, kind: 'start' }, start).state;
    state = applyAction(state, CASES, { caseId: c.id, kind: 'pause' }, start + 1).state;
    state = applyAction(state, CASES, { caseId: c.id, kind: 'resume' }, start + 900002).state;
    expect(state.encounters?.[c.id]?.phase).toBe('lost');
    expect(state.xp).toBe(0);
  });
  it('allows five pauses per attempt, not six, including after reopening', () => {
    let state = applyAction(deduced(), CASES, { caseId: c.id, kind: 'start' }, start).state;
    for (let i = 0; i < 5; i++) {
      state = applyAction(state, CASES, { caseId: c.id, kind: 'pause' }, start + i * 10 + 1).state;
      state = applyAction(state, CASES, { caseId: c.id, kind: 'resume' }, start + i * 10 + 2).state;
    }
    state = applyAction(state, CASES, { caseId: c.id, kind: 'start' }, start + 100).state;
    expect(state.encounters?.[c.id]?.pauseCount).toBe(5);
    expect(() => applyAction(state, CASES, { caseId: c.id, kind: 'pause' }, start + 101)).toThrow('Pause limit');
  });
  it('rejects direct access to Case 002 before Case 001 is solved', () => { expect(() => applyAction(emptySave, CASES, { caseId: 'CASE-002', kind: 'inspect', clueId: 'bolt-thread' }, start)).toThrow('locked'); });
  it('rejects starting a hunt without a deduction', () => { expect(() => applyAction(emptySave, CASES, { caseId: c.id, kind: 'start' }, start)).toThrow('evidence'); });
  it('does not accept an accusation without inspected and correctly sorted evidence', () => { expect(applyAction(emptySave, CASES, { caseId: c.id, kind: 'accuse', suspectId: c.culprit }, start).state.cases[c.id]?.deduced).not.toBe(true); });
  it('does not accept a wrong suspect even after correct sorting', () => { const state = deduced(); const progress = state.cases[c.id]; if (!progress) throw new Error('Missing progress'); progress.deduced = false; const result = applyAction(state, CASES, { caseId: c.id, kind: 'accuse', suspectId: 'vale' }, start); expect(result.state.cases[c.id]?.deduced).toBe(false); });
  it('limits hints to three and does not allow a negative balance', () => { let state: CloudSave = structuredClone(emptySave); for (let i=0;i<3;i++) state=applyAction(state, CASES, { caseId: c.id, kind: 'hint' }, start).state; expect(state.hints).toBe(0); expect(() => applyAction(state, CASES, { caseId: c.id, kind: 'hint' }, start)).toThrow('No hints'); });
  it('enforces the strike cooldown and requires a scan', () => { let state = applyAction(deduced(), CASES, { caseId: c.id, kind: 'start' }, start).state; state=applyAction(state, CASES, { caseId: c.id, kind: 'strike' }, start+1).state; expect(state.encounters?.[c.id]?.ghostHp).toBe(100); state=applyAction(state, CASES, { caseId: c.id, kind: 'scan' }, start+2).state; state=applyAction(state, CASES, { caseId: c.id, kind: 'strike' }, start+701).state; expect(state.encounters?.[c.id]?.ghostHp).toBe(85); state=applyAction(state, CASES, { caseId: c.id, kind: 'strike' }, start+702).state; expect(state.encounters?.[c.id]?.ghostHp).toBe(85); });
  it('awards Case 001 XP only once after validated combat', () => { let state=applyAction(deduced(), CASES, { caseId: c.id, kind: 'start' }, start).state; for (const t of [start+10,start+720,start+1430,start+2140,start+5020,start+5730,start+6440]) { if (t===start+10 || t===start+5020) state=applyAction(state, CASES, { caseId: c.id, kind: 'scan' }, t-1).state; state=applyAction(state, CASES, { caseId: c.id, kind: 'strike' }, t).state; } expect(state.cases[c.id]?.solved).toBe(true); expect(state.xp).toBe(200); expect(applyAction(state, CASES, { caseId: c.id, kind: 'strike' }, start+8000).state.xp).toBe(200); });
  it('applies ghost damage for time spent idle instead of trusting client health', () => { let state=applyAction(deduced(), CASES, { caseId: c.id, kind: 'start' }, start).state; state=applyAction(state, CASES, { caseId: c.id, kind: 'tick' }, start+32000).state; expect(state.encounters?.[c.id]?.hp).toBe(0); expect(state.encounters?.[c.id]?.phase).toBe('lost'); expect(state.xp).toBe(0); });
});