import { cn } from "@/lib/utils";

type Choice = "rock" | "paper" | "scissors" | "spy" | "sniper";

type WinAnimation = 
  | "rock-crush-right" | "rock-crush-left" 
  | "paper-wrap-right" | "paper-wrap-left"
  | "scissors-cut-right" | "scissors-cut-left"
  | "crushed" | null;

interface ChoiceButtonProps {
  choice: Choice;
  onClick: () => void;
  disabled?: boolean;
  selected?: boolean;
  isComputer?: boolean;
  winAnimation?: WinAnimation;
}

const choiceEmojis: Record<Choice, string> = {
  rock: "🪨",
  paper: "📄",
  scissors: "✂️",
  spy: "🕵️",
  sniper: "👀",
};

const choiceLabels: Record<Choice, string> = {
  rock: "Rock",
  paper: "Paper",
  scissors: "Scissors",
  spy: "Spy",
  sniper: "Sniper",
};

const specialChoices: Choice[] = ["spy", "sniper"];

const animationClasses: Record<NonNullable<WinAnimation>, string> = {
  "rock-crush-right": "animate-rock-crush-right relative z-10",
  "rock-crush-left": "animate-rock-crush-left relative z-10",
  "paper-wrap-right": "animate-paper-wrap-right relative z-10",
  "paper-wrap-left": "animate-paper-wrap-left relative z-10",
  "scissors-cut-right": "animate-scissors-cut-right relative z-10",
  "scissors-cut-left": "animate-scissors-cut-left relative z-10",
  "crushed": "animate-crushed",
};

export const ChoiceButton = ({
  choice,
  onClick,
  disabled = false,
  selected = false,
  isComputer = false,
  winAnimation = null,
}: ChoiceButtonProps) => {
  const isSpecial = specialChoices.includes(choice);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col items-center justify-center select-none",
        "w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32",
        "rounded-2xl border-2 transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        "active:scale-95 touch-manipulation",
        isSpecial 
          ? "border-secondary bg-gradient-to-br from-secondary/20 to-accent/20 hover:border-accent hover:scale-105 focus:ring-secondary"
          : "border-border bg-card hover:border-primary hover:scale-105 focus:ring-primary",
        selected && !isSpecial && "border-primary scale-105 sm:scale-110 animate-pulse-glow",
        selected && isSpecial && "border-accent scale-105 sm:scale-110 shadow-[0_0_40px_hsl(var(--accent)/0.5)]",
        isComputer && selected && "animate-bounce-in"
      )}
    >
      <span className={cn(
        "text-4xl xs:text-5xl sm:text-5xl md:text-6xl transition-transform duration-300 group-hover:scale-110 group-hover:animate-float",
        isSpecial && "drop-shadow-[0_0_10px_hsl(var(--accent)/0.8)]",
        winAnimation && animationClasses[winAnimation]
      )}>
        {choiceEmojis[choice]}
      </span>
      <span className={cn(
        "mt-1 text-xs sm:text-sm font-medium transition-colors duration-300",
        isSpecial 
          ? "text-secondary group-hover:text-accent" 
          : "text-muted-foreground group-hover:text-primary",
        selected && !isSpecial && "text-primary",
        selected && isSpecial && "text-accent font-bold"
      )}>
        {choiceLabels[choice]}
        {isSpecial && <span className="ml-1 text-xs">⭐</span>}
      </span>
    </button>
  );
};
