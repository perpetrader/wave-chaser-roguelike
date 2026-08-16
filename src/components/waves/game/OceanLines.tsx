import React from "react";
import { OCEAN_WIDTH, OCEAN_HEIGHT, PIXEL_SIZE } from "./constants";

interface OceanLinesProps {
  slowdownActive: boolean;
}

/* Ocean wave lines — two parallax layers drifting at different speeds make
   the water read as moving (a single faint layer was imperceptible). Each
   layer is two copies of its path set so the drift loops seamlessly
   (keyframes `oceanDrift` in index.css). GPU-composited transforms only;
   the component never re-renders while the effect stays the same. */
const OceanLines = React.memo(function OceanLines({ slowdownActive }: OceanLinesProps) {
  const w = OCEAN_WIDTH * PIXEL_SIZE;
  const stroke = slowdownActive ? "hsl(280, 40%, 70%)" : "hsl(190, 60%, 70%)";

  // amplitude: how far the quadratic control points swing; rowOffset staggers
  // the layers so their lines interleave instead of overlapping
  const paths = (offset: number, rowOffset: number, amplitude: number, count: number, width: number) =>
    Array.from({ length: count }, (_, i) => {
      const y = (i * 4 + 2 + rowOffset) * PIXEL_SIZE;
      if (y >= OCEAN_HEIGHT * PIXEL_SIZE - 4) return null;
      return (
        <path
          key={`${offset}-${rowOffset}-${i}`}
          d={`M ${offset} ${y} Q ${offset + w * 0.25} ${y - amplitude} ${offset + w * 0.5} ${y} Q ${offset + w * 0.75} ${y + amplitude} ${offset + w} ${y}`}
          stroke={stroke}
          strokeWidth={width}
          fill="none"
        />
      );
    });

  return (
    <svg
      className="absolute left-0 top-0 pointer-events-none"
      width={w}
      height={OCEAN_HEIGHT * PIXEL_SIZE}
      style={{ overflow: "hidden" }}
    >
      {/* Back layer: slow, faint — depth */}
      <g style={{ opacity: 0.1, animation: "oceanDrift 28s linear infinite" }}>
        {paths(0, 0, 3, 8, 1.5)}
        {paths(w, 0, 3, 8, 1.5)}
      </g>
      {/* Front layer: faster, brighter, bigger swell — the visible motion */}
      <g style={{ opacity: 0.22, animation: "oceanDrift 11s linear infinite" }}>
        {paths(0, 2, 5, 7, 2)}
        {paths(w, 2, 5, 7, 2)}
      </g>
    </svg>
  );
});

export default OceanLines;
