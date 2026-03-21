import type {
  WorldState,
  AbilityType,
  UnlockedAbility,
  PermanentUpgradeType,
} from "../core/types";
import {
  MAX_PERMANENT_UPGRADES,
  ROGUELIKE_BASE_DURATIONS,
  UPGRADE_INCREMENTS_MS,
} from "../data/constants";
import { BEACH_EFFECTS } from "../data/beachEffects";

// ─── Tier Pools ───────────────────────────────────────────────────────────────

const BASE_POOL: AbilityType[] = ["superTap", "ghostToe", "jumpAround", "waveMagnet", "waveSurfer"];
const TIER_2_POOL: AbilityType[] = ["crystalBall", "towelOff", "wetsuit"];
const TIER_3_POOL: AbilityType[] = ["doubleDip", "slowdown"];

// ─── Level Rules ──────────────────────────────────────────────────────────────

/** Levels where the player can unlock a NEW ability */
function isUnlockLevel(level: number): boolean {
  if (level <= 9) return level % 2 === 1; // 1, 3, 5, 7, 9
  return [12, 15, 18].includes(level);
}

/** Levels that ONLY offer unlocks (no upgrade option) */
function isUnlockOnlyLevel(level: number): boolean {
  return [3, 7, 9, 12, 18].includes(level);
}

/** Levels that offer a water time bonus */
function isWaterTimeBonusLevel(level: number): boolean {
  return [8, 11, 14, 17].includes(level) || (level >= 20 && (level - 20) % 3 === 0);
}

/** Levels that offer a waves missed bonus */
function isWavesMissedBonusLevel(level: number): boolean {
  return level >= 15 && level % 5 === 0;
}

/** Levels that offer permanent upgrades (boss beaches) */
function isPermanentUpgradeLevel(level: number): boolean {
  return level >= 5 && level % 5 === 0;
}

