// Tiny synthesized sound effects via Web Audio — no asset files, works
// offline, and each call is fire-and-forget. All sounds are short envelope
// blips; volumes are deliberately low so they sit under the ambience track.
//
// The AudioContext is created lazily on the first play call (which always
// happens after a user gesture — game input), satisfying autoplay policies.

let ctx: AudioContext | null = null;
let muted = false;

export const setSfxMuted = (m: boolean) => {
  muted = m;
};

const getCtx = (): AudioContext | null => {
  try {
    if (!ctx) {
      ctx = new AudioContext();
    }
    if (ctx.state === "suspended") {
      // Resume is async; the current sound may be silent but later ones play
      void ctx.resume();
    }
    return ctx;
  } catch {
    return null;
  }
};

// One oscillator note with an exponential-ish decay envelope.
// startTime is relative to now (seconds) so multi-note sounds can arpeggiate.
const note = (
  freq: number,
  duration: number,
  {
    type = "sine" as OscillatorType,
    gain = 0.08,
    sweepTo,
    startTime = 0,
  }: { type?: OscillatorType; gain?: number; sweepTo?: number; startTime?: number } = {}
) => {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  try {
    const t0 = c.currentTime + startTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (sweepTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t0 + duration);
    }
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  } catch {
    // Audio is decoration — never let it break the game
  }
};

// Wave touched: bright little water plop
export const sfxTouch = () => {
  note(660, 0.09, { type: "triangle", gain: 0.1, sweepTo: 990 });
};

// Wave missed: low dull thud
export const sfxMiss = () => {
  note(180, 0.18, { type: "sawtooth", gain: 0.06, sweepTo: 110 });
};

// Level won: quick rising three-note arpeggio
export const sfxLevelUp = () => {
  note(523.25, 0.12, { type: "triangle", gain: 0.09 });               // C5
  note(659.25, 0.12, { type: "triangle", gain: 0.09, startTime: 0.09 }); // E5
  note(783.99, 0.2, { type: "triangle", gain: 0.09, startTime: 0.18 });  // G5
};

// Ability activated: soft chime
export const sfxAbility = () => {
  note(880, 0.14, { type: "sine", gain: 0.07, sweepTo: 1174.66 });
};

// Game over: two falling notes
export const sfxGameOver = () => {
  note(392, 0.18, { type: "triangle", gain: 0.08 });                 // G4
  note(261.63, 0.3, { type: "triangle", gain: 0.08, startTime: 0.15 }); // C4
};
