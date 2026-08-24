import React from "react";
import { cn } from "@/lib/utils";
import {
  OCEAN_WIDTH, PIXEL_SIZE, COLORS,
  SUPER_TAP_MULTIPLIER, GHOST_TOE_EXTENSION,
  type BeachEffectType, type RunType, type MovementMode,
} from "./constants";
import { gummyToeExtensionMultiplier } from "./beachEffectScaling";
import { FootType } from "../RoguelikeStartScreen";

interface FeetProps {
  currentBeachEffect: BeachEffectType | null;
  runType: RunType;
  beachLevel: number;
  feetPosition: number;
  isTapping: boolean;
  isTouching: boolean;
  feetMagnetized: boolean;
  fishNetStuck: boolean;
  quicksandPenaltyActive: boolean;
  waveSurferShield: number;
  superTapActive: boolean;
  ghostToeActive: boolean;
  jumpAroundActive: boolean;
  waveSurferActive: boolean;
  movementMode: MovementMode;
  footType: FootType;
}

// Foot silhouette for the RIGHT foot, in percentages of the foot box, with
// x=0 on the inner (big toe) edge and y=0 at the toes. The left foot is the
// same path mirrored with scaleX(-1). Two stacked clipped layers draw it —
// outline underneath, fill inset by 2px — because clip-path throws away the
// old `border`, and an SVG path could not carry the teleport CSS gradient.
const FOOT_CLIP =
  "polygon(14% 4%, 34% 0%, 56% 2%, 76% 6%, 92% 14%, 98% 30%, 86% 52%, 80% 70%, 84% 86%, 70% 98%, 40% 100%, 22% 94%, 16% 78%, 26% 60%, 10% 36%, 4% 16%)";

// Gait tuning. A "step" swaps which foot is forward, so the player walks one
// foot at a time; the stride (rows of travel per step) grows with speed, and
// the visual lead/trail split stays centered on the true feet position so the
// sprite never lies about where the hitbox is.
const STRIDE_MIN = 0.4; // rows between steps at the slowest crawl
const STRIDE_MAX = 1.3; // rows between steps at a full run
const SEP_MAX = 0.95; // rows between the two feet at the longest stride
const STEP_HELD_MS = 220; // no movement for this long => both feet plant

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

const strideForSpeed = (rowsPerSec: number) =>
  clamp(0.34 + rowsPerSec * 0.28, STRIDE_MIN, STRIDE_MAX);

interface GaitState {
  leadLeft: boolean; // which foot is currently the forward one
  forwardPx: number; // signed screen offset of the lead foot (trail gets -this)
  durMs: number; // swing time for the transition
}

interface FootProps {
  side: "left" | "right";
  height: number;
  fill: string;
  outlineColor: string;
  fillShadow?: string;
  ghostToeHeight: number;
  showImmunityLine: boolean;
  offsetPx: number;
  durMs: number;
  isLead: boolean;
  idleAnimated: boolean;
  idleDelay: string;
}

