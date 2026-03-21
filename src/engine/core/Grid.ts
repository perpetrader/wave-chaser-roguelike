import { OCEAN_WIDTH, OCEAN_HEIGHT, BEACH_HEIGHT, TOTAL_HEIGHT, PIXEL_SIZE } from "../data/constants";

/**
 * Grid utility functions for the 20x43 game grid.
 * Ocean: rows 0-29, Beach: rows 30-42.
 */
export const Grid = {
  WIDTH: OCEAN_WIDTH,
  HEIGHT: TOTAL_HEIGHT,
  OCEAN_ROWS: OCEAN_HEIGHT,
  BEACH_ROWS: BEACH_HEIGHT,
  CELL_SIZE: PIXEL_SIZE,

  /** Check if a row is in the ocean zone */
  isOcean(row: number): boolean {
    return row < OCEAN_HEIGHT;
  },

  /** Check if a row is in the beach zone */
  isBeach(row: number): boolean {
    return row >= OCEAN_HEIGHT && row < TOTAL_HEIGHT;
  },

  /** Convert grid row to pixel Y coordinate */
  rowToY(row: number): number {
    return row * PIXEL_SIZE;
  },

  /** Convert grid column to pixel X coordinate */
  colToX(col: number): number {
    return col * PIXEL_SIZE;
  },

  /** Get canvas dimensions in pixels */
  canvasWidth(): number {
    return OCEAN_WIDTH * PIXEL_SIZE;
  },

  canvasHeight(): number {
    return TOTAL_HEIGHT * PIXEL_SIZE;
  },
} as const;
