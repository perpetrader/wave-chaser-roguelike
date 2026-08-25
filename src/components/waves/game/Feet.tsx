import React from "react";
import { cn } from "@/lib/utils";
import {
  OCEAN_WIDTH, PIXEL_SIZE, COLORS,
  SUPER_TAP_MULTIPLIER, GHOST_TOE_EXTENSION,
  type BeachEffectType, type RunType,
} from "./constants";
import { gummyToeExtensionMultiplier } from "./beachEffectScaling";
import { FootType } from "../RoguelikeStartScreen";

export interface FeetGait {
  left: number; // world row of the left foot's toe
  right: number; // world row of the right foot's toe
  steppingFoot: "left" | "right" | null; // foot currently mid-swing
  stepDurMs: number; // swing time (0 = snap, e.g. teleport)
  stepId: number; // increments per step; keys the lift animation
}

interface FeetProps {
  currentBeachEffect: BeachEffectType | null;
  runType: RunType;
  beachLevel: number;
  gait: FeetGait;
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
  footType: FootType;
}

// Foot silhouette for the RIGHT foot, in percentages of the foot box, with
// x=0 on the inner (big toe) edge and y=0 at the toes. The left foot is the
// same path mirrored with scaleX(-1). Two stacked clipped layers draw it —
// outline underneath, fill inset by 2px — because clip-path throws away the
// old `border`, and an SVG path could not carry the teleport CSS gradient.
const FOOT_CLIP =
  "polygon(14% 4%, 34% 0%, 56% 2%, 76% 6%, 92% 14%, 98% 30%, 86% 52%, 80% 70%, 84% 86%, 70% 98%, 40% 100%, 22% 94%, 16% 78%, 26% 60%, 10% 36%, 4% 16%)";

// Each foot is positioned at its own world row and only moves when the game
// logic fires a step (or a teleport snap). There is no decorative walk
// animation: what you see the feet do IS the movement, and the front foot's
// toe is the row the game uses for wave/water contact.
const Feet = React.memo(function Feet({
  currentBeachEffect,
  runType,
  beachLevel,
  gait,
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

  // Calculate foot height - stretches when Super Tap is active and tapping (blocked by Gummy Boss)
  const baseFootHeight = PIXEL_SIZE * 2;
  const canStretch = !isGummyBoss && isTapping;
  const stretchAmount = superTapActive && canStretch ? (SUPER_TAP_MULTIPLIER - 1) * 0.5 * PIXEL_SIZE : 0;
  const footHeight = baseFootHeight + stretchAmount;

  // Ghost toe extension height
  const ghostToeHeight = ghostToeActive ? GHOST_TOE_EXTENSION * PIXEL_SIZE : 0;

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
  const fill = isTeleportSkin ? getTeleportGradient() : getFeetColor();
  const outlineColor = jumpAroundActive
    ? "hsl(84, 60%, 35%)"
    : (waveSurferActive || hasTeleportImmunity)
    ? "hsl(280, 50%, 40%)"
    : superTapActive
    ? "hsl(45, 100%, 40%)"
    : COLORS.feetOutline;
  const fillShadow = isTeleportSkin ? "0 0 12px hsl(280, 60%, 50%), 0 0 24px hsl(174, 70%, 40%)" : undefined;

  const feetXLeft = (OCEAN_WIDTH / 2 - 1) * PIXEL_SIZE;

  const renderFoot = (side: "left" | "right") => {
    const row = side === "left" ? gait.left : gait.right;
    const isStepping = gait.steppingFoot === side;
    return (
      // Positioner: the foot's true world row. `top` only changes when the
      // game logic moves THIS foot, so the transition is the step itself.
      <div
        key={side}
        className={cn(
          "absolute",
          superTapActive && "animate-pulse",
          jumpAroundActive && "animate-[pulse_0.3s_ease-in-out_infinite]"
        )}
        style={{
          left: feetXLeft + (side === "left" ? 0 : PIXEL_SIZE + 4),
          top: row * PIXEL_SIZE,
          transition: gait.stepDurMs > 0 ? `top ${gait.stepDurMs}ms cubic-bezier(0.3, 0.9, 0.4, 1)` : "none",
          filter: getFilterEffect(),
          zIndex: 20, // Ensure feet render above grid cells (flashlight edges are z-15)
        }}
      >
        {/* Toe-tap / ghost-toe offset (and tap scale), separate from the step
            transition so tapping keeps its own quick 100ms feel */}
        <div
          style={{
            transform: `translateY(${-(toeExtension * PIXEL_SIZE + ghostToeHeight)}px) scale(${isTapping ? 1.1 : 1})`,
            transition: "transform 100ms ease-out",
          }}
        >
          {/* Lift pulse while this foot swings; keyed per step so back-to-back
              steps each re-trigger the animation */}
          <div
            key={isStepping ? gait.stepId : "planted"}
            style={isStepping ? { animation: `footStep ${Math.max(gait.stepDurMs, 80)}ms ease-out` } : undefined}
          >
            <div className="flex flex-col">
              {/* Ghost feet extension - full ghost foot */}
              {ghostToeActive && (
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
                  height: footHeight,
                  transform: side === "left" ? "scaleX(-1)" : undefined,
                }}
              >
                {/* Outline layer */}
                <div style={{ position: "absolute", inset: 0, clipPath: FOOT_CLIP, background: outlineColor }} />
                {/* Fill layer, inset by the outline thickness. clip-path clips the
                    whole subtree, so the anatomy overlays never spill past the toes. */}
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
                  {footType === "toeWarrior" && (
                    <div
                      style={{
                        position: "absolute",
                        top: footHeight * 0.35,
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
        </div>
      </div>
    );
  };

  return (
    <>
      {renderFoot("left")}
      {renderFoot("right")}
    </>
  );
});

export default Feet;
