import type { AbilityType } from "../core/types";
import { ABILITY_KEYS } from "../data/constants";

export type InputAction =
  | { type: "moveUp" }
  | { type: "moveDown" }
  | { type: "toeTapStart" }
  | { type: "toeTapEnd" }
  | { type: "activateAbility"; slot: number }
  | { type: "flashlight" }
  | { type: "devSuperWave" };

type InputCallback = (action: InputAction) => void;

/**
 * InputSystem: Keyboard + touch input abstraction.
 * Translates raw DOM events into game actions.
 * Handles key repeat for held movement keys (standard mode).
 */
export class InputSystem {
  private callback: InputCallback;
  private moveUpInterval: ReturnType<typeof setInterval> | null = null;
  private moveDownInterval: ReturnType<typeof setInterval> | null = null;
  private keyHeld = { up: false, down: false };
  private isMomentumMode = false;
  private enabled = false;

  // Bound handlers for cleanup
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;

  constructor(callback: InputCallback) {
    this.callback = callback;
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
  }

  setMomentumMode(momentum: boolean): void {
    this.isMomentumMode = momentum;
  }

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
  }

  disable(): void {
    this.enabled = false;
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
    this.clearIntervals();
    this.keyHeld = { up: false, down: false };
  }

  destroy(): void {
    this.disable();
  }

  // ─── Touch/Mobile helpers (called from React) ───────────────────────────

  startMoveUp(): void {
    this.callback({ type: "moveUp" });
    if (!this.isMomentumMode) {
      this.clearMoveUpInterval();
      this.moveUpInterval = setInterval(() => this.callback({ type: "moveUp" }), 100);
    }
  }

  stopMoveUp(): void {
    this.clearMoveUpInterval();
  }

  startMoveDown(): void {
    this.callback({ type: "moveDown" });
    if (!this.isMomentumMode) {
      this.clearMoveDownInterval();
      this.moveDownInterval = setInterval(() => this.callback({ type: "moveDown" }), 100);
    }
  }

  stopMoveDown(): void {
    this.clearMoveDownInterval();
  }

  // ─── Private ────────────────────────────────────────────────────────────

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;

    // Dev ability: Shift+Q
    if (e.shiftKey && (e.key === "q" || e.key === "Q")) {
      this.callback({ type: "devSuperWave" });
      return;
    }

    const isUpKey = e.key === "ArrowUp" || e.key === "w" || e.key === "W";
    const isDownKey = e.key === "ArrowDown" || e.key === "s" || e.key === "S";

    if (isUpKey || isDownKey) {
      e.preventDefault();
    }

    if (isUpKey && !this.keyHeld.up) {
      this.keyHeld.up = true;
      this.callback({ type: "moveUp" });
      if (!this.isMomentumMode) {
        this.moveUpInterval = setInterval(() => this.callback({ type: "moveUp" }), 100);
      }
    } else if (isDownKey && !this.keyHeld.down) {
      this.keyHeld.down = true;
      this.callback({ type: "moveDown" });
      if (!this.isMomentumMode) {
        this.moveDownInterval = setInterval(() => this.callback({ type: "moveDown" }), 100);
      }
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      this.callback({ type: "toeTapStart" });
    } else if (e.key === "f" || e.key === "F") {
      this.callback({ type: "flashlight" });
    } else {
      const keyUpper = e.key.toUpperCase();
      const keyIndex = (ABILITY_KEYS as readonly string[]).indexOf(keyUpper);
      if (keyIndex >= 0) {
        this.callback({ type: "activateAbility", slot: keyIndex });
      }
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    const isUpKey = e.key === "ArrowUp" || e.key === "w" || e.key === "W";
    const isDownKey = e.key === "ArrowDown" || e.key === "s" || e.key === "S";

    if (isUpKey) {
      this.keyHeld.up = false;
      this.clearMoveUpInterval();
    } else if (isDownKey) {
      this.keyHeld.down = false;
      this.clearMoveDownInterval();
    } else if (e.key === " " || e.key === "Enter") {
      this.callback({ type: "toeTapEnd" });
    }
  }

  private clearMoveUpInterval(): void {
    if (this.moveUpInterval !== null) {
      clearInterval(this.moveUpInterval);
      this.moveUpInterval = null;
    }
  }

  private clearMoveDownInterval(): void {
    if (this.moveDownInterval !== null) {
      clearInterval(this.moveDownInterval);
      this.moveDownInterval = null;
    }
  }

  private clearIntervals(): void {
    this.clearMoveUpInterval();
    this.clearMoveDownInterval();
  }
}
