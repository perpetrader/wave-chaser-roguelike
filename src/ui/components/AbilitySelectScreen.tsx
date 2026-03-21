import { useState } from "react";
import type { AbilityType, UnlockedAbility } from "../../engine/core/types";
import { ROGUELIKE_BASE_DURATIONS, UPGRADE_INCREMENTS_MS, ABILITY_KEYS } from "../../engine/data/constants";

const ABILITY_EMOJIS: Record<AbilityType, string> = {
  wetsuit: "🦺", superTap: "👆", ghostToe: "👻", crystalBall: "🔮",
  slowdown: "⏰", waveMagnet: "🧲", waveSurfer: "🏄", towelOff: "🏖️",
  doubleDip: "✌️", jumpAround: "🦘",
};

const ABILITY_NAMES: Record<AbilityType, string> = {
  wetsuit: "Wetsuit", superTap: "Super Tap", ghostToe: "Ghost Toe",
  crystalBall: "Crystal Ball", slowdown: "Slowdown", waveMagnet: "Wave Magnet",
  waveSurfer: "Wave Surfer", towelOff: "Towel Off", doubleDip: "Double Dip",
  jumpAround: "Jump Around",
};

interface Props {
  unlockedAbilities: UnlockedAbility[];
  currentSelected: AbilityType[];
  onConfirm: (selected: AbilityType[]) => void;
}

export default function AbilitySelectScreen({ unlockedAbilities, currentSelected, onConfirm }: Props) {
  const [selected, setSelected] = useState<AbilityType[]>(() =>
    currentSelected.length === 4 ? [...currentSelected] : unlockedAbilities.slice(0, 4).map((a) => a.type)
  );

  const toggleAbility = (type: AbilityType) => {
    if (selected.includes(type)) {
      setSelected(selected.filter((t) => t !== type));
    } else if (selected.length < 4) {
      setSelected([...selected, type]);
    }
  };

  const canConfirm = selected.length === 4;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-10 p-4">
      <h2 className="text-xl font-bold text-cyan-400 mb-1">Select 4 Abilities</h2>
      <p className="text-white/50 text-sm mb-4">
        {selected.length}/4 selected • Choose your loadout for this run
      </p>

      <div className="w-full max-w-xs space-y-1 mb-4">
        {unlockedAbilities.map((ability) => {
          const isSelected = selected.includes(ability.type);
          const slot = isSelected ? selected.indexOf(ability.type) : -1;
          const dur = (ROGUELIKE_BASE_DURATIONS[ability.type] + UPGRADE_INCREMENTS_MS[ability.type] * ability.upgradeCount) / 1000;

          return (
            <button
              key={ability.type}
              onClick={() => toggleAbility(ability.type)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                isSelected
                  ? "bg-cyan-900/50 ring-1 ring-cyan-400 text-white"
                  : "bg-slate-800 text-white/50 hover:bg-slate-700"
              }`}
            >
              <span className="text-lg">{ABILITY_EMOJIS[ability.type]}</span>
              <div className="flex-1">
                <div className="font-medium">{ABILITY_NAMES[ability.type]}</div>
                <div className="text-xs text-white/40">
                  Lv.{ability.upgradeCount} • {dur.toFixed(1)}s
                </div>
              </div>
              {isSelected && (
                <span className="text-cyan-300 font-mono text-xs bg-cyan-900/50 px-2 py-0.5 rounded">
                  [{ABILITY_KEYS[slot]}]
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => canConfirm && onConfirm(selected)}
        disabled={!canConfirm}
        className={`w-full max-w-xs py-3 font-bold rounded-lg text-lg transition-colors ${
          canConfirm
            ? "bg-cyan-500 hover:bg-cyan-400 text-white"
            : "bg-slate-700 text-white/30 cursor-not-allowed"
        }`}
      >
        Confirm Loadout
      </button>
    </div>
  );
}
