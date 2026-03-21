/**
 * All game colors as CSS HSL strings.
 * Used by the Canvas renderer layers.
 */
export const COLORS = {
  // Ocean
  ocean: "hsl(200, 70%, 35%)",
  oceanSlowdown: "hsl(280, 50%, 35%)", // Purple tint when slowdown active

  // Wave crests
  crest: "hsl(180, 90%, 85%)",
  crestTouched: "hsl(160, 70%, 50%)",      // Sea green when touched
  crestMagnet: "hsl(0, 70%, 60%)",          // Red when magnet-affected

  // Beach / Sand
  sand: "hsl(42, 50%, 75%)",
  sandDark: "hsl(42, 40%, 55%)",            // Crystal ball indicator

  // Player (feet)
  feet: "hsl(25, 60%, 65%)",
  feetOutline: "hsl(25, 50%, 45%)",
  feetTouching: "hsl(180, 70%, 60%)",       // Cyan when touching wave
  feetMagnetized: "hsl(0, 70%, 60%)",       // Red when magnetized
  feetJumpAround: "hsl(120, 70%, 50%)",     // Lime when jumping
  feetSuperTap: "hsl(40, 100%, 50%)",       // Yellow/orange when super tap
  feetSurfer: "hsl(170, 70%, 50%)",         // Teal when surfer active
  feetStuck: "hsl(30, 50%, 40%)",           // Brown when stuck (fish net / quicksand)
  feetGhostToe: "hsl(200, 60%, 70%)",       // Ghost toe extension color

  // Effects
  spikeFlash: "hsl(0, 0%, 75%)",            // Silver spike indicator
  nightOverlay: "rgba(0, 0, 20, 0.95)",     // Nighttime darkness
  flashlightGlow: "rgba(255, 255, 200, 0.1)", // Flashlight cone

  // Beach people (Busy Beach)
  beachPerson: "hsl(30, 50%, 60%)",

  // Water coverage (between shore and wave crest)
  water: "hsl(200, 70%, 45%)",
  waterDeep: "hsl(200, 70%, 30%)",

  // UI
  timerBar: "hsl(180, 70%, 50%)",
  timerBarLow: "hsl(0, 70%, 50%)",
} satisfies Record<string, string>;
