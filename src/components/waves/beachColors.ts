import { BeachType } from "./BeachSelectionScreen";

// Centralized beach color definitions used across all Wave Chaser components
export const BEACH_COLORS: Record<BeachType, {
  text: string;
  bg: string;
  border: string;
  borderSolid: string; // For solid borders without opacity
}> = {
  quicksand: {
    text: "text-amber-400",
    bg: "bg-amber-500/20",
    border: "border-amber-500/50",
    borderSolid: "border-amber-500",
  },
  spikeWaves: {
    text: "text-slate-300",
    bg: "bg-slate-500/20",
    border: "border-slate-400/50",
    borderSolid: "border-slate-400",
  },
  gummyBeach: {
    text: "text-pink-400",
    bg: "bg-pink-500/20",
    border: "border-pink-500/50",
    borderSolid: "border-pink-500",
  },
  coldWater: {
    text: "text-blue-600",
    bg: "bg-blue-800/20",
    border: "border-blue-700/50",
    borderSolid: "border-blue-700",
  },
  crazyWaves: {
    text: "text-yellow-400",
    bg: "bg-yellow-500/20",
    border: "border-yellow-500/50",
    borderSolid: "border-yellow-500",
  },
  fishNet: {
    text: "text-gray-400",
    bg: "bg-gray-600/20",
    border: "border-gray-500/50",
    borderSolid: "border-gray-500",
  },
  nighttime: {
    text: "text-indigo-400",
    bg: "bg-indigo-500/20",
    border: "border-indigo-500/50",
    borderSolid: "border-indigo-500",
  },
  roughWaters: {
    text: "text-red-400",
    bg: "bg-red-500/20",
    border: "border-red-500/50",
    borderSolid: "border-red-500",
  },
  heavySand: {
    text: "text-orange-400",
    bg: "bg-orange-500/20",
    border: "border-orange-500/50",
    borderSolid: "border-orange-500",
  },
  busyBeach: {
    text: "text-green-400",
    bg: "bg-green-500/20",
    border: "border-green-500/50",
    borderSolid: "border-green-500",
  },
};
