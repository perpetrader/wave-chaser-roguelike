import { Grid } from "../../engine/core/Grid";
import { COLORS } from "../colors";
import type { WorldState } from "../../engine/core/types";

export class BeachLayer {
  render(ctx: CanvasRenderingContext2D, state: WorldState): void {
    const cellSize = Grid.CELL_SIZE;
    const startY = Grid.OCEAN_ROWS * cellSize;
    const width = Grid.WIDTH * cellSize;
    const height = Grid.BEACH_ROWS * cellSize;

    ctx.fillStyle = COLORS.sand;
    ctx.fillRect(0, startY, width, height);

    // TODO Phase 2: Crystal ball indicator (dark sand line at upcoming wave's maxReach)
  }
}
