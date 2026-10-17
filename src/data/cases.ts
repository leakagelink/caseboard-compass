import { case001 } from "./case001";
import type { Clue } from "./case001";

export { GAME_TITLE } from "./case001";
export type { Clue };

export type CaseStatus = "published" | "draft";

export type GameCase = {
  id: string;
  slug: string;
  order: number;
  title: string;
  difficulty: string;
  status: CaseStatus;
  location: string;
  date: string;
  summary: string;
  ghost: {
    name: string;
    trueName: string;
    temperament: string;
    abilities: string[];
    hp: number;
    power: number;
    attackEvery: number;
    mode: "banish" | "release";
  };
  timeline: { time: string; event: string }[];
  objectives: string[];
  clues: Clue[];
  suspects: { id: string; name: string; role: string }[];
  culprit: string;
  deductionQuestion: string;
  reveal: string;
  rewardXp: number;
};

export const CASES: GameCase[] = [
  {
    ...case001,
    slug: "001",
    order: 1,
    status: "published",
    deductionQuestion: "Who took the Obsidian Reliquary?",
    ghost: { ...case001.ghost, hp: 100, power: 12, attackEvery: 3200, mode: "banish" },
    rewardXp: 150,
  },
  {
    id: "CASE-002",
    slug: "002",
    order: 2,
    title: "The Locked Room",
    difficulty: "Agent",
    status: "published",
    location: "Ashcombe Hotel, Room 404 (fictional)",
    date: "Morning of 2 February, 1994",
    summary:
      "Lena Corvo, a jewel thief under police watch, was found dead in Room 404 — door bolted from the inside, window painted shut. Three witnesses tell three different stories. Her ghost now writes the same word on every mirror: LIAR.",
    ghost: {
      name: "The Mirror Widow",
      trueName: "Lena Corvo",
      temperament: "Silent, calculating, only speaks through reflections",
      abilities: ["Reflection — splits into decoy images", "Frost Glass — slows your scanner", "Whisper — reveals a lie"],
      hp: 130,
      power: 15,
      attackEvery: 2800,
      mode: "release",
    },
    timeline: [
      { time: "22:10", event: "Lena checks in under a false name. Pays in cash." },
      { time: "01:30", event: "Night porter hears an argument through the wall." },
      { time: "03:00", event: "Hotel manager claims he was asleep in his office." },
      { time: "07:45", event: "Maid forces the door. The bolt is drawn. Lena is dead." },
    ],
    objectives: [
      "Review every witness statement and object",
      "Find who manipulated the locked-room evidence",
      "Release the Mirror Widow by exposing the truth",
    ],
    clues: [
      { id: "bolt-thread", name: "Fishing Line on the Bolt", location: "Door frame", description: "A thin nylon thread caught in the hinge.", inspection: "The bolt was pulled shut from the hallway with a line under the door. The room was never truly locked.", relevant: true },
      { id: "master-key", name: "Master Key Ledger", location: "Front desk", description: "Sign-out sheet for the master key.", inspection: "The manager's initials at 02:50 — ten minutes before he says he fell asleep.", relevant: true },
      { id: "porter-account", name: "Porter's Statement", location: "Interview notes", description: "Claims he heard two men arguing.", inspection: "The wall he names backs onto Room 403, not 404. Honest mistake, wrong room.", relevant: false },
      { id: "lipstick", name: "Lipstick on Mirror", location: "Bathroom", description: "The word 'LIAR' written in red.", inspection: "The shade matches the manager's wife's brand — but she was abroad. It was planted to frame her.", relevant: true },
      { id: "poison-vial", name: "Empty Vial", location: "Bedside table", description: "Unlabelled glass vial.", inspection: "Contains only Lena's sleeping drops. Lab confirms it did not kill her.", relevant: false },
    ],
    suspects: [
      { id: "manager", name: "Gregor Hale", role: "Hotel manager" },
      { id: "porter", name: "Tomas Reyes", role: "Night porter" },
      { id: "maid", name: "Ada Finch", role: "Housekeeper" },
    ],
    culprit: "manager",
    deductionQuestion: "Who staged the locked room?",
    reveal:
      "Gregor Hale fenced stolen jewels through his hotel. When Lena threatened to talk, he killed her, bolted the door from outside with a fishing line, and wrote 'LIAR' to frame his wife. Lena's ghost never wanted revenge — only for someone to finally see through the lie. Exposed, she fades from the glass.",
    rewardXp: 220,
  },
  {
    id: "CASE-003",
    slug: "003",
    order: 3,
    title: "The Last Escape",
    difficulty: "Veteran",
    status: "published",
    location: "Greyhaven Lighthouse & Vault (fictional)",
    date: "Storm of 30 September, 2003",
    summary:
      "Master thief August Kell vanished during his final job — the Greyhaven sea vault. The Crown Sapphire went with him. Fishermen say a drowned man in a diver's helmet now stalks the lighthouse, and the lamp burns red on stormy nights.",
    ghost: {
      name: "The Drowned Warden",
      trueName: "August Kell",
      temperament: "Proud, territorial, tests anyone who climbs the tower",
      abilities: ["Tide Surge — heavy wave attack", "Lamp Flash — blinds the scanner", "Undertow — regains health once"],
      hp: 180,
      power: 20,
      attackEvery: 2400,
      mode: "banish",
    },
    timeline: [
      { time: "19:00", event: "Storm warning issued. Harbour closes." },
      { time: "21:15", event: "Vault alarm trips, then resets itself." },
      { time: "21:40", event: "Lighthouse keeper's radio log goes silent for 40 minutes." },
      { time: "23:30", event: "Kell's boat found drifting, empty. No sapphire." },
      { time: "Next day", event: "Keeper resigns and moves inland." },
    ],
    objectives: [
      "Reconstruct Kell's escape route",
      "Find where the Crown Sapphire is hidden",
      "Survive the Drowned Warden's final trial",
    ],
    clues: [
      { id: "radio-log", name: "Silent Radio Log", location: "Lamp room", description: "40-minute gap at 21:40.", inspection: "The keeper switched off the radio himself. The switch is wiped clean of prints.", relevant: true },
      { id: "diving-helmet", name: "Dented Diving Helmet", location: "Shoreline rocks", description: "Brass helmet, glass cracked.", inspection: "Struck from behind with a heavy wrench — the same model kept in the lighthouse.", relevant: true },
      { id: "tide-chart", name: "Annotated Tide Chart", location: "Kell's boat", description: "Low tide circled at 21:30.", inspection: "Kell planned to walk the exposed sandbar to the lighthouse. His partner was waiting there.", relevant: true },
      { id: "gull-feathers", name: "Bloodied Gull Feathers", location: "Gallery railing", description: "Red-stained feathers.", inspection: "A storm-killed gull. Nothing more.", relevant: false },
      { id: "lamp-lens", name: "Loose Lamp Lens Panel", location: "Lantern", description: "One panel unscrewed.", inspection: "Behind it, a hollow cavity shaped like a large gemstone — empty now, recently.", relevant: true },
    ],
    suspects: [
      { id: "keeper", name: "Morris Quill", role: "Lighthouse keeper" },
      { id: "guard", name: "Hana Ost", role: "Vault guard" },
      { id: "fisher", name: "Old Bram", role: "Fisherman who found the boat" },
    ],
    culprit: "keeper",
    deductionQuestion: "Who betrayed August Kell?",
    reveal:
      "Morris Quill was Kell's inside man. When Kell crossed the sandbar with the sapphire, Quill struck him down, hid the stone behind the lamp lens, and let the tide take the body. The red light on stormy nights is Kell, still guarding the hiding place. Defeated at last, he points seaward — to where Quill buried the stone before fleeing inland.",
    rewardXp: 320,
  },
];
