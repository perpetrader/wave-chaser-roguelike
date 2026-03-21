import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Difficulty, DIFFICULTY_CONFIG, FRIENDS, SUPERPOWERS } from "./types";
import gridExampleImage from "@/assets/novadoku/grid-example.png";
import powerOrbImage from "@/assets/novadoku/power-orb.png";
import rechargeImage from "@/assets/novadoku/recharge.png";
import doubleAImage from "@/assets/novadoku/double-a.png";

interface DifficultySelectProps {
  onSelect: (difficulty: Difficulty) => void;
}

// Helper to render description with power orb icons
const renderDescriptionWithPowerIcon = (text: string) => {
  const parts = text.split('[POWER]');
  if (parts.length === 1) return text;
  
  return parts.map((part, index) => (
    <span key={index}>
      {part}
      {index < parts.length - 1 && (
        <img 
          src={powerOrbImage} 
          alt="Power" 
          className="inline-block w-4 h-4 align-text-bottom mx-0.5"
        />
      )}
    </span>
  ));
};

const superpowerImages: Record<string, string> = {
  recharge: rechargeImage,
  "double-a": doubleAImage,
};

export const DifficultySelect = ({ onSelect }: DifficultySelectProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [cardsOpen, setCardsOpen] = useState(false);
  
  const openGridDifficulties: Difficulty[] = ["beginner", "easy", "medium", "hard", "expert", "impossible-3x3", "impossible-4x4"];
  const lockedCellsDifficulties: Difficulty[] = ["locked-beginner", "locked-easy", "locked-medium", "locked-hard", "locked-expert", "locked-impossible-3x3", "locked-impossible-4x4"];

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 py-4 sm:py-8 px-3 sm:px-4">
      {/* Grid example image */}
      <div className="flex flex-col items-center gap-2 sm:gap-3">
        <img 
          src={gridExampleImage} 
          alt="Example grid with Friends" 
          className="w-36 h-36 sm:w-56 sm:h-56 object-contain"
        />
        <p className="text-white text-base sm:text-lg font-medium drop-shadow-lg text-center">
          Fill the grid with one of each number to win!
        </p>
      </div>

      {/* Game Rules Dropdown */}
      <Collapsible open={rulesOpen} onOpenChange={setRulesOpen} className="w-full max-w-lg">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-black/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20 hover:bg-black/50 transition-colors">
          <span className="text-base sm:text-lg font-display text-white">Game Rules</span>
          <ChevronDown className={`w-5 h-5 text-white/70 transition-transform ${rulesOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-black/30 backdrop-blur-sm rounded-b-xl border border-t-0 border-white/20 p-3 sm:p-4">
          <ul className="text-white/80 text-xs sm:text-sm space-y-1.5 sm:space-y-2 text-left">
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>Goal: Fill the grid so each Friend has a unique {renderDescriptionWithPowerIcon("[POWER]")} number</span>
            </li>
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>Place Friends on the grid by tapping a card, then a cell</span>
            </li>
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>Most Friends have special abilities</span>
            </li>
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>{renderDescriptionWithPowerIcon("[POWER]")} is capped between 1 and the grid size (can't go higher or lower)</span>
            </li>
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>Friends can be used multiple times, but have a 1-move cooldown</span>
            </li>
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>Use Superpowers to modify placed Friends' {renderDescriptionWithPowerIcon("[POWER]")} (cooldown varies by difficulty)</span>
            </li>
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>Tap a filled cell to remove the Friend (Beginner, Easy, Medium)</span>
            </li>
          </ul>
        </CollapsibleContent>
      </Collapsible>

      {/* Cards & Superpowers Dropdown */}
      <Collapsible open={cardsOpen} onOpenChange={setCardsOpen} className="w-full max-w-lg">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-black/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20 hover:bg-black/50 transition-colors">
          <span className="text-base sm:text-lg font-display text-white">Cards & Superpowers</span>
          <ChevronDown className={`w-5 h-5 text-white/70 transition-transform ${cardsOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-black/30 backdrop-blur-sm rounded-b-xl border border-t-0 border-white/20 p-3 sm:p-4">
          {/* Superpowers */}
          <h4 className="text-sm font-semibold text-amber-400 mb-2">Superpowers</h4>
          <div className="space-y-2 mb-4">
            {SUPERPOWERS.map((superpower) => (
              <div key={superpower.id} className="flex items-start gap-2 bg-amber-500/10 rounded-lg p-2">
                <img 
                  src={superpowerImages[superpower.id] || superpower.image} 
                  alt={superpower.name} 
                  className="w-10 h-10 object-contain flex-shrink-0" 
                />
                <div className="flex-1 min-w-0">
                  <span className="text-amber-300 text-sm font-medium">{superpower.name}</span>
                  <p className="text-white/60 text-xs leading-relaxed">
                    {renderDescriptionWithPowerIcon(superpower.description)}
                    {superpower.oneTimeUse && <span className="text-amber-400/70 ml-1">(one use per game)</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Friends */}
          <h4 className="text-sm font-semibold text-primary mb-2">Friends</h4>
          <div className="space-y-2">
            {[...FRIENDS].sort((a, b) => a.name.localeCompare(b.name)).map((friend) => (
              <div key={friend.id} className="flex items-start gap-2 bg-black/20 rounded-lg p-2">
                <img src={friend.image} alt={friend.name} className="w-10 h-10 object-contain flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{friend.name}</span>
                    <div className="flex items-center gap-0.5">
                      <img src={powerOrbImage} alt="" className="w-4 h-4" />
                      <span className="text-white/70 text-xs">{friend.basePower}</span>
                    </div>
                  </div>
                  <p className="text-white/60 text-xs leading-relaxed">
                    {friend.abilityDescription.includes('\n') 
                      ? renderDescriptionWithPowerIcon(friend.abilityDescription.split('\n')[0])
                      : renderDescriptionWithPowerIcon(friend.abilityDescription)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-display text-gradient mb-1 sm:mb-2 drop-shadow-lg">
          Select Difficulty
        </h2>
        <p className="text-white/80 text-xs sm:text-sm drop-shadow-md">
          Choose your challenge level
        </p>
      </div>

      {/* Open Grid Section */}
      <div className="w-full max-w-3xl">
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
          <h3 className="text-base sm:text-lg font-display text-white mb-2 sm:mb-3 text-center">Open Grid</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
            {openGridDifficulties.map((difficulty) => {
              const config = DIFFICULTY_CONFIG[difficulty];
              return (
                <Button
                  key={difficulty}
                  variant="outline"
                  className="flex flex-col items-center gap-0.5 sm:gap-1 h-auto py-2 sm:py-4 px-1 sm:px-4 bg-black/40 hover:bg-black/60 border-white/30 hover:border-primary/50 transition-all"
                  onClick={() => onSelect(difficulty)}
                >
                  <span className="text-xs sm:text-base font-semibold text-white">
                    {config.label}
                  </span>
                  <span className="text-[10px] sm:text-xs text-white/70 text-center leading-tight">{config.description}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Locked Cells Section */}
      <div className="w-full max-w-3xl">
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
          <h3 className="text-base sm:text-lg font-display text-white mb-2 sm:mb-3 text-center">Locked Cells</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
            {lockedCellsDifficulties.map((difficulty) => {
              const config = DIFFICULTY_CONFIG[difficulty];
              return (
                <Button
                  key={difficulty}
                  variant="outline"
                  className="flex flex-col items-center gap-0.5 sm:gap-1 h-auto py-2 sm:py-4 px-1 sm:px-4 bg-black/40 hover:bg-black/60 border-white/30 hover:border-primary/50 transition-all"
                  onClick={() => onSelect(difficulty)}
                >
                  <span className="text-xs sm:text-base font-semibold text-white">
                    {config.label}
                  </span>
                  <span className="text-[10px] sm:text-xs text-white/70 text-center leading-tight">{config.description}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