// One foot: step wrapper (swing) → idle wrapper (weight shift) → silhouette.
// The three transforms live on separate elements on purpose, since a CSS
// animation and an inline transform cannot share one element.
const Foot = ({
  side,
  height,
  fill,
  outlineColor,
  fillShadow,
  ghostToeHeight,
  showImmunityLine,
  offsetPx,
  durMs,
  isLead,
  idleAnimated,
  idleDelay,
}: FootProps) => (
  <div
    style={{
      transform: `translateY(${offsetPx}px) scale(${isLead ? 1.04 : 1})`,
      transition: `transform ${durMs}ms cubic-bezier(0.34, 1.12, 0.64, 1)`,
    }}
  >
    <div
      className="flex flex-col"
      style={idleAnimated ? { animation: "footIdle 1.6s ease-in-out infinite", animationDelay: idleDelay } : undefined}
    >
      {/* Ghost feet extension - full ghost foot */}
      {ghostToeHeight > 0 && (
        <div
          className="transition-all duration-100"
          style={{
            width: PIXEL_SIZE,
            height: ghostToeHeight,
            backgroundColor: "hsla(270, 70%, 60%, 0.3)",
            border: "2px solid hsl(270, 70%, 60%)",
            borderBottom: "none",
            borderRadius: "4px 4px 0 0",
            opacity: 0.9,
            boxShadow: "0 0 8px hsla(270, 70%, 60%, 0.5)",
          }}
        />
      )}
      {/* Actual foot */}
      <div
        className="relative transition-all duration-100"
        style={{
          width: PIXEL_SIZE,
          height,
          transform: side === "left" ? "scaleX(-1)" : undefined,
        }}
      >
        {/* Outline layer */}
        <div style={{ position: "absolute", inset: 0, clipPath: FOOT_CLIP, background: outlineColor }} />
        {/* Fill layer, inset by the outline thickness. clip-path clips the whole
            subtree, so the anatomy overlays below never spill past the toes. */}
        <div
          style={{
            position: "absolute",
            inset: 2,
            clipPath: FOOT_CLIP,
            // Single 'background' property — toggling between backgroundColor
            // and the background shorthand across renders triggers a React
            // conflicting-style warning (and can mis-style during rerenders)
            background: fill,
            boxShadow: fillShadow,
          }}
        >
          {/* Three toe bumps along the top edge, biggest on the big-toe side */}
          <div className="absolute pointer-events-none" style={{ top: 0, left: 0, right: 0, height: 4, display: "flex", gap: 1 }}>
            {[4, 3.5, 3].map((toeW, i) => (
              <div
                key={i}
                style={{ width: toeW, height: 4 - i * 0.5, borderRadius: "45% 45% 30% 30%", backgroundColor: "hsla(0, 0%, 0%, 0.18)" }}
              />
            ))}
          </div>
          {/* Arch highlight along the inner edge for volume */}
          <div
            className="absolute pointer-events-none"
            style={{ top: 4, bottom: 4, left: 0, width: 2, borderRadius: 2, backgroundColor: "hsla(0, 0%, 100%, 0.14)" }}
          />
          {/* Heel shading */}
          <div
            className="absolute pointer-events-none"
            style={{ bottom: 0, left: 1, right: 1, height: 4, borderRadius: "50%", backgroundColor: "hsla(0, 0%, 0%, 0.16)" }}
          />
          {/* Toe Warrior immunity line - dotted line at 35% from top */}
          {showImmunityLine && (
            <div
              style={{
                position: "absolute",
                top: height * 0.35,
                left: 0,
                right: 0,
                borderTop: "2px dashed hsla(180, 70%, 60%, 0.8)",
              }}
            />
          )}
        </div>
      </div>
    </div>
  </div>
);

