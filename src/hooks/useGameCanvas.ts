import { useRef, useEffect, useCallback } from "react";
import { CanvasRenderer } from "../renderer/CanvasRenderer";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../engine/data/constants";

/**
 * Hook to manage the game canvas element and renderer.
 * Handles:
 * - Canvas ref binding
 * - Renderer initialization
 * - Responsive scaling to fit container while preserving aspect ratio
 * - Pixel-perfect rendering (no smoothing)
 */
export function useGameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize renderer when canvas is available
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new CanvasRenderer(canvas);
    rendererRef.current = renderer;

    // Render static grid immediately
    renderer.renderStatic();

    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  // Handle responsive scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Calculate scale to fit container while preserving aspect ratio
      const scaleX = containerWidth / CANVAS_WIDTH;
      const scaleY = containerHeight / CANVAS_HEIGHT;
      const scale = Math.min(scaleX, scaleY);

      // Apply CSS transform for crisp pixel scaling
      canvas.style.width = `${CANVAS_WIDTH * scale}px`;
      canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return {
    canvasRef,
    containerRef,
    rendererRef,
  };
}
