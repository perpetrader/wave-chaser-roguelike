// Grid dimensions
export const OCEAN_WIDTH = 20;
export const OCEAN_HEIGHT = 30;
export const BEACH_HEIGHT = 13;
export const TOTAL_HEIGHT = OCEAN_HEIGHT + BEACH_HEIGHT; // 43
export const PIXEL_SIZE = 16;

// Canvas dimensions (logical pixels)
export const CANVAS_WIDTH = OCEAN_WIDTH * PIXEL_SIZE;   // 320
export const CANVAS_HEIGHT = TOTAL_HEIGHT * PIXEL_SIZE;  // 688

// Player defaults
export const DEFAULT_FEET_POSITION = 35; // Starting row on beach
export const FEET_HEIGHT = 2;            // Feet occupy 2 rows
export const FEET_WIDTH = 2;             // Feet occupy 2 columns
export const FEET_COL = 9;              // Center columns (9-10)

// Movement
export const BASE_MOVE_STEP = 0.25;
export const MOVE_REPEAT_INTERVAL = 100; // ms between repeated moves when holding
export const JUMP_AROUND_MULTIPLIER = 4;
export const SUPER_TAP_MULTIPLIER = 3;
export const GHOST_TOE_EXTENSION = 2;    // +2 rows detection range
export const BASE_TOE_EXTENSION = 0.5;

// Ability keys
export const ABILITY_KEYS = ["C", "V", "B", "N"] as const;

// Standard ability cooldowns/durations
export const STANDARD_ABILITY_COOLDOWN = 60000;  // 60s
export const BOSS_RUN_ABILITY_COOLDOWN = 20000;   // 20s

export const WETSUIT_DURATION = 8000;
export const WETSUIT_WATER_LIMIT = 2400;
export const SUPER_TAP_USES = 5;
export const GHOST_TOE_DURATION = 5000;

// Roguelike base durations (ms)
export const ROGUELIKE_BASE_DURATIONS: Record<string, number> = {
  wetsuit: 8000,
  slowdown: 12000,
  superTap: 7000,
  ghostToe: 6000,
  crystalBall: 5000,
  waveMagnet: 5000,
  waveSurfer: 4000,
  towelOff: 7000,
  doubleDip: 5000,
  jumpAround: 6000,
};

// Upgrade increments (ms per upgrade level)
export const UPGRADE_INCREMENTS_MS: Record<string, number> = {
  wetsuit: 800,
  slowdown: 1200,
  superTap: 700,
  ghostToe: 600,
  crystalBall: 500,
  waveMagnet: 500,
  waveSurfer: 400,
  towelOff: 700,
  doubleDip: 500,
  jumpAround: 600,
};

// Wetsuit
export const ROGUELIKE_BASE_WETSUIT_WATER_LIMIT = 3000;
export const WETSUIT_WATER_LIMIT_INCREMENT = 300;

// Roguelike progression
export const ROGUELIKE_BASE_WATER_TIMER = 5000;
export const ROGUELIKE_BASE_SPAWN_INTERVAL = 4200;
export const ROGUELIKE_BASE_PEAK_DURATION = 2500;
export const ROGUELIKE_BASE_WAVE_SPEED = 250;

// Flashlight (Nighttime beach effect)
export const FLASHLIGHT_DURATION_BOSS = 10000;
export const FLASHLIGHT_DURATION_REDUCED = 25000;
export const FLASHLIGHT_COOLDOWN = 5000;
export const FLASHLIGHT_ROWS_BOSS = 5;
export const FLASHLIGHT_ROWS_REDUCED = 7;

// Boss Quick Run / Boss Hell Run
export const BOSS_QUICK_RUN_TOTAL_LEVELS = 10;
export const BOSS_QUICK_RUN_WAVES_TO_WIN = 15;
export const BOSS_QUICK_RUN_MAX_MISSES = 20;
export const BOSS_QUICK_RUN_STARTING_WATER = 50000;
export const BOSS_HELL_RUN_MAX_MISSES = 10;
export const BOSS_HELL_RUN_STARTING_WATER = 30000;

// Slay the Waves
export const SLAY_STARTING_GOLD = 100;
export const SLAY_STARTING_MAX_WATER_TIME = 5000;
export const SLAY_GOLD_PER_BEACH = 25;
export const SLAY_GOLD_PER_ELITE = 50;
export const SLAY_GOLD_PER_BOSS = 100;
export const SLAY_SKIP_CARD_GOLD = 15;
export const SLAY_REST_WATER_TIME_HEAL = 1000;
export const SLAY_FLOORS_PER_ACT = 15;
export const SLAY_TOTAL_ACTS = 3;
export const SLAY_SHOP_PRICES = {
  ability: 75,
  upgrade: 50,
  waterTime: 30,
  permanentUpgrade: 150,
};

// localStorage keys
export const SAVE_KEY_ROGUELIKE = "waveChaser_savedRun";
export const SAVE_KEY_BONANZA = "waveChaser_savedBonanzaRun";
export const SAVE_KEY_SLAY = "waveChaser_slayTheWavesSavedRun";
export const SAVE_KEY_BOSS_QUICK_HIGH = "waveChaser_bossQuickRunHighScore";
export const SAVE_KEY_BOSS_HELL_HIGH = "waveChaser_bossHellRunHighScore";

// Permanent upgrade limits
export const MAX_PERMANENT_UPGRADES = 5;
