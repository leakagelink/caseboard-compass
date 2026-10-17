export type Clue = {
  id: string;
  name: string;
  location: string;
  description: string;
  inspection: string;
  relevant: boolean;
};

export const GAME_TITLE = "CASE ZERO: Ghost Detective";

export const case001 = {
  id: "CASE-001",
  title: "The Midnight Heist",
  difficulty: "Initiate",
  status: "Open",
  location: "Halloway Museum of Antiquities (fictional)",
  date: "Night of 13 November, 1987",
  summary:
    "Silas Wren, a gentleman burglar known for never leaving a trace, was found dead inside the museum's sealed east gallery. The Obsidian Reliquary he came to steal was never recovered. Night guards now report a figure in a long coat walking the gallery at 00:00, sharp.",
  ghost: {
    name: "The Clockwork Gentleman",
    trueName: "Silas Wren",
    temperament: "Polite, theatrical, furious when lied to",
    abilities: ["Time Skip — vanishes for 3 seconds", "Chime Burst — area pulse at each 'hour'", "Pickpocket — steals one held item"],
  },
  timeline: [
    { time: "23:40", event: "East gallery motion sensors disabled from the inside." },
    { time: "23:52", event: "Guard Edwin Marsh logs a 'routine' patrol. Signature is shaky." },
    { time: "00:00", event: "Every clock in the museum stops at once." },
    { time: "00:14", event: "Wren found dead beneath the reliquary pedestal. Case empty." },
  ],
  objectives: [
    "Inspect every item on the evidence board",
    "Separate genuine evidence from misleading clues",
    "Name who took the Obsidian Reliquary",
  ],
  clues: [
    {
      id: "pocket-watch",
      name: "Stopped Pocket Watch",
      location: "Wren's waistcoat",
      description: "Brass watch, hands frozen at 23:58.",
      inspection: "The watch stopped two minutes before every museum clock. Wren was already dead before midnight — someone staged the 'curse'.",
      relevant: true,
    },
    {
      id: "guard-log",
      name: "Guard Patrol Log",
      location: "Security desk",
      description: "Edwin Marsh's entry for 23:52.",
      inspection: "The ink is fresh over an erased line. The original entry read: 'East gallery — door left open for W.'",
      relevant: true,
    },
    {
      id: "velvet-glove",
      name: "Velvet Glove, Left Hand",
      location: "Under the pedestal",
      description: "Grey velvet, museum-issue.",
      inspection: "Staff glove, size XL. Wren's hands were small and he always wore black leather. Faint reliquary dust in the seams.",
      relevant: true,
    },
    {
      id: "tarot-card",
      name: "Tarot Card — The Tower",
      location: "Gallery floor",
      description: "Left near the body.",
      inspection: "Printed by the museum gift shop last week. Dozens of visitors carry these. A distraction.",
      relevant: false,
    },
    {
      id: "muddy-boots",
      name: "Muddy Bootprints",
      location: "Service corridor",
      description: "Trail leading to the loading bay.",
      inspection: "Rain didn't start until 02:00. These prints were left by the morning delivery crew.",
      relevant: false,
    },
  ] as Clue[],
  suspects: [
    { id: "marsh", name: "Edwin Marsh", role: "Night guard" },
    { id: "vale", name: "Dr. Iris Vale", role: "Curator" },
    { id: "wren-partner", name: "Nico Strand", role: "Wren's former partner" },
  ],
  culprit: "marsh",
  reveal:
    "Edwin Marsh agreed to leave the door open for Wren in exchange for a cut. At 23:58 he struck Wren, took the Reliquary, stopped the clocks to sell a ghost story, and rewrote his log. Silas Wren haunts the gallery because the one man he trusted robbed the robber.",
};
