import { Button } from "@/components/ui/button";

export type Difficulty = "beginner" | "easy" | "medium" | "hard";

export interface DifficultySettings {
  slots: number;
  characters: number;
  label: string;
  description: string;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultySettings> = {
  beginner: { slots: 4, characters: 5, label: "Easy", description: "4 slots, 5 characters" },
  easy: { slots: 4, characters: 7, label: "Medium", description: "4 slots, 7 characters" },
  medium: { slots: 5, characters: 8, label: "Hard", description: "5 slots, 8 characters" },
  hard: { slots: 6, characters: 10, label: "Expert", description: "6 slots, 10 characters" },
};

interface DifficultySelectProps {
  onSelect: (difficulty: Difficulty) => void;
}

export const DifficultySelect = ({ onSelect }: DifficultySelectProps) => {
  const difficulties: Difficulty[] = ["beginner", "easy", "medium", "hard"];

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="text-center">
        <h2 className="text-2xl font-display text-gradient mb-2 drop-shadow-lg">Select Difficulty</h2>
        <p className="text-white/80 text-sm drop-shadow-md">
          Choose your challenge level
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        {difficulties.map((difficulty) => {
          const config = DIFFICULTY_CONFIG[difficulty];
          return (
            <Button
              key={difficulty}
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-6 px-4 bg-black/60 hover:bg-black/70 border-white/30 hover:border-primary/50 transition-all backdrop-blur-sm"
              onClick={() => onSelect(difficulty)}
            >
              <span className="text-lg font-semibold text-white">{config.label}</span>
              <span className="text-xs text-white/70">{config.description}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
