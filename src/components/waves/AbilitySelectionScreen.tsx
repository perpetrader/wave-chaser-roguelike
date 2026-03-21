import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shirt, Zap, Ghost, Shell, Snail, Magnet, Waves, Wind, Check, Rabbit } from "lucide-react";
import { cn } from "@/lib/utils";
import { AbilityType, UnlockedAbility } from "./RoguelikeAbilitySelect";

interface AbilitySelectionScreenProps {
  level: number;
  unlockedAbilities: UnlockedAbility[];
  onConfirm: (selected: AbilityType[]) => void;
}

const ABILITY_INFO: Record<AbilityType, { 
  name: string; 
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  wetsuit: {
    name: "Wet Suit",
    icon: <Shirt className="w-6 h-6" />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-500/50",
  },
  superTap: {
    name: "Super Tap",
    icon: <Zap className="w-6 h-6" />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-500/50",
  },
  ghostToe: {
    name: "Ghost Toe",
    icon: <Ghost className="w-6 h-6" />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/50",
  },
  crystalBall: {
    name: "Crystal Conch",
    icon: <Shell className="w-6 h-6" />,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-500/50",
  },
  slowdown: {
    name: "Slowdown",
    icon: <Snail className="w-6 h-6" />,
    color: "text-pink-400",
    bgColor: "bg-pink-500/20",
    borderColor: "border-pink-500/50",
  },
  waveMagnet: {
    name: "Wave Magnet",
    icon: <Magnet className="w-6 h-6" />,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/50",
  },
  waveSurfer: {
    name: "Teleport",
    icon: <Waves className="w-6 h-6" />,
    color: "text-teal-400",
    bgColor: "bg-teal-500/20",
    borderColor: "border-teal-500/50",
  },
  towelOff: {
    name: "Towel Off",
    icon: <Wind className="w-6 h-6" />,
    color: "text-sky-400",
    bgColor: "bg-sky-500/20",
    borderColor: "border-sky-500/50",
  },
  doubleDip: {
    name: "Double Dip",
    icon: <span className="w-6 h-6 flex items-center justify-center font-bold text-sm">2x</span>,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/50",
  },
  jumpAround: {
    name: "Jump Around",
    icon: <Rabbit className="w-6 h-6" />,
    color: "text-lime-400",
    bgColor: "bg-lime-500/20",
    borderColor: "border-lime-500/50",
  },
};

const ABILITY_KEYS = ["C", "V", "B", "N"];

const AbilitySelectionScreen = ({
  level,
  unlockedAbilities,
  onConfirm,
}: AbilitySelectionScreenProps) => {
  const [selected, setSelected] = useState<AbilityType[]>([]);

  const toggleAbility = (type: AbilityType) => {
    if (selected.includes(type)) {
      setSelected(selected.filter(t => t !== type));
    } else if (selected.length < 4) {
      setSelected([...selected, type]);
    }
  };

  const handleConfirm = () => {
    if (selected.length === 4) {
      onConfirm(selected);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-lg mx-auto">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-display text-purple-400 mb-2">
          Level {level}
        </h2>
        <p className="text-white/70">
          Select 4 abilities to use this level:
        </p>
        <p className="text-white/50 text-sm mt-1">
          {selected.length}/4 selected
        </p>
      </div>

      <div className="w-full grid grid-cols-2 gap-3">
        {unlockedAbilities.map((ability, index) => {
          const info = ABILITY_INFO[ability.type];
          const isSelected = selected.includes(ability.type);
          const slotIndex = selected.indexOf(ability.type);
          
          return (
            <button
              key={ability.type}
              onClick={() => toggleAbility(ability.type)}
              className={cn(
                "relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                isSelected 
                  ? "bg-slate-900/70 border-purple-500 ring-2 ring-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  : "bg-slate-900/70 border-slate-600 hover:border-slate-500",
                selected.length >= 4 && !isSelected && "opacity-50 cursor-not-allowed"
              )}
              disabled={selected.length >= 4 && !isSelected}
            >
              <div className={cn("p-2 rounded-lg", info.bgColor)}>
                <span className={info.color}>{info.icon}</span>
              </div>
              <div className="text-left flex-1">
                <p className={cn("font-semibold text-sm", info.color)}>{info.name}</p>
                <p className="text-sm text-white/70 font-bold">Level {ability.upgradeCount + 1}</p>
              </div>
              {isSelected && (
                <div className="absolute top-1 right-1 bg-green-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {ABILITY_KEYS[slotIndex]}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected.length === 4 && (
        <div className="w-full bg-slate-800/50 rounded-lg p-3 border border-slate-600">
          <p className="text-white/60 text-xs text-center mb-2">Key bindings for this level:</p>
          <div className="flex justify-center gap-4">
            {selected.map((type, index) => {
              const info = ABILITY_INFO[type];
              return (
                <div key={type} className="flex flex-col items-center gap-1">
                  <span className="text-xs font-mono bg-slate-700 px-2 py-0.5 rounded text-white/80">
                    {ABILITY_KEYS[index]}
                  </span>
                  <span className={cn("text-xs", info.color)}>{info.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Button
        onClick={handleConfirm}
        disabled={selected.length !== 4}
        className={cn(
          "w-full h-14 text-lg font-display",
          selected.length === 4
            ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white"
            : "bg-slate-700 text-slate-400 cursor-not-allowed"
        )}
      >
        <Check className="w-5 h-5 mr-2" />
        {selected.length === 4 ? "Start Level" : `Select ${4 - selected.length} more`}
      </Button>
    </div>
  );
};

export default AbilitySelectionScreen;