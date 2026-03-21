// ─── Game State Machine ─────────────────────────────────────────────────────

export type GameState =
  | "menu"
  | "roguelikeMenu"
  | "confirmLoadout"
  | "selectAbilities"
  | "playing"
  | "gameOver"
  | "levelComplete"
  | "roguelikeGameOver"
  | "selectBeach"
  | "slayMenu"
  | "slayMap"
  | "slayShop"
  | "slayRest"
  | "slayEvent"
  | "slayCardReward"
  | "slayBeachPreview"
  | "bossQuickRunDraft"
  | "bossQuickRunLevelComplete"
  | "bossQuickRunVictory";

export type GameOverReason = "timer" | "missed" | null;

// ─── Run & Mode Types ───────────────────────────────────────────────────────

export type RunType =
  | "roguelike"
  | "beachBonanza"
  | "slayTheWaves"
  | "bossQuickRun"
  | "bossHellRun";

export type MovementMode = "standard" | "slowerForward" | "momentum";

// ─── Player Types ───────────────────────────────────────────────────────────

export type FootType = "tourist" | "beachBum" | "speedster" | "toeWarrior";
export type ToeTapMode = "manual" | "auto";

export interface FootTypeModifiers {
  speedMultiplier: number;
  drainMultiplier: number;
}

// ─── Wave Types ─────────────────────────────────────────────────────────────

export type WavePhase = "incoming" | "peak" | "outgoing";

export interface Wave {
  id: number;
  row: number;           // Current row position (0-42)
  startRow: number;      // Spawn row in ocean (20-22)
  maxReach: number;      // Peak row on beach (30-40)
  phase: WavePhase;
  touched: boolean;
  peakTimer: number;     // Time spent at peak (ms)
  magnetAffected?: boolean;
}

// ─── Ability Types ──────────────────────────────────────────────────────────

export type AbilityType =
  | "wetsuit"
  | "superTap"
  | "ghostToe"
  | "crystalBall"
  | "slowdown"
  | "waveMagnet"
  | "waveSurfer"
  | "towelOff"
  | "doubleDip"
  | "jumpAround";

export const ALL_ABILITY_TYPES: AbilityType[] = [
  "wetsuit", "superTap", "ghostToe", "crystalBall", "slowdown",
  "waveMagnet", "waveSurfer", "towelOff", "doubleDip", "jumpAround",
];

export interface AbilityState {
  active: boolean;
  cooldownRemaining: number;
  durationRemaining: number;
  usesRemaining?: number;
  waterExposure?: number;  // Wetsuit: tracks time in water while active
  waterLimit?: number;     // Wetsuit: max water time allowed
}

export interface UnlockedAbility {
  type: AbilityType;
  upgradeCount: number;
}

// ─── Beach Effect Types ─────────────────────────────────────────────────────

export type BeachEffectType =
  | "quicksand"
  | "spikeWaves"
  | "gummyBeach"
  | "coldWater"
  | "crazyWaves"
  | "fishNet"
  | "nighttime"
  | "roughWaters"
  | "heavySand"
  | "busyBeach";

export interface BeachEffectInfo {
  type: BeachEffectType;
  name: string;
  description: string;
}

export interface BeachPerson {
  row: number;
  col: number;
  direction: "left" | "right";
  speed: number;
}

// ─── Permanent Upgrades ─────────────────────────────────────────────────────

export type PermanentUpgradeType = "fastFeet" | "tapDancer" | "wetShoes";

export interface PermanentUpgrades {
  fastFeet: number;
  tapDancer: number;
  wetShoes: number;
}

export const DEFAULT_PERMANENT_UPGRADES: PermanentUpgrades = {
  fastFeet: 0,
  tapDancer: 0,
  wetShoes: 0,
};

// ─── Difficulty ─────────────────────────────────────────────────────────────

export type WavesDifficulty = "beginner" | "easy" | "medium" | "hard" | "expert" | "roguelike";

export interface DifficultySettings {
  waveSpawnInterval: number; // ms between wave spawns
  wavePeakDuration: number;  // ms wave stays at peak
  waveSpeed: number;         // ms per row of movement
  scaling?: {
    everyNWaves: number;
    multiplier: number;
  };
}

// ─── Scoring ────────────────────────────────────────────────────────────────

export interface LevelResult {
  wavesTouched: number;
  wavesMissed: number;
  waterTimeRemaining: number;
  score: number;
}

// ─── World State ────────────────────────────────────────────────────────────
// This is the mutable state object that the engine systems read/write.
// After each frame, it's synced to the Zustand store.

export interface WorldState {
  // Core
  gameState: GameState;
  runType: RunType;
  gameOverReason: GameOverReason;

  // Player
  feetPosition: number;
  isTapping: boolean;
  momentumGear: number; // -3 to +3
  movementMode: MovementMode;
  footType: FootType;
  autoToeTap: boolean;

  // Waves
  waves: Wave[];
  wavesTouched: number;
  wavesMissed: number;
  waterTimer: number;
  maxWaterTimer: number;
  waveIdCounter: number;
  lastWaveMaxReach: number;

  // Level config (set by mode at level start)
  wavesToWin: number;
  wavesToLose: number;
  difficultySettings: DifficultySettings;
  waveSpawnTimer: number;

  // Abilities
  selectedAbilities: AbilityType[];
  unlockedAbilities: UnlockedAbility[];
  excludedAbilities: AbilityType[];
  abilityStates: Record<AbilityType, AbilityState>;
  waveSurferQueued: boolean;
  waveSurferTeleportRow: number | null;
  waveSurferShield: number;

  // Beach effects
  currentBeachEffect: BeachEffectType | null;
  beachEffectLevel: number; // 1-4 for normal, 5 for boss
  usedBeachEffects: BeachEffectType[];
  pendingBeachEffect: BeachEffectType | null;

  // Beach effect substates
  quicksandStillTimer: number;
  quicksandPenaltyTimer: number;
  fishNetStuck: boolean;
  fishNetTimer: number;
  flashlightActive: boolean;
  flashlightDuration: number;
  flashlightCooldown: number;
  beachPeople: BeachPerson[];
  beachPeopleSpawnTimer: number;
  spikeFlashTimer: number;

  // Roguelike progression
  roguelikeLevel: number;
  roguelikeTotalWaves: number;
  totalScore: number;
  levelScore: number;
  waterTimeBonus: number;
  wavesMissedBonus: number;
  lastWavesMissedUpgradeLevel: number;
  permanentUpgrades: PermanentUpgrades;

  // Audio
  isMuted: boolean;

  // Timing
  elapsedTime: number;
}

// ─── Saved Run (localStorage) ───────────────────────────────────────────────

export interface SavedRun {
  roguelikeLevel: number;
  unlockedAbilities: UnlockedAbility[];
  roguelikeTotalWaves: number;
  waterTimeBonus: number;
  wavesMissedBonus: number;
  lastWavesMissedUpgradeLevel: number;
  selectedAbilities: AbilityType[];
  usedBeachEffects: BeachEffectType[];
  currentBeachEffect: BeachEffectType | null;
  pendingBeachEffect: BeachEffectType | null;
  totalScore: number;
  permanentUpgrades: PermanentUpgrades;
  excludedAbilities: AbilityType[];
  savedAt: number;
  // Beach Bonanza fields
  runType?: RunType;
  currentBeach?: BeachEffectType | null;
  beachLevel?: number;
  beachNumber?: number;
  completedBeaches?: BeachEffectType[];
  autoToeTap?: boolean;
  movementMode?: MovementMode;
}
