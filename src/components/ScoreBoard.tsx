import { cn } from "@/lib/utils";

interface ScoreBoardProps {
  playerScore: number;
  computerScore: number;
  ties: number;
}

export const ScoreBoard = ({ playerScore, computerScore, ties }: ScoreBoardProps) => {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8">
      <div className="flex flex-col items-center">
        <span className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">You</span>
        <span className={cn(
          "text-3xl sm:text-4xl md:text-5xl font-display",
          playerScore > computerScore ? "text-win" : "text-foreground"
        )}>
          {playerScore}
        </span>
      </div>
      
      <div className="flex flex-col items-center px-4 sm:px-6 border-x border-border">
        <span className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">Ties</span>
        <span className="text-2xl sm:text-3xl md:text-4xl font-display text-tie">
          {ties}
        </span>
      </div>
      
      <div className="flex flex-col items-center">
        <span className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">CPU</span>
        <span className={cn(
          "text-3xl sm:text-4xl md:text-5xl font-display",
          computerScore > playerScore ? "text-lose" : "text-foreground"
        )}>
          {computerScore}
        </span>
      </div>
    </div>
  );
};
