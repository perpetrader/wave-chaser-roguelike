/**
 * Game loop using requestAnimationFrame with fixed timestep accumulator.
 * Decouples update rate from render rate for consistent physics.
 */
export class GameLoop {
  private running = false;
  private paused = false;
  private rafId: number | null = null;
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedTimestep: number; // ms per update tick

  private onUpdate: (dt: number) => void;
  private onRender: (interpolation: number) => void;

  constructor(
    onUpdate: (dt: number) => void,
    onRender: (interpolation: number) => void,
    fixedTimestep = 1000 / 60 // Default: 60 updates per second
  ) {
    this.onUpdate = onUpdate;
    this.onRender = onRender;
    this.fixedTimestep = fixedTimestep;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    if (this.paused) {
      this.paused = false;
      this.lastTime = performance.now();
      this.accumulator = 0;
    }
  }

  get isRunning(): boolean {
    return this.running && !this.paused;
  }

  private loop = (currentTime: number): void => {
    if (!this.running) return;

    if (!this.paused) {
      const frameTime = Math.min(currentTime - this.lastTime, 100); // Cap to prevent spiral of death
      this.lastTime = currentTime;
      this.accumulator += frameTime;

      // Fixed timestep updates
      while (this.accumulator >= this.fixedTimestep) {
        this.onUpdate(this.fixedTimestep);
        this.accumulator -= this.fixedTimestep;
      }

      // Render with interpolation factor
      const interpolation = this.accumulator / this.fixedTimestep;
      this.onRender(interpolation);
    } else {
      this.lastTime = currentTime;
    }

    this.rafId = requestAnimationFrame(this.loop);
  };
}
