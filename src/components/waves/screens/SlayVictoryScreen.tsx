import { Button } from "@/components/ui/button";
import { UnlockedAbility } from "../RoguelikeAbilitySelect";

interface SlayVictoryScreenProps {
  totalScore: number;
  slayGold: number;
  roguelikeLevel: number;
  unlockedAbilities: UnlockedAbility[];
  onNewRun: () => void;
  onGoToMenu: () => void;
}

const SlayVictoryScreen = ({
  totalScore,
  slayGold,
  roguelikeLevel,
  unlockedAbilities,
  onNewRun,
  onGoToMenu,
}: SlayVictoryScreenProps) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80">
      <div className="bg-slate-800 rounded-xl p-8 max-w-md mx-4 text-center border-2 border-yellow-500/50 shadow-2xl">
        <h2 className="text-4xl font-display text-yellow-400 mb-2" style={{ textShadow: "0 0 30px hsla(45, 100%, 50%, 0.5)" }}>
          🏆 Victory! 🏆
        </h2>
        <p className="text-white/70 mb-4">You conquered all three acts!</p>
        <div className="py-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20 mb-4">
          <p className="text-yellow-400/70 text-xs uppercase tracking-widest mb-1">Final Score</p>
          <p className="text-5xl font-display text-yellow-400 font-mono">
            {totalScore.toLocaleString()}
          </p>
        </div>
        <div className="flex justify-center gap-6 mb-4 text-sm">
          <div>
            <p className="text-white/50">Gold</p>
            <p className="text-yellow-400 font-mono text-lg">{slayGold}</p>
          </div>
          <div>
            <p className="text-white/50">Level</p>
            <p className="text-purple-300 font-mono text-lg">{roguelikeLevel}</p>
          </div>
          <div>
            <p className="text-white/50">Abilities</p>
            <p className="text-cyan-300 font-mono text-lg">{unlockedAbilities.length}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={onNewRun}
            className="bg-yellow-600 hover:bg-yellow-500 text-white font-display px-6 py-3"
          >
            New Run
          </Button>
          <Button
            variant="outline"
            onClick={onGoToMenu}
            className="border-white/30 text-white hover:bg-white/10 px-6 py-3"
          >
            Menu
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SlayVictoryScreen;
