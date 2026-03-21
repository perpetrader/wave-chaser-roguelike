import { useState, useEffect } from "react";
import type { RunType, MovementMode, FootType } from "../../engine/core/types";
import { SAVE_KEY_ROGUELIKE } from "../../engine/data/constants";

interface Props {
  onStart: (config: StartConfig) => void;
  onContinue: () => void;
  hasSavedRun: boolean;
}

export interface StartConfig {
  runType: RunType;
  movementMode: MovementMode;
  footType: FootType;
  autoToeTap: boolean;
}

const RUN_TYPES: { value: RunType; label: string; desc: string; emoji: string }[] = [
  { value: "roguelike", label: "Standard Run", desc: "Progressive difficulty, boss every 5 levels", emoji: "🌊" },
  { value: "beachBonanza", label: "Beach Bonanza", desc: "Choose your beach! 5 levels per beach", emoji: "🏖️" },
  { value: "bossQuickRun", label: "Boss Quick Run", desc: "10 boss beaches, 3 drafted abilities", emoji: "⚡" },
  { value: "bossHellRun", label: "Boss Hell Run", desc: "10 bosses, harder variance, less time", emoji: "🔥" },
];

const MOVEMENT_MODES: { value: MovementMode; label: string; desc: string }[] = [
  { value: "standard", label: "Standard", desc: "Direct movement with arrow keys" },
  { value: "slowerForward", label: "Slower Forward", desc: "30% slower toward shore" },
  { value: "momentum", label: "Momentum", desc: "Gear-based acceleration" },
];

const FOOT_TYPES: { value: FootType; label: string; desc: string; emoji: string }[] = [
  { value: "tourist", label: "Tourist", desc: "Balanced speed & drain", emoji: "🦶" },
  { value: "beachBum", label: "Beach Bum", desc: "-35% speed, -40% drain", emoji: "😎" },
  { value: "speedster", label: "Speedster", desc: "+40% speed, +50% drain", emoji: "⚡" },
  { value: "toeWarrior", label: "Toe Warrior", desc: "Front 35% immune, back +40% drain", emoji: "🦵" },
];

