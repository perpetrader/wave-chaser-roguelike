// Slay the Waves - Event Screen

import { Button } from "@/components/ui/button";
import { GameEvent, EventOption, EventEffect } from "./types";
import { HelpCircle, Coins, Heart, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventScreenProps {
  event: GameEvent;
  gold: number;
  onSelectOption: (option: EventOption) => void;
}

const getEffectDescription = (effect: EventEffect): string => {
  switch (effect.type) {
    case "gainGold":
      return `Gain ${effect.amount} gold`;
    case "loseGold":
      return `Lose ${effect.amount} gold`;
    case "gainAbility":
      return "Gain a random ability";
    case "upgradeRandomAbility":
      return "Upgrade a random ability";
    case "healWaterTime":
      return `+${effect.amount / 1000}s max water time`;
    case "damageWaterTime":
      return `-${effect.amount / 1000}s max water time`;
    case "gainPermanentUpgrade":
      return "Gain a permanent upgrade";
    case "nothing":
      return "Nothing happens";
    default:
      return "";
  }
};

const getEffectIcon = (effect: EventEffect): React.ReactNode => {
  switch (effect.type) {
    case "gainGold":
    case "loseGold":
      return <Coins className="w-4 h-4" />;
    case "healWaterTime":
    case "damageWaterTime":
      return <Heart className="w-4 h-4" />;
    case "gainAbility":
    case "upgradeRandomAbility":
    case "gainPermanentUpgrade":
      return <Sparkles className="w-4 h-4" />;
    default:
      return null;
  }
};

const isPositiveEffect = (effect: EventEffect): boolean => {
  return ["gainGold", "gainAbility", "upgradeRandomAbility", "healWaterTime", "gainPermanentUpgrade"].includes(effect.type);
};

const EventScreen = ({ event, gold, onSelectOption }: EventScreenProps) => {
  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-purple-400 mb-4">
          <HelpCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-display text-purple-400 mb-2">
          {event.title}
        </h2>
      </div>

      {/* Event description */}
      <div className="bg-slate-900/70 border border-purple-500/30 rounded-lg p-4 w-full">
        <p className="text-white/80 text-center leading-relaxed">
          {event.description}
        </p>
      </div>

      {/* Gold display */}
      <div className="text-yellow-400 font-bold">
        💰 {gold} Gold
      </div>

      {/* Options */}
      <div className="w-full space-y-3">
        {event.options.map((option, index) => {
          const canAfford = !option.costGold || gold >= option.costGold;
          const isPositive = isPositiveEffect(option.effect);
          
          return (
            <button
              key={index}
              onClick={() => canAfford && onSelectOption(option)}
              disabled={!canAfford}
              className={cn(
                "w-full flex flex-col gap-2 p-4 rounded-lg border-2 transition-all text-left",
                canAfford
                  ? "hover:scale-[1.02] hover:shadow-lg"
                  : "opacity-50 cursor-not-allowed",
                isPositive
                  ? "bg-green-500/10 border-green-500/30 hover:border-green-400"
                  : option.effect.type === "nothing"
                    ? "bg-slate-700/30 border-slate-500/30 hover:border-slate-400"
                    : "bg-red-500/10 border-red-500/30 hover:border-red-400",
              )}
            >
              {/* Option text */}
              <span className="text-white font-medium">{option.text}</span>
              
              {/* Costs and effects */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {option.costGold && (
                  <span className={cn(
                    "flex items-center gap-1",
                    canAfford ? "text-yellow-400" : "text-red-400"
                  )}>
                    <Coins className="w-4 h-4" />
                    -{option.costGold}
                  </span>
                )}
                {option.costHealth && (
                  <span className="flex items-center gap-1 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    -{option.costHealth / 1000}s water
                  </span>
                )}
                <span className={cn(
                  "flex items-center gap-1",
                  isPositive ? "text-green-400" : "text-white/50"
                )}>
                  {getEffectIcon(option.effect)}
                  {getEffectDescription(option.effect)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EventScreen;
