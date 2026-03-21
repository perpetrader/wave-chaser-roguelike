export type Difficulty = "beginner" | "easy" | "medium" | "hard" | "expert" | "impossible-3x3" | "impossible-4x4" | "locked-beginner" | "locked-easy" | "locked-medium" | "locked-hard" | "locked-expert" | "locked-impossible-3x3" | "locked-impossible-4x4";

export interface DifficultyConfig {
  rows: number;
  cols: number;
  label: string;
  description: string;
  canRemove: boolean;
  lockedCells?: number;
  hasTargetNumbers?: boolean;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  beginner: { rows: 2, cols: 2, label: "Beginner", description: "2×2 grid, 1-4", canRemove: true },
  easy: { rows: 3, cols: 3, label: "Easy", description: "3×3 grid, 1-9", canRemove: true },
  medium: { rows: 3, cols: 3, label: "Medium", description: "3×3 grid, 1-9", canRemove: true },
  hard: { rows: 3, cols: 3, label: "Hard", description: "3×3 grid, no removal", canRemove: false },
  expert: { rows: 4, cols: 4, label: "Expert", description: "4×4 grid, no removal", canRemove: false },
  "impossible-3x3": { rows: 3, cols: 3, label: "Impossible 3×3", description: "Match targets", canRemove: false, hasTargetNumbers: true },
  "impossible-4x4": { rows: 4, cols: 4, label: "Impossible 4×4", description: "Match targets", canRemove: false, hasTargetNumbers: true },
  "locked-beginner": { rows: 2, cols: 2, label: "Beginner", description: "1 locked cell", canRemove: true, lockedCells: 1 },
  "locked-easy": { rows: 3, cols: 3, label: "Easy", description: "3 locked cells", canRemove: true, lockedCells: 3 },
  "locked-medium": { rows: 3, cols: 3, label: "Medium", description: "3 locked cells", canRemove: true, lockedCells: 3 },
  "locked-hard": { rows: 3, cols: 3, label: "Hard", description: "3 locked cells", canRemove: false, lockedCells: 3 },
  "locked-expert": { rows: 4, cols: 4, label: "Expert", description: "6 locked cells", canRemove: false, lockedCells: 6 },
  "locked-impossible-3x3": { rows: 3, cols: 3, label: "Impossible 3×3", description: "Match targets", canRemove: false, lockedCells: 3, hasTargetNumbers: true },
  "locked-impossible-4x4": { rows: 4, cols: 4, label: "Impossible 4×4", description: "Match targets", canRemove: false, lockedCells: 6, hasTargetNumbers: true },
};

export interface Friend {
  id: string;
  name: string;
  image: string;
  basePower: number;
  ability: string;
  abilityDescription: string;
}

export interface PlacedFriend {
  friend: Friend;
  currentPower: number;
  locked?: boolean;
}

export type GridCell = PlacedFriend | null;

export interface Superpower {
  id: string;
  name: string;
  image: string;
  description: string;
  cooldown: number;
  oneTimeUse?: boolean;
}

export const SUPERPOWERS: Superpower[] = [
  {
    id: "recharge",
    name: "Recharge",
    image: "/assets/novadoku/recharge.png",
    description: "Give any Friend +1, +2, or +3 [POWER]",
    cooldown: 3,
  },
  {
    id: "double-a",
    name: "Double A",
    image: "/assets/novadoku/double-a.png",
    description: "Double any Friend's [POWER]",
    cooldown: 0,
    oneTimeUse: true,
  },
];

export const FRIENDS: Friend[] = [
  {
    id: "spike",
    name: "Spike",
    image: "/characters/spike.png",
    basePower: 1,
    ability: "growth",
    abilityDescription: "+1 [POWER] whenever another Friend is played",
  },
  {
    id: "overheater",
    name: "Overheater",
    image: "/characters/overheater.png",
    basePower: 3,
    ability: "cap",
    abilityDescription: "Whenever [POWER] is above 4 - pick a Friend to give the extra [POWER] to",
  },
  {
    id: "flash",
    name: "Flash",
    image: "/characters/flash.png",
    basePower: 3,
    ability: "self-boost",
    abilityDescription: "Gives itself +1, +2, or +3 [POWER].\n2-move cooldown.",
  },
  {
    id: "dc",
    name: "DC",
    image: "/characters/dc.png",
    basePower: 1,
    ability: "none",
    abilityDescription: "No special ability",
  },
  {
    id: "fil",
    name: "Fil",
    image: "/characters/fil.png",
    basePower: 2,
    ability: "boost-right",
    abilityDescription: "Gives +1 or +2 [POWER] to the Friend to its right",
  },
  {
    id: "volata",
    name: "Volata",
    image: "/characters/volata.png",
    basePower: 2,
    ability: "pick-superpower-boost",
    abilityDescription: "When you play a superpower, pick any Friend to give +2 [POWER]",
  },
  {
    id: "charger",
    name: "Ray",
    image: "/characters/charger.png",
    basePower: 4,
    ability: "adjacent-boost",
    abilityDescription: "Gives Friends directly above, below, and next to it +1 [POWER]",
  },
  {
    id: "mopheous",
    name: "Mopheous",
    image: "/characters/mopheous.png",
    basePower: 1,
    ability: "mentor",
    abilityDescription: "Gives the next Friend played +1, +2, or +3 [POWER].\n2-move cooldown.",
  },
  {
    id: "sizzle",
    name: "Sizzle",
    image: "/characters/sizzle.png",
    basePower: 4,
    ability: "drain",
    abilityDescription: "Steal 1 [POWER] from a Friend in the same row or column",
  },
  {
    id: "jazzy",
    name: "Jazzy",
    image: "/characters/jazzy.png",
    basePower: 1,
    ability: "cooldown-reduce",
    abilityDescription: "Reduce Superpower cooldown by 2 instead of 1.\n2-move cooldown.",
  },
  {
    id: "dynamo",
    name: "Dynamo",
    image: "/characters/dynamo.png",
    basePower: 3,
    ability: "side-boost",
    abilityDescription: "Gives Friends next to it +1 [POWER]",
  },
];
