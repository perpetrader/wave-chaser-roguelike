import { describe, it, expect } from "vitest";
import { tickAbilityState, shuffleArray } from "./simulation";
import {
  getRoguelikeLevelSettings,
  getSlayBattleSettings,
  ROGUELIKE_BASE_WATER_TIMER,
  type AbilityState,
} from "./constants";
import {
  quicksandPenaltyMultiplier,
  heavySandPenaltyMultiplier,
  gummyToeExtensionMultiplier,
} from "./beachEffectScaling";

describe("tickAbilityState", () => {
  const COOLDOWN = 60000;

  it("returns the same object when idle (identity-preserving)", () => {
    const idle: AbilityState = { active: false, cooldownRemaining: 0 };
    expect(tickAbilityState(idle, 16, COOLDOWN)).toBe(idle);
  });

  it("counts down an active duration", () => {
    const active: AbilityState = { active: true, cooldownRemaining: 0, durationRemaining: 1000 };
    const next = tickAbilityState(active, 100, COOLDOWN);
    expect(next.active).toBe(true);
    expect(next.durationRemaining).toBe(900);
  });

  it("flips to cooldown when the duration expires", () => {
    const expiring: AbilityState = { active: true, cooldownRemaining: 0, durationRemaining: 50 };
    const next = tickAbilityState(expiring, 100, COOLDOWN);
    expect(next).toEqual({ active: false, cooldownRemaining: COOLDOWN, durationRemaining: 0 });
  });

  it("counts a cooldown down to exactly zero without going negative", () => {
    const cooling: AbilityState = { active: false, cooldownRemaining: 80 };
    const next = tickAbilityState(cooling, 100, COOLDOWN);
    expect(next.cooldownRemaining).toBe(0);
  });
});

describe("getRoguelikeLevelSettings", () => {
  it("has the documented level-1 baseline", () => {
    const s = getRoguelikeLevelSettings(1);
    expect(s.wavesToWin).toBe(4);
    expect(s.wavesToLose).toBe(7);
    expect(s.waterTimer).toBe(ROGUELIKE_BASE_WATER_TIMER);
  });

  it("steps +2 waves to win and -1 allowed miss every 5 levels", () => {
    expect(getRoguelikeLevelSettings(5).wavesToWin).toBe(4);
    expect(getRoguelikeLevelSettings(6).wavesToWin).toBe(6);
    expect(getRoguelikeLevelSettings(11).wavesToWin).toBe(8);
    expect(getRoguelikeLevelSettings(6).wavesToLose).toBe(6);
  });

  it("scales speed and timer down monotonically with level", () => {
    const l1 = getRoguelikeLevelSettings(1);
    const l10 = getRoguelikeLevelSettings(10);
    const l20 = getRoguelikeLevelSettings(20);
    expect(l10.settings.waveSpeed).toBeLessThan(l1.settings.waveSpeed);
    expect(l20.settings.waveSpeed).toBeLessThan(l10.settings.waveSpeed);
    expect(l10.waterTimer).toBeLessThan(l1.waterTimer);
    expect(l20.waterTimer).toBeLessThan(l10.waterTimer);
  });
});

describe("getSlayBattleSettings", () => {
  it("requires more waves for harder node types and later acts", () => {
    const beach1 = getSlayBattleSettings(1, "beach");
    const elite1 = getSlayBattleSettings(1, "elite");
    const boss1 = getSlayBattleSettings(1, "boss");
    expect(elite1.wavesToWin).toBeGreaterThan(beach1.wavesToWin);
    expect(boss1.wavesToWin).toBeGreaterThan(elite1.wavesToWin);

    const beach3 = getSlayBattleSettings(3, "beach");
    expect(beach3.wavesToWin).toBeGreaterThan(beach1.wavesToWin);
    expect(beach3.settings.waveSpeed).toBeLessThan(beach1.settings.waveSpeed);
  });

  it("adds the water-time bonus to the battle timer", () => {
    const base = getSlayBattleSettings(1, "beach", 0, 0);
    const bonused = getSlayBattleSettings(1, "beach", 700, 0);
    expect(bonused.waterTimer).toBe(base.waterTimer + 700);
  });

  it("clamps waves-to-lose at a minimum of 1", () => {
    expect(getSlayBattleSettings(3, "boss", 0, -10).wavesToLose).toBe(1);
  });
});

describe("beach effect scaling", () => {
  it("uses reduced tables for leveled modes below level 5 and boss values otherwise", () => {
    expect(quicksandPenaltyMultiplier(1, true)).toBe(0.6);
    expect(quicksandPenaltyMultiplier(5, true)).toBe(0.2);
    expect(quicksandPenaltyMultiplier(1, false)).toBe(0.2);
    expect(heavySandPenaltyMultiplier(4, true)).toBe(0.6);
    expect(heavySandPenaltyMultiplier(2, false)).toBe(0.35);
    expect(gummyToeExtensionMultiplier(1)).toBe(0.6);
    expect(gummyToeExtensionMultiplier(4)).toBe(0.3);
  });
});

describe("shuffleArray", () => {
  it("preserves the elements and does not mutate its input", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const frozen = [...input];
    const out = shuffleArray(input);
    expect(input).toEqual(frozen);
    expect([...out].sort((a, b) => a - b)).toEqual(frozen);
  });
});
