import type { WorldState } from "../core/types";

/**
 * ScoreSystem: Calculates level scores.
 */
export class ScoreSystem {
  /**
   * Calculate the score for a completed level.
   */
  calculateLevelScore(state: WorldState): number {
    const waterTimeSec = state.waterTimer / 1000;
    const missesRemaining = state.wavesToLose - state.wavesMissed;

    if (state.runType === "bossQuickRun" || state.runType === "bossHellRun") {
      // Boss Run: 10 * level * (seconds remaining + misses remaining)
      return Math.round(10 * state.roguelikeLevel * (waterTimeSec + missesRemaining));
    }

    // Standard: +4 per wave touched, +10 per second remaining, +10 per missed wave remaining
    return Math.round(
      (state.wavesTouched * 4) + (waterTimeSec * 10) + (missesRemaining * 10)
    );
  }
}
