import { cn } from "@/lib/utils";

type Result = "win" | "lose" | "tie" | null;

interface GameResultProps {
  result: Result;
}

const resultMessages: Record<Exclude<Result, null>, { text: string; subtext: string }> = {
  win: { text: "YOU WIN!", subtext: "Nice one! 🎉" },
  lose: { text: "YOU LOSE", subtext: "Try again! 💪" },
  tie: { text: "IT'S A TIE", subtext: "Draw your weapons again! 🤝" },
};

export const GameResult = ({ result }: GameResultProps) => {
  if (!result) return null;

  const { text, subtext } = resultMessages[result];

  return (
    <div className="flex flex-col items-center animate-bounce-in">
      <h2
        className={cn(
          "text-3xl sm:text-4xl md:text-5xl font-display tracking-wide",
          result === "win" && "text-win",
          result === "lose" && "text-lose",
          result === "tie" && "text-tie"
        )}
        style={{
          textShadow:
            result === "win"
              ? "0 0 30px hsl(142 76% 46% / 0.5)"
              : result === "lose"
              ? "0 0 30px hsl(0 72% 51% / 0.5)"
              : "0 0 30px hsl(45 100% 60% / 0.5)",
        }}
      >
        {text}
      </h2>
      <p className="mt-2 text-lg text-muted-foreground">{subtext}</p>
    </div>
  );
};
