// Game constants, tuning tables, and shared types for Wave Chaser.
// Pure data and pure functions only — nothing here may import React or
// component modules (type-only imports of component prop types are fine).

import type { AbilityType, UnlockedAbility, PermanentUpgrades } from "../RoguelikeAbilitySelect";
import type { FootType } from "../RoguelikeStartScreen";
import type { WavesDifficulty } from "../DifficultySelect";

// ─── Core mode types ─────────────────────────────────────────────────────────

export type MovementMode = "standard" | "slowerForward" | "momentum";
export type RunType = "roguelike" | "beachBonanza" | "slayTheWaves" | "bossQuickRun" | "bossHellRun";

// ─── Grid & rendering ────────────────────────────────────────────────────────

export const OCEAN_WIDTH = 20;
export const OCEAN_HEIGHT = 30;
export const BEACH_HEIGHT = 13;
export const TOTAL_HEIGHT = OCEAN_HEIGHT + BEACH_HEIGHT; // 43

export const PIXEL_SIZE = 16; // Size of each pixel cell

// Colors for pixel art
export const COLORS = {
  ocean: "hsl(200, 70%, 35%)",
  crest: "hsl(180, 90%, 85%)",
  crestTouched: "hsl(160, 70%, 50%)", // Sea green when touched
  sand: "hsl(42, 50%, 75%)",
  feet: "hsl(25, 60%, 65%)",
  feetOutline: "hsl(25, 50%, 45%)",
  feetTouching: "hsl(180, 70%, 60%)",
};

// ─── Player ──────────────────────────────────────────────────────────────────

// Foot Type modifiers
export const FOOT_TYPE_MODIFIERS: Record<FootType, { speedMultiplier: number; drainMultiplier: number }> = {
  tourist: { speedMultiplier: 1.0, drainMultiplier: 1.0 },
  beachBum: { speedMultiplier: 0.65, drainMultiplier: 0.6 },
  speedster: { speedMultiplier: 1.4, drainMultiplier: 1.5 },
  toeWarrior: { speedMultiplier: 1.0, drainMultiplier: 1.4 }, // Drain only applies when back 65% is in water
};

// Walking gait: rows of body travel per step. A fixed quantum in every
// movement mode (matches standard controls at base speed: one step per three
// 0.25-row hops), so a step always looks the same size — faster movement
// just steps more often. The front foot still averages exactly the body's
// speed because steps fire per distance traveled.
export const GAIT_STEP_ROWS = 0.75;

// The 4 ability slots with their keyboard bindings
export const ABILITY_KEYS = ["C", "V", "B", "N"] as const;

// ─── Beach effects (boss levels) ─────────────────────────────────────────────

export type BeachEffectType = "quicksand" | "spikeWaves" | "gummyBeach" | "coldWater" | "crazyWaves" | "fishNet" | "nighttime" | "roughWaters" | "heavySand" | "busyBeach";

export const BEACH_EFFECTS: { type: BeachEffectType; name: string; description: string }[] = [
  { type: "quicksand", name: "Quicksand", description: "Stay still 0.2s triggers 80% slower movement for 1.5s!" },
  { type: "spikeWaves", name: "Spike Waves", description: "100% of time in spikes is drained!" },
  { type: "gummyBeach", name: "Gummy Beach", description: "20% slower, no toe tap at all!" },
  { type: "coldWater", name: "Cold Water", description: "Water timer drains 2x faster!" },
  { type: "crazyWaves", name: "Crazy Waves", description: "Wave variance is tripled!" },
  { type: "fishNet", name: "Fish Net", description: "Feet get stuck every 3s for 1s!" },
  { type: "nighttime", name: "Nighttime", description: "Flashlight only lasts 10s!" },
  { type: "roughWaters", name: "Rough Waters", description: "Waves 75% faster, peak 50% shorter!" },
  { type: "heavySand", name: "Heavy Sand", description: "Each tap moves 65% less!" },
  { type: "busyBeach", name: "Busy Beach", description: "People spawn every 1.5 seconds!" },
];

// Flashlight settings for Nighttime boss beach
export const FLASHLIGHT_DURATION_BOSS = 10000; // 10 seconds (boss level)
export const FLASHLIGHT_DURATION_REDUCED = 25000; // 25 seconds (reduced mode)
export const FLASHLIGHT_COOLDOWN = 5000; // 5 seconds
export const FLASHLIGHT_ROWS_BOSS = 5; // Boss: 5 rows toward shore
export const FLASHLIGHT_ROWS_REDUCED = 7; // Levels 1-4: 7 rows toward shore

