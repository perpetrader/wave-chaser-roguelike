/**
 * All game colors as CSS HSL/HSLA strings.
 * Used by the Canvas renderer layers.
 */
export const COLORS = {
  // Ocean
  ocean: "hsl(200, 70%, 35%)",
  oceanDeep: "hsl(200, 70%, 25%)",
  oceanLight: "hsl(200, 60%, 45%)",
  oceanSlowdown: "hsl(280, 50%, 40%)",

  // Beach / Sand
  sand: "hsl(42, 50%, 75%)",
  sandDark: "hsl(42, 40%, 65%)",
  sandDarker: "hsl(42, 30%, 55%)",
  sandCrystalBall: "hsl(42, 30%, 45%)",

  // Wave Crests
  crest: "hsl(180, 90%, 85%)",
  crestTouched: "hsl(160, 70%, 50%)",
  crestMagnet: "hsl(0, 70%, 60%)",

  // Water coverage
  water: "hsl(200, 70%, 45%)",
  waterShallow: "hsla(190, 60%, 55%, 0.7)",
  waterDeep: "hsl(200, 70%, 30%)",

  // Spike Waves
  spikeNormal: "hsl(0, 0%, 70%)",
  spikeFlash: "hsl(0, 0%, 85%)",

  // Player Feet
  feet: "hsl(25, 60%, 65%)",
  feetOutline: "hsl(25, 50%, 45%)",
  feetTouching: "hsl(180, 70%, 60%)",
  feetStuck: "hsl(30, 60%, 40%)",
  feetMagnetized: "hsl(0, 70%, 60%)",
  feetJumpAround: "hsl(84, 80%, 55%)",
  feetJumpAroundOutline: "hsl(84, 60%, 35%)",
  feetSuperTap: "hsl(50, 100%, 60%)",
  feetSuperTapOutline: "hsl(45, 100%, 40%)",
  feetSurfer: "hsl(174, 70%, 50%)",
  feetSurferAlt: "hsl(280, 60%, 35%)",

  // Ghost Toe
  ghostToeFill: "hsla(270, 70%, 60%, 0.3)",
  ghostToeStroke: "hsl(270, 70%, 60%)",

  // Toe Warrior
  toeWarriorLine: "hsla(180, 70%, 60%, 0.8)",

  // Nighttime
  nightDark: "hsl(220, 15%, 8%)",
  flashlightGlow: "hsla(180, 80%, 50%, 0.15)",

  // Beach people
  beachPerson: "hsl(30, 50%, 60%)",
  beachPersonOutline: "hsl(0, 0%, 30%)",

  // Fish net
  fishNetOverlay: "hsla(30, 60%, 30%, 0.3)",

  // UI
  timerBar: "hsl(180, 70%, 50%)",
  timerBarLow: "hsl(0, 70%, 50%)",
} satisfies Record<string, string | readonly string[]>;
