import type { BeachEffectType, BeachEffectInfo } from "../core/types";

export const BEACH_EFFECTS: BeachEffectInfo[] = [
  { type: "quicksand", name: "Quicksand", description: "Stay still 0.2s triggers 80% slower movement for 1.5s!" },
  { type: "spikeWaves", name: "Spike Waves", description: "100% of time in spikes is drained!" },
  { type: "gummyBeach", name: "Gummy Beach", description: "20% slower, no toe tap at all!" },
  { type: "coldWater", name: "Cold Water", description: "Water timer drains 2x faster!" },
  { type: "crazyWaves", name: "Crazy Waves", description: "Wave variance is tripled!" },
  { type: "fishNet", name: "Fish Net", description: "Feet get stuck every 3s for 1s!" },
  { type: "nighttime", name: "Nighttime", description: "Flashlight only lasts 10s!" },
  { type: "roughWaters", name: "Rough Waters", description: "Waves 75% faster, peak 50% shorter!" },
  { type: "heavySand", name: "Heavy Sand", description: "Each tap moves 65% less!" },
  { type: "busyBeach", name: "Busy Beach", description: "People spawn every 1.5 seconds!" },
];

// Beach effect tier scaling parameters
// Level 1-4 uses index 0-3, boss (level 5) uses index 4
export interface BeachEffectTierParams {
  quicksand: { triggerTime: number[]; penaltyPercent: number[]; penaltyDuration: number[] };
  spikeWaves: { drainRate: number[] };
  gummyBeach: { speedReduction: number; toeExtension: number[] }; // toeExtension: % of normal (boss = 0)
  coldWater: { drainMultiplier: number[] };
  crazyWaves: { varianceMultiplier: number[] };
  fishNet: { interval: number[]; stuckDuration: number[] };
  nighttime: { duration: number[]; rows: number[] };
  roughWaters: { speedMultiplier: number[]; peakMultiplier: number[] };
  heavySand: { moveReduction: number[] };
  busyBeach: { spawnInterval: number[] };
}

export const BEACH_TIER_PARAMS: BeachEffectTierParams = {
  quicksand: {
    triggerTime: [700, 800, 500, 400, 200],         // ms still to trigger
    penaltyPercent: [40, 50, 60, 70, 80],            // % slower
    penaltyDuration: [800, 900, 1000, 1200, 1500],  // ms penalty lasts
  },
  spikeWaves: {
    drainRate: [70, 80, 90, 100, 100],  // % drain when in spikes
  },
  gummyBeach: {
    speedReduction: 20,                         // Always 20% slower
    toeExtension: [60, 50, 40, 30, 0],         // % of normal toe tap (boss = blocked)
  },
  coldWater: {
    drainMultiplier: [1.5, 1.6, 1.7, 1.8, 2.0],
  },
  crazyWaves: {
    varianceMultiplier: [1.2, 1.4, 1.6, 2.0, 3.0],
  },
  fishNet: {
    interval: [3500, 3000, 2500, 2500, 3000],    // ms between getting stuck
    stuckDuration: [1000, 1000, 1000, 1000, 1000], // ms stuck
  },
  nighttime: {
    duration: [30000, 25000, 20000, 15000, 10000], // flashlight duration
    rows: [7, 7, 7, 7, 5],                         // visible rows
  },
  roughWaters: {
    speedMultiplier: [1.2, 1.3, 1.4, 1.5, 1.75],  // waves this much faster
    peakMultiplier: [0.9, 0.8, 0.7, 0.6, 0.5],     // peak duration this much shorter
  },
  heavySand: {
    moveReduction: [10, 20, 30, 40, 65],  // % less movement per tap
  },
  busyBeach: {
    spawnInterval: [5000, 4500, 4000, 3500, 1500], // ms between person spawns
  },
};

// Beach colors for UI theming
export const BEACH_COLORS: Record<BeachEffectType, { text: string; bg: string; border: string; borderSolid: string }> = {
  quicksand: { text: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/50", borderSolid: "border-amber-500" },
  spikeWaves: { text: "text-slate-400", bg: "bg-slate-500/20", border: "border-slate-500/50", borderSolid: "border-slate-500" },
  gummyBeach: { text: "text-pink-400", bg: "bg-pink-500/20", border: "border-pink-500/50", borderSolid: "border-pink-500" },
  coldWater: { text: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/50", borderSolid: "border-blue-500" },
  crazyWaves: { text: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/50", borderSolid: "border-yellow-500" },
  fishNet: { text: "text-gray-400", bg: "bg-gray-500/20", border: "border-gray-500/50", borderSolid: "border-gray-500" },
  nighttime: { text: "text-indigo-400", bg: "bg-indigo-500/20", border: "border-indigo-500/50", borderSolid: "border-indigo-500" },
  roughWaters: { text: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/50", borderSolid: "border-red-500" },
  heavySand: { text: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/50", borderSolid: "border-orange-500" },
  busyBeach: { text: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/50", borderSolid: "border-green-500" },
};
