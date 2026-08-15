// Pure simulation helpers for the game loop. Everything here must stay
// side-effect free: given the previous state and a time delta, return the
// next state (returning the SAME object reference when nothing changed, so
// React setState updaters skip the re-render).

import type { AbilityState } from "./constants";

// Advance one ability's duration/cooldown by dt milliseconds.
// - Active abilities count down durationRemaining and flip to cooldown on expiry.
// - Inactive abilities count down cooldownRemaining toward ready.
// - Identity-preserving: returns `prev` untouched when idle.
export const tickAbilityState = (prev: AbilityState, dt: number, cooldown: number): AbilityState => {
  if (prev.active && prev.durationRemaining !== undefined) {
    const newDuration = prev.durationRemaining - dt;
    if (newDuration <= 0) {
      return { active: false, cooldownRemaining: cooldown, durationRemaining: 0 };
    }
    return { ...prev, durationRemaining: newDuration };
  }
  if (prev.cooldownRemaining > 0) {
    return { ...prev, cooldownRemaining: Math.max(0, prev.cooldownRemaining - dt) };
  }
  return prev;
};
