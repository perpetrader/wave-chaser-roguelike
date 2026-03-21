import type { FootType, FootTypeModifiers } from "../core/types";

export const FOOT_TYPE_MODIFIERS: Record<FootType, FootTypeModifiers> = {
  tourist: { speedMultiplier: 1.0, drainMultiplier: 1.0 },
  beachBum: { speedMultiplier: 0.65, drainMultiplier: 0.6 },
  speedster: { speedMultiplier: 1.4, drainMultiplier: 1.5 },
  toeWarrior: { speedMultiplier: 1.0, drainMultiplier: 1.4 },
};

export const FOOT_TYPE_INFO: Record<FootType, { name: string; description: string }> = {
  tourist: { name: "Tourist", description: "Balanced speed and drain" },
  beachBum: { name: "Beach Bum", description: "35% slower, 40% less drain" },
  speedster: { name: "Speedster", description: "40% faster, 50% more drain" },
  toeWarrior: { name: "Toe Warrior", description: "Front 35% immune, back 65% drains 40% more" },
};
