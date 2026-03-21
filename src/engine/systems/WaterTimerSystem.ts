import type { WorldState } from "../core/types";
import { FOOT_TYPE_MODIFIERS } from "../data/footTypes";

/**
 * WaterTimerSystem: Drains the water timer when the player's feet are in water.
 * Handles Cold Water, Spike Waves, Wet Shoes, foot type modifiers.
 * Returns true if the timer hit zero (game over).
 */
export class WaterTimerSystem {
  /**
   * Update the water timer for one frame.
   * @param isTouchingWater Whether feet are in wave water
   * @param isTouchingSpike Whether feet are in spike zone
   * @returns true if timer hit zero
   */
  update(
    state: WorldState,
    dt: number,
    isTouchingWater: boolean,
    isTouchingSpike: boolean
  ): boolean {
    const isInvincible = state.abilityStates.wetsuit.active;
    const hasShield = state.waveSurferShield > 0;

    // Drain timer if touching water/spikes AND not protected
    const shouldDrain = (isTouchingWater || isTouchingSpike) && !isInvincible && !hasShield;

    if (shouldDrain) {
      let drainMultiplier = 1;

      // Cold Water effect
      if (state.currentBeachEffect === "coldWater") {
        const lvl = state.beachEffectLevel;
        const mults = [1.2, 1.3, 1.4, 1.6, 2.0]; // levels 1-4, boss
        const idx = Math.min(lvl - 1, 4);
        drainMultiplier = mults[idx];
      }

      // Spike Waves drain rate
      let spikeMult = 1;
      if (isTouchingSpike) {
        const lvl = state.beachEffectLevel;
        if (state.currentBeachEffect === "spikeWaves" && lvl < 5) {
          const rates = [0.2, 0.3, 0.4, 0.6]; // levels 1-4
          const idx = Math.min(lvl - 1, 3);
          spikeMult = rates[idx];
        }
        // Boss level = 1.0 (100% drain)
      }

      // Wet Shoes permanent upgrade: 10% slower drain per level
      const wetShoesMult = 1 - (state.permanentUpgrades.wetShoes * 0.1);

      // Foot type drain modifier
      const footDrainMult = FOOT_TYPE_MODIFIERS[state.footType].drainMultiplier;

      state.waterTimer -= dt * drainMultiplier * wetShoesMult * spikeMult * footDrainMult;

      if (state.waterTimer <= 0) {
        state.waterTimer = 0;
        return true; // Timer expired
      }
    }

    // Towel Off: recover 20% of time when NOT in water
    if (!isTouchingWater && state.abilityStates.towelOff.active) {
      const maxTimer = state.maxWaterTimer;
      if (state.waterTimer < maxTimer) {
        const recovery = dt * 0.2;
        state.waterTimer = Math.min(maxTimer, state.waterTimer + recovery);
      }
    }

    // Decrement Wave Surfer shield
    if (state.waveSurferShield > 0) {
      state.waveSurferShield = Math.max(0, state.waveSurferShield - dt);
    }

    return false;
  }
}
