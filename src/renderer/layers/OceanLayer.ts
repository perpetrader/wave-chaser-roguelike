import { Grid } from "../../engine/core/Grid";
import { COLORS } from "../colors";
import type { WorldState } from "../../engine/core/types";

export class OceanLayer {
  render(ctx: CanvasRenderingContext2D, state: WorldState): void {
    const cellSize = Grid.CELL_SIZE;
    const width = Grid.WIDTH * cellSize;
    const oceanRows = Grid.OCEAN_ROWS;
    const slowdownActive = state.abilityStates?.slowdown?.active ?? false;

    // Ocean gradient: darker at top, lighter near shore
    const baseColor = slowdownActive ? COLORS.oceanSlowdown : COLORS.ocean;
    const deepColor = slowdownActive ? "hsl(280, 50%, 25%)" : COLORS.oceanDeep;

    const grad = ctx.createLinearGradient(0, 0, 0, oceanRows * cellSize);
    grad.addColorStop(0, deepColor);
    grad.addColorStop(0.7, baseColor);
    grad.addColorStop(1, slowdownActive ? "hsl(280, 40%, 50%)" : COLORS.oceanLight);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, oceanRows * cellSize);

    // Subtle horizontal wave lines for texture
    ctx.strokeStyle = slowdownActive
      ? "hsla(280, 40%, 55%, 0.15)"
      : "hsla(200, 60%, 55%, 0.15)";
    ctx.lineWidth = 1;
    for (let row = 2; row < oceanRows; row += 3) {
      const y = row * cellSize + cellSize / 2;
      // Slight wave offset based on elapsed time
      const offset = Math.sin((state.elapsedTime ?? 0) / 1500 + row * 0.5) * 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < width; x += 20) {
        const wy = y + Math.sin(x / 30 + offset) * 2;
        ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }

    // Shoreline foam edge (1px bright line at the bottom of ocean)
    ctx.fillStyle = "hsla(180, 80%, 80%, 0.4)";
    ctx.fillRect(0, (oceanRows - 1) * cellSize + cellSize - 2, width, 2);
  }
}
