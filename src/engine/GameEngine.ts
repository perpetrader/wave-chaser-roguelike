import { GameLoop } from "./core/GameLoop";
import type { WorldState, AbilityType } from "./core/types";
import { WaveSystem } from "./systems/WaveSystem";
import { PlayerSystem } from "./systems/PlayerSystem";
import { CollisionSystem } from "./systems/CollisionSystem";
import { WaterTimerSystem } from "./systems/WaterTimerSystem";
import { ScoreSystem } from "./systems/ScoreSystem";
import { InputSystem, type InputAction } from "./systems/InputSystem";
import { CanvasRenderer } from "../renderer/CanvasRenderer";
import { createDefaultWorldState, useGameStore } from "../store/gameStore";
import {
  OCEAN_HEIGHT,
  TOTAL_HEIGHT,
  ROGUELIKE_BASE_WATER_TIMER,
  BOSS_QUICK_RUN_MAX_MISSES,
  BOSS_HELL_RUN_MAX_MISSES,
} from "./data/constants";
import { getRoguelikeLevelSettings } from "./data/difficulties";

/**
 * GameEngine: The main orchestrator.
 * Owns the WorldState, systems, game loop, and renderer.
 * React communicates with it through methods; it syncs state to Zustand.
 */
export class GameEngine {
  private state: WorldState;
  private gameLoop: GameLoop;
  private renderer: CanvasRenderer | null = null;

  // Systems
  private waveSystem: WaveSystem;
  private playerSystem: PlayerSystem;
  private collisionSystem: CollisionSystem;
  private waterTimerSystem: WaterTimerSystem;
  private scoreSystem: ScoreSystem;
  private inputSystem: InputSystem;

  // Wave movement accumulator (waves move discretely, not every frame)
  private waveMovementAccumulator = 0;

