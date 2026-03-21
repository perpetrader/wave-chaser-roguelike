import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Friend } from "./types";
import powerOrbImage from "@/assets/novadoku/power-orb.png";

interface FriendCardProps {
  friend: Friend;
  selected: boolean;
  onSelect: () => void;
  cooldownRemaining: number;
  onDragStart?: (friend: Friend) => void;
  onDragEnd?: () => void;
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

export const FriendCard = ({ friend, selected, onSelect, cooldownRemaining, onDragStart, onDragEnd }: FriendCardProps) => {
  const onCooldown = cooldownRemaining > 0;
  const [showAbility, setShowAbility] = useState(false);
  const lastTapTime = useRef(0);
  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const isTouchDevice = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (onCooldown) {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    setShowAbility(false);
    e.dataTransfer.setData("application/json", JSON.stringify(friend));
    e.dataTransfer.effectAllowed = "move";
    onDragStart?.(friend);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  // Adjust popup position to stay within screen bounds
  useEffect(() => {
    if (showAbility && popupRef.current && containerRef.current) {
      const popup = popupRef.current;
      const popupRect = popup.getBoundingClientRect();
      const padding = 8;

      let left = '50%';

      // Check if popup goes off the left edge
      if (popupRect.left < padding) {
        const offset = padding - popupRect.left;
        left = `calc(50% + ${offset}px)`;
      }
      // Check if popup goes off the right edge
      else if (popupRect.right > window.innerWidth - padding) {
        const offset = popupRect.right - (window.innerWidth - padding);
        left = `calc(50% - ${offset}px)`;
      }

      setPopupStyle({ left, transform: 'translateX(-50%)' });
    }
  }, [showAbility]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
      }
    };
  }, []);

  const handleTouchStart = () => {
    // Mark that we're using touch
    isTouchDevice.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent mouse events from firing after touch
    
    if (onCooldown) return;

    const now = Date.now();
    const timeDiff = now - lastTapTime.current;
    
    // Double tap detection (within 300ms)
    if (timeDiff < 300 && timeDiff > 0) {
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
        // Single tap confirmed - select the friend
        setShowAbility(false);
        onSelect();
        tapTimeout.current = null;
      }, 300);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Ignore click if it came from touch (touch already handled it)
    if (isTouchDevice.current) {
      isTouchDevice.current = false;
      return;
    }
    
    if (onCooldown) return;
    
    // On desktop, single click selects
    setShowAbility(false);
    onSelect();
  };

  const handleMouseEnter = () => {
    // Only show on hover for non-touch devices
    if (!onCooldown && !isTouchDevice.current) {
      setShowAbility(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isTouchDevice.current) {
      setShowAbility(false);
    }
  };

  const handlePopupClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setShowAbility(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        draggable={!onCooldown}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="button"
        tabIndex={onCooldown ? -1 : 0}
        className={cn(
          "flex flex-col items-center p-2 sm:p-3 rounded-xl transition-all duration-200 w-full cursor-grab active:cursor-grabbing",
          "bg-black/40 backdrop-blur-sm border-2",
          onCooldown
            ? "border-white/10 opacity-40 cursor-not-allowed"
            : isDragging
            ? "border-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)] opacity-50"
            : selected
            ? "border-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)] scale-105"
            : "border-white/20 hover:border-white/40 hover:bg-black/50"
        )}
      >
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-1">
          <img
            src={friend.image}
            alt={friend.name}
            className="w-full h-full object-contain"
          />
          {onCooldown && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
              <span className="text-white font-bold text-lg">{cooldownRemaining}</span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full overflow-hidden">
            <img src={powerOrbImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <span className="relative text-xs sm:text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {friend.basePower}
            </span>
          </div>
        </div>
        <span className="text-white text-xs sm:text-sm font-medium truncate max-w-full">
          {friend.name}
        </span>
      </div>

      {/* Ability Popup */}
      {showAbility && !onCooldown && !isDragging && (
        <div
          ref={popupRef}
          onClick={handlePopupClick}
          style={popupStyle}
          className="absolute bottom-full -translate-x-1/2 mb-2 z-50 w-48 p-3 rounded-lg bg-black/90 backdrop-blur-sm border border-white/30 shadow-xl cursor-pointer animate-fade-in"
        >
          <p className="text-primary font-semibold text-sm mb-1">{friend.name}</p>
          {friend.abilityDescription.includes('\n') ? (
            <>
              <p className="text-white/90 text-xs leading-relaxed">{renderDescriptionWithPowerIcon(friend.abilityDescription.split('\n')[0])}</p>
              <p className="text-white/70 text-xs leading-relaxed italic">{friend.abilityDescription.split('\n')[1]}</p>
            </>
          ) : (
            <p className="text-white/90 text-xs leading-relaxed">{renderDescriptionWithPowerIcon(friend.abilityDescription)}</p>
          )}
          <p className="text-white/50 text-[10px] mt-2 italic">Tap to dismiss</p>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-black/90" />
        </div>
      )}
    </div>
  );
};
