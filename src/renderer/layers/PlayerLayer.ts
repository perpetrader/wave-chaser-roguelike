import { Grid } from "../../engine/core/Grid";
import { COLORS } from "../colors";
import type { WorldState } from "../../engine/core/types";
import { FEET_WIDTH, FEET_HEIGHT, FEET_COL } from "../../engine/data/constants";

export class PlayerLayer {
  render(ctx: CanvasRenderingContext2D, state: WorldState): void {
    const cellSize = Grid.CELL_SIZE;
    const feetRow = Math.floor(state.feetPosition);
    const feetX = FEET_COL * cellSize;
    const feetY = feetRow * cellSize;
    const feetW = FEET_WIDTH * cellSize;
    const feetH = FEET_HEIGHT * cellSize;

    // Determine feet color based on active abilities/states
    let feetColor = COLORS.feet;

    // TODO Phase 2: Priority coloring based on active abilities
    // For now, just use base or touching color
    const isTouchingWave = state.waves.some(wave => {
      const waveRow = Math.floor(wave.row);
      return waveRow >= feetRow && waveRow < feetRow + FEET_HEIGHT;
    });

    if (isTouchingWave) {
      feetColor = COLORS.feetTouching;
    }

    // Draw feet outline
    ctx.fillStyle = COLORS.feetOutline;
    ctx.fillRect(feetX - 1, feetY - 1, feetW + 2, feetH + 2);

    // Draw feet
    ctx.fillStyle = feetColor;
    ctx.fillRect(feetX, feetY, feetW, feetH);
  }
}
