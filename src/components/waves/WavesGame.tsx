import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUp, ArrowDown, Hand, Volume2, VolumeX, Shirt, Zap, Ghost, Shell, Snail, Magnet, Waves, Wind, Rabbit, Flashlight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import DifficultySelect, { WavesDifficulty } from "./DifficultySelect";
import RoguelikeAbilitySelect, { AbilityType, UnlockedAbility, PermanentUpgradeType, PermanentUpgrades, ALL_ABILITIES } from "./RoguelikeAbilitySelect";
import RoguelikeStartScreen, { RunType as StartScreenRunType, FootType, ToeTapMode } from "./RoguelikeStartScreen";
import AbilitySelectionScreen from "./AbilitySelectionScreen";
import BeachSelectionScreen, { BeachType, BEACH_INFO } from "./BeachSelectionScreen";
import BeachFrame from "./BeachFrame";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
// Boss Quick Run import
import BossQuickRunDraftScreen from "./BossQuickRunDraftScreen";
// Slay the Waves imports
import SlayTheWavesStartScreen from "./slayTheWaves/SlayTheWavesStartScreen";
import SlayMapView from "./slayTheWaves/SlayMapView";
import ShopScreen from "./slayTheWaves/ShopScreen";
import RestSiteScreen from "./slayTheWaves/RestSiteScreen";
import EventScreen from "./slayTheWaves/EventScreen";
import CardRewardScreen from "./slayTheWaves/CardRewardScreen";
import BeachPreviewScreen from "./slayTheWaves/BeachPreviewScreen";
import { generateMap, getAvailableNodes, moveToNode } from "./slayTheWaves/mapGenerator";
import { getRandomEvent } from "./slayTheWaves/events";
import { 
  SlayMap, MapNode, GameEvent, EventOption,
  STARTING_GOLD, STARTING_MAX_WATER_TIME, GOLD_PER_BEACH, GOLD_PER_ELITE, GOLD_PER_BOSS, 
  SKIP_CARD_GOLD, REST_WATER_TIME_HEAL, SHOP_PRICES 
} from "./slayTheWaves/types";

type GameState = "menu" | "roguelikeMenu" | "confirmLoadout" | "selectAbilities" | "playing" | "gameOver" | "levelComplete" | "roguelikeGameOver" | "selectBeach" | "slayMenu" | "slayMap" | "slayShop" | "slayRest" | "slayEvent" | "slayCardReward" | "slayBeachPreview" | "bossQuickRunDraft" | "bossQuickRunLevelComplete" | "bossQuickRunVictory";
type GameOverReason = "timer" | "missed" | null;
export type MovementMode = "standard" | "slowerForward" | "momentum";
export type RunType = "roguelike" | "beachBonanza" | "slayTheWaves" | "bossQuickRun" | "bossHellRun";

// Foot Type modifiers
const FOOT_TYPE_MODIFIERS: Record<FootType, { speedMultiplier: number; drainMultiplier: number }> = {
  tourist: { speedMultiplier: 1.0, drainMultiplier: 1.0 },
  beachBum: { speedMultiplier: 0.65, drainMultiplier: 0.6 },
  speedster: { speedMultiplier: 1.4, drainMultiplier: 1.5 },
  toeWarrior: { speedMultiplier: 1.0, drainMultiplier: 1.4 }, // Drain only applies when back 65% is in water
};

// Beach Effect types for boss levels (every 5th level)
type BeachEffectType = "quicksand" | "spikeWaves" | "gummyBeach" | "coldWater" | "crazyWaves" | "fishNet" | "nighttime" | "roughWaters" | "heavySand" | "busyBeach";

