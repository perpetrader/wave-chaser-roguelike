import { GameLoop } from "./core/GameLoop";
import type {
  WorldState,
  AbilityType,
  PermanentUpgradeType,
} from "./core/types";
import { WaveSystem } from "./systems/WaveSystem";
import { PlayerSystem } from "./systems/PlayerSystem";
import { CollisionSystem } from "./systems/CollisionSystem";
import { WaterTimerSystem } from "./systems/WaterTimerSystem";
import { ScoreSystem } from "./systems/ScoreSystem";
import { AbilitySystem } from "./systems/AbilitySystem";
import { BeachEffectSystem } from "./systems/BeachEffectSystem";
import { ProgressionSystem, type UpgradeOptions } from "./systems/ProgressionSystem";
import { InputSystem, type InputAction } from "./systems/InputSystem";
import { CanvasRenderer } from "../renderer/CanvasRenderer";
import { createDefaultWorldState, useGameStore } from "../store/gameStore";
import { getRoguelikeLevelSettings } from "./data/difficulties";
import { BEACH_EFFECTS } from "./data/beachEffects";

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
  private waveSystem = new WaveSystem();
  private playerSystem = new PlayerSystem();
  private collisionSystem = new CollisionSystem();
  private waterTimerSystem = new WaterTimerSystem();
  private scoreSystem = new ScoreSystem();
  private abilitySystem = new AbilitySystem();
  private beachEffectSystem = new BeachEffectSystem();
  private progressionSystem = new ProgressionSystem();
  private inputSystem: InputSystem;

  // Wave movement accumulator
  private waveMovementAccumulator = 0;

  // Quicksand: track last feet position to detect movement
  private lastFeetPosition = 0;

  constructor() {
    this.state = createDefaultWorldState();
    this.inputSystem = new InputSystem(this.handleInput.bind(this));
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
    this.state.waveSurferShield = 0;
    this.state.waveSurferQueued = false;
    this.waveMovementAccumulator = 0;
    this.lastFeetPosition = 35;

    // Reset ability active states (keep cooldowns)
    for (const ability of this.state.selectedAbilities) {
      const s = this.state.abilityStates[ability];
      s.active = false;
      s.durationRemaining = 0;
    }

    // Apply boss beach effect if pending
    if (this.state.pendingBeachEffect && level % 5 === 0) {
      this.state.currentBeachEffect = this.state.pendingBeachEffect;
      this.state.beachEffectLevel = 5;
      this.state.usedBeachEffects.push(this.state.pendingBeachEffect);
      this.state.pendingBeachEffect = null;
    } else if (level % 5 !== 0) {
      this.state.currentBeachEffect = null;
      this.state.beachEffectLevel = 1;
    }

    // Reset beach effect substates
    this.beachEffectSystem.resetSubstates(this.state);

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

  // ─── Progression Methods (called from React UI) ─────────────────────────

  getUpgradeOptions(): UpgradeOptions {
    return this.progressionSystem.getUpgradeOptions(this.state);
  }

  unlockAbility(type: AbilityType): void {
    this.progressionSystem.unlockAbility(this.state, type);
    this.syncToStore();
  }

  upgradeAbility(type: AbilityType): void {
    this.progressionSystem.upgradeAbility(this.state, type);
    this.syncToStore();
  }

  addWaterTimeBonus(amount: number): void {
    this.progressionSystem.addWaterTimeBonus(this.state, amount);
    this.syncToStore();
  }

  addWavesMissedBonus(): void {
    this.progressionSystem.addWavesMissedBonus(this.state);
    this.syncToStore();
  }

  applyPermanentUpgrade(type: PermanentUpgradeType): void {
    this.progressionSystem.applyPermanentUpgrade(this.state, type);
    this.syncToStore();
  }

  selectAbilities(abilities: AbilityType[]): void {
    this.state.selectedAbilities = abilities.slice(0, 4);
    this.syncToStore();
  }

  proceedToNextLevel(): void {
    const nextLevel = this.state.roguelikeLevel + 1;
    // Roll boss beach effect for the next level
    this.progressionSystem.rollBossBeachEffect(this.state);
    this.startLevel(nextLevel);
  }

  // ─── Game Loop ──────────────────────────────────────────────────────────

  private update(dt: number): void {
    if (this.state.gameState !== "playing") return;

    this.state.elapsedTime += dt;

    // Track position for quicksand
    const prevPosition = this.state.feetPosition;

    // Update player momentum
    this.playerSystem.updateMomentum(this.state, dt);

    // Update abilities (tick durations and cooldowns)
    this.abilitySystem.update(this.state, dt);

    // Update beach effects
    this.beachEffectSystem.update(this.state, dt);

    // Quicksand: detect movement
    if (this.state.feetPosition !== prevPosition) {
      this.beachEffectSystem.onPlayerMoved(this.state);
    } else {
      this.beachEffectSystem.onPlayerStill(this.state, dt);
    }

    // Calculate effective wave speed
    const slowdownMult = this.state.abilityStates.slowdown.active ? 2.5 : 1;
    let roughSpeedMult = 1;
    if (this.state.currentBeachEffect === "roughWaters") {
      const lvl = this.state.beachEffectLevel;
      const mults = [1 / 1.20, 1 / 1.30, 1 / 1.40, 1 / 1.50, 1 / 1.75];
      const idx = Math.min(lvl - 1, 4);
      roughSpeedMult = mults[idx];
    }
    const effectiveWaveSpeed = this.state.difficultySettings.waveSpeed * slowdownMult * roughSpeedMult;

    // Wave movement accumulator
    this.waveMovementAccumulator += dt;
    const shouldMoveWaves = this.waveMovementAccumulator >= effectiveWaveSpeed;
    if (shouldMoveWaves) {
      this.waveMovementAccumulator -= effectiveWaveSpeed;
    }

    // Effective peak duration and spawn interval
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

    if (missed > 0) {
      this.state.wavesMissed += missed;
      this.checkMissedLoseCondition();
    }

    // Collision detection
    const { newTouches, isTouchingWater, isTouchingSpike } = this.collisionSystem.update(this.state);

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
    this.renderer?.render(this.state);
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
        this.abilitySystem.activateBySlot(this.state, action.slot);
        break;
      case "flashlight":
        this.beachEffectSystem.activateFlashlight(this.state);
        break;
      case "devSuperWave":
        // Dev tool — handled in Phase 3+
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
      this.progressionSystem.rollBossBeachEffect(this.state);
      this.syncToStore();
    }
  }

  private checkMissedLoseCondition(): void {
    if (this.state.wavesMissed >= this.state.wavesToLose) {
      this.state.gameOverReason = "missed";
      this.state.gameState = "roguelikeGameOver";
      this.stopLevel();
    }
  }

  // ─── Store Sync ─────────────────────────────────────────────────────────

  private syncToStore(): void {
    const s = this.state;
    useGameStore.getState().syncFromEngine({
      gameState: s.gameState,
      feetPosition: s.feetPosition,
      isTapping: s.isTapping,
      momentumGear: s.momentumGear,
      waves: [...s.waves],
      wavesTouched: s.wavesTouched,
      wavesMissed: s.wavesMissed,
      waterTimer: s.waterTimer,
      maxWaterTimer: s.maxWaterTimer,
      wavesToWin: s.wavesToWin,
      wavesToLose: s.wavesToLose,
      gameOverReason: s.gameOverReason,
      roguelikeLevel: s.roguelikeLevel,
      levelScore: s.levelScore,
      totalScore: s.totalScore,
      elapsedTime: s.elapsedTime,
      // Phase 2: new fields
      selectedAbilities: [...s.selectedAbilities],
      unlockedAbilities: s.unlockedAbilities.map((a) => ({ ...a })),
      abilityStates: { ...s.abilityStates },
      currentBeachEffect: s.currentBeachEffect,
      beachEffectLevel: s.beachEffectLevel,
      pendingBeachEffect: s.pendingBeachEffect,
      permanentUpgrades: { ...s.permanentUpgrades },
      waterTimeBonus: s.waterTimeBonus,
      wavesMissedBonus: s.wavesMissedBonus,
      fishNetStuck: s.fishNetStuck,
      flashlightActive: s.flashlightActive,
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
