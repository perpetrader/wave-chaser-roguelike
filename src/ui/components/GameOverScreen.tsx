import { useGameStore } from "../../store/gameStore";
import type { AbilityType } from "../../engine/core/types";
import { ROGUELIKE_BASE_DURATIONS, UPGRADE_INCREMENTS_MS } from "../../engine/data/constants";

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
  onRestart: () => void;
  onMenu: () => void;
}

export default function GameOverScreen({ onRestart, onMenu }: Props) {
  const roguelikeLevel = useGameStore((s) => s.roguelikeLevel);
  const totalScore = useGameStore((s) => s.totalScore);
  const gameOverReason = useGameStore((s) => s.gameOverReason);
  const unlockedAbilities = useGameStore((s) => s.unlockedAbilities);
  const selectedAbilities = useGameStore((s) => s.selectedAbilities);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-10 overflow-y-auto p-4">
      {/* Header */}
      <h2 className="text-3xl font-extrabold text-purple-400 mb-1">Run Over!</h2>
      <p className="text-white/60 text-sm mb-4">
        {gameOverReason === "timer" ? "Your feet got too soggy!" : "Too many waves missed!"}
      </p>

      {/* Score */}
      <div className="text-center mb-4">
        <p className="text-yellow-400 text-3xl font-extrabold">{totalScore.toLocaleString()}</p>
        <p className="text-white/40 text-xs">FINAL SCORE</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-4">
        <StatBox label="Final Level" value={roguelikeLevel} />
        <StatBox label="Total Score" value={totalScore} />
      </div>

      {/* Loadout */}
      {selectedAbilities.length > 0 && (
        <div className="w-full max-w-xs mb-4">
          <p className="text-white/40 text-xs text-center mb-2">LOADOUT</p>
          <div className="grid grid-cols-2 gap-1">
            {selectedAbilities.map((type) => {
              const unlocked = unlockedAbilities.find((a) => a.type === type);
              return (
                <div
                  key={type}
                  className="flex items-center gap-1 bg-slate-800 rounded px-2 py-1 text-xs"
                >
                  <span>{ABILITY_EMOJIS[type]}</span>
                  <span className="text-white/70">{ABILITY_NAMES[type]}</span>
                  {unlocked && unlocked.upgradeCount > 0 && (
                    <span className="text-cyan-400 ml-auto">+{unlocked.upgradeCount}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button
          onClick={onRestart}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors"
        >
          New Run
        </button>
        <button
          onClick={onMenu}
          className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white/70 font-medium rounded-lg transition-colors text-sm"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-slate-800/60 rounded-lg p-2 text-center">
      <p className="text-white font-bold text-lg">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-white/40 text-xs">{label}</p>
    </div>
  );
}