// ─── Persistence keys ────────────────────────────────────────────────────────

export const SAVED_RUN_KEY = "waveChaser_savedRun";
export const SAVED_BONANZA_RUN_KEY = "waveChaser_savedBonanzaRun";
export const SLAY_SAVED_RUN_KEY = "waveChaser_slayTheWavesSavedRun";
export const BOSS_QUICK_RUN_HIGH_SCORE_KEY = "waveChaser_bossQuickRunHighScore";
export const BOSS_HELL_RUN_HIGH_SCORE_KEY = "waveChaser_bossHellRunHighScore";

export interface SavedRun {
  roguelikeLevel: number;
  unlockedAbilities: UnlockedAbility[];
  roguelikeTotalWaves: number;
  waterTimeBonus: number;
  wavesMissedBonus: number;
  lastWavesMissedUpgradeLevel: number; // Track grace period for waves missed decreases
  selectedAbilities: AbilityType[];
  usedBeachEffects: BeachEffectType[];
  currentBeachEffect: BeachEffectType | null;
  pendingBeachEffect: BeachEffectType | null; // Pre-determined effect for next boss level
  totalScore: number; // Total score accumulated during run
  permanentUpgrades: PermanentUpgrades; // Permanent stat upgrades from boss beaches
  excludedAbilities: AbilityType[]; // 3 abilities randomly excluded for this run
  savedAt: number;
  // Beach Bonanza specific fields (optional for backward compat)
  runType?: RunType;
  currentBeach?: BeachEffectType | null;
  beachLevel?: number; // 1-5 within current beach
  beachNumber?: number; // Which beach in the run (1, 2, 3...)
  completedBeaches?: BeachEffectType[]; // All beaches completed in this run
  autoToeTap?: boolean; // Toe tap mode preference
  movementMode?: MovementMode; // Movement type preference
  footType?: FootType; // Foot type (speed/drain modifiers) — must survive reload
}

// ─── Abilities ───────────────────────────────────────────────────────────────

// Base ability constants for standard modes
export const WETSUIT_DURATION = 8000; // 8 seconds total
export const WETSUIT_WATER_LIMIT = 2400; // Can take 2.4 seconds of water
export const WETSUIT_COOLDOWN = 60000;
export const SUPER_TAP_USES = 5;
export const SUPER_TAP_MULTIPLIER = 3;
export const SUPER_TAP_COOLDOWN = 60000;
export const GHOST_TOE_DURATION = 5000;
export const GHOST_TOE_COOLDOWN = 60000;
export const GHOST_TOE_EXTENSION = 2; // Full foot extension (matches foot height)

// Roguelike base ability values (in ms)
export const ROGUELIKE_BASE_WETSUIT_DURATION = 8000; // 8 seconds base duration
export const ROGUELIKE_BASE_WETSUIT_WATER_LIMIT = 3000; // 3 seconds water tolerance
export const ROGUELIKE_BASE_SLOWDOWN_DURATION = 12000; // 12 seconds base for slowdown

// Individual base durations (in ms)
export const ROGUELIKE_BASE_DURATIONS: Record<AbilityType, number> = {
  wetsuit: 8000,     // 8s
  slowdown: 12000,   // 12s
  superTap: 7000,    // 7s
  ghostToe: 6000,    // 6s
  crystalBall: 5000, // 5s
  waveMagnet: 5000,  // 5s
  waveSurfer: 4000,  // 4s (Teleport)
  towelOff: 7000,    // 7s
  doubleDip: 5000,   // 5s
  jumpAround: 6000,  // 6s
};

// Upgrade increments in ms
export const UPGRADE_INCREMENTS_MS: Record<AbilityType, number> = {
  wetsuit: 800,    // +0.8s duration per upgrade
  slowdown: 1200,  // +1.2s per upgrade
  superTap: 700,   // +0.7s per upgrade
  ghostToe: 600,   // +0.6s per upgrade
  crystalBall: 500, // +0.5s per upgrade
  waveMagnet: 500,  // +0.5s per upgrade
  waveSurfer: 400,  // +0.4s per upgrade (Teleport)
  towelOff: 700,    // +0.7s per upgrade
  doubleDip: 500,   // +0.5s per upgrade
  jumpAround: 600,  // +0.6s per upgrade
};

// Wetsuit water limit upgrade increment
export const WETSUIT_WATER_LIMIT_INCREMENT = 300; // +0.3s water tolerance per upgrade

