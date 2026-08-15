import { Shirt, Zap, Ghost, Shell, Snail, Magnet, Waves, Wind, Rabbit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AbilityType, UnlockedAbility } from "../RoguelikeAbilitySelect";

interface ConfirmLoadoutScreenProps {
  roguelikeLevel: number;
  swappingSlot: number | null;
  selectedAbilities: AbilityType[];
  unlockedAbilities: UnlockedAbility[];
  onSelectSwapSlot: (index: number) => void;
  onCancelSwap: () => void;
  onChangeLoadout: () => void;
  onKeepLoadout: () => void;
  onQuickSwap: (type: AbilityType) => void;
}

const ConfirmLoadoutScreen = ({
  roguelikeLevel,
  swappingSlot,
  selectedAbilities,
  unlockedAbilities,
  onSelectSwapSlot,
  onCancelSwap,
  onChangeLoadout,
  onKeepLoadout,
  onQuickSwap,
}: ConfirmLoadoutScreenProps) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 overflow-auto py-6 px-4">
      <div className="bg-slate-800 rounded-xl p-6 max-w-lg mx-4 border-2 border-purple-500/50 shadow-2xl">
        <div className="flex flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-display text-purple-400 mb-2">
              Level {roguelikeLevel}
            </h2>
            <p className="text-white/70">
              {swappingSlot !== null ? "Select replacement:" : "Keep abilities the same or tap any ability to swap it out:"}
            </p>
          </div>

          {swappingSlot === null ? (
            <>
              <div className="w-full grid grid-cols-2 gap-3">
                {selectedAbilities.map((type, index) => {
                  const ability = unlockedAbilities.find(a => a.type === type);
                  const ABILITY_KEYS_LOCAL = ["C", "V", "B", "N"];
                  const info = {
                    wetsuit: { name: "Wet Suit", icon: <Shirt className="w-6 h-6" />, color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
                    superTap: { name: "Super Tap", icon: <Zap className="w-6 h-6" />, color: "text-orange-400", bgColor: "bg-orange-500/20" },
                    ghostToe: { name: "Ghost Feet", icon: <Ghost className="w-6 h-6" />, color: "text-purple-400", bgColor: "bg-purple-500/20" },
                    crystalBall: { name: "Crystal Conch", icon: <Shell className="w-6 h-6" />, color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
                    slowdown: { name: "Slowdown", icon: <Snail className="w-6 h-6" />, color: "text-pink-400", bgColor: "bg-pink-500/20" },
                    waveMagnet: { name: "Wave Magnet", icon: <Magnet className="w-6 h-6" />, color: "text-red-400", bgColor: "bg-red-500/20" },
                    waveSurfer: { name: "Teleport", icon: <Waves className="w-6 h-6" />, color: "text-teal-400", bgColor: "bg-teal-500/20" },
                    towelOff: { name: "Towel Off", icon: <Wind className="w-6 h-6" />, color: "text-sky-400", bgColor: "bg-sky-500/20" },
                    doubleDip: { name: "Double Dip", icon: <span className="w-6 h-6 flex items-center justify-center font-bold text-sm">2x</span>, color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
                    jumpAround: { name: "Jump Around", icon: <Rabbit className="w-6 h-6" />, color: "text-lime-400", bgColor: "bg-lime-500/20" },
                  }[type];

                  return (
                    <button
                      key={type}
                      onClick={() => onSelectSwapSlot(index)}
                      className={cn(
                        "relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:border-purple-400 hover:scale-[1.02]",
                        info?.bgColor,
                        "border-slate-600"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg", info?.bgColor)}>
                        <span className={info?.color}>{info?.icon}</span>
                      </div>
                      <div className="text-left flex-1">
                        <p className={cn("font-semibold text-sm", info?.color)}>{info?.name}</p>
                        <p className="text-xs text-white/40">Level {(ability?.upgradeCount || 0) + 1}</p>
                      </div>
                      <div className="absolute top-1 right-1 bg-slate-700 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {ABILITY_KEYS_LOCAL[index]}
                      </div>
                      <div className="absolute bottom-1 right-1 text-[10px] text-white/40">
                        tap to swap
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 w-full">
                <Button
                  onClick={onChangeLoadout}
                  variant="outline"
                  className="flex-1 h-12 font-display border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                >
                  Change All
                </Button>
                <Button
                  onClick={onKeepLoadout}
                  className="flex-1 h-12 font-display bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white"
                >
                  Ready
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Show the ability being replaced */}
              <div className="w-full text-center mb-2">
                {(() => {
                  const replacingType = selectedAbilities[swappingSlot];
                  const info = {
                    wetsuit: { name: "Wet Suit", icon: <Shirt className="w-5 h-5" />, color: "text-yellow-400" },
                    superTap: { name: "Super Tap", icon: <Zap className="w-5 h-5" />, color: "text-orange-400" },
                    ghostToe: { name: "Ghost Feet", icon: <Ghost className="w-5 h-5" />, color: "text-purple-400" },
                    crystalBall: { name: "Crystal Conch", icon: <Shell className="w-5 h-5" />, color: "text-cyan-400" },
                    slowdown: { name: "Slowdown", icon: <Snail className="w-5 h-5" />, color: "text-pink-400" },
                    waveMagnet: { name: "Wave Magnet", icon: <Magnet className="w-5 h-5" />, color: "text-red-400" },
                    waveSurfer: { name: "Teleport", icon: <Waves className="w-5 h-5" />, color: "text-teal-400" },
                    towelOff: { name: "Towel Off", icon: <Wind className="w-5 h-5" />, color: "text-sky-400" },
                    doubleDip: { name: "Double Dip", icon: <span className="w-5 h-5 flex items-center justify-center font-bold text-xs">2x</span>, color: "text-emerald-400" },
                    jumpAround: { name: "Jump Around", icon: <Rabbit className="w-5 h-5" />, color: "text-lime-400" },
                  }[replacingType];
                  return (
                    <p className="text-white/50 text-sm flex items-center justify-center gap-2">
                      Replacing <span className={info?.color}>{info?.icon}</span>
                      <span className={info?.color}>{info?.name}</span> with:
                    </p>
                  );
                })()}
              </div>

              {/* Show unequipped abilities to swap in */}
              <div className="w-full grid grid-cols-2 gap-3">
                {unlockedAbilities
                  .filter(a => !selectedAbilities.includes(a.type))
                  .map((ability) => {
                    const info = {
                      wetsuit: { name: "Wet Suit", icon: <Shirt className="w-6 h-6" />, color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
                      superTap: { name: "Super Tap", icon: <Zap className="w-6 h-6" />, color: "text-orange-400", bgColor: "bg-orange-500/20" },
                      ghostToe: { name: "Ghost Feet", icon: <Ghost className="w-6 h-6" />, color: "text-purple-400", bgColor: "bg-purple-500/20" },
                      crystalBall: { name: "Crystal Conch", icon: <Shell className="w-6 h-6" />, color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
                      slowdown: { name: "Slowdown", icon: <Snail className="w-6 h-6" />, color: "text-pink-400", bgColor: "bg-pink-500/20" },
                      waveMagnet: { name: "Wave Magnet", icon: <Magnet className="w-6 h-6" />, color: "text-red-400", bgColor: "bg-red-500/20" },
                      waveSurfer: { name: "Teleport", icon: <Waves className="w-6 h-6" />, color: "text-teal-400", bgColor: "bg-teal-500/20" },
                      towelOff: { name: "Towel Off", icon: <Wind className="w-6 h-6" />, color: "text-sky-400", bgColor: "bg-sky-500/20" },
                      doubleDip: { name: "Double Dip", icon: <span className="w-6 h-6 flex items-center justify-center font-bold text-sm">2x</span>, color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
                      jumpAround: { name: "Jump Around", icon: <Rabbit className="w-6 h-6" />, color: "text-lime-400", bgColor: "bg-lime-500/20" },
                    }[ability.type];

                    return (
                      <button
                        key={ability.type}
                        onClick={() => onQuickSwap(ability.type)}
                        className={cn(
                          "relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:border-green-400 hover:scale-[1.02]",
                          info?.bgColor,
                          "border-slate-600"
                        )}
                      >
                        <div className={cn("p-2 rounded-lg", info?.bgColor)}>
                          <span className={info?.color}>{info?.icon}</span>
                        </div>
                        <div className="text-left flex-1">
                          <p className={cn("font-semibold text-sm", info?.color)}>{info?.name}</p>
                          <p className="text-xs text-white/40">Level {ability.upgradeCount + 1}</p>
                        </div>
                      </button>
                    );
                  })}
              </div>

              <Button
                onClick={onCancelSwap}
                variant="outline"
                className="w-full h-10 font-display border-slate-600 text-white/70 hover:bg-slate-700"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmLoadoutScreen;
