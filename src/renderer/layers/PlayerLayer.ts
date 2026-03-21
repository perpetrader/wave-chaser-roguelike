import { Grid } from "../../engine/core/Grid";
import { COLORS } from "../colors";
import type { WorldState } from "../../engine/core/types";
import {
  FEET_WIDTH,
  FEET_HEIGHT,
  FEET_COL,
  OCEAN_HEIGHT,
  GHOST_TOE_EXTENSION,
  SUPER_TAP_MULTIPLIER,
  BASE_TOE_EXTENSION,
} from "../../engine/data/constants";

export class PlayerLayer {
  render(ctx: CanvasRenderingContext2D, state: WorldState): void {
    const cellSize = Grid.CELL_SIZE;

    // Feet sub-pixel position
    const feetY = state.feetPosition * cellSize;
    const feetX = FEET_COL * cellSize;
    const feetW = FEET_WIDTH * cellSize;
    const feetH = FEET_HEIGHT * cellSize;

    // ─── Determine feet color (priority order) ───────────────────────
    let feetColor = COLORS.feet;
    let outlineColor = COLORS.feetOutline;
    let glowColor: string | null = null;

    const abilities = state.abilityStates;

    if (state.fishNetStuck || state.quicksandPenaltyTimer > 0) {
      feetColor = COLORS.feetStuck;
      outlineColor = "hsl(30, 50%, 30%)";
      glowColor = "hsl(30, 60%, 30%)";
    } else if (abilities.waveSurfer?.active || state.waveSurferShield > 0) {
      // Wave surfer: teal + purple stripes
      feetColor = COLORS.feetSurfer;
      outlineColor = COLORS.feetSurferAlt;
      glowColor = "hsl(280, 60%, 50%)";
    } else if (abilities.jumpAround?.active) {
      feetColor = COLORS.feetJumpAround;
      outlineColor = COLORS.feetJumpAroundOutline;
      glowColor = COLORS.feetJumpAround;
    } else if (abilities.superTap?.active) {
      feetColor = COLORS.feetSuperTap;
      outlineColor = COLORS.feetSuperTapOutline;
      glowColor = COLORS.feetSuperTap;
    } else if (abilities.waveMagnet?.active) {
      feetColor = COLORS.feetMagnetized;
      outlineColor = "hsl(0, 60%, 40%)";
      glowColor = "hsl(0, 70%, 50%)";
    } else {
      // Check if touching water
      const isTouching = state.waves.some(
        (wave) => state.feetPosition < wave.row + 1 && state.feetPosition + FEET_HEIGHT > OCEAN_HEIGHT
      );
      if (isTouching) {
        feetColor = COLORS.feetTouching;
      }
    }

    // ─── Ghost Toe extension ──────────────────────────────────────────
    if (abilities.ghostToe?.active) {
      const ghostH = GHOST_TOE_EXTENSION * cellSize;
      const ghostY = feetY - ghostH;

      ctx.fillStyle = COLORS.ghostToeFill;
      ctx.strokeStyle = COLORS.ghostToeStroke;
      ctx.lineWidth = 2;

      // Rounded top rect
      const r = 4;
      ctx.beginPath();
      ctx.moveTo(feetX + r, ghostY);
      ctx.lineTo(feetX + feetW - r, ghostY);
      ctx.arcTo(feetX + feetW, ghostY, feetX + feetW, ghostY + r, r);
      ctx.lineTo(feetX + feetW, ghostY + ghostH);
      ctx.lineTo(feetX, ghostY + ghostH);
      ctx.lineTo(feetX, ghostY + r);
      ctx.arcTo(feetX, ghostY, feetX + r, ghostY, r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Purple glow on feet when ghost toe active
      if (!glowColor) glowColor = "hsl(270, 70%, 60%)";
    }

    // ─── Toe tap extension (visual stretch) ───────────────────────────
    if (state.isTapping) {
      const tapDancerMult = 1 + (state.permanentUpgrades.tapDancer * 0.15);
      let toeExt = BASE_TOE_EXTENSION * tapDancerMult;

      // Gummy Beach reduction
      if (state.currentBeachEffect === "gummyBeach") {
        if (state.beachEffectLevel >= 5) {
          toeExt = 0;
        } else {
          const mults = [0.60, 0.50, 0.40, 0.30];
          toeExt *= mults[Math.min(state.beachEffectLevel - 1, 3)];
        }
      }

      if (abilities.superTap?.active) {
        toeExt *= SUPER_TAP_MULTIPLIER;
      }

      if (toeExt > 0) {
        const extPixels = toeExt * cellSize;
        // Draw toe extension as a lighter strip above feet
        ctx.fillStyle = abilities.superTap?.active
          ? "hsla(50, 100%, 60%, 0.6)"
          : "hsla(25, 60%, 75%, 0.6)";
        ctx.fillRect(feetX, feetY - extPixels, feetW, extPixels);
      }
    }

    // ─── Draw glow ────────────────────────────────────────────────────
    if (glowColor) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12;
    }

    // ─── Draw feet outline ────────────────────────────────────────────
    ctx.fillStyle = outlineColor;
    ctx.fillRect(feetX - 2, feetY - 2, feetW + 4, feetH + 4);

    // ─── Draw feet body ──────────────────────────────────────────────
    // Wave surfer stripes
    if (abilities.waveSurfer?.active || state.waveSurferShield > 0) {
      // Draw alternating teal/purple stripes
      const stripeSize = 4;
      ctx.save();
      ctx.beginPath();
      ctx.rect(feetX, feetY, feetW, feetH);
      ctx.clip();
      for (let i = -feetH; i < feetW + feetH; i += stripeSize * 2) {
        ctx.fillStyle = COLORS.feetSurfer;
        ctx.beginPath();
        ctx.moveTo(feetX + i, feetY + feetH);
        ctx.lineTo(feetX + i + stripeSize, feetY + feetH);
        ctx.lineTo(feetX + i + stripeSize + feetH, feetY);
        ctx.lineTo(feetX + i + feetH, feetY);
        ctx.fill();
        ctx.fillStyle = COLORS.feetSurferAlt;
        ctx.beginPath();
        ctx.moveTo(feetX + i + stripeSize, feetY + feetH);
        ctx.lineTo(feetX + i + stripeSize * 2, feetY + feetH);
        ctx.lineTo(feetX + i + stripeSize * 2 + feetH, feetY);
        ctx.lineTo(feetX + i + stripeSize + feetH, feetY);
        ctx.fill();
      }
      ctx.restore();
    } else {
      ctx.fillStyle = feetColor;
      ctx.fillRect(feetX, feetY, feetW, feetH);
    }

    ctx.shadowBlur = 0;

    // ─── Toe warrior immunity line ────────────────────────────────────
    if (state.footType === "toeWarrior") {
      const lineY = feetY + 0.35 * feetH;
      ctx.strokeStyle = COLORS.toeWarriorLine;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(feetX, lineY);
      ctx.lineTo(feetX + feetW, lineY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ─── Left/right foot split line ──────────────────────────────────
    const midX = feetX + feetW / 2;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(midX, feetY);
    ctx.lineTo(midX, feetY + feetH);
    ctx.stroke();
  }
}
