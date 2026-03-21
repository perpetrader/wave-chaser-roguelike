import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trophy, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export type Difficulty = "easy" | "medium" | "hard";

interface DifficultyConfig {
  label: string;
  description: string;
  ranks: string[];
  suitCount: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "Easy",
    description: "Ranks 9-A, 3 suits",
    ranks: ['9', '10', 'J', 'Q', 'K', 'A'],
    suitCount: 3,
  },
  medium: {
    label: "Medium",
    description: "Ranks 7-A, 3 suits",
    ranks: ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
    suitCount: 3,
  },
  hard: {
    label: "Hard",
    description: "Full deck, 4 suits",
    ranks: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
    suitCount: 4,
  },
};

export const getHighScores = (): Record<Difficulty, number> => {
  const scores: Record<Difficulty, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
  };
  
  (Object.keys(scores) as Difficulty[]).forEach(diff => {
    const saved = localStorage.getItem(`slidePoker-highScore-${diff}`);
    if (saved) {
      scores[diff] = parseInt(saved);
    }
  });
  
  return scores;
};

export const saveHighScore = (difficulty: Difficulty, score: number): boolean => {
  const key = `slidePoker-highScore-${difficulty}`;
  const current = localStorage.getItem(key);
  if (!current || score > parseInt(current)) {
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
    <div 
      className="min-h-screen flex flex-col items-center py-4 px-2 sm:py-8 sm:px-4"
      style={{
        background: `
          radial-gradient(ellipse at center, hsl(142 40% 28%) 0%, hsl(142 45% 18%) 70%, hsl(142 50% 12%) 100%),
          url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")
        `,
        backgroundBlendMode: 'overlay',
      }}
    >
      <div className="flex flex-col items-center w-full max-w-lg mx-auto">
        <header className="text-center mb-6 w-full">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-white/90 hover:text-primary transition-colors mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-gradient mb-2">
            SLIDE POKER
          </h1>
          <p className="text-white/90 text-sm drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            Select your difficulty level
          </p>
        </header>

        <Button
          variant="ghost"
          onClick={() => setShowRules(!showRules)}
          className="mb-4 text-white/90 hover:text-primary drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
        >
          {showRules ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
          {showRules ? "Hide Rules" : "Show Rules"}
        </Button>

        {showRules && (
          <div className="mb-6 p-4 rounded-xl bg-black/60 border border-white/20 text-sm text-white/90 space-y-2 drop-shadow-lg">
            <p><strong className="text-white">Goal:</strong> Slide cards to form the best poker hands in each of the 3 columns.</p>
            <p><strong className="text-white">Controls:</strong> Click any card adjacent to the empty spot to slide it.</p>
            <p><strong className="text-white">Wild Card:</strong> When you confirm, the empty spot becomes a wild Joker that transforms into the best possible card for that column!</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
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
                {highScore > 0 && (
                  <div className="flex items-center gap-1 text-xs text-secondary">
                    <Trophy className="w-3 h-3" />
                    <span>{highScore} pts</span>
                  </div>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
