import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

interface DifficultyConfig {
  label: string;
  swaps: number;
  description: string;
  handCount: number;
  scoringHands: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { label: 'Easy', swaps: 20, description: '3 hands, score top 2, 20 swaps', handCount: 3, scoringHands: 2 },
  medium: { label: 'Medium', swaps: 15, description: '4 hands, score top 3, 15 swaps', handCount: 4, scoringHands: 3 },
  hard: { label: 'Hard', swaps: 10, description: '4 hands, score top 3, 10 swaps', handCount: 4, scoringHands: 3 },
  expert: { label: 'Expert', swaps: 5, description: '4 hands, score top 3, 5 swaps', handCount: 4, scoringHands: 3 },
};

export const getHighScores = (): Record<Difficulty, number> => {
  const stored = localStorage.getItem('pokerSwapHighScores');
  return stored ? JSON.parse(stored) : { easy: 0, medium: 0, hard: 0, expert: 0 };
};

export const saveHighScore = (difficulty: Difficulty, score: number): boolean => {
  const scores = getHighScores();
  if (score > scores[difficulty]) {
    scores[difficulty] = score;
    localStorage.setItem('pokerSwapHighScores', JSON.stringify(scores));
    return true;
  }
  return false;
};

interface DifficultySelectProps {
  onSelect: (difficulty: Difficulty) => void;
}

export const DifficultySelect = ({ onSelect }: DifficultySelectProps) => {
  const highScores = getHighScores();

  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full max-w-md">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Games
      </Link>
      <h1 className="text-3xl sm:text-4xl font-display text-gradient">POKER SWAP</h1>
      <h2 className="text-xl font-display text-foreground">Select Difficulty</h2>
      
      <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 max-w-md text-sm text-muted-foreground space-y-2">
        <p><strong className="text-foreground">How to Play:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>You have 3 (4) poker hands with 5 cards each</li>
          <li>Only your top 2 (3) hands count toward your score</li>
          <li>Tap a card, then tap another card to swap them</li>
          <li>End early or use all swaps to see your final score</li>
        </ul>
      </div>

      <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 max-w-md w-full">
        <p className="text-sm font-display text-foreground mb-2 text-center">Scoring</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Royal Flush</span>
            <span className="text-primary font-medium">100</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Straight Flush</span>
            <span className="text-primary font-medium">75</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Four of a Kind</span>
            <span className="text-primary font-medium">50</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Full House</span>
            <span className="text-primary font-medium">25</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Flush</span>
            <span className="text-primary font-medium">20</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Straight</span>
            <span className="text-primary font-medium">15</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Three of a Kind</span>
            <span className="text-primary font-medium">10</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Two Pair</span>
            <span className="text-primary font-medium">5</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">One Pair</span>
            <span className="text-primary font-medium">2</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ace High</span>
            <span className="text-primary font-medium">1</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, DifficultyConfig][]).map(([key, config]) => (
          <Button
            key={key}
            onClick={() => onSelect(key)}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-1 hover:bg-primary/20 hover:border-primary"
          >
            <span className="text-lg font-display">{config.label}</span>
            <span className="text-xs text-muted-foreground">{config.description}</span>
            {highScores[key] > 0 && (
              <span className="flex items-center gap-1 text-xs text-yellow-500 mt-1">
                <Trophy className="w-3 h-3" />
                {highScores[key]}
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};
