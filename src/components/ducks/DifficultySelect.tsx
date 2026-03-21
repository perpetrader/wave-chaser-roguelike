import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export type Difficulty = "beginner" | "easy" | "medium" | "hard";

interface DifficultyConfig {
  label: string;
  description: string;
  gridSize: number;
  colors: number;
  rainbowCount: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    label: "Beginner",
    description: "3×3 grid, 2 colors",
    gridSize: 3,
    colors: 2,
    rainbowCount: 0,
  },
  easy: {
    label: "Easy",
    description: "4×4 grid, 4 colors + rainbows",
    gridSize: 4,
    colors: 4,
    rainbowCount: 4,
  },
  medium: {
    label: "Medium",
    description: "5×5 grid, 5 colors + rainbows",
    gridSize: 5,
    colors: 5,
    rainbowCount: 5,
  },
  hard: {
    label: "Hard",
    description: "5×5 grid, 5 colors, no rainbows",
    gridSize: 5,
    colors: 5,
    rainbowCount: 0,
  },
};

export const getHighScores = (): Record<Difficulty, number | null> => {
  const scores: Record<Difficulty, number | null> = {
    beginner: null,
    easy: null,
    medium: null,
    hard: null,
  };
  
  (Object.keys(scores) as Difficulty[]).forEach(diff => {
    const saved = localStorage.getItem(`ducks-best-score-${diff}`);
    if (saved) {
      scores[diff] = parseInt(saved);
    }
  });
  
  return scores;
};

export const saveHighScore = (difficulty: Difficulty, score: number): boolean => {
  const key = `ducks-best-score-${difficulty}`;
  const current = localStorage.getItem(key);
  if (!current || score < parseInt(current)) {
    localStorage.setItem(key, score.toString());
    return true;
  }
  return false;
};

interface DifficultySelectProps {
  onSelect: (difficulty: Difficulty) => void;
}

export const DifficultySelect = ({ onSelect }: DifficultySelectProps) => {
  const [showRules, setShowRules] = useState(false);
  const highScores = getHighScores();

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-4">
      <header className="text-center mb-6 w-full">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Games
        </Link>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-gradient mb-2">
          DUCKS IN A ROW
        </h1>
        <p className="text-muted-foreground text-sm">
          Select your difficulty level
        </p>
      </header>

      <Button
        variant="ghost"
        onClick={() => setShowRules(!showRules)}
        className="mb-4 text-muted-foreground hover:text-primary"
      >
        {showRules ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
        {showRules ? "Hide Rules" : "Show Rules"}
      </Button>

      {showRules && (
        <div className="mb-6 p-4 rounded-xl bg-card/50 border border-border text-sm text-muted-foreground space-y-2">
          <p><strong className="text-foreground">Goal:</strong> Arrange ducks so each row contains only one color.</p>
          <p><strong className="text-foreground">Controls:</strong> Drag rows horizontally or columns vertically. Rows and columns wrap around!</p>
          <p><strong className="text-foreground">Rainbow Ducks:</strong> These special striped ducks can count as any color!</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 w-full">
        {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff) => {
          const config = DIFFICULTY_CONFIG[diff];
          const highScore = highScores[diff];
          
          return (
            <Button
              key={diff}
              onClick={() => onSelect(diff)}
              variant="outline"
              className="h-auto py-4 px-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/10 transition-all"
            >
              <span className="font-display text-lg text-foreground">{config.label}</span>
              <span className="text-xs text-muted-foreground">{config.description}</span>
              {highScore !== null && (
                <div className="flex items-center gap-1 text-xs text-secondary">
                  <Trophy className="w-3 h-3" />
                  <span>{highScore} moves</span>
                </div>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
