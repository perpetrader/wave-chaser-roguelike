// Per-level scaling for beach effects.
//
// Modes with "leveled" beach effects (Beach Bonanza, Slay the Waves) run an
// effect at levels 1-4 in a reduced form and at level 5 at boss strength;
// Standard-mode boss beaches are always boss strength. Each helper takes the
// current beach level and whether the mode uses leveled effects, and returns
// the multiplier to apply. These tables were previously copy-pasted at every
// use site (movement, toe tap, game loop), which let them drift.

const reduced = (beachLevel: number, leveledMode: boolean) => leveledMode && beachLevel < 5;

// Quicksand: 40%/50%/60%/70% slower at levels 1-4, boss = 80% slower
const QUICKSAND_LEVEL_MULTIPLIERS = [0.60, 0.50, 0.40, 0.30];
export const quicksandPenaltyMultiplier = (beachLevel: number, leveledMode: boolean): number =>
  reduced(beachLevel, leveledMode)
    ? (QUICKSAND_LEVEL_MULTIPLIERS[beachLevel - 1] || 0.30)
    : 0.20;

// Heavy Sand: 10%/20%/30%/40% less movement at levels 1-4, boss = 65% less
const HEAVY_SAND_LEVEL_MULTIPLIERS = [0.90, 0.80, 0.70, 0.60];
export const heavySandPenaltyMultiplier = (beachLevel: number, leveledMode: boolean): number =>
  reduced(beachLevel, leveledMode)
    ? (HEAVY_SAND_LEVEL_MULTIPLIERS[beachLevel - 1] || 0.60)
    : 0.35;

// Gummy Beach: toe-tap extension reduced 40%/50%/60%/70% at levels 1-4.
// (At boss strength gummy disables toe tapping entirely — callers gate on
// that before applying this multiplier, so no boss value exists here.)
const GUMMY_TOE_LEVEL_MULTIPLIERS = [0.60, 0.50, 0.40, 0.30];
export const gummyToeExtensionMultiplier = (beachLevel: number): number =>
  GUMMY_TOE_LEVEL_MULTIPLIERS[beachLevel - 1] || 0.30;
