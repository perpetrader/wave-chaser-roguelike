import React from "react";
import { OCEAN_WIDTH, TOTAL_HEIGHT, PIXEL_SIZE } from "./constants";

/* One miss's worth of wave-spray: foam droplets burst inward from the
   board's edges, like the missed wave crashing against the frame. Replaces
   the old screen shake (too harsh for the game's feel). Layout is a
   deterministic module constant; motion reuses the `splashParticle`
   keyframes (translate to --dx/--dy, fade out). */

const W = OCEAN_WIDTH * PIXEL_SIZE;   // 320
const H = TOTAL_HEIGHT * PIXEL_SIZE;  // 688

interface Particle {
  left: number;
  top: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
  delay: number;
}

const FOAM = "hsl(185, 85%, 88%)";
const SPRAY = "hsl(195, 75%, 65%)";

const PARTICLES: Particle[] = (() => {
  const out: Particle[] = [];
  // jitter(i) is a fixed pseudo-random in [-1, 1] so the layout is organic
  // but identical every burst (no Math.random in render paths)
  const jitter = (i: number) => Math.sin(i * 12.9898) % 1;

  // Left and right edges: 6 droplets each, bursting toward the board center
  for (let i = 0; i < 6; i++) {
    const y = 60 + i * 112 + jitter(i) * 20;
    out.push({ left: -2, top: y, dx: 18 + jitter(i + 1) * 6, dy: jitter(i + 2) * 10, size: 5 + (i % 3), color: i % 2 ? FOAM : SPRAY, delay: (i % 3) * 0.04 });
    out.push({ left: W - 4, top: y + 40, dx: -(18 + jitter(i + 3) * 6), dy: jitter(i + 4) * 10, size: 5 + ((i + 1) % 3), color: i % 2 ? SPRAY : FOAM, delay: ((i + 1) % 3) * 0.04 });
  }
  // Top and bottom edges: 4 droplets each
  for (let i = 0; i < 4; i++) {
    const x = 40 + i * 80 + jitter(i + 5) * 14;
    out.push({ left: x, top: -2, dx: jitter(i + 6) * 10, dy: 16 + jitter(i + 7) * 6, size: 5 + (i % 3), color: i % 2 ? FOAM : SPRAY, delay: (i % 2) * 0.05 });
    out.push({ left: x + 30, top: H - 4, dx: jitter(i + 8) * 10, dy: -(16 + jitter(i + 9) * 6), size: 5 + ((i + 1) % 3), color: i % 2 ? SPRAY : FOAM, delay: ((i + 1) % 2) * 0.05 });
  }
  return out;
})();

const MissBurst = React.memo(function MissBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 45 }}>
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            ["--dx" as never]: `${Math.round(p.dx)}px`,
            ["--dy" as never]: `${Math.round(p.dy)}px`,
            animation: `splashParticle 0.6s ease-out ${p.delay}s forwards`,
            opacity: 0, // hidden until the (possibly delayed) animation starts
          }}
        />
      ))}
    </div>
  );
});

export default MissBurst;