function loadPref<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function savePref(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export default function StartScreen({ onStart, onContinue, hasSavedRun }: Props) {
  const [runType, setRunType] = useState<RunType>(() => loadPref("wc_runType", "roguelike"));
  const [movementMode, setMovementMode] = useState<MovementMode>(() => loadPref("waveChaser_movementMode", "standard"));
  const [footType, setFootType] = useState<FootType>(() => loadPref("waveChaser_footType", "tourist"));
  const [autoToeTap, setAutoToeTap] = useState(() => loadPref("waveChaser_toeTapMode", false));

  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (s: string) => setOpenSection((prev) => (prev === s ? null : s));

  const handleStart = () => {
    savePref("wc_runType", runType);
    savePref("waveChaser_movementMode", movementMode);
    savePref("waveChaser_footType", footType);
    savePref("waveChaser_toeTapMode", autoToeTap);
    onStart({ runType, movementMode, footType, autoToeTap });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900 p-4 overflow-y-auto">
      <div className="w-full max-w-sm space-y-4">
        {/* Title */}
        <div className="text-center mb-6">
          <h1
            className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent"
            style={{ fontFamily: "'Russo One', sans-serif" }}
          >
            WAVE CHASER
          </h1>
          <p className="text-white/50 text-sm mt-1">Touch the waves without getting too wet!</p>
        </div>

        {/* Continue saved run */}
        {hasSavedRun && (
          <button
            onClick={onContinue}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors text-sm"
          >
            ▶️ Continue Saved Run
          </button>
        )}

        {/* ─── Run Type ─────────────────────────────────────── */}
        <CollapsibleSection
          title="Game Mode"
          emoji="🎮"
          color="purple"
          isOpen={openSection === "runType"}
          onToggle={() => toggleSection("runType")}
          summary={RUN_TYPES.find((r) => r.value === runType)?.label ?? ""}
        >
          {RUN_TYPES.map((r) => (
            <OptionButton
              key={r.value}
              selected={runType === r.value}
              onClick={() => setRunType(r.value)}
              label={`${r.emoji} ${r.label}`}
              desc={r.desc}
            />
          ))}
        </CollapsibleSection>

        {/* ─── Movement Mode ────────────────────────────────── */}
        <CollapsibleSection
          title="Controls"
          emoji="🕹️"
          color="emerald"
          isOpen={openSection === "movement"}
          onToggle={() => toggleSection("movement")}
          summary={MOVEMENT_MODES.find((m) => m.value === movementMode)?.label ?? ""}
        >
          {MOVEMENT_MODES.map((m) => (
            <OptionButton
              key={m.value}
              selected={movementMode === m.value}
              onClick={() => setMovementMode(m.value)}
              label={m.label}
              desc={m.desc}
            />
          ))}
        </CollapsibleSection>

        {/* ─── Foot Type ────────────────────────────────────── */}
        <CollapsibleSection
          title="Foot Type"
          emoji="🦶"
          color="orange"
          isOpen={openSection === "foot"}
          onToggle={() => toggleSection("foot")}
          summary={FOOT_TYPES.find((f) => f.value === footType)?.label ?? ""}
        >
          {FOOT_TYPES.map((f) => (
            <OptionButton
              key={f.value}
              selected={footType === f.value}
              onClick={() => setFootType(f.value)}
              label={`${f.emoji} ${f.label}`}
              desc={f.desc}
            />
          ))}
        </CollapsibleSection>

        {/* ─── Toe Tap ──────────────────────────────────────── */}
        <CollapsibleSection
          title="Toe Tap"
          emoji="👆"
          color="pink"
          isOpen={openSection === "toeTap"}
          onToggle={() => toggleSection("toeTap")}
          summary={autoToeTap ? "Auto" : "Manual"}
        >
          <OptionButton selected={!autoToeTap} onClick={() => setAutoToeTap(false)} label="Manual" desc="Press Space/Enter to toe tap" />
          <OptionButton selected={autoToeTap} onClick={() => setAutoToeTap(true)} label="Auto" desc="Automatically tap reachable waves" />
        </CollapsibleSection>

        {/* ─── Start Button ─────────────────────────────────── */}
        <button
          onClick={handleStart}
          className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-white font-extrabold rounded-xl text-xl transition-colors shadow-lg shadow-cyan-500/30"
        >
          Start Run
        </button>

        {/* Controls hint */}
        <p className="text-white/30 text-xs text-center">
          ↑↓ or W/S to move • Space to toe tap • C/V/B/N for abilities
        </p>
      </div>
    </div>
  );
}

// ─── Collapsible Section ──────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  purple: "border-purple-600 bg-purple-900/30",
  emerald: "border-emerald-600 bg-emerald-900/30",
  orange: "border-orange-600 bg-orange-900/30",
  pink: "border-pink-600 bg-pink-900/30",
};

function CollapsibleSection({
  title, emoji, color, isOpen, onToggle, summary, children,
}: {
  title: string; emoji: string; color: string;
  isOpen: boolean; onToggle: () => void; summary: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`border rounded-lg overflow-hidden ${COLOR_MAP[color] ?? "border-slate-600 bg-slate-800/30"}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-white text-sm font-medium"
      >
        <span>{emoji} {title}</span>
        <span className="text-white/50 text-xs">{summary} {isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && <div className="px-3 pb-2 space-y-1">{children}</div>}
    </div>
  );
}

// ─── Option Button ────────────────────────────────────────────────────────────

function OptionButton({
  selected, onClick, label, desc,
}: {
  selected: boolean; onClick: () => void; label: string; desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
        selected
          ? "bg-white/15 ring-1 ring-white/30 text-white"
          : "bg-white/5 text-white/60 hover:bg-white/10"
      }`}
    >
      <div className="font-medium">{label}</div>
      <div className="text-xs text-white/40">{desc}</div>
    </button>
  );
}
