// Slay the Waves - Shop Screen

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SHOP_PRICES } from "./types";
import { AbilityType, UnlockedAbility, PermanentUpgradeType, PermanentUpgrades, MAX_PERMANENT_UPGRADES } from "../RoguelikeAbilitySelect";
import { Shirt, Zap, Ghost, Shell, Snail, Magnet, Waves, Wind, Rabbit, ShoppingBag, Sparkles, Timer, TrendingUp, Footprints, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShopScreenProps {
  gold: number;
  unlockedAbilities: UnlockedAbility[];
  permanentUpgrades: PermanentUpgrades;
  availableAbilities: AbilityType[];
  onPurchaseAbility: (ability: AbilityType) => void;
  onPurchaseUpgrade: (ability: AbilityType) => void;
  onPurchaseWaterTime: () => void;
  onPurchasePermanentUpgrade: (upgrade: PermanentUpgradeType) => void;
  onLeave: () => void;
}

const ABILITY_ICONS: Record<AbilityType, React.ReactNode> = {
  wetsuit: <Shirt className="w-5 h-5" />,
  superTap: <Zap className="w-5 h-5" />,
  ghostToe: <Ghost className="w-5 h-5" />,
  crystalBall: <Shell className="w-5 h-5" />,
  slowdown: <Snail className="w-5 h-5" />,
  waveMagnet: <Magnet className="w-5 h-5" />,
  waveSurfer: <Waves className="w-5 h-5" />,
  towelOff: <Wind className="w-5 h-5" />,
  doubleDip: <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">2x</span>,
  jumpAround: <Rabbit className="w-5 h-5" />,
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

  const upgradableAbilities = unlockedAbilities.filter(a => a.upgradeCount < 10);

  return (
    <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: "calc(100dvh - 4rem)" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-yellow-400">
          <ShoppingBag className="w-5 h-5" />
          <h2 className="text-xl font-display">Beach Shop</h2>
        </div>
        <span className="text-lg font-bold text-yellow-400">💰 {gold}</span>
      </div>

      {/* Shop sections */}
      <div className="space-y-3">
        {/* New Abilities */}
        {availableAbilities.length > 0 && (
          <Section title="New Abilities" icon={<Sparkles className="w-4 h-4" />} color="purple">
            {availableAbilities.slice(0, 3).map(ability => (
              <ShopItem
                key={ability}
                icon={<span className="text-purple-400">{ABILITY_ICONS[ability]}</span>}
                name={ABILITY_NAMES[ability]}
                price={SHOP_PRICES.ability}
                gold={gold}
                purchased={purchasedThisVisit.includes(`ability-${ability}`)}
                colorClass="purple"
                onBuy={() => handlePurchase(`ability-${ability}`, () => onPurchaseAbility(ability))}
              />
            ))}
          </Section>
        )}

        {/* Ability Upgrades */}
        {upgradableAbilities.length > 0 && (
          <Section title="Upgrades" icon={<TrendingUp className="w-4 h-4" />} color="cyan">
            {upgradableAbilities.slice(0, 3).map(ability => (
              <ShopItem
                key={ability.type}
                icon={<span className="text-cyan-400">{ABILITY_ICONS[ability.type]}</span>}
                name={ABILITY_NAMES[ability.type]}
                subtitle={`Lv.${ability.upgradeCount + 1} → ${ability.upgradeCount + 2}`}
                price={SHOP_PRICES.upgrade}
                gold={gold}
                purchased={purchasedThisVisit.includes(`upgrade-${ability.type}`)}
                colorClass="cyan"
                onBuy={() => handlePurchase(`upgrade-${ability.type}`, () => onPurchaseUpgrade(ability.type))}
              />
            ))}
          </Section>
        )}

        {/* Water Time */}
        <Section title="Consumables" icon={<Timer className="w-4 h-4" />} color="blue">
          <ShopItem
            icon={<Timer className="w-5 h-5 text-blue-400" />}
            name="Water Timer +0.3s"
            price={SHOP_PRICES.waterTime}
            gold={gold}
            purchased={purchasedThisVisit.includes("waterTime")}
            colorClass="blue"
            onBuy={() => handlePurchase("waterTime", onPurchaseWaterTime)}
          />
        </Section>

        {/* Permanent Upgrades */}
        <Section title="Permanent" icon={<Footprints className="w-4 h-4" />} color="green">
          {(["fastFeet", "tapDancer", "wetShoes"] as PermanentUpgradeType[]).map(upgrade => {
            const current = permanentUpgrades[upgrade];
            const isMaxed = current >= MAX_PERMANENT_UPGRADES;
            const info = {
              fastFeet: { name: "Fast Feet", desc: "+10% move speed" },
              tapDancer: { name: "Tap Dancer", desc: "+15% toe tap" },
              wetShoes: { name: "Wet Shoes", desc: "-10% water drain" },
            }[upgrade];

            return (
              <ShopItem
                key={upgrade}
                icon={<Footprints className="w-5 h-5 text-green-400" />}
                name={`${info.name} (${current}/${MAX_PERMANENT_UPGRADES})`}
                subtitle={info.desc}
                price={SHOP_PRICES.permanentUpgrade}
                gold={gold}
                purchased={purchasedThisVisit.includes(`perm-${upgrade}`)}
                disabled={isMaxed}
                disabledLabel="MAX"
                colorClass="green"
                onBuy={() => handlePurchase(`perm-${upgrade}`, () => onPurchasePermanentUpgrade(upgrade))}
              />
            );
          })}
        </Section>
      </div>

      {/* Leave button */}
      <Button
        onClick={onLeave}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shrink-0"
      >
        Continue Journey
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ title, icon, color, children }: {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    purple: "text-purple-400",
    cyan: "text-cyan-400",
    blue: "text-blue-400",
    green: "text-green-400",
  };
  return (
    <div>
      <h3 className={cn("text-sm font-display mb-1.5 flex items-center gap-1.5", colorMap[color])}>
        {icon} {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ShopItem({ icon, name, subtitle, price, gold, purchased, disabled, disabledLabel, colorClass, onBuy }: {
  icon: React.ReactNode;
  name: string;
  subtitle?: string;
  price: number;
  gold: number;
  purchased: boolean;
  disabled?: boolean;
  disabledLabel?: string;
  colorClass: string;
  onBuy: () => void;
}) {
  const canAfford = gold >= price;
  const isDisabled = !canAfford || purchased || disabled;

  const bgMap: Record<string, string> = {
    purple: "bg-purple-500/15 border-purple-500/40 hover:bg-purple-500/25",
    cyan: "bg-cyan-500/15 border-cyan-500/40 hover:bg-cyan-500/25",
    blue: "bg-blue-500/15 border-blue-500/40 hover:bg-blue-500/25",
    green: "bg-green-500/15 border-green-500/40 hover:bg-green-500/25",
  };

  return (
    <button
      onClick={() => !isDisabled && onBuy()}
      disabled={isDisabled}
      className={cn(
        "w-full flex items-center justify-between py-2 px-3 rounded-lg border transition-all text-left",
        isDisabled
          ? "bg-slate-800/50 border-slate-700/50 opacity-50 cursor-not-allowed"
          : bgMap[colorClass],
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <div className="min-w-0">
          <span className="text-white text-sm font-medium">{name}</span>
          {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
        </div>
      </div>
      <span className={cn("font-bold text-sm shrink-0 ml-2", canAfford && !disabled ? "text-yellow-400" : "text-red-400")}>
        {disabled && disabledLabel ? disabledLabel : purchased ? "✓" : `${price}💰`}
      </span>
    </button>
  );
}

export default ShopScreen;
