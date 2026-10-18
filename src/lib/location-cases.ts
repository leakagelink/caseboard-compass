import type { GameCase } from '@/data/cases';
import { LOCATION_PLOTS } from '@/data/location-plots';

export type AreaAssignment = { area: string; caseIds: string[] };
export function locationArea(latitude: number, longitude: number): string {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) throw new Error('Invalid location.');
  return `${Math.floor(latitude * 100)}:${Math.floor(longitude * 100)}`;
}

export function makeLocationCases(area: string): GameCase[] {
  let seed = 2166136261;
  for (const char of area) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  const [lat, lng] = area.split(':').map(Number);
  if (lat === undefined || lng === undefined || !Number.isInteger(lat) || !Number.isInteger(lng) || lat < -9000 || lat > 9000 || lng < -18000 || lng > 18000) throw new Error('Invalid area.');
  // Collision-free geographic identity; old campaigns retain their stored IDs.
  const identity = `A${(lat + 9000).toString(36).padStart(3, '0')}${(lng + 18000).toString(36).padStart(3, '0')}`.toUpperCase();
  const names = ['Ravi', 'Mira', 'Kabir', 'Nisha', 'Arjun', 'Tara', 'Dev', 'Leela', 'Ishan', 'Sana', 'Neel', 'Asha'];
  const surnames = ['Sen', 'Rao', 'Das', 'Mehta', 'Roy', 'Shah', 'Bose', 'Seth'];
  const plots = [0, 1, 2].map(index => LOCATION_PLOTS[(seed + index * 5) % LOCATION_PLOTS.length]);
  return plots.map((plot, index) => {
    if (!plot) throw new Error('Missing case story.');
    const name = `${names[(seed + index * 3) % names.length]} ${surnames[(Math.floor(seed / 12) + index) % surnames.length]} · ${identity}-${index + 1}`;
    const id = `LOC-${identity}-${index + 1}`;
    return {
      id, slug: id.toLowerCase(), campaign: `area:${area}`, order: index + 1,
      title: plot.title, difficulty: index === 0 ? 'Rookie' : index === 1 ? 'Agent' : 'Veteran', status: 'published',
      location: `Your selected area · ${identity} (fictional case)`, date: 'An undated fictional cold case',
      summary: `A thief vanished after stealing ${plot.theft}. Witness statements conflict, and ${plot.ghost} guards the missing evidence. Investigate this fictional case assigned to your selected area.`,
      ghost: { name: plot.ghost, trueName: name, temperament: 'Guards the secret of a betrayal', abilities: ['Veil — hides from the scanner', 'Echo — strikes when ignored'], hp: 100 + index * 20, power: 12 + index * 2, attackEvery: 3200, mode: 'banish' },
      timeline: [{ time: 'Before midnight', event: `The theft of ${plot.theft} is reported.` }, { time: 'Midnight', event: 'A false escape trail misdirects the search.' }, { time: 'Dawn', event: 'The thief has vanished; evidence is missing.' }],
      objectives: ['Inspect and sort the evidence', 'Identify who betrayed the thief', 'Confront the ghost and uncover its story'],
      clues: [
        { id: `${id}-trace`, name: plot.trace, location: 'Case file', description: 'An overlooked object survives in the cold-case archive.', inspection: plot.traceDetail, relevant: true },
        { id: `${id}-ledger`, name: 'The hidden record', location: 'Case file', description: 'An entry contradicts a suspect’s account.', inspection: plot.proof, relevant: true },
        { id: `${id}-witness`, name: 'Dawn witness statement', location: 'Case file', description: 'A witness recalls the last movements that night.', inspection: plot.witness, relevant: true },
        { id: `${id}-rumour`, name: 'Market rumour', location: 'Case file', description: 'A passer-by claims the thief left town.', inspection: 'The rumour is hearsay from a different date; it cannot establish an escape.', relevant: false },
      ],
      suspects: [{ id: 'partner', name: 'The partner', role: 'Inside partner' }, { id: 'fence', name: 'The fence', role: 'Secret buyer’s agent' }, { id: 'keeper', name: 'The keeper', role: 'Custodian of the site' }],
      culprit: plot.culprit, deductionQuestion: 'Who betrayed the vanished thief?',
      reveal: `${name} was the thief behind the theft of ${plot.theft}. The police failed to catch them because they ${plot.escape}. They never reached freedom: the thief ${plot.death}. The ${plot.culprit} concealed the death and kept the stolen object, leaving the disappearance unsolved. The ghost remained bound to that betrayal. Your investigation exposed the ${plot.culprit}, and your victory finally ended the haunting. This story and all its characters are fictional; it is not a claim about a real crime at your location.`,
      rewardXp: 150 + index * 50,
    };
  });
}