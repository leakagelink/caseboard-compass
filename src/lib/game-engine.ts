import type { GameCase } from '@/data/cases';
import { completeCase, emptyCase, isUnlocked, type Save, type Verdict } from './game';

export type Encounter = { hp: number; ghostHp: number; phase: 'fight' | 'paused' | 'won' | 'lost'; lastAttack: number; scanAt: number; strikeAt: number; dodgeAt: number; revealedUntil: number; dodgeUntil: number; healed: boolean; log: string; pausedAt?: number; pauseCount?: number };
export type RequestReceipt = { requestId: string; fingerprint: string; revision: number; message?: string };
export type CloudSave = Save & { encounters?: Record<string, Encounter>; locationCases?: GameCase[]; selectedArea?: string; receipts?: RequestReceipt[]; nativeRate?: { windowAt: number; count: number } };
export type GameAction = { caseId: string; kind: 'inspect' | 'judge' | 'accuse' | 'hint' | 'start' | 'tick' | 'scan' | 'strike' | 'dodge' | 'pause' | 'resume'; clueId?: string | undefined; verdict?: Verdict | undefined; suspectId?: string | undefined };
export function applyAction(state: CloudSave, cases: GameCase[], action: GameAction, now: number): { state: CloudSave; message?: string } {
  const c = cases.find(x => x.id === action.caseId);
  if (!c || !isUnlocked(cases, state, c)) throw new Error('This case is locked or unpublished.');
  const s: CloudSave = structuredClone(state);
  const p = s.cases[c.id] ?? structuredClone(emptyCase);
  s.cases[c.id] = p;
  const clue = c.clues.find(x => x.id === action.clueId);
  if (action.kind === 'inspect') {
    if (!clue) throw new Error('Unknown clue.');
    if (!p.inspected.includes(clue.id)) p.inspected.push(clue.id);
  } else if (action.kind === 'judge') {
    if (!clue || !p.inspected.includes(clue.id) || !action.verdict) throw new Error('Inspect this clue first.');
    p.verdicts[clue.id] = action.verdict;
  } else if (action.kind === 'accuse') {
    const ready = c.clues.every(x => p.inspected.includes(x.id) && (p.verdicts[x.id] === (x.relevant ? 'relevant' : 'misleading')));
    if (!ready) return { state: s, message: 'Re-examine your evidence sorting.' };
    p.attempts = (p.attempts ?? 0) + 1;
    if (action.suspectId !== c.culprit) return { state: s, message: "That's not who the evidence points to." };
    p.accused = action.suspectId; p.deduced = true;
  } else if (action.kind === 'hint') {
    if (s.hints <= 0) throw new Error('No hints left.');
    s.hints -= 1;
    const bad = c.clues.find(x => p.verdicts[x.id] && p.verdicts[x.id] !== (x.relevant ? 'relevant' : 'misleading'));
    return { state: s, message: bad ? `Look again at "${bad.name}".` : `"${c.clues.find(x => !x.relevant)?.name}" is not what it seems.` };
  } else {
    if (!p.deduced) throw new Error('Finish the evidence board first.');
    s.encounters ??= {};
    const current = s.encounters[c.id];
    if (current?.phase === 'paused' && current.pausedAt !== undefined && now - current.pausedAt > 900000) {
      current.phase = 'lost'; current.log = 'Pause expired. Start a new encounter.'; delete current.pausedAt;
    }
    if (action.kind === 'start') {
      // Reopening an active encounter must never restore health or cooldowns.
      if (current?.phase === 'fight' || current?.phase === 'paused') return { state: s };
      s.encounters[c.id] = { hp: 100, ghostHp: c.ghost.hp, phase: 'fight', lastAttack: now, scanAt: 0, strikeAt: 0, dodgeAt: 0, revealedUntil: 0, dodgeUntil: 0, healed: false, log: 'Sweep the area with your scanner.' };
      return { state: s };
    }
    const e = s.encounters[c.id];
    if (!e) throw new Error('Start the encounter first.');
    if (e.phase === 'paused') {
      if (action.kind === 'resume' && e.pausedAt !== undefined) {
        const elapsed = Math.max(0, now - e.pausedAt);
        e.lastAttack += elapsed;
        for (const key of ['scanAt', 'strikeAt', 'dodgeAt', 'revealedUntil', 'dodgeUntil'] as const) if (e[key] > 0) e[key] += elapsed;
        delete e.pausedAt; e.phase = 'fight'; e.log = 'Encounter resumed.';
      }
      return { state: s };
    }
    if (e.phase !== 'fight') return { state: s };
    if (action.kind === 'resume') return { state: s };
    const ticks = Math.floor((now - e.lastAttack) / c.ghost.attackEvery);
    for (let i = 0; i < ticks && e.hp > 0; i++) {
      e.lastAttack += c.ghost.attackEvery;
      if (e.lastAttack <= e.dodgeUntil && e.lastAttack >= e.dodgeAt) e.log = 'Dodged!';
      else { e.hp = Math.max(0, e.hp - c.ghost.power); e.log = `${c.ghost.name} strikes! −${c.ghost.power}`; }
    }
    if (e.hp <= 0) { e.phase = 'lost'; return { state: s }; }
    if (action.kind === 'pause') {
      if ((e.pauseCount ?? 0) >= 5) throw new Error('Pause limit reached. Finish or restart after defeat.');
      e.pauseCount = (e.pauseCount ?? 0) + 1; e.pausedAt = now; e.phase = 'paused'; e.log = 'Encounter paused.';
      return { state: s };
    }
    if (action.kind === 'scan' && now - e.scanAt >= 5000) { e.scanAt = now; e.revealedUntil = now + 3000; e.log = 'Entity revealed! Strike now.'; }
    if (action.kind === 'dodge' && now - e.dodgeAt >= 4000) { e.dodgeAt = now; e.dodgeUntil = now + 1200; e.log = 'Evading…'; }
    if (action.kind === 'strike' && now - e.strikeAt >= 700) {
      e.strikeAt = now;
      if (now >= e.revealedUntil) e.log = 'Scan first — the entity is hidden.';
      else {
        const damage = c.ghost.mode === 'release' ? 18 : 15;
        e.ghostHp = Math.max(0, e.ghostHp - damage); e.log = `Direct hit! −${damage}`;
        if (c.id === 'CASE-003' && !e.healed && e.ghostHp > 0 && e.ghostHp < c.ghost.hp * 0.3) { e.healed = true; e.ghostHp += 40; e.log = 'Undertow! The Warden regains strength.'; }
        if (e.ghostHp === 0) { e.phase = 'won'; return { state: { ...completeCase(s, c, e.hp >= 70), encounters: s.encounters } }; }
      }
    }
  }
  return { state: s };
}