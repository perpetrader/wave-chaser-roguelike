import { useRef, useEffect, useCallback } from "react";
import { GameEngine } from "../../engine/GameEngine";
import { useGameStore } from "../../store/gameStore";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../../engine/data/constants";

/**
 * GameScreen: Contains the canvas element and HUD overlays.
 * Creates and manages the GameEngine instance.
 */
export default function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Subscribe to store for UI updates
  const gameState = useGameStore((s) => s.gameState);
  const wavesTouched = useGameStore((s) => s.wavesTouched);
  const wavesMissed = useGameStore((s) => s.wavesMissed);
  const wavesToWin = useGameStore((s) => s.wavesToWin);
  const wavesToLose = useGameStore((s) => s.wavesToLose);
  const waterTimer = useGameStore((s) => s.waterTimer);
  const maxWaterTimer = useGameStore((s) => s.maxWaterTimer);
  const gameOverReason = useGameStore((s) => s.gameOverReason);
  const levelScore = useGameStore((s) => s.levelScore);
  const roguelikeLevel = useGameStore((s) => s.roguelikeLevel);

  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine();
    engine.attachRenderer(canvas);
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Handle responsive canvas scaling
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateScale = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scale = Math.min(cw / CANVAS_WIDTH, ch / CANVAS_HEIGHT);
      canvas.style.width = `${CANVAS_WIDTH * scale}px`;
      canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Start game handler
  const handleStart = useCallback(() => {
    engineRef.current?.startLevel(1);
  }, []);

  // Restart handler
  const handleRestart = useCallback(() => {
    engineRef.current?.startLevel(1);
  }, []);

  // Water timer percentage
  const waterPercent = maxWaterTimer > 0 ? (waterTimer / maxWaterTimer) * 100 : 100;
  const waterTimerSec = (waterTimer / 1000).toFixed(1);

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-900 select-none">
      <div
        ref={containerRef}
        className="relative flex flex-col items-center justify-center"
        style={{ width: "100%", maxWidth: "400px", height: "90dvh" }}
      >
        {/* HUD - above canvas */}
        {gameState === "playing" && (
          <div className="w-full px-2 pb-2 space-y-1">
            {/* Water Timer Bar */}
            <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-100 rounded-full"
                style={{
                  width: `${waterPercent}%`,
                  backgroundColor: waterPercent > 30 ? "hsl(180, 70%, 50%)" : "hsl(0, 70%, 50%)",
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
                {waterTimerSec}s
              </span>
            </div>

            {/* Wave counter */}
            <div className="flex justify-between text-sm font-mono text-white/80">
              <span>
                🌊 {wavesTouched}/{wavesToWin}
              </span>
              <span>
                Level {roguelikeLevel}
              </span>
              <span className={wavesMissed > 0 ? "text-red-400" : ""}>
                ❌ {wavesMissed}/{wavesToLose}
              </span>
            </div>
          </div>
        )}

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="block"
          style={{ imageRendering: "pixelated" }}
        />

        {/* Menu overlay */}
        {gameState === "menu" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10">
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Russo One', sans-serif" }}>
              Wave Chaser
            </h1>
            <p className="text-white/60 text-sm mb-6">Touch the waves without getting too wet!</p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-lg text-lg transition-colors"
            >
              Play
            </button>
            <p className="text-white/40 text-xs mt-4">↑↓ to move • Space to toe tap</p>
          </div>
        )}

        {/* Level Complete overlay */}
        {gameState === "levelComplete" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10">
            <h2 className="text-2xl font-bold text-green-400 mb-2">Level Complete!</h2>
            <p className="text-white text-lg mb-1">Score: {levelScore}</p>
            <p className="text-white/60 text-sm mb-6">
              Touched {wavesTouched} waves • Missed {wavesMissed}
            </p>
            <button
              onClick={() => engineRef.current?.startLevel(roguelikeLevel + 1)}
              className="px-8 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg text-lg transition-colors"
            >
              Next Level
            </button>
          </div>
        )}

        {/* Game Over overlay */}
        {gameState === "roguelikeGameOver" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Game Over</h2>
            <p className="text-white/80 text-sm mb-1">
              {gameOverReason === "timer" ? "Water timer expired!" : "Too many waves missed!"}
            </p>
            <p className="text-white/60 text-sm mb-6">
              Reached Level {roguelikeLevel} • Score: {levelScore}
            </p>
            <button
              onClick={handleRestart}
              className="px-8 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-lg text-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
