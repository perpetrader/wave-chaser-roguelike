import { Button } from "@/components/ui/button";
import { Skull, Sparkles } from "lucide-react";
import { BEACH_COLORS } from "./beachColors";

// Beach types match BeachEffectType
export type BeachType = "quicksand" | "spikeWaves" | "gummyBeach" | "coldWater" | "crazyWaves" | "fishNet" | "nighttime" | "roughWaters" | "heavySand" | "busyBeach";

export interface BeachInfo {
  type: BeachType;
  name: string;
  effectDescription: string; // Generic one-liner explaining the beach mechanic
  description: string;
  bossDescription: string;
}

export const BEACH_INFO: Record<BeachType, BeachInfo> = {
  quicksand: {
    type: "quicksand",
    name: "Quicksand Beach",
    effectDescription: "Staying still for too long triggers a movement penalty",
    description: "Stay still 0.7s triggers 40% slower movement for 0.8s.",
    bossDescription: "Stay still 0.2s triggers 80% slower movement for 1.5s!",
  },
  spikeWaves: {
    type: "spikeWaves",
    name: "Spike Waves Beach",
    effectDescription: "Spike waves drain your water timer when touched",
    description: "Spikes drain timer at 20% rate.",
    bossDescription: "100% of time in spikes is drained!",
  },
  gummyBeach: {
    type: "gummyBeach",
    name: "Gummy Beach",
    effectDescription: "Sticky sand slows movement and reduces toe tap",
    description: "20% slower movement, toe tap reduced by 40%.",
    bossDescription: "20% slower, no toe tap at all!",
  },
  coldWater: {
    type: "coldWater",
    name: "Cold Water Beach",
    effectDescription: "Freezing water drains your timer faster",
    description: "Water timer drains 1.3x faster.",
    bossDescription: "Water timer drains 2x faster!",
  },
  crazyWaves: {
    type: "crazyWaves",
    name: "Crazy Waves Beach",
    effectDescription: "Wave patterns are more unpredictable",
    description: "Wave variance increased by 50%.",
    bossDescription: "Wave variance is tripled!",
  },
  fishNet: {
    type: "fishNet",
    name: "Fish Net Beach",
    effectDescription: "Nets periodically trap your feet in place",
    description: "Feet get stuck every 5s for 0.3s.",
    bossDescription: "Feet get stuck every 3s for 1s!",
  },
  nighttime: {
    type: "nighttime",
    name: "Nighttime Beach",
    effectDescription: "Limited visibility with a fading flashlight",
    description: "Flashlight lasts 30s, 7 rows visible.",
    bossDescription: "Flashlight only lasts 10s!",
  },
  roughWaters: {
    type: "roughWaters",
    name: "Rough Waters Beach",
    effectDescription: "Waves move faster and stay shorter",
    description: "Waves 20% faster, peak 10% shorter.",
    bossDescription: "Waves 75% faster, peak 50% shorter!",
  },
  heavySand: {
    type: "heavySand",
    name: "Heavy Sand Beach",
    effectDescription: "Reduced movement",
    description: "Each tap moves 10% less.",
    bossDescription: "Each tap moves 65% less!",
  },
  busyBeach: {
    type: "busyBeach",
    name: "Busy Beach",
    effectDescription: "Beach-goers block your path and must be dodged",
    description: "A person spawns every 5 seconds.",
    bossDescription: "People spawn every 1.5 seconds!",
  },
};

interface BeachSelectionScreenProps {
  beachOptions: BeachType[];
  onSelectBeach: (beach: BeachType) => void;
  currentBeachNumber: number; // Which beach in the run (1, 2, 3, etc.)
}

const BeachSelectionScreen = ({
  beachOptions,
  onSelectBeach,
  currentBeachNumber,
}: BeachSelectionScreenProps) => {
  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-lg mx-auto">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-amber-400 mb-2">
          <Sparkles className="w-5 h-5" />
          <span className="text-lg font-display">Beach Bonanza</span>
          <Sparkles className="w-5 h-5" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-display text-purple-400 mb-2">
          Choose Your Beach
        </h2>
        <p className="text-white/70">
          Beach {currentBeachNumber} • Each beach has 5 levels
        </p>
        <p className="text-white/50 text-sm mt-1">
          Level 5 is the Boss Battle with full effects!
        </p>
      </div>

      <div className="w-full space-y-4">
        {beachOptions.map((beachType) => {
          const beach = BEACH_INFO[beachType];
          const colors = BEACH_COLORS[beachType];
          return (
            <button
              key={beachType}
              onClick={() => onSelectBeach(beachType)}
              className={`w-full p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${colors.bg} ${colors.border} hover:shadow-lg`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <Skull className={`w-8 h-8 ${colors.text}`} />
                </div>
                <div className="text-left flex-1">
                  <h3 className={`text-lg font-display ${colors.text}`}>
                    {beach.name}
                  </h3>
                  <p className="text-white/60 text-sm mt-1">
                    {beach.effectDescription}
                  </p>
                  <p className="text-white/80 text-sm mt-1">
                    <span className="text-red-400/80">Boss:</span> {beach.bossDescription}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BeachSelectionScreen;
