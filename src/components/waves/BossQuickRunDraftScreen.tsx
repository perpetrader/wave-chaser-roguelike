import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Shirt, Zap, Ghost, Shell, Snail, Magnet, Waves, Wind, Rabbit, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AbilityType, ALL_ABILITIES } from "./RoguelikeAbilitySelect";

// Boss Quick Run ability pool excludes doubleDip
const BOSS_QUICK_RUN_ABILITIES = ALL_ABILITIES.filter(a => a !== "doubleDip") as AbilityType[];

interface BossQuickRunDraftScreenProps {
  onComplete: (selectedAbilities: AbilityType[]) => void;
  isBossHellRun?: boolean;
}

// Base durations in ms (must match ROGUELIKE_BASE_DURATIONS in WavesGame.tsx)
const BASE_DURATIONS_MS: Record<AbilityType, number> = {
  wetsuit: 8000,
  slowdown: 12000,
  superTap: 7000,
  ghostToe: 6000,
  crystalBall: 5000,
  waveMagnet: 5000,
  waveSurfer: 4000,
  towelOff: 7000,
  doubleDip: 5000,
  jumpAround: 6000,
};

// Upgrade increments in ms (must match UPGRADE_INCREMENTS_MS in WavesGame.tsx)
const UPGRADE_INCREMENTS_MS: Record<AbilityType, number> = {
  wetsuit: 800,
  slowdown: 1200,
  superTap: 700,
  ghostToe: 600,
  crystalBall: 500,
  waveMagnet: 500,
  waveSurfer: 400,
  towelOff: 700,
  doubleDip: 500,
  jumpAround: 600,
};

// Get duration at level 3 (2 upgrades) for all abilities in Boss Quick Run
const getAbilityDuration = (ability: AbilityType): string => {
  const upgradeCount = 2; // Level 3 power
  const durationMs = BASE_DURATIONS_MS[ability] + (UPGRADE_INCREMENTS_MS[ability] * upgradeCount);
  return `${(durationMs / 1000).toFixed(1)}s`;
};

