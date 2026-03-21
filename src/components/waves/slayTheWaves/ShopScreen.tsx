// Slay the Waves - Shop Screen

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShopItem, SHOP_PRICES } from "./types";
import { AbilityType, UnlockedAbility, PermanentUpgradeType, PermanentUpgrades, MAX_PERMANENT_UPGRADES } from "../RoguelikeAbilitySelect";
import { Shirt, Zap, Ghost, Shell, Snail, Magnet, Waves, Wind, Rabbit, ShoppingBag, Sparkles, Timer, TrendingUp, Footprints, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShopScreenProps {
  gold: number;
  unlockedAbilities: UnlockedAbility[];
  permanentUpgrades: PermanentUpgrades;
  availableAbilities: AbilityType[]; // Abilities not yet unlocked
  onPurchaseAbility: (ability: AbilityType) => void;
  onPurchaseUpgrade: (ability: AbilityType) => void;
  onPurchaseWaterTime: () => void;
  onPurchasePermanentUpgrade: (upgrade: PermanentUpgradeType) => void;
  onLeave: () => void;
}

const ABILITY_ICONS: Record<AbilityType, React.ReactNode> = {
  wetsuit: <Shirt className="w-6 h-6" />,
  superTap: <Zap className="w-6 h-6" />,
  ghostToe: <Ghost className="w-6 h-6" />,
  crystalBall: <Shell className="w-6 h-6" />,
  slowdown: <Snail className="w-6 h-6" />,
  waveMagnet: <Magnet className="w-6 h-6" />,
  waveSurfer: <Waves className="w-6 h-6" />,
  towelOff: <Wind className="w-6 h-6" />,
  doubleDip: <span className="w-6 h-6 flex items-center justify-center font-bold">2x</span>,
  jumpAround: <Rabbit className="w-6 h-6" />,
};

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

const ShopScreen = ({
  gold,
  unlockedAbilities,
  permanentUpgrades,
  availableAbilities,
  onPurchaseAbility,
  onPurchaseUpgrade,
  onPurchaseWaterTime,
  onPurchasePermanentUpgrade,
  onLeave,
}: ShopScreenProps) => {
  const [purchasedThisVisit, setPurchasedThisVisit] = useState<string[]>([]);

  const handlePurchase = (id: string, action: () => void) => {
    action();
    setPurchasedThisVisit(prev => [...prev, id]);
  };

  // Get abilities that can be upgraded (not maxed)
  const upgradableAbilities = unlockedAbilities.filter(a => a.upgradeCount < 10);

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
          <ShoppingBag className="w-6 h-6" />
          <h2 className="text-2xl font-display">Beach Shop</h2>
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div className="text-xl font-bold text-yellow-400">
          💰 {gold} Gold
        </div>
      </div>

      {/* Shop sections */}
      <div className="w-full space-y-6">
        {/* New Abilities */}
        {availableAbilities.length > 0 && (
          <div>
            <h3 className="text-lg font-display text-purple-400 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              New Abilities
            </h3>
            <div className="space-y-2">
              {availableAbilities.slice(0, 3).map(ability => {
                const isPurchased = purchasedThisVisit.includes(`ability-${ability}`);
                const canAfford = gold >= SHOP_PRICES.ability;
                return (
                  <button
                    key={ability}
                    onClick={() => canAfford && !isPurchased && handlePurchase(`ability-${ability}`, () => onPurchaseAbility(ability))}
                    disabled={!canAfford || isPurchased}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                      canAfford && !isPurchased
                        ? "bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30 hover:border-purple-400"
                        : "bg-slate-800/50 border-slate-600 opacity-50 cursor-not-allowed",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-purple-400">{ABILITY_ICONS[ability]}</span>
                      <span className="text-white font-medium">{ABILITY_NAMES[ability]}</span>
                    </div>
                    <span className={cn("font-bold", canAfford ? "text-yellow-400" : "text-red-400")}>
                      {isPurchased ? "✓ Bought" : `${SHOP_PRICES.ability} 💰`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Ability Upgrades */}
        {upgradableAbilities.length > 0 && (
          <div>
            <h3 className="text-lg font-display text-cyan-400 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Upgrade Abilities
            </h3>
            <div className="space-y-2">
              {upgradableAbilities.slice(0, 3).map(ability => {
                const isPurchased = purchasedThisVisit.includes(`upgrade-${ability.type}`);
                const canAfford = gold >= SHOP_PRICES.upgrade;
                return (
                  <button
                    key={ability.type}
                    onClick={() => canAfford && !isPurchased && handlePurchase(`upgrade-${ability.type}`, () => onPurchaseUpgrade(ability.type))}
                    disabled={!canAfford || isPurchased}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                      canAfford && !isPurchased
                        ? "bg-cyan-500/20 border-cyan-500/50 hover:bg-cyan-500/30 hover:border-cyan-400"
                        : "bg-slate-800/50 border-slate-600 opacity-50 cursor-not-allowed",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-cyan-400">{ABILITY_ICONS[ability.type]}</span>
                      <span className="text-white font-medium">{ABILITY_NAMES[ability.type]}</span>
                      <span className="text-xs text-white/50">Lv.{ability.upgradeCount + 1} → {ability.upgradeCount + 2}</span>
                    </div>
                    <span className={cn("font-bold", canAfford ? "text-yellow-400" : "text-red-400")}>
                      {isPurchased ? "✓ Bought" : `${SHOP_PRICES.upgrade} 💰`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Water Time */}
        <div>
          <h3 className="text-lg font-display text-blue-400 mb-3 flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Consumables
          </h3>
          <button
            onClick={() => gold >= SHOP_PRICES.waterTime && handlePurchase("waterTime", onPurchaseWaterTime)}
            disabled={gold < SHOP_PRICES.waterTime || purchasedThisVisit.includes("waterTime")}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
              gold >= SHOP_PRICES.waterTime && !purchasedThisVisit.includes("waterTime")
                ? "bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30 hover:border-blue-400"
                : "bg-slate-800/50 border-slate-600 opacity-50 cursor-not-allowed",
            )}
          >
            <div className="flex items-center gap-3">
              <Timer className="w-6 h-6 text-blue-400" />
              <div className="text-left">
                <span className="text-white font-medium">Water Timer +0.3s</span>
                <p className="text-xs text-white/50">Permanently increase max water time</p>
              </div>
            </div>
            <span className={cn("font-bold", gold >= SHOP_PRICES.waterTime ? "text-yellow-400" : "text-red-400")}>
              {purchasedThisVisit.includes("waterTime") ? "✓ Bought" : `${SHOP_PRICES.waterTime} 💰`}
            </span>
          </button>
        </div>

        {/* Permanent Upgrades */}
        <div>
          <h3 className="text-lg font-display text-green-400 mb-3 flex items-center gap-2">
            <Footprints className="w-5 h-5" />
            Permanent Upgrades
          </h3>
          <div className="space-y-2">
            {(["fastFeet", "tapDancer", "wetShoes"] as PermanentUpgradeType[]).map(upgrade => {
              const current = permanentUpgrades[upgrade];
              const isMaxed = current >= MAX_PERMANENT_UPGRADES;
              const isPurchased = purchasedThisVisit.includes(`perm-${upgrade}`);
              const canAfford = gold >= SHOP_PRICES.permanentUpgrade;
              
              const info = {
                fastFeet: { name: "Fast Feet", desc: "+10% distance per move", icon: <Footprints className="w-6 h-6" /> },
                tapDancer: { name: "Tap Dancer", desc: "+15% toe tap distance", icon: <Zap className="w-6 h-6" /> },
                wetShoes: { name: "Wet Shoes", desc: "-10% water drain", icon: <Timer className="w-6 h-6" /> },
              }[upgrade];

              return (
                <button
                  key={upgrade}
                  onClick={() => canAfford && !isMaxed && !isPurchased && handlePurchase(`perm-${upgrade}`, () => onPurchasePermanentUpgrade(upgrade))}
                  disabled={!canAfford || isMaxed || isPurchased}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                    canAfford && !isMaxed && !isPurchased
                      ? "bg-green-500/20 border-green-500/50 hover:bg-green-500/30 hover:border-green-400"
                      : "bg-slate-800/50 border-slate-600 opacity-50 cursor-not-allowed",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">{info.icon}</span>
                    <div className="text-left">
                      <span className="text-white font-medium">{info.name}</span>
                      <p className="text-xs text-white/50">{info.desc} ({current}/{MAX_PERMANENT_UPGRADES})</p>
                    </div>
                  </div>
                  <span className={cn("font-bold", canAfford && !isMaxed ? "text-yellow-400" : "text-red-400")}>
                    {isMaxed ? "MAX" : isPurchased ? "✓ Bought" : `${SHOP_PRICES.permanentUpgrade} 💰`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leave button */}
      <Button
        onClick={onLeave}
        className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
      >
        Continue Journey
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

export default ShopScreen;
