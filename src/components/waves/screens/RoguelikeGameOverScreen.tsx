import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AbilityType, UnlockedAbility } from "../RoguelikeAbilitySelect";

interface RoguelikeGameOverScreenProps {
  gameOverReason: "timer" | "missed" | null;
  totalScore: number;
  roguelikeLevel: number;
  roguelikeTotalWaves: number;
  wavesTouched: number;
  totalSteps: number;
  totalToeTaps: number;
  selectedAbilities: AbilityType[];
  unlockedAbilities: UnlockedAbility[];
  gameOverReady: boolean;
  onRetryLevel: () => void;
  onNewRun: () => void;
  onGoToMenu: () => void;
}

const RoguelikeGameOverScreen = ({
  gameOverReason,
  totalScore,
  roguelikeLevel,
  roguelikeTotalWaves,
  wavesTouched,
  totalSteps,
  totalToeTaps,
  selectedAbilities,
  unlockedAbilities,
  gameOverReady,
  onRetryLevel,
  onNewRun,
  onGoToMenu,
}: RoguelikeGameOverScreenProps) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
      <div className="bg-slate-800 rounded-xl p-8 max-w-md mx-4 text-center border-2 border-purple-500/50 shadow-2xl">
        <h2 className="text-3xl font-display text-purple-400 mb-1">
          Run Over!
        </h2>
        <p className="text-white/50 text-sm mb-3">
          {gameOverReason === "missed"
            ? "You missed too many waves!"
            : "Your feet got too soggy!"}
        </p>

        <div className="my-4 space-y-4">
          <div className="py-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <p className="text-yellow-400/70 text-xs uppercase tracking-widest mb-1">
              Final Score
            </p>
            <p className="text-5xl font-display text-yellow-400 font-mono" style={{ textShadow: "0 0 20px hsla(45, 100%, 50%, 0.3)" }}>
              {totalScore.toLocaleString()}
            </p>
          </div>
          <div className="flex justify-center gap-6">
            <div>
              <p className="text-white/60 text-sm uppercase tracking-wider">
                Final Level
              </p>
              <p className="text-2xl font-display text-purple-300 font-mono">
                {roguelikeLevel}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-sm uppercase tracking-wider">
                Total Waves
              </p>
              <p className="text-2xl font-display text-cyan-300 font-mono">
                {roguelikeTotalWaves + wavesTouched}
              </p>
            </div>
          </div>
          <div className="flex justify-center gap-6">
            <div>
              <p className="text-white/60 text-sm uppercase tracking-wider">
                Total Steps
              </p>
              <p className="text-2xl font-display text-orange-300 font-mono">
                {totalSteps}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-sm uppercase tracking-wider">
                Total Toe Taps
              </p>
              <p className="text-2xl font-display text-pink-300 font-mono">
                {totalToeTaps}
              </p>
            </div>
          </div>
          <div>
            <p className="text-white/60 text-sm uppercase tracking-wider">
              Loadout
            </p>
            <div className="flex justify-center gap-2 mt-2 flex-wrap">
              {selectedAbilities.length === 0 ? (
                <span className="text-white/40 text-sm">None</span>
              ) : (
                selectedAbilities.map((type) => {
                  const ability = unlockedAbilities.find(a => a.type === type);
                  return (
                    <div
                      key={type}
                      className={cn(
                        "px-3 py-1 rounded-lg text-sm",
                        type === "wetsuit" && "bg-yellow-500/20 text-yellow-400",
                        type === "superTap" && "bg-orange-500/20 text-orange-400",
                        type === "ghostToe" && "bg-purple-500/20 text-purple-400",
                        type === "crystalBall" && "bg-cyan-500/20 text-cyan-400",
                        type === "slowdown" && "bg-pink-500/20 text-pink-400",
                        type === "waveMagnet" && "bg-red-500/20 text-red-400",
                        type === "waveSurfer" && "bg-teal-500/20 text-teal-400",
                        type === "towelOff" && "bg-sky-500/20 text-sky-400",
                        type === "doubleDip" && "bg-emerald-500/20 text-emerald-400",
                        type === "jumpAround" && "bg-lime-500/20 text-lime-400"
                      )}
                    >
                      {type === "wetsuit" && "Wet Suit"}
                      {type === "superTap" && "Super Tap"}
                      {type === "ghostToe" && "Ghost Feet"}
                      {type === "crystalBall" && "Crystal Conch"}
                      {type === "slowdown" && "Slowdown"}
                      {type === "waveMagnet" && "Wave Magnet"}
                      {type === "waveSurfer" && "Teleport"}
                      {type === "towelOff" && "Towel Off"}
                      {type === "doubleDip" && "Double Dip"}
                      {type === "jumpAround" && "Jump Around"}
                      {ability && ` Lv${ability.upgradeCount + 1}`}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className={cn(
          "flex gap-4 justify-center flex-wrap transition-all duration-300",
          gameOverReady ? "opacity-100" : "opacity-50 pointer-events-none"
        )}>
          <Button
            onClick={onRetryLevel}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-display px-6 py-4"
            disabled={!gameOverReady}
          >
            Retry Level
          </Button>
          <Button
            onClick={onNewRun}
            className="bg-purple-600 hover:bg-purple-500 text-white font-display px-6 py-4"
            disabled={!gameOverReady}
          >
            New Run
          </Button>
          <Button
            variant="outline"
            onClick={onGoToMenu}
            className="border-white/30 text-white hover:bg-white/10 px-4 py-4"
            disabled={!gameOverReady}
          >
            Menu
          </Button>
        </div>
        {!gameOverReady && (
          <p className="text-white/40 text-sm mt-4 animate-pulse">Please wait...</p>
        )}
      </div>
    </div>
  );
};

export default RoguelikeGameOverScreen;
