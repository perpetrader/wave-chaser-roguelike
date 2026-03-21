import type { WorldState, Wave } from "../core/types";
import { OCEAN_HEIGHT, BEACH_HEIGHT } from "../data/constants";

/**
 * WaveSystem: Handles wave spawning, movement, and phase transitions.
 * Waves spawn in the ocean, travel to their maxReach (peak), pause, then recede.
 */
export class WaveSystem {
  /**
   * Update wave spawning and movement.
   * @param shouldMoveWaves Whether waves should advance one row this frame (controlled by engine accumulator)
   * @param dt Raw delta time for peak timer and spawn timer
   * @param effectivePeakDuration Adjusted peak duration (with slowdown/rough waters)
   * @param effectiveSpawnInterval Adjusted spawn interval (with slowdown)
   * @returns Number of waves missed
   */
  update(
    state: WorldState,
    dt: number,
    shouldMoveWaves: boolean,
    effectivePeakDuration: number,
    effectiveSpawnInterval: number,
  ): { missed: number } {
    let missed = 0;

    // ─── Spawn ────────────────────────────────────────────────────────────
    state.waveSpawnTimer += dt;
    if (state.waveSpawnTimer >= effectiveSpawnInterval) {
      state.waveSpawnTimer -= effectiveSpawnInterval;
      const newWave = this.spawnWave(state);
      state.waves.push(newWave);
    }

    // ─── Update existing waves ────────────────────────────────────────────
    const updatedWaves: Wave[] = [];
    for (const wave of state.waves) {
      let row = wave.row;
      let phase = wave.phase;
      let peakTimer = wave.peakTimer;
      let maxReach = wave.maxReach;
      let magnetAffected = wave.magnetAffected ?? false;

      if (phase === "peak") {
        // Peak timer accumulates continuously (not gated by shouldMoveWaves)
        peakTimer += dt;
        if (peakTimer >= effectivePeakDuration) {
          phase = "outgoing";
        }
      } else if (shouldMoveWaves) {
        if (phase === "incoming") {
          row += 1;

          // Wave Magnet: constrain peak to near player
          if (state.abilityStates.waveMagnet.active && !magnetAffected) {
            const randomOffset = Math.floor(Math.random() * 3) - 1;
            maxReach = Math.floor(state.feetPosition) + randomOffset;
            maxReach = Math.max(OCEAN_HEIGHT, Math.min(OCEAN_HEIGHT + BEACH_HEIGHT - 2, maxReach));
            magnetAffected = true;
            state.lastWaveMaxReach = maxReach;
          }

          if (row >= maxReach) {
            phase = "peak";
            peakTimer = 0;
          }
        } else if (phase === "outgoing") {
          row -= 1;
        }
      }

      // Remove waves that have returned to ocean
      if (phase === "outgoing" && row < OCEAN_HEIGHT) {
        if (!wave.touched) {
          missed++;
        }
        continue; // Don't add to updatedWaves
      }

      updatedWaves.push({
        id: wave.id,
        row,
        startRow: wave.startRow,
        maxReach: magnetAffected ? maxReach : wave.maxReach,
        phase,
        peakTimer,
        touched: wave.touched,
        magnetAffected,
      });
    }

    state.waves = updatedWaves;
    return { missed };
  }

  // ─── Private ────────────────────────────────────────────────────────────

  private spawnWave(state: WorldState): Wave {
    const startRow = OCEAN_HEIGHT - 10 + Math.floor(Math.random() * 3); // rows 20, 21, or 22

    // Calculate variance
    let baseVariance = 2;
    if (state.runType === "bossHellRun") {
      baseVariance = 3;
    } else if (state.roguelikeLevel > 40) {
      baseVariance = 4;
    } else if (state.roguelikeLevel > 20) {
      baseVariance = 3;
    }

    // Crazy Waves multiplier
    let variance = baseVariance;
    if (state.currentBeachEffect === "crazyWaves") {
      const lvl = state.beachEffectLevel;
      const mults = [1.2, 1.4, 1.6, 2, 3];
      const idx = Math.min(lvl - 1, 4);
      variance = Math.floor(baseVariance * mults[idx]);
    }

    // Calculate maxReach
    let maxReach: number;
    const lastPeak = state.lastWaveMaxReach;

    if (state.currentBeachEffect === "crazyWaves") {
      // Must be at least baseVariance away from previous peak
      const farBelowMin = Math.max(OCEAN_HEIGHT, lastPeak - variance);
      const farBelowMax = Math.max(OCEAN_HEIGHT, lastPeak - baseVariance);
      const farAboveMin = Math.min(OCEAN_HEIGHT + 10, lastPeak + baseVariance);
      const farAboveMax = Math.min(OCEAN_HEIGHT + 10, lastPeak + variance);

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
        maxReach = lastPeak;
      }
    } else {
      const minReach = Math.max(OCEAN_HEIGHT, lastPeak - variance);
      const maxReachRange = Math.min(OCEAN_HEIGHT + 10, lastPeak + variance);
      maxReach = minReach + Math.floor(Math.random() * (maxReachRange - minReach + 1));
    }

    state.lastWaveMaxReach = maxReach;
    const id = state.waveIdCounter++;

    return {
      id,
      row: startRow,
      startRow,
      maxReach,
      phase: "incoming",
      touched: false,
      peakTimer: 0,
    };
  }
}
