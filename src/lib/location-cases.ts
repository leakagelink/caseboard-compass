import type { GameCase } from '@/data/cases';

export type AreaAssignment = { area: string; caseIds: string[] };
export function locationArea(latitude: number, longitude: number): string {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) throw new Error('Invalid location.');
  return `${Math.floor(latitude * 100)}:${Math.floor(longitude * 100)}`;
}

export function makeLocationCases(area: string): GameCase[] {
  let seed = 2166136261;
  for (const char of area) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  const identity = seed.toString(36).toUpperCase();
  const names = ['Ravi', 'Mira', 'Kabir', 'Nisha', 'Arjun', 'Tara'];
  const plots = [
    { title: 'The Vanishing Courier', theft: 'a sealed collection of antique coins', escape: 'replaced delivery receipts and escaped under a courier alias', death: 'was betrayed by the accomplice who sealed the hideout during a fire', trace: 'burned delivery receipts', ghost: 'The Ash Courier' },
    { title: 'The Silent Watchmaker', theft: 'a jewelled mechanical watch', escape: 'altered the timestamps on a security recording and left through a service passage', death: 'was locked inside the abandoned workshop by the fence who wanted the watch', trace: 'a recording with mismatched clock times', ghost: 'The Broken Hour' },
    { title: 'The Last Lantern', theft: 'a merchant’s emerald necklace', escape: 'sent a decoy carrying an empty jewellery box while hiding the real necklace', death: 'fell into a concealed shaft after the accomplice removed its cover', trace: 'an empty box and a torn lantern strap', ghost: 'The Lantern Thief' },
  ];
  return plots.map((plot, index) => {
    const name = `${names[(seed + index) % names.length]} ${identity}-${index + 1}`;
    const id = `LOC-${identity}-${index + 1}`;
    return {
      id, slug: id.toLowerCase(), campaign: `area:${area}`, order: index + 1,
      title: plot.title, difficulty: index === 0 ? 'Rookie' : index === 1 ? 'Agent' : 'Veteran', status: 'published',
      location: `Your selected area · ${identity} (fictional case)`, date: 'An undated fictional cold case',
      summary: `A thief vanished after stealing ${plot.theft}. Witness statements conflict, and ${plot.ghost} guards the missing evidence. Investigate this fictional case assigned to your selected area.`,
      ghost: { name: plot.ghost, trueName: name, temperament: 'Guards the secret of a betrayal', abilities: ['Veil — hides from the scanner', 'Echo — strikes when ignored'], hp: 100 + index * 20, power: 12 + index * 2, attackEvery: 3200, mode: 'banish' },
      timeline: [{ time: 'Before midnight', event: `The theft of ${plot.theft} is reported.` }, { time: 'Midnight', event: 'An accomplice is seen leaving the hideout.' }, { time: 'Dawn', event: 'The thief has vanished; evidence is missing.' }],
      objectives: ['Inspect and sort the evidence', 'Identify who betrayed the thief', 'Confront the ghost and uncover its story'],
      clues: [
        { id: `${id}-trace`, name: 'The altered evidence', location: 'Case file', description: `Investigators recovered ${plot.trace}.`, inspection: 'The evidence was deliberately altered to hide the escape route.', relevant: true },
        { id: `${id}-ledger`, name: 'Accomplice’s ledger', location: 'Case file', description: 'A ledger records a secret payment.', inspection: 'The accomplice received payment to betray the thief and keep the stolen object.', relevant: true },
        { id: `${id}-witness`, name: 'Dawn witness statement', location: 'Case file', description: 'A witness heard the hideout being closed.', inspection: 'The accomplice was the last person to leave; the thief never emerged.', relevant: true },
        { id: `${id}-rumour`, name: 'Market rumour', location: 'Case file', description: 'A passer-by claims the thief left town.', inspection: 'The rumour is hearsay from a different date; it cannot establish an escape.', relevant: false },
      ],
      suspects: [{ id: 'accomplice', name: 'The accomplice', role: 'Inside partner' }, { id: 'witness', name: 'The dawn witness', role: 'Passer-by' }, { id: 'merchant', name: 'The merchant', role: 'Owner of the stolen object' }],
      culprit: 'accomplice', deductionQuestion: 'Who betrayed the vanished thief?',
      reveal: `${name} was the thief behind the theft of ${plot.theft}. The police failed to catch them because they ${plot.escape}. They never reached freedom: the thief ${plot.death}. The accomplice concealed the death and kept the stolen object, leaving the disappearance unsolved. The ghost remained bound to that betrayal. Your investigation exposed the accomplice, and your victory finally ended the haunting. This story and all its characters are fictional; it is not a claim about a real crime at your location.`,
      rewardXp: 150 + index * 50,
    };
  });
}