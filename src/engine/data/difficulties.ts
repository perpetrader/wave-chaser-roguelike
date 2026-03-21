import type { WavesDifficulty, DifficultySettings } from "../core/types";
import {
  ROGUELIKE_BASE_WATER_TIMER,
  ROGUELIKE_BASE_SPAWN_INTERVAL,
  ROGUELIKE_BASE_PEAK_DURATION,
  ROGUELIKE_BASE_WAVE_SPEED,
} from "./constants";

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
      multiplier: 0.1,
    },
  },
  expert: {
    waveSpawnInterval: 2000,
    wavePeakDuration: 1300,
    waveSpeed: 250,
    scaling: {
      everyNWaves: 5,
      multiplier: 0.2,
    },
  },
};

export const ROGUELIKE_BASE_SETTINGS: DifficultySettings = {
  waveSpawnInterval: ROGUELIKE_BASE_SPAWN_INTERVAL,
  wavePeakDuration: ROGUELIKE_BASE_PEAK_DURATION,
  waveSpeed: ROGUELIKE_BASE_WAVE_SPEED,
};

/**
 * Calculate roguelike difficulty settings for a given level.
 * Difficulty increases 2% per level. Waves to win/lose scale every 5 levels.
 * Water timer decreases 3% per level.
 */
export function getRoguelikeLevelSettings(level: number): {
  settings: DifficultySettings;
  wavesToWin: number;
  wavesToLose: number;
  waterTimer: number;
} {
  const scalingFactor = Math.pow(0.98, level - 1);
  const levelTier = Math.floor((level - 1) / 5);

  const wavesToWin = 4 + levelTier * 2;
  const wavesToLose = 7 - levelTier;

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
}