const ABILITY_INFO: Record<AbilityType, { 
  name: string; 
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  wetsuit: {
    name: "Wet Suit",
    description: "Immunity to water damage (6s limit)",
    icon: <Shirt className="w-8 h-8" />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
  },
  superTap: {
    name: "Super Tap",
    description: "Toe tap 3x longer distance",
    icon: <Zap className="w-8 h-8" />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
  },
  ghostToe: {
    name: "Ghost Feet",
    description: "Extended reach immune to water",
    icon: <Ghost className="w-8 h-8" />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
  crystalBall: {
    name: "Crystal Conch",
    description: "Preview upcoming wave positions",
    icon: <Shell className="w-8 h-8" />,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
  },
  slowdown: {
    name: "Slowdown",
    description: "Waves move 60% slower",
    icon: <Snail className="w-8 h-8" />,
    color: "text-pink-400",
    bgColor: "bg-pink-500/20",
  },
  waveMagnet: {
    name: "Wave Magnet",
    description: "Waves peak closer to your feet",
    icon: <Magnet className="w-8 h-8" />,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
  waveSurfer: {
    name: "Teleport",
    description: "Teleport to next wave with immunity",
    icon: <Waves className="w-8 h-8" />,
    color: "text-teal-400",
    bgColor: "bg-teal-500/20",
  },
  towelOff: {
    name: "Towel Off",
    description: "+20% dry time recovery",
    icon: <Wind className="w-8 h-8" />,
    color: "text-sky-400",
    bgColor: "bg-sky-500/20",
  },
  doubleDip: {
    name: "Double Dip",
    description: "Each wave touch counts as 2",
    icon: <span className="w-8 h-8 flex items-center justify-center font-bold text-xl">2x</span>,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  jumpAround: {
    name: "Jump Around",
    description: "4x move distance with immunity",
    icon: <Rabbit className="w-8 h-8" />,
    color: "text-lime-400",
    bgColor: "bg-lime-500/20",
  },
};

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const BossQuickRunDraftScreen = ({ onComplete, isBossHellRun = false }: BossQuickRunDraftScreenProps) => {
  const [selectedAbilities, setSelectedAbilities] = useState<AbilityType[]>([]);
  const [round, setRound] = useState(1); // 1, 2, or 3
  
  // Generate all 6 abilities for the 3 rounds at the start (memoized)
  // Uses BOSS_QUICK_RUN_ABILITIES which excludes doubleDip
  // Shows 2 options per round instead of 3
  const draftPool = useMemo(() => {
    const shuffled = shuffleArray([...BOSS_QUICK_RUN_ABILITIES]);
    return {
      round1: shuffled.slice(0, 2),
      round2: shuffled.slice(2, 4),
      round3: shuffled.slice(4, 6),
    };
  }, []);
  
  const currentOptions = round === 1 
    ? draftPool.round1 
    : round === 2 
      ? draftPool.round2 
      : draftPool.round3;
  
  const handleSelect = (ability: AbilityType) => {
    const newSelected = [...selectedAbilities, ability];
    setSelectedAbilities(newSelected);
    
    if (round < 3) {
      setRound(round + 1);
    } else {
      // All 3 abilities selected, proceed to game
      onComplete(newSelected);
    }
  };
  
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 p-4 bg-gradient-to-b from-slate-900 via-purple-900/30 to-slate-900">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-amber-400 mb-2">
          <Sparkles className="w-6 h-6" />
          <span className="text-2xl font-display">{isBossHellRun ? "Boss Hell Run" : "Boss Quick Run"}</span>
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-display text-white">
          Draft Your Abilities
        </h2>
      </div>
      
      {/* Progress indicator */}
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((r) => (
          <div
            key={r}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
              r < round 
                ? "bg-green-500 text-white" 
                : r === round 
                  ? "bg-purple-500 text-white ring-2 ring-purple-300 ring-offset-2 ring-offset-slate-900" 
                  : "bg-slate-700 text-slate-400"
            )}
          >
            {r < round ? <Check className="w-5 h-5" /> : r}
          </div>
        ))}
      </div>
      
      {/* Selected abilities so far */}
      {selectedAbilities.length > 0 && (
        <div className="flex gap-2">
          {selectedAbilities.map((ability) => {
            const info = ABILITY_INFO[ability];
            return (
              <div
                key={ability}
                className={cn(
                  "p-2 rounded-lg border border-green-500/50",
                  info.bgColor
                )}
              >
                <span className={info.color}>{info.icon}</span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Current options */}
      <div className="w-full max-w-md space-y-3">
        <p className="text-center text-white/60 text-sm">
          Choose your {round === 1 ? "1st" : round === 2 ? "2nd" : "3rd"} ability:
        </p>
        {currentOptions.map((ability) => {
          const info = ABILITY_INFO[ability];
          return (
            <Button
              key={ability}
              onClick={() => handleSelect(ability)}
              variant="outline"
              className={cn(
                "w-full h-auto py-4 px-4 flex items-center gap-4",
                "bg-slate-900/70 border-slate-600",
                "hover:bg-slate-900/70 hover:border-purple-500 hover:ring-2 hover:ring-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]",
                "transition-all"
              )}
            >
              <div className={cn("p-3 rounded-lg shrink-0", info.bgColor)}>
                <span className={info.color}>{info.icon}</span>
              </div>
              <div className="text-left flex-1">
                <p className={cn("font-semibold text-lg", info.color)}>
                  {info.name} <span className="text-white/60 font-normal">({getAbilityDuration(ability)})</span>
                </p>
                <p className="text-sm text-white/70">{info.description}</p>
                <p className="text-xs text-amber-400 mt-1">20s cooldown</p>
              </div>
            </Button>
          );
        })}
      </div>
      
    </div>
  );
};

export default BossQuickRunDraftScreen;
