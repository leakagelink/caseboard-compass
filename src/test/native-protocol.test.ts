import { describe, expect, it } from 'vitest';
import { CASES } from '@/data/cases';
import { emptySave } from '@/lib/game';
import { checkRequest, nativeProgress, recordRequest } from '@/lib/native-protocol';
import { actionSchema, areaSchema, nativeEnvelope } from '@/lib/game-input';
import type { CloudSave } from '@/lib/game-engine';

const key = { requestId: '12345678-1234-4234-8234-123456789000', fingerprint: 'first', expectedRevision: 0 };
describe('native request contract', () => {
  it('replays identical requests even with a now-stale revision', () => {
    const state = recordRequest(emptySave, 1, key, 10000);
    expect(checkRequest(state, 1, key)?.revision).toBe(1);
    expect(state.receipts).toHaveLength(1);
  });
  it('rejects changing the payload under an existing request ID', () => {
    const state = recordRequest(emptySave, 1, key, 10000);
    expect(() => checkRequest(state, 1, { ...key, fingerprint: 'different' })).toThrow('another action');
  });
  it('rejects stale new requests and retries whose receipt was evicted', () => {
    let state: CloudSave = structuredClone(emptySave);
    for (let i = 0; i < 129; i++) state = recordRequest(state, i + 1, { ...key, requestId: `request-${i}` }, 10000 + i * 60000);
    expect(state.receipts).toHaveLength(128);
    expect(() => checkRequest(state, 129, { ...key, requestId: 'request-0' })).toThrow('Progress changed');
  });
  it('limits committed native mutations to 120 per minute', () => {
    let state: CloudSave = structuredClone(emptySave);
    for (let i = 0; i < 120; i++) state = recordRequest(state, i + 1, { ...key, requestId: `request-${i}` }, 10000);
    expect(() => recordRequest(state, 121, key, 10001)).toThrow('Too many actions');
    expect(recordRequest(state, 121, key, 70000).nativeRate?.count).toBe(1);
  });
  it('never returns solutions, hidden identity, raw snapshots or receipts before solve', () => {
    const data = nativeProgress(emptySave, 0, CASES);
    expect(data.cases.length).toBe(3);
    for (const c of data.cases) {
      expect(c).not.toHaveProperty('culprit'); expect(c).not.toHaveProperty('reveal');
      expect(c.ghost).not.toHaveProperty('trueName');
      for (const clue of c.clues) { expect(clue).not.toHaveProperty('relevant'); expect(clue).not.toHaveProperty('inspection'); }
    }
    expect(data).not.toHaveProperty('receipts'); expect(data).not.toHaveProperty('locationCases');
  });
  it('returns a completed story only for a server-solved case', () => {
    const c = CASES[0]; if (!c) throw new Error('Missing case');
    const data = nativeProgress({ ...emptySave, cases: { [c.id]: { inspected: [], verdicts: {}, solved: true } } }, 1, CASES);
    expect(data.cases[0]?.reveal).toBe(c.reveal);
    expect(data.cases[0]?.ghost.trueName).toBe(c.ghost.trueName);
    expect(data.cases[1]).not.toHaveProperty('reveal');
  });
  it('validates bounded action fields and canonical area keys', () => {
    expect(actionSchema.safeParse({ caseId: 'CASE-001', kind: 'strike', hp: 999 }).success).toBe(false);
    expect(actionSchema.safeParse({ caseId: 'CASE-001', kind: 'inspect' }).success).toBe(false);
    expect(nativeEnvelope.safeParse({ requestId: 'bad', expectedRevision: -1 }).success).toBe(false);
    expect(areaSchema.parse({ area: '02257:08836' }).area).toBe('2257:8836');
    expect(areaSchema.safeParse({ area: '9999:0' }).success).toBe(false);
  });
});