const BEACH_EFFECTS: { type: BeachEffectType; name: string; description: string }[] = [
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
const FLASHLIGHT_DURATION_BOSS = 10000; // 10 seconds (boss level)
const FLASHLIGHT_DURATION_REDUCED = 25000; // 25 seconds (reduced mode)
const FLASHLIGHT_COOLDOWN = 5000; // 5 seconds
const FLASHLIGHT_ROWS_BOSS = 5; // Boss: 5 rows toward shore
const FLASHLIGHT_ROWS_REDUCED = 7; // Levels 1-4: 7 rows toward shore

const SAVED_RUN_KEY = "waveChaser_savedRun";
const SAVED_BONANZA_RUN_KEY = "waveChaser_savedBonanzaRun";

// PermanentUpgradeType and PermanentUpgrades imported from RoguelikeAbilitySelect

interface SavedRun {
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
}

// The 4 ability slots with their keyboard bindings
const ABILITY_KEYS = ["C", "V", "B", "N"] as const;

const OCEAN_WIDTH = 20;
const OCEAN_HEIGHT = 30;
const BEACH_HEIGHT = 13;
const TOTAL_HEIGHT = OCEAN_HEIGHT + BEACH_HEIGHT; // 43

const PIXEL_SIZE = 16; // Size of each pixel cell

// Colors for pixel art
const COLORS = {
  ocean: "hsl(200, 70%, 35%)",
  crest: "hsl(180, 90%, 85%)",
  crestTouched: "hsl(160, 70%, 50%)", // Sea green when touched
  sand: "hsl(42, 50%, 75%)",
  feet: "hsl(25, 60%, 65%)",
  feetOutline: "hsl(25, 50%, 45%)",
  feetTouching: "hsl(180, 70%, 60%)",
};

// Base ability constants for standard modes
const WETSUIT_DURATION = 8000; // 8 seconds total
const WETSUIT_WATER_LIMIT = 2400; // Can take 2.4 seconds of water
const WETSUIT_COOLDOWN = 60000;
const SUPER_TAP_USES = 5;
const SUPER_TAP_MULTIPLIER = 3;
const SUPER_TAP_COOLDOWN = 60000;
const GHOST_TOE_DURATION = 5000;
const GHOST_TOE_COOLDOWN = 60000;
const GHOST_TOE_EXTENSION = 2; // Full foot extension (matches foot height)

// Roguelike base ability values (in ms)
const ROGUELIKE_BASE_WETSUIT_DURATION = 8000; // 8 seconds base duration
const ROGUELIKE_BASE_WETSUIT_WATER_LIMIT = 3000; // 3 seconds water tolerance
const ROGUELIKE_BASE_SLOWDOWN_DURATION = 12000; // 12 seconds base for slowdown

// Individual base durations (in ms)
const ROGUELIKE_BASE_DURATIONS: Record<AbilityType, number> = {
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
const UPGRADE_INCREMENTS_MS: Record<AbilityType, number> = {
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
const WETSUIT_WATER_LIMIT_INCREMENT = 300; // +0.3s water tolerance per upgrade

const CRYSTAL_BALL_COOLDOWN = 60000;
const SLOWDOWN_COOLDOWN = 60000;
const WAVE_MAGNET_COOLDOWN = 60000;
const WAVE_SURFER_COOLDOWN = 60000;
const TOWEL_OFF_COOLDOWN = 60000;
const DOUBLE_DIP_COOLDOWN = 60000;
const JUMP_AROUND_COOLDOWN = 60000;

// Jump Around: movement multiplier when active
const JUMP_AROUND_MULTIPLIER = 4;

// Wave Magnet: no longer uses pull factor - now sets peak to player position

// Difficulty settings
interface DifficultySettings {
  waveSpawnInterval: number; // ms
  wavePeakDuration: number; // ms
  waveSpeed: number; // ms per row
  scaling?: {
    everyNWaves: number;
    multiplier: number; // reduction per threshold (e.g., 0.1 = 10% faster)
  };
}

const DIFFICULTY_SETTINGS: Record<Exclude<WavesDifficulty, "roguelike">, DifficultySettings> = {
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
const ROGUELIKE_BASE_SETTINGS: DifficultySettings = {
  waveSpawnInterval: 4200,
  wavePeakDuration: 2500,
  waveSpeed: 250,
};

interface Wave {
  id: number;
  row: number; // Current row position (0-42)
  startRow: number; // Starts in bottom 10 rows of ocean
  maxReach: number; // Crest peak row (top 11 rows of beach)
  phase: "incoming" | "peak" | "outgoing";
  touched: boolean;
  peakTimer: number; // Time spent at peak (in ms)
  magnetAffected?: boolean; // True if wave magnet changed this wave's peak
}

interface AbilityState {
  active: boolean;
  cooldownRemaining: number;
  usesRemaining?: number;
  durationRemaining?: number;
  waterExposure?: number; // For wetsuit: tracks time spent in water while active
  waterLimit?: number; // For wetsuit: max time allowed in water
}

// Roguelike base water timer (5 seconds for level 1)
const ROGUELIKE_BASE_WATER_TIMER = 5000;

// Calculate roguelike settings for a given level
const getRoguelikeLevelSettings = (level: number, lastUpgradeLevel: number = 0): { 
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

interface WavesGameProps {
  startInRoguelike?: boolean;
}

const WavesGame = ({ startInRoguelike = false }: WavesGameProps) => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState>("menu");
  const [difficulty, setDifficulty] = useState<WavesDifficulty>("medium");
  const [feetPosition, setFeetPosition] = useState(35);
  const [isTapping, setIsTapping] = useState(false);
  const [feetMagnetized, setFeetMagnetized] = useState(false);
  const [waves, setWaves] = useState<Wave[]>([]);
  const [waterTimer, setWaterTimer] = useState(5000);
  const [wavesTouched, setWavesTouched] = useState(0);
  const [wavesMissed, setWavesMissed] = useState(0);
  const [gameOverReason, setGameOverReason] = useState<GameOverReason>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [levelCelebrating, setLevelCelebrating] = useState(false); // Shows celebration overlay before level complete

  // Roguelike state
  const [isRoguelike, setIsRoguelike] = useState(false);
  const [roguelikeLevel, setRoguelikeLevel] = useState(1);
  const [unlockedAbilities, setUnlockedAbilities] = useState<UnlockedAbility[]>([]);
  const [roguelikeTotalWaves, setRoguelikeTotalWaves] = useState(0);
  const [roguelikeWavesToWin, setRoguelikeWavesToWin] = useState(5);
  const [roguelikeWavesToLose, setRoguelikeWavesToLose] = useState(7);
  const [waterTimeBonus, setWaterTimeBonus] = useState(0); // ms bonus for water timer
  const [wavesMissedBonus, setWavesMissedBonus] = useState(0); // Permanent bonus to waves allowed to miss
  const [lastWavesMissedUpgradeLevel, setLastWavesMissedUpgradeLevel] = useState(0); // Level at which last waves missed upgrade was applied
  const [selectedAbilities, setSelectedAbilities] = useState<AbilityType[]>([]); // Abilities selected for current level (max 4)
  const [permanentUpgrades, setPermanentUpgrades] = useState<PermanentUpgrades>({ fastFeet: 0, tapDancer: 0, wetShoes: 0 }); // Permanent stat upgrades from boss beaches
  const [excludedAbilities, setExcludedAbilities] = useState<AbilityType[]>([]); // 3 abilities randomly excluded for this run
  const [movementMode, setMovementMode] = useState<MovementMode>("standard"); // Movement control mode
  const [footType, setFootType] = useState<FootType>("tourist"); // Foot type affects speed and water drain
  const [autoToeTap, setAutoToeTap] = useState(false); // Auto toe tap mode
  
  // Momentum mode state - gear system (-3 to +3)
  // Gear: -3 = run toward shore, -2 = walk toward shore, -1 = crawl toward shore
  //       0 = neutral, +1 = crawl away, +2 = walk away, +3 = run away
  const [momentumGear, setMomentumGear] = useState(0); // -3 to +3
  const momentumGearRef = useRef(0);
  const movementModeRef = useRef<MovementMode>("standard");
  const footTypeRef = useRef<FootType>("tourist");
  const autoToeTapRef = useRef(false);
  const autoTapStartTimeRef = useRef(0);
  
  // Keep momentumGearRef in sync with momentumGear state for game loop access
  useEffect(() => {
    momentumGearRef.current = momentumGear;
  }, [momentumGear]);
  
  // Helper to get gear speed in rows/sec
  const getGearSpeed = (gear: number): number => {
    switch (Math.abs(gear)) {
      case 3: return 2.5;   // Run
      case 2: return 1.25;  // Walk
      case 1: return 0.5;   // Crawl
      default: return 0;    // Neutral
    }
  };
  
  // Helper to get gear name for HUD
  const getGearName = (gear: number): string => {
    if (gear === 0) return "Neutral";
    const speed = Math.abs(gear) === 3 ? "Run" : Math.abs(gear) === 2 ? "Walk" : "Crawl";
    const direction = gear < 0 ? "↑ Shore" : "↓ Ocean";
    return `${speed} ${direction}`;
  };
  
  // Score tracking
  const [levelScore, setLevelScore] = useState(0); // Score for current level
  const [totalScore, setTotalScore] = useState(0); // Cumulative score across run
  
  // Stats tracking for roguelike
  const [totalSteps, setTotalSteps] = useState(0);
  const [totalToeTaps, setTotalToeTaps] = useState(0);
  
  // Beach effects state (boss levels)
  const [usedBeachEffects, setUsedBeachEffects] = useState<BeachEffectType[]>([]);
  const [currentBeachEffect, setCurrentBeachEffect] = useState<BeachEffectType | null>(null);
  const [pendingBeachEffect, setPendingBeachEffect] = useState<BeachEffectType | null>(null); // Pre-determined effect for next boss level
  const [completedBeachForDisplay, setCompletedBeachForDisplay] = useState<BeachEffectType | null>(null); // Preserves the beach name for level complete screen
  const [fishNetStuck, setFishNetStuck] = useState(false); // For Fish Net effect - when true, player can't move
  const fishNetTimerRef = useRef<number>(0); // Timer for Fish Net stuck cycles
  
  // Quicksand effect tracking
  const quicksandLastPositionRef = useRef<number | null>(null);
  const quicksandStillTimerRef = useRef(0); // Time feet have been in same position
  const quicksandPenaltyActiveRef = useRef(false);
  const quicksandPenaltyTimerRef = useRef(0); // Remaining time on 80% penalty
  
  // Busy Beach effect - people walking across
  interface BeachPerson {
    id: number;
    row: number; // Y position (32-38)
    col: number; // X position (fractional, 0 to OCEAN_WIDTH)
    direction: 1 | -1; // 1 = left to right, -1 = right to left
    speed: number; // columns per second (0.5 to 2)
    color: string; // random bright color
  }
  const [beachPeople, setBeachPeople] = useState<BeachPerson[]>([]);
  const beachPeopleRef = useRef<BeachPerson[]>([]);
  const beachPersonIdRef = useRef(0);
  const beachPersonSpawnTimerRef = useRef(0);
  
  // Flashlight state for Nighttime boss beach
  const [flashlightActive, setFlashlightActive] = useState(false);
  const [flashlightCooldown, setFlashlightCooldown] = useState(0);
  const [flashlightDuration, setFlashlightDuration] = useState(0);
  const flashlightActiveRef = useRef(false);
  
  // Beach Bonanza state
  const [runType, setRunType] = useState<RunType>("roguelike");
  const [currentBeach, setCurrentBeach] = useState<BeachEffectType | null>(null); // The beach being played (5 levels)
  const [beachLevel, setBeachLevel] = useState(1); // 1-5 within current beach
  const [beachNumber, setBeachNumber] = useState(1); // Which beach in the run (1, 2, 3...)
  const [completedBeaches, setCompletedBeaches] = useState<BeachEffectType[]>([]); // Beaches completed this run
  const [beachOptions, setBeachOptions] = useState<BeachEffectType[]>([]); // Two beaches to choose from
  const runTypeRef = useRef<RunType>("roguelike");
  const currentBeachRef = useRef<BeachEffectType | null>(null);
  const beachLevelRef = useRef(1);
  
  // Slay the Waves state
  const [slayMap, setSlayMap] = useState<SlayMap | null>(null);
  const [slayGold, setSlayGold] = useState(STARTING_GOLD);
  const [slayMaxWaterTime, setSlayMaxWaterTime] = useState(STARTING_MAX_WATER_TIME);
  const [slayCurrentEvent, setSlayCurrentEvent] = useState<GameEvent | null>(null);
  const [slayCardRewardAbilities, setSlayCardRewardAbilities] = useState<AbilityType[]>([]);
  const [slayHasRested, setSlayHasRested] = useState(false);
  const [slayPendingNodeType, setSlayPendingNodeType] = useState<"beach" | "elite" | "boss">("beach");
  const [slayHasSavedRun, setSlayHasSavedRun] = useState(false);
  const SLAY_SAVED_RUN_KEY = "waveChaser_slayTheWavesSavedRun";
  
  // Boss Quick Run state
  const [bossQuickRunUsedBeaches, setBossQuickRunUsedBeaches] = useState<BeachEffectType[]>([]);
  const [bossQuickRunCarryoverTimer, setBossQuickRunCarryoverTimer] = useState(0); // Water timer carries over between levels
  const [bossQuickRunTotalMisses, setBossQuickRunTotalMisses] = useState(0); // Total accumulated misses across all levels
  const [bossQuickRunLevelScore, setBossQuickRunLevelScore] = useState(0); // Score for current level (for display)
  const [bossQuickRunNextBeach, setBossQuickRunNextBeach] = useState<BeachEffectType | null>(null); // Next beach to use
  const [bossQuickRunHighScore, setBossQuickRunHighScore] = useState<number>(() => {
    const saved = localStorage.getItem("waveChaser_bossQuickRunHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [bossQuickRunIsNewHighScore, setBossQuickRunIsNewHighScore] = useState(false);
  const bossQuickRunCarryoverTimerRef = useRef(0);
  const bossQuickRunTotalMissesRef = useRef(0); // Accumulated total misses across all levels
  const BOSS_QUICK_RUN_COOLDOWN = 20000; // 20 second cooldowns for Boss Quick Run
  const BOSS_QUICK_RUN_STARTING_WATER_TIME = 50000; // Start with 50 seconds (no additions)
  const BOSS_QUICK_RUN_MAX_MISSES = 20; // Fixed denominator for all levels
  const BOSS_QUICK_RUN_ABILITY_UPGRADES = 2; // Level 3 power (2 upgrades)
  const BOSS_QUICK_RUN_WAVES_TO_WIN = 15; // 15 waves needed per level
  const BOSS_QUICK_RUN_TOTAL_LEVELS = 10;
  const BOSS_QUICK_RUN_BASE_WATER_TIME = 50000; // Base time for Towel Off cap (50s)
  const BOSS_QUICK_RUN_HIGH_SCORE_KEY = "waveChaser_bossQuickRunHighScore";
  
  // Boss Hell Run constants - harder version of Boss Quick Run
  const BOSS_HELL_RUN_STARTING_WATER_TIME = 30000; // Start with 30 seconds
  const BOSS_HELL_RUN_MAX_MISSES = 10; // Only 10 misses allowed
  const BOSS_HELL_RUN_BASE_VARIANCE = 3; // Wave variance is 3 instead of 2
  const BOSS_HELL_RUN_HIGH_SCORE_KEY = "waveChaser_bossHellRunHighScore";
  
  // Boss Quick Run uses level 20 settings from beach bonanza (2% scaling per level)
  // Level 20: scalingFactor = Math.pow(0.98, 19) ≈ 0.68
  const BOSS_QUICK_RUN_SETTINGS: DifficultySettings = {
    waveSpawnInterval: Math.round(ROGUELIKE_BASE_SETTINGS.waveSpawnInterval * Math.pow(0.98, 19)), // ~2856ms
    wavePeakDuration: Math.round(ROGUELIKE_BASE_SETTINGS.wavePeakDuration * Math.pow(0.98, 19)), // ~1700ms
    waveSpeed: Math.round(ROGUELIKE_BASE_SETTINGS.waveSpeed * Math.pow(0.98, 19)), // ~170ms
  };
  
  // Secret dev ability: next wave touched counts as 20
  const [superWaveActive, setSuperWaveActive] = useState(false);
  const superWaveActiveRef = useRef(false);

  // Ability states
  const [invincible, setInvincible] = useState<AbilityState>({
    active: false,
    cooldownRemaining: 0,
    durationRemaining: 0,
  });
  const [superTap, setSuperTap] = useState<AbilityState>({
    active: false,
    cooldownRemaining: 0,
    usesRemaining: SUPER_TAP_USES,
  });
  const [ghostToe, setGhostToe] = useState<AbilityState>({
    active: false,
    cooldownRemaining: 0,
    durationRemaining: 0,
  });
  const [crystalBall, setCrystalBall] = useState<AbilityState>({
    active: false,
    cooldownRemaining: 0,
    durationRemaining: 0,
  });
  const [slowdown, setSlowdown] = useState<AbilityState>({
    active: false,
    cooldownRemaining: 0,
    durationRemaining: 0,
  });
  const [waveMagnet, setWaveMagnet] = useState<AbilityState>({
    active: false,
    cooldownRemaining: 0,
    durationRemaining: 0,
  });
  const [waveSurfer, setWaveSurfer] = useState<AbilityState>({
    active: false,
    cooldownRemaining: 0,
    durationRemaining: 0,
  });
  const [towelOff, setTowelOff] = useState<AbilityState>({
    active: false,
    cooldownRemaining: 0,
    durationRemaining: 0,
  });
  const [doubleDip, setDoubleDip] = useState<AbilityState>({
    active: false,
    cooldownRemaining: 0,
    durationRemaining: 0,
  });
  const [jumpAround, setJumpAround] = useState<AbilityState>({
    active: false,
    cooldownRemaining: 0,
    durationRemaining: 0,
  });
  const [waveSurferShield, setWaveSurferShield] = useState(0); // ms remaining on jump shield
  const [waveSurferParticles, setWaveSurferParticles] = useState<Array<{
    id: number;
    startRow: number;
    endRow: number;
    spawnTime: number;
  }>>([]);
  const [swappingSlot, setSwappingSlot] = useState<number | null>(null);
  const [showTimerTutorial, setShowTimerTutorial] = useState(false);
  const [showWavesTutorial, setShowWavesTutorial] = useState(false);
  const [showBossBeachPopup, setShowBossBeachPopup] = useState(false);
  const [levelCompleteReady, setLevelCompleteReady] = useState(false);
  const [gameOverReady, setGameOverReady] = useState(false);
  const [hasSavedRun, setHasSavedRun] = useState(false);
  const [savedRunTypeFromStorage, setSavedRunTypeFromStorage] = useState<"standard" | "beachBonanza">("standard");
  const gameLoopRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const waveSpawnTimerRef = useRef<number>(0);
  const waveUpdateTimerRef = useRef<number>(0);
  const waveIdRef = useRef(0);
  const wavesRef = useRef<Wave[]>([]); // Ref for synchronous access to waves in game loop
  const waveSurferQueuedTeleportRef = useRef<boolean>(false); // Queue teleport if no incoming wave when touching
  const lastMaxReachRef = useRef(OCEAN_HEIGHT + 4); // Start in middle of beach range
  const feetPositionRef = useRef(feetPosition);
  const isTappingRef = useRef(isTapping);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const difficultyRef = useRef(difficulty);
  const wavesTouchedRef = useRef(wavesTouched);
  const wavesMissedRef = useRef(wavesMissed);
  const waterTimerRef = useRef(waterTimer);
  
  // Movement hold refs (for both PC and mobile continuous movement)
  const moveUpIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveDownIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyHeldRef = useRef<{ up: boolean; down: boolean }>({ up: false, down: false });

  const isRoguelikeRef = useRef(isRoguelike);
  const roguelikeLevelRef = useRef(roguelikeLevel);
  const roguelikeWavesToWinRef = useRef(roguelikeWavesToWin);
  const roguelikeWavesToLoseRef = useRef(roguelikeWavesToLose);
  const unlockedAbilitiesRef = useRef(unlockedAbilities);
  const selectedAbilitiesRef = useRef(selectedAbilities);
  const usedBeachEffectsRef = useRef(usedBeachEffects);
  const permanentUpgradesRef = useRef(permanentUpgrades);

  // Ability refs for game loop access
  const invincibleRef = useRef(invincible);
  const superTapRef = useRef(superTap);
  const ghostToeRef = useRef(ghostToe);
  const crystalBallRef = useRef(crystalBall);
  const slowdownRef = useRef(slowdown);
  const waveMagnetRef = useRef(waveMagnet);
  const waveSurferRef = useRef(waveSurfer);
  const towelOffRef = useRef(towelOff);
  const doubleDipRef = useRef(doubleDip);
  const jumpAroundRef = useRef(jumpAround);
  const waveSurferShieldRef = useRef(waveSurferShield);
  const showTimerTutorialRef = useRef(showTimerTutorial);
  const showWavesTutorialRef = useRef(showWavesTutorial);
  const showBossBeachPopupRef = useRef(showBossBeachPopup);
  const currentBeachEffectRef = useRef(currentBeachEffect);
  const fishNetStuckRef = useRef(fishNetStuck);
  const levelCelebratingRef = useRef(levelCelebrating);
  
  const levelStartingWaterTimerRef = useRef(0); // Track starting water timer for Towel Off cap
  const wasTouchingWaterRef = useRef(false); // Track previous water touching state for Jump Around immunity
  useEffect(() => {
    levelCelebratingRef.current = levelCelebrating;
  }, [levelCelebrating]);
  useEffect(() => {
    flashlightActiveRef.current = flashlightActive;
  }, [flashlightActive]);
  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  useEffect(() => {
    wavesTouchedRef.current = wavesTouched;
  }, [wavesTouched]);

  useEffect(() => {
    wavesMissedRef.current = wavesMissed;
  }, [wavesMissed]);

  useEffect(() => {
    waterTimerRef.current = waterTimer;
  }, [waterTimer]);

  useEffect(() => {
    isRoguelikeRef.current = isRoguelike;
  }, [isRoguelike]);

  useEffect(() => {
    roguelikeLevelRef.current = roguelikeLevel;
  }, [roguelikeLevel]);

  useEffect(() => {
    roguelikeWavesToWinRef.current = roguelikeWavesToWin;
  }, [roguelikeWavesToWin]);

  useEffect(() => {
    roguelikeWavesToLoseRef.current = roguelikeWavesToLose;
  }, [roguelikeWavesToLose]);

  useEffect(() => {
    wavesRef.current = waves;
  }, [waves]);

  useEffect(() => {
    unlockedAbilitiesRef.current = unlockedAbilities;
  }, [unlockedAbilities]);

  useEffect(() => {
    selectedAbilitiesRef.current = selectedAbilities;
  }, [selectedAbilities]);

  useEffect(() => {
    usedBeachEffectsRef.current = usedBeachEffects;
  }, [usedBeachEffects]);

  useEffect(() => {
    permanentUpgradesRef.current = permanentUpgrades;
  }, [permanentUpgrades]);

  // Beach Bonanza refs sync
  useEffect(() => {
    runTypeRef.current = runType;
  }, [runType]);
  
  useEffect(() => {
    currentBeachRef.current = currentBeach;
  }, [currentBeach]);
  
  useEffect(() => {
    beachLevelRef.current = beachLevel;
  }, [beachLevel]);

  // Sync footTypeRef with footType state
  useEffect(() => {
    footTypeRef.current = footType;
  }, [footType]);

  // Helper to check if ability is unlocked in roguelike (some are roguelike-only)
  const isAbilityUnlocked = useCallback((type: AbilityType): boolean => {
    // These abilities are only available in roguelike mode
    const roguelikeOnlyAbilities: AbilityType[] = ["crystalBall", "slowdown", "waveMagnet", "waveSurfer", "towelOff", "doubleDip", "jumpAround"];
    if (roguelikeOnlyAbilities.includes(type) && !isRoguelike) return false;
    if (!isRoguelike) return true;
    return unlockedAbilities.some((a) => a.type === type);
  }, [isRoguelike, unlockedAbilities]);

  // Check if ability is selected for current level (only matters when >4 abilities unlocked)
  const isAbilitySelected = useCallback((type: AbilityType): boolean => {
    // In roguelike with >4 abilities, only selected abilities are usable
    if (isRoguelike && unlockedAbilities.length > 4) {
      return selectedAbilities.includes(type);
    }
    // Otherwise, all unlocked abilities are available
    return isAbilityUnlocked(type);
  }, [isRoguelike, unlockedAbilities.length, selectedAbilities, isAbilityUnlocked]);

  // Get the key binding for an ability (only if selected)
  const getAbilityKey = useCallback((type: AbilityType): string | null => {
    const index = selectedAbilities.indexOf(type);
    if (index >= 0 && index < 4) {
      return ABILITY_KEYS[index];
    }
    // If not using selection system (<=4 abilities), use all unlocked
    if (unlockedAbilities.length <= 4) {
      const unlockedIndex = unlockedAbilities.findIndex(a => a.type === type);
      if (unlockedIndex >= 0 && unlockedIndex < 4) {
        return ABILITY_KEYS[unlockedIndex];
      }
    }
    return null;
  }, [selectedAbilities, unlockedAbilities]);

  // Get ability duration with roguelike bonuses
  const getAbilityDuration = useCallback((type: AbilityType): number => {
    if (!isRoguelike) {
      switch (type) {
        case "wetsuit": return WETSUIT_DURATION;
        case "superTap": return SUPER_TAP_USES;
        case "ghostToe": return GHOST_TOE_DURATION;
      }
    }
    
    const ability = unlockedAbilities.find((a) => a.type === type);
    if (!ability) return 0;
    
    // Boss Quick Run / Boss Hell Run: all abilities use level 3 power (2 upgrades worth)
    if (runType === "bossQuickRun" || runType === "bossHellRun") {
      return ROGUELIKE_BASE_DURATIONS[type] + (UPGRADE_INCREMENTS_MS[type] * BOSS_QUICK_RUN_ABILITY_UPGRADES);
    }
    
    // Use individual base durations + upgrade increments
    return ROGUELIKE_BASE_DURATIONS[type] + (UPGRADE_INCREMENTS_MS[type] * ability.upgradeCount);
  }, [isRoguelike, unlockedAbilities, runType]);

  // Get wetsuit water limit (how long it can absorb water)
  const getWetsuitWaterLimit = useCallback((): number => {
    if (!isRoguelike) {
      return WETSUIT_WATER_LIMIT;
    }
    
    const ability = unlockedAbilities.find((a) => a.type === "wetsuit");
    if (!ability) return 0;
    
    // Boss Quick Run / Boss Hell Run: use level 3 power (2 upgrades worth)
    if (runType === "bossQuickRun" || runType === "bossHellRun") {
      return ROGUELIKE_BASE_WETSUIT_WATER_LIMIT + (WETSUIT_WATER_LIMIT_INCREMENT * BOSS_QUICK_RUN_ABILITY_UPGRADES);
    }
    
    return ROGUELIKE_BASE_WETSUIT_WATER_LIMIT + (WETSUIT_WATER_LIMIT_INCREMENT * ability.upgradeCount);
  }, [isRoguelike, unlockedAbilities, runType]);
  
  // Get ability cooldown (20s for Boss Quick Run / Boss Hell Run, 60s for other modes)
  const getAbilityCooldown = useCallback((): number => {
    if (runType === "bossQuickRun" || runType === "bossHellRun") {
      return BOSS_QUICK_RUN_COOLDOWN;
    }
    return 60000; // Standard 60 second cooldown
  }, [runType]);

  // Calculate current difficulty settings based on waves touched (for scaling modes)
  const getCurrentSettings = useCallback(() => {
    // Boss Quick Run / Boss Hell Run uses fixed level 20 settings
    if (runTypeRef.current === "bossQuickRun" || runTypeRef.current === "bossHellRun") {
      return BOSS_QUICK_RUN_SETTINGS;
    }
    
    if (isRoguelikeRef.current) {
      return getRoguelikeLevelSettings(roguelikeLevelRef.current).settings;
    }
    
    const diff = difficultyRef.current as Exclude<WavesDifficulty, "roguelike">;
    const settings = DIFFICULTY_SETTINGS[diff];
    const touched = wavesTouchedRef.current;
    
    if (!settings.scaling) {
      return settings;
    }
    
    // Calculate how many times we've hit a threshold
    const thresholds = Math.floor(touched / settings.scaling.everyNWaves);
    const scalingFactor = Math.pow(1 - settings.scaling.multiplier, thresholds);
    
    return {
      ...settings,
      waveSpawnInterval: Math.round(settings.waveSpawnInterval * scalingFactor),
      wavePeakDuration: Math.round(settings.wavePeakDuration * scalingFactor),
    };
  }, []);

  // Initialize and manage background music
  useEffect(() => {
    audioRef.current = new Audio(import.meta.env.BASE_URL + "audio/waves-anguilla.m4a");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Play/pause music based on game state
  useEffect(() => {
    if (audioRef.current) {
      if (gameState === "playing") {
        audioRef.current.play().catch(() => {});
      } else if (gameState === "gameOver" || gameState === "roguelikeGameOver") {
        audioRef.current.pause();
      }
    }
  }, [gameState]);

  // Level complete transition guard - show celebration for 800ms before upgrade screen
  useEffect(() => {
    if (gameState === "levelComplete") {
      setLevelCompleteReady(false);
      const timer = setTimeout(() => {
        setLevelCompleteReady(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setLevelCompleteReady(false);
    }
  }, [gameState]);

  // Game over transition guard - prevent accidental taps for 800ms
  useEffect(() => {
    if (gameState === "roguelikeGameOver") {
      setGameOverReady(false);
      const timer = setTimeout(() => {
        setGameOverReady(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setGameOverReady(false);
    }
  }, [gameState]);

  // Keep refs in sync
  useEffect(() => {
    feetPositionRef.current = feetPosition;
  }, [feetPosition]);

  useEffect(() => {
    isTappingRef.current = isTapping;
  }, [isTapping]);

  useEffect(() => {
    invincibleRef.current = invincible;
  }, [invincible]);

  useEffect(() => {
    superTapRef.current = superTap;
  }, [superTap]);

  useEffect(() => {
    ghostToeRef.current = ghostToe;
  }, [ghostToe]);

  useEffect(() => {
    crystalBallRef.current = crystalBall;
  }, [crystalBall]);

  useEffect(() => {
    slowdownRef.current = slowdown;
  }, [slowdown]);

  useEffect(() => {
    waveMagnetRef.current = waveMagnet;
  }, [waveMagnet]);

  useEffect(() => {
    waveSurferRef.current = waveSurfer;
    // Note: We intentionally do NOT clear waveSurferQueuedTeleportRef when ability deactivates
    // This allows a pending teleport to execute on the next wave spawn even after the ability ends
  }, [waveSurfer]);

  useEffect(() => {
    towelOffRef.current = towelOff;
  }, [towelOff]);

  useEffect(() => {
    doubleDipRef.current = doubleDip;
  }, [doubleDip]);

  useEffect(() => {
    jumpAroundRef.current = jumpAround;
  }, [jumpAround]);

  useEffect(() => {
    waveSurferShieldRef.current = waveSurferShield;
  }, [waveSurferShield]);

  useEffect(() => {
    showTimerTutorialRef.current = showTimerTutorial;
  }, [showTimerTutorial]);

  useEffect(() => {
    showWavesTutorialRef.current = showWavesTutorial;
  }, [showWavesTutorial]);

  useEffect(() => {
    showBossBeachPopupRef.current = showBossBeachPopup;
  }, [showBossBeachPopup]);

  useEffect(() => {
    currentBeachEffectRef.current = currentBeachEffect;
    // Gummy Beach: force stop tapping when effect becomes active
    if (currentBeachEffect === "gummyBeach") {
      setIsTapping(false);
    }
  }, [currentBeachEffect]);

  useEffect(() => {
    fishNetStuckRef.current = fishNetStuck;
  }, [fishNetStuck]);

  // Removed old velocity sync - now using gear system

  useEffect(() => {
    movementModeRef.current = movementMode;
  }, [movementMode]);
  const getToeRow = useCallback(() => {
    // Base toe extension from tapping
    // Tap Dancer permanent upgrade: +15% toe tap distance per upgrade
    const tapDancerMultiplier = 1 + (permanentUpgrades.tapDancer * 0.15);
    let baseToeExtension = isTapping ? 0.5 * tapDancerMultiplier : 0;
    
    // Gummy Beach effect: scales across levels 1-4 (60% → 50% → 40% → 30%), boss = 0%
    if (currentBeachEffect === "gummyBeach") {
      const isReducedGummy = runType === "beachBonanza" && beachLevel < 5;
      if (isReducedGummy) {
        const levelMultipliers = [0.60, 0.50, 0.40, 0.30];
        baseToeExtension *= levelMultipliers[beachLevel - 1] || 0.30;
      } else {
        baseToeExtension = 0; // Boss level: no toe tap
      }
    }
    
    // Super tap multiplies the extension (also affected by Gummy Beach)
    const toeExtension = superTap.active ? baseToeExtension * SUPER_TAP_MULTIPLIER : baseToeExtension;
    return feetPosition - toeExtension;
  }, [feetPosition, isTapping, superTap.active, permanentUpgrades.tapDancer, currentBeachEffect, runType, beachLevel]);

  // Get effective toe row including ghost toe extension
  const getEffectiveToeRow = useCallback(() => {
    const baseToeRow = getToeRow();
    return ghostToe.active ? baseToeRow - GHOST_TOE_EXTENSION : baseToeRow;
  }, [getToeRow, ghostToe.active]);

  // Helper to set beach effect - updates both state and ref synchronously
  const setBeachEffectWithRef = useCallback((effect: BeachEffectType | null) => {
    currentBeachEffectRef.current = effect;
    setCurrentBeachEffect(effect);
    // Gummy Beach: force stop tapping when effect becomes active
    if (effect === "gummyBeach") {
      setIsTapping(false);
    }
  }, []);

  // Helper to check if current level uses reduced beach effects (Beach Bonanza levels 1-4)
  const isReducedEffectLevel = useCallback((): boolean => {
    return runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
  }, []);

  // Helper to generate two random beach options for selection
  const generateBeachOptions = useCallback((): BeachEffectType[] => {
    const allBeaches: BeachEffectType[] = [
      "quicksand", "spikeWaves", "gummyBeach", "coldWater", "crazyWaves",
      "fishNet", "nighttime", "roughWaters", "heavySand", "busyBeach"
    ];
    
    // Filter out beaches already completed this run (until all are done)
    let availableBeaches = allBeaches.filter(b => !completedBeaches.includes(b));
    
    // If all beaches have been completed, reset the pool
    if (availableBeaches.length < 2) {
      availableBeaches = allBeaches;
    }
    
    // Shuffle and pick 2
    const shuffled = [...availableBeaches].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  }, [completedBeaches]);

  const isTouchingWater = useCallback(() => {
    const toeRow = getToeRow();
    const heelRow = toeRow + 2; // Feet are 2 pixels tall

    // Wave water area on the beach spans [OCEAN_HEIGHT, wave.row + 1)
    // Foot spans [toeRow, heelRow)
    // They overlap if the segments intersect.
    return waves.some((wave) => toeRow < wave.row + 1 && heelRow > OCEAN_HEIGHT);
  }, [waves, getToeRow]);

  // Clean up old wave surfer particles after animation completes
  useEffect(() => {
    if (waveSurferParticles.length === 0) return;
    const timeout = setTimeout(() => {
      const now = Date.now();
      setWaveSurferParticles(prev => prev.filter(p => now - p.spawnTime < 600));
    }, 600);
    return () => clearTimeout(timeout);
  }, [waveSurferParticles]);

  // Clear mobile movement intervals when not playing
  useEffect(() => {
    if (gameState !== "playing") {
      if (moveUpIntervalRef.current) {
        clearInterval(moveUpIntervalRef.current);
        moveUpIntervalRef.current = null;
      }
      if (moveDownIntervalRef.current) {
        clearInterval(moveDownIntervalRef.current);
        moveDownIntervalRef.current = null;
      }
      keyHeldRef.current = { up: false, down: false };
    }
  }, [gameState]);
  
  // Game loop with no external dependencies - reads from refs
  useEffect(() => {
    if (gameState !== "playing") return;

    lastTimeRef.current = 0;
    waveSpawnTimerRef.current = 0;
    waveUpdateTimerRef.current = 0;

    const gameLoop = (timestamp: number) => {
      // Pause game loop while tutorial, boss beach popup, or level celebration is showing
      if (showTimerTutorialRef.current || showWavesTutorialRef.current || showBossBeachPopupRef.current || levelCelebratingRef.current) {
        lastTimeRef.current = timestamp;
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Update momentum-based movement (if in momentum mode)
      if (movementModeRef.current === "momentum") {
        updateMomentumPosition(deltaTime);
      }

      // Get current difficulty settings (may change during game for scaling modes)
      const currentSettings = getCurrentSettings();
      const maxMissed = isRoguelikeRef.current ? roguelikeWavesToLoseRef.current : 10;
      
      // Apply slowdown effect: waves move 60% slower, peak duration 60% longer
      const slowdownMultiplier = slowdownRef.current.active ? 2.5 : 1; // 2.5x = 60% slower (40% of normal speed)
      
      // Rough Waters: scales across levels 1-4 (20%/10% → 30%/20% → 40%/30% → 50%/40%), boss = 75%/50%
      const isRoughWaters = currentBeachEffectRef.current === "roughWaters";
      const isReducedRoughWaters = isRoughWaters && runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
      let roughWatersSpeedMultiplier = 1;
      let roughWatersPeakMultiplier = 1;
      if (isRoughWaters) {
        if (isReducedRoughWaters) {
          // Speed: 20%/30%/40%/50% faster → multipliers: 1/1.20, 1/1.30, 1/1.40, 1/1.50
          const levelSpeedMultipliers = [1/1.20, 1/1.30, 1/1.40, 1/1.50];
          // Peak: 10%/20%/30%/40% shorter
          const levelPeakMultipliers = [0.90, 0.80, 0.70, 0.60];
          roughWatersSpeedMultiplier = levelSpeedMultipliers[beachLevelRef.current - 1] || 1/1.50;
          roughWatersPeakMultiplier = levelPeakMultipliers[beachLevelRef.current - 1] || 0.60;
        } else {
          roughWatersSpeedMultiplier = 0.571; // 1/1.75 = 75% faster
          roughWatersPeakMultiplier = 0.5; // 50% shorter
        }
      }
      
      const effectiveWaveSpeed = currentSettings.waveSpeed * slowdownMultiplier * roughWatersSpeedMultiplier;
      const effectivePeakDuration = currentSettings.wavePeakDuration * slowdownMultiplier * roughWatersPeakMultiplier;

      // Spawn new waves based on difficulty (slowdown also affects spawn rate)
      const effectiveSpawnInterval = currentSettings.waveSpawnInterval * slowdownMultiplier;
      waveSpawnTimerRef.current += deltaTime;
      if (waveSpawnTimerRef.current > effectiveSpawnInterval) {
        const startRow = OCEAN_HEIGHT - 10 + Math.floor(Math.random() * 3); // rows 20, 21, or 22
        // Wave variance: ±2 normally, ±3 after level 20, ±4 after level 40 in roguelike
        // Boss Hell Run uses ±3 base variance
        let baseVariance = 2;
        if (runTypeRef.current === "bossHellRun") {
          baseVariance = BOSS_HELL_RUN_BASE_VARIANCE;
        } else if (isRoguelikeRef.current) {
          baseVariance = roguelikeLevelRef.current > 40 ? 4 : roguelikeLevelRef.current > 20 ? 3 : 2;
        }
        
        // Crazy Waves: scales across levels 1-5 (1.2x → 1.4x → 1.6x → 2x → 3x)
        const isCrazyWaves = currentBeachEffectRef.current === "crazyWaves";
        let crazyWavesMultiplier = 1;
        if (isCrazyWaves) {
          const levelMultipliers = [1.2, 1.4, 1.6, 2, 3];
          const level = runTypeRef.current === "beachBonanza" ? beachLevelRef.current : 5;
          crazyWavesMultiplier = levelMultipliers[level - 1] || 3;
        }
        const waveVariance = isCrazyWaves 
          ? Math.floor(baseVariance * crazyWavesMultiplier)
          : baseVariance;
        
        // maxReach within variance of previous wave, clamped to valid beach range (30-40)
        let minReach = Math.max(OCEAN_HEIGHT, lastMaxReachRef.current - waveVariance);
        let maxReachRange = Math.min(OCEAN_HEIGHT + 10, lastMaxReachRef.current + waveVariance);
        
        let maxReach: number;
        if (isCrazyWaves) {
          // Crazy Waves: must be at least baseVariance away from previous wave
          // Create two valid ranges: far below or far above the previous peak
          const farBelowMin = Math.max(OCEAN_HEIGHT, lastMaxReachRef.current - waveVariance);
          const farBelowMax = Math.max(OCEAN_HEIGHT, lastMaxReachRef.current - baseVariance);
          const farAboveMin = Math.min(OCEAN_HEIGHT + 10, lastMaxReachRef.current + baseVariance);
          const farAboveMax = Math.min(OCEAN_HEIGHT + 10, lastMaxReachRef.current + waveVariance);
          
          // Calculate valid positions in each range
          const belowOptions = farBelowMax >= farBelowMin ? farBelowMax - farBelowMin + 1 : 0;
          const aboveOptions = farAboveMax >= farAboveMin ? farAboveMax - farAboveMin + 1 : 0;
          const totalOptions = belowOptions + aboveOptions;
          
          if (totalOptions > 0) {
            const roll = Math.floor(Math.random() * totalOptions);
            if (roll < belowOptions) {
              maxReach = farBelowMin + roll;
            } else {
              maxReach = farAboveMin + (roll - belowOptions);
            }
          } else {
            // Fallback if no valid options (shouldn't happen)
            maxReach = lastMaxReachRef.current;
          }
        } else {
          maxReach = minReach + Math.floor(Math.random() * (maxReachRange - minReach + 1));
        }
        
        lastMaxReachRef.current = maxReach;
        const newWave: Wave = {
          id: waveIdRef.current++,
          row: startRow,
          startRow,
          maxReach,
          phase: "incoming",
          touched: false,
          peakTimer: 0,
        };
        setWaves((prev) => [...prev, newWave]);
        waveSpawnTimerRef.current = 0;
        
        // Wave Surfer: execute queued teleport if one is pending
        // Note: We execute even if the ability is no longer active - the teleport was earned while active
        if (waveSurferQueuedTeleportRef.current) {
          const oldRow = feetPositionRef.current;
          const targetRow = Math.min(newWave.maxReach + 1, TOTAL_HEIGHT - 1);
          setFeetPosition(targetRow);
          feetPositionRef.current = targetRow;
          // Reset momentum gear to neutral so player stays in position after teleport
          if (movementModeRef.current === "momentum") {
            setMomentumGear(0);
            momentumGearRef.current = 0;
          }
          // Spawn teleport trail particles
          setWaveSurferParticles(prev => [...prev, {
            id: Date.now(),
            startRow: oldRow,
            endRow: targetRow,
            spawnTime: Date.now()
          }]);
          
          // Calculate immunity NOW when we know the actual destination
          // This ensures immunity covers the time until all waves clear our landing spot
          const currentSettings = getCurrentSettings();
          const slowdownMultiplier = slowdownRef.current.active ? 2.5 : 1;
          const isRoughWaters = currentBeachEffectRef.current === "roughWaters";
          const roughWatersSpeedMultiplier = isRoughWaters ? 0.571 : 1;
          const roughWatersPeakMultiplier = isRoughWaters ? 0.5 : 1;
          const effectiveSpeed = currentSettings.waveSpeed * slowdownMultiplier * roughWatersSpeedMultiplier;
          const effectivePeak = currentSettings.wavePeakDuration * slowdownMultiplier * roughWatersPeakMultiplier;
          
          let maxImmunityNeeded = 0;
          // Include existing waves plus the new wave we just spawned
          const allWaves = [...wavesRef.current, newWave];
          for (const wave of allWaves) {
            // Skip the wave we're teleporting to
            if (wave.id === newWave.id) continue;
            
            if (wave.maxReach >= targetRow) {
              let timeUntilClear = 0;
              
              if (wave.phase === "incoming") {
                const rowsToPeak = wave.maxReach - wave.row;
                const rowsToRecede = wave.maxReach - targetRow + 1;
                timeUntilClear = (rowsToPeak * effectiveSpeed) + effectivePeak + (rowsToRecede * effectiveSpeed);
              } else if (wave.phase === "peak") {
                const remainingPeak = Math.max(0, effectivePeak - wave.peakTimer);
                const rowsToRecede = wave.maxReach - targetRow + 1;
                timeUntilClear = remainingPeak + (rowsToRecede * effectiveSpeed);
              } else if (wave.phase === "outgoing" && wave.row >= targetRow) {
                const rowsToRecede = wave.row - targetRow + 1;
                timeUntilClear = rowsToRecede * effectiveSpeed;
              }
              
              maxImmunityNeeded = Math.max(maxImmunityNeeded, timeUntilClear);
            }
          }
          
          
          // Extend immunity if destination needs more protection than we have remaining
          // This preserves any immunity already granted when teleport was queued
          setWaveSurferShield(prev => Math.max(prev, maxImmunityNeeded));
          waveSurferQueuedTeleportRef.current = false;
        }
      }

      // Update wave timer based on difficulty wave speed (affected by slowdown)
      waveUpdateTimerRef.current += deltaTime;
      const shouldMoveWaves = waveUpdateTimerRef.current > effectiveWaveSpeed;

      // Auto Toe Tap logic: automatically tap when a wave can be reached
      // Minimum tap duration ensures visual feedback is visible (in ms)
      const AUTO_TAP_MIN_DURATION = 100;
      
      if (autoToeTapRef.current && !isTappingRef.current) {
        const isGummyBeachAutoTap = currentBeachEffectRef.current === "gummyBeach";
        const isGummyBoss = isGummyBeachAutoTap && !(runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5);
        
        // Don't auto-tap if Gummy Beach boss blocks toe tap
        if (!isGummyBoss) {
          const tapDancerMult = 1 + (permanentUpgradesRef.current.tapDancer * 0.15);
          // Calculate what toe row would be if tapping (with super tap if active)
          let potentialToeExtension = 0.5 * tapDancerMult;
          if (isGummyBeachAutoTap) {
            const levelMultipliers = [0.60, 0.50, 0.40, 0.30];
            potentialToeExtension *= levelMultipliers[beachLevelRef.current - 1] || 0.30;
          }
          if (superTapRef.current.active) {
            potentialToeExtension *= SUPER_TAP_MULTIPLIER;
          }
          const potentialToeRow = feetPositionRef.current - potentialToeExtension;
          const potentialEffectiveToeRow = ghostToeRef.current.active ? potentialToeRow - GHOST_TOE_EXTENSION : potentialToeRow;
          const heelRowCheck = potentialToeRow + 2;
          
          // Check if any untouched wave can be reached with a tap
          const canReachUntouchedWave = wavesRef.current.some(wave => 
            !wave.touched && potentialEffectiveToeRow < wave.row + 1 && heelRowCheck > OCEAN_HEIGHT
          );
          
          if (canReachUntouchedWave) {
            setIsTapping(true);
            isTappingRef.current = true;
            autoTapStartTimeRef.current = timestamp;
            setTotalToeTaps(t => t + 1); // Count auto toe taps too
          }
        }
      } else if (autoToeTapRef.current && isTappingRef.current) {
        // Ensure minimum tap duration for visual feedback
        const tapDuration = timestamp - autoTapStartTimeRef.current;
        if (tapDuration < AUTO_TAP_MIN_DURATION) {
          // Keep tapping until minimum duration is met
        } else {
          // Auto-release tap when no more untouched waves are reachable
          const isGummyBeachRelease = currentBeachEffectRef.current === "gummyBeach";
          const tapDancerMultRelease = 1 + (permanentUpgradesRef.current.tapDancer * 0.15);
          let currentToeExtension = 0.5 * tapDancerMultRelease;
          if (isGummyBeachRelease && runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5) {
            const levelMultipliers = [0.60, 0.50, 0.40, 0.30];
            currentToeExtension *= levelMultipliers[beachLevelRef.current - 1] || 0.30;
          }
          if (superTapRef.current.active) {
            currentToeExtension *= SUPER_TAP_MULTIPLIER;
          }
          const currentToeRow = feetPositionRef.current - currentToeExtension;
          const currentEffectiveToeRow = ghostToeRef.current.active ? currentToeRow - GHOST_TOE_EXTENSION : currentToeRow;
          const heelRowRelease = currentToeRow + 2;
          
          const stillReachingUntouched = wavesRef.current.some(wave =>
            !wave.touched && currentEffectiveToeRow < wave.row + 1 && heelRowRelease > OCEAN_HEIGHT
          );
          
          if (!stillReachingUntouched) {
            setIsTapping(false);
            isTappingRef.current = false;
          }
        }
      }

      setWaves((prev) => {
        // Gummy Beach: boss blocks toe tap entirely, non-boss reduces it
        const isGummyBeachActive = currentBeachEffectRef.current === "gummyBeach";
        const isGummyBoss = isGummyBeachActive && (runTypeRef.current !== "beachBonanza" || beachLevelRef.current >= 5);
        // Calculate toe position with super tap multiplier
        // Tap Dancer permanent upgrade: +15% toe tap distance per upgrade
        const tapDancerMultiplier = 1 + (permanentUpgradesRef.current.tapDancer * 0.15);
        let baseToeExtension = isTappingRef.current ? 0.5 * tapDancerMultiplier : 0;
        // Apply Gummy Beach restrictions to match visual rendering
        if (isGummyBeachActive) {
          if (isGummyBoss) {
            baseToeExtension = 0; // Boss level: no toe tap
          } else {
            // Reduced toe extension for non-boss gummy beach (60% → 30%)
            const levelMultipliers = [0.60, 0.50, 0.40, 0.30];
            baseToeExtension *= levelMultipliers[beachLevelRef.current - 1] || 0.30;
          }
        }
        const toeExtension = superTapRef.current.active ? baseToeExtension * SUPER_TAP_MULTIPLIER : baseToeExtension;
        const baseToeRow = feetPositionRef.current - toeExtension;
        // Ghost toe extends detection range but doesn't affect water timer
        const effectiveToeRow = ghostToeRef.current.active ? baseToeRow - GHOST_TOE_EXTENSION : baseToeRow;
        const heelRow = baseToeRow + 2; // Feet are 2 pixels tall
        let newTouches = 0;

        const updated = prev
          .map((wave) => {
            let newRow = wave.row;
            let newPhase = wave.phase;
            let newPeakTimer = wave.peakTimer;
            let touched = wave.touched;
            let magnetAffected = wave.magnetAffected || false;
            let effectiveMaxReach = wave.maxReach;

            if (wave.phase === "peak") {
              newPeakTimer = wave.peakTimer + deltaTime;
              if (newPeakTimer >= effectivePeakDuration) {
                newPhase = "outgoing";
              }
            } else if (shouldMoveWaves) {
              if (wave.phase === "incoming") {
                newRow = wave.row + 1;
                
              // Wave Magnet: when active, constrain waves to peak within 1 row of player
              // Can be either closer or further from shore
              if (waveMagnetRef.current.active && !magnetAffected) {
                const playerRow = feetPositionRef.current;
                // Constrain peak to be within 1 row of player (-1, 0, or +1 offset)
                const randomOffset = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1 (integer)
                effectiveMaxReach = Math.floor(playerRow) + randomOffset;
                // Clamp to valid beach range
                effectiveMaxReach = Math.max(OCEAN_HEIGHT, Math.min(OCEAN_HEIGHT + BEACH_HEIGHT - 2, effectiveMaxReach));
                magnetAffected = true;
                // Update lastMaxReachRef so the next wave spawns relative to the magnetized peak
                lastMaxReachRef.current = effectiveMaxReach;
              }
                
                if (newRow >= effectiveMaxReach) {
                  newPhase = "peak";
                  newPeakTimer = 0;
                }
              } else if (wave.phase === "outgoing") {
                newRow = wave.row - 1;
              }
            }

            // Check touch - count it if ANY part of the foot (including ghost extension) overlaps wave/water.
            // Wave area spans [OCEAN_HEIGHT, waveRow + 1). Foot spans [effectiveToeRow, heelRow).
            if (!touched && effectiveToeRow < newRow + 1 && heelRow > OCEAN_HEIGHT) {
              touched = true;
              // Secret dev ability: next wave counts as 20
              if (superWaveActiveRef.current) {
                newTouches += 20;
                superWaveActiveRef.current = false;
                setSuperWaveActive(false);
              } else {
                // Double Dip: waves count as 2
                newTouches += doubleDipRef.current.active ? 2 : 1;
              }
            }

            return {
              ...wave,
              row: newRow,
              maxReach: magnetAffected ? effectiveMaxReach : wave.maxReach,
              phase: newPhase,
              peakTimer: newPeakTimer,
              touched,
              magnetAffected,
            };
          })
          .filter((wave) => {
            // Remove waves that have left the beach (returned to ocean)
            if (wave.phase === "outgoing" && wave.row < OCEAN_HEIGHT) {
              // Count as missed if not touched
                if (!wave.touched) {
                setWavesMissed((prev) => {
                  const newMissed = prev + 1;
                  // For boss runs, check against the FIXED max misses constant, not the per-level remaining
                  const isBossRun = runTypeRef.current === "bossQuickRun" || runTypeRef.current === "bossHellRun";
                  const totalMissedForCheck = isBossRun 
                    ? (bossQuickRunTotalMissesRef.current + newMissed)
                    : newMissed;
                  // Use fixed max for boss runs to avoid mismatch with per-level remaining calculation
                  const maxMissedForCheck = isBossRun
                    ? (runTypeRef.current === "bossHellRun" ? BOSS_HELL_RUN_MAX_MISSES : BOSS_QUICK_RUN_MAX_MISSES)
                    : maxMissed;
                  if (totalMissedForCheck >= maxMissedForCheck) {
                    setGameOverReason("missed");
                    setGameState(isRoguelikeRef.current ? "roguelikeGameOver" : "gameOver");
                  }
                  return newMissed;
                });
              }
              return false;
            }
            return true;
          });

        if (newTouches > 0) {
          // Wave Surfer: teleport to next UNTOUCHED incoming wave when touching a wave
          if (waveSurferRef.current.active) {
            // Find all untouched incoming waves, prioritize by highest currentRow (closest to peaking)
            const untouchedIncomingWaves = updated
              .filter(w => w.phase === "incoming" && !w.touched)
              .sort((a, b) => b.row - a.row); // Highest row first = closest to peak
            
            const targetWave = untouchedIncomingWaves[0];
            if (targetWave) {
              // Capture old position before teleporting
              const oldRow = feetPositionRef.current;
                // Teleport CLOSE to this wave's peak position (within ±0.5 row)
                const randomOffset = (Math.random() - 0.5); // -0.5 to +0.5
                const targetRow = Math.min(Math.max(targetWave.maxReach + 1 + randomOffset, OCEAN_HEIGHT), TOTAL_HEIGHT - 1);
              setFeetPosition(targetRow);
              feetPositionRef.current = targetRow;
              // Reset momentum gear to neutral so player stays in position after teleport
              if (movementModeRef.current === "momentum") {
                setMomentumGear(0);
                momentumGearRef.current = 0;
              }
              // Spawn teleport trail particles
              setWaveSurferParticles(prev => [...prev, {
                id: Date.now(),
                startRow: oldRow,
                endRow: targetRow,
                spawnTime: Date.now()
              }]);
              
              // Calculate dynamic immunity: find the wave that will take longest to recede past our landing spot
              // EXCLUDE the target wave we're teleporting to - we only need immunity from existing waves
              const currentSettings = getCurrentSettings();
              const slowdownMultiplier = slowdownRef.current.active ? 2.5 : 1;
              const isRoughWaters = currentBeachEffectRef.current === "roughWaters";
              const roughWatersSpeedMultiplier = isRoughWaters ? 0.571 : 1;
              const roughWatersPeakMultiplier = isRoughWaters ? 0.5 : 1;
              const effectiveSpeed = currentSettings.waveSpeed * slowdownMultiplier * roughWatersSpeedMultiplier;
              const effectivePeak = currentSettings.wavePeakDuration * slowdownMultiplier * roughWatersPeakMultiplier;
              
              // Check all waves EXCEPT the target wave to find max time until they recede past targetRow
              let maxImmunityNeeded = 0;
              
              for (const wave of updated) {
                // Skip the wave we're teleporting to - we don't need immunity from it
                if (wave.id === targetWave.id) continue;
                
                // Only consider waves that could affect us (their peak reaches our position)
                if (wave.maxReach >= targetRow) {
                  let timeUntilClear = 0;
                  
                  if (wave.phase === "incoming") {
                    // Time to reach peak + peak duration + time to recede past targetRow
                    const rowsToPeak = wave.maxReach - wave.row;
                    const rowsToRecede = wave.maxReach - targetRow + 1;
                    timeUntilClear = (rowsToPeak * effectiveSpeed) + effectivePeak + (rowsToRecede * effectiveSpeed);
                  } else if (wave.phase === "peak") {
                    // Remaining peak time + time to recede past targetRow
                    const remainingPeak = Math.max(0, effectivePeak - wave.peakTimer);
                    const rowsToRecede = wave.maxReach - targetRow + 1;
                    timeUntilClear = remainingPeak + (rowsToRecede * effectiveSpeed);
                  } else if (wave.phase === "outgoing" && wave.row >= targetRow) {
                    // Time to recede past targetRow
                    const rowsToRecede = wave.row - targetRow + 1;
                    timeUntilClear = rowsToRecede * effectiveSpeed;
                  }
                  
                  maxImmunityNeeded = Math.max(maxImmunityNeeded, timeUntilClear);
                }
              }
              
              
              setWaveSurferShield(prev => Math.max(prev, maxImmunityNeeded));
              // Clear any queued teleport since we just teleported
              waveSurferQueuedTeleportRef.current = false;
            } else {
              // No untouched incoming wave available - queue the teleport for when one spawns
              // Start immunity NOW for current position - will be extended when teleport executes
              const currentSettings = getCurrentSettings();
              const slowdownMultiplier = slowdownRef.current.active ? 2.5 : 1;
              const isRoughWaters = currentBeachEffectRef.current === "roughWaters";
              const roughWatersSpeedMultiplier = isRoughWaters ? 0.571 : 1;
              const roughWatersPeakMultiplier = isRoughWaters ? 0.5 : 1;
              const effectiveSpeed = currentSettings.waveSpeed * slowdownMultiplier * roughWatersSpeedMultiplier;
              const effectivePeak = currentSettings.wavePeakDuration * slowdownMultiplier * roughWatersPeakMultiplier;
              
              // Calculate immunity based on current waves and current feet position
              // Note: When queuing, we also add time for next wave spawn since we'll teleport there
              const effectiveSpawnInterval = currentSettings.waveSpawnInterval * slowdownMultiplier;
              const currentFeet = feetPositionRef.current;
              const isSpikeWaves = currentBeachEffectRef.current === "spikeWaves";
              let maxImmunityNeeded = 0;
              
              for (const wave of updated) {
                // For Spike Waves, spikes are at wave.row + 1, so we need immunity until spikes recede
                // Spikes hit if wave.row + 1 >= currentFeet (approximately)
                const waveAffectsPosition = isSpikeWaves 
                  ? (wave.row + 1.5 >= currentFeet || wave.maxReach >= currentFeet)
                  : (wave.maxReach >= currentFeet);
                  
                if (waveAffectsPosition) {
                  let timeUntilClear = 0;
                  
                  if (wave.phase === "incoming") {
                    const rowsToPeak = wave.maxReach - wave.row;
                    const rowsToRecede = wave.maxReach - currentFeet + 1;
                    // For spikes, add extra row since spike extends beyond water
                    const spikeExtra = isSpikeWaves ? 1 : 0;
                    timeUntilClear = (rowsToPeak * effectiveSpeed) + effectivePeak + ((rowsToRecede + spikeExtra) * effectiveSpeed);
                  } else if (wave.phase === "peak") {
                    const remainingPeak = Math.max(0, effectivePeak - wave.peakTimer);
                    const rowsToRecede = wave.maxReach - currentFeet + 1;
                    const spikeExtra = isSpikeWaves ? 1 : 0;
                    timeUntilClear = remainingPeak + ((rowsToRecede + spikeExtra) * effectiveSpeed);
                  } else if (wave.phase === "outgoing") {
                    // For spikes, check if spike zone (wave.row + 1) still reaches us
                    const spikeRow = wave.row + 1;
                    if (spikeRow >= currentFeet || wave.row >= currentFeet) {
                      const rowsToRecede = Math.max(wave.row, spikeRow) - currentFeet + 1;
                      timeUntilClear = rowsToRecede * effectiveSpeed;
                    }
                  }
                  
                  maxImmunityNeeded = Math.max(maxImmunityNeeded, timeUntilClear);
                }
              }
              
              // For queued teleports, add immunity for the next wave cycle too
              // since we'll be teleporting to wherever that wave peaks
              const estimatedTargetRow = currentFeet; // Best guess until we know actual destination
              const rowsFromOceanToTarget = estimatedTargetRow - OCEAN_HEIGHT;
              const nextWaveImmunity = effectiveSpawnInterval + (rowsFromOceanToTarget * effectiveSpeed) + effectivePeak + effectiveSpeed;
              maxImmunityNeeded = Math.max(maxImmunityNeeded, nextWaveImmunity);
              
              setWaveSurferShield(prev => Math.max(prev, maxImmunityNeeded));
              waveSurferQueuedTeleportRef.current = true;
            }
          }
          setWavesTouched((p) => {
            const newTotal = p + newTouches;
            // Check for roguelike level win condition
            if (isRoguelikeRef.current && newTotal >= roguelikeWavesToWinRef.current) {
              setRoguelikeTotalWaves((prev) => prev + newTotal);
              
              // Calculate level score
              const waterTimeSeconds = waterTimerRef.current / 1000;
              const missedWavesRemaining = roguelikeWavesToLoseRef.current - wavesMissedRef.current;
              let newLevelScore: number;
              
              if (runTypeRef.current === "bossQuickRun") {
                // Boss Quick Run: 10 * level * (seconds remaining + misses remaining)
                newLevelScore = Math.round(10 * roguelikeLevelRef.current * (waterTimeSeconds + missedWavesRemaining));
              } else {
                // Standard scoring: +4 per wave touched, +10 per second remaining on water timer, +10 per missed wave remaining
                newLevelScore = Math.round((newTotal * 4) + (waterTimeSeconds * 10) + (missedWavesRemaining * 10));
              }
              setLevelScore(newLevelScore);
              setTotalScore((prev) => prev + newLevelScore);
              
              // Start celebration overlay immediately
              setLevelCelebrating(true);
              
              // Delay transition to let player see the final wave touch (1 second payoff moment)
              setTimeout(() => {
                setLevelCelebrating(false);
                // Beach Bonanza: handle beach level progression
                if (runTypeRef.current === "beachBonanza") {
                  const currentBeachLevel = beachLevelRef.current;
                  if (currentBeachLevel >= 5) {
                    // Completed the boss level - mark beach as complete and show selection
                    const completedBeach = currentBeachRef.current;
                    // Preserve the beach name for display on the upgrade screen
                    setCompletedBeachForDisplay(completedBeach);
                    if (completedBeach) {
                      setCompletedBeaches(prev => [...prev, completedBeach]);
                    }
                    // Generate new beach options for next selection
                    const allBeaches: BeachEffectType[] = [
                      "quicksand", "spikeWaves", "gummyBeach", "coldWater", "crazyWaves",
                      "fishNet", "nighttime", "roughWaters", "heavySand", "busyBeach"
                    ];
                    const newCompleted = completedBeach ? [...completedBeaches, completedBeach] : completedBeaches;
                    let availableBeaches = allBeaches.filter(b => !newCompleted.includes(b));
                    if (availableBeaches.length < 2) {
                      availableBeaches = allBeaches; // Reset cycle
                      setCompletedBeaches([]);
                    }
                    const shuffled = [...availableBeaches].sort(() => Math.random() - 0.5);
                    setBeachOptions(shuffled.slice(0, 2));
                    setBeachNumber(prev => prev + 1);
                    setBeachLevel(1);
                    beachLevelRef.current = 1;
                    // Go directly to beach selection, then upgrades after
                    setGameState("selectBeach");
                  } else {
                    // Continue to next level of same beach
                    // Preserve the beach name for display on level complete screen
                    setCompletedBeachForDisplay(currentBeachRef.current);
                    setBeachLevel(currentBeachLevel + 1);
                    beachLevelRef.current = currentBeachLevel + 1;
                    setGameState("levelComplete");
                  }
                } else if (runTypeRef.current === "bossQuickRun" || runTypeRef.current === "bossHellRun") {
                  // Boss Quick Run / Boss Hell Run: water timer carries over, total misses accumulate
                  const carryoverTimer = waterTimerRef.current;
                  const missesThisLevel = wavesMissedRef.current;
                  const newTotalMisses = bossQuickRunTotalMissesRef.current + missesThisLevel;
                  setBossQuickRunCarryoverTimer(carryoverTimer);
                  bossQuickRunCarryoverTimerRef.current = carryoverTimer;
                  setBossQuickRunTotalMisses(newTotalMisses);
                  bossQuickRunTotalMissesRef.current = newTotalMisses;
                  setCompletedBeachForDisplay(currentBeachEffectRef.current);
                  
                  // Calculate remaining misses for display and score
                  const maxMissesForRun = runTypeRef.current === "bossHellRun" ? BOSS_HELL_RUN_MAX_MISSES : BOSS_QUICK_RUN_MAX_MISSES;
                  const remainingMisses = maxMissesForRun - newTotalMisses;
                  
                  // Calculate level score for display: 10 * level * (seconds remaining + misses remaining)
                  const waterTimeSeconds = carryoverTimer / 1000;
                  const bqrLevelScore = Math.round(10 * roguelikeLevelRef.current * (waterTimeSeconds + remainingMisses));
                  setBossQuickRunLevelScore(bqrLevelScore);
                  
                  const nextLevel = roguelikeLevelRef.current + 1;
                  
                  // Check win condition (completed level 10)
                  if (nextLevel > BOSS_QUICK_RUN_TOTAL_LEVELS) {
                    setRoguelikeLevel(nextLevel);
                    roguelikeLevelRef.current = nextLevel;
                    
                    // Calculate final score (already added level 10 score to totalScore)
                    // Add the final level score to total
                    const highScoreKey = runTypeRef.current === "bossHellRun" ? BOSS_HELL_RUN_HIGH_SCORE_KEY : BOSS_QUICK_RUN_HIGH_SCORE_KEY;
                    setTotalScore(prev => {
                      const finalScore = prev + bqrLevelScore;
                      // Check for high score
                      const currentHighScore = parseInt(localStorage.getItem(highScoreKey) || "0", 10);
                      if (finalScore > currentHighScore) {
                        localStorage.setItem(highScoreKey, finalScore.toString());
                        setBossQuickRunHighScore(finalScore);
                        setBossQuickRunIsNewHighScore(true);
                      } else {
                        setBossQuickRunIsNewHighScore(false);
                      }
                      return finalScore;
                    });
                    
                    // Victory! Show dedicated end screen
                    setGameState("bossQuickRunVictory");
                  } else {
                    // Pick next random boss beach
                    const allBeaches: BeachEffectType[] = [
                      "quicksand", "spikeWaves", "gummyBeach", "coldWater", "crazyWaves",
                      "fishNet", "nighttime", "roughWaters", "heavySand", "busyBeach"
                    ];
                    const available = allBeaches.filter(b => !bossQuickRunUsedBeaches.includes(b));
                    const shuffled = [...available].sort(() => Math.random() - 0.5);
                    const nextBeach = shuffled[0];
                    setBossQuickRunNextBeach(nextBeach);
                    setBossQuickRunUsedBeaches(prev => [...prev, nextBeach]);
                    
                    // Show level complete screen with score before continuing
                    setGameState("bossQuickRunLevelComplete");
                  }
                } else if (runTypeRef.current === "slayTheWaves") {
                  // Slay the Waves: use custom level complete handler
                  setCompletedBeachForDisplay(currentBeachEffectRef.current);
                  // Award gold based on node type
                  const goldEarned = slayPendingNodeType === "boss" ? GOLD_PER_BOSS : 
                                     slayPendingNodeType === "elite" ? GOLD_PER_ELITE : GOLD_PER_BEACH;
                  setSlayGold(prev => prev + goldEarned);
                  
                  // Get card reward abilities
                  const unlocked = unlockedAbilitiesRef.current.map(a => a.type);
                  const excluded = excludedAbilities;
                  const availableForReward = ALL_ABILITIES.filter(a => !unlocked.includes(a) && !excluded.includes(a));
                  const shuffled = [...availableForReward].sort(() => Math.random() - 0.5);
                  setSlayCardRewardAbilities(shuffled.slice(0, 3));
                  
                  // Increment level
                  setRoguelikeLevel(prev => prev + 1);
                  roguelikeLevelRef.current = roguelikeLevelRef.current + 1;
                  
                  // Show card reward screen if abilities available, otherwise go to map
                  if (availableForReward.length > 0) {
                    setGameState("slayCardReward");
                  } else {
                    setGameState("slayMap");
                  }
                } else {
                  // Standard roguelike: Preserve current beach effect for display
                  setCompletedBeachForDisplay(currentBeachEffectRef.current);
                  // Pre-determine the next boss effect if next level is a boss level
                  const nextLevel = roguelikeLevelRef.current + 1;
                  if (nextLevel % 5 === 0) {
                    let availableEffects = BEACH_EFFECTS
                      .map(e => e.type)
                      .filter(e => !usedBeachEffectsRef.current.includes(e));
                    if (availableEffects.length === 0) {
                      availableEffects = BEACH_EFFECTS.map(e => e.type);
                    }
                    const randomIndex = Math.floor(Math.random() * availableEffects.length);
                    setPendingBeachEffect(availableEffects[randomIndex]);
                  } else {
                    setPendingBeachEffect(null);
                  }
                  setGameState("levelComplete");
                }
              }, 1000); // 1 second delay for payoff moment
            }
            return newTotal;
          });
        }

        // Ghost toe: the extended 0.5 pixel doesn't count against water timer
        // Gummy Beach blocks toe extension
        // Tap Dancer permanent upgrade affects the real toe row too
        const isGummyBeachWater = currentBeachEffectRef.current === "gummyBeach";
        const tapDancerMultiplierWater = 1 + (permanentUpgradesRef.current.tapDancer * 0.15);
        const realToeRow = feetPositionRef.current - ((isTappingRef.current && !isGummyBeachWater) ? 0.5 * tapDancerMultiplierWater : 0);
        
        // Toe Warrior: front 35% of feet (0.7 rows) is immune to water damage
        // For water timer drain, only count as touching if water reaches past the immune zone
        const isToeWarrior = footTypeRef.current === "toeWarrior";
        const vulnerableToeRow = isToeWarrior ? realToeRow + 0.7 : realToeRow; // Push vulnerable zone back by 0.7 rows
        const touching = updated.some((wave) => vulnerableToeRow < wave.row + 1 && heelRow > OCEAN_HEIGHT);
        
        // Jump Around: grant 0.2s immunity when transitioning from dry to wet
        if (touching && !wasTouchingWaterRef.current && jumpAroundRef.current.active) {
          // Just entered water while Jump Around is active - grant shield
          setWaveSurferShield(prev => Math.max(prev, 200)); // 0.2 seconds = 200ms
        }
        wasTouchingWaterRef.current = touching;
        
        // Spike Waves: check if feet touch the spike zone (row below wave crest)
        // Spike zone is at wave.row + 1, half-height at top
        let isTouchingSpike = false;
        if (currentBeachEffectRef.current === "spikeWaves") {
          // Check each wave's spike zone
          for (const wave of updated) {
            const spikeRow = wave.row + 1;
            // Spike is half a row tall at the top of spikeRow
            // Foot spans [realToeRow, heelRow)
            // Spike spans [spikeRow, spikeRow + 0.5)
            if (realToeRow < spikeRow + 0.5 && heelRow > spikeRow) {
              isTouchingSpike = true;
              break;
            }
          }
        }
        
        // Track water exposure for wetsuit ability
        if (touching && invincibleRef.current.active) {
          setInvincible((prev) => {
            if (!prev.active) return prev;
            const newExposure = (prev.waterExposure || 0) + deltaTime;
            // Check if water limit exceeded
            if (prev.waterLimit !== undefined && newExposure >= prev.waterLimit) {
              const wetsuitCooldown = (runTypeRef.current === "bossQuickRun" || runTypeRef.current === "bossHellRun") ? BOSS_QUICK_RUN_COOLDOWN : WETSUIT_COOLDOWN;
              return { active: false, cooldownRemaining: wetsuitCooldown, durationRemaining: 0, waterExposure: 0, waterLimit: 0 };
            }
            return { ...prev, waterExposure: newExposure };
          });
        }
        
        // Decrement Wave Surfer shield timer
        if (waveSurferShieldRef.current > 0) {
          setWaveSurferShield((prev) => Math.max(0, prev - deltaTime));
        }
        
        // Only drain timer if touching AND not invincible (wetsuit active) AND no wave surfer shield
        // Cold Water effect: scales across levels 1-4 (1.1x → 1.2x → 1.3x → 1.5x), boss = 2x
        // Spike Waves: touching spikes also drains timer (doesn't count as wave touch)
        const shouldDrain = (touching || isTouchingSpike) && !invincibleRef.current.active && waveSurferShieldRef.current <= 0;
        if (shouldDrain) {
          const isColdWater = currentBeachEffectRef.current === "coldWater";
          const isReducedColdWater = isColdWater && runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
          let coldWaterMultiplier = 2; // Boss level default (100% faster)
          if (isReducedColdWater) {
            const levelMultipliers = [1.2, 1.3, 1.4, 1.6]; // 20%, 30%, 40%, 60% faster
            coldWaterMultiplier = levelMultipliers[beachLevelRef.current - 1] || 1.6;
          }
          const drainMultiplier = isColdWater ? coldWaterMultiplier : 1;
          
          // Spike Waves: scales across levels 1-4 (20% → 30% → 40% → 60%), boss = 100%
          const isSpikeWaves = currentBeachEffectRef.current === "spikeWaves";
          const isReducedSpikeWaves = isSpikeWaves && runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
          let spikeDrainRate = 1; // Boss level = 100%
          if (isTouchingSpike && isReducedSpikeWaves) {
            const levelRates = [0.2, 0.3, 0.4, 0.6];
            spikeDrainRate = levelRates[beachLevelRef.current - 1] || 0.6;
          }
          const spikeDrainMultiplier = isTouchingSpike ? spikeDrainRate : 1;
          
          // Wet Shoes permanent upgrade: 10% slower drain per upgrade
          const wetShoesMultiplier = 1 - (permanentUpgradesRef.current.wetShoes * 0.1);
          // Foot type water drain modifier
          const footTypeDrainMultiplier = FOOT_TYPE_MODIFIERS[footTypeRef.current].drainMultiplier;
          setWaterTimer((prev) => {
            const newTime = prev - deltaTime * drainMultiplier * wetShoesMultiplier * spikeDrainMultiplier * footTypeDrainMultiplier;
            if (newTime <= 0) {
              setGameOverReason("timer");
              setGameState(isRoguelikeRef.current ? "roguelikeGameOver" : "gameOver");
              return 0;
            }
            return newTime;
          });
        }
        
        // Towel Off: add 20% of time not in water back to timer
        if (!touching && towelOffRef.current.active) {
          setWaterTimer((prev) => {
            // Boss Quick Run / Boss Hell Run: cap at BASE starting time (50s/30s), never exceed it
            const isBossQuickRun = runTypeRef.current === "bossQuickRun";
            const isBossHellRun = runTypeRef.current === "bossHellRun";
            const baseStartingTime = isBossQuickRun 
              ? BOSS_QUICK_RUN_BASE_WATER_TIME 
              : isBossHellRun
              ? BOSS_HELL_RUN_STARTING_WATER_TIME
              : (levelStartingWaterTimerRef.current || 6000);
            
            // Don't add time if already at or above base starting value
            if (prev >= baseStartingTime) return prev;
            
            // Add 20% of deltaTime back to timer, capped at base starting time
            const recovery = deltaTime * 0.2;
            return Math.min(baseStartingTime, prev + recovery);
          });
        }
        
        // Wave Surfer auto-move removed - now uses instant teleport on wave touch
        
        // Fish Net effect: scales across levels 1-4 (0.3s/7s → 0.4s/6s → 0.5s/5s → 0.7s/4s), boss = 1s/3s
        if (currentBeachEffectRef.current === "fishNet") {
          const isReducedFishNet = runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
          let stuckDuration = 1000; // Boss level
          let stuckInterval = 3000; // Boss level
          if (isReducedFishNet) {
            const levelDurations = [300, 400, 500, 600];
            const levelIntervals = [5000, 4500, 4000, 3500];
            stuckDuration = levelDurations[beachLevelRef.current - 1] || 600;
            stuckInterval = levelIntervals[beachLevelRef.current - 1] || 3500;
          }
          
          fishNetTimerRef.current += deltaTime;
          if (fishNetStuckRef.current) {
            // Currently stuck - check if duration has passed
            if (fishNetTimerRef.current >= stuckDuration) {
              setFishNetStuck(false);
              fishNetTimerRef.current = 0;
            }
          } else {
            // Not stuck - check if interval has passed
            if (fishNetTimerRef.current >= stuckInterval) {
              setFishNetStuck(true);
              fishNetTimerRef.current = 0;
            }
          }
        }
        
        // Quicksand effect: Level 1 (0.7s/0.8s/40%) → Level 2 (0.6s/0.9s/50%) → Level 3 (0.5s/1.0s/60%) → Level 4 (0.4s/1.2s/70%) → Boss (0.2s/1.5s/80%)
        if (currentBeachEffectRef.current === "quicksand") {
          const isReducedQuicksand = runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
          let stillTriggerTime = 200; // Boss level = 0.2s
          let penaltyDuration = 1500; // Boss level = 1.5s
          if (isReducedQuicksand) {
            const levelTriggers = [700, 600, 500, 400];
            const levelDurations = [800, 900, 1000, 1200];
            stillTriggerTime = levelTriggers[beachLevelRef.current - 1] || 400;
            penaltyDuration = levelDurations[beachLevelRef.current - 1] || 1200;
          }
          const currentPos = feetPositionRef.current;
          
          // Update penalty timer if active
          if (quicksandPenaltyActiveRef.current) {
            quicksandPenaltyTimerRef.current -= deltaTime;
            if (quicksandPenaltyTimerRef.current <= 0) {
              // Penalty window ended
              quicksandPenaltyActiveRef.current = false;
              quicksandPenaltyTimerRef.current = 0;
              // Reset still timer to start fresh
              quicksandStillTimerRef.current = 0;
              quicksandLastPositionRef.current = currentPos;
            }
          } else {
            // Not in penalty window - track stillness
            if (quicksandLastPositionRef.current === null) {
              quicksandLastPositionRef.current = currentPos;
            }
            
            if (currentPos === quicksandLastPositionRef.current) {
              // Still in same position
              quicksandStillTimerRef.current += deltaTime;
              if (quicksandStillTimerRef.current >= stillTriggerTime) {
                // Trigger penalty!
                quicksandPenaltyActiveRef.current = true;
                quicksandPenaltyTimerRef.current = penaltyDuration;
                quicksandStillTimerRef.current = 0;
              }
            } else {
              // Moved - reset timer
              quicksandStillTimerRef.current = 0;
              quicksandLastPositionRef.current = currentPos;
            }
          }
        } else {
          // Reset quicksand tracking when effect is not active
          quicksandLastPositionRef.current = null;
          quicksandStillTimerRef.current = 0;
          quicksandPenaltyActiveRef.current = false;
          quicksandPenaltyTimerRef.current = 0;
        }
        
        // Busy Beach effect: scales across levels 1-4 (6s → 5s → 4.5s → 4s), boss = 3s
        if (currentBeachEffectRef.current === "busyBeach") {
          // First person spawns after 1 second (timer starts at spawnInterval - 1000)
          const isReducedBusyBeach = runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
          let spawnInterval = 1500; // Boss level = every 1.5s
          let rowStart = 32;
          let rowRange = 6; // rows 32-37
          let speedMin = 2;
          let speedRange = 2; // 2-4 cols/sec
          if (isReducedBusyBeach) {
            const levelIntervals = [5000, 4500, 4000, 3500];
            spawnInterval = levelIntervals[beachLevelRef.current - 1] || 3500;
            // Level 4 gets tighter rows and faster speed
            if (beachLevelRef.current === 4) {
              rowStart = 31;
              rowRange = 9; // rows 31-39
              speedMin = 2;
              speedRange = 2; // 2-4 cols/sec
            } else {
              rowStart = 30;
              rowRange = 11; // rows 30-40
              speedMin = 2;
              speedRange = 1; // 2-3 cols/sec
            }
          }
          
          // Initialize timer to spawn first person after 1 second
          if (beachPersonSpawnTimerRef.current === 0 && beachPeopleRef.current.length === 0) {
            beachPersonSpawnTimerRef.current = spawnInterval - 1000;
          }
          
          beachPersonSpawnTimerRef.current += deltaTime;
          if (beachPersonSpawnTimerRef.current >= spawnInterval) {
            beachPersonSpawnTimerRef.current = 0;
            const direction = Math.random() < 0.5 ? 1 : -1;
            const startCol = direction === 1 ? -1 : OCEAN_WIDTH;
            const row = rowStart + Math.floor(Math.random() * rowRange);
            const speed = speedMin + Math.random() * speedRange;
            // Random bright color for the person
            const hue = Math.floor(Math.random() * 360);
            const color = `hsl(${hue}, 70%, 60%)`;
            const newPerson: BeachPerson = {
              id: beachPersonIdRef.current++,
              row,
              col: startCol,
              direction,
              speed,
              color,
            };
            setBeachPeople(prev => [...prev, newPerson]);
            beachPeopleRef.current = [...beachPeopleRef.current, newPerson];
          }
          
          // Move people and handle collisions
          const feetCol1 = OCEAN_WIDTH / 2 - 1; // Left foot column (9)
          const feetCol2 = OCEAN_WIDTH / 2;     // Right foot column (10)
          const currentFeetPos = feetPositionRef.current;
          // Feet occupy rows from feetPosition to feetPosition + 1 (2 rows tall)
          const feetRowTop = Math.floor(currentFeetPos);
          const feetRowBottom = Math.ceil(currentFeetPos + 1);
          
          setBeachPeople(prev => {
            const updated = prev.map(person => {
              // Move the person
              const newCol = person.col + (person.direction * person.speed * deltaTime / 1000);
              
              // Check if person has crossed the beach
              if ((person.direction === 1 && newCol > OCEAN_WIDTH) || 
                  (person.direction === -1 && newCol < -1)) {
                return null; // Mark for removal
              }
              
              // Check collision with feet
              const personColInt = Math.floor(newCol);
              const personInFeetColumn = personColInt === feetCol1 || personColInt === feetCol2;
              const personInFeetRow = person.row >= feetRowTop && person.row <= feetRowBottom;
              
              if (personInFeetColumn && personInFeetRow) {
                // Person walks into feet - kick feet back (further from shore = higher row number)
                // Find nearest safe row that doesn't have this person
                const safeRow = Math.min(TOTAL_HEIGHT - 1, currentFeetPos + 1);
                setFeetPosition(safeRow);
                feetPositionRef.current = safeRow;
              }
              
              return { ...person, col: newCol };
            }).filter((p): p is BeachPerson => p !== null);
            
            beachPeopleRef.current = updated;
            return updated;
          });
        } else {
          // Clear people when effect is not active
          if (beachPeopleRef.current.length > 0) {
            setBeachPeople([]);
            beachPeopleRef.current = [];
          }
          beachPersonSpawnTimerRef.current = 0;
        }

        return updated;
      });

      if (shouldMoveWaves) {
        waveUpdateTimerRef.current = 0;
      }

      // Update ability timers - use roguelike durations if applicable
      const wetsuitDuration = isRoguelikeRef.current 
        ? (() => {
            const ability = unlockedAbilitiesRef.current.find((a) => a.type === "wetsuit");
            if (!ability) return ROGUELIKE_BASE_WETSUIT_DURATION;
            return ROGUELIKE_BASE_WETSUIT_DURATION + (UPGRADE_INCREMENTS_MS.wetsuit * ability.upgradeCount);
          })()
        : WETSUIT_DURATION;

      const ghostToeDuration = isRoguelikeRef.current
        ? (() => {
            const ability = unlockedAbilitiesRef.current.find((a) => a.type === "ghostToe");
            if (!ability) return ROGUELIKE_BASE_DURATIONS.ghostToe;
            return ROGUELIKE_BASE_DURATIONS.ghostToe + (UPGRADE_INCREMENTS_MS.ghostToe * ability.upgradeCount);
          })()
        : GHOST_TOE_DURATION;

      // Dynamic cooldown based on run type (20s for Boss Quick Run / Boss Hell Run, 60s otherwise)
      const dynamicCooldown = (runTypeRef.current === "bossQuickRun" || runTypeRef.current === "bossHellRun") ? BOSS_QUICK_RUN_COOLDOWN : 60000;
      
      // Invincible (wetsuit) duration and cooldown - also checks water limit
      setInvincible((prev) => {
        if (prev.active && prev.durationRemaining !== undefined) {
          const newDuration = prev.durationRemaining - deltaTime;
          if (newDuration <= 0) {
            return { active: false, cooldownRemaining: dynamicCooldown, durationRemaining: 0, waterExposure: 0, waterLimit: 0 };
          }
          return { ...prev, durationRemaining: newDuration };
        }
        if (prev.cooldownRemaining > 0) {
          return { ...prev, cooldownRemaining: Math.max(0, prev.cooldownRemaining - deltaTime) };
        }
        return prev;
      });

      // Ghost toe duration and cooldown
      setGhostToe((prev) => {
        if (prev.active && prev.durationRemaining !== undefined) {
          const newDuration = prev.durationRemaining - deltaTime;
          if (newDuration <= 0) {
            return { active: false, cooldownRemaining: dynamicCooldown, durationRemaining: 0 };
          }
          return { ...prev, durationRemaining: newDuration };
        }
        if (prev.cooldownRemaining > 0) {
          return { ...prev, cooldownRemaining: Math.max(0, prev.cooldownRemaining - deltaTime) };
        }
        return prev;
      });

      // Super tap - duration-based for roguelike, cooldown-only for classic (uses tracked separately)
      setSuperTap((prev) => {
        // Handle duration-based super tap (roguelike mode)
        if (prev.active && prev.durationRemaining !== undefined) {
          const newDuration = prev.durationRemaining - deltaTime;
          if (newDuration <= 0) {
            return { active: false, cooldownRemaining: dynamicCooldown, durationRemaining: 0 };
          }
          return { ...prev, durationRemaining: newDuration };
        }
        if (prev.cooldownRemaining > 0) {
          return { ...prev, cooldownRemaining: Math.max(0, prev.cooldownRemaining - deltaTime) };
        }
        return prev;
      });

      // Crystal ball duration and cooldown (roguelike only)
      setCrystalBall((prev) => {
        if (prev.active && prev.durationRemaining !== undefined) {
          const newDuration = prev.durationRemaining - deltaTime;
          if (newDuration <= 0) {
            return { active: false, cooldownRemaining: dynamicCooldown, durationRemaining: 0 };
          }
          return { ...prev, durationRemaining: newDuration };
        }
        if (prev.cooldownRemaining > 0) {
          return { ...prev, cooldownRemaining: Math.max(0, prev.cooldownRemaining - deltaTime) };
        }
        return prev;
      });

      // Slowdown duration and cooldown (roguelike only)
      setSlowdown((prev) => {
        if (prev.active && prev.durationRemaining !== undefined) {
          const newDuration = prev.durationRemaining - deltaTime;
          if (newDuration <= 0) {
            return { active: false, cooldownRemaining: dynamicCooldown, durationRemaining: 0 };
          }
          return { ...prev, durationRemaining: newDuration };
        }
        if (prev.cooldownRemaining > 0) {
          return { ...prev, cooldownRemaining: Math.max(0, prev.cooldownRemaining - deltaTime) };
        }
        return prev;
      });

      // Wave Magnet duration and cooldown (roguelike only)
      setWaveMagnet((prev) => {
        if (prev.active && prev.durationRemaining !== undefined) {
          const newDuration = prev.durationRemaining - deltaTime;
          if (newDuration <= 0) {
            return { active: false, cooldownRemaining: dynamicCooldown, durationRemaining: 0 };
          }
          return { ...prev, durationRemaining: newDuration };
        }
        if (prev.cooldownRemaining > 0) {
          return { ...prev, cooldownRemaining: Math.max(0, prev.cooldownRemaining - deltaTime) };
        }
        return prev;
      });

      // Wave Surfer duration and cooldown (roguelike only)
      setWaveSurfer((prev) => {
        if (prev.active && prev.durationRemaining !== undefined) {
          const newDuration = prev.durationRemaining - deltaTime;
          if (newDuration <= 0) {
            return { active: false, cooldownRemaining: dynamicCooldown, durationRemaining: 0 };
          }
          return { ...prev, durationRemaining: newDuration };
        }
        if (prev.cooldownRemaining > 0) {
          return { ...prev, cooldownRemaining: Math.max(0, prev.cooldownRemaining - deltaTime) };
        }
        return prev;
      });

      // Towel Off duration and cooldown (roguelike only)
      setTowelOff((prev) => {
        if (prev.active && prev.durationRemaining !== undefined) {
          const newDuration = prev.durationRemaining - deltaTime;
          if (newDuration <= 0) {
            return { active: false, cooldownRemaining: dynamicCooldown, durationRemaining: 0 };
          }
          return { ...prev, durationRemaining: newDuration };
        }
        if (prev.cooldownRemaining > 0) {
          return { ...prev, cooldownRemaining: Math.max(0, prev.cooldownRemaining - deltaTime) };
        }
        return prev;
      });

      // Double Dip duration and cooldown (roguelike only)
      setDoubleDip((prev) => {
        if (prev.active && prev.durationRemaining !== undefined) {
          const newDuration = prev.durationRemaining - deltaTime;
          if (newDuration <= 0) {
            return { active: false, cooldownRemaining: dynamicCooldown, durationRemaining: 0 };
          }
          return { ...prev, durationRemaining: newDuration };
        }
        if (prev.cooldownRemaining > 0) {
          return { ...prev, cooldownRemaining: Math.max(0, prev.cooldownRemaining - deltaTime) };
        }
        return prev;
      });

      // Jump Around duration and cooldown (roguelike only)
      setJumpAround((prev) => {
        if (prev.active && prev.durationRemaining !== undefined) {
          const newDuration = prev.durationRemaining - deltaTime;
          if (newDuration <= 0) {
            return { active: false, cooldownRemaining: dynamicCooldown, durationRemaining: 0 };
          }
          return { ...prev, durationRemaining: newDuration };
        }
        if (prev.cooldownRemaining > 0) {
          return { ...prev, cooldownRemaining: Math.max(0, prev.cooldownRemaining - deltaTime) };
        }
        return prev;
      });

      // Flashlight duration and cooldown (Nighttime boss beach)
      if (currentBeachEffectRef.current === "nighttime") {
        setFlashlightDuration((prev) => {
          if (flashlightActiveRef.current && prev > 0) {
            const newDuration = prev - deltaTime;
            if (newDuration <= 0) {
              setFlashlightActive(false);
              setFlashlightCooldown(FLASHLIGHT_COOLDOWN);
              return 0;
            }
            return newDuration;
          }
          return prev;
        });
        setFlashlightCooldown((prev) => {
          if (!flashlightActiveRef.current && prev > 0) {
            return Math.max(0, prev - deltaTime);
          }
          return prev;
        });
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    // Spawn first wave after 500ms
    const spawnTimeout = setTimeout(() => {
      const startRow = OCEAN_HEIGHT - 10 + Math.floor(Math.random() * 3); // rows 20, 21, or 22
      // First wave always peaks in rows 32-34 (gives player time to react)
      const maxReach = OCEAN_HEIGHT + 2 + Math.floor(Math.random() * 3); // 32, 33, or 34
      lastMaxReachRef.current = maxReach;
      setWaves([{
        id: waveIdRef.current++,
        row: startRow,
        startRow,
        maxReach,
        phase: "incoming",
        touched: false,
        peakTimer: 0,
      }]);
    }, 500);

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      clearTimeout(spawnTimeout);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);

  // Ability activation functions
  const activateInvincible = useCallback(() => {
    if (!isAbilityUnlocked("wetsuit")) return;
    if (invincible.active || invincible.cooldownRemaining > 0) return;
    const duration = getAbilityDuration("wetsuit");
    const waterLimit = getWetsuitWaterLimit();
    setInvincible({ active: true, cooldownRemaining: 0, durationRemaining: duration, waterExposure: 0, waterLimit });
  }, [invincible, isAbilityUnlocked, getAbilityDuration, getWetsuitWaterLimit]);

  const activateSuperTap = useCallback(() => {
    if (!isAbilityUnlocked("superTap")) return;
    if (superTap.active || superTap.cooldownRemaining > 0) return;
    // Gummy Beach effect: can't use Super Tap on boss level
    const isGummyBoss = currentBeachEffectRef.current === "gummyBeach" && 
      (runTypeRef.current !== "beachBonanza" || beachLevelRef.current >= 5);
    if (isGummyBoss) return;
    const value = getAbilityDuration("superTap");
    // In roguelike, super tap is duration-based; in classic it's uses-based
    if (isRoguelike) {
      setSuperTap({ active: true, cooldownRemaining: 0, durationRemaining: value, usesRemaining: undefined });
    } else {
      setSuperTap({ active: true, cooldownRemaining: 0, usesRemaining: value });
    }
  }, [superTap, isAbilityUnlocked, getAbilityDuration, isRoguelike]);

  const activateGhostToe = useCallback(() => {
    if (!isAbilityUnlocked("ghostToe")) return;
    if (ghostToe.active || ghostToe.cooldownRemaining > 0) return;
    const duration = getAbilityDuration("ghostToe");
    setGhostToe({ active: true, cooldownRemaining: 0, durationRemaining: duration });
  }, [ghostToe, isAbilityUnlocked, getAbilityDuration]);

  const activateCrystalBall = useCallback(() => {
    if (!isAbilityUnlocked("crystalBall")) return;
    if (crystalBall.active || crystalBall.cooldownRemaining > 0) return;
    const duration = getAbilityDuration("crystalBall");
    setCrystalBall({ active: true, cooldownRemaining: 0, durationRemaining: duration });
  }, [crystalBall, isAbilityUnlocked, getAbilityDuration]);

  const activateSlowdown = useCallback(() => {
    if (!isAbilityUnlocked("slowdown")) return;
    if (slowdown.active || slowdown.cooldownRemaining > 0) return;
    const duration = getAbilityDuration("slowdown");
    setSlowdown({ active: true, cooldownRemaining: 0, durationRemaining: duration });
  }, [slowdown, isAbilityUnlocked, getAbilityDuration]);

  const activateWaveMagnet = useCallback(() => {
    if (!isAbilityUnlocked("waveMagnet")) return;
    if (waveMagnet.active || waveMagnet.cooldownRemaining > 0) return;
    const duration = getAbilityDuration("waveMagnet");
    setWaveMagnet({ active: true, cooldownRemaining: 0, durationRemaining: duration });
  }, [waveMagnet, isAbilityUnlocked, getAbilityDuration]);

  const activateWaveSurfer = useCallback(() => {
    if (!isAbilityUnlocked("waveSurfer")) return;
    if (waveSurfer.active || waveSurfer.cooldownRemaining > 0) return;
    const duration = getAbilityDuration("waveSurfer");
    setWaveSurfer({ active: true, cooldownRemaining: 0, durationRemaining: duration });
  }, [waveSurfer, isAbilityUnlocked, getAbilityDuration]);

  const activateTowelOff = useCallback(() => {
    if (!isAbilityUnlocked("towelOff")) return;
    if (towelOff.active || towelOff.cooldownRemaining > 0) return;
    const duration = getAbilityDuration("towelOff");
    setTowelOff({ active: true, cooldownRemaining: 0, durationRemaining: duration });
  }, [towelOff, isAbilityUnlocked, getAbilityDuration]);

  const activateDoubleDip = useCallback(() => {
    if (!isAbilityUnlocked("doubleDip")) return;
    if (doubleDip.active || doubleDip.cooldownRemaining > 0) return;
    const duration = getAbilityDuration("doubleDip");
    setDoubleDip({ active: true, cooldownRemaining: 0, durationRemaining: duration });
  }, [doubleDip, isAbilityUnlocked, getAbilityDuration]);

  const activateJumpAround = useCallback(() => {
    if (!isAbilityUnlocked("jumpAround")) return;
    if (jumpAround.active || jumpAround.cooldownRemaining > 0) return;
    const duration = getAbilityDuration("jumpAround");
    setJumpAround({ active: true, cooldownRemaining: 0, durationRemaining: duration });
  }, [jumpAround, isAbilityUnlocked, getAbilityDuration]);

  // Flashlight activation for Nighttime boss beach
  const activateFlashlight = useCallback(() => {
    if (currentBeachEffectRef.current !== "nighttime") return;
    if (flashlightActive || flashlightCooldown > 0) return;
    setFlashlightActive(true);
    // Nighttime: scales across levels 1-4 (30s → 25s → 20s → 15s), boss = 10s
    const isReducedNighttime = runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
    let duration = FLASHLIGHT_DURATION_BOSS; // 10s boss
    if (isReducedNighttime) {
      const levelDurations = [30000, 25000, 20000, 15000];
      duration = levelDurations[beachLevelRef.current - 1] || 15000;
    }
    setFlashlightDuration(duration);
  }, [flashlightActive, flashlightCooldown]);

  // Map ability type to activation function
  const activateAbilityByType = useCallback((type: AbilityType) => {
    switch (type) {
      case "wetsuit": activateInvincible(); break;
      case "superTap": activateSuperTap(); break;
      case "ghostToe": activateGhostToe(); break;
      case "crystalBall": activateCrystalBall(); break;
      case "slowdown": activateSlowdown(); break;
      case "waveMagnet": activateWaveMagnet(); break;
      case "waveSurfer": activateWaveSurfer(); break;
      case "towelOff": activateTowelOff(); break;
      case "doubleDip": activateDoubleDip(); break;
      case "jumpAround": activateJumpAround(); break;
    }
  }, [activateInvincible, activateSuperTap, activateGhostToe, activateCrystalBall, activateSlowdown, activateWaveMagnet, activateWaveSurfer, activateTowelOff, activateDoubleDip, activateJumpAround]);

  // Helper to check if a position is blocked by a beach person
  const isPositionBlockedByPerson = useCallback((newFeetPos: number): boolean => {
    if (currentBeachEffectRef.current !== "busyBeach") return false;
    
    const feetCol1 = OCEAN_WIDTH / 2 - 1; // Left foot column (9)
    const feetCol2 = OCEAN_WIDTH / 2;     // Right foot column (10)
    const feetRowTop = Math.floor(newFeetPos);
    const feetRowBottom = Math.ceil(newFeetPos + 1);
    
    for (const person of beachPeopleRef.current) {
      const personColInt = Math.floor(person.col);
      const personInFeetColumn = personColInt === feetCol1 || personColInt === feetCol2;
      const personInFeetRow = person.row >= feetRowTop && person.row <= feetRowBottom;
      
      if (personInFeetColumn && personInFeetRow) {
        return true;
      }
    }
    return false;
  }, []);

  // Momentum mode uses a gear system (-3 to +3) instead of continuous velocity
  // Gear speeds: Run = 2.5 rows/sec, Walk = 1.25 rows/sec, Crawl = 0.5 rows/sec

  // Create movement functions that can be used for both immediate and interval calls
  const doMoveUp = useCallback(() => {
    if (gameState !== "playing") return;
    if (fishNetStuckRef.current) return;
    
    // Momentum mode: shift gear toward shore (negative gear)
    if (movementModeRef.current === "momentum") {
      const currentGear = momentumGearRef.current;
      // Only shift if not already at max gear toward shore
      if (currentGear > -3) {
        const newGear = currentGear - 1;
        momentumGearRef.current = newGear;
        setMomentumGear(newGear);
      }
      return;
    }
    
    const fastFeetMultiplier = 1 + (permanentUpgradesRef.current.fastFeet * 0.1);
    const footTypeSpeedMultiplier = FOOT_TYPE_MODIFIERS[footTypeRef.current].speedMultiplier;
    const baseStep = 0.25 * fastFeetMultiplier * footTypeSpeedMultiplier;
    let moveStep = jumpAroundRef.current.active ? baseStep * JUMP_AROUND_MULTIPLIER : baseStep;
                  if (currentBeachEffectRef.current === "quicksand" && quicksandPenaltyActiveRef.current) {
                    // Quicksand penalty: Level 1 = 40%, Level 2 = 50%, Level 3 = 60%, Level 4 = 70%, Boss = 80%
                    const isReducedQuicksand = runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
                    const levelPenalties = [0.60, 0.50, 0.40, 0.30]; // 40%, 50%, 60%, 70% slower
                    const penaltyMultiplier = isReducedQuicksand 
                      ? (levelPenalties[beachLevelRef.current - 1] || 0.30)
                      : 0.20; // Boss = 80% slower
                    moveStep *= penaltyMultiplier;
                  }
    if (currentBeachEffectRef.current === "heavySand") {
      // Heavy Sand: scales across levels 1-4 (10% → 20% → 30% → 40%), boss = 65%
      const isReducedHeavySand = runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
      let heavySandPenalty = 0.35; // Boss = 65% less
      if (isReducedHeavySand) {
        const levelPenalties = [0.90, 0.80, 0.70, 0.60]; // 10%, 20%, 30%, 40% less
        heavySandPenalty = levelPenalties[beachLevelRef.current - 1] || 0.60;
      }
      moveStep *= heavySandPenalty;
    }
    // Gummy Beach: 20% movement reduction at all levels
    if (currentBeachEffectRef.current === "gummyBeach") {
      moveStep *= 0.80;
    }
    // Slower Forward mode: 30% slower when moving toward shore
    if (movementModeRef.current === "slowerForward") {
      moveStep *= 0.7;
    }
    
    setFeetPosition((prev) => {
      const newPos = Math.max(prev - moveStep, OCEAN_HEIGHT);
      if (isPositionBlockedByPerson(newPos)) return prev;
      if (newPos !== prev) {
        if (isRoguelike) setTotalSteps(s => s + 1);
      }
      return newPos;
    });
  }, [gameState, isRoguelike, isPositionBlockedByPerson]);

  const doMoveDown = useCallback(() => {
    if (gameState !== "playing") return;
    if (fishNetStuckRef.current) return;
    
    
    // Momentum mode: shift gear away from shore (positive gear)
    if (movementModeRef.current === "momentum") {
      const currentGear = momentumGearRef.current;
      // Only shift if not already at max gear away from shore
      if (currentGear < 3) {
        const newGear = currentGear + 1;
        momentumGearRef.current = newGear;
        setMomentumGear(newGear);
      }
      return;
    }
    
    const fastFeetMultiplier = 1 + (permanentUpgradesRef.current.fastFeet * 0.1);
    const footTypeSpeedMultiplier = FOOT_TYPE_MODIFIERS[footTypeRef.current].speedMultiplier;
    const baseStep = 0.25 * fastFeetMultiplier * footTypeSpeedMultiplier;
    let moveStep = jumpAroundRef.current.active ? baseStep * JUMP_AROUND_MULTIPLIER : baseStep;
    if (currentBeachEffectRef.current === "quicksand" && quicksandPenaltyActiveRef.current) {
      // Quicksand penalty: Level 1 = 40%, Level 2 = 50%, Level 3 = 60%, Level 4 = 70%, Boss = 80%
      const isReducedQuicksand = runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
      const levelPenalties = [0.60, 0.50, 0.40, 0.30]; // 40%, 50%, 60%, 70% slower
      const penaltyMultiplier = isReducedQuicksand 
        ? (levelPenalties[beachLevelRef.current - 1] || 0.30)
        : 0.20; // Boss = 80% slower
      moveStep *= penaltyMultiplier;
    }
    if (currentBeachEffectRef.current === "heavySand") {
      // Heavy Sand: scales across levels 1-4 (10% → 20% → 30% → 40%), boss = 65%
      const isReducedHeavySand = runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
      let heavySandPenalty = 0.35; // Boss = 65% less
      if (isReducedHeavySand) {
        const levelPenalties = [0.90, 0.80, 0.70, 0.60]; // 10%, 20%, 30%, 40% less
        heavySandPenalty = levelPenalties[beachLevelRef.current - 1] || 0.60;
      }
      moveStep *= heavySandPenalty;
    }
    // Gummy Beach: 20% movement reduction at all levels
    if (currentBeachEffectRef.current === "gummyBeach") {
      moveStep *= 0.80;
    }
    
    setFeetPosition((prev) => {
      const newPos = Math.min(prev + moveStep, TOTAL_HEIGHT - 1);
      if (isPositionBlockedByPerson(newPos)) return prev;
      if (newPos !== prev) {
        if (isRoguelike) setTotalSteps(s => s + 1);
      }
      return newPos;
    });
  }, [gameState, isRoguelike, isPositionBlockedByPerson]);

  // Update position based on speed for momentum mode (called from game loop)
  const updateMomentumPosition = useCallback((deltaTimeMs: number) => {
    if (movementModeRef.current !== "momentum") return;
    if (fishNetStuckRef.current) return;

    // Cap dt to avoid huge jumps after tab backgrounding
    const dtSec = Math.min(deltaTimeMs, 50) / 1000;

    const upHeld = keyHeldRef.current.up;
    const downHeld = keyHeldRef.current.down;

    // Gear system: no hold acceleration, speed is determined purely by gear
    // Gear: -3 = run toward shore, -2 = walk toward shore, -1 = crawl toward shore
    //       0 = neutral, +1 = crawl away, +2 = walk away, +3 = run away
    const gear = momentumGearRef.current;
    
    // Get base speed from gear (rows/sec)
    const baseSpeed = getGearSpeed(gear);
    const direction = gear < 0 ? -1 : gear > 0 ? 1 : 0; // -1 = toward shore, +1 = away
    let speed = baseSpeed * direction;
    
    // Apply Fast Feet multiplier and Foot Type speed modifier
    const fastFeetMultiplier = 1 + (permanentUpgradesRef.current.fastFeet * 0.1);
    const footTypeSpeedMultiplier = FOOT_TYPE_MODIFIERS[footTypeRef.current].speedMultiplier;
    speed *= fastFeetMultiplier * footTypeSpeedMultiplier;

    // Integrate position using speed (rows/sec) -> rows this frame
    let moveThisFrame = speed * dtSec;

    // Apply Jump Around multiplier
    if (jumpAroundRef.current.active) {
      moveThisFrame *= JUMP_AROUND_MULTIPLIER;
    }

    // Apply beach effect penalties
    if (currentBeachEffectRef.current === "quicksand" && quicksandPenaltyActiveRef.current) {
      // Quicksand penalty: Level 1 = 40%, Level 2 = 50%, Level 3 = 60%, Level 4 = 70%, Boss = 80%
      const isReducedQuicksand = runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
      const levelPenalties = [0.60, 0.50, 0.40, 0.30]; // 40%, 50%, 60%, 70% slower
      const penaltyMultiplier = isReducedQuicksand 
        ? (levelPenalties[beachLevelRef.current - 1] || 0.30)
        : 0.20; // Boss = 80% slower
      moveThisFrame *= penaltyMultiplier;
    }
    if (currentBeachEffectRef.current === "heavySand") {
      // Heavy Sand: scales across levels 1-4 (10% → 20% → 30% → 40%), boss = 65%
      const isReducedHeavySand = runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
      let heavySandPenalty = 0.35; // Boss = 65% less
      if (isReducedHeavySand) {
        const levelPenalties = [0.90, 0.80, 0.70, 0.60]; // 10%, 20%, 30%, 40% less
        heavySandPenalty = levelPenalties[beachLevelRef.current - 1] || 0.60;
      }
      moveThisFrame *= heavySandPenalty;
    }
    // Gummy Beach: 20% movement reduction at all levels
    if (currentBeachEffectRef.current === "gummyBeach") {
      moveThisFrame *= 0.80;
    }

    if (Math.abs(moveThisFrame) > 0.0001) {
      // Calculate new position based on current ref value (not stale state)
      const currentPos = feetPositionRef.current;
      const newPos = Math.max(Math.min(currentPos + moveThisFrame, TOTAL_HEIGHT - 1), OCEAN_HEIGHT);
      
      if (!isPositionBlockedByPerson(newPos) && newPos !== currentPos) {
        // Update ref immediately so the rest of the game loop uses the correct value
        feetPositionRef.current = newPos;
        setFeetPosition(newPos);
        
        if (Math.abs(moveThisFrame) > 0.01) {
          if (isRoguelikeRef.current) setTotalSteps((s) => s + 1);
        }
      }
    }
  }, [isPositionBlockedByPerson, getGearSpeed]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (gameState !== "playing") return;

      // Secret dev ability: Shift-Q makes next wave count as 20
      if (e.shiftKey && (e.key === "q" || e.key === "Q")) {
        superWaveActiveRef.current = true;
        setSuperWaveActive(true);
        return;
      }

      const isUpKey = e.key === "ArrowUp" || e.key === "w" || e.key === "W";
      const isDownKey = e.key === "ArrowDown" || e.key === "s" || e.key === "S";

      // Handle movement keys with immediate response and interval-based repeat
      if (isUpKey || isDownKey) {
        e.preventDefault();
      }

      if (isUpKey && !keyHeldRef.current.up) {
        keyHeldRef.current.up = true;

        // Momentum mode: single tap shifts gear, no hold repeat
        if (movementModeRef.current === "momentum") {
          doMoveUp(); // Shift gear toward shore
        } else {
          doMoveUp(); // Move immediately
          // Start interval after short delay (100ms) for continuous movement
          moveUpIntervalRef.current = setInterval(doMoveUp, 100);
        }
      } else if (isDownKey && !keyHeldRef.current.down) {
        keyHeldRef.current.down = true;

        // Momentum mode: single tap shifts gear, no hold repeat
        if (movementModeRef.current === "momentum") {
          doMoveDown(); // Shift gear away from shore
        } else {
          doMoveDown(); // Move immediately
          // Start interval after short delay (100ms) for continuous movement
          moveDownIntervalRef.current = setInterval(doMoveDown, 100);
        }
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        // Gummy Beach effect: can't toe tap on boss level, reduced distance on non-boss
        // Auto toe tap mode: disable manual toe tapping
        const isGummyBoss = currentBeachEffectRef.current === "gummyBeach" && 
          (runTypeRef.current !== "beachBonanza" || beachLevelRef.current >= 5);
        if (!isGummyBoss && !autoToeTapRef.current) {
          setIsTapping(true);
          if (isRoguelike) setTotalToeTaps(t => t + 1);
        }
      } else if (e.key === "f" || e.key === "F") {
        // Flashlight for Nighttime boss beach
        if (currentBeachEffectRef.current === "nighttime") {
          activateFlashlight();
        }
      } else {
        const keyUpper = e.key.toUpperCase();
        const keyIndex = ABILITY_KEYS.indexOf(keyUpper as typeof ABILITY_KEYS[number]);
        if (keyIndex >= 0) {
          // Classic mode has fixed abilities, roguelike uses selected/unlocked
          const classicAbilities: AbilityType[] = ["wetsuit", "superTap", "ghostToe"];
          const abilities = isRoguelikeRef.current
            ? (selectedAbilitiesRef.current.length > 0 
                ? selectedAbilitiesRef.current 
                : unlockedAbilitiesRef.current.map(a => a.type).slice(0, 4))
            : classicAbilities;
          if (keyIndex < abilities.length) {
            activateAbilityByType(abilities[keyIndex]);
          }
        }
      }
    },
    [gameState, activateAbilityByType, doMoveUp, doMoveDown, isRoguelike, activateFlashlight]
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const isUpKey = e.key === "ArrowUp" || e.key === "w" || e.key === "W";
    const isDownKey = e.key === "ArrowDown" || e.key === "s" || e.key === "S";
    
    if (isUpKey) {
      keyHeldRef.current.up = false;
      if (moveUpIntervalRef.current) {
        clearInterval(moveUpIntervalRef.current);
        moveUpIntervalRef.current = null;
      }
    }
    if (isDownKey) {
      keyHeldRef.current.down = false;
      if (moveDownIntervalRef.current) {
        clearInterval(moveDownIntervalRef.current);
        moveDownIntervalRef.current = null;
      }
    }
    if (e.key === " " || e.key === "Enter") {
      setIsTapping(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleDifficultySelect = (selectedDifficulty: WavesDifficulty) => {
    setIsRoguelike(false);
    setDifficulty(selectedDifficulty);
    // Start game immediately after selecting difficulty
    startLevel(undefined, false);
  };

  const startLevel = (level?: number, forceRoguelike?: boolean, currentWaterTimeBonus?: number, preselectedAbilities?: AbilityType[], currentWavesMissedBonus?: number) => {
    // For roguelike, use level-based water timer with bonus; otherwise standard 5s
    const isRoguelikeMode = forceRoguelike ?? isRoguelike;
    const levelToUse = level ?? roguelikeLevel;
    const bonus = currentWaterTimeBonus ?? waterTimeBonus;
    const missedBonus = currentWavesMissedBonus ?? wavesMissedBonus;
    const baseTimer = isRoguelikeMode 
      ? getRoguelikeLevelSettings(levelToUse).waterTimer 
      : 5000;
    const timer = baseTimer + bonus; // bonus is now in ms
    
    // Set selected abilities if provided, otherwise use first 4 unlocked
    if (preselectedAbilities) {
      setSelectedAbilities(preselectedAbilities);
    } else if (unlockedAbilities.length <= 4) {
      setSelectedAbilities(unlockedAbilities.map(a => a.type));
    }
    
    // Update waves to win/lose for this level (keeps HUD + win condition in sync)
    if (isRoguelikeMode) {
      setRoguelikeWavesToWin(getRoguelikeLevelSettings(levelToUse).wavesToWin);

      const { wavesToLose } = getRoguelikeLevelSettings(levelToUse, lastWavesMissedUpgradeLevel);
      setRoguelikeWavesToLose(Math.max(1, wavesToLose + missedBonus));
    }
    
    // Handle beach effects for boss levels (every 5th level)
    // This handles the case when startLevel is called directly (early levels with ≤4 abilities)
    if (isRoguelikeMode && levelToUse % 5 === 0 && pendingBeachEffect) {
      setBeachEffectWithRef(pendingBeachEffect);
      setUsedBeachEffects(prev => {
        // Only add if not already in the list (prevents duplicates if proceedToLevel also ran)
        if (!prev.includes(pendingBeachEffect)) {
          return [...prev, pendingBeachEffect];
        }
        return prev;
      });
      // Also update the ref immediately to ensure game loop sees correct state
      usedBeachEffectsRef.current = [...usedBeachEffectsRef.current, pendingBeachEffect];
      setPendingBeachEffect(null);
    } else if (isRoguelikeMode && levelToUse % 5 !== 0 && runTypeRef.current !== "beachBonanza") {
      // Non-boss level in standard mode, clear any beach effect
      // Beach Bonanza keeps the effect active through all 5 levels
      setBeachEffectWithRef(null);
    }
    
    // Show tutorial popup at level 2 (game pauses until dismissed) - not for Boss Quick Run / Boss Hell Run
    if (isRoguelikeMode && levelToUse === 2 && runTypeRef.current !== "bossQuickRun" && runTypeRef.current !== "bossHellRun") {
      setShowTimerTutorial(true);
    }
    
    // Show waves tutorial popup at level 6 (first time waves to win changes) - not for Boss Quick Run / Boss Hell Run
    if (isRoguelikeMode && levelToUse === 6 && runTypeRef.current !== "bossQuickRun" && runTypeRef.current !== "bossHellRun") {
      setShowWavesTutorial(true);
    }
    
    // Show boss beach popup at boss levels (beach level 5 in Beach Bonanza, or every 5th level in Standard)
    if (isRoguelikeMode && currentBeachEffectRef.current) {
      const isBossLevel = runTypeRef.current === "beachBonanza" 
        ? beachLevelRef.current === 5 
        : levelToUse % 5 === 0;
      if (isBossLevel) {
        setShowBossBeachPopup(true);
      }
    }

    // Clear any lingering movement intervals
    if (moveUpIntervalRef.current) {
      clearInterval(moveUpIntervalRef.current);
      moveUpIntervalRef.current = null;
    }
    if (moveDownIntervalRef.current) {
      clearInterval(moveDownIntervalRef.current);
      moveDownIntervalRef.current = null;
    }
    keyHeldRef.current = { up: false, down: false };
    
    setGameState("playing");
    setFeetPosition(35);
    setWaves([]);
    setWaterTimer(timer);
    levelStartingWaterTimerRef.current = timer; // Store for Towel Off cap
    setWavesTouched(0);
    setWavesMissed(0);
    setInvincible({ active: false, cooldownRemaining: 0, durationRemaining: 0 });
    setSuperTap({ active: false, cooldownRemaining: 0, usesRemaining: SUPER_TAP_USES });
    setGhostToe({ active: false, cooldownRemaining: 0, durationRemaining: 0 });
    setCrystalBall({ active: false, cooldownRemaining: 0, durationRemaining: 0 });
    setSlowdown({ active: false, cooldownRemaining: 0, durationRemaining: 0 });
    setWaveMagnet({ active: false, cooldownRemaining: 0, durationRemaining: 0 });
    setWaveSurfer({ active: false, cooldownRemaining: 0, durationRemaining: 0 });
    setWaveSurferShield(0);
    setWaveSurferParticles([]);
    setTowelOff({ active: false, cooldownRemaining: 0, durationRemaining: 0 });
    setDoubleDip({ active: false, cooldownRemaining: 0, durationRemaining: 0 });
    setJumpAround({ active: false, cooldownRemaining: 0, durationRemaining: 0 });
    lastTimeRef.current = 0;
    waveSpawnTimerRef.current = 0;
    waveUpdateTimerRef.current = 0;
    waveIdRef.current = 0;
    lastMaxReachRef.current = OCEAN_HEIGHT + 4;
    waveSurferQueuedTeleportRef.current = false;
    fishNetTimerRef.current = 0;
    setFishNetStuck(false);
    setGameOverReason(null);
    // Clear Busy Beach people
    setBeachPeople([]);
    beachPeopleRef.current = [];
    beachPersonSpawnTimerRef.current = 0;
    // Reset flashlight state
    setFlashlightActive(false);
    setFlashlightCooldown(0);
    setFlashlightDuration(0);
    // Reset toe tap state to prevent stale input from previous level
    setIsTapping(false);
    // Reset momentum gear to neutral at level start
    setMomentumGear(0);
    momentumGearRef.current = 0;
  };

  // Check if ability selection is needed before starting a level
  const proceedToLevel = (nextLevel: number) => {
    const currentSettings = getRoguelikeLevelSettings(roguelikeLevel, lastWavesMissedUpgradeLevel);
    const nextSettings = getRoguelikeLevelSettings(nextLevel, lastWavesMissedUpgradeLevel);
    
    // Update level state first so subsequent handlers use the correct level
    setRoguelikeLevel(nextLevel);
    
    // Beach effect handling is now done in startLevel to ensure it works
    // for all code paths (direct startLevel calls and proceedToLevel calls)
    
    // Show toast if requirements changed (every 5 levels starting at level 6)
    if (nextSettings.wavesToWin > currentSettings.wavesToWin || 
        nextSettings.wavesToLose < currentSettings.wavesToLose) {
      const messages: string[] = [];
      
      if (nextSettings.wavesToWin > currentSettings.wavesToWin) {
        messages.push(`Waves to win: ${nextSettings.wavesToWin}`);
      }
      
      // Only show waves missed decrease if it wasn't already at 1
      if (nextSettings.wavesToLose < currentSettings.wavesToLose && currentSettings.wavesToLose > 1) {
        messages.push(`Waves missed allowed: ${nextSettings.wavesToLose + wavesMissedBonus}`);
      }
      
      if (messages.length > 0) {
        toast({
          title: "⚠️ Difficulty Increased!",
          description: messages.join(" • "),
          duration: 4000,
        });
      }
    }
    
    setRoguelikeWavesToWin(nextSettings.wavesToWin);
    setRoguelikeWavesToLose(Math.max(1, nextSettings.wavesToLose + wavesMissedBonus));
    
    // If more than 4 abilities unlocked, show loadout confirmation
    if (unlockedAbilities.length > 4) {
      // If we have a previous selection, show confirm screen; otherwise go straight to selection
      if (selectedAbilities.length === 4) {
        setGameState("confirmLoadout");
      } else {
        setGameState("selectAbilities");
      }
    } else {
      startLevel(nextLevel);
    }
  };

  // Handle confirming ability selection
  const handleConfirmAbilitySelection = (selected: AbilityType[]) => {
    setSelectedAbilities(selected);
    startLevel(roguelikeLevel, undefined, undefined, selected);
  };

  // Handle keeping current loadout
  const handleKeepLoadout = () => {
    setSwappingSlot(null);
    startLevel(roguelikeLevel, undefined, undefined, selectedAbilities);
  };

  // Handle changing loadout
  const handleChangeLoadout = () => {
    setSwappingSlot(null);
    setGameState("selectAbilities");
  };

  // Handle quick swap of a single ability
  const handleQuickSwap = (newAbilityType: AbilityType) => {
    if (swappingSlot === null) return;
    const newSelection = [...selectedAbilities];
    newSelection[swappingSlot] = newAbilityType;
    setSelectedAbilities(newSelection);
    setSwappingSlot(null);
  };

  const startRoguelikeRun = (selectedMovementMode: MovementMode = "standard", selectedRunType: StartScreenRunType = "standard", selectedFootType: FootType = "tourist", selectedToeTapMode: ToeTapMode = "manual") => {
    // Set movement mode for this run
    setMovementMode(selectedMovementMode);
    setMomentumGear(0); // Reset gear to neutral for momentum mode
    
    // Set foot type for this run
    setFootType(selectedFootType);
    footTypeRef.current = selectedFootType;
    
    // Set auto toe tap mode
    const isAutoTap = selectedToeTapMode === "auto";
    setAutoToeTap(isAutoTap);
    autoToeTapRef.current = isAutoTap;
    
    // Set run type - handle slayTheWaves and bossQuickRun specially
    if (selectedRunType === "slayTheWaves") {
      // Redirect to Slay the Waves start screen
      setGameState("slayMenu");
      return;
    }
    
    if (selectedRunType === "bossQuickRun" || selectedRunType === "bossHellRun") {
      // Boss Quick Run / Boss Hell Run: go to draft screen first
      setRunType(selectedRunType);
      runTypeRef.current = selectedRunType;
      setIsRoguelike(true);
      setRoguelikeLevel(1);
      
      // Reset all state
      setUnlockedAbilities([]);
      setRoguelikeTotalWaves(0);
      setWaterTimeBonus(0);
      setWavesMissedBonus(0);
      setUsedBeachEffects([]);
      setBeachEffectWithRef(null);
      setPendingBeachEffect(null);
      setSelectedAbilities([]);
      setFishNetStuck(false);
      fishNetTimerRef.current = 0;
      setLevelScore(0);
      setTotalScore(0);
      setTotalSteps(0);
      setTotalToeTaps(0);
      setPermanentUpgrades({ fastFeet: 0, tapDancer: 0, wetShoes: 0 });
      setExcludedAbilities([]);
      
      // Reset Boss Quick Run / Boss Hell Run specific state
      // Boss Hell Run uses different starting values
      const startingWaterTime = selectedRunType === "bossHellRun" ? BOSS_HELL_RUN_STARTING_WATER_TIME : BOSS_QUICK_RUN_STARTING_WATER_TIME;
      const maxMisses = selectedRunType === "bossHellRun" ? BOSS_HELL_RUN_MAX_MISSES : BOSS_QUICK_RUN_MAX_MISSES;
      
      setBossQuickRunUsedBeaches([]);
      setBossQuickRunCarryoverTimer(startingWaterTime);
      bossQuickRunCarryoverTimerRef.current = startingWaterTime;
      setBossQuickRunTotalMisses(0); // Start with 0 accumulated misses
      bossQuickRunTotalMissesRef.current = 0;
      
      // Clear any saved run
      localStorage.removeItem(SAVED_RUN_KEY);
      localStorage.removeItem(SAVED_BONANZA_RUN_KEY);
      setHasSavedRun(false);
      
      // Reset ability refs
      usedBeachEffectsRef.current = [];
      selectedAbilitiesRef.current = [];
      unlockedAbilitiesRef.current = [];
      
      // Reset all ability states
      const defaultAbilityState: AbilityState = { active: false, cooldownRemaining: 0, durationRemaining: 0 };
      setInvincible({ ...defaultAbilityState, waterExposure: 0, waterLimit: ROGUELIKE_BASE_WETSUIT_WATER_LIMIT });
      setSuperTap({ ...defaultAbilityState, usesRemaining: SUPER_TAP_USES });
      setGhostToe(defaultAbilityState);
      setCrystalBall(defaultAbilityState);
      setSlowdown(defaultAbilityState);
      setWaveMagnet(defaultAbilityState);
      setWaveSurfer(defaultAbilityState);
      setTowelOff(defaultAbilityState);
      setDoubleDip(defaultAbilityState);
      setJumpAround(defaultAbilityState);
      setWaveSurferShield(0);
      setWaveSurferParticles([]);
      setFlashlightActive(false);
      setFlashlightCooldown(0);
      setFlashlightDuration(0);
      setShowTimerTutorial(false);
      setShowWavesTutorial(false);
      setShowBossBeachPopup(false);
      
      // Set waves to win/lose for Boss Quick Run / Boss Hell Run (fixed denominator)
      setRoguelikeWavesToWin(BOSS_QUICK_RUN_WAVES_TO_WIN);
      setRoguelikeWavesToLose(maxMisses);
      
      // Go to draft screen
      setGameState("bossQuickRunDraft");
      return;
    }
    
    const runTypeValue: RunType = selectedRunType === "beachBonanza" ? "beachBonanza" : "roguelike";
    setRunType(runTypeValue);
    runTypeRef.current = runTypeValue;
    
    // Clear any saved run when starting fresh
    localStorage.removeItem(SAVED_RUN_KEY);
    localStorage.removeItem(SAVED_BONANZA_RUN_KEY);
    setHasSavedRun(false);
    
    // Randomly exclude 3 abilities for this run, ensuring at least 3 Tier 1 abilities remain
    // Tier 1 has 5 abilities, so we can exclude at most 2 from Tier 1
    const tier1Abilities: AbilityType[] = ["superTap", "ghostToe", "jumpAround", "waveMagnet", "waveSurfer"];
    const otherAbilities: AbilityType[] = ["crystalBall", "towelOff", "wetsuit", "doubleDip", "slowdown"];
    
    // Shuffle both pools
    const shuffledTier1 = [...tier1Abilities].sort(() => Math.random() - 0.5);
    const shuffledOther = [...otherAbilities].sort(() => Math.random() - 0.5);
    
    // Pick at most 2 from Tier 1, then fill remaining from other tiers
    const tier1ToExclude = shuffledTier1.slice(0, Math.min(2, 3));
    const remainingSlots = 3 - tier1ToExclude.length;
    const otherToExclude = shuffledOther.slice(0, remainingSlots);
    
    // Combine and shuffle to randomize order
    const newExcludedAbilities = [...tier1ToExclude, ...otherToExclude].sort(() => Math.random() - 0.5);
    setExcludedAbilities(newExcludedAbilities);
    
    // Reset all roguelike state
    setIsRoguelike(true);
    setRoguelikeLevel(1);
    setUnlockedAbilities([]);
    setRoguelikeTotalWaves(0);
    setWaterTimeBonus(0);
    setWavesMissedBonus(0);
    setUsedBeachEffects([]);
    setBeachEffectWithRef(null);
    setPendingBeachEffect(null);
    setSelectedAbilities([]);
    setFishNetStuck(false);
    fishNetTimerRef.current = 0;
    // Reset score tracking
    setLevelScore(0);
    setTotalScore(0);
    // Reset stats tracking
    setTotalSteps(0);
    setTotalToeTaps(0);
    // Reset permanent upgrades
    setPermanentUpgrades({ fastFeet: 0, tapDancer: 0, wetShoes: 0 });
    
    // Reset Beach Bonanza state
    setCurrentBeach(null);
    currentBeachRef.current = null;
    setBeachLevel(1);
    beachLevelRef.current = 1;
    setBeachNumber(1);
    setCompletedBeaches([]);
    setBeachOptions([]);
    
    // Reset ability refs
    usedBeachEffectsRef.current = [];
    selectedAbilitiesRef.current = [];
    unlockedAbilitiesRef.current = [];
    
    // Reset all ability states
    const defaultAbilityState: AbilityState = { active: false, cooldownRemaining: 0, durationRemaining: 0 };
    setInvincible({ ...defaultAbilityState, waterExposure: 0, waterLimit: ROGUELIKE_BASE_WETSUIT_WATER_LIMIT });
    setSuperTap({ ...defaultAbilityState, usesRemaining: SUPER_TAP_USES });
    setGhostToe(defaultAbilityState);
    setCrystalBall(defaultAbilityState);
    setSlowdown(defaultAbilityState);
    setWaveMagnet(defaultAbilityState);
    setWaveSurfer(defaultAbilityState);
    setTowelOff(defaultAbilityState);
    setDoubleDip(defaultAbilityState);
    setJumpAround(defaultAbilityState);
    setWaveSurferShield(0);
    setWaveSurferParticles([]);
    // Reset flashlight state
    setFlashlightActive(false);
    setFlashlightCooldown(0);
    setFlashlightDuration(0);
    // Reset tutorial states
    setShowTimerTutorial(false);
    setShowWavesTutorial(false);
    setShowBossBeachPopup(false);
    setLastWavesMissedUpgradeLevel(0); // Reset grace period for new run
    
    const { wavesToWin, wavesToLose } = getRoguelikeLevelSettings(1, 0);
    setRoguelikeWavesToWin(wavesToWin);
    setRoguelikeWavesToLose(wavesToLose);
    
    // Beach Bonanza: show beach selection instead of starting immediately
    if (runTypeValue === "beachBonanza") {
      const options = generateBeachOptions();
      setBeachOptions(options);
      setGameState("selectBeach");
    } else {
      // Start level with explicit roguelike flag and fully-reset bonuses/selection (avoid stale closure state)
      startLevel(1, true, 0, [], 0);
    }
  };

  // ============= SLAY THE WAVES FUNCTIONS =============
  
  // Start a new Slay the Waves run
  const startSlayTheWavesRun = (selectedMovementMode: MovementMode, selectedFootType: FootType, selectedToeTapMode: ToeTapMode) => {
    // Set movement and settings
    setMovementMode(selectedMovementMode);
    movementModeRef.current = selectedMovementMode;
    setMomentumGear(0);
    setFootType(selectedFootType);
    footTypeRef.current = selectedFootType;
    const isAutoTap = selectedToeTapMode === "auto";
    setAutoToeTap(isAutoTap);
    autoToeTapRef.current = isAutoTap;
    
    // Set run type
    setRunType("slayTheWaves");
    runTypeRef.current = "slayTheWaves";
    
    // Generate map for Act 1
    const newMap = generateMap(1);
    setSlayMap(newMap);
    
    // Reset Slay state
    setSlayGold(STARTING_GOLD);
    setSlayMaxWaterTime(STARTING_MAX_WATER_TIME);
    setSlayCurrentEvent(null);
    setSlayCardRewardAbilities([]);
    setSlayHasRested(false);
    setSlayHasSavedRun(false);
    localStorage.removeItem(SLAY_SAVED_RUN_KEY);
    
    // Reset roguelike state for reuse
    setIsRoguelike(true);
    setRoguelikeLevel(1);
    setUnlockedAbilities([]);
    setRoguelikeTotalWaves(0);
    setWaterTimeBonus(0);
    setWavesMissedBonus(0);
    setUsedBeachEffects([]);
    setBeachEffectWithRef(null);
    setPendingBeachEffect(null);
    setSelectedAbilities([]);
    setFishNetStuck(false);
    fishNetTimerRef.current = 0;
    setLevelScore(0);
    setTotalScore(0);
    setTotalSteps(0);
    setTotalToeTaps(0);
    setPermanentUpgrades({ fastFeet: 0, tapDancer: 0, wetShoes: 0 });
    
    // Randomly exclude 3 abilities
    const tier1Abilities: AbilityType[] = ["superTap", "ghostToe", "jumpAround", "waveMagnet", "waveSurfer"];
    const otherAbilities: AbilityType[] = ["crystalBall", "towelOff", "wetsuit", "doubleDip", "slowdown"];
    const shuffledTier1 = [...tier1Abilities].sort(() => Math.random() - 0.5);
    const shuffledOther = [...otherAbilities].sort(() => Math.random() - 0.5);
    const tier1ToExclude = shuffledTier1.slice(0, 2);
    const otherToExclude = shuffledOther.slice(0, 1);
    setExcludedAbilities([...tier1ToExclude, ...otherToExclude]);
    
    // Show map
    setGameState("slayMap");
  };
  
  // Continue a saved Slay run
  const continueSlayTheWavesRun = () => {
    const savedData = localStorage.getItem(SLAY_SAVED_RUN_KEY);
    if (!savedData) return;
    
    try {
      const saved = JSON.parse(savedData);
      setSlayMap(saved.map);
      setSlayGold(saved.gold);
      setSlayMaxWaterTime(saved.maxWaterTime);
      setUnlockedAbilities(saved.unlockedAbilities);
      setSelectedAbilities(saved.selectedAbilities);
      setExcludedAbilities(saved.excludedAbilities);
      setPermanentUpgrades(saved.permanentUpgrades);
      setTotalScore(saved.totalScore);
      setRoguelikeLevel(saved.floorsCleared + 1);
      setMovementMode(saved.movementMode);
      movementModeRef.current = saved.movementMode;
      setFootType(saved.footType);
      footTypeRef.current = saved.footType;
      setAutoToeTap(saved.toeTapMode === "auto");
      autoToeTapRef.current = saved.toeTapMode === "auto";
      setRunType("slayTheWaves");
      runTypeRef.current = "slayTheWaves";
      setIsRoguelike(true);
      
      localStorage.removeItem(SLAY_SAVED_RUN_KEY);
      setSlayHasSavedRun(false);
      setGameState("slayMap");
    } catch (e) {
      console.error("Failed to load Slay the Waves run", e);
    }
  };
  
  // Get available abilities for card rewards (not yet unlocked)
  const getCardRewardAbilities = (): AbilityType[] => {
    const unlocked = unlockedAbilities.map(a => a.type);
    const available = ALL_ABILITIES.filter(a => !unlocked.includes(a) && !excludedAbilities.includes(a));
    // Shuffle and pick 3
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  };
  
  // Handle selecting a node on the map
  const handleSlayNodeSelect = (nodeId: string) => {
    if (!slayMap) return;
    
    const node = slayMap.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Move to the node
    const newMap = moveToNode(slayMap, nodeId);
    setSlayMap(newMap);
    
    // Handle based on node type
    switch (node.type) {
      case "beach":
      case "elite":
      case "boss":
        // Set beach effect if applicable
        if (node.beachType) {
          setBeachEffectWithRef(node.beachType as BeachEffectType);
        }
        setSlayPendingNodeType(node.type);
        // Show beach preview screen instead of starting immediately
        setGameState("slayBeachPreview");
        break;
        
      case "rest":
        setSlayHasRested(false);
        setGameState("slayRest");
        break;
        
      case "shop":
        setGameState("slayShop");
        break;
        
      case "event":
        setSlayCurrentEvent(getRandomEvent());
        setGameState("slayEvent");
        break;
    }
  };
  
  // Handle completing a beach/elite/boss level in Slay mode
  const handleSlayLevelComplete = () => {
    // Award gold based on node type
    const goldEarned = slayPendingNodeType === "boss" ? GOLD_PER_BOSS : 
                       slayPendingNodeType === "elite" ? GOLD_PER_ELITE : GOLD_PER_BEACH;
    setSlayGold(prev => prev + goldEarned);
    
    // Get card reward abilities
    const rewardAbilities = getCardRewardAbilities();
    setSlayCardRewardAbilities(rewardAbilities);
    
    // Increment level
    setRoguelikeLevel(prev => prev + 1);
    
    // Check if boss - might advance act
    if (slayPendingNodeType === "boss" && slayMap) {
      // TODO: Handle act progression
    }
    
    // Show card reward screen if abilities available, otherwise go to map
    if (rewardAbilities.length > 0) {
      setGameState("slayCardReward");
    } else {
      setGameState("slayMap");
    }
  };
  
  // Handle selecting a card reward
  const handleSlayCardSelect = (ability: AbilityType) => {
    setUnlockedAbilities(prev => [...prev, { type: ability, upgradeCount: 0 }]);
    // Auto-add to selected if room
    if (selectedAbilities.length < 4) {
      setSelectedAbilities(prev => [...prev, ability]);
    }
    setGameState("slayMap");
  };
  
  // Handle skipping card reward for gold
  const handleSlayCardSkip = () => {
    setSlayGold(prev => prev + SKIP_CARD_GOLD);
    setGameState("slayMap");
  };
  
  // Start battle from beach preview
  const handleSlayStartBattle = () => {
    const { wavesToWin, wavesToLose } = getRoguelikeLevelSettings(roguelikeLevel);
    setRoguelikeWavesToWin(wavesToWin);
    setRoguelikeWavesToLose(Math.max(1, wavesToLose + wavesMissedBonus));
    startLevel(roguelikeLevel, true, waterTimeBonus, selectedAbilities.length > 0 ? selectedAbilities : undefined, wavesMissedBonus);
  };
  
  // Shop handlers
  const handleSlayShopPurchaseAbility = (ability: AbilityType) => {
    if (slayGold < SHOP_PRICES.ability) return;
    setSlayGold(prev => prev - SHOP_PRICES.ability);
    setUnlockedAbilities(prev => [...prev, { type: ability, upgradeCount: 0 }]);
    if (selectedAbilities.length < 4) {
      setSelectedAbilities(prev => [...prev, ability]);
    }
  };
  
  const handleSlayShopUpgrade = (ability: AbilityType) => {
    if (slayGold < SHOP_PRICES.upgrade) return;
    setSlayGold(prev => prev - SHOP_PRICES.upgrade);
    setUnlockedAbilities(prev => prev.map(a => 
      a.type === ability ? { ...a, upgradeCount: Math.min(10, a.upgradeCount + 1) } : a
    ));
  };
  
  const handleSlayShopWaterTime = () => {
    if (slayGold < SHOP_PRICES.waterTime) return;
    setSlayGold(prev => prev - SHOP_PRICES.waterTime);
    setSlayMaxWaterTime(prev => prev + 300);
    setWaterTimeBonus(prev => prev + 300);
  };
  
  const handleSlayShopPermanentUpgrade = (upgrade: PermanentUpgradeType) => {
    if (slayGold < SHOP_PRICES.permanentUpgrade) return;
    setSlayGold(prev => prev - SHOP_PRICES.permanentUpgrade);
    setPermanentUpgrades(prev => ({
      ...prev,
      [upgrade]: Math.min(5, prev[upgrade] + 1),
    }));
  };
  
  // Rest handlers
  const handleSlayRestWaterTime = () => {
    setSlayMaxWaterTime(prev => prev + REST_WATER_TIME_HEAL);
    setWaterTimeBonus(prev => prev + REST_WATER_TIME_HEAL);
    setSlayHasRested(true);
  };
  
  const handleSlayRestUpgrade = (ability: AbilityType) => {
    setUnlockedAbilities(prev => prev.map(a => 
      a.type === ability ? { ...a, upgradeCount: Math.min(10, a.upgradeCount + 1) } : a
    ));
    setSlayHasRested(true);
  };
  
  // Event handler
  const handleSlayEventOption = (option: EventOption) => {
    // Apply costs
    if (option.costGold && slayGold >= option.costGold) {
      setSlayGold(prev => prev - option.costGold!);
    }
    if (option.costHealth) {
      setSlayMaxWaterTime(prev => Math.max(1000, prev - option.costHealth!));
    }
    
    // Apply effects
    const effect = option.effect;
    switch (effect.type) {
      case "gainGold":
        setSlayGold(prev => prev + effect.amount);
        break;
      case "loseGold":
        setSlayGold(prev => Math.max(0, prev - effect.amount));
        break;
      case "gainAbility":
        const available = ALL_ABILITIES.filter(a => 
          !unlockedAbilities.some(u => u.type === a) && !excludedAbilities.includes(a)
        );
        if (available.length > 0) {
          const randomAbility = available[Math.floor(Math.random() * available.length)];
          setUnlockedAbilities(prev => [...prev, { type: randomAbility, upgradeCount: 0 }]);
          if (selectedAbilities.length < 4) {
            setSelectedAbilities(prev => [...prev, randomAbility]);
          }
          toast({ title: `Gained ${randomAbility}!` });
        }
        break;
      case "upgradeRandomAbility":
        if (unlockedAbilities.length > 0) {
          const toUpgrade = unlockedAbilities[Math.floor(Math.random() * unlockedAbilities.length)];
          setUnlockedAbilities(prev => prev.map(a => 
            a.type === toUpgrade.type ? { ...a, upgradeCount: Math.min(10, a.upgradeCount + 1) } : a
          ));
          toast({ title: `Upgraded ${toUpgrade.type}!` });
        }
        break;
      case "healWaterTime":
        setSlayMaxWaterTime(prev => prev + effect.amount);
        setWaterTimeBonus(prev => prev + effect.amount);
        break;
      case "damageWaterTime":
        setSlayMaxWaterTime(prev => Math.max(1000, prev - effect.amount));
        break;
      case "gainPermanentUpgrade":
        const upgrades: PermanentUpgradeType[] = ["fastFeet", "tapDancer", "wetShoes"];
        const randomUpgrade = upgrades[Math.floor(Math.random() * upgrades.length)];
        setPermanentUpgrades(prev => ({
          ...prev,
          [randomUpgrade]: Math.min(5, prev[randomUpgrade] + 1),
        }));
        toast({ title: `Gained permanent ${randomUpgrade}!` });
        break;
    }
    
    setGameState("slayMap");
  };
  
  // Save Slay run
  const saveSlayRun = () => {
    const savedRun = {
      map: slayMap,
      gold: slayGold,
      maxWaterTime: slayMaxWaterTime,
      unlockedAbilities,
      selectedAbilities,
      excludedAbilities,
      permanentUpgrades,
      totalScore,
      floorsCleared: roguelikeLevel - 1,
      movementMode,
      footType,
      toeTapMode: autoToeTap ? "auto" : "manual",
      savedAt: Date.now(),
    };
    localStorage.setItem(SLAY_SAVED_RUN_KEY, JSON.stringify(savedRun));
    setSlayHasSavedRun(true);
    setGameState("slayMenu");
  };
  
  // Check for saved Slay run on mount
  useEffect(() => {
    const savedData = localStorage.getItem(SLAY_SAVED_RUN_KEY);
    if (savedData) {
      setSlayHasSavedRun(true);
    }
  }, []);
  
  // ============= END SLAY THE WAVES FUNCTIONS =============

  // Handle beach selection in Beach Bonanza mode
  const handleSelectBeach = (beachType: BeachEffectType) => {
    setCurrentBeach(beachType);
    currentBeachRef.current = beachType;
    setBeachLevel(1);
    beachLevelRef.current = 1;
    
    // Set the beach effect (reduced for levels 1-4)
    setBeachEffectWithRef(beachType);
    
    // If this is the initial beach selection (level 1), start the level directly
    // Otherwise (after a boss), go to upgrade screen first
    if (roguelikeLevel === 1) {
      startLevel(1, true, waterTimeBonus, selectedAbilities.length > 0 ? selectedAbilities : undefined, wavesMissedBonus);
    } else {
      setGameState("levelComplete");
    }
  };

  // Helper to get the next beach effect for a boss level
  const getNextBeachEffect = useCallback((): BeachEffectType => {
    // Get available effects (ones not used yet)
    let availableEffects = BEACH_EFFECTS
      .map(e => e.type)
      .filter(e => !usedBeachEffects.includes(e));
    
    // If all effects have been used, reset the pool
    if (availableEffects.length === 0) {
      availableEffects = BEACH_EFFECTS.map(e => e.type);
      setUsedBeachEffects([]);
    }
    
    // Pick a random effect from available
    const randomIndex = Math.floor(Math.random() * availableEffects.length);
    return availableEffects[randomIndex];
  }, [usedBeachEffects]);

  // Check if next level is a boss level
  const isNextLevelBoss = useCallback((currentLevel: number): boolean => {
    const nextLevel = currentLevel + 1;
    return nextLevel % 5 === 0;
  }, []);

  // Get info about the next boss level effect (uses pre-determined pending effect)
  const getUpcomingBossEffect = useCallback((): { type: BeachEffectType; name: string; description: string } | null => {
    if (!isNextLevelBoss(roguelikeLevel)) return null;
    if (!pendingBeachEffect) return null;
    
    const effectInfo = BEACH_EFFECTS.find(e => e.type === pendingBeachEffect);
    return effectInfo || null;
  }, [roguelikeLevel, isNextLevelBoss, pendingBeachEffect]);

  // Save current roguelike run to localStorage
  const saveRoguelikeRun = () => {
    // Save with level decremented so continuing starts at the beginning of current level
    // (restores to end of previous level state)
    const levelToSave = Math.max(1, roguelikeLevel - 1);
    const beachLevelToSave = runType === "beachBonanza" ? Math.max(1, beachLevel - 1) : beachLevel;
    
    const savedRun: SavedRun = {
      roguelikeLevel: levelToSave,
      unlockedAbilities,
      roguelikeTotalWaves,
      waterTimeBonus,
      wavesMissedBonus,
      lastWavesMissedUpgradeLevel,
      selectedAbilities,
      usedBeachEffects,
      currentBeachEffect,
      pendingBeachEffect,
      totalScore,
      permanentUpgrades,
      excludedAbilities,
      savedAt: Date.now(),
      // Beach Bonanza specific fields
      runType,
      currentBeach,
      beachLevel: beachLevelToSave,
      beachNumber,
      completedBeaches,
      autoToeTap,
      movementMode,
    };
    localStorage.setItem(SAVED_RUN_KEY, JSON.stringify(savedRun));
    setHasSavedRun(true);
    setSavedRunTypeFromStorage(runType === "beachBonanza" ? "beachBonanza" : "standard");
    setGameState("roguelikeMenu");
  };

  // Load and continue a saved roguelike run
  const continueRoguelikeRun = () => {
    const savedData = localStorage.getItem(SAVED_RUN_KEY);
    if (!savedData) return;
    
    try {
      const savedRun: SavedRun = JSON.parse(savedData);
      
      // Clear the saved run now that we're continuing (prevents re-loading same state)
      localStorage.removeItem(SAVED_RUN_KEY);
      setHasSavedRun(false);
      
      setIsRoguelike(true);
      setRoguelikeLevel(savedRun.roguelikeLevel);
      setUnlockedAbilities(savedRun.unlockedAbilities);
      setRoguelikeTotalWaves(savedRun.roguelikeTotalWaves);
      setWaterTimeBonus(savedRun.waterTimeBonus);
      setWavesMissedBonus(savedRun.wavesMissedBonus);
      setLastWavesMissedUpgradeLevel(savedRun.lastWavesMissedUpgradeLevel || 0);
      setSelectedAbilities(savedRun.selectedAbilities);
      setUsedBeachEffects(savedRun.usedBeachEffects || []);
      setBeachEffectWithRef(savedRun.currentBeachEffect || null);
      setPendingBeachEffect(savedRun.pendingBeachEffect || null);
      setTotalScore(savedRun.totalScore || 0);
      setPermanentUpgrades(savedRun.permanentUpgrades || { fastFeet: 0, tapDancer: 0, wetShoes: 0 });
      setExcludedAbilities(savedRun.excludedAbilities || []);
      setLevelScore(0);
      
      // Restore Beach Bonanza specific state
      const restoredRunType = savedRun.runType || "roguelike";
      setRunType(restoredRunType);
      runTypeRef.current = restoredRunType;
      setCurrentBeach(savedRun.currentBeach || null);
      currentBeachRef.current = savedRun.currentBeach || null;
      setBeachLevel(savedRun.beachLevel || 1);
      beachLevelRef.current = savedRun.beachLevel || 1;
      setBeachNumber(savedRun.beachNumber || 1);
      setCompletedBeaches(savedRun.completedBeaches || []);
      
      // For Beach Bonanza, ensure currentBeachEffect matches currentBeach
      // (currentBeach is the source of truth for Beach Bonanza mode)
      if (restoredRunType === "beachBonanza" && savedRun.currentBeach) {
        setBeachEffectWithRef(savedRun.currentBeach);
      }
      
      // Restore toe tap mode
      const restoredAutoToeTap = savedRun.autoToeTap ?? false;
      setAutoToeTap(restoredAutoToeTap);
      autoToeTapRef.current = restoredAutoToeTap;
      
      // Restore movement mode
      const restoredMovementMode = savedRun.movementMode || "standard";
      setMovementMode(restoredMovementMode);
      movementModeRef.current = restoredMovementMode;
      
      const { wavesToWin, wavesToLose } = getRoguelikeLevelSettings(savedRun.roguelikeLevel, savedRun.lastWavesMissedUpgradeLevel || 0);
      setRoguelikeWavesToWin(wavesToWin);
      setRoguelikeWavesToLose(Math.max(1, wavesToLose + savedRun.wavesMissedBonus));
      
      // Return to level complete screen since that's where they paused
      setGameState("levelComplete");
    } catch (e) {
      console.error("Failed to load saved run:", e);
      localStorage.removeItem(SAVED_RUN_KEY);
      setHasSavedRun(false);
    }
  };

  // Check for saved run on mount
  useEffect(() => {
    const savedData = localStorage.getItem(SAVED_RUN_KEY);
    setHasSavedRun(!!savedData);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setSavedRunTypeFromStorage(parsed.runType === "beachBonanza" ? "beachBonanza" : "standard");
      } catch (e) {
        setSavedRunTypeFromStorage("standard");
      }
    }
  }, []);

  const handleUpgradeWavesMissed = () => {
    const newBonus = wavesMissedBonus + 1;
    setWavesMissedBonus(newBonus);
    // Track the level at which this upgrade was applied (current level, before advancing)
    const upgradeAppliedLevel = roguelikeLevel;
    setLastWavesMissedUpgradeLevel(upgradeAppliedLevel);
    // Advance to next level
    const nextLevel = roguelikeLevel + 1;
    setRoguelikeLevel(nextLevel);
    
    // Update waves to lose with the new bonus (use upgradeAppliedLevel for grace period)
    const { wavesToWin, wavesToLose } = getRoguelikeLevelSettings(nextLevel, upgradeAppliedLevel);
    setRoguelikeWavesToWin(wavesToWin);
    setRoguelikeWavesToLose(Math.max(1, wavesToLose + newBonus));
    
    // Check if ability selection is needed
    if (unlockedAbilities.length > 4) {
      if (selectedAbilities.length === 4) {
        setGameState("confirmLoadout");
      } else {
        setGameState("selectAbilities");
      }
    } else {
      startLevel(nextLevel, undefined, undefined, undefined, newBonus);
    }
  };

  // Show roguelike start screen if prop is set
  useEffect(() => {
    if (startInRoguelike && gameState === "menu") {
      setGameState("roguelikeMenu");
    }
  }, [startInRoguelike, gameState]);

  const startGame = () => {
    setGameState("playing");
    setFeetPosition(35);
    setWaves([]);
    setWaterTimer(5000);
    setWavesTouched(0);
    setWavesMissed(0);
    setGameOverReason(null);
    waveIdRef.current = 0;
    setIsTapping(false);
    // Reset refs for scaling modes
    wavesTouchedRef.current = 0;
    // Reset abilities
    setInvincible({ active: false, cooldownRemaining: 0, durationRemaining: 0 });
    setSuperTap({ active: false, cooldownRemaining: 0, usesRemaining: SUPER_TAP_USES });
    setGhostToe({ active: false, cooldownRemaining: 0, durationRemaining: 0 });
    setCrystalBall({ active: false, cooldownRemaining: 0, durationRemaining: 0 });
  };

  const goToMenu = () => {
    setGameState("menu");
    setIsRoguelike(false);
  };

  // Helper to start level after upgrade
  const proceedAfterUpgrade = (nextLevel: number, newBonus?: number, newAbilities?: AbilityType[]) => {
    if (newAbilities) {
      startLevel(nextLevel, undefined, newBonus, newAbilities);
    } else if (newBonus !== undefined) {
      startLevel(nextLevel, undefined, newBonus);
    } else {
      startLevel(nextLevel);
    }
  };

  // Roguelike ability selection handlers
  const handleUnlockAbility = (type: AbilityType) => {
    const newUnlocked = [...unlockedAbilities, { type, upgradeCount: 0 }];
    setUnlockedAbilities(newUnlocked);
    // Advance to next level
    const nextLevel = roguelikeLevel + 1;
    setRoguelikeLevel(nextLevel);
    
    // Check if ability selection is needed (more than 4 abilities)
    if (newUnlocked.length > 4) {
      const { wavesToWin, wavesToLose } = getRoguelikeLevelSettings(nextLevel, lastWavesMissedUpgradeLevel);
      setRoguelikeWavesToWin(wavesToWin);
      setRoguelikeWavesToLose(Math.max(1, wavesToLose + wavesMissedBonus));
      // If we have a valid previous selection, show confirm screen; otherwise select
      if (selectedAbilities.length === 4) {
        setGameState("confirmLoadout");
      } else {
        setGameState("selectAbilities");
      }
    } else {
      // Pass the new abilities directly since state hasn't updated yet
      const { wavesToWin, wavesToLose } = getRoguelikeLevelSettings(nextLevel, lastWavesMissedUpgradeLevel);
      setRoguelikeWavesToWin(wavesToWin);
      setRoguelikeWavesToLose(Math.max(1, wavesToLose + wavesMissedBonus));
      proceedAfterUpgrade(nextLevel, undefined, newUnlocked.map(a => a.type));
    }
  };

  const handleUpgradeAbility = (type: AbilityType) => {
    const newUnlocked = unlockedAbilities.map((a) => 
      a.type === type ? { ...a, upgradeCount: Math.min(10, a.upgradeCount + 1) } : a
    );
    setUnlockedAbilities(newUnlocked);
    // Advance to next level
    const nextLevel = roguelikeLevel + 1;
    setRoguelikeLevel(nextLevel);
    
    // Check if ability selection is needed
    if (newUnlocked.length > 4) {
      const { wavesToWin, wavesToLose } = getRoguelikeLevelSettings(nextLevel, lastWavesMissedUpgradeLevel);
      setRoguelikeWavesToWin(wavesToWin);
      setRoguelikeWavesToLose(wavesToLose + wavesMissedBonus);
      // If we have a valid previous selection, show confirm screen; otherwise select
      if (selectedAbilities.length === 4) {
        setGameState("confirmLoadout");
      } else {
        setGameState("selectAbilities");
      }
    } else {
      // Pass the abilities directly since state hasn't updated yet
      const { wavesToWin, wavesToLose } = getRoguelikeLevelSettings(nextLevel, lastWavesMissedUpgradeLevel);
      setRoguelikeWavesToWin(wavesToWin);
      setRoguelikeWavesToLose(wavesToLose + wavesMissedBonus);
      proceedAfterUpgrade(nextLevel, undefined, newUnlocked.map(a => a.type));
    }
  };

  const handleUpgradeWaterTime = () => {
    // Water time upgrade scales with level: 0.3s before 20, 0.2s at 20+, 0.1s at 30+
    const upgradeAmount = roguelikeLevel >= 30 ? 100 : roguelikeLevel >= 20 ? 200 : 300;
    const newBonus = waterTimeBonus + upgradeAmount;
    setWaterTimeBonus(newBonus);
    // Advance to next level
    const nextLevel = roguelikeLevel + 1;
    setRoguelikeLevel(nextLevel);
    
    // Check if ability selection is needed
    if (unlockedAbilities.length > 4) {
      const { wavesToWin, wavesToLose } = getRoguelikeLevelSettings(nextLevel, lastWavesMissedUpgradeLevel);
      setRoguelikeWavesToWin(wavesToWin);
      setRoguelikeWavesToLose(wavesToLose + wavesMissedBonus);
      // If we have a valid previous selection, show confirm screen; otherwise select
      if (selectedAbilities.length === 4) {
        setGameState("confirmLoadout");
      } else {
        setGameState("selectAbilities");
      }
    } else {
      proceedAfterUpgrade(nextLevel, newBonus);
    }
  };

  const handleContinueWithoutUpgrade = () => {
    // Advance to next level without any upgrades
    const nextLevel = roguelikeLevel + 1;
    setRoguelikeLevel(nextLevel);
    
    // Check if ability selection is needed
    if (unlockedAbilities.length > 4) {
      const { wavesToWin, wavesToLose } = getRoguelikeLevelSettings(nextLevel, lastWavesMissedUpgradeLevel);
      setRoguelikeWavesToWin(wavesToWin);
      setRoguelikeWavesToLose(wavesToLose + wavesMissedBonus);
      // If we have a valid previous selection, show confirm screen; otherwise select
      if (selectedAbilities.length === 4) {
        setGameState("confirmLoadout");
      } else {
        setGameState("selectAbilities");
      }
    } else {
      proceedAfterUpgrade(nextLevel);
    }
  };

  // Handle selecting a permanent upgrade after boss beach
  const handleSelectPermanentUpgrade = (upgradeType: PermanentUpgradeType) => {
    
    setPermanentUpgrades(prev => ({
      ...prev,
      [upgradeType]: prev[upgradeType] + 1,
    }));
    // Advance to next level
    const nextLevel = roguelikeLevel + 1;
    setRoguelikeLevel(nextLevel);
    
    // Check if ability selection is needed
    if (unlockedAbilities.length > 4) {
      const { wavesToWin, wavesToLose } = getRoguelikeLevelSettings(nextLevel, lastWavesMissedUpgradeLevel);
      setRoguelikeWavesToWin(wavesToWin);
      setRoguelikeWavesToLose(wavesToLose + wavesMissedBonus);
      if (selectedAbilities.length === 4) {
        setGameState("confirmLoadout");
      } else {
        setGameState("selectAbilities");
      }
    } else {
      proceedAfterUpgrade(nextLevel);
    }
  };

  useEffect(() => {
    // Only consume uses in classic mode (not roguelike which is duration-based)
    if (!isRoguelike && isTapping && superTap.active && superTap.usesRemaining !== undefined && superTap.usesRemaining > 0) {
      setSuperTap((prev) => {
        const newUses = (prev.usesRemaining ?? 0) - 1;
        if (newUses <= 0) {
          return { active: false, cooldownRemaining: SUPER_TAP_COOLDOWN, usesRemaining: 0 };
        }
        return { ...prev, usesRemaining: newUses };
      });
    }
  }, [isTapping, isRoguelike]); // Only trigger when isTapping changes to true

  const isTouching = isTouchingWater();

  // Get current max values for display
  // For Boss Quick Run: show accumulated total / max (e.g., "4/20")
  // For other modes: show current level misses / allowed
  const isBossQuickRun = runTypeRef.current === "bossQuickRun";
  const isBossHellRun = runTypeRef.current === "bossHellRun";
  const isBossRun = isBossQuickRun || isBossHellRun;
  const bossRunMaxMisses = isBossHellRun ? BOSS_HELL_RUN_MAX_MISSES : BOSS_QUICK_RUN_MAX_MISSES;
  const bossQuickRunCurrentMisses = bossQuickRunTotalMisses + wavesMissed; // Accumulated + current level
  const missedDisplay = isBossRun ? bossQuickRunCurrentMisses : wavesMissed;
  const maxMissedDisplay = isBossRun ? bossRunMaxMisses : (isRoguelike ? roguelikeWavesToLose : 10);
  const superTapMaxDuration = isRoguelike ? getAbilityDuration("superTap") : SUPER_TAP_USES;
  const wetsuitMaxDuration = isRoguelike ? getAbilityDuration("wetsuit") : WETSUIT_DURATION;
  const ghostToeMaxDuration = isRoguelike ? getAbilityDuration("ghostToe") : GHOST_TOE_DURATION;
  const crystalBallMaxDuration = isRoguelike ? getAbilityDuration("crystalBall") : 0;
  const slowdownMaxDuration = isRoguelike ? getAbilityDuration("slowdown") : 0;
  const waveMagnetMaxDuration = isRoguelike ? getAbilityDuration("waveMagnet") : 0;
  const waveSurferMaxDuration = isRoguelike ? getAbilityDuration("waveSurfer") : 0;
  const towelOffMaxDuration = isRoguelike ? getAbilityDuration("towelOff") : 0;
  const doubleDipMaxDuration = isRoguelike ? getAbilityDuration("doubleDip") : 0;
  const jumpAroundMaxDuration = isRoguelike ? getAbilityDuration("jumpAround") : 0;

  // Render the pixel grid
  const renderGrid = () => {
    const cells = [];
    
    // For spike waves effect: get current time for flashing animation
    const isSpikeWavesActive = currentBeachEffect === "spikeWaves";
    const spikeFlashPhase = isSpikeWavesActive ? Math.floor(Date.now() / 150) % 2 : 0; // Toggle every 150ms
    
    // Nighttime beach: calculate lit rows for flashlight effect
    const isNighttime = currentBeachEffect === "nighttime";
    const feetRow = Math.floor(feetPosition);
    // Levels 1-4: 7 rows toward shore, Boss: 5 rows toward shore
    const isReducedNighttimeRows = runType === "beachBonanza" && beachLevel < 5;
    const flashlightRowCount = isReducedNighttimeRows ? FLASHLIGHT_ROWS_REDUCED : FLASHLIGHT_ROWS_BOSS;
    const flashlightMinRow = Math.max(0, feetRow - flashlightRowCount);
    const flashlightMaxRow = feetRow + 1; // Include the feet row and one below
    
    // Helper to check if a cell is within flashlight cone
    const isInFlashlightCone = (x: number, y: number): boolean => {
      if (!flashlightActive || !isNighttime) return false;
      if (y < flashlightMinRow || y > flashlightMaxRow) return false;
      
      // Flashlight cone: starts at feet width (2 cells) and expands outward
      // At feet row: width = 2 cells centered
      // Each row away from feet: expand by 0.5 cells on each side
      const distanceFromFeet = feetRow - y;
      const coneHalfWidth = 1 + (distanceFromFeet * 0.5); // Starts at 1 (2 cells total), expands
      const centerX = OCEAN_WIDTH / 2 - 0.5; // Center between the two feet columns (9.5)
      const distFromCenter = Math.abs(x - centerX);
      
      return distFromCenter <= coneHalfWidth;
    };
    
    // Helper to check if a cell is at the edge of flashlight cone (for glow effect)
    const isAtConeEdge = (x: number, y: number): boolean => {
      if (!flashlightActive || !isNighttime) return false;
      if (!isInFlashlightCone(x, y)) return false;
      
      // Check if any adjacent cell (that exists) is in darkness
      const neighbors = [
        { nx: x - 1, ny: y },     // left
        { nx: x + 1, ny: y },     // right
        { nx: x, ny: y - 1 },     // up
        { nx: x, ny: y + 1 },     // down
      ];
      
      for (const { nx, ny } of neighbors) {
        if (nx >= 0 && nx < OCEAN_WIDTH && ny >= 0 && ny < TOTAL_HEIGHT) {
          if (!isInFlashlightCone(nx, ny)) {
            return true; // Adjacent to darkness = edge cell
          }
        }
      }
      
      // Also check if at the top/bottom boundary of cone
      if (y === flashlightMinRow || y === flashlightMaxRow) return true;
      
      return false;
    };

    for (let y = 0; y < TOTAL_HEIGHT; y++) {
      for (let x = 0; x < OCEAN_WIDTH; x++) {
        let cellType: "ocean" | "crest" | "beach" = "beach";

        if (y < OCEAN_HEIGHT) {
          // Ocean rows are always ocean (blue)
          cellType = "ocean";
        } else {
          // Beach area - default to sand
          cellType = "beach";
        }

        // Check if this exact row is a wave crest (only 1 crest row per wave)
        const crestWave = waves.find((wave) => y === wave.row);
        const isCrest = !!crestWave;
        if (isCrest) {
          cellType = "crest";
        } else if (y >= OCEAN_HEIGHT) {
          // Beach row - check if wave covers it (rows between shoreline and crest are water)
          const isWaterCovered = waves.some((wave) => y < wave.row && y >= OCEAN_HEIGHT);
          cellType = isWaterCovered ? "ocean" : "beach";
        }

        // Check if this cell is a spike wave indicator (row just below a wave crest, full width)
        const spikeWave = isSpikeWavesActive ? waves.find((wave) => y === wave.row + 1) : null;
        const isSpikeCell = !!spikeWave; // Full width, we'll render half-height in the cell

        // Check if Crystal Ball is active and this is the peak row of the next incoming wave
        // Check for both beach and underwater beach (wave-covered) positions
        const nextIncomingWave = waves.find((wave) => wave.phase === "incoming");
        const isBeachRow = y >= OCEAN_HEIGHT;
        const isCrystalBallIndicator = crystalBall.active && 
          isBeachRow && 
          nextIncomingWave && 
          y === nextIncomingWave.maxReach;

        // Determine color - use touched crest color if the wave was touched
        // Apply pink tint when slowdown is active
        let color: string;
        
        // Check if this cell should be visible (not in nighttime darkness)
        const cellInLight = isInFlashlightCone(x, y);
        const isInDarkness = isNighttime && !cellInLight;
        
        // Nighttime: make everything dark except lit cells and crystal ball indicator
        if (isInDarkness && !isCrystalBallIndicator) {
          color = "hsl(220, 15%, 8%)"; // Very dark blue-gray for nighttime
        } else if (cellType === "beach") {
          // Crystal ball shows dark line on bottom half of the row
          if (isCrystalBallIndicator) {
            color = "hsl(42, 30%, 45%)"; // Darker sand color
          } else {
            color = COLORS.sand;
          }
        } else if (cellType === "crest" && crestWave?.touched) {
          color = COLORS.crestTouched; // Keep touched crest color unchanged during slowdown
        } else if (cellType === "crest" && crestWave?.magnetAffected) {
          color = "hsl(0, 70%, 60%)"; // Red-tinted crest for magnet-affected waves
        } else if (cellType === "crest") {
          color = COLORS.crest; // Keep crest white during slowdown
        } else if (cellType === "ocean") {
          color = slowdown.active ? "hsl(280, 50%, 40%)" : COLORS.ocean; // Purple-pink ocean
        } else {
          color = COLORS[cellType];
        }

        const isTouchedCrest = cellType === "crest" && crestWave?.touched;
        const isMagnetCrest = cellType === "crest" && crestWave?.magnetAffected && !crestWave?.touched;
        const isConeEdge = isAtConeEdge(x, y);

        // Determine box shadow - flashlight edge glow takes priority for lit cells
        // Only show glow effects for cells that are in the lit area during nighttime
        let cellBoxShadow: string | undefined;
        const showEffectsInLight = !isNighttime || cellInLight;
        if (isTouchedCrest && showEffectsInLight) {
          cellBoxShadow = `0 0 8px 2px ${COLORS.crestTouched}`;
        } else if (isMagnetCrest && showEffectsInLight) {
          cellBoxShadow = `0 0 10px 3px hsl(0, 70%, 50%)`;
        } else if (isCrystalBallIndicator) {
          // Crystal Conch always visible, even in nighttime darkness
          cellBoxShadow = `0 0 12px 4px hsl(180, 80%, 50%)`;
        }

        cells.push(
          <div
            key={`${x}-${y}`}
            className={cn(
              isCrystalBallIndicator && "animate-pulse",
              isMagnetCrest && showEffectsInLight && "animate-pulse"
            )}
            style={{
              width: PIXEL_SIZE,
              height: PIXEL_SIZE,
              backgroundColor: color,
              boxShadow: cellBoxShadow,
              outline: `1px solid ${color}`, // Prevent subpixel rendering gaps
              position: (isTouchedCrest && showEffectsInLight) || isCrystalBallIndicator || isSpikeCell || (isMagnetCrest && showEffectsInLight) || isConeEdge ? "relative" : undefined,
              zIndex: isConeEdge ? 15 : isCrystalBallIndicator ? 20 : ((isTouchedCrest || isMagnetCrest) && showEffectsInLight) ? 10 : undefined,
            }}
          >
            {/* Spike wave indicator - half-height silver bar at top of cell */}
            {isSpikeCell && (
              <div
                className="absolute left-0 right-0 top-0 transition-colors duration-200"
                style={{
                  height: PIXEL_SIZE / 2,
                  backgroundColor: spikeFlashPhase === 0 
                    ? "hsl(0, 0%, 70%)" // Silver (toned down)
                    : "hsl(0, 0%, 80%)", // Lighter silver flash (reduced contrast)
                  boxShadow: `0 0 4px 1px hsl(0, 0%, ${spikeFlashPhase === 0 ? 55 : 65}%)`,
                  zIndex: 15,
                }}
              />
            )}
          </div>
        );
      }
    }

    return cells;
  };

  // Render feet as pixel art (2 wide, 2 tall)
  const renderFeet = () => {
    // Calculate toe extension with Super Tap multiplier
    // Apply Gummy Beach effect to visual calculation to match game logic
    const isGummyBeachActive = currentBeachEffect === "gummyBeach";
    const isGummyBoss = isGummyBeachActive && (runType !== "beachBonanza" || beachLevel >= 5);
    
    let visualToeExtension = isTapping ? 0.5 : 0;
    if (isGummyBeachActive) {
      if (isGummyBoss) {
        visualToeExtension = 0; // Boss level: no toe tap
      } else {
        // Reduced toe extension for non-boss gummy beach
        const levelMultipliers = [0.60, 0.50, 0.40, 0.30];
        visualToeExtension *= levelMultipliers[beachLevel - 1] || 0.30;
      }
    }
    const toeExtension = superTap.active ? visualToeExtension * SUPER_TAP_MULTIPLIER : visualToeExtension;
    const feetY = (feetPosition - toeExtension) * PIXEL_SIZE;
    const feetX = (OCEAN_WIDTH / 2 - 1) * PIXEL_SIZE;
    
    // Calculate foot height - stretches when Super Tap is active and tapping (blocked by Gummy Boss)
    const baseFootHeight = PIXEL_SIZE * 2;
    const canStretch = !isGummyBoss && isTapping;
    const stretchAmount = superTap.active && canStretch ? (SUPER_TAP_MULTIPLIER - 1) * 0.5 * PIXEL_SIZE : 0;
    const footHeight = baseFootHeight + stretchAmount;

    // Ghost toe extension height
    const ghostToeHeight = ghostToe.active ? GHOST_TOE_EXTENSION * PIXEL_SIZE : 0;

    // Ability-based foot color
    // Check if teleport immunity is active (shield persists after ability timer ends)
    // Use a small threshold (10ms) to avoid visual flickering from floating point precision
    const hasTeleportImmunity = waveSurferShield > 10;
    
    const getFeetColor = () => {
      if (fishNetStuck) return "hsl(30, 60%, 40%)"; // Dark brown/orange when stuck in fish net
      if (currentBeachEffect === "quicksand" && quicksandPenaltyActiveRef.current) return "hsl(30, 60%, 40%)"; // Dark brown/orange when quicksand penalty active (matches fish net)
      if (feetMagnetized) return "hsl(0, 70%, 60%)"; // Red glow when magnetized to wave
      if (jumpAround.active) return "hsl(84, 80%, 55%)"; // Lime green for Jump Around
      if (superTap.active) return "hsl(50, 100%, 60%)";
      if (isTouching) return COLORS.feetTouching;
      return COLORS.feet;
    };
    
    // Teleport uses a special striped gradient - handled separately in style
    const getTeleportGradient = () => 
      "repeating-linear-gradient(45deg, hsl(174, 70%, 50%), hsl(174, 70%, 50%) 4px, hsl(280, 60%, 35%) 4px, hsl(280, 60%, 35%) 8px)";

    // Get filter effect based on active abilities
    const getFilterEffect = () => {
      if (fishNetStuck || (currentBeachEffect === "quicksand" && quicksandPenaltyActiveRef.current)) return "drop-shadow(0 0 8px hsl(30, 60%, 30%))"; // Dark glow when stuck
      if (feetMagnetized) return "drop-shadow(0 0 16px hsl(0, 70%, 50%)) drop-shadow(0 0 24px hsl(0, 70%, 40%))"; // Strong red glow when magnetized
      if (jumpAround.active) return "drop-shadow(0 0 12px hsl(84, 80%, 55%))";
      if (waveSurfer.active || hasTeleportImmunity) return "drop-shadow(0 0 12px hsl(280, 60%, 50%)) drop-shadow(0 0 20px hsl(174, 70%, 50%))"; // Purple/teal glow for teleport
      if (superTap.active) return "drop-shadow(0 0 12px hsl(50, 100%, 60%))";
      if (isTouching) return `drop-shadow(0 0 8px ${COLORS.feetTouching})`;
      if (ghostToe.active) return "drop-shadow(0 0 6px hsl(270, 70%, 60%))";
      return "none";
    };

    return (
      <div
        className={cn(
          "absolute flex gap-1",
          // Momentum updates position every frame; CSS transitions cause visible lag/jumps.
          movementMode === "momentum" ? "transition-none" : "transition-all duration-75",
          isTapping && "scale-110",
          superTap.active && "animate-pulse",
          jumpAround.active && "animate-[pulse_0.3s_ease-in-out_infinite]"
        )}
        style={{
          left: feetX,
          top: feetY - ghostToeHeight,
          filter: getFilterEffect(),
          zIndex: 20, // Ensure feet render above grid cells (flashlight edges are z-15)
        }}
      >
        {/* Left foot with ghost feet extension */}
        <div className="flex flex-col">
          {/* Ghost feet extension - full ghost foot */}
          {ghostToe.active && (
            <div
              className="transition-all duration-100"
              style={{
                width: PIXEL_SIZE,
                height: ghostToeHeight,
                backgroundColor: "hsla(270, 70%, 60%, 0.3)",
                border: "2px solid hsl(270, 70%, 60%)",
                borderBottom: "none",
                borderRadius: "4px 4px 0 0",
                opacity: 0.9,
                boxShadow: "0 0 8px hsla(270, 70%, 60%, 0.5)",
              }}
            />
          )}
          {/* Actual foot */}
          <div
            className="transition-all duration-100 relative"
            style={{
              width: PIXEL_SIZE,
              height: footHeight,
              backgroundColor: (!jumpAround.active && (waveSurfer.active || hasTeleportImmunity)) ? undefined : getFeetColor(),
              background: (!jumpAround.active && (waveSurfer.active || hasTeleportImmunity)) ? getTeleportGradient() : undefined,
              border: `2px solid ${jumpAround.active ? "hsl(84, 60%, 35%)" : (waveSurfer.active || hasTeleportImmunity) ? "hsl(280, 50%, 40%)" : superTap.active ? "hsl(45, 100%, 40%)" : COLORS.feetOutline}`,
              boxShadow: (!jumpAround.active && (waveSurfer.active || hasTeleportImmunity)) ? "0 0 12px hsl(280, 60%, 50%), 0 0 24px hsl(174, 70%, 40%)" : undefined,
              borderRadius: ghostToe.active ? "0 0 4px 4px" : "4px",
            }}
          >
            {/* Toe Warrior immunity line - dotted line at 35% from top */}
            {footType === "toeWarrior" && (
              <div
                style={{
                  position: "absolute",
                  top: footHeight * 0.35,
                  left: 0,
                  right: 0,
                  borderTop: "2px dashed hsla(180, 70%, 60%, 0.8)",
                }}
              />
            )}
          </div>
        </div>
        {/* Right foot with ghost feet extension */}
        <div className="flex flex-col">
          {/* Ghost feet extension - full ghost foot */}
          {ghostToe.active && (
            <div
              className="transition-all duration-100"
              style={{
                width: PIXEL_SIZE,
                height: ghostToeHeight,
                backgroundColor: "hsla(270, 70%, 60%, 0.3)",
                border: "2px solid hsl(270, 70%, 60%)",
                borderBottom: "none",
                borderRadius: "4px 4px 0 0",
                opacity: 0.9,
                boxShadow: "0 0 8px hsla(270, 70%, 60%, 0.5)",
              }}
            />
          )}
          {/* Actual foot */}
          <div
            className="transition-all duration-100 relative"
            style={{
              width: PIXEL_SIZE,
              height: footHeight,
              backgroundColor: (!jumpAround.active && (waveSurfer.active || hasTeleportImmunity)) ? undefined : getFeetColor(),
              background: (!jumpAround.active && (waveSurfer.active || hasTeleportImmunity)) ? getTeleportGradient() : undefined,
              border: `2px solid ${jumpAround.active ? "hsl(84, 60%, 35%)" : (waveSurfer.active || hasTeleportImmunity) ? "hsl(280, 50%, 40%)" : superTap.active ? "hsl(45, 100%, 40%)" : COLORS.feetOutline}`,
              boxShadow: (!jumpAround.active && (waveSurfer.active || hasTeleportImmunity)) ? "0 0 12px hsl(280, 60%, 50%), 0 0 24px hsl(174, 70%, 40%)" : undefined,
              borderRadius: ghostToe.active ? "0 0 4px 4px" : "4px",
            }}
          >
            {/* Toe Warrior immunity line - dotted line at 35% from top */}
            {footType === "toeWarrior" && (
              <div
                style={{
                  position: "absolute",
                  top: footHeight * 0.35,
                  left: 0,
                  right: 0,
                  borderTop: "2px dashed hsla(180, 70%, 60%, 0.8)",
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render wave surfer teleport trail particles
  const renderWaveSurferTrail = () => {
    const now = Date.now();
    const feetX = (OCEAN_WIDTH / 2) * PIXEL_SIZE; // Center of feet
    
    return waveSurferParticles.map(particle => {
      const age = now - particle.spawnTime;
      const progress = Math.min(age / 500, 1); // 500ms animation
      const opacity = 1 - progress;
      
      // Create multiple particles along the trail
      const particleCount = 8;
      const minRow = Math.min(particle.startRow, particle.endRow);
      const maxRow = Math.max(particle.startRow, particle.endRow);
      const rowSpan = maxRow - minRow;
      
      return [...Array(particleCount)].map((_, i) => {
        const particleProgress = i / (particleCount - 1);
        const row = minRow + rowSpan * particleProgress;
        const y = row * PIXEL_SIZE;
        
        // Stagger the animation for each particle
        const delay = i * 0.05;
        const adjustedProgress = Math.max(0, Math.min(1, (progress - delay) / (1 - delay * particleCount)));
        const particleOpacity = opacity * (1 - adjustedProgress * 0.5);
        
        // Add some horizontal scatter
        const scatter = Math.sin(i * 1.5 + age * 0.01) * 8;
        
        return (
          <div
            key={`${particle.id}-${i}`}
            className="absolute pointer-events-none rounded-full"
            style={{
              left: feetX + scatter - 4,
              top: y - 4,
              width: 8 + Math.sin(i * 2) * 2,
              height: 8 + Math.cos(i * 2) * 2,
              backgroundColor: i % 2 === 0 ? 'hsl(174, 70%, 50%)' : 'hsl(180, 80%, 60%)',
              opacity: particleOpacity * 0.8,
              transform: `scale(${1 - adjustedProgress * 0.5})`,
              boxShadow: `0 0 ${8 + i * 2}px hsl(174, 70%, 50%)`,
              transition: 'all 0.1s ease-out',
            }}
          />
        );
      });
    });
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-slate-900" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <header className="relative z-20 p-4 flex items-center justify-between">
        {/* Back button - saves run if in roguelike mode during play */}
        {(isRoguelike && gameState === "playing") || (runType === "slayTheWaves" && gameState === "playing") ? (
          <button
            onClick={() => {
              if (runType === "slayTheWaves") {
                saveSlayRun();
              } else {
                saveRoguelikeRun();
              }
            }}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Pause & Save</span>
          </button>
        ) : (
          <Link
            to="/"
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Games</span>
          </Link>
        )}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-display text-cyan-400 drop-shadow-lg">
            Wave Chaser
          </h1>
          {isRoguelike && gameState === "playing" && (
            <div className="flex flex-col items-center">
              <p className="text-purple-400 text-sm font-mono">Level {roguelikeLevel}</p>
              {currentBeachEffect && (
                <p className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded",
                  fishNetStuck ? "bg-red-600 text-white animate-pulse" : "bg-orange-600/80 text-orange-200"
                )}>
                  {fishNetStuck ? "🪤 STUCK!" : `🏖️ ${BEACH_EFFECTS.find(e => e.type === currentBeachEffect)?.name}`}
                </p>
              )}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
          className="text-white/80 hover:text-white hover:bg-white/10"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </header>


      {/* Pixel Art Game Grid */}
      <div className="flex-1 flex items-center justify-center">
        <BeachFrame 
          beachType={
            // Show frame for Beach Bonanza mode or Standard boss levels (level 5, 10, 15...)
            currentBeachEffect && (
              runType === "beachBonanza" || 
              (isRoguelike && roguelikeLevel % 5 === 0)
            ) ? currentBeachEffect : null
          }
        >
          <div
            className="relative border-4 border-slate-700 rounded-lg overflow-hidden shadow-2xl"
            style={{
              width: OCEAN_WIDTH * PIXEL_SIZE,
              height: TOTAL_HEIGHT * PIXEL_SIZE,
              imageRendering: "pixelated",
            }}
          >
          {/* Grid cells */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${OCEAN_WIDTH}, ${PIXEL_SIZE}px)`,
              gridTemplateRows: `repeat(${TOTAL_HEIGHT}, ${PIXEL_SIZE}px)`,
              backgroundColor: COLORS.sand, // Prevent subpixel rendering gaps
            }}
          >
            {renderGrid()}
          </div>
          
          {/* Beach People (Busy Beach effect) */}
          {currentBeachEffect === "busyBeach" && beachPeople.map(person => (
            <div
              key={person.id}
              className="absolute pointer-events-none rounded-sm"
              style={{
                left: person.col * PIXEL_SIZE,
                top: person.row * PIXEL_SIZE,
                width: PIXEL_SIZE,
                height: PIXEL_SIZE,
                backgroundColor: person.color,
                border: `2px solid hsl(0, 0%, 30%)`,
                boxShadow: `0 0 4px ${person.color}`,
                zIndex: 20,
              }}
            />
          ))}

          {/* Vertical Gear Meter - PC only, Momentum mode, on beach area */}
          {movementMode === "momentum" && !isMobile && gameState === "playing" && (
            <div 
              className="absolute flex flex-col items-center pointer-events-none z-30"
              style={{
                right: PIXEL_SIZE * 0.5,
                top: OCEAN_HEIGHT * PIXEL_SIZE + PIXEL_SIZE * 1,
                width: PIXEL_SIZE * 1.5,
                height: PIXEL_SIZE * 10,
              }}
            >
              <div className="w-full h-full bg-slate-900/70 rounded border border-amber-500/40 flex flex-col overflow-hidden">
                {/* 7 gear segments */}
                {[-3, -2, -1, 0, 1, 2, 3].map((gear) => {
                  const isActive = momentumGear === gear;
                  const segmentColor = gear === 0 ? "bg-slate-400" :
                    gear < 0 ? (gear === -1 ? "bg-green-400" : gear === -2 ? "bg-green-500" : "bg-green-700") :
                    (gear === 1 ? "bg-red-400" : gear === 2 ? "bg-red-500" : "bg-red-700");
                  const inactiveColor = gear === 0 ? "bg-slate-700/40" :
                    gear < 0 ? (gear === -1 ? "bg-green-400/20" : gear === -2 ? "bg-green-500/20" : "bg-green-700/20") :
                    (gear === 1 ? "bg-red-400/20" : gear === 2 ? "bg-red-500/20" : "bg-red-700/20");
                  
                  return (
                    <div 
                      key={gear}
                      className={cn(
                        "flex-1 w-full flex items-center justify-center transition-colors",
                        isActive ? segmentColor : inactiveColor
                      )}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Level Complete Celebration Overlay - shows during payoff moment */}
          {levelCelebrating && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 overflow-hidden">
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/40 animate-fade-in" />
              
              {/* Burst of particles radiating outward */}
              {[...Array(16)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: ['#fbbf24', '#a855f7', '#22d3ee', '#34d399', '#f472b6', '#60a5fa'][i % 6],
                    transform: `rotate(${i * 22.5}deg) translateY(-80px)`,
                    animation: 'ping 0.8s cubic-bezier(0, 0, 0.2, 1) forwards',
                    animationDelay: `${i * 0.02}s`,
                    opacity: 0.9,
                  }}
                />
              ))}
              
              {/* Wave emojis floating up */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={`wave-${i}`}
                  className="absolute text-3xl animate-float-up"
                  style={{
                    left: `${15 + i * 10}%`,
                    top: '80%',
                    animationDuration: '1s',
                    animationDelay: `${i * 0.1}s`,
                  }}
                >
                  🌊
                </div>
              ))}
              
              {/* Central glow effect */}
              <div className="absolute w-48 h-48 rounded-full bg-gradient-to-r from-purple-500 via-cyan-400 to-yellow-400 opacity-70 animate-pulse blur-2xl" />
              
              {/* Level text with glow */}
              <div 
                className="text-5xl font-display text-white animate-bounce-in z-10"
                style={{ 
                  textShadow: '0 0 30px rgba(168,85,247,0.9), 0 0 60px rgba(34,211,238,0.6)',
                }}
              >
                🎉 Level Complete! 🎉
              </div>
            </div>
          )}

          {/* In-Ocean HUD - Stats and Abilities (above row 20 where waves spawn) */}
          {gameState === "playing" && (
            <div 
              className="absolute left-0 right-0 flex flex-col items-center gap-2 pointer-events-none"
              style={{
                top: PIXEL_SIZE * 1, // Start at row 1
                maxHeight: PIXEL_SIZE * 18, // Stay above row 20
              }}
            >
              {/* Roguelike level indicator + goal + permanent upgrades */}
              {isRoguelike && (
                <div className="bg-purple-900/60 rounded-lg px-3 py-1 border border-purple-500/50 flex items-center gap-3">
                  <span className="text-purple-300 text-sm font-semibold">
                    Level {roguelikeLevel}
                  </span>
                  <span className="text-white/30">|</span>
                  <span className="text-purple-300 text-sm">
                    Goal: {wavesTouched}/{roguelikeWavesToWin}
                  </span>
                  {(permanentUpgrades.fastFeet > 0 || permanentUpgrades.tapDancer > 0 || permanentUpgrades.wetShoes > 0) && (
                    <>
                      <span className="text-white/30">|</span>
                      <TooltipProvider delayDuration={100}>
                        <div className="flex items-center gap-2 text-xs pointer-events-auto">
                          {permanentUpgrades.fastFeet > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-green-400 cursor-help">🏃{permanentUpgrades.fastFeet * 10}%</span>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-900 border-green-500/50">
                                <p className="text-green-400 font-semibold">Fast Feet</p>
                                <p className="text-white/80 text-xs">+{permanentUpgrades.fastFeet * 10}% distance per move</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {permanentUpgrades.tapDancer > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-blue-400 cursor-help">🦶{permanentUpgrades.tapDancer * 15}%</span>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-900 border-blue-500/50">
                                <p className="text-blue-400 font-semibold">Tap Dancer</p>
                                <p className="text-white/80 text-xs">+{permanentUpgrades.tapDancer * 15}% toe tap distance</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {permanentUpgrades.wetShoes > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-teal-400 cursor-help">👟{permanentUpgrades.wetShoes * 10}%</span>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-900 border-teal-500/50">
                                <p className="text-teal-400 font-semibold">Wet Shoes</p>
                                <p className="text-white/80 text-xs">Water timer drains {permanentUpgrades.wetShoes * 10}% slower</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TooltipProvider>
                    </>
                  )}
                </div>
              )}

              {/* Gear HUD - mobile only in Momentum mode */}
              {movementMode === "momentum" && isMobile && (
                <div className="bg-black/60 rounded-lg px-4 py-2 flex flex-col items-center border border-amber-500/50 pointer-events-auto mb-2">
                  <span className="text-xs text-amber-300/70 uppercase tracking-wider">Gear</span>
                  <span className={cn(
                    "text-lg font-display font-mono leading-tight",
                    momentumGear === 0 ? "text-slate-400" :
                    Math.abs(momentumGear) === 3 ? "text-red-400" :
                    Math.abs(momentumGear) === 2 ? "text-amber-400" :
                    "text-green-400"
                  )}>
                    {getGearName(momentumGear)}
                  </span>
                </div>
              )}

              {/* Row 1: Waves Touched - 3x bigger */}
              <div className="bg-black/60 rounded-lg px-4 py-2 flex flex-col items-center border border-cyan-500/50 pointer-events-auto">
                <span className="text-sm text-white/70 uppercase tracking-wider">Waves Touched</span>
                <span className="text-4xl font-display text-cyan-300 font-mono leading-tight">
                  {wavesTouched}{isRoguelike && <span className="text-2xl text-white/50">/{roguelikeWavesToWin}</span>}
                </span>
              </div>

              {/* Row 2: Timer and Missed - 2x bigger */}
              <div className="flex gap-2 pointer-events-auto relative">
                <div className="relative">
                  <div className="bg-black/60 rounded-lg px-3 py-1.5 flex flex-col items-center border border-cyan-500/40">
                    <span className="text-xs text-white/60 uppercase tracking-wider">Timer</span>
                    <span
                      className={cn(
                        "text-2xl font-display font-mono leading-tight",
                        invincible.active ? "text-yellow-400" : 
                        waterTimer < 2000
                          ? "text-red-400"
                          : waterTimer < 3500
                          ? "text-amber-400"
                          : "text-white"
                      )}
                    >
                      {(waterTimer / 1000).toFixed(1)}s
                      {invincible.active && " 🛡️"}
                    </span>
                  </div>
                  
                  {/* Level 2 Tutorial Popup */}
                  {showTimerTutorial && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                      <div className="bg-slate-800 border-2 border-amber-500 rounded-lg p-4 shadow-lg shadow-amber-500/20 min-w-[220px]">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-amber-500" />
                        <p className="text-amber-400 font-semibold text-sm mb-1">⏱️ Water Timer</p>
                        <p className="text-white/80 text-xs mb-3">
                          Every level your water timer decreases by 2%! You'll get a chance to upgrade it.
                        </p>
                        <button
                          onClick={() => setShowTimerTutorial(false)}
                          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm py-1.5 px-3 rounded transition-colors"
                        >
                          Got it!
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <div className="bg-black/60 rounded-lg px-3 py-1.5 flex flex-col items-center border border-red-500/40">
                    <span className="text-xs text-white/60 uppercase tracking-wider">Missed</span>
                    <span
                      className={cn(
                        "text-2xl font-display font-mono leading-tight",
                        missedDisplay >= maxMissedDisplay - 3 ? "text-red-400" : missedDisplay >= maxMissedDisplay - 6 ? "text-amber-400" : "text-white"
                      )}
                    >
                      {missedDisplay}/{maxMissedDisplay}
                    </span>
                  </div>
                  
                  {/* Level 6 Waves Tutorial Popup */}
                  {showWavesTutorial && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                      <div className="bg-slate-800 border-2 border-purple-500 rounded-lg p-4 shadow-lg shadow-purple-500/20 min-w-[240px]">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-purple-500" />
                        <p className="text-purple-400 font-semibold text-sm mb-1">🌊 Wave Goals Increased!</p>
                        <p className="text-white/80 text-xs mb-3">
                          Every 5 levels, you'll need to touch more waves to win. The number of waves you can miss also decreases!
                        </p>
                        <button
                          onClick={() => setShowWavesTutorial(false)}
                          className="w-full bg-purple-500 hover:bg-purple-400 text-white font-semibold text-sm py-1.5 px-3 rounded transition-colors"
                        >
                          Got it!
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Abilities - ordered by keyboard keys C, V, B, N */}
              <div className="flex gap-2 pointer-events-auto">
                {(() => {
                  // Classic mode has 3 fixed abilities: wetsuit, superTap, ghostToe
                  const classicAbilities: AbilityType[] = ["wetsuit", "superTap", "ghostToe"];
                  
                  // Get active abilities for this level, sorted by their assigned key
                  const activeAbilities = isRoguelike 
                    ? (selectedAbilities.length > 0 
                        ? selectedAbilities 
                        : unlockedAbilities.map(a => a.type).slice(0, 4))
                    : classicAbilities;
                  
                  // Define ability render configs with fixed keyboard order
                  const abilityConfigs: { type: AbilityType; keyIndex: number }[] = activeAbilities.map((type, idx) => ({
                    type,
                    keyIndex: idx
                  }));
                  
                  // Sort by keyIndex to ensure C, V, B, N order
                  abilityConfigs.sort((a, b) => a.keyIndex - b.keyIndex);
                  
                  if (abilityConfigs.length === 0 && isRoguelike) {
                    return (
                      <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-slate-800/40 border-2 border-dashed border-slate-600 text-slate-500">
                        <span className="text-xs">No abilities</span>
                        <span className="text-xs">unlocked yet</span>
                      </div>
                    );
                  }
                  
                  return abilityConfigs.map(({ type, keyIndex }) => {
                    const keyLabel = ABILITY_KEYS[keyIndex];
                    
                    if (type === "wetsuit") {
                      const waterExposure = invincible.waterExposure ?? 0;
                      const waterLimit = invincible.waterLimit ?? getWetsuitWaterLimit();
                      const waterRemaining = Math.max(0, waterLimit - waterExposure);
                      const waterPercentage = (waterRemaining / waterLimit) * 100;
                      
                      return (
                        <button
                          key="wetsuit"
                          onClick={activateInvincible}
                          disabled={invincible.active || invincible.cooldownRemaining > 0}
                          className={cn(
                            "relative flex flex-col items-center px-3 py-2 rounded-lg transition-all overflow-hidden",
                            invincible.active 
                              ? "bg-yellow-500/40 border-2 border-yellow-500 text-yellow-300" 
                              : invincible.cooldownRemaining > 0
                              ? "bg-slate-800/60 border-2 border-slate-600 text-slate-500"
                              : "bg-slate-800/80 border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
                          )}
                        >
                          <Shirt className="w-6 h-6" />
                          <span className="text-sm font-semibold leading-none mt-1">
                            {invincible.active 
                              ? `${(invincible.durationRemaining! / 1000).toFixed(0)}s`
                              : invincible.cooldownRemaining > 0
                              ? `${Math.ceil(invincible.cooldownRemaining / 1000)}s`
                              : isMobile ? "" : keyLabel}
                          </span>
                          {/* Duration bar (yellow) */}
                          {invincible.active && (
                            <div 
                              className="absolute bottom-0 left-0 h-1 bg-yellow-400 transition-all"
                              style={{ width: `${(invincible.durationRemaining! / wetsuitMaxDuration) * 100}%` }}
                            />
                          )}
                          {/* Water exposure bar (blue) - roguelike only */}
                          {invincible.active && isRoguelike && (
                            <>
                              <div 
                                className="absolute bottom-1 left-0 h-1 bg-cyan-400 transition-all"
                                style={{ width: `${waterPercentage}%` }}
                              />
                              <span className="text-[10px] text-cyan-300 mt-0.5">
                                💧{(waterRemaining / 1000).toFixed(1)}s
                              </span>
                            </>
                          )}
                        </button>
                      );
                    }
                    
                    if (type === "superTap") {
                      // Gummy Beach boss blocks Super Tap
                      const isSuperTapBlockedByGummy = currentBeachEffect === "gummyBeach" && 
                        (runType !== "beachBonanza" || beachLevel >= 5);
                      const isSuperTapDisabled = superTap.active || superTap.cooldownRemaining > 0 || isSuperTapBlockedByGummy;
                      
                      return (
                        <button
                          key="superTap"
                          onClick={activateSuperTap}
                          disabled={isSuperTapDisabled}
                          className={cn(
                            "relative flex flex-col items-center px-3 py-2 rounded-lg transition-all overflow-hidden",
                            isSuperTapBlockedByGummy
                              ? "bg-pink-900/40 border-2 border-pink-600/50 text-pink-400/60"
                              : superTap.active 
                              ? "bg-orange-500/40 border-2 border-orange-500 text-orange-300" 
                              : superTap.cooldownRemaining > 0
                              ? "bg-slate-800/60 border-2 border-slate-600 text-slate-500"
                              : "bg-slate-800/80 border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
                          )}
                        >
                          <Zap className="w-6 h-6" />
                          <span className="text-sm font-semibold leading-none mt-1">
                            {isSuperTapBlockedByGummy
                              ? "🍬"
                              : superTap.active 
                              ? isRoguelike 
                                ? `${((superTap.durationRemaining ?? 0) / 1000).toFixed(0)}s`
                                : `${superTap.usesRemaining}`
                              : superTap.cooldownRemaining > 0
                              ? `${Math.ceil(superTap.cooldownRemaining / 1000)}s`
                              : isMobile ? "" : keyLabel}
                          </span>
                          {superTap.active && !isSuperTapBlockedByGummy && (
                            <div 
                              className="absolute bottom-0 left-0 h-1 bg-orange-400 transition-all"
                              style={{ 
                                width: isRoguelike
                                  ? `${((superTap.durationRemaining ?? 0) / superTapMaxDuration) * 100}%`
                                  : `${((superTap.usesRemaining ?? 0) / SUPER_TAP_USES) * 100}%` 
                              }}
                            />
                          )}
                        </button>
                      );
                    }
                    
                    if (type === "ghostToe") {
                      return (
                        <button
                          key="ghostToe"
                          onClick={activateGhostToe}
                          disabled={ghostToe.active || ghostToe.cooldownRemaining > 0}
                          className={cn(
                            "relative flex flex-col items-center px-3 py-2 rounded-lg transition-all overflow-hidden",
                            ghostToe.active 
                              ? "bg-purple-500/40 border-2 border-purple-500 text-purple-300" 
                              : ghostToe.cooldownRemaining > 0
                              ? "bg-slate-800/60 border-2 border-slate-600 text-slate-500"
                              : "bg-slate-800/80 border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
                          )}
                        >
                          <Ghost className="w-6 h-6" />
                          <span className="text-sm font-semibold leading-none mt-1">
                            {ghostToe.active 
                              ? `${(ghostToe.durationRemaining! / 1000).toFixed(0)}s`
                              : ghostToe.cooldownRemaining > 0
                              ? `${Math.ceil(ghostToe.cooldownRemaining / 1000)}s`
                              : isMobile ? "" : keyLabel}
                          </span>
                          {ghostToe.active && (
                            <div 
                              className="absolute bottom-0 left-0 h-1 bg-purple-400 transition-all"
                              style={{ width: `${(ghostToe.durationRemaining! / ghostToeMaxDuration) * 100}%` }}
                            />
                          )}
                        </button>
                      );
                    }
                    
                    if (type === "crystalBall") {
                      return (
                        <button
                          key="crystalBall"
                          onClick={activateCrystalBall}
                          disabled={crystalBall.active || crystalBall.cooldownRemaining > 0}
                          className={cn(
                            "relative flex flex-col items-center px-3 py-2 rounded-lg transition-all overflow-hidden",
                            crystalBall.active 
                              ? "bg-cyan-500/40 border-2 border-cyan-500 text-cyan-300" 
                              : crystalBall.cooldownRemaining > 0
                              ? "bg-slate-800/60 border-2 border-slate-600 text-slate-500"
                              : "bg-slate-800/80 border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
                          )}
                        >
                          <Shell className="w-6 h-6" />
                          <span className="text-sm font-semibold leading-none mt-1">
                            {crystalBall.active 
                              ? `${(crystalBall.durationRemaining! / 1000).toFixed(0)}s`
                              : crystalBall.cooldownRemaining > 0
                              ? `${Math.ceil(crystalBall.cooldownRemaining / 1000)}s`
                              : isMobile ? "" : keyLabel}
                          </span>
                          {crystalBall.active && (
                            <div 
                              className="absolute bottom-0 left-0 h-1 bg-cyan-400 transition-all"
                              style={{ width: `${(crystalBall.durationRemaining! / crystalBallMaxDuration) * 100}%` }}
                            />
                          )}
                        </button>
                      );
                    }
                    
                    if (type === "slowdown") {
                      return (
                        <button
                          key="slowdown"
                          onClick={activateSlowdown}
                          disabled={slowdown.active || slowdown.cooldownRemaining > 0}
                          className={cn(
                            "relative flex flex-col items-center px-3 py-2 rounded-lg transition-all overflow-hidden",
                            slowdown.active 
                              ? "bg-pink-500/40 border-2 border-pink-500 text-pink-300" 
                              : slowdown.cooldownRemaining > 0
                              ? "bg-slate-800/60 border-2 border-slate-600 text-slate-500"
                              : "bg-slate-800/80 border-2 border-pink-500/50 text-pink-400 hover:bg-pink-500/30"
                          )}
                        >
                          <Snail className="w-6 h-6" />
                          <span className="text-sm font-semibold leading-none mt-1">
                            {slowdown.active 
                              ? `${(slowdown.durationRemaining! / 1000).toFixed(0)}s`
                              : slowdown.cooldownRemaining > 0
                              ? `${Math.ceil(slowdown.cooldownRemaining / 1000)}s`
                              : isMobile ? "" : keyLabel}
                          </span>
                          {slowdown.active && (
                            <div 
                              className="absolute bottom-0 left-0 h-1 bg-pink-400 transition-all"
                              style={{ width: `${(slowdown.durationRemaining! / slowdownMaxDuration) * 100}%` }}
                            />
                          )}
                        </button>
                      );
                    }
                    
                    if (type === "waveMagnet") {
                      return (
                        <button
                          key="waveMagnet"
                          onClick={activateWaveMagnet}
                          disabled={waveMagnet.active || waveMagnet.cooldownRemaining > 0}
                          className={cn(
                            "relative flex flex-col items-center px-3 py-2 rounded-lg transition-all overflow-hidden",
                            waveMagnet.active 
                              ? "bg-red-500/40 border-2 border-red-500 text-red-300" 
                              : waveMagnet.cooldownRemaining > 0
                              ? "bg-slate-800/60 border-2 border-slate-600 text-slate-500"
                              : "bg-slate-800/80 border-2 border-red-500/50 text-red-400 hover:bg-red-500/30"
                          )}
                        >
                          <Magnet className="w-6 h-6" />
                          <span className="text-sm font-semibold leading-none mt-1">
                            {waveMagnet.active 
                              ? `${(waveMagnet.durationRemaining! / 1000).toFixed(0)}s`
                              : waveMagnet.cooldownRemaining > 0
                              ? `${Math.ceil(waveMagnet.cooldownRemaining / 1000)}s`
                              : isMobile ? "" : keyLabel}
                          </span>
                          {waveMagnet.active && (
                            <div 
                              className="absolute bottom-0 left-0 h-1 bg-red-400 transition-all"
                              style={{ width: `${(waveMagnet.durationRemaining! / waveMagnetMaxDuration) * 100}%` }}
                            />
                          )}
                        </button>
                      );
                    }
                    
                    if (type === "waveSurfer") {
                      return (
                        <button
                          key="waveSurfer"
                          onClick={activateWaveSurfer}
                          disabled={waveSurfer.active || waveSurfer.cooldownRemaining > 0}
                          className={cn(
                            "relative flex flex-col items-center px-3 py-2 rounded-lg transition-all overflow-hidden",
                            waveSurfer.active 
                              ? "bg-teal-500/40 border-2 border-teal-500 text-teal-300" 
                              : waveSurfer.cooldownRemaining > 0
                              ? "bg-slate-800/60 border-2 border-slate-600 text-slate-500"
                              : "bg-slate-800/80 border-2 border-teal-500/50 text-teal-400 hover:bg-teal-500/30"
                          )}
                        >
                          <Waves className="w-6 h-6" />
                          <span className="text-sm font-semibold leading-none mt-1">
                            {waveSurfer.active 
                              ? `${(waveSurfer.durationRemaining! / 1000).toFixed(0)}s`
                              : waveSurfer.cooldownRemaining > 0
                              ? `${Math.ceil(waveSurfer.cooldownRemaining / 1000)}s`
                              : isMobile ? "" : keyLabel}
                          </span>
                          {waveSurfer.active && (
                            <div 
                              className="absolute bottom-0 left-0 h-1 bg-teal-400 transition-all"
                              style={{ width: `${(waveSurfer.durationRemaining! / waveSurferMaxDuration) * 100}%` }}
                            />
                          )}
                        </button>
                      );
                    }
                    
                    if (type === "towelOff") {
                      return (
                        <button
                          key="towelOff"
                          onClick={activateTowelOff}
                          disabled={towelOff.active || towelOff.cooldownRemaining > 0}
                          className={cn(
                            "relative flex flex-col items-center px-3 py-2 rounded-lg transition-all overflow-hidden",
                            towelOff.active 
                              ? "bg-sky-500/40 border-2 border-sky-500 text-sky-300" 
                              : towelOff.cooldownRemaining > 0
                              ? "bg-slate-800/60 border-2 border-slate-600 text-slate-500"
                              : "bg-slate-800/80 border-2 border-sky-500/50 text-sky-400 hover:bg-sky-500/30"
                          )}
                        >
                          <Wind className="w-6 h-6" />
                          <span className="text-sm font-semibold leading-none mt-1">
                            {towelOff.active 
                              ? `${(towelOff.durationRemaining! / 1000).toFixed(0)}s`
                              : towelOff.cooldownRemaining > 0
                              ? `${Math.ceil(towelOff.cooldownRemaining / 1000)}s`
                              : isMobile ? "" : keyLabel}
                          </span>
                          {towelOff.active && (
                            <div 
                              className="absolute bottom-0 left-0 h-1 bg-sky-400 transition-all"
                              style={{ width: `${(towelOff.durationRemaining! / towelOffMaxDuration) * 100}%` }}
                            />
                          )}
                        </button>
                      );
                    }
                    
                    if (type === "doubleDip") {
                      return (
                        <button
                          key="doubleDip"
                          onClick={activateDoubleDip}
                          disabled={doubleDip.active || doubleDip.cooldownRemaining > 0}
                          className={cn(
                            "relative flex flex-col items-center px-3 py-2 rounded-lg transition-all overflow-hidden",
                            doubleDip.active 
                              ? "bg-emerald-500/40 border-2 border-emerald-500 text-emerald-300" 
                              : doubleDip.cooldownRemaining > 0
                              ? "bg-slate-800/60 border-2 border-slate-600 text-slate-500"
                              : "bg-slate-800/80 border-2 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30"
                          )}
                        >
                          <span className="w-6 h-6 flex items-center justify-center font-bold text-sm">2x</span>
                          <span className="text-sm font-semibold leading-none mt-1">
                            {doubleDip.active 
                              ? `${(doubleDip.durationRemaining! / 1000).toFixed(0)}s`
                              : doubleDip.cooldownRemaining > 0
                              ? `${Math.ceil(doubleDip.cooldownRemaining / 1000)}s`
                              : isMobile ? "" : keyLabel}
                          </span>
                          {doubleDip.active && (
                            <div 
                              className="absolute bottom-0 left-0 h-1 bg-emerald-400 transition-all"
                              style={{ width: `${(doubleDip.durationRemaining! / doubleDipMaxDuration) * 100}%` }}
                            />
                          )}
                        </button>
                      );
                    }
                    
                    if (type === "jumpAround") {
                      return (
                        <button
                          key="jumpAround"
                          onClick={activateJumpAround}
                          disabled={jumpAround.active || jumpAround.cooldownRemaining > 0}
                          className={cn(
                            "relative flex flex-col items-center px-3 py-2 rounded-lg transition-all overflow-hidden",
                            jumpAround.active 
                              ? "bg-lime-500/40 border-2 border-lime-500 text-lime-300" 
                              : jumpAround.cooldownRemaining > 0
                              ? "bg-slate-800/60 border-2 border-slate-600 text-slate-500"
                              : "bg-slate-800/80 border-2 border-lime-500/50 text-lime-400 hover:bg-lime-500/30"
                          )}
                        >
                          <Rabbit className="w-6 h-6" />
                          <span className="text-sm font-semibold leading-none mt-1">
                            {jumpAround.active 
                              ? `${(jumpAround.durationRemaining! / 1000).toFixed(0)}s`
                              : jumpAround.cooldownRemaining > 0
                              ? `${Math.ceil(jumpAround.cooldownRemaining / 1000)}s`
                              : isMobile ? "" : keyLabel}
                          </span>
                          {jumpAround.active && (
                            <div 
                              className="absolute bottom-0 left-0 h-1 bg-lime-400 transition-all"
                              style={{ width: `${(jumpAround.durationRemaining! / jumpAroundMaxDuration) * 100}%` }}
                            />
                          )}
                        </button>
                      );
                    }
                    
                    return null;
                  });
                })()}
                {/* Flashlight indicator for Nighttime boss beach - desktop */}
                {currentBeachEffect === "nighttime" && !isMobile && (
                  <button
                    onClick={activateFlashlight}
                    disabled={flashlightActive || flashlightCooldown > 0}
                    className={cn(
                      "relative flex flex-col items-center px-3 py-2 rounded-lg transition-all overflow-hidden",
                      flashlightActive 
                        ? "bg-yellow-500/40 border-2 border-yellow-500 text-yellow-300" 
                        : flashlightCooldown > 0
                        ? "bg-slate-800/60 border-2 border-slate-600 text-slate-500"
                        : "bg-slate-800/80 border-2 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30"
                    )}
                  >
                    <Flashlight className="w-6 h-6" />
                    <span className="text-sm font-semibold leading-none mt-1">
                      {flashlightActive 
                        ? `${Math.ceil(flashlightDuration / 1000)}s`
                        : flashlightCooldown > 0
                        ? `${Math.ceil(flashlightCooldown / 1000)}s`
                        : "F"}
                    </span>
                    {flashlightActive && (
                      <div 
                        className="absolute bottom-0 left-0 h-1 bg-yellow-400 transition-all"
                        style={{ width: `${(flashlightDuration / (runType === "beachBonanza" && beachLevel < 5 ? FLASHLIGHT_DURATION_REDUCED : FLASHLIGHT_DURATION_BOSS)) * 100}%` }}
                      />
                    )}
                    {!flashlightActive && flashlightCooldown > 0 && (
                      <div 
                        className="absolute bottom-0 left-0 h-1 bg-slate-500 transition-all"
                        style={{ width: `${(1 - flashlightCooldown / FLASHLIGHT_COOLDOWN) * 100}%` }}
                      />
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Player feet */}
          {gameState === "playing" && renderFeet()}

          {/* Wave Surfer teleport trail */}
          {gameState === "playing" && renderWaveSurferTrail()}

          {/* Water splash effect */}
          {gameState === "playing" && isTouching && (
            <div
              className="absolute pointer-events-none animate-ping"
              style={{
                left: (OCEAN_WIDTH / 2 - 1) * PIXEL_SIZE - 8,
                top: getToeRow() * PIXEL_SIZE - 8,
                width: PIXEL_SIZE * 2 + 16,
                height: PIXEL_SIZE + 16,
              }}
            >
              <div className="w-full h-full rounded-full bg-cyan-400/40" />
            </div>
          )}
        </div>
        </BeachFrame>
      </div>

      {/* Mobile Controls - positioned right below beach */}
      {gameState === "playing" && (
        <div className="absolute z-20 left-0 right-0 flex justify-between items-start px-6 sm:hidden"
          style={{ top: TOTAL_HEIGHT * PIXEL_SIZE }}
        >
          {/* Left side: Toe Tap and Flashlight (if nighttime) */}
          <div className="flex flex-col gap-1">
            {/* Toe Tap - 50% larger (hidden in auto mode) */}
            {(() => {
              const isGummyBoss = currentBeachEffect === "gummyBeach" && 
                (runType !== "beachBonanza" || beachLevel >= 5);
              
              // Hide entirely in auto toe tap mode (including Gummy Boss - no meaning when disabled)
              if (autoToeTap) return null;
              
              return (
                <Button
                  variant="outline"
                  size="lg"
                  disabled={isGummyBoss}
                  className={cn(
                    "h-24 w-[7.5rem]",
                    isGummyBoss
                      ? "bg-pink-900/40 border-pink-600/50 text-pink-400/60 shadow-none"
                      : "bg-slate-800 border-cyan-500/50 text-cyan-400",
                    isTapping && !isGummyBoss && "bg-cyan-500/30"
                  )}
                  onTouchStart={() => {
                    if (!isGummyBoss) {
                      setIsTapping(true);
                      if (isRoguelike) setTotalToeTaps(t => t + 1);
                    }
                  }}
                  onTouchEnd={() => setIsTapping(false)}
                  onTouchCancel={() => setIsTapping(false)}
                >
                  {isGummyBoss ? (
                    <span className="text-2xl">🍬</span>
                  ) : (
                    <Hand className="w-10 h-10" />
                  )}
                </Button>
              );
            })()}
            
            {/* Flashlight button - only shown during Nighttime boss beach */}
            {currentBeachEffect === "nighttime" && (
              <Button
                variant="outline"
                size="lg"
                onClick={activateFlashlight}
                disabled={flashlightActive || flashlightCooldown > 0}
                className={cn(
                  "h-14 w-[7.5rem] relative",
                  flashlightActive 
                    ? "bg-yellow-500/40 border-2 border-yellow-500 text-yellow-300" 
                    : flashlightCooldown > 0
                    ? "bg-slate-800/60 border-2 border-slate-600 text-slate-500"
                    : "bg-slate-800 border-2 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30"
                )}
              >
                <div className="flex flex-col items-center">
                  <Flashlight className="w-6 h-6" />
                  <span className="text-xs font-semibold leading-none mt-0.5">
                    {flashlightActive 
                      ? `${Math.ceil(flashlightDuration / 1000)}s`
                      : flashlightCooldown > 0
                      ? `${Math.ceil(flashlightCooldown / 1000)}s`
                      : "F"}
                  </span>
                </div>
                {flashlightActive && (
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-yellow-400 transition-all"
                    style={{ width: `${(flashlightDuration / (runType === "beachBonanza" && beachLevel < 5 ? FLASHLIGHT_DURATION_REDUCED : FLASHLIGHT_DURATION_BOSS)) * 100}%` }}
                  />
                )}
                {!flashlightActive && flashlightCooldown > 0 && (
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-slate-500 transition-all"
                    style={{ width: `${(1 - flashlightCooldown / FLASHLIGHT_COOLDOWN) * 100}%` }}
                  />
                )}
              </Button>
            )}
          </div>

          {/* Up/Down stacked on right - with hold-to-move, and gear meter for momentum mode */}
          <div className="flex items-center gap-2">
            {/* Mobile Gear Meter - to the left of up/down buttons */}
            {movementMode === "momentum" && (
              <div className="h-[120px] w-4 bg-slate-900/80 rounded border border-amber-500/40 flex flex-col overflow-hidden">
                {[-3, -2, -1, 0, 1, 2, 3].map((gear) => {
                  const isActive = momentumGear === gear;
                  const segmentColor = gear === 0 ? "bg-slate-400" :
                    gear < 0 ? (gear === -1 ? "bg-green-400" : gear === -2 ? "bg-green-500" : "bg-green-700") :
                    (gear === 1 ? "bg-red-400" : gear === 2 ? "bg-red-500" : "bg-red-700");
                  const inactiveColor = gear === 0 ? "bg-slate-700/40" :
                    gear < 0 ? (gear === -1 ? "bg-green-400/20" : gear === -2 ? "bg-green-500/20" : "bg-green-700/20") :
                    (gear === 1 ? "bg-red-400/20" : gear === 2 ? "bg-red-500/20" : "bg-red-700/20");
                  
                  return (
                    <div 
                      key={gear}
                      className={cn(
                        "flex-1 w-full transition-colors",
                        isActive ? segmentColor : inactiveColor
                      )}
                    />
                  );
                })}
              </div>
            )}
            
            <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              size="lg"
              className="bg-slate-800 border-cyan-500/50 text-cyan-400 h-14 w-14 select-none"
              style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
              onContextMenu={(e) => e.preventDefault()}
              onTouchStart={(e) => {
                e.preventDefault();
                // Fish Net effect: can't move when stuck
                if (fishNetStuckRef.current) return;

                // Momentum mode: shift gear on tap, no hold repeat
                if (movementModeRef.current === "momentum") {
                  doMoveUp(); // Shift gear toward shore
                  return;
                }
                
                const moveUp = () => {
                  if (fishNetStuckRef.current) return;
                  const baseStep = 0.25;
                  // Apply foot type speed modifier to tap-based movement
                  const footTypeSpeedMult = FOOT_TYPE_MODIFIERS[footTypeRef.current].speedMultiplier;
                  let moveStep = jumpAroundRef.current.active ? baseStep * JUMP_AROUND_MULTIPLIER : baseStep;
                  moveStep *= footTypeSpeedMult;
                  if (currentBeachEffectRef.current === "quicksand" && quicksandPenaltyActiveRef.current) {
                    // Quicksand penalty: Level 1 = 40%, Level 2 = 50%, Level 3 = 60%, Level 4 = 70%, Boss = 80%
                    const isReducedQuicksand = runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
                    const levelPenalties = [0.60, 0.50, 0.40, 0.30];
                    const penaltyMultiplier = isReducedQuicksand 
                      ? (levelPenalties[beachLevelRef.current - 1] || 0.30)
                      : 0.20;
                    moveStep *= penaltyMultiplier;
                  }
                  if (currentBeachEffectRef.current === "heavySand") {
                    // Heavy Sand: Level 1 = 10%, Level 2 = 20%, Level 3 = 30%, Level 4 = 40%, Boss = 65%
                    const isReducedHeavySand = runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
                    const levelPenalties = [0.90, 0.80, 0.70, 0.60]; // 10%, 20%, 30%, 40% less
                    const heavySandPenalty = isReducedHeavySand 
                      ? (levelPenalties[beachLevelRef.current - 1] || 0.60)
                      : 0.35; // Boss = 65% less
                    moveStep *= heavySandPenalty;
                  }
                  setFeetPosition((prev) => {
                    const newPos = Math.max(prev - moveStep, OCEAN_HEIGHT);
                    if (isPositionBlockedByPerson(newPos)) return prev;
                    if (newPos !== prev) {
                      if (isRoguelike) setTotalSteps(s => s + 1);
                    }
                    return newPos;
                  });
                };
                
                // Move once immediately
                moveUp();
                
                // Then continue moving while held (120ms delay to avoid double-tap on quick presses)
                moveUpIntervalRef.current = setInterval(moveUp, 120);
              }}
              onTouchEnd={() => {
                // Momentum mode: no hold state to clear
                if (moveUpIntervalRef.current) {
                  clearInterval(moveUpIntervalRef.current);
                  moveUpIntervalRef.current = null;
                }
              }}
              onTouchCancel={() => {
                // Momentum mode: no hold state to clear
                if (moveUpIntervalRef.current) {
                  clearInterval(moveUpIntervalRef.current);
                  moveUpIntervalRef.current = null;
                }
              }}
            >
              <ArrowUp className="w-7 h-7" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-slate-800 border-cyan-500/50 text-cyan-400 h-14 w-14 select-none"
              style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
              onContextMenu={(e) => e.preventDefault()}
              onTouchStart={(e) => {
                e.preventDefault();
                // Fish Net effect: can't move when stuck
                if (fishNetStuckRef.current) return;

                // Momentum mode: shift gear on tap, no hold repeat
                if (movementModeRef.current === "momentum") {
                  doMoveDown(); // Shift gear away from shore
                  return;
                }
                
                const moveDown = () => {
                  if (fishNetStuckRef.current) return;
                  const baseStep = 0.25;
                  // Apply foot type speed modifier to tap-based movement
                  const footTypeSpeedMult = FOOT_TYPE_MODIFIERS[footTypeRef.current].speedMultiplier;
                  const bossQuickRunSpeedMult = runTypeRef.current === "bossQuickRun" ? 1.5 : 1;
                  let moveStep = jumpAroundRef.current.active ? baseStep * JUMP_AROUND_MULTIPLIER : baseStep;
                  moveStep *= footTypeSpeedMult * bossQuickRunSpeedMult;
                  if (currentBeachEffectRef.current === "quicksand" && quicksandPenaltyActiveRef.current) {
                    // Quicksand penalty: Level 1 = 40%, Level 2 = 50%, Level 3 = 60%, Level 4 = 70%, Boss = 80%
                    const isReducedQuicksand = runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
                    const levelPenalties = [0.60, 0.50, 0.40, 0.30];
                    const penaltyMultiplier = isReducedQuicksand 
                      ? (levelPenalties[beachLevelRef.current - 1] || 0.30)
                      : 0.20;
                    moveStep *= penaltyMultiplier;
                  }
                  if (currentBeachEffectRef.current === "heavySand") {
                    // Heavy Sand: Level 1 = 10%, Level 2 = 20%, Level 3 = 30%, Level 4 = 40%, Boss = 65%
                    const isReducedHeavySand = runTypeRef.current === "beachBonanza" && beachLevelRef.current < 5;
                    const levelPenalties = [0.90, 0.80, 0.70, 0.60]; // 10%, 20%, 30%, 40% less
                    const heavySandPenalty = isReducedHeavySand 
                      ? (levelPenalties[beachLevelRef.current - 1] || 0.60)
                      : 0.35; // Boss = 65% less
                    moveStep *= heavySandPenalty;
                  }
                  setFeetPosition((prev) => {
                    const newPos = Math.min(prev + moveStep, TOTAL_HEIGHT - 1);
                    if (isPositionBlockedByPerson(newPos)) return prev;
                    if (newPos !== prev) {
                      if (isRoguelike) setTotalSteps(s => s + 1);
                    }
                    return newPos;
                  });
                };
                
                // Move once immediately
                moveDown();
                
                // Then continue moving while held (120ms delay to avoid double-tap on quick presses)
                moveDownIntervalRef.current = setInterval(moveDown, 120);
              }}
              onTouchEnd={() => {
                // Momentum mode: no hold state to clear
                if (moveDownIntervalRef.current) {
                  clearInterval(moveDownIntervalRef.current);
                  moveDownIntervalRef.current = null;
                }
              }}
              onTouchCancel={() => {
                // Momentum mode: no hold state to clear
                if (moveDownIntervalRef.current) {
                  clearInterval(moveDownIntervalRef.current);
                  moveDownIntervalRef.current = null;
                }
              }}
            >
              <ArrowDown className="w-7 h-7" />
            </Button>
            </div>
          </div>
        </div>
      )}

      {/* Boss Beach Popup - full screen overlay dismissed by tapping anywhere */}
      {gameState === "playing" && showBossBeachPopup && currentBeachEffect && (
        <div 
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 cursor-pointer"
          onClick={() => setShowBossBeachPopup(false)}
          onTouchStart={() => setShowBossBeachPopup(false)}
        >
          <div className="flex flex-col items-center gap-4 p-6 animate-in zoom-in-95 duration-300">
            <div className="text-4xl sm:text-5xl font-display text-orange-400 text-center animate-bounce drop-shadow-lg">
              🏖️ BOSS BEACH BATTLE! 🏖️
            </div>
            <div className="bg-slate-800/90 rounded-xl p-6 border-2 border-orange-500 shadow-lg shadow-orange-500/30 max-w-sm">
              <div className="text-2xl sm:text-3xl font-display text-center mb-3" style={{
                color: currentBeachEffect === "quicksand" ? "hsl(45, 80%, 60%)" :
                       currentBeachEffect === "spikeWaves" ? "hsl(220, 10%, 70%)" :
                       currentBeachEffect === "gummyBeach" ? "hsl(330, 70%, 65%)" :
                       currentBeachEffect === "coldWater" ? "hsl(190, 80%, 60%)" :
                       currentBeachEffect === "crazyWaves" ? "hsl(270, 70%, 65%)" :
                       currentBeachEffect === "fishNet" ? "hsl(30, 80%, 55%)" :
                       currentBeachEffect === "nighttime" ? "hsl(240, 60%, 70%)" :
                       currentBeachEffect === "roughWaters" ? "hsl(200, 80%, 55%)" :
                       currentBeachEffect === "heavySand" ? "hsl(35, 70%, 50%)" :
                       currentBeachEffect === "busyBeach" ? "hsl(320, 70%, 60%)" : "white"
              }}>
                {BEACH_EFFECTS.find(e => e.type === currentBeachEffect)?.name}
              </div>
              <p className="text-white/80 text-center text-base sm:text-lg">
                {BEACH_EFFECTS.find(e => e.type === currentBeachEffect)?.description}
              </p>
            </div>
            <p className="text-white/50 text-sm animate-pulse">Tap anywhere to start</p>
          </div>
        </div>
      )}

      {/* Menu Screen - Difficulty Select */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center bg-black/70 overflow-auto py-6 px-4">
          <Link
            to="/"
            className="text-white/70 hover:text-white text-sm mb-4 transition-colors"
          >
            ← Back to Games
          </Link>
          <h1 className="text-3xl sm:text-4xl font-display text-cyan-400 mb-2 drop-shadow-lg text-center">
            WAVE CHASER
          </h1>
          <div className="w-full max-w-md">
            <DifficultySelect onSelect={handleDifficultySelect} />
          </div>
        </div>
      )}

      {/* Roguelike Start Screen */}
      {gameState === "roguelikeMenu" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center bg-black/70 overflow-auto py-6 px-4">
          <Link
            to="/"
            className="text-white/70 hover:text-white text-sm mb-4 transition-colors"
          >
            ← Back to Games
          </Link>
          <h1 className="text-3xl sm:text-4xl font-display text-cyan-400 mb-2 drop-shadow-lg text-center">
            WAVE CHASER
          </h1>
          <div className="w-full max-w-md">
            <RoguelikeStartScreen 
              onStart={startRoguelikeRun}
              onContinue={continueRoguelikeRun}
              hasSavedRun={hasSavedRun}
              savedRunType={savedRunTypeFromStorage}
            />
          </div>
        </div>
      )}

      {/* ============= BOSS QUICK RUN SCREENS ============= */}
      
      {/* Boss Quick Run Draft Screen */}
      {gameState === "bossQuickRunDraft" && (
        <BossQuickRunDraftScreen
          isBossHellRun={runType === "bossHellRun"}
          onComplete={(abilities) => {
            // Create unlocked abilities with level 3 power (2 upgrades)
            const newUnlocked = abilities.map(type => ({ 
              type, 
              upgradeCount: BOSS_QUICK_RUN_ABILITY_UPGRADES 
            }));
            setUnlockedAbilities(newUnlocked);
            setSelectedAbilities(abilities);
            unlockedAbilitiesRef.current = newUnlocked;
            selectedAbilitiesRef.current = abilities;
            
            // Pick random boss beach for level 1
            const allBeaches: BeachEffectType[] = [
              "quicksand", "spikeWaves", "gummyBeach", "coldWater", "crazyWaves",
              "fishNet", "nighttime", "roughWaters", "heavySand", "busyBeach"
            ];
            const shuffled = [...allBeaches].sort(() => Math.random() - 0.5);
            const firstBeach = shuffled[0];
            setBossQuickRunUsedBeaches([firstBeach]);
            setBeachEffectWithRef(firstBeach);
            
            // Start level 1 with starting timer and fixed misses denominator
            const maxMisses = runType === "bossHellRun" ? BOSS_HELL_RUN_MAX_MISSES : BOSS_QUICK_RUN_MAX_MISSES;
            setRoguelikeWavesToWin(BOSS_QUICK_RUN_WAVES_TO_WIN);
            setRoguelikeWavesToLose(maxMisses);
            roguelikeWavesToWinRef.current = BOSS_QUICK_RUN_WAVES_TO_WIN;
            roguelikeWavesToLoseRef.current = maxMisses;
            
            // Show boss beach popup
            setShowBossBeachPopup(true);
            
            // Start level with water timer from carryover
            setGameState("playing");
            setFeetPosition(35);
            setWaves([]);
            setWaterTimer(bossQuickRunCarryoverTimerRef.current);
            levelStartingWaterTimerRef.current = bossQuickRunCarryoverTimerRef.current;
            setWavesTouched(0);
            setWavesMissed(0);
            setGameOverReason(null);
            lastTimeRef.current = 0;
            waveSpawnTimerRef.current = 0;
            waveIdRef.current = 0;
            lastMaxReachRef.current = OCEAN_HEIGHT + 4;
          }}
        />
      )}

      {/* Boss Quick Run Level Complete Screen */}
      {gameState === "bossQuickRunLevelComplete" && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-slate-900 via-purple-900/30 to-slate-900 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border-2 border-amber-500/50 shadow-2xl text-center">
            <div className="text-amber-400 text-sm uppercase tracking-wider mb-2">Level {roguelikeLevel} Complete</div>
            <div className="text-2xl font-display text-white mb-1">
              🏖️ {BEACH_EFFECTS.find(e => e.type === completedBeachForDisplay)?.name}
            </div>
            
            {/* Score Display */}
            <div className="my-6 space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-white/60 text-sm mb-1">Level Score</p>
                <p className="text-3xl font-display text-amber-400 font-mono">+{bossQuickRunLevelScore}</p>
                <p className="text-white/40 text-xs mt-1">
                  10 × Level {roguelikeLevel} × ({(bossQuickRunCarryoverTimer / 1000).toFixed(1)}s + {BOSS_QUICK_RUN_MAX_MISSES - bossQuickRunTotalMisses} misses)
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-white/60 text-sm mb-1">Total Score</p>
                <p className="text-3xl font-display text-purple-400 font-mono">{totalScore}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-900/30 rounded-lg p-3">
                  <p className="text-cyan-400/70">Time Remaining</p>
                  <p className="text-cyan-400 font-mono text-lg">{(bossQuickRunCarryoverTimer / 1000).toFixed(1)}s</p>
                </div>
                <div className="bg-slate-900/30 rounded-lg p-3">
                  <p className="text-pink-400/70">Misses</p>
                  <p className="text-pink-400 font-mono text-lg">{bossQuickRunTotalMisses}/{BOSS_QUICK_RUN_MAX_MISSES}</p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => {
                // Set next beach effect
                if (bossQuickRunNextBeach) {
                  setBeachEffectWithRef(bossQuickRunNextBeach);
                }
                
                // Increment level
                const nextLevel = roguelikeLevel + 1;
                setRoguelikeLevel(nextLevel);
                roguelikeLevelRef.current = nextLevel;
                
                // Reset all ability cooldowns for the new level
                const defaultAbilityState: AbilityState = { active: false, cooldownRemaining: 0, durationRemaining: 0 };
                setInvincible({ ...defaultAbilityState, waterExposure: 0, waterLimit: getWetsuitWaterLimit() });
                setSuperTap({ ...defaultAbilityState, usesRemaining: SUPER_TAP_USES });
                setGhostToe(defaultAbilityState);
                setCrystalBall(defaultAbilityState);
                setSlowdown(defaultAbilityState);
                setWaveMagnet(defaultAbilityState);
                setWaveSurfer(defaultAbilityState);
                setTowelOff(defaultAbilityState);
                setDoubleDip(defaultAbilityState);
                setJumpAround(defaultAbilityState);
                
                // Show boss popup and start next level
                setShowBossBeachPopup(true);
                setGameState("playing");
                setFeetPosition(35);
                setWaves([]);
                setWaterTimer(bossQuickRunCarryoverTimer);
                levelStartingWaterTimerRef.current = bossQuickRunCarryoverTimer;
                setWavesTouched(0);
                setWavesMissed(0);
                // Fixed denominator - game over handled by checking total misses against MAX
                const maxMissesForRun = runType === "bossHellRun" ? BOSS_HELL_RUN_MAX_MISSES : BOSS_QUICK_RUN_MAX_MISSES;
                setRoguelikeWavesToLose(maxMissesForRun - bossQuickRunTotalMisses);
                lastTimeRef.current = 0;
                waveSpawnTimerRef.current = 0;
                waveIdRef.current = 0;
              }}
              className="w-full h-14 text-lg font-display bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-none shadow-lg"
            >
              Continue to Level {roguelikeLevel + 1}
            </Button>
          </div>
        </div>
      )}

      {/* Boss Quick Run Victory Screen */}
      {gameState === "bossQuickRunVictory" && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-amber-900/80 via-purple-900/50 to-slate-900 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border-2 border-amber-400 shadow-2xl shadow-amber-500/30 text-center">
            {/* Victory Header */}
            <div className="mb-4">
              <div className="text-6xl mb-2">🏆</div>
              <h2 className="text-3xl font-display text-amber-400 mb-1">
                VICTORY!
              </h2>
              <p className="text-white/70">
                You conquered all 10 Boss Beaches!
              </p>
            </div>
            
            {/* High Score Badge */}
            {bossQuickRunIsNewHighScore && (
              <div className="bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-400 rounded-lg p-3 mb-4 animate-pulse">
                <p className="text-amber-300 font-display text-lg">🌟 NEW HIGH SCORE! 🌟</p>
              </div>
            )}
            
            {/* Final Score */}
            <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
              <p className="text-white/60 text-sm mb-1">Final Score</p>
              <p className="text-5xl font-display text-amber-400 font-mono">{totalScore}</p>
            </div>
            
            {/* High Score Display */}
            <div className="bg-slate-900/30 rounded-lg p-3 mb-4">
              <p className="text-white/50 text-sm">High Score</p>
              <p className="text-2xl font-display text-purple-400 font-mono">{bossQuickRunHighScore}</p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
              <div className="bg-slate-900/30 rounded-lg p-3">
                <p className="text-cyan-400/70">Time Remaining</p>
                <p className="text-cyan-400 font-mono text-lg">{(bossQuickRunCarryoverTimer / 1000).toFixed(1)}s</p>
              </div>
              <div className="bg-slate-900/30 rounded-lg p-3">
                <p className="text-pink-400/70">Total Misses</p>
                <p className="text-pink-400 font-mono text-lg">{bossQuickRunTotalMisses}/{BOSS_QUICK_RUN_MAX_MISSES}</p>
              </div>
            </div>
            
            {/* Abilities Used */}
            <div className="mb-6">
              <p className="text-white/50 text-sm mb-2">Abilities Used</p>
              <div className="flex justify-center gap-2">
                {selectedAbilities.map((type) => {
                  const info = {
                    wetsuit: { icon: <Shirt className="w-5 h-5" />, color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
                    superTap: { icon: <Zap className="w-5 h-5" />, color: "text-orange-400", bgColor: "bg-orange-500/20" },
                    ghostToe: { icon: <Ghost className="w-5 h-5" />, color: "text-purple-400", bgColor: "bg-purple-500/20" },
                    crystalBall: { icon: <Shell className="w-5 h-5" />, color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
                    slowdown: { icon: <Snail className="w-5 h-5" />, color: "text-pink-400", bgColor: "bg-pink-500/20" },
                    waveMagnet: { icon: <Magnet className="w-5 h-5" />, color: "text-red-400", bgColor: "bg-red-500/20" },
                    waveSurfer: { icon: <Waves className="w-5 h-5" />, color: "text-teal-400", bgColor: "bg-teal-500/20" },
                    towelOff: { icon: <Wind className="w-5 h-5" />, color: "text-sky-400", bgColor: "bg-sky-500/20" },
                    doubleDip: { icon: <span className="w-5 h-5 flex items-center justify-center font-bold text-xs">2x</span>, color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
                    jumpAround: { icon: <Rabbit className="w-5 h-5" />, color: "text-lime-400", bgColor: "bg-lime-500/20" },
                  }[type];
                  return (
                    <div
                      key={type}
                      className={cn("p-2 rounded-lg", info?.bgColor)}
                    >
                      <span className={info?.color}>{info?.icon}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Play Again Button */}
            <Button
              onClick={() => {
                // Reset all Boss Quick Run state
                setBossQuickRunUsedBeaches([]);
                setBossQuickRunCarryoverTimer(BOSS_QUICK_RUN_STARTING_WATER_TIME);
                bossQuickRunCarryoverTimerRef.current = BOSS_QUICK_RUN_STARTING_WATER_TIME;
                setBossQuickRunTotalMisses(0);
                bossQuickRunTotalMissesRef.current = 0;
                setBossQuickRunLevelScore(0);
                setBossQuickRunNextBeach(null);
                setBossQuickRunIsNewHighScore(false);
                setRoguelikeLevel(1);
                roguelikeLevelRef.current = 1;
                setTotalScore(0);
                setUnlockedAbilities([]);
                setSelectedAbilities([]);
                
                // Go back to roguelike menu
                setGameState("roguelikeMenu");
              }}
              className="w-full h-14 text-lg font-display bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-none shadow-lg"
            >
              Play Again
            </Button>
          </div>
        </div>
      )}

      {/* Slay the Waves Start Screen */}
      {gameState === "slayMenu" && (
        <SlayTheWavesStartScreen
          onStart={startSlayTheWavesRun}
          onContinue={continueSlayTheWavesRun}
          hasSavedRun={slayHasSavedRun}
        />
      )}
      
      {/* Slay the Waves Map Screen */}
      {gameState === "slayMap" && slayMap && (
        <div className="absolute inset-0 z-30 flex flex-col items-center bg-gradient-to-b from-slate-900 to-slate-800 overflow-auto py-4 px-2">
          <SlayMapView
            map={slayMap}
            availableNodeIds={getAvailableNodes(slayMap).map(n => n.id)}
            onSelectNode={handleSlayNodeSelect}
            gold={slayGold}
          />
          <Button
            variant="outline"
            onClick={saveSlayRun}
            className="mt-4 border-white/30 text-white/70 hover:bg-white/10"
          >
            Save & Exit
          </Button>
        </div>
      )}
      
      {/* Slay the Waves Shop Screen */}
      {gameState === "slayShop" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 overflow-auto py-6 px-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-lg mx-4 border-2 border-yellow-500/50 shadow-2xl">
            <ShopScreen
              gold={slayGold}
              unlockedAbilities={unlockedAbilities}
              permanentUpgrades={permanentUpgrades}
              availableAbilities={ALL_ABILITIES.filter(a => 
                !unlockedAbilities.some(u => u.type === a) && !excludedAbilities.includes(a)
              )}
              onPurchaseAbility={handleSlayShopPurchaseAbility}
              onPurchaseUpgrade={handleSlayShopUpgrade}
              onPurchaseWaterTime={handleSlayShopWaterTime}
              onPurchasePermanentUpgrade={handleSlayShopPermanentUpgrade}
              onLeave={() => setGameState("slayMap")}
            />
          </div>
        </div>
      )}
      
      {/* Slay the Waves Rest Site Screen */}
      {gameState === "slayRest" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 overflow-auto py-6 px-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-lg mx-4 border-2 border-green-500/50 shadow-2xl">
            <RestSiteScreen
              currentWaterTime={slayMaxWaterTime}
              unlockedAbilities={unlockedAbilities}
              onRestoreWaterTime={handleSlayRestWaterTime}
              onUpgradeAbility={handleSlayRestUpgrade}
              onLeave={() => setGameState("slayMap")}
              hasRested={slayHasRested}
            />
          </div>
        </div>
      )}
      
      {/* Slay the Waves Event Screen */}
      {gameState === "slayEvent" && slayCurrentEvent && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 overflow-auto py-6 px-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-lg mx-4 border-2 border-purple-500/50 shadow-2xl">
            <EventScreen
              event={slayCurrentEvent}
              gold={slayGold}
              onSelectOption={handleSlayEventOption}
            />
          </div>
        </div>
      )}
      
      {/* Slay the Waves Beach Preview Screen */}
      {gameState === "slayBeachPreview" && currentBeachEffect && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 overflow-auto py-6 px-4">
          <div className="bg-slate-800 rounded-xl p-2 max-w-md mx-4 border-2 border-blue-500/50 shadow-2xl relative">
            <BeachPreviewScreen
              beachType={currentBeachEffect}
              nodeType={slayPendingNodeType}
              gold={slayGold}
              onStart={handleSlayStartBattle}
            />
          </div>
        </div>
      )}
      
      {/* Slay the Waves Card Reward Screen */}
      {gameState === "slayCardReward" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 overflow-auto py-6 px-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-2xl mx-4 border-2 border-amber-500/50 shadow-2xl">
            <CardRewardScreen
              abilities={slayCardRewardAbilities}
              levelScore={levelScore}
              goldEarned={slayPendingNodeType === "boss" ? GOLD_PER_BOSS : slayPendingNodeType === "elite" ? GOLD_PER_ELITE : GOLD_PER_BEACH}
              currentGold={slayGold}
              onSelectAbility={handleSlayCardSelect}
              onSkip={handleSlayCardSkip}
              nodeType={slayPendingNodeType}
            />
          </div>
        </div>
      )}
      
      {/* ============= END SLAY THE WAVES SCREENS ============= */}

      {/* Beach Selection Screen (Beach Bonanza mode) */}
      {gameState === "selectBeach" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center bg-black/80 overflow-auto py-6 px-4">
          <Link
            to="/"
            className="text-white/70 hover:text-white text-sm mb-4 transition-colors"
          >
            ← Back to Games
          </Link>
          <h1 className="text-3xl sm:text-4xl font-display text-cyan-400 mb-2 drop-shadow-lg text-center">
            WAVE CHASER
          </h1>
          <BeachSelectionScreen
            beachOptions={beachOptions}
            onSelectBeach={handleSelectBeach}
            currentBeachNumber={beachNumber}
          />
        </div>
      )}

      {/* Confirm Loadout Screen (when >4 abilities and has previous selection) */}
      {gameState === "confirmLoadout" && isRoguelike && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 overflow-auto py-6 px-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-lg mx-4 border-2 border-purple-500/50 shadow-2xl">
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-display text-purple-400 mb-2">
                  Level {roguelikeLevel}
                </h2>
                <p className="text-white/70">
                  {swappingSlot !== null ? "Select replacement:" : "Keep abilities the same or tap any ability to swap it out:"}
                </p>
              </div>
              
              {swappingSlot === null ? (
                <>
                  <div className="w-full grid grid-cols-2 gap-3">
                    {selectedAbilities.map((type, index) => {
                      const ability = unlockedAbilities.find(a => a.type === type);
                      const ABILITY_KEYS_LOCAL = ["C", "V", "B", "N"];
                      const info = {
                        wetsuit: { name: "Wet Suit", icon: <Shirt className="w-6 h-6" />, color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
                        superTap: { name: "Super Tap", icon: <Zap className="w-6 h-6" />, color: "text-orange-400", bgColor: "bg-orange-500/20" },
                        ghostToe: { name: "Ghost Feet", icon: <Ghost className="w-6 h-6" />, color: "text-purple-400", bgColor: "bg-purple-500/20" },
                        crystalBall: { name: "Crystal Conch", icon: <Shell className="w-6 h-6" />, color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
                        slowdown: { name: "Slowdown", icon: <Snail className="w-6 h-6" />, color: "text-pink-400", bgColor: "bg-pink-500/20" },
                        waveMagnet: { name: "Wave Magnet", icon: <Magnet className="w-6 h-6" />, color: "text-red-400", bgColor: "bg-red-500/20" },
                        waveSurfer: { name: "Teleport", icon: <Waves className="w-6 h-6" />, color: "text-teal-400", bgColor: "bg-teal-500/20" },
                        towelOff: { name: "Towel Off", icon: <Wind className="w-6 h-6" />, color: "text-sky-400", bgColor: "bg-sky-500/20" },
                        doubleDip: { name: "Double Dip", icon: <span className="w-6 h-6 flex items-center justify-center font-bold text-sm">2x</span>, color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
                        jumpAround: { name: "Jump Around", icon: <Rabbit className="w-6 h-6" />, color: "text-lime-400", bgColor: "bg-lime-500/20" },
                      }[type];
                      
                      return (
                        <button
                          key={type}
                          onClick={() => setSwappingSlot(index)}
                          className={cn(
                            "relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:border-purple-400 hover:scale-[1.02]",
                            info?.bgColor,
                            "border-slate-600"
                          )}
                        >
                          <div className={cn("p-2 rounded-lg", info?.bgColor)}>
                            <span className={info?.color}>{info?.icon}</span>
                          </div>
                          <div className="text-left flex-1">
                            <p className={cn("font-semibold text-sm", info?.color)}>{info?.name}</p>
                            <p className="text-xs text-white/40">Level {(ability?.upgradeCount || 0) + 1}</p>
                          </div>
                          <div className="absolute top-1 right-1 bg-slate-700 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {ABILITY_KEYS_LOCAL[index]}
                          </div>
                          <div className="absolute bottom-1 right-1 text-[10px] text-white/40">
                            tap to swap
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-3 w-full">
                    <Button
                      onClick={handleChangeLoadout}
                      variant="outline"
                      className="flex-1 h-12 font-display border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                    >
                      Change All
                    </Button>
                    <Button
                      onClick={handleKeepLoadout}
                      className="flex-1 h-12 font-display bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white"
                    >
                      Ready
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Show the ability being replaced */}
                  <div className="w-full text-center mb-2">
                    {(() => {
                      const replacingType = selectedAbilities[swappingSlot];
                      const info = {
                        wetsuit: { name: "Wet Suit", icon: <Shirt className="w-5 h-5" />, color: "text-yellow-400" },
                        superTap: { name: "Super Tap", icon: <Zap className="w-5 h-5" />, color: "text-orange-400" },
                        ghostToe: { name: "Ghost Feet", icon: <Ghost className="w-5 h-5" />, color: "text-purple-400" },
                        crystalBall: { name: "Crystal Conch", icon: <Shell className="w-5 h-5" />, color: "text-cyan-400" },
                        slowdown: { name: "Slowdown", icon: <Snail className="w-5 h-5" />, color: "text-pink-400" },
                        waveMagnet: { name: "Wave Magnet", icon: <Magnet className="w-5 h-5" />, color: "text-red-400" },
                        waveSurfer: { name: "Teleport", icon: <Waves className="w-5 h-5" />, color: "text-teal-400" },
                        towelOff: { name: "Towel Off", icon: <Wind className="w-5 h-5" />, color: "text-sky-400" },
                        doubleDip: { name: "Double Dip", icon: <span className="w-5 h-5 flex items-center justify-center font-bold text-xs">2x</span>, color: "text-emerald-400" },
                        jumpAround: { name: "Jump Around", icon: <Rabbit className="w-5 h-5" />, color: "text-lime-400" },
                      }[replacingType];
                      return (
                        <p className="text-white/50 text-sm flex items-center justify-center gap-2">
                          Replacing <span className={info?.color}>{info?.icon}</span>
                          <span className={info?.color}>{info?.name}</span> with:
                        </p>
                      );
                    })()}
                  </div>
                  
                  {/* Show unequipped abilities to swap in */}
                  <div className="w-full grid grid-cols-2 gap-3">
                    {unlockedAbilities
                      .filter(a => !selectedAbilities.includes(a.type))
                      .map((ability) => {
                        const info = {
                          wetsuit: { name: "Wet Suit", icon: <Shirt className="w-6 h-6" />, color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
                          superTap: { name: "Super Tap", icon: <Zap className="w-6 h-6" />, color: "text-orange-400", bgColor: "bg-orange-500/20" },
                          ghostToe: { name: "Ghost Feet", icon: <Ghost className="w-6 h-6" />, color: "text-purple-400", bgColor: "bg-purple-500/20" },
                          crystalBall: { name: "Crystal Conch", icon: <Shell className="w-6 h-6" />, color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
                          slowdown: { name: "Slowdown", icon: <Snail className="w-6 h-6" />, color: "text-pink-400", bgColor: "bg-pink-500/20" },
                          waveMagnet: { name: "Wave Magnet", icon: <Magnet className="w-6 h-6" />, color: "text-red-400", bgColor: "bg-red-500/20" },
                          waveSurfer: { name: "Teleport", icon: <Waves className="w-6 h-6" />, color: "text-teal-400", bgColor: "bg-teal-500/20" },
                          towelOff: { name: "Towel Off", icon: <Wind className="w-6 h-6" />, color: "text-sky-400", bgColor: "bg-sky-500/20" },
                          doubleDip: { name: "Double Dip", icon: <span className="w-6 h-6 flex items-center justify-center font-bold text-sm">2x</span>, color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
                          jumpAround: { name: "Jump Around", icon: <Rabbit className="w-6 h-6" />, color: "text-lime-400", bgColor: "bg-lime-500/20" },
                        }[ability.type];
                        
                        return (
                          <button
                            key={ability.type}
                            onClick={() => handleQuickSwap(ability.type)}
                            className={cn(
                              "relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:border-green-400 hover:scale-[1.02]",
                              info?.bgColor,
                              "border-slate-600"
                            )}
                          >
                            <div className={cn("p-2 rounded-lg", info?.bgColor)}>
                              <span className={info?.color}>{info?.icon}</span>
                            </div>
                            <div className="text-left flex-1">
                              <p className={cn("font-semibold text-sm", info?.color)}>{info?.name}</p>
                              <p className="text-xs text-white/40">Level {ability.upgradeCount + 1}</p>
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  <Button
                    onClick={() => setSwappingSlot(null)}
                    variant="outline"
                    className="w-full h-10 font-display border-slate-600 text-white/70 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ability Selection Screen (when >4 abilities unlocked) */}
      {gameState === "selectAbilities" && isRoguelike && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 overflow-auto py-6 px-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-lg mx-4 border-2 border-purple-500/50 shadow-2xl">
            <AbilitySelectionScreen
              level={roguelikeLevel}
              unlockedAbilities={unlockedAbilities}
              onConfirm={handleConfirmAbilitySelection}
            />
          </div>
        </div>
      )}

      {/* Level Complete Screen (Roguelike) */}
      {gameState === "levelComplete" && isRoguelike && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 overflow-auto py-6 px-4">
          {/* Celebration overlay - shows during transition */}
          {!levelCompleteReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
              {/* Burst of particles */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 rounded-full animate-ping"
                  style={{
                    backgroundColor: ['#fbbf24', '#a855f7', '#22d3ee', '#34d399', '#f472b6'][i % 5],
                    transform: `rotate(${i * 30}deg) translateY(-60px)`,
                    animationDuration: '0.6s',
                    animationDelay: `${i * 0.03}s`,
                    opacity: 0.8,
                  }}
                />
              ))}
              {/* Central glow */}
              <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 via-cyan-400 to-yellow-400 opacity-60 animate-pulse blur-xl" />
              {/* Level text */}
              <div className="text-4xl font-display text-white animate-bounce drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">
                🎉 Level {roguelikeLevel}!
              </div>
            </div>
          )}
          
          {/* Upgrade screen - fades in after celebration */}
          <BeachFrame beachType={runType === "beachBonanza" ? currentBeachEffect : null}>
            <div 
              className={cn(
                "bg-slate-800 p-6 max-w-lg shadow-2xl transition-all duration-300",
                runType === "beachBonanza" && currentBeachEffect ? "" : "rounded-xl border-2 border-purple-500/50 mx-4",
                levelCompleteReady ? "opacity-100 scale-100" : "opacity-0 scale-95"
              )}
            >
            {/* Current Beach Effect Display */}
            {completedBeachForDisplay && (
              <div className="mb-4 p-2 bg-orange-900/40 border border-orange-500/50 rounded-lg">
                <p className="text-orange-400 text-center text-sm">
                  🏖️ Completed with: <span className="font-semibold">{BEACH_EFFECTS.find(e => e.type === completedBeachForDisplay)?.name}</span>
                </p>
              </div>
            )}
            
            <RoguelikeAbilitySelect
              level={roguelikeLevel}
              unlockedAbilities={unlockedAbilities}
              waterTimeBonus={waterTimeBonus}
              wavesMissedBonus={wavesMissedBonus}
              baseWaterTime={getRoguelikeLevelSettings(roguelikeLevel + 1).waterTimer}
              baseWavesToLose={getRoguelikeLevelSettings(roguelikeLevel + 1, lastWavesMissedUpgradeLevel).wavesToLose}
              previousWavesToLose={getRoguelikeLevelSettings(roguelikeLevel, lastWavesMissedUpgradeLevel).wavesToLose}
              wavesToWin={getRoguelikeLevelSettings(roguelikeLevel + 1).wavesToWin}
              previousWavesToWin={getRoguelikeLevelSettings(roguelikeLevel).wavesToWin}
              permanentUpgrades={permanentUpgrades}
              excludedAbilities={excludedAbilities}
              onSelectNewAbility={handleUnlockAbility}
              onUpgradeAbility={handleUpgradeAbility}
              onUpgradeWaterTime={handleUpgradeWaterTime}
              onUpgradeWavesMissed={handleUpgradeWavesMissed}
              onSelectPermanentUpgrade={handleSelectPermanentUpgrade}
              onContinueWithoutUpgrade={handleContinueWithoutUpgrade}
              isFirstUnlock={roguelikeLevel === 1}
              disabled={!levelCompleteReady}
              upcomingBossEffect={getUpcomingBossEffect()}
              levelScore={levelScore}
              totalScore={totalScore}
            />
            
            {/* Pause Run Button */}
            {levelCompleteReady && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={saveRoguelikeRun}
                  className="w-full border-white/30 text-white/70 hover:bg-white/10"
                >
                  Pause Run & Return to Menu
                </Button>
              </div>
            )}
            </div>
          </BeachFrame>
        </div>
      )}

      {/* Game Over Screen (Standard) */}
      {gameState === "gameOver" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="bg-slate-800 rounded-xl p-8 max-w-md mx-4 text-center border-2 border-red-500/50 shadow-2xl">
            <h2 className="text-3xl font-display text-red-400 mb-2">
              Time's Up!
            </h2>
            <p className="text-white/60 text-sm mb-2 capitalize">{difficulty} Mode</p>
            <p className="text-white/80 mb-2">
              {gameOverReason === "missed" 
                ? "You missed too many waves!" 
                : "Your feet got too soggy!"}
            </p>
            <div className="my-6">
              <p className="text-white/60 text-sm uppercase tracking-wider">
                Waves Touched
              </p>
              <p className="text-5xl font-display text-cyan-300 font-mono">
                {wavesTouched}
              </p>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                onClick={startGame}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-display px-6 py-4"
              >
                Play Again
              </Button>
              <Button
                variant="outline"
                onClick={goToMenu}
                className="border-white/30 text-white hover:bg-white/10 px-4 py-4"
              >
                Change Difficulty
              </Button>
              <Link to="/">
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-6 py-4"
                >
                  Back to Games
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Roguelike Game Over Screen */}
      {gameState === "roguelikeGameOver" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="bg-slate-800 rounded-xl p-8 max-w-md mx-4 text-center border-2 border-purple-500/50 shadow-2xl">
            <h2 className="text-3xl font-display text-purple-400 mb-2">
              Run Over!
            </h2>
            <p className="text-white/60 text-sm mb-2">Roguelike Mode</p>
            <p className="text-white/80 mb-2">
              {gameOverReason === "missed" 
                ? "You missed too many waves!" 
                : "Your feet got too soggy!"}
            </p>
            
            <div className="my-6 space-y-4">
              <div>
                <p className="text-white/60 text-sm uppercase tracking-wider">
                  Final Score
                </p>
                <p className="text-4xl font-display text-yellow-400 font-mono">
                  {totalScore}
                </p>
              </div>
              <div className="flex justify-center gap-6">
                <div>
                  <p className="text-white/60 text-sm uppercase tracking-wider">
                    Final Level
                  </p>
                  <p className="text-2xl font-display text-purple-300 font-mono">
                    {roguelikeLevel}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-sm uppercase tracking-wider">
                    Total Waves
                  </p>
                  <p className="text-2xl font-display text-cyan-300 font-mono">
                    {roguelikeTotalWaves + wavesTouched}
                  </p>
                </div>
              </div>
              <div className="flex justify-center gap-6">
                <div>
                  <p className="text-white/60 text-sm uppercase tracking-wider">
                    Total Steps
                  </p>
                  <p className="text-2xl font-display text-orange-300 font-mono">
                    {totalSteps}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-sm uppercase tracking-wider">
                    Total Toe Taps
                  </p>
                  <p className="text-2xl font-display text-pink-300 font-mono">
                    {totalToeTaps}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-white/60 text-sm uppercase tracking-wider">
                  Loadout
                </p>
                <div className="flex justify-center gap-2 mt-2 flex-wrap">
                  {selectedAbilities.length === 0 ? (
                    <span className="text-white/40 text-sm">None</span>
                  ) : (
                    selectedAbilities.map((type) => {
                      const ability = unlockedAbilities.find(a => a.type === type);
                      return (
                        <div 
                          key={type}
                          className={cn(
                            "px-3 py-1 rounded-lg text-sm",
                            type === "wetsuit" && "bg-yellow-500/20 text-yellow-400",
                            type === "superTap" && "bg-orange-500/20 text-orange-400",
                            type === "ghostToe" && "bg-purple-500/20 text-purple-400",
                            type === "crystalBall" && "bg-cyan-500/20 text-cyan-400",
                            type === "slowdown" && "bg-pink-500/20 text-pink-400",
                            type === "waveMagnet" && "bg-red-500/20 text-red-400",
                            type === "waveSurfer" && "bg-teal-500/20 text-teal-400",
                            type === "towelOff" && "bg-sky-500/20 text-sky-400",
                            type === "doubleDip" && "bg-emerald-500/20 text-emerald-400",
                            type === "jumpAround" && "bg-lime-500/20 text-lime-400"
                          )}
                        >
                          {type === "wetsuit" && "Wet Suit"}
                          {type === "superTap" && "Super Tap"}
                          {type === "ghostToe" && "Ghost Feet"}
                          {type === "crystalBall" && "Crystal Conch"}
                          {type === "slowdown" && "Slowdown"}
                          {type === "waveMagnet" && "Wave Magnet"}
                          {type === "waveSurfer" && "Teleport"}
                          {type === "towelOff" && "Towel Off"}
                          {type === "doubleDip" && "Double Dip"}
                          {type === "jumpAround" && "Jump Around"}
                          {ability && ` Lv${ability.upgradeCount + 1}`}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            
            <div className={cn(
              "flex gap-4 justify-center flex-wrap transition-all duration-300",
              gameOverReady ? "opacity-100" : "opacity-50 pointer-events-none"
            )}>
              <Button
                onClick={() => {
                  // Keep totalScore intact - just reset level score (failed level gives no points)
                  setLevelScore(0);
                  
                  // Boss Quick Run: use custom retry logic with correct settings
                  if (runType === "bossQuickRun") {
                    // Reset abilities cooldowns
                    const defaultAbilityState: AbilityState = { active: false, cooldownRemaining: 0, durationRemaining: 0 };
                    setInvincible({ ...defaultAbilityState, waterExposure: 0, waterLimit: getWetsuitWaterLimit() });
                    setSuperTap({ ...defaultAbilityState, usesRemaining: SUPER_TAP_USES });
                    setGhostToe(defaultAbilityState);
                    setCrystalBall(defaultAbilityState);
                    setSlowdown(defaultAbilityState);
                    setWaveMagnet(defaultAbilityState);
                    setWaveSurfer(defaultAbilityState);
                    setTowelOff(defaultAbilityState);
                    setDoubleDip(defaultAbilityState);
                    setJumpAround(defaultAbilityState);
                    
                    // Show boss popup and start level with current carryover values
                    setShowBossBeachPopup(true);
                    setGameState("playing");
                    setFeetPosition(35);
                    setWaves([]);
                    setWaterTimer(bossQuickRunCarryoverTimerRef.current);
                    levelStartingWaterTimerRef.current = bossQuickRunCarryoverTimerRef.current;
                    setWavesTouched(0);
                    setWavesMissed(0);
                    setRoguelikeWavesToWin(BOSS_QUICK_RUN_WAVES_TO_WIN);
                    // Remaining misses = MAX - total accumulated so far
                    const maxMissesForRun = runTypeRef.current === "bossHellRun" ? BOSS_HELL_RUN_MAX_MISSES : BOSS_QUICK_RUN_MAX_MISSES;
                    setRoguelikeWavesToLose(maxMissesForRun - bossQuickRunTotalMissesRef.current);
                    lastTimeRef.current = 0;
                    waveSpawnTimerRef.current = 0;
                    waveIdRef.current = 0;
                    return;
                  }
                  
                  // Standard roguelike retry
                  proceedToLevel(roguelikeLevel);
                }}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-display px-6 py-4"
                disabled={!gameOverReady}
              >
                Retry Level
              </Button>
              <Button
                onClick={() => startRoguelikeRun(movementMode)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-display px-6 py-4"
                disabled={!gameOverReady}
              >
                New Run
              </Button>
              <Button
                variant="outline"
                onClick={goToMenu}
                className="border-white/30 text-white hover:bg-white/10 px-4 py-4"
                disabled={!gameOverReady}
              >
                Change Mode
              </Button>
              <Link to="/">
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-6 py-4"
                  disabled={!gameOverReady}
                >
                  Back to Games
                </Button>
              </Link>
            </div>
            {!gameOverReady && (
              <p className="text-white/40 text-sm mt-4 animate-pulse">Please wait...</p>
            )}
          </div>
        </div>
      )}

      {/* Controls hint */}
      {gameState === "playing" && (
        <div className="hidden sm:block absolute bottom-4 left-4 z-20 text-white/50 text-sm font-mono">
          <p>↑↓ Move • Space = tap • V/B/N = abilities</p>
        </div>
      )}
    </div>
  );
};

export default WavesGame;
