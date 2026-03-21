import { useGameStore } from "../../store/gameStore";
import type { AbilityType, AbilityState } from "../../engine/core/types";
import { ABILITY_KEYS, ROGUELIKE_BASE_DURATIONS } from "../../engine/data/constants";

const ABILITY_EMOJIS: Record<AbilityType, string> = {
  wetsuit: "🦺",
  superTap: "👆",
  ghostToe: "👻",
  crystalBall: "🔮",
  slowdown: "⏰",
  waveMagnet: "🧲",
  waveSurfer: "🏄",
  towelOff: "🏖️",
  doubleDip: "✌️",
  jumpAround: "🦘",
};

const ABILITY_NAMES: Record<AbilityType, string> = {
  wetsuit: "Wetsuit",
  superTap: "Super Tap",
  ghostToe: "Ghost Toe",
  crystalBall: "Crystal Ball",
  slowdown: "Slowdown",
  waveMagnet: "Wave Magnet",
  waveSurfer: "Wave Surfer",
  towelOff: "Towel Off",
  doubleDip: "Double Dip",
  jumpAround: "Jump Around",
};

export default function AbilityHUD() {
  const selectedAbilities = useGameStore((s) => s.selectedAbilities);
  const abilityStates = useGameStore((s) => s.abilityStates);

  if (selectedAbilities.length === 0) return null;

  return (
    <div className="flex gap-1 justify-center">
      {selectedAbilities.map((type, i) => {
        const state = abilityStates[type];
        const key = ABILITY_KEYS[i] ?? "";
        const emoji = ABILITY_EMOJIS[type];
        const isActive = state?.active;
        const isOnCooldown = (state?.cooldownRemaining ?? 0) > 0;
        const cooldownSec = Math.ceil((state?.cooldownRemaining ?? 0) / 1000);

        return (
          <div
            key={type}
            className={`
              relative flex flex-col items-center justify-center rounded-lg px-2 py-1 text-xs
              ${isActive ? "bg-cyan-600 ring-2 ring-cyan-300" : ""}
              ${isOnCooldown ? "bg-slate-700 opacity-60" : ""}
              ${!isActive && !isOnCooldown ? "bg-slate-700 hover:bg-slate-600" : ""}
            `}
            style={{ minWidth: "48px" }}
          >
            <span className="text-lg">{emoji}</span>
            <span className="text-[10px] text-white/60">[{key}]</span>
            {isActive && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            )}
            {isOnCooldown && (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/80">
                {cooldownSec}s
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
