import { Grid } from "../engine/core/Grid";
import { COLORS } from "./colors";
import type { WorldState } from "../engine/core/types";
import { OceanLayer } from "./layers/OceanLayer";
import { BeachLayer } from "./layers/BeachLayer";
import { WaveLayer } from "./layers/WaveLayer";
import { PlayerLayer } from "./layers/PlayerLayer";
import { EffectsLayer } from "./layers/EffectsLayer";

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
  private effectsLayer: EffectsLayer;

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
    this.effectsLayer = new EffectsLayer();
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
    this.effectsLayer.render(ctx, state);
  }

  /**
   * Render the static grid (ocean + sand) without any game state.
   * Used for the initial setup/preview before gameplay starts.
   */
  renderStatic(): void {
    const { ctx } = this;
    const cellSize = Grid.CELL_SIZE;

    // Ocean gradient
    const oceanH = Grid.OCEAN_ROWS * cellSize;
    const grad = ctx.createLinearGradient(0, 0, 0, oceanH);
    grad.addColorStop(0, "hsl(200, 70%, 25%)");
    grad.addColorStop(0.7, COLORS.ocean);
    grad.addColorStop(1, "hsl(200, 60%, 45%)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, Grid.WIDTH * cellSize, oceanH);

    // Beach gradient
    const beachY = oceanH;
    const beachH = Grid.BEACH_ROWS * cellSize;
    const sandGrad = ctx.createLinearGradient(0, beachY, 0, beachY + beachH);
    sandGrad.addColorStop(0, COLORS.sandDark);
    sandGrad.addColorStop(0.3, COLORS.sand);
    sandGrad.addColorStop(1, COLORS.sandDarker);
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, beachY, Grid.WIDTH * cellSize, beachH);

    // Shoreline foam
    ctx.fillStyle = "hsla(180, 80%, 80%, 0.4)";
    ctx.fillRect(0, oceanH - 2, Grid.WIDTH * cellSize, 2);
  }

  destroy(): void {
    // Clean up if needed
  }
}
