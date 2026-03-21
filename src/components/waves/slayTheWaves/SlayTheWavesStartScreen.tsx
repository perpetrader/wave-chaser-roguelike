// Slay the Waves - Start Screen

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronDown, Swords, ArrowLeft, Gauge, Footprints, Target, Skull, Sparkles, Map } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import roguelikeBg from "@/assets/waves/roguelike-bg.png";
import type { MovementMode } from "../WavesGame";
import { FootType, ToeTapMode } from "../RoguelikeStartScreen";
import { STARTING_GOLD, FLOORS_PER_ACT, TOTAL_ACTS } from "./types";

interface SlayTheWavesStartScreenProps {
  onStart: (movementMode: MovementMode, footType: FootType, toeTapMode: ToeTapMode) => void;
  onContinue?: () => void;
  hasSavedRun: boolean;
}

const MOVEMENT_MODES: { mode: MovementMode; name: string; description: string }[] = [
  { mode: "standard", name: "Standard", description: "Direct movement with arrow keys" },
  { mode: "slowerForward", name: "Slower Forward", description: "30% slower when moving toward shore" },
  { mode: "momentum", name: "Momentum", description: "Accelerate/decelerate with arrow keys" },
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

const SlayTheWavesStartScreen = ({ onStart, onContinue, hasSavedRun }: SlayTheWavesStartScreenProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [selectedMovementMode, setSelectedMovementMode] = useState<MovementMode>(() => {
    const saved = localStorage.getItem("waveChaser_movementMode");
    return (saved as MovementMode) || "standard";
  });
  const [selectedFootType, setSelectedFootType] = useState<FootType>(() => {
    const saved = localStorage.getItem("waveChaser_footType");
    return (saved as FootType) || "tourist";
  });
  const [selectedToeTapMode, setSelectedToeTapMode] = useState<ToeTapMode>(() => {
    const saved = localStorage.getItem("waveChaser_toeTapMode");
    return (saved as ToeTapMode) || "manual";
  });

  // Persist selections
  useEffect(() => {
    localStorage.setItem("waveChaser_movementMode", selectedMovementMode);
  }, [selectedMovementMode]);

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
      {/* Back link */}
      <Link
        to="/"
        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Games</span>
      </Link>

      {/* Title */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2 text-red-400 mb-1">
          <Skull className="w-6 h-6" />
          <span className="text-xl font-display">Slay the Waves</span>
          <Skull className="w-6 h-6" />
        </div>
        <p className="text-white text-base sm:text-lg font-medium drop-shadow-lg">
          A roguelike deckbuilder adventure!
        </p>
        <p className="text-white/70 text-sm max-w-md">
          Navigate a branching map, battle beaches, collect abilities, and defeat bosses.
          Inspired by Slay the Spire.
        </p>
      </div>

      {/* Key features */}
      <div className="grid grid-cols-2 gap-3 max-w-md w-full">
        <div className="bg-slate-900/60 rounded-lg p-3 border border-purple-500/30 text-center">
          <Map className="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <p className="text-white/80 text-sm">Branching Paths</p>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-3 border border-yellow-500/30 text-center">
          <Sparkles className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <p className="text-white/80 text-sm">Gold & Shops</p>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-3 border border-cyan-500/30 text-center">
          <Swords className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
          <p className="text-white/80 text-sm">Card Rewards</p>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-3 border border-red-500/30 text-center">
          <Skull className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-white/80 text-sm">{TOTAL_ACTS} Acts, {FLOORS_PER_ACT} Floors</p>
        </div>
      </div>

      {/* Movement Mode Selection */}
      <Collapsible className="w-full max-w-md">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-emerald-500/30 hover:bg-slate-900/70 transition-colors">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span className="text-base sm:text-lg font-display text-emerald-400">Movement</span>
            <span className="text-xs text-emerald-400/70 bg-emerald-400/10 px-2 py-0.5 rounded">
              {MOVEMENT_MODES.find(m => m.mode === selectedMovementMode)?.name}
            </span>
          </div>
          <ChevronDown className="w-5 h-5 text-emerald-400/70" />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-slate-900/90 backdrop-blur-sm rounded-b-xl border border-t-0 border-emerald-500/30 p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2">
            {MOVEMENT_MODES.map(({ mode, name, description }) => (
              <button
                key={mode}
                onClick={() => setSelectedMovementMode(mode)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selectedMovementMode === mode
                    ? "bg-emerald-600/30 border-emerald-400 ring-2 ring-emerald-400/50"
                    : "bg-slate-800/50 border-white/10 hover:bg-slate-700/50"
                }`}
              >
                <span className={`font-semibold ${selectedMovementMode === mode ? "text-emerald-400" : "text-white"}`}>
                  {name}
                </span>
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
          <ChevronDown className="w-5 h-5 text-orange-400/70" />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-slate-900/90 backdrop-blur-sm rounded-b-xl border border-t-0 border-orange-500/30 p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2">
            {FOOT_TYPES.map(({ type, name, description }) => (
              <button
                key={type}
                onClick={() => setSelectedFootType(type)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selectedFootType === type
                    ? "bg-orange-600/30 border-orange-400 ring-2 ring-orange-400/50"
                    : "bg-slate-800/50 border-white/10 hover:bg-slate-700/50"
                }`}
              >
                <span className={`font-semibold ${selectedFootType === type ? "text-orange-400" : "text-white"}`}>
                  {name}
                </span>
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
            <span className="text-base sm:text-lg font-display text-pink-400">Toe Tap</span>
            <span className="text-xs text-pink-400/70 bg-pink-400/10 px-2 py-0.5 rounded">
              {TOE_TAP_MODES.find(t => t.mode === selectedToeTapMode)?.name}
            </span>
          </div>
          <ChevronDown className="w-5 h-5 text-pink-400/70" />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-slate-900/90 backdrop-blur-sm rounded-b-xl border border-t-0 border-pink-500/30 p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2">
            {TOE_TAP_MODES.map(({ mode, name, description }) => (
              <button
                key={mode}
                onClick={() => setSelectedToeTapMode(mode)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selectedToeTapMode === mode
                    ? "bg-pink-600/30 border-pink-400 ring-2 ring-pink-400/50"
                    : "bg-slate-800/50 border-white/10 hover:bg-slate-700/50"
                }`}
              >
                <span className={`font-semibold ${selectedToeTapMode === mode ? "text-pink-400" : "text-white"}`}>
                  {name}
                </span>
                <p className="text-sm text-white/60 mt-1">{description}</p>
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Continue button */}
      {hasSavedRun && onContinue && (
        <Button
          onClick={onContinue}
          className="w-full max-w-md h-14 text-lg font-display bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white border-none shadow-lg shadow-cyan-500/30"
        >
          <Swords className="w-5 h-5 mr-2" />
          Continue Run
        </Button>
      )}

      {/* Start button */}
      <Button
        onClick={() => onStart(selectedMovementMode, selectedFootType, selectedToeTapMode)}
        variant={hasSavedRun ? "outline" : "default"}
        className={hasSavedRun 
          ? "w-full max-w-md h-12 text-base font-display border-red-500/50 text-red-400 hover:bg-red-500/10"
          : "w-full max-w-md h-14 text-lg font-display bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white border-none shadow-lg shadow-red-500/30"
        }
      >
        <Skull className="w-5 h-5 mr-2" />
        {hasSavedRun ? "Start New Run" : "Begin Adventure"}
      </Button>

      {/* Rules */}
      <Collapsible open={rulesOpen} onOpenChange={setRulesOpen} className="w-full max-w-md">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-cyan-500/30 hover:bg-slate-900/70 transition-colors">
          <span className="text-base sm:text-lg font-display text-cyan-400">How to Play</span>
          <ChevronDown className={`w-5 h-5 text-cyan-400/70 transition-transform ${rulesOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-slate-900/90 backdrop-blur-sm rounded-b-xl border border-t-0 border-cyan-500/30 p-3 sm:p-4">
          <ul className="text-white/80 text-sm space-y-2 text-left">
            <li>• Navigate the map by choosing your path</li>
            <li>• Beach nodes are wave battles - touch waves to score</li>
            <li>• Elite nodes are harder but give better rewards</li>
            <li>• Rest sites let you heal or upgrade abilities</li>
            <li>• Events offer risk/reward choices</li>
            <li>• Shops let you buy abilities and upgrades</li>
            <li>• Defeat the Act Boss to advance</li>
            <li>• Starting gold: {STARTING_GOLD} 💰</li>
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default SlayTheWavesStartScreen;