export const CRYSTAL_BALL_COOLDOWN = 60000;
export const SLOWDOWN_COOLDOWN = 60000;
export const WAVE_MAGNET_COOLDOWN = 60000;
export const WAVE_SURFER_COOLDOWN = 60000;
export const TOWEL_OFF_COOLDOWN = 60000;
export const DOUBLE_DIP_COOLDOWN = 60000;
export const JUMP_AROUND_COOLDOWN = 60000;

// Jump Around: movement multiplier when active
export const JUMP_AROUND_MULTIPLIER = 4;

// ─── Difficulty ──────────────────────────────────────────────────────────────

export interface DifficultySettings {
  waveSpawnInterval: number; // ms
  wavePeakDuration: number; // ms
  waveSpeed: number; // ms per row
  scaling?: {
    everyNWaves: number;
    multiplier: number; // reduction per threshold (e.g., 0.1 = 10% faster)
  };
}

export const DIFFICULTY_SETTINGS: Record<Exclude<WavesDifficulty, "roguelike">, DifficultySettings> = {
  beginner: {
    waveSpawnInterval: 5000,
    wavePeakDuration: 3000,
    waveSpeed: 500,
  },
  easy: {
    waveSpawnInterval: 4000,
    wavePeakDuration: 3000,
    waveSpeed: 250,
  },
  medium: {
    waveSpawnInterval: 3000,
    wavePeakDuration: 2000,
    waveSpeed: 250,
  },
  hard: {
    waveSpawnInterval: 3000,
    wavePeakDuration: 2000,
    waveSpeed: 250,
    scaling: {
      everyNWaves: 5,
      multiplier: 0.1, // 10% faster each threshold
    },
  },
  expert: {
    waveSpawnInterval: 2000,
    wavePeakDuration: 1300,
    waveSpeed: 250,
    scaling: {
      everyNWaves: 5,
      multiplier: 0.2, // 20% faster each threshold
    },
  },
};

// Roguelike level 1 base settings
export const ROGUELIKE_BASE_SETTINGS: DifficultySettings = {
  waveSpawnInterval: 4200,
  wavePeakDuration: 2500,
  waveSpeed: 250,
};

// ─── Core gameplay types ─────────────────────────────────────────────────────

export interface Wave {
  id: number;
  row: number; // Current row position (0-42)
  startRow: number; // Starts in bottom 10 rows of ocean
  maxReach: number; // Crest peak row (top 11 rows of beach)
  phase: "incoming" | "peak" | "outgoing";
  touched: boolean;
  peakTimer: number; // Time spent at peak (in ms)
  magnetAffected?: boolean; // True if wave magnet changed this wave's peak
}

export interface AbilityState {
  active: boolean;
  cooldownRemaining: number;
  usesRemaining?: number;
  durationRemaining?: number;
  waterExposure?: number; // For wetsuit: tracks time spent in water while active
  waterLimit?: number; // For wetsuit: max time allowed in water
}

// ─── Roguelike level scaling ─────────────────────────────────────────────────

// Roguelike base water timer (5 seconds for level 1)
export const ROGUELIKE_BASE_WATER_TIMER = 5000;

// Calculate roguelike settings for a given level
export const getRoguelikeLevelSettings = (level: number, lastUpgradeLevel: number = 0): {
  settings: DifficultySettings;
  wavesToWin: number;
  wavesToLose: number;
  waterTimer: number;
} => {
  // 2% difficulty increase per level
  const scalingFactor = Math.pow(0.98, level - 1);

  // Every 5 levels: +2 waves
  const levelTier = Math.floor((level - 1) / 5);
  // Starting at 4 waves, +2 per tier: 4, 6, 8, 10, 12...
  const wavesToWin = 4 + (levelTier * 2);

  // Waves allowed decreases by 1 every 5 levels (can go negative, bonus is added later and total is clamped to min 1)
  const wavesToLose = 7 - levelTier;

  // Water timer decreases by 3% each level (separate from speed/timing scaling)
  const waterTimerScalingFactor = Math.pow(0.97, level - 1);
  const waterTimer = Math.round(ROGUELIKE_BASE_WATER_TIMER * waterTimerScalingFactor);

  return {
    settings: {
      waveSpawnInterval: Math.round(ROGUELIKE_BASE_SETTINGS.waveSpawnInterval * scalingFactor),
      wavePeakDuration: Math.round(ROGUELIKE_BASE_SETTINGS.wavePeakDuration * scalingFactor),
      waveSpeed: Math.round(ROGUELIKE_BASE_SETTINGS.waveSpeed * scalingFactor),
    },
    wavesToWin,
    wavesToLose,
    waterTimer,
  };
};

