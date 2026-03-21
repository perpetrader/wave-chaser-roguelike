import type { WorldState } from "../core/types";
import {
  OCEAN_HEIGHT,
  SUPER_TAP_MULTIPLIER,
  GHOST_TOE_EXTENSION,
  BASE_TOE_EXTENSION,
} from "../data/constants";

export interface CollisionResult {
  newTouches: number;
  isTouchingWater: boolean;
  isTouchingSpike: boolean;
}

/**
 * CollisionSystem: Detects overlap between player feet and waves.
 * Handles toe tap extension, ghost toe, super tap, gummy beach restrictions.
 */
export class CollisionSystem {
  /**
   * Run collision detection for one frame.
   * Marks waves as touched, returns touch count and contact states.
   */
  update(state: WorldState): CollisionResult {
    // ─── Calculate toe extension ──────────────────────────────────────────
    const tapDancerMult = 1 + (state.permanentUpgrades.tapDancer * 0.15);
    let baseToeExt = state.isTapping ? BASE_TOE_EXTENSION * tapDancerMult : 0;

    // Gummy Beach restrictions
    if (state.currentBeachEffect === "gummyBeach") {
      const isBoss = state.beachEffectLevel >= 5;
      if (isBoss) {
        baseToeExt = 0; // Boss: no toe tap
      } else {
        const levelMults = [0.60, 0.50, 0.40, 0.30];
        const idx = Math.min(state.beachEffectLevel - 1, 3);
        baseToeExt *= levelMults[idx];
      }
    }

    // Super Tap multiplier
    const toeExtension = state.abilityStates.superTap.active
      ? baseToeExt * SUPER_TAP_MULTIPLIER
      : baseToeExt;

    const baseToeRow = state.feetPosition - toeExtension;

    // Ghost Toe extends detection range (doesn't affect water timer)
    const effectiveToeRow = state.abilityStates.ghostToe.active
      ? baseToeRow - GHOST_TOE_EXTENSION
      : baseToeRow;

    const heelRow = baseToeRow + 2; // Feet are 2 rows tall

    // ─── Check wave touches ───────────────────────────────────────────────
    let newTouches = 0;

    for (const wave of state.waves) {
      if (wave.touched) continue;

      // Wave area: [OCEAN_HEIGHT, wave.row + 1)
      // Foot area: [effectiveToeRow, heelRow)
      if (effectiveToeRow < wave.row + 1 && heelRow > OCEAN_HEIGHT) {
        wave.touched = true;

        // Double Dip: waves count as 2
        if (state.abilityStates.doubleDip.active) {
          newTouches += 2;
        } else {
          newTouches += 1;
        }
      }
    }

    // ─── Water contact (for timer drain) ──────────────────────────────────
    // Uses real toe row (no ghost toe) for water damage
    const realToeRow = state.feetPosition - (state.isTapping ? BASE_TOE_EXTENSION * tapDancerMult : 0);

    // Toe Warrior: front 35% immune
    const vulnerableToeRow = state.footType === "toeWarrior"
      ? realToeRow + 0.7
      : realToeRow;

    const isTouchingWater = state.waves.some(
      (wave) => vulnerableToeRow < wave.row + 1 && heelRow > OCEAN_HEIGHT
    );

    // ─── Spike detection ──────────────────────────────────────────────────
    let isTouchingSpike = false;
    if (state.currentBeachEffect === "spikeWaves") {
      for (const wave of state.waves) {
        const spikeRow = wave.row + 1;
        // Spike spans [spikeRow, spikeRow + 0.5)
        if (realToeRow < spikeRow + 0.5 && heelRow > spikeRow) {
          isTouchingSpike = true;
          break;
        }
      }
    }

    return { newTouches, isTouchingWater, isTouchingSpike };
  }
}
