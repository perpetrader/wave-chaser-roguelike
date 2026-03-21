import { Grid } from "../engine/core/Grid";
import { COLORS } from "./colors";
import type { WorldState } from "../engine/core/types";
import { OceanLayer } from "./layers/OceanLayer";
import { BeachLayer } from "./layers/BeachLayer";
import { WaveLayer } from "./layers/WaveLayer";
import { PlayerLayer } from "./layers/PlayerLayer";

/**
 * Main Canvas 2D renderer.
 * Manages the canvas element and orchestrates layer rendering.
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private oceanLayer: OceanLayer;
  private beachLayer: BeachLayer;
  private waveLayer: WaveLayer;
  private playerLayer: PlayerLayer;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D rendering context");
    this.ctx = ctx;

    // Set logical canvas size (CSS handles scaling)
    this.canvas.width = Grid.canvasWidth();
    this.canvas.height = Grid.canvasHeight();

    // Disable image smoothing for crisp pixel art
    this.ctx.imageSmoothingEnabled = false;

    // Initialize layers
    this.oceanLayer = new OceanLayer();
    this.beachLayer = new BeachLayer();
    this.waveLayer = new WaveLayer();
    this.playerLayer = new PlayerLayer();
  }

  /**
   * Render a single frame using the current world state.
   */
  render(state: WorldState): void {
    const { ctx } = this;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw layers bottom-to-top
    this.oceanLayer.render(ctx, state);
    this.beachLayer.render(ctx, state);
    this.waveLayer.render(ctx, state);
    this.playerLayer.render(ctx, state);

    // TODO: Add in later phases:
    // this.entityLayer.render(ctx, state);   // Beach people, fish net
    // this.effectLayer.render(ctx, state);   // Nighttime, particles
    // this.hudLayer.render(ctx, state);      // Gear meter
  }

  /**
   * Render the static grid (ocean + sand) without any game state.
   * Used for the initial setup/preview before gameplay starts.
   */
  renderStatic(): void {
    const { ctx } = this;
    const cellSize = Grid.CELL_SIZE;

    // Ocean
    ctx.fillStyle = COLORS.ocean;
    ctx.fillRect(0, 0, Grid.WIDTH * cellSize, Grid.OCEAN_ROWS * cellSize);

    // Beach
    ctx.fillStyle = COLORS.sand;
    ctx.fillRect(0, Grid.OCEAN_ROWS * cellSize, Grid.WIDTH * cellSize, Grid.BEACH_ROWS * cellSize);
  }

  destroy(): void {
    // Clean up if needed
  }
}
