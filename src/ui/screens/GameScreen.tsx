import { useRef, useEffect, useCallback, useState } from "react";
import { GameEngine } from "../../engine/GameEngine";
import { useGameStore } from "../../store/gameStore";
import { CANVAS_WIDTH, CANVAS_HEIGHT, SAVE_KEY_ROGUELIKE } from "../../engine/data/constants";
import type { AbilityType } from "../../engine/core/types";
import AbilityHUD from "../components/AbilityHUD";
import UpgradeScreen from "../components/UpgradeScreen";
import GameOverScreen from "../components/GameOverScreen";
import AbilitySelectScreen from "../components/AbilitySelectScreen";
import TouchControls from "../components/TouchControls";
import LevelCelebration from "../components/LevelCelebration";
import StartScreen, { type StartConfig } from "./StartScreen";

// Detect mobile/touch device
const isTouchDevice = () => "ontouchstart" in window || navigator.maxTouchPoints > 0;

/**
 * GameScreen: Top-level screen that manages the full game lifecycle.
 * Shows StartScreen → Canvas gameplay → UpgradeScreen → GameOverScreen.
 */
export default function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [showMenu, setShowMenu] = useState(true);
  const [hasSavedRun, setHasSavedRun] = useState(false);
  const [isMobile] = useState(isTouchDevice);
  const [celebrating, setCelebrating] = useState(false);

  // Store subscriptions
  const gameState = useGameStore((s) => s.gameState);
  const wavesTouched = useGameStore((s) => s.wavesTouched);
  const wavesMissed = useGameStore((s) => s.wavesMissed);
  const wavesToWin = useGameStore((s) => s.wavesToWin);
  const wavesToLose = useGameStore((s) => s.wavesToLose);
  const waterTimer = useGameStore((s) => s.waterTimer);
  const maxWaterTimer = useGameStore((s) => s.maxWaterTimer);
  const roguelikeLevel = useGameStore((s) => s.roguelikeLevel);
  const currentBeachEffect = useGameStore((s) => s.currentBeachEffect);
  const fishNetStuck = useGameStore((s) => s.fishNetStuck);
  const levelScore = useGameStore((s) => s.levelScore);
  const totalScore = useGameStore((s) => s.totalScore);
  const unlockedAbilities = useGameStore((s) => s.unlockedAbilities);
  const selectedAbilities = useGameStore((s) => s.selectedAbilities);

  // Trigger celebration when level completes
  useEffect(() => {
    if (gameState === "levelComplete") {
      setCelebrating(true);
    }
  }, [gameState]);

  // Check for saved run on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY_ROGUELIKE);
      setHasSavedRun(!!saved);
    } catch { /* ignore */ }
  }, []);

  // Initialize engine (once)
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

  // Responsive canvas scaling
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

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleStart = useCallback((config: StartConfig) => {
    const engine = engineRef.current;
    if (!engine) return;

    // Apply config to engine state
    const state = engine.getState();
    state.runType = config.runType;
    state.movementMode = config.movementMode;
    state.footType = config.footType;
    state.autoToeTap = config.autoToeTap;

    setShowMenu(false);
    engine.startLevel(1);
  }, []);

  const handleContinueRun = useCallback(() => {
    // TODO: Implement full save/load. For now, just start fresh.
    const engine = engineRef.current;
    if (!engine) return;
    setShowMenu(false);
    engine.startLevel(1);
  }, []);

  const handleUpgradeDone = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const state = engine.getState();
    // If player has >4 abilities and hasn't selected 4, show selection screen
    if (state.unlockedAbilities.length > 4 && state.selectedAbilities.length < 4) {
      // GameEngine will set gameState to selectAbilities
      // For now, just proceed
    }
    engine.proceedToNextLevel();
  }, []);

  const handleAbilitySelect = useCallback((abilities: AbilityType[]) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.selectAbilities(abilities);
    engine.proceedToNextLevel();
  }, []);

  const handleRestart = useCallback(() => {
    useGameStore.getState().resetForNewGame();
    const engine = engineRef.current;
    if (!engine) return;
    // Recreate engine state
    const canvas = canvasRef.current;
    if (canvas) {
      engine.destroy();
      const newEngine = new GameEngine();
      newEngine.attachRenderer(canvas);
      engineRef.current = newEngine;
    }
    setShowMenu(true);
  }, []);

  const handleBackToMenu = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      engine.stopLevel();
    }
    useGameStore.getState().resetForNewGame();
    setShowMenu(true);
  }, []);

  const handleSaveAndQuit = useCallback(() => {
    // TODO: Full save implementation
    handleBackToMenu();
  }, [handleBackToMenu]);

  // ─── Derived ────────────────────────────────────────────────────────────

  const waterPercent = maxWaterTimer > 0 ? (waterTimer / maxWaterTimer) * 100 : 100;
  const waterTimerSec = (waterTimer / 1000).toFixed(1);
  const isPlaying = gameState === "playing";
  const isLevelComplete = gameState === "levelComplete";
  const isGameOver = gameState === "roguelikeGameOver";
  const isSelectAbilities = gameState === "selectAbilities";

  // ─── Menu Screen ────────────────────────────────────────────────────────

  if (showMenu) {
    return (
      <StartScreen
        onStart={handleStart}
        onContinue={handleContinueRun}
        hasSavedRun={hasSavedRun}
      />
    );
  }

  // ─── Game Screen ────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-900 select-none">
      <div
        ref={containerRef}
        className="relative flex flex-col items-center justify-center"
        style={{ width: "100%", maxWidth: "400px", height: "90dvh" }}
      >
        {/* HUD */}
        {isPlaying && (
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

            {/* Wave counter + level + misses */}
            <div className="flex justify-between text-sm font-mono text-white/80">
              <span>🌊 {wavesTouched}/{wavesToWin}</span>
              <span>
                Lv {roguelikeLevel}
                {currentBeachEffect && (
                  <span className="text-yellow-400 ml-1 text-xs">⚠</span>
                )}
              </span>
              <span className={wavesMissed > 0 ? "text-red-400" : ""}>
                ❌ {wavesMissed}/{wavesToLose}
              </span>
            </div>

            {/* Ability bar */}
            <AbilityHUD />

            {/* Fish Net stuck indicator */}
            {fishNetStuck && (
              <div className="text-center text-red-400 text-xs font-bold animate-pulse">
                🕸️ STUCK!
              </div>
            )}
          </div>
        )}

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="block"
          style={{
            imageRendering: "pixelated",
            pointerEvents: isPlaying ? "auto" : "none",
          }}
        />

        {/* Mobile touch controls */}
        {isPlaying && isMobile && engineRef.current && (
          <TouchControls inputSystem={engineRef.current.getInputSystem()} />
        )}

        {/* Level celebration animation */}
        {isLevelComplete && celebrating && (
          <LevelCelebration
            level={roguelikeLevel}
            score={levelScore}
            onComplete={() => setCelebrating(false)}
          />
        )}

        {/* Level Complete → Upgrade Screen (shows after celebration) */}
        {isLevelComplete && !celebrating && engineRef.current && (
          <UpgradeScreen engine={engineRef.current} onDone={handleUpgradeDone} />
        )}

        {/* Ability Selection (>4 abilities unlocked) */}
        {isSelectAbilities && (
          <AbilitySelectScreen
            unlockedAbilities={unlockedAbilities}
            currentSelected={selectedAbilities}
            onConfirm={handleAbilitySelect}
          />
        )}

        {/* Game Over */}
        {isGameOver && (
          <GameOverScreen onRestart={handleRestart} onMenu={handleBackToMenu} />
        )}
      </div>
    </div>
  );
}
