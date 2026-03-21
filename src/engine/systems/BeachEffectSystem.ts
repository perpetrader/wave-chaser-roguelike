import type { WorldState, BeachPerson } from "../core/types";
import {
  OCEAN_WIDTH,
  OCEAN_HEIGHT,
  TOTAL_HEIGHT,
  FLASHLIGHT_DURATION_BOSS,
  FLASHLIGHT_DURATION_REDUCED,
  FLASHLIGHT_COOLDOWN,
} from "../data/constants";

/**
 * BeachEffectSystem: Per-frame logic for beach effects.
 * Handles quicksand, fish net, nighttime, busy beach, spike wave flash.
 */
export class BeachEffectSystem {
  /**
   * Update all active beach effects for one frame.
   */
  update(state: WorldState, dt: number): void {
    if (state.currentBeachEffect === null) return;

    switch (state.currentBeachEffect) {
      case "quicksand":
        this.updateQuicksand(state, dt);
        break;
      case "fishNet":
        this.updateFishNet(state, dt);
        break;
      case "nighttime":
        this.updateFlashlight(state, dt);
        break;
      case "busyBeach":
        this.updateBusyBeach(state, dt);
        break;
      case "spikeWaves":
        this.updateSpikeFlash(state, dt);
        break;
      // coldWater, heavySand, roughWaters, gummyBeach, crazyWaves:
      // Handled directly in PlayerSystem/WaveSystem/WaterTimerSystem via modifiers
    }
  }

  /**
   * Reset all beach effect substates.
   */
  resetSubstates(state: WorldState): void {
    state.quicksandStillTimer = 0;
    state.quicksandPenaltyTimer = 0;
    state.fishNetStuck = false;
    state.fishNetTimer = 0;
    state.flashlightActive = false;
    state.flashlightDuration = 0;
    state.flashlightCooldown = 0;
    state.beachPeople = [];
    state.beachPeopleSpawnTimer = 0;
    state.spikeFlashTimer = 0;
  }

  // ─── Quicksand ──────────────────────────────────────────────────────────
  // Stay still > 0.2s → movement penalty for 1.5s

  private updateQuicksand(state: WorldState, dt: number): void {
    // Track stillness (we'll check feetPosition changes via a stored last position)
    // For now, penalty timer ticks down
    if (state.quicksandPenaltyTimer > 0) {
      state.quicksandPenaltyTimer -= dt;
      if (state.quicksandPenaltyTimer < 0) state.quicksandPenaltyTimer = 0;
    }

    // Note: The still detection is handled by checking if feetPosition changed
    // between frames. GameEngine tracks this.
  }

  /**
   * Called by GameEngine when player hasn't moved for a frame.
   */
  onPlayerStill(state: WorldState, dt: number): void {
    if (state.currentBeachEffect !== "quicksand") return;

    state.quicksandStillTimer += dt;
    if (state.quicksandStillTimer >= 200) {
      // Trigger penalty: 1.5s of slowed movement
      state.quicksandPenaltyTimer = 1500;
      state.quicksandStillTimer = 0;
    }
  }

  /**
   * Called by GameEngine when player moves.
   */
  onPlayerMoved(state: WorldState): void {
    if (state.currentBeachEffect !== "quicksand") return;
    state.quicksandStillTimer = 0;
  }

  // ─── Fish Net ───────────────────────────────────────────────────────────
  // Periodically freeze player movement

  private updateFishNet(state: WorldState, dt: number): void {
    const lvl = state.beachEffectLevel;
    const isBoss = lvl >= 5;

    let stuckDuration: number;
    let stuckInterval: number;

    if (isBoss) {
      stuckDuration = 1000;
      stuckInterval = 3000;
    } else {
      const durations = [300, 400, 500, 600];
      const intervals = [5000, 4500, 4000, 3500];
      const idx = Math.min(lvl - 1, 3);
      stuckDuration = durations[idx];
      stuckInterval = intervals[idx];
    }

    state.fishNetTimer += dt;

    if (state.fishNetStuck) {
      if (state.fishNetTimer >= stuckDuration) {
        state.fishNetStuck = false;
        state.fishNetTimer = 0;
      }
    } else {
      if (state.fishNetTimer >= stuckInterval) {
        state.fishNetStuck = true;
        state.fishNetTimer = 0;
      }
    }
  }

  // ─── Nighttime Flashlight ──────────────────────────────────────────────

  private updateFlashlight(state: WorldState, dt: number): void {
    if (state.flashlightActive) {
      state.flashlightDuration -= dt;
      if (state.flashlightDuration <= 0) {
        state.flashlightActive = false;
        state.flashlightDuration = 0;
        state.flashlightCooldown = FLASHLIGHT_COOLDOWN;
      }
    } else if (state.flashlightCooldown > 0) {
      state.flashlightCooldown -= dt;
      if (state.flashlightCooldown < 0) state.flashlightCooldown = 0;
    }
  }

  /**
   * Activate flashlight (called from input).
   */
  activateFlashlight(state: WorldState): void {
    if (state.currentBeachEffect !== "nighttime") return;
    if (state.flashlightActive || state.flashlightCooldown > 0) return;

    const isBoss = state.beachEffectLevel >= 5;
    state.flashlightActive = true;
    state.flashlightDuration = isBoss ? FLASHLIGHT_DURATION_BOSS : FLASHLIGHT_DURATION_REDUCED;
  }

  // ─── Busy Beach ─────────────────────────────────────────────────────────
  // Spawn people that block movement

  private updateBusyBeach(state: WorldState, dt: number): void {
    const lvl = state.beachEffectLevel;
    const isBoss = lvl >= 5;

    // Spawn interval
    const spawnIntervals = [4000, 3000, 2500, 2000, 1500]; // levels 1-4, boss
    const idx = Math.min(lvl - 1, 4);
    const spawnInterval = spawnIntervals[idx];

    state.beachPeopleSpawnTimer += dt;
    if (state.beachPeopleSpawnTimer >= spawnInterval) {
      state.beachPeopleSpawnTimer = 0;
      this.spawnBeachPerson(state);
    }

    // Move existing people
    const updatedPeople: BeachPerson[] = [];
    for (const person of state.beachPeople) {
      const newCol = person.direction === "right"
        ? person.col + person.speed * (dt / 1000)
        : person.col - person.speed * (dt / 1000);

      // Remove if off-screen
      if (newCol < -1 || newCol > OCEAN_WIDTH + 1) continue;

      updatedPeople.push({ ...person, col: newCol });
    }
    state.beachPeople = updatedPeople;
  }

  private spawnBeachPerson(state: WorldState): void {
    const direction = Math.random() < 0.5 ? "left" : "right";
    const col = direction === "right" ? -1 : OCEAN_WIDTH + 1;
    const row = OCEAN_HEIGHT + 1 + Math.floor(Math.random() * 10); // Beach rows
    const speed = 2 + Math.random() * 3; // 2-5 cols/sec

    state.beachPeople.push({ row, col, direction, speed });
  }

  // ─── Spike Wave Flash ──────────────────────────────────────────────────

  private updateSpikeFlash(state: WorldState, dt: number): void {
    // Visual flash timer for spike indicators
    state.spikeFlashTimer += dt;
    if (state.spikeFlashTimer > 1000) {
      state.spikeFlashTimer -= 1000;
    }
  }
}
