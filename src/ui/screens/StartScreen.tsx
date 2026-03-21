import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Swords, TrendingUp, Target, ArrowLeft, Skull, Sparkles, Crown, Gauge, Footprints } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import roguelikeBg from "../../assets/waves/roguelike-bg.png";
import type { MovementMode, RunType, FootType } from "../../engine/core/types";
import { BEACH_COLORS } from "../data/beachColors";

export type ToeTapMode = "manual" | "auto";

interface RoguelikeStartScreenProps {
  onStart: (movementMode: MovementMode, runType: RunType, footType: FootType, toeTapMode: ToeTapMode) => void;
  onContinue?: () => void;
  hasSavedRun: boolean;
  savedRunType?: RunType;
}

const MOVEMENT_MODES: { mode: MovementMode; name: string; description: string }[] = [
  { mode: "standard", name: "Standard", description: "Direct movement with arrow keys" },
  { mode: "slowerForward", name: "Slower Forward", description: "30% slower when moving toward shore" },
  { mode: "momentum", name: "Momentum", description: "Accelerate/decelerate with arrow keys" },
];

const RUN_TYPES: { type: RunType; name: string; description: string }[] = [
  { type: "roguelike", name: "Standard Run", description: "Progressive difficulty with random boss beaches every 5 levels" },
  { type: "beachBonanza", name: "Beach Bonanza", description: "Choose your beach! 5 levels per beach with escalating effects" },
  { type: "bossQuickRun", name: "🏆 Boss Quick Run", description: "10 boss beaches with 3 drafted abilities! 50s timer, 20 misses." },
  { type: "bossHellRun", name: "🔥 Boss Hell Run", description: "10 boss beaches, harder variance! 30s timer, only 10 misses." },
  { type: "slayTheWaves", name: "⚔️ Slay the Waves", description: "Branching map with shops, events, rest sites & card rewards!" },
];

const FOOT_TYPES: { type: FootType; name: string; description: string }[] = [
  { type: "tourist", name: "Tourist", description: "Balanced speed and water resistance" },
  { type: "beachBum", name: "Beach Bum", description: "35% slower movement, but 40% less water drain" },
  { type: "speedster", name: "Speedster", description: "40% faster movement, but 50% more water drain" },
  { type: "toeWarrior", name: "Toe Warrior", description: "Front 35% of feet immune to water, back 65% takes 40% more drain" },
];

const TOE_TAP_MODES: { mode: ToeTapMode; name: string; description: string }[] = [
  { mode: "manual", name: "Manual Toe Tap", description: "Press Space/Enter to toe tap manually" },
  { mode: "auto", name: "Auto Toe Tap", description: "Toes auto-tap when a wave can be reached" },
];

