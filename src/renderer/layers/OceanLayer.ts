import { Grid } from "../../engine/core/Grid";
import { COLORS } from "../colors";
import type { WorldState } from "../../engine/core/types";

export class OceanLayer {
  render(ctx: CanvasRenderingContext2D, state: WorldState): void {
    const cellSize = Grid.CELL_SIZE;
    const width = Grid.WIDTH * cellSize;
    const height = Grid.OCEAN_ROWS * cellSize;

    // Check if slowdown ability is active for purple tint
    const slowdownActive = state.abilityStates?.slowdown?.active ?? false;
    ctx.fillStyle = slowdownActive ? COLORS.oceanSlowdown : COLORS.ocean;
    ctx.fillRect(0, 0, width, height);
  }
}