// ─── Slay the Waves difficulty settings ──────────────────────────────────────
// Separate from standard roguelike progression. Scales by act (1-3) and node type.
export const getSlayBattleSettings = (
  actNumber: number,
  nodeType: "beach" | "elite" | "boss",
  waterTimeBonus: number = 0,
  wavesMissedBonus: number = 0,
): {
  settings: DifficultySettings;
  wavesToWin: number;
  wavesToLose: number;
  waterTimer: number;
  beachEffectLevel: number; // 1-5 intensity for the beach effect
} => {
  // Act scaling: 10% harder per act (act 1 = 1.0, act 2 = 0.90, act 3 = 0.81)
  const actScaling = Math.pow(0.90, actNumber - 1);

  // Node type modifiers
  const nodeModifiers = {
    beach: { speedMult: 1.0, timerBase: 6000, effectLevel: 3 },
    elite: { speedMult: 0.85, timerBase: 5000, effectLevel: 5 },
    boss:  { speedMult: 0.75, timerBase: 4000, effectLevel: 5 },
  };

  const mod = nodeModifiers[nodeType];
  const combinedScaling = actScaling * mod.speedMult;

  // Waves to win: beach = 4 + (act*2), elite = 5 + (act*3), boss = 6 + (act*4)
  const wavesToWin = nodeType === "beach"
    ? 4 + (actNumber * 2)
    : nodeType === "elite"
    ? 5 + (actNumber * 3)
    : 6 + (actNumber * 4);

  // Waves missed to lose: beach = 6-act, elite = 5-act, boss = 4-act (min 1)
  const wavesToLose = nodeType === "beach"
    ? Math.max(1, (6 - actNumber) + wavesMissedBonus)
    : nodeType === "elite"
    ? Math.max(1, (5 - actNumber) + wavesMissedBonus)
    : Math.max(1, (4 - actNumber) + wavesMissedBonus);

  return {
    settings: {
      waveSpawnInterval: Math.round(ROGUELIKE_BASE_SETTINGS.waveSpawnInterval * combinedScaling),
      wavePeakDuration: Math.round(ROGUELIKE_BASE_SETTINGS.wavePeakDuration * combinedScaling),
      waveSpeed: Math.round(ROGUELIKE_BASE_SETTINGS.waveSpeed * combinedScaling),
    },
    wavesToWin,
    wavesToLose,
    waterTimer: Math.round(mod.timerBase * actScaling) + waterTimeBonus,
    beachEffectLevel: mod.effectLevel,
  };
};

// ─── Boss Quick Run / Boss Hell Run ──────────────────────────────────────────

export const BOSS_QUICK_RUN_COOLDOWN = 20000; // 20 second cooldowns for Boss Quick Run
export const BOSS_QUICK_RUN_STARTING_WATER_TIME = 50000; // Start with 50 seconds (no additions)
export const BOSS_QUICK_RUN_MAX_MISSES = 20; // Fixed denominator for all levels
export const BOSS_QUICK_RUN_ABILITY_UPGRADES = 2; // Level 3 power (2 upgrades)
export const BOSS_QUICK_RUN_WAVES_TO_WIN = 15; // 15 waves needed per level
export const BOSS_QUICK_RUN_TOTAL_LEVELS = 10;
export const BOSS_QUICK_RUN_BASE_WATER_TIME = 50000; // Base time for Towel Off cap (50s)

// Boss Hell Run constants - harder version of Boss Quick Run
export const BOSS_HELL_RUN_STARTING_WATER_TIME = 30000; // Start with 30 seconds
export const BOSS_HELL_RUN_MAX_MISSES = 10; // Only 10 misses allowed
export const BOSS_HELL_RUN_BASE_VARIANCE = 3; // Wave variance is 3 instead of 2

// Boss Quick Run uses level 20 settings from beach bonanza (2% scaling per level)
// Level 20: scalingFactor = Math.pow(0.98, 19) ≈ 0.68
export const BOSS_QUICK_RUN_SETTINGS: DifficultySettings = {
  waveSpawnInterval: Math.round(ROGUELIKE_BASE_SETTINGS.waveSpawnInterval * Math.pow(0.98, 19)), // ~2856ms
  wavePeakDuration: Math.round(ROGUELIKE_BASE_SETTINGS.wavePeakDuration * Math.pow(0.98, 19)), // ~1700ms
  waveSpeed: Math.round(ROGUELIKE_BASE_SETTINGS.waveSpeed * Math.pow(0.98, 19)), // ~170ms
};
