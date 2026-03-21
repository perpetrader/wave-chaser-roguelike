import type { WorldState } from "../core/types";
import {
  OCEAN_HEIGHT,
  TOTAL_HEIGHT,
  BASE_MOVE_STEP,
  JUMP_AROUND_MULTIPLIER,
  OCEAN_WIDTH,
} from "../data/constants";
import { FOOT_TYPE_MODIFIERS } from "../data/footTypes";

/** Gear speeds in rows/sec: Run=2.5, Walk=1.25, Crawl=0.5 */
function getGearSpeed(gear: number): number {
  const absGear = Math.abs(gear);
  switch (absGear) {
    case 3: return 2.5;
    case 2: return 1.25;
    case 1: return 0.5;
    default: return 0;
  }
}

/**
 * PlayerSystem: Handles feet movement for all modes.
 * - Standard mode: discrete step per input event
 * - Momentum mode: continuous movement based on gear (updated per frame)
 */
export class PlayerSystem {
  /**
   * Handle a discrete move-up input (standard/slowerForward mode, or gear shift in momentum).
   */
  moveUp(state: WorldState): void {
    if (state.fishNetStuck) return;

    if (state.movementMode === "momentum") {
      if (state.momentumGear > -3) {
        state.momentumGear -= 1;
      }
      return;
    }

    const step = this.calculateMoveStep(state, "up");
    const newPos = Math.max(state.feetPosition - step, OCEAN_HEIGHT);
    if (!this.isBlockedByPerson(newPos, state)) {
      state.feetPosition = newPos;
    }
  }

  /**
   * Handle a discrete move-down input.
   */
  moveDown(state: WorldState): void {
    if (state.fishNetStuck) return;

    if (state.movementMode === "momentum") {
      if (state.momentumGear < 3) {
        state.momentumGear += 1;
      }
      return;
    }

    const step = this.calculateMoveStep(state, "down");
    const newPos = Math.min(state.feetPosition + step, TOTAL_HEIGHT - 1);
    if (!this.isBlockedByPerson(newPos, state)) {
      state.feetPosition = newPos;
    }
  }

  /**
   * Update momentum-based continuous movement (called per frame).
   */
  updateMomentum(state: WorldState, dt: number): void {
    if (state.movementMode !== "momentum") return;
    if (state.fishNetStuck) return;

    // Cap dt to 50ms to prevent huge jumps after tab backgrounding
    const dtSec = Math.min(dt, 50) / 1000;
    const gear = state.momentumGear;
    const baseSpeed = getGearSpeed(gear);
    const direction = gear < 0 ? -1 : gear > 0 ? 1 : 0;
    let speed = baseSpeed * direction;

    // Apply multipliers
    const fastFeetMult = 1 + (state.permanentUpgrades.fastFeet * 0.1);
    const footTypeMult = FOOT_TYPE_MODIFIERS[state.footType].speedMultiplier;
    speed *= fastFeetMult * footTypeMult;

    let moveThisFrame = speed * dtSec;

    // Jump Around
    if (state.abilityStates.jumpAround.active) {
      moveThisFrame *= JUMP_AROUND_MULTIPLIER;
    }

    // Beach effect penalties
    moveThisFrame = this.applyBeachEffectPenalties(moveThisFrame, state);

    if (Math.abs(moveThisFrame) > 0.0001) {
      const newPos = Math.max(Math.min(state.feetPosition + moveThisFrame, TOTAL_HEIGHT - 1), OCEAN_HEIGHT);
      if (!this.isBlockedByPerson(newPos, state) && newPos !== state.feetPosition) {
        state.feetPosition = newPos;
      }
    }
  }

  // ─── Private ────────────────────────────────────────────────────────────

  private calculateMoveStep(state: WorldState, direction: "up" | "down"): number {
    const fastFeetMult = 1 + (state.permanentUpgrades.fastFeet * 0.1);
    const footTypeMult = FOOT_TYPE_MODIFIERS[state.footType].speedMultiplier;
    let step = BASE_MOVE_STEP * fastFeetMult * footTypeMult;

    // Jump Around multiplier
    if (state.abilityStates.jumpAround.active) {
      step *= JUMP_AROUND_MULTIPLIER;
    }

    // Slower Forward mode: 30% slower toward shore
    if (state.movementMode === "slowerForward" && direction === "up") {
      step *= 0.7;
    }

    // Beach effect penalties
    step = this.applyBeachEffectPenalties(step, state);

    return step;
  }

  private applyBeachEffectPenalties(move: number, state: WorldState): number {
    const effect = state.currentBeachEffect;
    const level = state.beachEffectLevel;

    // Quicksand penalty
    if (effect === "quicksand" && state.quicksandPenaltyTimer > 0) {
      const levelPenalties = [0.60, 0.50, 0.40, 0.30, 0.20]; // levels 1-4, boss
      const idx = Math.min(level - 1, 4);
      move *= levelPenalties[idx];
    }

    // Heavy Sand
    if (effect === "heavySand") {
      const levelPenalties = [0.90, 0.80, 0.70, 0.60, 0.35]; // levels 1-4, boss
      const idx = Math.min(level - 1, 4);
      move *= levelPenalties[idx];
    }

    // Gummy Beach: 20% slower at all levels
    if (effect === "gummyBeach") {
      move *= 0.80;
    }

    return move;
  }

  private isBlockedByPerson(newFeetPos: number, state: WorldState): boolean {
    if (state.currentBeachEffect !== "busyBeach") return false;

    const feetCol1 = OCEAN_WIDTH / 2 - 1; // 9
    const feetCol2 = OCEAN_WIDTH / 2;      // 10
    const feetRowTop = Math.floor(newFeetPos);
    const feetRowBottom = Math.ceil(newFeetPos + 1);

    for (const person of state.beachPeople) {
      const personCol = Math.floor(person.col);
      const inColumn = personCol === feetCol1 || personCol === feetCol2;
      const inRow = person.row >= feetRowTop && person.row <= feetRowBottom;
      if (inColumn && inRow) return true;
    }
    return false;
  }
}