  constructor() {
    this.state = createDefaultWorldState();

    // Initialize systems
    this.waveSystem = new WaveSystem();
    this.playerSystem = new PlayerSystem();
    this.collisionSystem = new CollisionSystem();
    this.waterTimerSystem = new WaterTimerSystem();
    this.scoreSystem = new ScoreSystem();

    this.inputSystem = new InputSystem(this.handleInput.bind(this));

    // Create game loop
    this.gameLoop = new GameLoop(
      this.update.bind(this),
      this.render.bind(this)
    );
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  attachRenderer(canvas: HTMLCanvasElement): void {
    this.renderer = new CanvasRenderer(canvas);
    this.renderer.renderStatic();
  }

  detachRenderer(): void {
    this.renderer?.destroy();
    this.renderer = null;
  }

  destroy(): void {
    this.gameLoop.stop();
    this.inputSystem.destroy();
    this.detachRenderer();
  }

  // ─── Game Flow ──────────────────────────────────────────────────────────

  /**
   * Start a new single level with basic roguelike settings.
   * Phase 1: Simple sandbox mode. Later phases add full mode support.
   */
  startLevel(level = 1): void {
    const levelConfig = getRoguelikeLevelSettings(level);

    // Reset level state
    this.state.gameState = "playing";
    this.state.waves = [];
    this.state.wavesTouched = 0;
    this.state.wavesMissed = 0;
    this.state.waterTimer = levelConfig.waterTimer + (this.state.waterTimeBonus * 300);
    this.state.maxWaterTimer = this.state.waterTimer;
    this.state.difficultySettings = levelConfig.settings;
    this.state.wavesToWin = levelConfig.wavesToWin;
    this.state.wavesToLose = Math.max(1, levelConfig.wavesToLose + this.state.wavesMissedBonus);
    this.state.waveSpawnTimer = 0;
    this.state.feetPosition = 35;
    this.state.isTapping = false;
    this.state.momentumGear = 0;
    this.state.waveIdCounter = 0;
    this.state.lastWaveMaxReach = 35;
    this.state.gameOverReason = null;
    this.state.roguelikeLevel = level;
    this.state.elapsedTime = 0;
    this.waveMovementAccumulator = 0;

    // Enable input and start loop
    this.inputSystem.setMomentumMode(this.state.movementMode === "momentum");
    this.inputSystem.enable();
    this.gameLoop.start();
    this.syncToStore();
  }

  stopLevel(): void {
    this.gameLoop.stop();
    this.inputSystem.disable();
  }

  // ─── Game Loop Callbacks ────────────────────────────────────────────────

  private update(dt: number): void {
    if (this.state.gameState !== "playing") return;

    this.state.elapsedTime += dt;

    // Update momentum movement
    this.playerSystem.updateMomentum(this.state, dt);

    // Calculate effective wave speed (for discrete wave movement)
    const slowdownMult = this.state.abilityStates.slowdown.active ? 2.5 : 1;
    let roughSpeedMult = 1;
    if (this.state.currentBeachEffect === "roughWaters") {
      const lvl = this.state.beachEffectLevel;
      const mults = [1 / 1.20, 1 / 1.30, 1 / 1.40, 1 / 1.50, 1 / 1.75];
      const idx = Math.min(lvl - 1, 4);
      roughSpeedMult = mults[idx];
    }
    const effectiveWaveSpeed = this.state.difficultySettings.waveSpeed * slowdownMult * roughSpeedMult;

    // Accumulate time for wave movement
    this.waveMovementAccumulator += dt;
    const shouldMoveWaves = this.waveMovementAccumulator >= effectiveWaveSpeed;
    if (shouldMoveWaves) {
      this.waveMovementAccumulator -= effectiveWaveSpeed;
    }

    // Calculate effective peak duration and spawn interval
    let roughPeakMult = 1;
    if (this.state.currentBeachEffect === "roughWaters") {
      const lvl = this.state.beachEffectLevel;
      const peakMults = [0.90, 0.80, 0.70, 0.60, 0.50];
      const idx = Math.min(lvl - 1, 4);
      roughPeakMult = peakMults[idx];
    }
    const effectivePeakDuration = this.state.difficultySettings.wavePeakDuration * slowdownMult * roughPeakMult;
    const effectiveSpawnInterval = this.state.difficultySettings.waveSpawnInterval * slowdownMult;

    // Update waves
    const { missed } = this.waveSystem.update(
      this.state, dt, shouldMoveWaves, effectivePeakDuration, effectiveSpawnInterval
    );

    // Handle missed waves
    if (missed > 0) {
      this.state.wavesMissed += missed;
      this.checkMissedLoseCondition();
    }

    // Collision detection
    const { newTouches, isTouchingWater, isTouchingSpike } = this.collisionSystem.update(this.state);

    // Handle touches
    if (newTouches > 0) {
      this.state.wavesTouched += newTouches;
      this.checkWinCondition();
    }

    // Water timer
    const timerExpired = this.waterTimerSystem.update(
      this.state, dt, isTouchingWater, isTouchingSpike
    );
    if (timerExpired) {
      this.state.gameOverReason = "timer";
      this.state.gameState = "roguelikeGameOver";
      this.stopLevel();
    }

    // Sync to store every frame
    this.syncToStore();
  }

  private render(_interpolation: number): void {
    if (this.renderer) {
      this.renderer.render(this.state);
    }
  }

  // ─── Input Handling ─────────────────────────────────────────────────────

  private handleInput(action: InputAction): void {
    if (this.state.gameState !== "playing") return;

    switch (action.type) {
      case "moveUp":
        this.playerSystem.moveUp(this.state);
        break;
      case "moveDown":
        this.playerSystem.moveDown(this.state);
        break;
      case "toeTapStart":
        if (!this.state.autoToeTap) {
          this.state.isTapping = true;
        }
        break;
      case "toeTapEnd":
        if (!this.state.autoToeTap) {
          this.state.isTapping = false;
        }
        break;
      case "activateAbility":
        // Phase 2: ability activation
        break;
      case "flashlight":
        // Phase 3: flashlight activation
        break;
      case "devSuperWave":
        // Dev tool
        break;
    }
  }

  // ─── Win/Lose Conditions ────────────────────────────────────────────────

  private checkWinCondition(): void {
    if (this.state.wavesTouched >= this.state.wavesToWin) {
      this.state.levelScore = this.scoreSystem.calculateLevelScore(this.state);
      this.state.totalScore += this.state.levelScore;
      this.state.gameState = "levelComplete";
      this.stopLevel();
    }
  }

  private checkMissedLoseCondition(): void {
    const maxMissed = this.state.wavesToLose;
    if (this.state.wavesMissed >= maxMissed) {
      this.state.gameOverReason = "missed";
      this.state.gameState = "roguelikeGameOver";
      this.stopLevel();
    }
  }

  // ─── Store Sync ─────────────────────────────────────────────────────────

  private syncToStore(): void {
    useGameStore.getState().syncFromEngine({
      gameState: this.state.gameState,
      feetPosition: this.state.feetPosition,
      isTapping: this.state.isTapping,
      momentumGear: this.state.momentumGear,
      waves: [...this.state.waves], // Shallow copy for immutability
      wavesTouched: this.state.wavesTouched,
      wavesMissed: this.state.wavesMissed,
      waterTimer: this.state.waterTimer,
      maxWaterTimer: this.state.maxWaterTimer,
      wavesToWin: this.state.wavesToWin,
      wavesToLose: this.state.wavesToLose,
      gameOverReason: this.state.gameOverReason,
      roguelikeLevel: this.state.roguelikeLevel,
      levelScore: this.state.levelScore,
      totalScore: this.state.totalScore,
      elapsedTime: this.state.elapsedTime,
    });
  }

  // ─── Public Accessors ───────────────────────────────────────────────────

  getState(): WorldState {
    return this.state;
  }

  getInputSystem(): InputSystem {
    return this.inputSystem;
  }
}
