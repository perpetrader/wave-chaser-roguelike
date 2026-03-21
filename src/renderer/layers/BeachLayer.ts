import { Grid } from "../../engine/core/Grid";
import { COLORS } from "../colors";
import type { WorldState } from "../../engine/core/types";

export class BeachLayer {
  render(ctx: CanvasRenderingContext2D, state: WorldState): void {
    const cellSize = Grid.CELL_SIZE;
    const startY = Grid.OCEAN_ROWS * cellSize;
    const width = Grid.WIDTH * cellSize;
    const beachRows = Grid.BEACH_ROWS;

    // Sand gradient: lighter near shore, slightly darker further back
    const grad = ctx.createLinearGradient(0, startY, 0, startY + beachRows * cellSize);
    grad.addColorStop(0, COLORS.sandDark);
    grad.addColorStop(0.3, COLORS.sand);
    grad.addColorStop(1, COLORS.sandDarker);
    ctx.fillStyle = grad;
    ctx.fillRect(0, startY, width, beachRows * cellSize);

    // Subtle sand texture: thin horizontal lines
    ctx.strokeStyle = "hsla(42, 30%, 60%, 0.2)";
    ctx.lineWidth = 1;
    for (let row = 0; row < beachRows; row += 2) {
      const y = startY + row * cellSize + cellSize / 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Crystal Ball indicator: dark sand line at upcoming wave's maxReach
    if (state.abilityStates?.crystalBall?.active) {
      // Show where the next wave will peak
      const lastMax = state.lastWaveMaxReach ?? 35;
      const indicatorY = lastMax * cellSize;
      ctx.fillStyle = COLORS.sandCrystalBall;
      ctx.fillRect(0, indicatorY, width, cellSize / 2);
      // Cyan glow
      ctx.shadowColor = "hsl(180, 80%, 50%)";
      ctx.shadowBlur = 12;
      ctx.fillRect(0, indicatorY, width, cellSize / 2);
      ctx.shadowBlur = 0;
    }
  }
}
