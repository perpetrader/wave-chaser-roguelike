import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  GameState,
  GameOverReason,
  RunType,
  MovementMode,
  FootType,
  Wave,
  AbilityType,
  AbilityState,
  UnlockedAbility,
  BeachEffectType,
  BeachPerson,
  PermanentUpgrades,
  DifficultySettings,
  WorldState,
} from "../engine/core/types";
import { DEFAULT_PERMANENT_UPGRADES, ALL_ABILITY_TYPES } from "../engine/core/types";
import { DEFAULT_FEET_POSITION, ROGUELIKE_BASE_WATER_TIMER } from "../engine/data/constants";

// ─── Default ability states ─────────────────────────────────────────────────

function createDefaultAbilityStates(): Record<AbilityType, AbilityState> {
  const states = {} as Record<AbilityType, AbilityState>;
  for (const type of ALL_ABILITY_TYPES) {
    states[type] = {
      active: false,
      cooldownRemaining: 0,
      durationRemaining: 0,
    };
  }
  return states;
}

// ─── Default world state ────────────────────────────────────────────────────

export function createDefaultWorldState(): WorldState {
  return {
    // Core
    gameState: "menu",
    runType: "roguelike",
    gameOverReason: null,

    // Player
    feetPosition: DEFAULT_FEET_POSITION,
    isTapping: false,
    momentumGear: 0,
    movementMode: "standard",
    footType: "tourist",
    autoToeTap: false,

    // Waves
    waves: [],
    wavesTouched: 0,
    wavesMissed: 0,
    waterTimer: ROGUELIKE_BASE_WATER_TIMER,
    maxWaterTimer: ROGUELIKE_BASE_WATER_TIMER,
    waveIdCounter: 0,
    lastWaveMaxReach: 35,

    // Level config
    wavesToWin: 4,
    wavesToLose: 7,
    difficultySettings: {
      waveSpawnInterval: 4200,
      wavePeakDuration: 2500,
      waveSpeed: 250,
    },
    waveSpawnTimer: 0,

    // Abilities
    selectedAbilities: [],
    unlockedAbilities: [],
    excludedAbilities: [],
    abilityStates: createDefaultAbilityStates(),
    waveSurferQueued: false,
    waveSurferTeleportRow: null,
    waveSurferShield: 0,

    // Beach effects
    currentBeachEffect: null,
    beachEffectLevel: 1,
    usedBeachEffects: [],
    pendingBeachEffect: null,

    // Beach effect substates
    quicksandStillTimer: 0,
    quicksandPenaltyTimer: 0,
    fishNetStuck: false,
    fishNetTimer: 0,
    flashlightActive: false,
    flashlightDuration: 0,
    flashlightCooldown: 0,
    beachPeople: [],
    beachPeopleSpawnTimer: 0,
    spikeFlashTimer: 0,

    // Roguelike progression
    roguelikeLevel: 1,
    roguelikeTotalWaves: 0,
    totalScore: 0,
    levelScore: 0,
    waterTimeBonus: 0,
    wavesMissedBonus: 0,
    lastWavesMissedUpgradeLevel: 0,
    permanentUpgrades: { ...DEFAULT_PERMANENT_UPGRADES },

    // Audio
    isMuted: false,

    // Timing
    elapsedTime: 0,
  };
}

// ─── Store interface ────────────────────────────────────────────────────────

interface GameStoreActions {
  // Sync entire world state from engine (called once per frame)
  syncFromEngine: (state: Partial<WorldState>) => void;

  // UI-driven actions
  setGameState: (state: GameState) => void;
  setMuted: (muted: boolean) => void;
  resetForNewGame: () => void;
}

export type GameStore = WorldState & GameStoreActions;

// ─── Create store ───────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>()(
  immer((set) => ({
    ...createDefaultWorldState(),

    syncFromEngine: (engineState) =>
      set((draft) => {
        Object.assign(draft, engineState);
      }),

    setGameState: (gameState) =>
      set((draft) => {
        draft.gameState = gameState;
      }),

    setMuted: (muted) =>
      set((draft) => {
        draft.isMuted = muted;
      }),

    resetForNewGame: () =>
      set(() => createDefaultWorldState()),
  }))
);
