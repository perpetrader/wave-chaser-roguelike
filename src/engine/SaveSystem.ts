import type { WorldState, SavedRun } from "./core/types";
import { SAVE_KEY_ROGUELIKE } from "./data/constants";

/**
 * SaveSystem: Persists and restores roguelike runs to/from localStorage.
 */
export class SaveSystem {
  /**
   * Save the current run state to localStorage.
   * Called when the player pauses/quits mid-run.
   */
  static saveRun(state: WorldState): void {
    const saved: SavedRun = {
      roguelikeLevel: state.roguelikeLevel,
      unlockedAbilities: state.unlockedAbilities.map((a) => ({ ...a })),
      roguelikeTotalWaves: state.roguelikeTotalWaves,
      waterTimeBonus: state.waterTimeBonus,
      wavesMissedBonus: state.wavesMissedBonus,
      lastWavesMissedUpgradeLevel: state.lastWavesMissedUpgradeLevel,
      selectedAbilities: [...state.selectedAbilities],
      usedBeachEffects: [...state.usedBeachEffects],
      currentBeachEffect: state.currentBeachEffect,
      pendingBeachEffect: state.pendingBeachEffect,
      totalScore: state.totalScore,
      permanentUpgrades: { ...state.permanentUpgrades },
      excludedAbilities: [...state.excludedAbilities],
      savedAt: Date.now(),
      runType: state.runType,
      autoToeTap: state.autoToeTap,
      movementMode: state.movementMode,
    };

    try {
      localStorage.setItem(SAVE_KEY_ROGUELIKE, JSON.stringify(saved));
    } catch (e) {
      console.error("Failed to save run:", e);
    }
  }

  /**
   * Load a saved run from localStorage.
   * Returns null if no saved run exists.
   */
  static loadRun(): SavedRun | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY_ROGUELIKE);
      if (!raw) return null;
      return JSON.parse(raw) as SavedRun;
    } catch {
      return null;
    }
  }

  /**
   * Apply a saved run to the world state.
   * Restores all progression state so the player can resume.
   */
  static applyToState(state: WorldState, saved: SavedRun): void {
    state.roguelikeLevel = saved.roguelikeLevel;
    state.unlockedAbilities = saved.unlockedAbilities;
    state.roguelikeTotalWaves = saved.roguelikeTotalWaves;
    state.waterTimeBonus = saved.waterTimeBonus;
    state.wavesMissedBonus = saved.wavesMissedBonus;
    state.lastWavesMissedUpgradeLevel = saved.lastWavesMissedUpgradeLevel;
    state.selectedAbilities = saved.selectedAbilities;
    state.usedBeachEffects = saved.usedBeachEffects;
    state.currentBeachEffect = saved.currentBeachEffect;
    state.pendingBeachEffect = saved.pendingBeachEffect;
    state.totalScore = saved.totalScore;
    state.permanentUpgrades = saved.permanentUpgrades;
    state.excludedAbilities = saved.excludedAbilities;

    if (saved.runType) state.runType = saved.runType;
    if (saved.autoToeTap !== undefined) state.autoToeTap = saved.autoToeTap;
    if (saved.movementMode) state.movementMode = saved.movementMode;
  }

  /**
   * Delete the saved run from localStorage.
   */
  static deleteSave(): void {
    try {
      localStorage.removeItem(SAVE_KEY_ROGUELIKE);
    } catch { /* ignore */ }
  }

  /**
   * Check if a saved run exists.
   */
  static hasSave(): boolean {
    try {
      return !!localStorage.getItem(SAVE_KEY_ROGUELIKE);
    } catch {
      return false;
    }
  }
}
