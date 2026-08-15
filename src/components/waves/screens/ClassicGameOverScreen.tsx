import { Button } from "@/components/ui/button";
import { WavesDifficulty } from "../DifficultySelect";

interface ClassicGameOverScreenProps {
  difficulty: WavesDifficulty;
  gameOverReason: "timer" | "missed" | null;
  wavesTouched: number;
  onPlayAgain: () => void;
  onGoToMenu: () => void;
}

const ClassicGameOverScreen = ({
  difficulty,
  gameOverReason,
  wavesTouched,
  onPlayAgain,
  onGoToMenu,
}: ClassicGameOverScreenProps) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
      <div className="bg-slate-800 rounded-xl p-8 max-w-md mx-4 text-center border-2 border-red-500/50 shadow-2xl">
        <h2 className="text-3xl font-display text-red-400 mb-2">
          Time's Up!
        </h2>
        <p className="text-white/60 text-sm mb-2 capitalize">{difficulty} Mode</p>
        <p className="text-white/80 mb-2">
          {gameOverReason === "missed"
            ? "You missed too many waves!"
            : "Your feet got too soggy!"}
        </p>
        <div className="my-6">
          <p className="text-white/60 text-sm uppercase tracking-wider">
            Waves Touched
          </p>
          <p className="text-5xl font-display text-cyan-300 font-mono">
            {wavesTouched}
          </p>
        </div>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button
            onClick={onPlayAgain}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-display px-6 py-4"
          >
            Play Again
          </Button>
          <Button
            variant="outline"
            onClick={onGoToMenu}
            className="border-white/30 text-white hover:bg-white/10 px-4 py-4"
          >
            Menu
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClassicGameOverScreen;