const RoguelikeStartScreen = ({ onStart, onContinue, hasSavedRun, savedRunType }: RoguelikeStartScreenProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [abilitiesOpen, setAbilitiesOpen] = useState(false);
  
  const [bossBeachesOpen, setBossBeachesOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [permanentUpgradesOpen, setPermanentUpgradesOpen] = useState(false);
  const [selectedMovementMode, setSelectedMovementMode] = useState<MovementMode>(() => {
    const saved = localStorage.getItem("waveChaser_movementMode");
    return (saved as MovementMode) || "standard";
  });
  const [selectedRunType, setSelectedRunType] = useState<RunType>(() => {
    const saved = localStorage.getItem("wc_runType");
    return (saved as RunType) || "standard";
  });
  const [selectedFootType, setSelectedFootType] = useState<FootType>(() => {
    const saved = localStorage.getItem("waveChaser_footType");
    return (saved as FootType) || "tourist";
  });
  const [selectedToeTapMode, setSelectedToeTapMode] = useState<ToeTapMode>(() => {
    const saved = localStorage.getItem("waveChaser_toeTapMode");
    return (saved as ToeTapMode) || "manual";
  });

  // Persist selections to localStorage
  useEffect(() => {
    localStorage.setItem("waveChaser_movementMode", selectedMovementMode);
  }, [selectedMovementMode]);

  useEffect(() => {
    localStorage.setItem("wc_runType", selectedRunType);
  }, [selectedRunType]);

  useEffect(() => {
    localStorage.setItem("waveChaser_footType", selectedFootType);
  }, [selectedFootType]);

  useEffect(() => {
    localStorage.setItem("waveChaser_toeTapMode", selectedToeTapMode);
  }, [selectedToeTapMode]);

  return (
    <div 
      className="fixed inset-0 flex flex-col items-center gap-4 sm:gap-6 py-4 px-2 overflow-y-auto bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${roguelikeBg})` }}
    >
      {/* Game intro */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2 text-amber-400 mb-1">
          <Swords className="w-5 h-5" />
          <span className="text-lg font-display">Roguelike Mode</span>
          <Swords className="w-5 h-5" />
        </div>
        <p className="text-white text-base sm:text-lg font-medium drop-shadow-lg">
          Level-based progression with unlockable abilities!
        </p>
        <p className="text-white/70 text-sm">
          Start with no abilities and build your power as you advance.
        </p>
      </div>

      {/* Movement Mode Selection */}
      <Collapsible className="w-full max-w-md">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-emerald-500/30 hover:bg-slate-900/70 transition-colors">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span className="text-base sm:text-lg font-display text-emerald-400">Movement Controls</span>
            <span className="text-xs text-emerald-400/70 bg-emerald-400/10 px-2 py-0.5 rounded">
              {MOVEMENT_MODES.find(m => m.mode === selectedMovementMode)?.name}
            </span>
          </div>
          <ChevronDown className="w-5 h-5 text-emerald-400/70 transition-transform [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-slate-900/90 backdrop-blur-sm rounded-b-xl border border-t-0 border-emerald-500/30 p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2">
            {MOVEMENT_MODES.map(({ mode, name, description }) => (
              <button
                key={mode}
                onClick={() => setSelectedMovementMode(mode)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selectedMovementMode === mode
                    ? "bg-emerald-600/30 border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/20"
                    : "bg-slate-800/50 border-white/10 hover:bg-slate-700/50 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${selectedMovementMode === mode ? "text-emerald-400" : "text-white"}`}>
                    {name}
                  </span>
                  {selectedMovementMode === mode && (
                    <span className="text-emerald-400 text-xs bg-emerald-400/20 px-2 py-0.5 rounded">Selected</span>
                  )}
                </div>
                <p className="text-sm text-white/60 mt-1">{description}</p>
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Run Type Selection */}
      <Collapsible className="w-full max-w-md">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-purple-500/30 hover:bg-slate-900/70 transition-colors">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-purple-400" />
            <span className="text-base sm:text-lg font-display text-purple-400">Run Type</span>
            <span className="text-xs text-purple-400/70 bg-purple-400/10 px-2 py-0.5 rounded">
              {RUN_TYPES.find(r => r.type === selectedRunType)?.name}
            </span>
          </div>
          <ChevronDown className="w-5 h-5 text-purple-400/70 transition-transform [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-slate-900/90 backdrop-blur-sm rounded-b-xl border border-t-0 border-purple-500/30 p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2">
            {RUN_TYPES.map(({ type, name, description }) => (
              <button
                key={type}
                onClick={() => setSelectedRunType(type)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selectedRunType === type
                    ? "bg-purple-600/30 border-purple-400 ring-2 ring-purple-400/50 shadow-lg shadow-purple-500/20"
                    : "bg-slate-800/50 border-white/10 hover:bg-slate-700/50 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${selectedRunType === type ? "text-purple-400" : "text-white"}`}>
                    {name}
                  </span>
                  {selectedRunType === type && (
                    <span className="text-purple-400 text-xs bg-purple-400/20 px-2 py-0.5 rounded">Selected</span>
                  )}
                </div>
                <p className="text-sm text-white/60 mt-1">{description}</p>
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Foot Type Selection */}
      <Collapsible className="w-full max-w-md">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-orange-500/30 hover:bg-slate-900/70 transition-colors">
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-orange-400" />
            <span className="text-base sm:text-lg font-display text-orange-400">Foot Type</span>
            <span className="text-xs text-orange-400/70 bg-orange-400/10 px-2 py-0.5 rounded">
              {FOOT_TYPES.find(f => f.type === selectedFootType)?.name}
            </span>
          </div>
          <ChevronDown className="w-5 h-5 text-orange-400/70 transition-transform [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-slate-900/90 backdrop-blur-sm rounded-b-xl border border-t-0 border-orange-500/30 p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2">
            {FOOT_TYPES.map(({ type, name, description }) => (
              <button
                key={type}
                onClick={() => setSelectedFootType(type)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selectedFootType === type
                    ? "bg-orange-600/30 border-orange-400 ring-2 ring-orange-400/50 shadow-lg shadow-orange-500/20"
                    : "bg-slate-800/50 border-white/10 hover:bg-slate-700/50 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${selectedFootType === type ? "text-orange-400" : "text-white"}`}>
                    {name}
                  </span>
                  {selectedFootType === type && (
                    <span className="text-orange-400 text-xs bg-orange-400/20 px-2 py-0.5 rounded">Selected</span>
                  )}
                </div>
                <p className="text-sm text-white/60 mt-1">{description}</p>
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Toe Tap Mode Selection */}
      <Collapsible className="w-full max-w-md">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-pink-500/30 hover:bg-slate-900/70 transition-colors">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-pink-400" />
            <span className="text-base sm:text-lg font-display text-pink-400">Toe Tap Mode</span>
            <span className="text-xs text-pink-400/70 bg-pink-400/10 px-2 py-0.5 rounded">
              {TOE_TAP_MODES.find(t => t.mode === selectedToeTapMode)?.name}
            </span>
          </div>
          <ChevronDown className="w-5 h-5 text-pink-400/70 transition-transform [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-slate-900/90 backdrop-blur-sm rounded-b-xl border border-t-0 border-pink-500/30 p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2">
            {TOE_TAP_MODES.map(({ mode, name, description }) => (
              <button
                key={mode}
                onClick={() => setSelectedToeTapMode(mode)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selectedToeTapMode === mode
                    ? "bg-pink-600/30 border-pink-400 ring-2 ring-pink-400/50 shadow-lg shadow-pink-500/20"
                    : "bg-slate-800/50 border-white/10 hover:bg-slate-700/50 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${selectedToeTapMode === mode ? "text-pink-400" : "text-white"}`}>
                    {name}
                  </span>
                  {selectedToeTapMode === mode && (
                    <span className="text-pink-400 text-xs bg-pink-400/20 px-2 py-0.5 rounded">Selected</span>
                  )}
                </div>
                <p className="text-sm text-white/60 mt-1">{description}</p>
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {hasSavedRun && onContinue && (
        <Button
          onClick={onContinue}
          className="w-full max-w-md h-14 text-lg font-display bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white border-none shadow-lg shadow-cyan-500/30"
        >
          <Swords className="w-5 h-5 mr-2" />
          Continue {savedRunType === "beachBonanza" ? "Beach Bonanza" : "Standard"} Run
        </Button>
      )}

      {/* Start Button */}
      <Button
        onClick={() => onStart(selectedMovementMode, selectedRunType, selectedFootType, selectedToeTapMode)}
        variant={hasSavedRun ? "outline" : "default"}
        className={hasSavedRun 
          ? "w-full max-w-md h-12 text-base font-display border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
          : "w-full max-w-md h-14 text-lg font-display bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-none shadow-lg shadow-amber-500/30"
        }
      >
        <Swords className="w-5 h-5 mr-2" />
        {hasSavedRun ? "Start New Run" : (
          selectedRunType === "beachBonanza" ? "Start Beach Bonanza" : 
          selectedRunType === "bossQuickRun" ? "Start Boss Quick Run" :
          selectedRunType === "bossHellRun" ? "Start Boss Hell Run" :
          "Start Standard Run"
        )}
      </Button>

      {/* Rules Dropdown */}
      <Collapsible open={rulesOpen} onOpenChange={setRulesOpen} className="w-full max-w-md">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-cyan-500/30 hover:bg-slate-900/70 transition-colors">
          <span className="text-base sm:text-lg font-display text-cyan-400">Rules & Controls</span>
          <ChevronDown className={`w-5 h-5 text-cyan-400/70 transition-transform ${rulesOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-slate-900/90 backdrop-blur-sm rounded-b-xl border border-t-0 border-cyan-500/30 p-3 sm:p-4">
          <ul className="text-white/80 text-sm sm:text-base space-y-1.5 sm:space-y-2 text-left">
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>Touch waves with your toes to score points</span>
            </li>
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>Use toe tap for a quick surge forward!</span>
            </li>
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>Your water timer drains when your feet are in the water</span>
            </li>
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>Difficulty increases each level (faster waves, shorter timer)</span>
            </li>
          </ul>
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-cyan-400 font-semibold text-base mb-2">Controls:</p>
            <div className="space-y-1.5 text-sm sm:text-base text-white/70">
              <p><span className="text-cyan-400 font-mono">↑/↓ or W/S:</span> Move ¼ row up/down</p>
              <p><span className="text-cyan-400 font-mono">Space/Enter:</span> Toe tap forward</p>
            </div>
            <p className="text-amber-300 mt-3 text-sm">
              💡 Quick toe taps minimize water contact!
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>


      {/* Abilities Dropdown */}
      <Collapsible open={abilitiesOpen} onOpenChange={setAbilitiesOpen} className="w-full max-w-md">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-amber-500/30 hover:bg-slate-900/70 transition-colors">
          <span className="text-base sm:text-lg font-display text-amber-400">Available Abilities</span>
          <ChevronDown className={`w-5 h-5 text-amber-400/70 transition-transform ${abilitiesOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-slate-900/90 backdrop-blur-sm rounded-b-xl border border-t-0 border-amber-500/30 p-3 sm:p-4">
          <p className="text-amber-300/80 text-sm italic mb-3">*7 random abilities available each run (3 excluded). 1 minute cooldown each.*</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-orange-500/10 rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">⚡</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-orange-400 text-base font-medium">Super Tap</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  3x toe reach for 7s (+0.7s per upgrade)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-purple-500/10 rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">👻</span>
              </div>
              <div className="flex-1 min-w-0">
              <span className="text-purple-400 text-base font-medium">Ghost Feet</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  Extended reach that's immune to water for 6s (+0.6s per upgrade)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-lime-500/10 rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-lime-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🐇</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-lime-400 text-base font-medium">Jump Around</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  4x movement distance for 6s (+0.6s per upgrade)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-red-500/10 rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🧲</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-red-400 text-base font-medium">Wave Magnet</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  All waves peak near your feet for 5s (+0.5s per upgrade)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-teal-500/10 rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🏄</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-teal-400 text-base font-medium">Teleport</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  Teleports to next wave peak on touch with immunity until wave recedes for 4s (+0.4s per upgrade)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-cyan-500/10 rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🐚</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 text-base font-medium">Crystal Conch</span>
                  <span className="text-xs text-white/40 bg-white/10 px-1.5 py-0.5 rounded">Level 6+</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Shows next wave peak location for 5s (+0.5s per upgrade)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-sky-500/10 rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🏖️</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sky-400 text-base font-medium">Towel Off</span>
                  <span className="text-xs text-white/40 bg-white/10 px-1.5 py-0.5 rounded">Level 6+</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Recovers 20% of dry time back to timer for 7s (+0.7s per upgrade). Capped at level start time.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-yellow-500/10 rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">👕</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-base font-medium">Wet Suit</span>
                  <span className="text-xs text-white/40 bg-white/10 px-1.5 py-0.5 rounded">Level 6+</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Freeze timer for 8s, ends if in water 3s. Upgrades: +0.8s duration, +0.3s water tolerance
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-emerald-500/10 rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold">2x</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-base font-medium">Double Dip</span>
                  <span className="text-xs text-white/40 bg-white/10 px-1.5 py-0.5 rounded">Level 10+</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Each touched wave counts as 2 for 5s (+0.5s per upgrade)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-pink-500/10 rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🐌</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-pink-400 text-base font-medium">Slowdown</span>
                  <span className="text-xs text-white/40 bg-white/10 px-1.5 py-0.5 rounded">Level 10+</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Waves move and spawn 60% slower for 12s (+1.2s per upgrade)
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Boss Beaches Dropdown */}
      <Collapsible open={bossBeachesOpen} onOpenChange={setBossBeachesOpen} className="w-full max-w-md">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-red-500/30 hover:bg-slate-900/70 transition-colors">
          <span className="text-base sm:text-lg font-display text-red-400">Boss Beaches</span>
          <ChevronDown className={`w-5 h-5 text-red-400/70 transition-transform ${bossBeachesOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-slate-900/90 backdrop-blur-sm rounded-b-xl border border-t-0 border-red-500/30 p-3 sm:p-4">
          <div className="flex items-start gap-3 bg-red-500/10 rounded-lg p-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Skull className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-red-400 text-base font-medium">Every 5th Level is a Boss Beach!</span>
              <p className="text-white/70 text-sm leading-relaxed">
                Levels 5, 10, 15, 20... feature a random challenge effect
              </p>
            </div>
          </div>
          <div className="space-y-2.5">
            <div className={`flex items-start gap-3 ${BEACH_COLORS.quicksand.bg} rounded-lg p-2.5`}>
              <div className={`w-8 h-8 rounded-lg ${BEACH_COLORS.quicksand.bg} flex items-center justify-center flex-shrink-0`}>
                <span className="text-lg">🏜️</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className={`${BEACH_COLORS.quicksand.text} text-base font-medium`}>Quicksand</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  Stay still 0.2s = sink! 80% slower for 1.5s
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${BEACH_COLORS.spikeWaves.bg} rounded-lg p-2.5`}>
              <div className={`w-8 h-8 rounded-lg ${BEACH_COLORS.spikeWaves.bg} flex items-center justify-center flex-shrink-0`}>
                <span className="text-lg">🦔</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className={`${BEACH_COLORS.spikeWaves.text} text-base font-medium`}>Spike Waves</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  Flashing silver spikes drain your water timer
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${BEACH_COLORS.gummyBeach.bg} rounded-lg p-2.5`}>
              <div className={`w-8 h-8 rounded-lg ${BEACH_COLORS.gummyBeach.bg} flex items-center justify-center flex-shrink-0`}>
                <span className="text-lg">🍬</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className={`${BEACH_COLORS.gummyBeach.text} text-base font-medium`}>Gummy Beach</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  No toe tap or Super Tap! 20% slower movement
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${BEACH_COLORS.coldWater.bg} rounded-lg p-2.5`}>
              <div className={`w-8 h-8 rounded-lg ${BEACH_COLORS.coldWater.bg} flex items-center justify-center flex-shrink-0`}>
                <span className="text-lg">🥶</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className={`${BEACH_COLORS.coldWater.text} text-base font-medium`}>Cold Water</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  Water timer drains 2x faster
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${BEACH_COLORS.crazyWaves.bg} rounded-lg p-2.5`}>
              <div className={`w-8 h-8 rounded-lg ${BEACH_COLORS.crazyWaves.bg} flex items-center justify-center flex-shrink-0`}>
                <span className="text-lg">🌊</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className={`${BEACH_COLORS.crazyWaves.text} text-base font-medium`}>Crazy Waves</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  Wave variance 3x higher — chaotic timing!
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${BEACH_COLORS.fishNet.bg} rounded-lg p-2.5`}>
              <div className={`w-8 h-8 rounded-lg ${BEACH_COLORS.fishNet.bg} flex items-center justify-center flex-shrink-0`}>
                <span className="text-lg">🕸️</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className={`${BEACH_COLORS.fishNet.text} text-base font-medium`}>Fish Net</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  Your feet get stuck every 3 seconds for 1 second
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${BEACH_COLORS.nighttime.bg} rounded-lg p-2.5`}>
              <div className={`w-8 h-8 rounded-lg ${BEACH_COLORS.nighttime.bg} flex items-center justify-center flex-shrink-0`}>
                <span className="text-lg">🌙</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className={`${BEACH_COLORS.nighttime.text} text-base font-medium`}>Nighttime</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  Beach is dark! Use flashlight (F key / button) to see waves. 10s duration, 5s cooldown
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${BEACH_COLORS.roughWaters.bg} rounded-lg p-2.5`}>
              <div className={`w-8 h-8 rounded-lg ${BEACH_COLORS.roughWaters.bg} flex items-center justify-center flex-shrink-0`}>
                <span className="text-lg">🌊</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className={`${BEACH_COLORS.roughWaters.text} text-base font-medium`}>Rough Waters</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  Waves move 75% faster and peak 50% shorter
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${BEACH_COLORS.heavySand.bg} rounded-lg p-2.5`}>
              <div className={`w-8 h-8 rounded-lg ${BEACH_COLORS.heavySand.bg} flex items-center justify-center flex-shrink-0`}>
                <span className="text-lg">⏳</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className={`${BEACH_COLORS.heavySand.text} text-base font-medium`}>Heavy Sand</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  65% slower movement
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${BEACH_COLORS.busyBeach.bg} rounded-lg p-2.5`}>
              <div className={`w-8 h-8 rounded-lg ${BEACH_COLORS.busyBeach.bg} flex items-center justify-center flex-shrink-0`}>
                <span className="text-lg">🚶</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className={`${BEACH_COLORS.busyBeach.text} text-base font-medium`}>Busy Beach</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  People spawn every 2.5s at high speed! Toe tap passes through
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Permanent Upgrades Dropdown */}
      <Collapsible open={permanentUpgradesOpen} onOpenChange={setPermanentUpgradesOpen} className="w-full max-w-md">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-yellow-500/30 hover:bg-slate-900/70 transition-colors">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-base sm:text-lg font-display text-yellow-400">Permanent Upgrades</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-yellow-400/70 transition-transform ${permanentUpgradesOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-slate-900/90 backdrop-blur-sm rounded-b-xl border border-t-0 border-yellow-500/30 p-3 sm:p-4">
          <p className="text-yellow-300/80 text-sm italic mb-3">*Earned by completing Boss Beach levels (every 5 levels)*</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-green-500/10 rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🏃</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-green-400 text-base font-medium">Fast Feet</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  +10% distance per move per upgrade (max 5)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-blue-500/10 rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🦶</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-blue-400 text-base font-medium">Tap Dancer</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  +15% base toe tap distance per upgrade (max 5)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-teal-500/10 rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">👟</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-teal-400 text-base font-medium">Wet Shoes</span>
                <p className="text-white/70 text-sm leading-relaxed">
                  Water timer drains 10% slower per upgrade (max 5)
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* What's New Dropdown */}
      <Collapsible open={changelogOpen} onOpenChange={setChangelogOpen} className="w-full max-w-md">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-violet-500/30 hover:bg-slate-900/70 transition-colors">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-base sm:text-lg font-display text-violet-400">What's New (v0.955)</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-violet-400/70 transition-transform ${changelogOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-slate-900/90 backdrop-blur-sm rounded-b-xl border border-t-0 border-violet-500/30 p-3 sm:p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-violet-400 font-semibold text-sm">Version 0.959</p>
              <ul className="text-white/80 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>New Boss Hell Run mode: Harder 10-level gauntlet with ±3 variance, 30s timer, 10 max misses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Boss runs now draft from 2 ability choices per round instead of 3</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Busy Beach boss: People now move at 2-4 speed instead of 1-6</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.958</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>New Boss Quick Run mode: 10-level boss gauntlet with ability draft</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400 font-semibold text-sm">Version 0.954</p>
              <ul className="text-white/80 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Updated starting waves needed to 4 and +2 every 5 levels</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400 font-semibold text-sm">Version 0.953</p>
              <ul className="text-white/80 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Rebalanced all 10 beach types with refined level 1-4 scaling</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Quicksand: New scaling with variable penalty duration and movement speed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Nighttime: Levels 1-4 now have 7 rows visibility (boss: 5 rows)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Busy Beach boss now spawns every 2.5s with faster people (1-6 cols/sec)</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400 font-semibold text-sm">Version 0.942</p>
              <ul className="text-white/80 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Fixed Gummy Beach wave touch detection not matching visual toe position</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Fixed Crystal Conch indicator not visible in Nighttime darkness</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.941</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Fixed beach name showing wrong beach on level complete screen after boss battles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Waves Touched HUD now shows progress as touched/required</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.94</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Fixed Auto Toe Tap mode not being preserved when continuing a run</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.93</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Fixed Teleport immunity being cut short when teleporting multiple times</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Added beach effect descriptions to Beach Selection screen</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.92</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Fixed Auto Toe Tap visual - taps now show proper toe extension</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.91</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>NEW: Auto Toe Tap mode - automatically taps when waves are in reach</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Waves to win now increases by +2 starting at 8 waves (level 21+)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Waves limit upgrade now offered every 5 levels with no cap</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.90</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>NEW: Foot Types! Choose your playstyle before each run</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Tourist, Beach Bum, Speedster, and Toe Warrior options</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.84</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Added visual gear meter for Momentum mode (PC: on beach, Mobile: next to controls)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Start screen now remembers last selected movement mode and run type</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400 font-semibold text-sm">Version 0.83</p>
              <ul className="text-white/80 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Updated beach color themes for better visual distinction</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400 font-semibold text-sm">Version 0.82</p>
              <ul className="text-white/80 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Fixed Beach Bonanza runs reverting to Standard after closing app</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400 font-semibold text-sm">Version 0.81</p>
              <ul className="text-white/80 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Fixed Crystal Conch not working after Wave Magnet was used</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Wave Magnet now uses integer offsets for consistent wave positioning</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400 font-semibold text-sm">Version 0.80</p>
              <ul className="text-white/80 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Beach Bonanza: Select beach BEFORE choosing upgrades after boss</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Beach Bonanza: Levels 1-4 now scale difficulty toward the boss</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Fixed level numbering display in Beach Bonanza mode</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400 font-semibold text-sm">Version 0.71</p>
              <ul className="text-white/80 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>NEW: Beach Bonanza run type - choose your beach!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Beach Bonanza: 5 levels per beach with escalating effects</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Beach Bonanza: Level 5 is the full boss effect</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>10 unique beaches cycle without repeating</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400 font-semibold text-sm">Version 0.70</p>
              <ul className="text-white/80 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Momentum Mode: Reworked to 7-gear system (Run/Walk/Crawl in each direction)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Teleporting now resets gear to Neutral</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400 font-semibold text-sm">Version 0.63</p>
              <ul className="text-white/80 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Teleport: Now lands within half a row of the wave peak (nerfed)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Wave Magnet: Removed feet snap; waves now peak within 1 row of feet (nerfed)</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-violet-400 font-semibold text-sm">Version 0.62</p>
              <ul className="text-white/80 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Teleport: Immunity now starts immediately when queued and extends at destination</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Wave Magnet: Fixed peak calculation so feet are never pushed away from shore</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-violet-400 font-semibold text-sm">Version 0.61</p>
              <ul className="text-white/80 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Teleport: Immunity glow now persists after ability timer expires</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Fixed Wet Suit water tolerance display (now shows correct 3s base)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Water limit upgrades no longer appear on Boss Beach levels</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>New ability unlocks stop after level 20</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-violet-400 font-semibold text-sm">Version 0.60</p>
              <ul className="text-white/80 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Wave Magnet: Fixed next wave spawning too far after magnet expires</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Wave Magnet: Waves now consistently peak just in front of your feet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Wave Magnet: Feet are now pulled to the wave when it's about to peak</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Added visual glow effect when feet are magnetized to a wave</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.58</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Reduced starting water timer from 6s to 5s for increased challenge</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.57</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Fixed wave requirement not updating correctly when advancing levels</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Fixed Slowdown showing incorrect base duration in upgrade menu</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Standardized ability descriptions in unlock/upgrade screens</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.56</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Difficulty rebalance: 4200ms spawn (was 5000ms), 2500ms peak (was 3000ms), 250ms speed (was 300ms)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Scaling reduced to 2% per level (was 3%)</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.55</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Fixed PC keyboard hold-to-move delay - now responds immediately like mobile</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.54</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Ghost Feet nerfed: 5s base duration (was 15s), +0.6s per upgrade (was +1s)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Wave Magnet buffed: 5s base duration (was 4s)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Wave Surfer buffed: +0.7s per upgrade (was +0.5s)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Jump Around nerfed: +0.8s per upgrade (was +1s)</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.53</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Ghost Toe renamed to Ghost Feet with larger visual extension</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Slowdown buffed: 12s base duration (was 10s), +1.2s per upgrade (was +1s)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Towel Off buffed: 20% recovery rate (was 10%), capped at level start time</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.52</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Slowdown base duration increased to 10s (was 5s)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Retry Level no longer resets total score (failed level gives no points)</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.51</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Slowdown now also reduces wave spawn rate by 60%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Slowdown upgrade increased to +1s per level (was +0.5s)</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.50</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Permanent Upgrades after Boss Beaches: Fast Feet (+10% speed), Tap Dancer (+15% reach), Wet Shoes (-10% drain)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>HUD now shows permanent upgrade bonuses with tooltips</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Quicksand: Now triggers after 0.3s (was 0.4s), penalty lasts 1.5s (was 1s)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Heavy Sand: 65% slower movement on boss level</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.44</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Waves to win now increases by 1 until reaching 10, then by 2</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Added warning when misses allowed decreases on level complete</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.43</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Fixed first toe tap of a level sometimes going backwards</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.42</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Fixed mobile tap causing multiple movements per press</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.41</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Fixed mobile controls causing infinite movement on level transitions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Added total steps and toe taps tracking on game over screen</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.4</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Waves missed limit now properly decreases after upgrades (1-level grace period)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Fixed water time upgrade values at level 20+ (0.2s) and 30+ (0.1s)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/70">•</span>
                  <span>Waves missed upgrade now properly appears at level 20</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-violet-400/70 font-semibold text-sm">Version 0.3</p>
              <ul className="text-white/60 text-sm space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/50">•</span>
                  <span>Added Jump Around ability (4x vertical speed)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/50">•</span>
                  <span>Added Busy Beach boss effect</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400/50">•</span>
                  <span>Save and continue runs from level complete screen</span>
                </li>
              </ul>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default RoguelikeStartScreen;
