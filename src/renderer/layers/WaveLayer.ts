import { Grid } from "../../engine/core/Grid";
import { COLORS } from "../colors";
import type { WorldState } from "../../engine/core/types";
import { OCEAN_HEIGHT } from "../../engine/data/constants";

export class WaveLayer {
  render(ctx: CanvasRenderingContext2D, state: WorldState): void {
    const cellSize = Grid.CELL_SIZE;
    const width = Grid.WIDTH * cellSize;

    for (const wave of state.waves) {
      const waveRow = Math.floor(wave.row);

      // Draw water coverage: from shore (OCEAN_HEIGHT) to wave position
      if (waveRow >= OCEAN_HEIGHT) {
        ctx.fillStyle = COLORS.water;
        const waterStartY = OCEAN_HEIGHT * cellSize;
        const waterHeight = (waveRow - OCEAN_HEIGHT + 1) * cellSize;
        ctx.fillRect(0, waterStartY, width, waterHeight);
      }

      // Draw crest line
      if (wave.touched) {
        ctx.fillStyle = wave.magnetAffected ? COLORS.crestMagnet : COLORS.crestTouched;
      } else {
        ctx.fillStyle = wave.magnetAffected ? COLORS.crestMagnet : COLORS.crest;
      }
      ctx.fillRect(0, waveRow * cellSize, width, cellSize);
    }
  }
}
