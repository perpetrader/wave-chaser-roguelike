import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Superpower, Difficulty } from "./types";
import rechargeImage from "@/assets/novadoku/recharge.png";
import doubleAImage from "@/assets/novadoku/double-a.png";
import powerOrbImage from "@/assets/novadoku/power-orb.png";

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

interface SuperpowerCardProps {
  superpower: Superpower;
  selected: boolean;
  onSelect: () => void;
  cooldownRemaining: number;
  difficulty: Difficulty;
  used?: boolean;
}

const imageMap: Record<string, string> = {
  recharge: rechargeImage,
  "double-a": doubleAImage,
};

const getCooldownText = (difficulty: Difficulty): string => {
  const cooldownByDifficulty: Record<Difficulty, number> = {
    beginner: 0,
    easy: 1,
    medium: 2,
    hard: 3,
    expert: 3,
    "impossible-3x3": 3,
    "impossible-4x4": 3,
    "locked-beginner": 0,
    "locked-easy": 1,
    "locked-medium": 2,
    "locked-hard": 3,
    "locked-expert": 3,
    "locked-impossible-3x3": 3,
    "locked-impossible-4x4": 3,
  };
  const cooldown = cooldownByDifficulty[difficulty];
  return cooldown === 0 ? "No cooldown" : `Cooldown: ${cooldown} move${cooldown > 1 ? "s" : ""}`;
};

export const SuperpowerCard = ({
  superpower,
  selected,
  onSelect,
  cooldownRemaining,
  difficulty,
  used = false,
}: SuperpowerCardProps) => {
  const [showAbility, setShowAbility] = useState(false);
  const lastTapTime = useRef(0);
  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTouching = useRef(false);
  const isOnCooldown = cooldownRemaining > 0;
  const isDisabled = isOnCooldown || used;

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
      }
    };
  }, []);

  // Touch handlers for iOS compatibility
  const handleTouchStart = () => {
    isTouching.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent click from firing
    
    if (isDisabled) {
      isTouching.current = false;
      return;
    }
    
    const now = Date.now();
    const timeDiff = now - lastTapTime.current;
    
    // Double tap detection (within 300ms)
    if (timeDiff < 300) {
      // Double tap - show ability popup
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
        tapTimeout.current = null;
      }
      setShowAbility(true);
      lastTapTime.current = 0;
    } else {
      // Single tap - delay to check for double tap
      lastTapTime.current = now;
      tapTimeout.current = setTimeout(() => {
        // Single tap confirmed - select
        setShowAbility(false);
        onSelect();
        tapTimeout.current = null;
      }, 300);
    }
    
    isTouching.current = false;
  };

  // Mouse handlers for desktop
  const handleClick = () => {
    // Ignore if this was a touch event
    if (isTouching.current) return;
    if (isDisabled) return;
    
    setShowAbility(false);
    onSelect();
  };

  const handleMouseEnter = () => {
    if (!isDisabled) {
      setShowAbility(true);
    }
  };

  const handleMouseLeave = () => {
    setShowAbility(false);
  };

  const handlePopupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAbility(false);
  };

  return (
    <div className="relative">
      <button
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={isDisabled}
        className={cn(
          "flex flex-col items-center p-2 sm:p-3 rounded-xl transition-all duration-200",
          "bg-amber-500/20 backdrop-blur-sm border-2",
          isDisabled
            ? "border-white/10 opacity-40 cursor-not-allowed"
            : selected
            ? "border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)] scale-105"
            : "border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-500/30"
        )}
      >
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-1">
          <img
            src={imageMap[superpower.id] || superpower.image}
            alt={superpower.name}
            className="w-full h-full object-contain"
          />
          {isOnCooldown && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
              <span className="text-white font-bold text-lg">{cooldownRemaining}</span>
            </div>
          )}
          {used && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
              <span className="text-white/60 font-bold text-xs">USED</span>
            </div>
          )}
        </div>
        <span className="text-amber-200 text-xs sm:text-sm font-medium truncate max-w-full">
          {superpower.name}
        </span>
      </button>

      {/* Ability Popup */}
      {showAbility && !isDisabled && (
        <div
          onClick={handlePopupClick}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48 p-3 rounded-lg bg-black/90 backdrop-blur-sm border border-amber-400/50 shadow-xl cursor-pointer animate-fade-in"
        >
          <p className="text-amber-400 font-semibold text-sm mb-1">{superpower.name}</p>
          <p className="text-white/90 text-xs leading-relaxed">{renderDescriptionWithPowerIcon(superpower.description)}</p>
          <p className="text-amber-300/80 text-xs mt-1">
            {superpower.oneTimeUse ? "One use per game" : getCooldownText(difficulty)}
          </p>
          <p className="text-white/50 text-[10px] mt-2 italic">Tap to dismiss</p>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-black/90" />
        </div>
      )}
    </div>
  );
};
