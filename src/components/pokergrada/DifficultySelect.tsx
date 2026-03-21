import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Difficulty } from "@/data/pokergradaBoard";
import { Trophy, HelpCircle, X, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export interface DifficultySettings {
  label: string;
  description: string;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultySettings> = {
  beginner: { label: "Beginner", description: "0 requirements, all blanks" },
  easy: { label: "Easy", description: "5 requirements, 20 blanks" },
  medium: { label: "Medium", description: "10 requirements, 15 blanks" },
  hard: { label: "Hard", description: "15 requirements, 10 blanks" },
  expert: { label: "Expert", description: "20 requirements, 5 blanks" },
};

const STORAGE_KEY = "pokergrada-high-scores";

export const getHighScores = (): Record<Difficulty, number> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load high scores", e);
  }
  return { beginner: 0, easy: 0, medium: 0, hard: 0, expert: 0 };
};

export const saveHighScore = (difficulty: Difficulty, score: number): boolean => {
  const scores = getHighScores();
  if (score > scores[difficulty]) {
    scores[difficulty] = score;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
      return true;
    } catch (e) {
      console.error("Failed to save high score", e);
    }
  }
  return false;
};

interface DifficultySelectProps {
  onSelect: (difficulty: Difficulty) => void;
}

export const DifficultySelect = ({ onSelect }: DifficultySelectProps) => {
  const [showRules, setShowRules] = useState(false);
  const difficulties: Difficulty[] = ["beginner", "easy", "medium", "hard", "expert"];
  const highScores = getHighScores();

  return (
    <div className="flex flex-col items-center gap-6 py-8 w-full max-w-md">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-white/70 hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Games
      </Link>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-display text-gradient">
        POKERGRADA
      </h1>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowRules(!showRules)}
        className="gap-2 bg-black/40 hover:bg-black/60 border-white/30"
      >
        {showRules ? <X className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
        {showRules ? "Close Rules" : "Game Rules"}
      </Button>

      {/* Rules Panel */}
      {showRules && (
        <div className="w-full max-w-md p-4 bg-black/70 backdrop-blur-sm rounded-xl border border-white/20 text-sm text-white/90 space-y-3">
          <h3 className="font-display text-primary text-lg mb-2">How to Play</h3>
          <ul className="space-y-2 list-disc list-inside text-white/80">
            <li>Fill the 5×5 grid with cards to form poker hands</li>
            <li>Complete the entire board for a +100 point bonus!</li>
            <li>Each turn, you draw 2 cards and must play 1</li>
            <li>Cards must match cell requirements (suit, color, rank, etc.)</li>
            <li>Blank cells accept any card</li>
            <li>You get one Skip per game to discard both cards</li>
            <li>If you can't play either card and you've used your Skip, the game is over and hands are scored</li>
            <li>Score points for poker hands in each row and column</li>
          </ul>
          <div className="pt-2 border-t border-white/10">
            <p className="text-white/60 text-xs">Scoring: Royal Flush (200), Straight Flush (100), Four of a Kind (75), Full House (50), Flush (40), Straight (30), Three of a Kind (20), Two Pair (10), Pair (5), Ace High (2)</p>
          </div>
        </div>
      )}

      <div className="text-center">
        <h2 className="text-2xl font-display text-gradient mb-2 drop-shadow-lg">Select Difficulty</h2>
        <p className="text-white/80 text-sm drop-shadow-md">
          Choose your challenge level
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        {difficulties.map((difficulty) => {
          const config = DIFFICULTY_CONFIG[difficulty];
          const highScore = highScores[difficulty];
          const isExpert = difficulty === 'expert';
          return (
            <Button
              key={difficulty}
              variant="outline"
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-6 px-4 bg-black/60 hover:bg-black/70 border-white/30 hover:border-primary/50 transition-all backdrop-blur-sm",
                isExpert && "sm:col-span-2 sm:max-w-[calc(50%-0.5rem)] sm:mx-auto"
              )}
              onClick={() => onSelect(difficulty)}
            >
              <span className="text-lg font-semibold text-white">{config.label}</span>
              <span className="text-xs text-white/70">{config.description}</span>
              {highScore > 0 && (
                <span className="flex items-center gap-1 text-xs text-yellow-400 mt-1">
                  <Trophy className="w-3 h-3" />
                  {highScore}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
