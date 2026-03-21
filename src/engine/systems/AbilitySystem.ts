import type { WorldState, AbilityType, AbilityState } from "../core/types";
import {
  STANDARD_ABILITY_COOLDOWN,
  BOSS_RUN_ABILITY_COOLDOWN,
  ROGUELIKE_BASE_DURATIONS,
  UPGRADE_INCREMENTS_MS,
  ROGUELIKE_BASE_WETSUIT_WATER_LIMIT,
  WETSUIT_WATER_LIMIT_INCREMENT,
  SUPER_TAP_MULTIPLIER,
} from "../data/constants";

/**
 * AbilitySystem: Manages activation, cooldowns, duration timers,
 * and deactivation for all 10 abilities.
 */
export class AbilitySystem {
  /**
   * Tick all active abilities and cooldowns.
   */
  update(state: WorldState, dt: number): void {
    for (const ability of state.selectedAbilities) {
      const s = state.abilityStates[ability];
      if (!s) continue;

      // Tick active duration
      if (s.active && s.durationRemaining > 0) {
        s.durationRemaining -= dt;
        if (s.durationRemaining <= 0) {
          this.deactivate(state, ability);
        }
      }

      // Tick cooldown
      if (!s.active && s.cooldownRemaining > 0) {
        s.cooldownRemaining -= dt;
        if (s.cooldownRemaining < 0) s.cooldownRemaining = 0;
      }
    }

    // Wetsuit water exposure tracking
    const wetsuitState = state.abilityStates.wetsuit;
    if (wetsuitState.active && wetsuitState.waterLimit !== undefined) {
      // Water exposure is tracked by WaterTimerSystem — check if exceeded
      if (
        wetsuitState.waterExposure !== undefined &&
        wetsuitState.waterExposure >= wetsuitState.waterLimit
      ) {
        this.deactivate(state, "wetsuit");
      }
    }
  }

  /**
   * Attempt to activate an ability by slot index in selectedAbilities.
   */
  activateBySlot(state: WorldState, slot: number): void {
    if (slot < 0 || slot >= state.selectedAbilities.length) return;
    const type = state.selectedAbilities[slot];
    this.activate(state, type);
  }

  /**
   * Attempt to activate a specific ability.
   */
  activate(state: WorldState, type: AbilityType): void {
    const s = state.abilityStates[type];
    if (!s) return;

    // Can't activate if already active or on cooldown
    if (s.active || s.cooldownRemaining > 0) return;

    // Must be unlocked
    const unlocked = state.unlockedAbilities.find((a) => a.type === type);
    if (!unlocked) return;

    // Gummy Beach: can't use superTap on boss level
    if (type === "superTap" && state.currentBeachEffect === "gummyBeach") {
      if (state.beachEffectLevel >= 5) return;
    }

    const duration = this.getDuration(state, type);
    const cooldown = this.getCooldown(state);

    s.active = true;
    s.durationRemaining = duration;
    s.cooldownRemaining = 0;

    // Wetsuit special: set water tracking
    if (type === "wetsuit") {
      s.waterExposure = 0;
      s.waterLimit = this.getWetsuitWaterLimit(state);
    }
  }

  // ─── Duration / Cooldown Calculation ────────────────────────────────────

  getDuration(state: WorldState, type: AbilityType): number {
    const base = ROGUELIKE_BASE_DURATIONS[type] ?? 5000;
    const increment = UPGRADE_INCREMENTS_MS[type] ?? 500;

    // Boss Quick/Hell Run: fixed at upgrade level 2
    if (state.runType === "bossQuickRun" || state.runType === "bossHellRun") {
      return base + increment * 2;
    }

    const unlocked = state.unlockedAbilities.find((a) => a.type === type);
    const upgradeCount = unlocked?.upgradeCount ?? 0;
    return base + increment * upgradeCount;
  }

  getCooldown(state: WorldState): number {
    if (state.runType === "bossQuickRun" || state.runType === "bossHellRun") {
      return BOSS_RUN_ABILITY_COOLDOWN;
    }
    return STANDARD_ABILITY_COOLDOWN;
  }

  getWetsuitWaterLimit(state: WorldState): number {
    const unlocked = state.unlockedAbilities.find((a) => a.type === "wetsuit");
    const upgradeCount = unlocked?.upgradeCount ?? 0;
    return ROGUELIKE_BASE_WETSUIT_WATER_LIMIT + WETSUIT_WATER_LIMIT_INCREMENT * upgradeCount;
  }

  // ─── Deactivation ──────────────────────────────────────────────────────

  private deactivate(state: WorldState, type: AbilityType): void {
    const s = state.abilityStates[type];
    s.active = false;
    s.durationRemaining = 0;
    s.cooldownRemaining = this.getCooldown(state);

    // Reset type-specific state
    if (type === "wetsuit") {
      s.waterExposure = 0;
      s.waterLimit = 0;
    }
  }
}
