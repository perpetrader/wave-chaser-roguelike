import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';

interface DifficultyConfig {
  label: string;
  description: string;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  beginner: { label: 'Beginner', description: 'Whole dollar prices ($20-$50)' },
  easy: { label: 'Easy', description: 'Nickel increments ($20-$80)' },
  medium: { label: 'Medium', description: 'Exact cents ($20-$120)' },
  hard: { label: 'Hard', description: 'Includes cost of carry (Basis)' },
  expert: { label: 'Expert', description: 'Interest & Dividends breakdown' },
};

interface HighScoreData {
  score: number;
  time: number; // in seconds
}

export const getHighScores = (): Record<Difficulty, HighScoreData> => {
  const stored = localStorage.getItem('optionsTrainerHighScores');
  return stored ? JSON.parse(stored) : { 
    beginner: { score: 0, time: 0 }, 
    easy: { score: 0, time: 0 }, 
    medium: { score: 0, time: 0 },
    hard: { score: 0, time: 0 },
    expert: { score: 0, time: 0 }
  };
};

export const saveHighScore = (difficulty: Difficulty, score: number, time: number): boolean => {
  const scores = getHighScores();
  // Save if better score, or same score with faster time
  if (score > scores[difficulty].score || 
      (score === scores[difficulty].score && score > 0 && time < scores[difficulty].time)) {
    scores[difficulty] = { score, time };
    localStorage.setItem('optionsTrainerHighScores', JSON.stringify(scores));
    return true;
  }
  return false;
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
};

interface DifficultySelectProps {
  onSelect: (difficulty: Difficulty) => void;
}

export const DifficultySelect = ({ onSelect }: DifficultySelectProps) => {
  const highScores = getHighScores();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Games
        </Link>
        
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Options Trainer</h1>
        <h2 className="text-xl text-emerald-400">Select Difficulty</h2>
        
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 max-w-md text-sm text-white/70 space-y-2 border border-white/10">
          <p><strong className="text-white">How to Play:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>You'll see Stock Price, Strike, and one option price</li>
            <li>Calculate the missing Call or Put price</li>
            <li>Use Put-Call Parity: Call − Put = Stock − Strike</li>
            <li>Answer 10 questions as fast as you can!</li>
          </ul>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 max-w-md w-full border border-white/10">
          <p className="text-sm font-semibold text-white mb-2 text-center">Formula Reference</p>
          <div className="text-center text-emerald-400 font-mono text-sm">
            Call − Put = Stock − Strike
          </div>
          <div className="text-center text-amber-400/80 font-mono text-sm mt-1">
            Hard: + Basis
          </div>
          <div className="text-center text-purple-400/80 font-mono text-sm mt-1">
            Expert: + Interest − Dividends
          </div>
          <div className="text-center text-white/50 text-xs mt-2">
            Rearrange to solve for the missing price
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-md">
          {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, DifficultyConfig][]).map(([key, config]) => (
            <Button
              key={key}
              onClick={() => onSelect(key)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-1 bg-slate-700/50 border-white/20 hover:bg-emerald-900/50 hover:border-emerald-500/50 text-white"
            >
              <span className="text-lg font-bold">{config.label}</span>
              <span className="text-xs text-white/60">{config.description}</span>
              {highScores[key].score > 0 && (
                <span className="flex items-center gap-2 text-xs text-yellow-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    {highScores[key].score}/10
                  </span>
                  <span className="flex items-center gap-1 text-white/50">
                    <Clock className="w-3 h-3" />
                    {formatTime(highScores[key].time)}
                  </span>
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
