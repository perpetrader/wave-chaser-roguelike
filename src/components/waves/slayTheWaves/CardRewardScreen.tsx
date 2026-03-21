// Slay the Waves - Card Reward Screen (Pick 1 of 3 abilities after combat)

import { Button } from "@/components/ui/button";
import { AbilityType } from "../RoguelikeAbilitySelect";
import { SKIP_CARD_GOLD } from "./types";
import { Shirt, Zap, Ghost, Shell, Snail, Magnet, Waves, Wind, Rabbit, Sparkles, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardRewardScreenProps {
  abilities: AbilityType[];
  levelScore: number;
  goldEarned: number;
  currentGold: number;
  onSelectAbility: (ability: AbilityType) => void;
  onSkip: () => void;
  nodeType: "beach" | "elite" | "boss";
}

const ABILITY_INFO: Record<AbilityType, { 
  name: string; 
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  wetsuit: {
    name: "Wet Suit",
    description: "Immunity to water damage (3s limit)",
    icon: <Shirt className="w-10 h-10" />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20 border-yellow-500/50",
  },
  superTap: {
    name: "Super Tap",
    description: "Toe Tap 3x longer",
    icon: <Zap className="w-10 h-10" />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20 border-orange-500/50",
  },
  ghostToe: {
    name: "Ghost Feet",
    description: "Extended reach immune to water",
    icon: <Ghost className="w-10 h-10" />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20 border-purple-500/50",
  },
  crystalBall: {
    name: "Crystal Conch",
    description: "Preview upcoming waves",
    icon: <Shell className="w-10 h-10" />,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20 border-cyan-500/50",
  },
  slowdown: {
    name: "Slowdown",
    description: "Waves 60% slower",
    icon: <Snail className="w-10 h-10" />,
    color: "text-pink-400",
    bgColor: "bg-pink-500/20 border-pink-500/50",
  },
  waveMagnet: {
    name: "Wave Magnet",
    description: "Waves peak closer to feet",
    icon: <Magnet className="w-10 h-10" />,
    color: "text-red-400",
    bgColor: "bg-red-500/20 border-red-500/50",
  },
  waveSurfer: {
    name: "Teleport",
    description: "Teleport to next wave with immunity",
    icon: <Waves className="w-10 h-10" />,
    color: "text-teal-400",
    bgColor: "bg-teal-500/20 border-teal-500/50",
  },
  towelOff: {
    name: "Towel Off",
    description: "+20% dry time recovery",
    icon: <Wind className="w-10 h-10" />,
    color: "text-sky-400",
    bgColor: "bg-sky-500/20 border-sky-500/50",
  },
  doubleDip: {
    name: "Double Dip",
    description: "2x wave credit",
    icon: <span className="w-10 h-10 flex items-center justify-center font-bold text-2xl">2x</span>,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20 border-emerald-500/50",
  },
  jumpAround: {
    name: "Jump Around",
    description: "4x move distance",
    icon: <Rabbit className="w-10 h-10" />,
    color: "text-lime-400",
    bgColor: "bg-lime-500/20 border-lime-500/50",
  },
};

const CardRewardScreen = ({
  abilities,
  levelScore,
  goldEarned,
  currentGold,
  onSelectAbility,
  onSkip,
  nodeType,
}: CardRewardScreenProps) => {
  const nodeTitle = nodeType === "boss" ? "Boss Defeated!" : nodeType === "elite" ? "Elite Conquered!" : "Victory!";
  const rarityLabel = nodeType === "boss" ? "Rare" : nodeType === "elite" ? "Uncommon" : "Common";

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-display text-amber-400 mb-2">
          {nodeTitle}
        </h2>
        
        {/* Score and gold display */}
        <div className="flex justify-center items-center gap-6 mt-3">
          <div className="text-center">
            <p className="text-white/60 text-xs uppercase tracking-wider">Score</p>
            <p className="text-xl font-display text-cyan-300">+{levelScore}</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <p className="text-white/60 text-xs uppercase tracking-wider">Gold</p>
            <p className="text-xl font-display text-yellow-400">+{goldEarned} 💰</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <p className="text-white/60 text-xs uppercase tracking-wider">Total</p>
            <p className="text-xl font-display text-yellow-400">{currentGold} 💰</p>
          </div>
        </div>
      </div>

      {/* Card selection prompt */}
      <div className="flex items-center gap-2 text-white/70">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <span>Choose a new ability ({rarityLabel})</span>
        <Sparkles className="w-5 h-5 text-purple-400" />
      </div>

      {/* Ability cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {abilities.map((ability) => {
          const info = ABILITY_INFO[ability];
          return (
            <button
              key={ability}
              onClick={() => onSelectAbility(ability)}
              className={cn(
                "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                "hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30",
                "hover:border-purple-400 hover:ring-2 hover:ring-purple-500/50",
                info.bgColor,
              )}
            >
              {/* Rarity badge */}
              <div className={cn(
                "absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                nodeType === "boss" && "bg-purple-500 text-white",
                nodeType === "elite" && "bg-orange-500 text-white",
                nodeType === "beach" && "bg-blue-500 text-white",
              )}>
                {rarityLabel}
              </div>

              {/* Icon */}
              <div className={cn("p-3 rounded-full", info.bgColor)}>
                <span className={info.color}>{info.icon}</span>
              </div>

              {/* Name */}
              <h3 className={cn("text-lg font-display", info.color)}>
                {info.name}
              </h3>

              {/* Description */}
              <p className="text-white/70 text-sm text-center">
                {info.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Skip button */}
      <Button
        variant="outline"
        onClick={onSkip}
        className="mt-2 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
      >
        <Coins className="w-4 h-4 mr-2" />
        Skip (+{SKIP_CARD_GOLD} gold)
      </Button>
    </div>
  );
};

export default CardRewardScreen;
