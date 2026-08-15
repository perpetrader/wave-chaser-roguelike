import { Button } from "@/components/ui/button";
import { BEACH_EFFECTS, BOSS_QUICK_RUN_MAX_MISSES, type BeachEffectType } from "../game/constants";

interface BossRunLevelCompleteScreenProps {
  roguelikeLevel: number;
  completedBeachForDisplay: BeachEffectType | null;
  bossQuickRunLevelScore: number;
  bossQuickRunCarryoverTimer: number;
  bossQuickRunTotalMisses: number;
  totalScore: number;
  onContinue: () => void;
}

const BossRunLevelCompleteScreen = ({
  roguelikeLevel,
  completedBeachForDisplay,
  bossQuickRunLevelScore,
  bossQuickRunCarryoverTimer,
  bossQuickRunTotalMisses,
  totalScore,
  onContinue,
}: BossRunLevelCompleteScreenProps) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-slate-900 via-purple-900/30 to-slate-900 p-4">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border-2 border-amber-500/50 shadow-2xl text-center">
        <div className="text-amber-400 text-sm uppercase tracking-wider mb-2">Level {roguelikeLevel} Complete</div>
        <div className="text-2xl font-display text-white mb-1">
          🏖️ {BEACH_EFFECTS.find(e => e.type === completedBeachForDisplay)?.name}
        </div>

        {/* Score Display */}
        <div className="my-6 space-y-4">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-white/60 text-sm mb-1">Level Score</p>
            <p className="text-3xl font-display text-amber-400 font-mono">+{bossQuickRunLevelScore}</p>
            <p className="text-white/40 text-xs mt-1">
              10 × Level {roguelikeLevel} × ({(bossQuickRunCarryoverTimer / 1000).toFixed(1)}s + {BOSS_QUICK_RUN_MAX_MISSES - bossQuickRunTotalMisses} misses)
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-white/60 text-sm mb-1">Total Score</p>
            <p className="text-3xl font-display text-purple-400 font-mono">{totalScore}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-900/30 rounded-lg p-3">
              <p className="text-cyan-400/70">Time Remaining</p>
              <p className="text-cyan-400 font-mono text-lg">{(bossQuickRunCarryoverTimer / 1000).toFixed(1)}s</p>
            </div>
            <div className="bg-slate-900/30 rounded-lg p-3">
              <p className="text-pink-400/70">Misses</p>
              <p className="text-pink-400 font-mono text-lg">{bossQuickRunTotalMisses}/{BOSS_QUICK_RUN_MAX_MISSES}</p>
            </div>
          </div>
        </div>

        <Button
          onClick={onContinue}
          className="w-full h-14 text-lg font-display bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-none shadow-lg"
        >
          Continue to Level {roguelikeLevel + 1}
        </Button>
      </div>
    </div>
  );
};

export default BossRunLevelCompleteScreen;
