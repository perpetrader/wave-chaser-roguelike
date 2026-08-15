import { Shirt, Zap, Ghost, Shell, Snail, Magnet, Waves, Wind, Rabbit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AbilityType } from "../RoguelikeAbilitySelect";
import { BOSS_QUICK_RUN_MAX_MISSES } from "../game/constants";

interface BossRunVictoryScreenProps {
  bossQuickRunIsNewHighScore: boolean;
  totalScore: number;
  bossQuickRunHighScore: number;
  bossQuickRunCarryoverTimer: number;
  bossQuickRunTotalMisses: number;
  selectedAbilities: AbilityType[];
  onPlayAgain: () => void;
}

const BossRunVictoryScreen = ({
  bossQuickRunIsNewHighScore,
  totalScore,
  bossQuickRunHighScore,
  bossQuickRunCarryoverTimer,
  bossQuickRunTotalMisses,
  selectedAbilities,
  onPlayAgain,
}: BossRunVictoryScreenProps) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-amber-900/80 via-purple-900/50 to-slate-900 p-4">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border-2 border-amber-400 shadow-2xl shadow-amber-500/30 text-center">
        {/* Victory Header */}
        <div className="mb-4">
          <div className="text-6xl mb-2">🏆</div>
          <h2 className="text-3xl font-display text-amber-400 mb-1">
            VICTORY!
          </h2>
          <p className="text-white/70">
            You conquered all 10 Boss Beaches!
          </p>
        </div>

        {/* High Score Badge */}
        {bossQuickRunIsNewHighScore && (
          <div className="bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-400 rounded-lg p-3 mb-4 animate-pulse">
            <p className="text-amber-300 font-display text-lg">🌟 NEW HIGH SCORE! 🌟</p>
          </div>
        )}

        {/* Final Score */}
        <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
          <p className="text-white/60 text-sm mb-1">Final Score</p>
          <p className="text-5xl font-display text-amber-400 font-mono">{totalScore}</p>
        </div>

        {/* High Score Display */}
        <div className="bg-slate-900/30 rounded-lg p-3 mb-4">
          <p className="text-white/50 text-sm">High Score</p>
          <p className="text-2xl font-display text-purple-400 font-mono">{bossQuickRunHighScore}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
          <div className="bg-slate-900/30 rounded-lg p-3">
            <p className="text-cyan-400/70">Time Remaining</p>
            <p className="text-cyan-400 font-mono text-lg">{(bossQuickRunCarryoverTimer / 1000).toFixed(1)}s</p>
          </div>
          <div className="bg-slate-900/30 rounded-lg p-3">
            <p className="text-pink-400/70">Total Misses</p>
            <p className="text-pink-400 font-mono text-lg">{bossQuickRunTotalMisses}/{BOSS_QUICK_RUN_MAX_MISSES}</p>
          </div>
        </div>

        {/* Abilities Used */}
        <div className="mb-6">
          <p className="text-white/50 text-sm mb-2">Abilities Used</p>
          <div className="flex justify-center gap-2">
            {selectedAbilities.map((type) => {
              const info = {
                wetsuit: { icon: <Shirt className="w-5 h-5" />, color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
                superTap: { icon: <Zap className="w-5 h-5" />, color: "text-orange-400", bgColor: "bg-orange-500/20" },
                ghostToe: { icon: <Ghost className="w-5 h-5" />, color: "text-purple-400", bgColor: "bg-purple-500/20" },
                crystalBall: { icon: <Shell className="w-5 h-5" />, color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
                slowdown: { icon: <Snail className="w-5 h-5" />, color: "text-pink-400", bgColor: "bg-pink-500/20" },
                waveMagnet: { icon: <Magnet className="w-5 h-5" />, color: "text-red-400", bgColor: "bg-red-500/20" },
                waveSurfer: { icon: <Waves className="w-5 h-5" />, color: "text-teal-400", bgColor: "bg-teal-500/20" },
                towelOff: { icon: <Wind className="w-5 h-5" />, color: "text-sky-400", bgColor: "bg-sky-500/20" },
                doubleDip: { icon: <span className="w-5 h-5 flex items-center justify-center font-bold text-xs">2x</span>, color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
                jumpAround: { icon: <Rabbit className="w-5 h-5" />, color: "text-lime-400", bgColor: "bg-lime-500/20" },
              }[type];
              return (
                <div
                  key={type}
                  className={cn("p-2 rounded-lg", info?.bgColor)}
                >
                  <span className={info?.color}>{info?.icon}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Play Again Button */}
        <Button
          onClick={onPlayAgain}
          className="w-full h-14 text-lg font-display bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-none shadow-lg"
        >
          Play Again
        </Button>
      </div>
    </div>
  );
};

export default BossRunVictoryScreen;
