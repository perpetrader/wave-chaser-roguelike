import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { HandResult } from "./handEvaluator";

interface ScoringAnimationProps {
  rows: (HandResult | null)[];
  cols: (HandResult | null)[];
  total: number;
  onComplete: () => void;
  stuckEnding?: boolean;
  boardComplete?: boolean;
  onHighlightChange?: (row: number | null, col: number | null) => void;
}

type AnimationPhase = 
  | { type: 'waiting' }
  | { type: 'row'; index: number }
  | { type: 'col'; index: number }
  | { type: 'total' }
  | { type: 'complete' };

const BOARD_COMPLETE_BONUS = 100;

export const ScoringAnimation = ({ 
  rows, 
  cols, 
  total, 
  onComplete,
  stuckEnding,
  boardComplete,
  onHighlightChange 
}: ScoringAnimationProps) => {
  const [phase, setPhase] = useState<AnimationPhase>({ type: 'waiting' });
  const [runningTotal, setRunningTotal] = useState(boardComplete ? BOARD_COMPLETE_BONUS : 0);
  const [showFlash, setShowFlash] = useState(false);

  // Update highlight when phase changes
  useEffect(() => {
    if (onHighlightChange) {
      if (phase.type === 'row') {
        onHighlightChange(phase.index, null);
      } else if (phase.type === 'col') {
        onHighlightChange(null, phase.index);
      } else {
        onHighlightChange(null, null);
      }
    }
  }, [phase, onHighlightChange]);

  useEffect(() => {
    // Start the animation sequence after a brief delay
    const startDelay = setTimeout(() => {
      setPhase({ type: 'row', index: 0 });
    }, 500);

    return () => clearTimeout(startDelay);
  }, []);

  useEffect(() => {
    if (phase.type === 'waiting') return;

    const advancePhase = () => {
      if (phase.type === 'row') {
        const score = rows[phase.index]?.score || 0;
        setRunningTotal(prev => prev + score);
        setShowFlash(score > 0);
        
        setTimeout(() => setShowFlash(false), 900);

        if (phase.index < 4) {
          setPhase({ type: 'row', index: phase.index + 1 });
        } else {
          setPhase({ type: 'col', index: 0 });
        }
      } else if (phase.type === 'col') {
        const score = cols[phase.index]?.score || 0;
        setRunningTotal(prev => prev + score);
        setShowFlash(score > 0);
        
        setTimeout(() => setShowFlash(false), 900);

        if (phase.index < 4) {
          setPhase({ type: 'col', index: phase.index + 1 });
        } else {
          setPhase({ type: 'total' });
        }
      } else if (phase.type === 'total') {
        setTimeout(() => {
          setPhase({ type: 'complete' });
          onComplete();
        }, 3000);
      }
    };

    const timer = setTimeout(advancePhase, 1800);
    return () => clearTimeout(timer);
  }, [phase, rows, cols, onComplete]);

  const getScoreColor = (score: number) => {
    if (score >= 50) return 'text-yellow-400';
    if (score >= 20) return 'text-primary';
    if (score >= 10) return 'text-accent';
    if (score >= 2) return 'text-muted-foreground';
    return 'text-muted-foreground/50';
  };

  const getCurrentScore = () => {
    if (phase.type === 'row') {
      return rows[phase.index]?.score || 0;
    }
    if (phase.type === 'col') {
      return cols[phase.index]?.score || 0;
    }
    return 0;
  };

  const getCurrentHandName = () => {
    if (phase.type === 'row') {
      return rows[phase.index]?.name || 'High Card';
    }
    if (phase.type === 'col') {
      return cols[phase.index]?.name || 'High Card';
    }
    return '';
  };

  return (
    <div className="mb-4 sm:mb-6 text-center p-4 sm:p-6 bg-card/80 backdrop-blur rounded-xl border border-border min-w-[280px]">
      {stuckEnding && phase.type === 'waiting' && (
        <p className="text-sm text-muted-foreground mb-2 animate-fade-in">
          Neither card could be played and your skip was used!
        </p>
      )}
      
      {/* Phase indicator */}
      {phase.type !== 'waiting' && phase.type !== 'complete' && (
        <div className="mb-3">
          <h2 className="text-lg sm:text-xl font-display text-primary">
            {phase.type === 'row' && `Row ${phase.index + 1}`}
            {phase.type === 'col' && `Column ${phase.index + 1}`}
            {phase.type === 'total' && 'Final Score'}
          </h2>
        </div>
      )}

      {/* Current hand being scored */}
      {(phase.type === 'row' || phase.type === 'col') && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-1">{getCurrentHandName()}</p>
          <div 
            className={cn(
              "text-3xl sm:text-4xl font-display transition-all duration-300",
              getScoreColor(getCurrentScore()),
              showFlash && "scale-125"
            )}
          >
            +{getCurrentScore()}
          </div>
        </div>
      )}

      {/* Running total */}
      <div className={cn(
        "transition-all duration-500",
        phase.type === 'total' && "scale-110"
      )}>
        <p className="text-xs text-muted-foreground mb-1">
          {phase.type === 'total' ? 'Total Score' : 'Running Total'}
        </p>
        <p className={cn(
          "font-display text-gradient transition-all duration-300",
          phase.type === 'total' ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"
        )}>
          {runningTotal}
        </p>
      </div>

      {/* Progress dots */}
      {phase.type !== 'total' && phase.type !== 'complete' && phase.type !== 'waiting' && (
        <div className="flex justify-center gap-1 mt-4">
          {/* Row dots */}
          {[0, 1, 2, 3, 4].map(i => (
            <div 
              key={`row-${i}`}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                phase.type === 'row' && phase.index === i 
                  ? "bg-primary scale-125" 
                  : phase.type === 'row' && i < phase.index
                    ? "bg-primary/50"
                    : phase.type === 'col'
                      ? "bg-primary/50"
                      : "bg-white/20"
              )}
            />
          ))}
          <div className="w-1" />
          {/* Column dots */}
          {[0, 1, 2, 3, 4].map(i => (
            <div 
              key={`col-${i}`}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                phase.type === 'col' && phase.index === i 
                  ? "bg-accent scale-125" 
                  : phase.type === 'col' && i < phase.index
                    ? "bg-accent/50"
                    : "bg-white/20"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
