import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Baby, Smile, Target, Flame, Skull } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type WavesDifficulty = "beginner" | "easy" | "medium" | "hard" | "expert";

interface DifficultySelectProps {
  onSelect: (difficulty: WavesDifficulty) => void;
}

const standardDifficulties: {
  id: WavesDifficulty;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
}[] = [
  {
    id: "beginner",
    name: "Beginner",
    description: "Slow waves, longer peaks",
    icon: <Baby className="w-5 h-5" />,
    color: "text-green-400",
    borderColor: "border-green-500/50 hover:border-green-400",
  },
  {
    id: "easy",
    name: "Easy",
    description: "Relaxed timing",
    icon: <Smile className="w-5 h-5" />,
    color: "text-cyan-400",
    borderColor: "border-cyan-500/50 hover:border-cyan-400",
  },
  {
    id: "medium",
    name: "Medium",
    description: "Balanced challenge",
    icon: <Target className="w-5 h-5" />,
    color: "text-yellow-400",
    borderColor: "border-yellow-500/50 hover:border-yellow-400",
  },
  {
    id: "hard",
    name: "Hard",
    description: "Speeds up every 5 waves",
    icon: <Flame className="w-5 h-5" />,
    color: "text-orange-400",
    borderColor: "border-orange-500/50 hover:border-orange-400",
  },
  {
    id: "expert",
    name: "Expert",
    description: "Fast start, rapid scaling",
    icon: <Skull className="w-5 h-5" />,
    color: "text-red-400",
    borderColor: "border-red-500/50 hover:border-red-400",
  },
];

const DifficultySelect = ({ onSelect }: DifficultySelectProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [abilitiesOpen, setAbilitiesOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 py-4 px-2">
      {/* Game intro */}
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-white text-base sm:text-lg font-medium drop-shadow-lg">
          Touch waves to score without getting too wet!
        </p>
      </div>

      {/* Rules Dropdown */}
      <Collapsible open={rulesOpen} onOpenChange={setRulesOpen} className="w-full max-w-md">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-cyan-500/30 hover:bg-slate-900/70 transition-colors">
          <span className="text-base sm:text-lg font-display text-cyan-400">Rules & Controls</span>
          <ChevronDown className={`w-5 h-5 text-cyan-400/70 transition-transform ${rulesOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-slate-900/40 backdrop-blur-sm rounded-b-xl border border-t-0 border-cyan-500/30 p-3 sm:p-4">
          <ul className="text-white/80 text-xs sm:text-sm space-y-1.5 sm:space-y-2 text-left">
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>Touch waves with your toes to score points</span>
            </li>
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>Your water timer drains when your feet are in the water</span>
            </li>
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>Game over if timer runs out or you miss 10 waves</span>
            </li>
          </ul>
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-cyan-400 font-semibold text-sm mb-2">Controls:</p>
            <div className="space-y-1.5 text-xs sm:text-sm text-white/70">
              <p><span className="text-cyan-400 font-mono">↑/↓ or W/S:</span> Move ¼ row up/down</p>
              <p><span className="text-cyan-400 font-mono">Space/Enter:</span> Toe tap forward</p>
            </div>
            <p className="text-amber-300 mt-3 text-xs">
              💡 Quick toe taps minimize water contact!
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Abilities Dropdown */}
      <Collapsible open={abilitiesOpen} onOpenChange={setAbilitiesOpen} className="w-full max-w-md">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-amber-500/30 hover:bg-slate-900/70 transition-colors">
          <span className="text-base sm:text-lg font-display text-amber-400">Abilities</span>
          <ChevronDown className={`w-5 h-5 text-amber-400/70 transition-transform ${abilitiesOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-slate-900/40 backdrop-blur-sm rounded-b-xl border border-t-0 border-amber-500/30 p-3 sm:p-4">
          <p className="text-amber-300/80 text-xs italic mb-3">*Each ability has a 1 minute cooldown*</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-yellow-500/10 rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">👕</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-sm font-medium">Wet Suit</span>
                  <span className="text-white/40 text-xs font-mono">[V]</span>
                </div>
                <p className="text-white/60 text-xs leading-relaxed">
                  Freeze water timer for 10s
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-orange-500/10 rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">⚡</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-orange-400 text-sm font-medium">Super Tap</span>
                  <span className="text-white/40 text-xs font-mono">[B]</span>
                </div>
                <p className="text-white/60 text-xs leading-relaxed">
                  3x toe reach for 5 taps
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-purple-500/10 rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">👻</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 text-sm font-medium">Ghost Feet</span>
                  <span className="text-white/40 text-xs font-mono">[N]</span>
                </div>
                <p className="text-white/60 text-xs leading-relaxed">
                  Extended reach for 15s, no timer penalty
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Select Difficulty Header */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-display text-cyan-400 mb-1 drop-shadow-lg">
          Select Difficulty
        </h2>
      </div>

      {/* Difficulty Buttons */}
      <div className="flex flex-col gap-2 w-full max-w-md">
        {standardDifficulties.map((diff) => (
          <Button
            key={diff.id}
            variant="outline"
            onClick={() => onSelect(diff.id)}
            className={cn(
              "flex items-center justify-between h-auto py-3 px-4 bg-slate-900/50",
              diff.borderColor
            )}
          >
            <div className="flex items-center gap-3">
              <span className={diff.color}>{diff.icon}</span>
              <div className="text-left">
                <p className={cn("font-semibold", diff.color)}>{diff.name}</p>
                <p className="text-xs text-white/50">{diff.description}</p>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DifficultySelect;
