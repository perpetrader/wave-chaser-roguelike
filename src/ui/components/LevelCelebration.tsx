import { useEffect, useState } from "react";

const PARTICLE_COLORS = ["#fbbf24", "#a855f7", "#22d3ee", "#34d399", "#f472b6", "#60a5fa"];

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
  delay: number;
}

function createParticles(): Particle[] {
  return Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: 50,
    y: 45,
    angle: (i / 24) * 360,
    speed: 3 + Math.random() * 4,
    size: 4 + Math.random() * 6,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    delay: Math.random() * 200,
  }));
}

interface Props {
  level: number;
  score: number;
  onComplete: () => void;
}

/**
 * LevelCelebration: Brief celebration overlay shown when a level is completed.
 * Shows burst particles, glow, and wave emojis for ~1.2 seconds, then fades.
 */
export default function LevelCelebration({ level, score, onComplete }: Props) {
  const [particles] = useState(createParticles);
  const [phase, setPhase] = useState<"burst" | "fade">("burst");

  useEffect(() => {
    const burstTimer = setTimeout(() => setPhase("fade"), 800);
    const doneTimer = setTimeout(onComplete, 1200);
    return () => {
      clearTimeout(burstTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-400 ${
        phase === "fade" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Glow burst */}
      <div
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          background: "radial-gradient(circle, rgba(168,85,247,0.6) 0%, rgba(34,211,238,0.3) 40%, transparent 70%)",
          filter: "blur(30px)",
          animation: "celebration-pulse 0.6s ease-out",
        }}
      />

      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: `${p.x}%`,
            top: `${p.y}%`,
            animation: `celebration-fly 0.8s ease-out ${p.delay}ms forwards`,
            ["--fly-x" as string]: `${Math.cos((p.angle * Math.PI) / 180) * p.speed * 20}px`,
            ["--fly-y" as string]: `${Math.sin((p.angle * Math.PI) / 180) * p.speed * 20}px`,
          }}
        />
      ))}

      {/* Wave emojis floating up */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute text-2xl"
          style={{
            left: `${30 + i * 20}%`,
            bottom: "30%",
            animation: `celebration-float 1s ease-out ${i * 150}ms forwards`,
            opacity: 0,
          }}
        >
          🌊
        </span>
      ))}

      {/* Text */}
      <div className="relative z-10 text-center">
        <h2
          className="text-2xl font-extrabold text-white mb-1"
          style={{
            textShadow: "0 0 30px rgba(168,85,247,0.9), 0 0 60px rgba(34,211,238,0.6)",
          }}
        >
          🎉 Level Complete! 🎉
        </h2>
        <p className="text-cyan-300 text-sm font-bold">+{score} points</p>
      </div>

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes celebration-pulse {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes celebration-fly {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--fly-x), var(--fly-y)) scale(0); opacity: 0; }
        }
        @keyframes celebration-float {
          0% { transform: translateY(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateY(-60px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
