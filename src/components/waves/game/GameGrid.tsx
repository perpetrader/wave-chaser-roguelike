import React from "react";
import { cn } from "@/lib/utils";
import {
  OCEAN_WIDTH, OCEAN_HEIGHT, TOTAL_HEIGHT, PIXEL_SIZE, COLORS,
  FLASHLIGHT_ROWS_BOSS, FLASHLIGHT_ROWS_REDUCED,
  type Wave, type BeachEffectType, type RunType,
} from "./constants";

interface GameGridProps {
  waves: Wave[];
  currentBeachEffect: BeachEffectType | null;
  beachLevel: number;
  runType: RunType;
  flashlightActive: boolean;
  crystalBallActive: boolean;
  slowdownActive: boolean;
  feetRow: number;
}

const GameGrid = React.memo(function GameGrid({
  waves,
  currentBeachEffect,
  beachLevel,
  runType,
  flashlightActive,
  crystalBallActive,
  slowdownActive,
  feetRow,
}: GameGridProps) {
  const cells = [];

  // For spike waves effect: get current time for flashing animation
  const isSpikeWavesActive = currentBeachEffect === "spikeWaves";
  const spikeFlashPhase = isSpikeWavesActive ? Math.floor(Date.now() / 150) % 2 : 0; // Toggle every 150ms

  // Nighttime beach: calculate lit rows for flashlight effect
  const isNighttime = currentBeachEffect === "nighttime";
  // Flashlight cone size: more rows visible on easier levels
  const isReducedNighttimeRows = (runType === "beachBonanza" || runType === "slayTheWaves") && beachLevel < 5;
  const flashlightRowCount = isReducedNighttimeRows ? FLASHLIGHT_ROWS_REDUCED : FLASHLIGHT_ROWS_BOSS;
  const flashlightMinRow = Math.max(0, feetRow - flashlightRowCount);
  const flashlightMaxRow = feetRow + 1; // Include the feet row and one below

  // Helper to check if a cell is within flashlight cone
  const isInFlashlightCone = (x: number, y: number): boolean => {
    if (!flashlightActive || !isNighttime) return false;
    if (y < flashlightMinRow || y > flashlightMaxRow) return false;

    // Flashlight cone: starts at feet width (2 cells) and expands outward
    // At feet row: width = 2 cells centered
    // Each row away from feet: expand by 0.5 cells on each side
    const distanceFromFeet = feetRow - y;
    const coneHalfWidth = 1 + (distanceFromFeet * 0.5); // Starts at 1 (2 cells total), expands
    const centerX = OCEAN_WIDTH / 2 - 0.5; // Center between the two feet columns (9.5)
    const distFromCenter = Math.abs(x - centerX);

    return distFromCenter <= coneHalfWidth;
  };

  // Helper to check if a cell is at the edge of flashlight cone (for glow effect)
  const isAtConeEdge = (x: number, y: number): boolean => {
    if (!flashlightActive || !isNighttime) return false;
    if (!isInFlashlightCone(x, y)) return false;

    // Check if any adjacent cell (that exists) is in darkness
    const neighbors = [
      { nx: x - 1, ny: y },     // left
      { nx: x + 1, ny: y },     // right
      { nx: x, ny: y - 1 },     // up
      { nx: x, ny: y + 1 },     // down
    ];

    for (const { nx, ny } of neighbors) {
      if (nx >= 0 && nx < OCEAN_WIDTH && ny >= 0 && ny < TOTAL_HEIGHT) {
        if (!isInFlashlightCone(nx, ny)) {
          return true; // Adjacent to darkness = edge cell
        }
      }
    }

    // Also check if at the top/bottom boundary of cone
    if (y === flashlightMinRow || y === flashlightMaxRow) return true;

    return false;
  };

  // Loop-invariant: the next incoming wave is the same for every cell
  const nextIncomingWave = waves.find((wave) => wave.phase === "incoming");

  for (let y = 0; y < TOTAL_HEIGHT; y++) {
    // Per-row state (identical for every cell in this row)
    let cellType: "ocean" | "crest" | "beach" = "beach";

    if (y < OCEAN_HEIGHT) {
      // Ocean rows are always ocean (blue)
      cellType = "ocean";
    } else {
      // Beach area - default to sand
      cellType = "beach";
    }

    // Check if this exact row is a wave crest (only 1 crest row per wave)
    const crestWave = waves.find((wave) => y === wave.row);
    const isCrest = !!crestWave;
    if (isCrest) {
      cellType = "crest";
    } else if (y >= OCEAN_HEIGHT) {
      // Beach row - check if wave covers it (rows between shoreline and crest are water)
      const isWaterCovered = waves.some((wave) => y < wave.row && y >= OCEAN_HEIGHT);
      cellType = isWaterCovered ? "ocean" : "beach";
    }

    // Check if this cell is a spike wave indicator (row just below a wave crest, full width)
    const spikeWave = isSpikeWavesActive ? waves.find((wave) => y === wave.row + 1) : null;
    const isSpikeCell = !!spikeWave; // Full width, we'll render half-height in the cell

    for (let x = 0; x < OCEAN_WIDTH; x++) {
      // Check if Crystal Ball is active and this is the peak row of the next incoming wave
      // Check for both beach and underwater beach (wave-covered) positions
      const isBeachRow = y >= OCEAN_HEIGHT;
      const isCrystalBallIndicator = crystalBallActive &&
        isBeachRow &&
        nextIncomingWave &&
        y === nextIncomingWave.maxReach;

      // Determine color - use touched crest color if the wave was touched
      // Apply pink tint when slowdown is active
      let color: string;

      // Check if this cell should be visible (not in nighttime darkness)
      const cellInLight = isInFlashlightCone(x, y);
      const isInDarkness = isNighttime && !cellInLight;

      // Nighttime: make everything dark except lit cells and crystal ball indicator
      if (isInDarkness && !isCrystalBallIndicator) {
        color = "hsl(220, 15%, 8%)"; // Very dark blue-gray for nighttime
      } else if (cellType === "beach") {
        // Crystal ball shows dark line on bottom half of the row
        if (isCrystalBallIndicator) {
          color = "hsl(42, 30%, 45%)"; // Darker sand color
        } else {
          color = COLORS.sand;
        }
      } else if (cellType === "crest" && crestWave?.touched) {
        color = COLORS.crestTouched; // Keep touched crest color unchanged during slowdown
      } else if (cellType === "crest" && crestWave?.magnetAffected) {
        color = "hsl(0, 70%, 60%)"; // Red-tinted crest for magnet-affected waves
      } else if (cellType === "crest") {
        color = COLORS.crest; // Keep crest white during slowdown
      } else if (cellType === "ocean") {
        color = slowdownActive ? "hsl(280, 50%, 40%)" : COLORS.ocean; // Purple-pink ocean
      } else {
        color = COLORS[cellType];
      }

      const isTouchedCrest = cellType === "crest" && crestWave?.touched;
      const isMagnetCrest = cellType === "crest" && crestWave?.magnetAffected && !crestWave?.touched;
      const isConeEdge = isAtConeEdge(x, y);

      // Determine box shadow - flashlight edge glow takes priority for lit cells
      // Only show glow effects for cells that are in the lit area during nighttime
      let cellBoxShadow: string | undefined;
      const showEffectsInLight = !isNighttime || cellInLight;
      if (isTouchedCrest && showEffectsInLight) {
        cellBoxShadow = `0 0 8px 2px ${COLORS.crestTouched}`;
      } else if (isMagnetCrest && showEffectsInLight) {
        cellBoxShadow = `0 0 10px 3px hsl(0, 70%, 50%)`;
      } else if (isCrystalBallIndicator) {
        // Crystal Conch always visible, even in nighttime darkness
        cellBoxShadow = `0 0 12px 4px hsl(180, 80%, 50%)`;
      }

      cells.push(
        <div
          key={`${x}-${y}`}
          className={cn(
            isCrystalBallIndicator && "animate-pulse",
            isMagnetCrest && showEffectsInLight && "animate-pulse"
          )}
          style={{
            width: PIXEL_SIZE,
            height: PIXEL_SIZE,
            backgroundColor: color,
            boxShadow: cellBoxShadow,
            outline: `1px solid ${color}`,
            position: "relative",
            zIndex: isConeEdge ? 15 : isCrystalBallIndicator ? 20 : ((isTouchedCrest || isMagnetCrest) && showEffectsInLight) ? 10 : undefined,
          }}
        >
          {/* Wave foam line: bright highlight at top of crest cells */}
          {isCrest && showEffectsInLight && (
            <div className="absolute left-0 right-0 top-0" style={{
              height: 2,
              backgroundColor: crestWave?.touched ? "hsla(160, 90%, 80%, 0.7)" : "hsla(180, 100%, 95%, 0.8)",
            }} />
          )}
          {/* Spike wave indicator - half-height silver bar at top of cell */}
          {isSpikeCell && (
            <div
              className="absolute left-0 right-0 top-0 transition-colors duration-200"
              style={{
                height: PIXEL_SIZE / 2,
                backgroundColor: spikeFlashPhase === 0
                  ? "hsl(0, 0%, 70%)"
                  : "hsl(0, 0%, 80%)",
                boxShadow: `0 0 4px 1px hsl(0, 0%, ${spikeFlashPhase === 0 ? 55 : 65}%)`,
                zIndex: 15,
              }}
            />
          )}
        </div>
      );
    }
  }

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${OCEAN_WIDTH}, ${PIXEL_SIZE}px)`,
        gridTemplateRows: `repeat(${TOTAL_HEIGHT}, ${PIXEL_SIZE}px)`,
        backgroundColor: COLORS.sand,
      }}
    >
      {cells}
    </div>
  );
});

export default GameGrid;
