import { useState } from "react";
import { cn } from "@/lib/utils";
import { Friend, PlacedFriend } from "./types";
import powerOrbImage from "@/assets/novadoku/power-orb.png";
import { Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GridCellProps {
  cell: PlacedFriend | null;
  onClick: () => void;
  onDrop?: (friend: Friend) => void;
  size: number;
  highlighted?: boolean;
  volataBoostTarget?: boolean;
  sizzleDrainTarget?: boolean;
  overheaterBoostTarget?: boolean;
  hasPowerBoost?: boolean;
  targetNumber?: number;
  isDragging?: boolean;
}

export const GridCell = ({ cell, onClick, onDrop, size, highlighted, volataBoostTarget, sizzleDrainTarget, overheaterBoostTarget, hasPowerBoost, targetNumber, isDragging }: GridCellProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  
  const cellSize = size <= 2 ? "w-24 h-24 sm:w-32 sm:h-32" : 
                   size <= 3 ? "w-20 h-20 sm:w-24 sm:h-24" : 
                   "w-16 h-16 sm:w-20 sm:h-20";

  const isLocked = cell?.locked;
  const hasTarget = targetNumber !== undefined;
  const isLockedInImpossible = isLocked && hasTarget;
  const matchesTarget = hasTarget && cell && cell.currentPower === targetNumber;
  const mismatchesTarget = hasTarget && cell && !cell.locked && cell.currentPower !== targetNumber;
  
  // Can drop on empty, non-locked cells
  const canDrop = !cell && !isLocked;

  const handleDragOver = (e: React.DragEvent) => {
    if (canDrop) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (!canDrop) return;
    
    try {
      const friendData = e.dataTransfer.getData("application/json");
      if (friendData) {
        const friend: Friend = JSON.parse(friendData);
        onDrop?.(friend);
      }
    } catch (err) {
      console.error("Failed to parse dropped friend data:", err);
    }
  };

  return (
    <button
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      disabled={isLocked}
      className={cn(
        cellSize,
        "rounded-xl transition-all duration-200 flex items-center justify-center relative",
        "border-2 backdrop-blur-sm",
        isLockedInImpossible
          ? "bg-green-500/30 border-green-400/50 cursor-not-allowed"
          : isLocked
          ? "bg-slate-700/60 border-slate-500 cursor-not-allowed"
          : isDragOver
          ? "bg-primary/40 border-primary ring-2 ring-primary/50 scale-105"
          : isDragging && canDrop
          ? "bg-primary/20 border-primary/50"
          : volataBoostTarget
          ? "bg-purple-500/30 border-purple-400 ring-2 ring-purple-400/50 animate-pulse"
          : sizzleDrainTarget
          ? "bg-orange-500/30 border-orange-400 ring-2 ring-orange-400/50 animate-pulse"
          : overheaterBoostTarget
          ? "bg-red-500/30 border-red-400 ring-2 ring-red-400/50 animate-pulse"
          : mismatchesTarget
          ? "bg-red-500/30 border-red-400/50"
          : matchesTarget
          ? "bg-green-500/30 border-green-400/50"
          : cell
          ? "bg-black/50 border-white/30"
          : highlighted
          ? "bg-primary/20 border-primary/50 hover:bg-primary/30"
          : "bg-black/30 border-white/20 hover:bg-black/40 hover:border-white/30"
      )}
    >
      {/* Target number indicator - full size circle with faded styling */}
      {hasTarget && !cell && !isLocked && (
        <div className="absolute inset-2 flex items-center justify-center rounded-full bg-amber-500/40">
          <span className="text-2xl sm:text-3xl font-bold text-white/50">{targetNumber}</span>
        </div>
      )}
      {/* Small target badge when cell is filled */}
      {hasTarget && cell && !isLocked && (
        <div className="absolute top-1 right-1 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-amber-500/80 text-white text-[10px] sm:text-xs font-bold z-10">
          {targetNumber}
        </div>
      )}
      {/* Power boost indicator for empty cells - smaller and cornered for 4x4 grids */}
      {!cell && !isLocked && hasPowerBoost && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center justify-center rounded-full overflow-hidden relative cursor-help",
                size > 3 
                  ? "absolute bottom-1 left-1 w-6 h-6 sm:w-7 sm:h-7" 
                  : "w-10 h-10 sm:w-12 sm:h-12"
              )}>
                <img src={powerOrbImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <span className={cn(
                  "relative font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]",
                  size > 3 ? "text-[10px] sm:text-xs" : "text-sm sm:text-base"
                )}>+5</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="flex items-center gap-1">
              <span>Friend played here gets +5</span>
              <img src={powerOrbImage} alt="Power" className="w-4 h-4 inline-block" />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {isLocked ? (
        <>
          {/* Locked cell - show power badge with lock indicator */}
          <div className="absolute top-1 left-1">
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full overflow-hidden relative">
            <img src={powerOrbImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <span className="relative text-xl sm:text-2xl font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {cell.currentPower}
            </span>
          </div>
        </>
      ) : cell ? (
        <>
          <img
            src={cell.friend.image}
            alt={cell.friend.name}
            className="w-3/4 h-3/4 object-contain"
          />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full overflow-hidden">
            <img src={powerOrbImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <span className="relative text-sm sm:text-base font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {cell.currentPower}
            </span>
          </div>
        </>
      ) : null}
    </button>
  );
};
