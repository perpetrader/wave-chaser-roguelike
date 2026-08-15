import React from "react";
import { OCEAN_WIDTH, OCEAN_HEIGHT, PIXEL_SIZE } from "./constants";

interface OceanLinesProps {
  slowdownActive: boolean;
}

/* Ocean wave lines — two copies of the path set drift left by one board
   width and loop seamlessly (keyframes `oceanDrift` in index.css). Purely
   decorative and GPU-composited; the component itself never re-renders. */
const OceanLines = React.memo(function OceanLines({ slowdownActive }: OceanLinesProps) {
  const w = OCEAN_WIDTH * PIXEL_SIZE;
  const paths = (offset: number) =>
    Array.from({ length: 8 }, (_, i) => {
      const y = (i * 4 + 2) * PIXEL_SIZE;
      return (
        <path
          key={`${offset}-${i}`}
          d={`M ${offset} ${y} Q ${offset + w * 0.25} ${y - 3} ${offset + w * 0.5} ${y} Q ${offset + w * 0.75} ${y + 3} ${offset + w} ${y}`}
          stroke={slowdownActive ? "hsl(280, 40%, 70%)" : "hsl(190, 60%, 70%)"}
          strokeWidth="1.5"
          fill="none"
        />
      );
    });
  return (
    <svg
      className="absolute left-0 top-0 pointer-events-none"
      width={w}
      height={OCEAN_HEIGHT * PIXEL_SIZE}
      style={{ opacity: 0.12, overflow: "hidden" }}
    >
      <g style={{ animation: "oceanDrift 26s linear infinite" }}>
        {paths(0)}
        {paths(w)}
      </g>
    </svg>
  );
});

export default OceanLines;