// Render feet as pixel art (2 wide, 2 tall)
const Feet = React.memo(function Feet({
  currentBeachEffect,
  runType,
  beachLevel,
  feetPosition,
  isTapping,
  isTouching,
  feetMagnetized,
  fishNetStuck,
  quicksandPenaltyActive,
  waveSurferShield,
  superTapActive,
  ghostToeActive,
  jumpAroundActive,
  waveSurferActive,
  movementMode,
  footType,
}: FeetProps) {
  // Calculate toe extension with Super Tap multiplier
  // Apply Gummy Beach effect to visual calculation to match game logic
  const isGummyBeachActive = currentBeachEffect === "gummyBeach";
  const isGummyBoss = isGummyBeachActive && (runType !== "beachBonanza" || beachLevel >= 5);

  let visualToeExtension = isTapping ? 0.5 : 0;
  if (isGummyBeachActive) {
    if (isGummyBoss) {
      visualToeExtension = 0; // Boss level: no toe tap
    } else {
      // Reduced toe extension for non-boss gummy beach
      visualToeExtension *= gummyToeExtensionMultiplier(beachLevel);
    }
  }
  const toeExtension = superTapActive ? visualToeExtension * SUPER_TAP_MULTIPLIER : visualToeExtension;
  const feetY = (feetPosition - toeExtension) * PIXEL_SIZE;
  const feetX = (OCEAN_WIDTH / 2 - 1) * PIXEL_SIZE;

  // Calculate foot height - stretches when Super Tap is active and tapping (blocked by Gummy Boss)
  const baseFootHeight = PIXEL_SIZE * 2;
  const canStretch = !isGummyBoss && isTapping;
  const stretchAmount = superTapActive && canStretch ? (SUPER_TAP_MULTIPLIER - 1) * 0.5 * PIXEL_SIZE : 0;
  const footHeight = baseFootHeight + stretchAmount;

  // Ghost toe extension height
  const ghostToeHeight = ghostToeActive ? GHOST_TOE_EXTENSION * PIXEL_SIZE : 0;

  // ─── Walk cycle ───────────────────────────────────────────────────────────
  // Derived here rather than in the game loop: the only input the gait needs
  // is how far the feet moved and how fast, and both are readable from the
  // position prop, which already updates every frame in momentum mode.
  const [gait, setGait] = React.useState<GaitState>({ leadLeft: true, forwardPx: 0, durMs: 160 });
  const gaitRef = React.useRef({ pos: feetPosition, t: 0, accum: 0, speed: 0, dir: 0 });
  const plantTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const g = gaitRef.current;
    const delta = feetPosition - g.pos;

    const armPlantCheck = () => {
      if (plantTimerRef.current !== null) return; // one pending check at a time
      plantTimerRef.current = window.setTimeout(() => {
        plantTimerRef.current = null;
        if (performance.now() - gaitRef.current.t >= STEP_HELD_MS) {
          gaitRef.current.accum = 0;
          gaitRef.current.speed = 0;
          gaitRef.current.dir = 0;
          setGait((prev) => (prev.forwardPx === 0 ? prev : { ...prev, forwardPx: 0, durMs: 190 }));
        } else {
          armPlantCheck();
        }
      }, STEP_HELD_MS);
    };

    if (Math.abs(delta) < 1e-6) return;

    const now = performance.now();
    // Clamp dt: a fresh keypress after idling would otherwise read as ~0 speed
    const dt = clamp(now - g.t, 8, 200);
    g.pos = feetPosition;
    g.t = now;

    const dir = delta > 0 ? 1 : -1;
    if (dir !== g.dir) {
      // Turning around plants the gait and starts a fresh stride
      g.dir = dir;
      g.accum = 0;
      g.speed = 0;
    }

    const distance = Math.abs(delta);
    let stride: number;

    if (distance >= 0.15) {
      // Tap modes move in discrete hops — each hop is exactly one step, so a
      // bigger hop (Fast Feet, Jump Around) is a visibly bigger step.
      stride = distance;
      g.speed = distance / (dt / 1000);
      g.accum = 0;
    } else {
      // Momentum mode integrates a sub-pixel delta per frame; accumulate until
      // a full stride is due, with the stride sized by smoothed speed.
      const instantSpeed = distance / (dt / 1000);
      g.speed = g.speed > 0 ? g.speed * 0.7 + instantSpeed * 0.3 : instantSpeed;
      stride = strideForSpeed(g.speed);
      g.accum += distance;
      if (g.accum < stride) {
        armPlantCheck();
        return;
      }
      g.accum = 0;
    }

    const sepRows = Math.min(0.35 + stride * 0.5, SEP_MAX);
    const forwardPx = (sepRows / 2) * PIXEL_SIZE * dir;
    // Faster steps swing faster, but never so fast the swap is missed
    const durMs = clamp((stride / Math.max(g.speed, 0.1)) * 1000 * 0.55, 70, 200);

    setGait((prev) => ({ leadLeft: !prev.leadLeft, forwardPx, durMs }));
    armPlantCheck();
  }, [feetPosition]);

  React.useEffect(() => () => {
    if (plantTimerRef.current !== null) clearTimeout(plantTimerRef.current);
  }, []);

  // Ability-based foot color
  // Check if teleport immunity is active (shield persists after ability timer ends)
  // Use a small threshold (10ms) to avoid visual flickering from floating point precision
  const hasTeleportImmunity = waveSurferShield > 10;

  const getFeetColor = () => {
    if (fishNetStuck) return "hsl(30, 60%, 40%)"; // Dark brown/orange when stuck in fish net
    if (currentBeachEffect === "quicksand" && quicksandPenaltyActive) return "hsl(30, 60%, 40%)"; // Dark brown/orange when quicksand penalty active (matches fish net)
    if (feetMagnetized) return "hsl(0, 70%, 60%)"; // Red glow when magnetized to wave
    if (jumpAroundActive) return "hsl(84, 80%, 55%)"; // Lime green for Jump Around
    if (superTapActive) return "hsl(50, 100%, 60%)";
    if (isTouching) return COLORS.feetTouching;
    return COLORS.feet;
  };

  // Idle weight-shift: the feet bob gently in counter-phase while standing.
  // Purely visual (applied to the inner sprite, never the positioned wrapper)
  // and suppressed while walking or tapping/stuck so those states stay readable.
  const idleAnimated =
    !isTapping &&
    !fishNetStuck &&
    gait.forwardPx === 0 &&
    !(currentBeachEffect === "quicksand" && quicksandPenaltyActive);

  // Teleport uses a special striped gradient - handled separately in style
  const getTeleportGradient = () =>
    "repeating-linear-gradient(45deg, hsl(174, 70%, 50%), hsl(174, 70%, 50%) 4px, hsl(280, 60%, 35%) 4px, hsl(280, 60%, 35%) 8px)";

  // Get filter effect based on active abilities
  const getFilterEffect = () => {
    if (fishNetStuck || (currentBeachEffect === "quicksand" && quicksandPenaltyActive)) return "drop-shadow(0 0 8px hsl(30, 60%, 30%))"; // Dark glow when stuck
    if (feetMagnetized) return "drop-shadow(0 0 16px hsl(0, 70%, 50%)) drop-shadow(0 0 24px hsl(0, 70%, 40%))"; // Strong red glow when magnetized
    if (jumpAroundActive) return "drop-shadow(0 0 12px hsl(84, 80%, 55%))";
    if (waveSurferActive || hasTeleportImmunity) return "drop-shadow(0 0 12px hsl(280, 60%, 50%)) drop-shadow(0 0 20px hsl(174, 70%, 50%))"; // Purple/teal glow for teleport
    if (superTapActive) return "drop-shadow(0 0 12px hsl(50, 100%, 60%))";
    if (isTouching) return `drop-shadow(0 0 8px ${COLORS.feetTouching})`;
    if (ghostToeActive) return "drop-shadow(0 0 6px hsl(270, 70%, 60%))";
    return "none";
  };

  const isTeleportSkin = !jumpAroundActive && (waveSurferActive || hasTeleportImmunity);
  const sharedFootProps = {
    height: footHeight,
    fill: isTeleportSkin ? getTeleportGradient() : getFeetColor(),
    outlineColor: jumpAroundActive
      ? "hsl(84, 60%, 35%)"
      : (waveSurferActive || hasTeleportImmunity)
      ? "hsl(280, 50%, 40%)"
      : superTapActive
      ? "hsl(45, 100%, 40%)"
      : COLORS.feetOutline,
    fillShadow: isTeleportSkin ? "0 0 12px hsl(280, 60%, 50%), 0 0 24px hsl(174, 70%, 40%)" : undefined,
    ghostToeHeight,
    showImmunityLine: footType === "toeWarrior",
    durMs: gait.durMs,
  };

  return (
    <div
      className={cn(
        "absolute flex gap-1",
        // Momentum updates position every frame; CSS transitions cause visible lag/jumps.
        movementMode === "momentum" ? "transition-none" : "transition-all duration-75",
        isTapping && "scale-110",
        superTapActive && "animate-pulse",
        jumpAroundActive && "animate-[pulse_0.3s_ease-in-out_infinite]"
      )}
      style={{
        left: feetX,
        top: feetY - ghostToeHeight,
        filter: getFilterEffect(),
        zIndex: 20, // Ensure feet render above grid cells (flashlight edges are z-15)
      }}
    >
      <Foot
        {...sharedFootProps}
        side="left"
        offsetPx={gait.leadLeft ? gait.forwardPx : -gait.forwardPx}
        isLead={gait.forwardPx !== 0 && gait.leadLeft}
        idleAnimated={idleAnimated}
        idleDelay="0s"
      />
      <Foot
        {...sharedFootProps}
        side="right"
        offsetPx={gait.leadLeft ? -gait.forwardPx : gait.forwardPx}
        isLead={gait.forwardPx !== 0 && !gait.leadLeft}
        idleAnimated={idleAnimated}
        idleDelay="-0.8s"
      />
    </div>
  );
});

export default Feet;
