import { Grid } from "../../engine/core/Grid";
import { COLORS } from "../colors";
import type { WorldState, Wave } from "../../engine/core/types";
import { OCEAN_HEIGHT } from "../../engine/data/constants";

export class WaveLayer {
  render(ctx: CanvasRenderingContext2D, state: WorldState): void {
    const cellSize = Grid.CELL_SIZE;
    const width = Grid.WIDTH * cellSize;
    const shoreY = OCEAN_HEIGHT * cellSize;

    // Sort waves by row so overlapping water renders correctly
    const sorted = [...state.waves].sort((a, b) => a.row - b.row);

    for (const wave of sorted) {
      this.renderWave(ctx, wave, state, cellSize, width, shoreY);
    }
  }

  private renderWave(
    ctx: CanvasRenderingContext2D,
    wave: Wave,
    state: WorldState,
    cellSize: number,
    width: number,
    shoreY: number,
  ): void {
    const waveRow = wave.row;
    if (waveRow < OCEAN_HEIGHT) return; // Still in ocean, not visible on beach

    const waveY = waveRow * cellSize;

    // ─── Water body: from shore to wave position ──────────────────────
    const waterTop = shoreY;
    const waterBottom = waveY + cellSize;
    const waterHeight = waterBottom - waterTop;

    if (waterHeight > 0) {
      // Gradient: deeper near shore, shallower near crest
      const grad = ctx.createLinearGradient(0, waterTop, 0, waterBottom);
      grad.addColorStop(0, "hsla(200, 70%, 40%, 0.7)");
      grad.addColorStop(0.6, "hsla(195, 65%, 50%, 0.5)");
      grad.addColorStop(1, "hsla(190, 60%, 60%, 0.3)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, waterTop, width, waterHeight);
    }

    // ─── Crest line (the leading edge of the wave) ────────────────────
    const crestY = waveY;
    const crestHeight = cellSize;

    // Crest color based on state
    let crestColor: string;
    if (wave.magnetAffected) {
      crestColor = COLORS.crestMagnet;
    } else if (wave.touched) {
      crestColor = COLORS.crestTouched;
    } else {
      crestColor = COLORS.crest;
    }

    // Draw crest with slight glow
    if (!wave.touched || wave.magnetAffected) {
      ctx.shadowColor = crestColor;
      ctx.shadowBlur = wave.magnetAffected ? 10 : 6;
    }

    ctx.fillStyle = crestColor;
    ctx.fillRect(0, crestY, width, crestHeight);

    // Foam line at the very top of the crest (2px bright white)
    ctx.fillStyle = "hsla(180, 100%, 95%, 0.8)";
    ctx.fillRect(0, crestY, width, 2);

    ctx.shadowBlur = 0;

    // ─── Spike indicators ─────────────────────────────────────────────
    if (state.currentBeachEffect === "spikeWaves") {
      const spikeY = crestY + crestHeight;
      const isFlashing = ((state.spikeFlashTimer ?? 0) % 300) < 150;
      ctx.fillStyle = isFlashing ? COLORS.spikeFlash : COLORS.spikeNormal;
      // Half-height spike bar
      ctx.fillRect(0, spikeY, width, cellSize / 2);
      // Spike triangles along the bar
      ctx.fillStyle = isFlashing ? "hsl(0, 0%, 90%)" : "hsl(0, 0%, 75%)";
      for (let x = 0; x < width; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, spikeY + cellSize / 2);
        ctx.lineTo(x + cellSize / 2, spikeY);
        ctx.lineTo(x + cellSize, spikeY + cellSize / 2);
        ctx.fill();
      }
    }
  }
}
