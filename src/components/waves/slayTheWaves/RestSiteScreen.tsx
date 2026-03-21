// Slay the Waves - Rest Site Screen

import { Button } from "@/components/ui/button";
import { Coffee, Timer, TrendingUp, ArrowRight } from "lucide-react";
import { UnlockedAbility, AbilityType } from "../RoguelikeAbilitySelect";
import { REST_WATER_TIME_HEAL } from "./types";
import { cn } from "@/lib/utils";

interface RestSiteScreenProps {
  currentWaterTime: number; // In ms
  unlockedAbilities: UnlockedAbility[];
  onRestoreWaterTime: () => void;
  onUpgradeAbility: (ability: AbilityType) => void;
  onLeave: () => void;
  hasRested: boolean;
}

const ABILITY_NAMES: Record<AbilityType, string> = {
  wetsuit: "Wet Suit",
  superTap: "Super Tap",
  ghostToe: "Ghost Feet",
  crystalBall: "Crystal Conch",
  slowdown: "Slowdown",
  waveMagnet: "Wave Magnet",
  waveSurfer: "Teleport",
  towelOff: "Towel Off",
  doubleDip: "Double Dip",
  jumpAround: "Jump Around",
};

const RestSiteScreen = ({
  currentWaterTime,
  unlockedAbilities,
  onRestoreWaterTime,
  onUpgradeAbility,
  onLeave,
  hasRested,
}: RestSiteScreenProps) => {
  // Get abilities that can be upgraded
  const upgradableAbilities = unlockedAbilities.filter(a => a.upgradeCount < 10);

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
          <Coffee className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-display text-green-400 mb-2">Rest Site</h2>
        <p className="text-white/70">
          Take a moment to recover. Choose one:
        </p>
      </div>

      {/* Current water time */}
      <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 w-full text-center">
        <p className="text-white/60 text-sm">Current Max Water Time</p>
        <p className="text-2xl font-display text-blue-400">
          {(currentWaterTime / 1000).toFixed(1)}s
        </p>
      </div>

      {hasRested ? (
        <div className="text-center text-white/60">
          <p>You've already rested here.</p>
        </div>
      ) : (
        <div className="w-full space-y-4">
          {/* Restore water time option */}
          <button
            onClick={onRestoreWaterTime}
            className="w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30 hover:border-blue-400 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3">
              <Timer className="w-8 h-8 text-blue-400" />
              <div className="text-left">
                <h3 className="text-lg font-display text-blue-400">Rest</h3>
                <p className="text-white/70 text-sm">
                  +{REST_WATER_TIME_HEAL / 1000}s to max water time
                </p>
              </div>
            </div>
          </button>

          {/* Upgrade ability option */}
          {upgradableAbilities.length > 0 && (
            <div className="space-y-2">
              <p className="text-white/60 text-sm text-center">— OR —</p>
              <div className="text-center text-white/70 mb-2">
                <TrendingUp className="w-5 h-5 inline mr-2 text-purple-400" />
                <span>Smith an ability (+1 upgrade level)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {upgradableAbilities.map(ability => (
                  <button
                    key={ability.type}
                    onClick={() => onUpgradeAbility(ability.type)}
                    className="p-3 rounded-lg border transition-all bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30 hover:border-purple-400"
                  >
                    <p className="text-purple-400 font-medium text-sm">{ABILITY_NAMES[ability.type]}</p>
                    <p className="text-white/50 text-xs">Lv.{ability.upgradeCount} → {ability.upgradeCount + 1}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leave button */}
      <Button
        onClick={onLeave}
        className={cn(
          "w-full mt-4",
          hasRested
            ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
            : "bg-slate-700 hover:bg-slate-600"
        )}
      >
        {hasRested ? "Continue Journey" : "Leave Without Resting"}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

export default RestSiteScreen;
