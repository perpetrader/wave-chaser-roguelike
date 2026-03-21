import { Grid } from "../../engine/core/Grid";
import { COLORS } from "../colors";
import type { WorldState } from "../../engine/core/types";
import {
  OCEAN_HEIGHT,
  OCEAN_WIDTH,
  FEET_COL,
  FLASHLIGHT_ROWS_BOSS,
  FLASHLIGHT_ROWS_REDUCED,
} from "../../engine/data/constants";

/**
 * EffectsLayer: Draws overlays for nighttime, flashlight, beach people,
 * fish net stuck indicator, and the momentum gear meter.
 */
export class EffectsLayer {
  render(ctx: CanvasRenderingContext2D, state: WorldState): void {
    // Beach people (Busy Beach)
    if (state.currentBeachEffect === "busyBeach") {
      this.renderBeachPeople(ctx, state);
    }

    // Fish net stuck flash
    if (state.fishNetStuck) {
      this.renderFishNetOverlay(ctx, state);
    }

    // Nighttime darkness + flashlight
    if (state.currentBeachEffect === "nighttime") {
      this.renderNighttime(ctx, state);
    }

    // Momentum gear meter
    if (state.movementMode === "momentum") {
      this.renderGearMeter(ctx, state);
    }
  }

  // ─── Beach People ──────────────────────────────────────────────────

  private renderBeachPeople(ctx: CanvasRenderingContext2D, state: WorldState): void {
    const cellSize = Grid.CELL_SIZE;

    for (const person of state.beachPeople) {
      const x = person.col * cellSize;
      const y = person.row * cellSize;

      // Simple colored square with outline
      ctx.fillStyle = COLORS.beachPersonOutline;
      ctx.fillRect(x - 1, y - 1, cellSize + 2, cellSize + 2);
      ctx.fillStyle = COLORS.beachPerson;
      ctx.fillRect(x, y, cellSize, cellSize);
    }
  }

  // ─── Fish Net ──────────────────────────────────────────────────────

  private renderFishNetOverlay(ctx: CanvasRenderingContext2D, _state: WorldState): void {
    const cellSize = Grid.CELL_SIZE;
    const width = Grid.WIDTH * cellSize;
    const height = (Grid.OCEAN_ROWS + Grid.BEACH_ROWS) * cellSize;

    // Pulsing brown-orange overlay
    ctx.fillStyle = COLORS.fishNetOverlay;
    ctx.fillRect(0, 0, width, height);

    // Net pattern: diagonal lines
    ctx.strokeStyle = "hsla(30, 60%, 40%, 0.25)";
    ctx.lineWidth = 2;
    for (let i = -height; i < width + height; i += cellSize * 2) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i + height, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
  }

  // ─── Nighttime ─────────────────────────────────────────────────────

  private renderNighttime(ctx: CanvasRenderingContext2D, state: WorldState): void {
    const cellSize = Grid.CELL_SIZE;
    const width = Grid.WIDTH * cellSize;
    const totalHeight = (Grid.OCEAN_ROWS + Grid.BEACH_ROWS) * cellSize;

    if (!state.flashlightActive) {
      // Full darkness
      ctx.fillStyle = "rgba(10, 10, 30, 0.92)";
      ctx.fillRect(0, 0, width, totalHeight);
      return;
    }

    // Flashlight active: darkness with a cone cut out
    const isBoss = state.beachEffectLevel >= 5;
    const flashlightRows = isBoss ? FLASHLIGHT_ROWS_BOSS : FLASHLIGHT_ROWS_REDUCED;

    // Flashlight position: centered on feet, shining toward shore (up)
    const feetCenterX = (FEET_COL + 1) * cellSize; // Center of feet
    const feetY = state.feetPosition * cellSize;

    // Draw darkness as a full overlay, then clear the flashlight cone
    ctx.save();

    // Full dark overlay
    ctx.fillStyle = "rgba(10, 10, 30, 0.92)";
    ctx.fillRect(0, 0, width, totalHeight);

    // Clear the cone using destination-out compositing
    ctx.globalCompositeOperation = "destination-out";

    // Cone: starts at feet width, expands toward shore
    const coneStartWidth = 2 * cellSize; // Width at feet
    const coneEndWidth = (2 + flashlightRows) * cellSize; // Width at far end
    const coneTop = Math.max(0, feetY - flashlightRows * cellSize);

    const grad = ctx.createRadialGradient(
      feetCenterX, feetY, coneStartWidth / 2,
      feetCenterX, feetY, flashlightRows * cellSize
    );
    grad.addColorStop(0, "rgba(255, 255, 255, 1)");
    grad.addColorStop(0.7, "rgba(255, 255, 255, 0.6)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(feetCenterX - coneStartWidth / 2, feetY);
    ctx.lineTo(feetCenterX - coneEndWidth / 2, coneTop);
    ctx.lineTo(feetCenterX + coneEndWidth / 2, coneTop);
    ctx.lineTo(feetCenterX + coneStartWidth / 2, feetY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Flashlight glow tint (warm light in the cone area)
    ctx.fillStyle = COLORS.flashlightGlow;
    ctx.beginPath();
    ctx.moveTo(feetCenterX - coneStartWidth / 2, feetY);
    ctx.lineTo(feetCenterX - coneEndWidth / 2, coneTop);
    ctx.lineTo(feetCenterX + coneEndWidth / 2, coneTop);
    ctx.lineTo(feetCenterX + coneStartWidth / 2, feetY);
    ctx.closePath();
    ctx.fill();
  }

  // ─── Gear Meter (Momentum Mode) ────────────────────────────────────

  private renderGearMeter(ctx: CanvasRenderingContext2D, state: WorldState): void {
    const cellSize = Grid.CELL_SIZE;
    const gear = state.momentumGear;
    const meterX = 4;
    const meterY = (Grid.OCEAN_ROWS + 1) * cellSize;
    const segW = 8;
    const segH = 10;
    const gap = 2;

    // 7 segments: -3, -2, -1, 0, +1, +2, +3 (top to bottom)
    for (let i = -3; i <= 3; i++) {
      const y = meterY + (i + 3) * (segH + gap);
      const isActive = (i < 0 && gear <= i) || (i > 0 && gear >= i) || i === 0;

      if (i < 0) {
        ctx.fillStyle = isActive && gear < 0 ? "hsl(120, 60%, 45%)" : "hsl(0, 0%, 30%)";
      } else if (i > 0) {
        ctx.fillStyle = isActive && gear > 0 ? "hsl(0, 70%, 55%)" : "hsl(0, 0%, 30%)";
      } else {
        ctx.fillStyle = gear === 0 ? "hsl(0, 0%, 70%)" : "hsl(0, 0%, 40%)";
      }

      ctx.fillRect(meterX, y, segW, segH);
    }
  }
}
