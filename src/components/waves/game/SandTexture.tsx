import React from "react";
import { OCEAN_WIDTH, OCEAN_HEIGHT, BEACH_HEIGHT, PIXEL_SIZE } from "./constants";

/* Sand grain texture lines */
const SandTexture = React.memo(function SandTexture() {
  return (
    <svg className="absolute left-0 pointer-events-none" style={{ top: OCEAN_HEIGHT * PIXEL_SIZE }} width={OCEAN_WIDTH * PIXEL_SIZE} height={BEACH_HEIGHT * PIXEL_SIZE} opacity={0.08}>
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1="0" y1={(i * 2 + 1) * PIXEL_SIZE + 8} x2={OCEAN_WIDTH * PIXEL_SIZE} y2={(i * 2 + 1) * PIXEL_SIZE + 8} stroke="hsl(42, 30%, 45%)" strokeWidth="1" />
      ))}
    </svg>
  );
});

export default SandTexture;
