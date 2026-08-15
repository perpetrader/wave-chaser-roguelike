import React from "react";
import { OCEAN_WIDTH, OCEAN_HEIGHT, PIXEL_SIZE } from "./constants";

interface OceanLinesProps {
  slowdownActive: boolean;
}

/* Ocean wave lines */
const OceanLines = React.memo(function OceanLines({ slowdownActive }: OceanLinesProps) {
  return (
    <svg className="absolute left-0 top-0 pointer-events-none" width={OCEAN_WIDTH * PIXEL_SIZE} height={OCEAN_HEIGHT * PIXEL_SIZE} style={{ opacity: 0.12 }}>
      {Array.from({ length: 8 }, (_, i) => {
        const y = (i * 4 + 2) * PIXEL_SIZE;
        const w = OCEAN_WIDTH * PIXEL_SIZE;
        return (
          <path
            key={i}
            d={`M 0 ${y} Q ${w * 0.25} ${y - 3} ${w * 0.5} ${y} Q ${w * 0.75} ${y + 3} ${w} ${y}`}
            stroke={slowdownActive ? "hsl(280, 40%, 70%)" : "hsl(190, 60%, 70%)"}
            strokeWidth="1.5"
            fill="none"
          />
        );
      })}
    </svg>
  );
});

export default OceanLines;