/** Is this a boss beach level? */
function isBossLevel(level: number): boolean {
  return level % 5 === 0;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export interface UpgradeOptions {
  /** New abilities available to unlock */
  newAbilities: AbilityType[];
  /** Existing abilities available to upgrade */
  upgradeableAbilities: UnlockedAbility[];
  /** Whether a water time bonus is available */
  hasWaterTimeBonus: boolean;
  /** Water time bonus amount (ms) */
  waterTimeBonusAmount: number;
  /** Whether a waves missed bonus is available */
  hasWavesMissedBonus: boolean;
  /** Whether permanent upgrades are available */
  hasPermanentUpgrades: boolean;
  /** Available permanent upgrade types */
  permanentUpgradeTypes: PermanentUpgradeType[];
  /** Whether the player needs to select 4 abilities from their pool */
  needsAbilitySelection: boolean;
  /** Pending boss beach effect for next level */
  pendingBossEffect: AbilityType | null;
}

/**
 * ProgressionSystem: Determines what upgrade options to show after each level.
 */
export class ProgressionSystem {
  /**
   * Get the upgrade options for the current level.
   */
  getUpgradeOptions(state: WorldState): UpgradeOptions {
    const level = state.roguelikeLevel;
    const nextLevel = level + 1;

    // ─── New ability unlocks ──────────────────────────────────────────────
    let newAbilities: AbilityType[] = [];
    if (isUnlockLevel(level) && level <= 20) {
      const alreadyUnlocked = state.unlockedAbilities.map((a) => a.type);
      const excluded = state.excludedAbilities;
      const available = this.getAvailablePool(level)
        .filter((a) => !alreadyUnlocked.includes(a) && !excluded.includes(a));
      // Pick 2 random
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      newAbilities = shuffled.slice(0, 2);
    }

    // ─── Upgrade existing abilities ───────────────────────────────────────
    let upgradeableAbilities: UnlockedAbility[] = [];
    if (!isUnlockOnlyLevel(level) && level > 1 && !isBossLevel(level)) {
      upgradeableAbilities = state.unlockedAbilities
        .filter((a) => a.upgradeCount < 10)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    }

    // ─── Water time bonus ─────────────────────────────────────────────────
    const hasWaterTimeBonus = isWaterTimeBonusLevel(level) && !isBossLevel(level);
    let waterTimeBonusAmount = 300;
    if (level >= 30) waterTimeBonusAmount = 100;
    else if (level >= 20) waterTimeBonusAmount = 200;

    // ─── Waves missed bonus ───────────────────────────────────────────────
    const hasWavesMissedBonus = isWavesMissedBonusLevel(level);

    // ─── Permanent upgrades (boss levels) ─────────────────────────────────
    const hasPermanentUpgrades = isPermanentUpgradeLevel(level);
    const permanentUpgradeTypes: PermanentUpgradeType[] = [];
    if (hasPermanentUpgrades) {
      if (state.permanentUpgrades.fastFeet < MAX_PERMANENT_UPGRADES) {
        permanentUpgradeTypes.push("fastFeet");
      }
      if (state.permanentUpgrades.tapDancer < MAX_PERMANENT_UPGRADES) {
        permanentUpgradeTypes.push("tapDancer");
      }
      if (state.permanentUpgrades.wetShoes < MAX_PERMANENT_UPGRADES) {
        permanentUpgradeTypes.push("wetShoes");
      }
    }

    // ─── Ability selection needed? ────────────────────────────────────────
    const needsAbilitySelection = state.unlockedAbilities.length > 4 &&
      state.selectedAbilities.length < 4;

    return {
      newAbilities,
      upgradeableAbilities,
      hasWaterTimeBonus,
      waterTimeBonusAmount,
      hasWavesMissedBonus,
      hasPermanentUpgrades,
      permanentUpgradeTypes,
      needsAbilitySelection,
      pendingBossEffect: null,
    };
  }

  /**
   * Get the ability pool available at a given level.
   */
  getAvailablePool(level: number): AbilityType[] {
    let pool = [...BASE_POOL];
    if (level >= 6) pool.push(...TIER_2_POOL);
    if (level >= 10) pool.push(...TIER_3_POOL);
    return pool;
  }

  /**
   * Determine the beach effect for a boss level.
   */
  rollBossBeachEffect(state: WorldState): void {
    if (!isBossLevel(state.roguelikeLevel + 1)) {
      state.pendingBeachEffect = null;
      return;
    }

    const allTypes = BEACH_EFFECTS.map((e) => e.type);
    let available = allTypes.filter((e) => !state.usedBeachEffects.includes(e));
    if (available.length === 0) {
      available = allTypes;
      state.usedBeachEffects = [];
    }

    const idx = Math.floor(Math.random() * available.length);
    state.pendingBeachEffect = available[idx];
  }

  /**
   * Apply an ability unlock.
   */
  unlockAbility(state: WorldState, type: AbilityType): void {
    state.unlockedAbilities.push({ type, upgradeCount: 0 });
    // Auto-select if fewer than 4
    if (state.selectedAbilities.length < 4) {
      state.selectedAbilities.push(type);
    }
  }

  /**
   * Apply an ability upgrade.
   */
  upgradeAbility(state: WorldState, type: AbilityType): void {
    const ability = state.unlockedAbilities.find((a) => a.type === type);
    if (ability && ability.upgradeCount < 10) {
      ability.upgradeCount++;
    }
  }

  /**
   * Apply a water time bonus.
   */
  addWaterTimeBonus(state: WorldState, amount: number): void {
    state.waterTimeBonus += amount;
  }

  /**
   * Apply a waves missed bonus.
   */
  addWavesMissedBonus(state: WorldState): void {
    state.wavesMissedBonus++;
  }

  /**
   * Apply a permanent upgrade.
   */
  applyPermanentUpgrade(state: WorldState, type: PermanentUpgradeType): void {
    if (state.permanentUpgrades[type] < MAX_PERMANENT_UPGRADES) {
      state.permanentUpgrades[type]++;
    }
  }
}
