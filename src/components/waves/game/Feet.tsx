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
      {/* Left foot with ghost feet extension */}
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
          className="transition-all duration-100 relative"
          style={{
            width: PIXEL_SIZE,
            height: footHeight,
            backgroundColor: (!jumpAroundActive && (waveSurferActive || hasTeleportImmunity)) ? undefined : getFeetColor(),
            background: (!jumpAroundActive && (waveSurferActive || hasTeleportImmunity)) ? getTeleportGradient() : undefined,
            border: `2px solid ${jumpAroundActive ? "hsl(84, 60%, 35%)" : (waveSurferActive || hasTeleportImmunity) ? "hsl(280, 50%, 40%)" : superTapActive ? "hsl(45, 100%, 40%)" : COLORS.feetOutline}`,
            boxShadow: (!jumpAroundActive && (waveSurferActive || hasTeleportImmunity)) ? "0 0 12px hsl(280, 60%, 50%), 0 0 24px hsl(174, 70%, 40%)" : undefined,
            borderRadius: ghostToeActive ? "0 0 4px 4px" : "4px",
          }}
        >
          {/* Toe detail line */}
          <div style={{
            position: "absolute",
            top: 2,
            left: "50%",
            width: 1,
            height: footHeight * 0.3,
            backgroundColor: "hsla(0, 0%, 0%, 0.15)",
          }} />
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
      {/* Right foot with ghost feet extension */}
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
          className="transition-all duration-100 relative"
          style={{
            width: PIXEL_SIZE,
            height: footHeight,
            backgroundColor: (!jumpAroundActive && (waveSurferActive || hasTeleportImmunity)) ? undefined : getFeetColor(),
            background: (!jumpAroundActive && (waveSurferActive || hasTeleportImmunity)) ? getTeleportGradient() : undefined,
            border: `2px solid ${jumpAroundActive ? "hsl(84, 60%, 35%)" : (waveSurferActive || hasTeleportImmunity) ? "hsl(280, 50%, 40%)" : superTapActive ? "hsl(45, 100%, 40%)" : COLORS.feetOutline}`,
            boxShadow: (!jumpAroundActive && (waveSurferActive || hasTeleportImmunity)) ? "0 0 12px hsl(280, 60%, 50%), 0 0 24px hsl(174, 70%, 40%)" : undefined,
            borderRadius: ghostToeActive ? "0 0 4px 4px" : "4px",
          }}
        >
          {/* Toe detail line */}
          <div style={{
            position: "absolute",
            top: 2,
            left: "50%",
            width: 1,
            height: footHeight * 0.3,
            backgroundColor: "hsla(0, 0%, 0%, 0.15)",
          }} />
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
  );
});

export default Feet;
