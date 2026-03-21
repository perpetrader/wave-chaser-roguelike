import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Clock, Grid3X3, Shuffle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PokergradaGame } from "@/components/pokergrada/PokergradaGame";
import { PokerBoggleGame } from "@/components/pokerboggle/PokerBoggleGame";
import { SlidePokerGame } from "@/components/slidepoker/SlidePokerGame";
import { PokerSwapGame } from "@/components/pokerswap/PokerSwapGame";

type GameType = "pokergrada" | "poker-boggle" | "slide-poker" | "poker-swap";

interface GameConfig {
  id: GameType;
  title: string;
  icon: React.ReactNode;
  description: string;
  rules: string[];
  scoring?: string;
}

interface DailyProgress {
  date: string;
  completions: Record<GameType, number | null>;
}

const getTodayKey = () => new Date().toISOString().split('T')[0];

const loadDailyProgress = (): DailyProgress => {
  const stored = localStorage.getItem('daily-poker-progress');
  if (stored) {
    const parsed = JSON.parse(stored) as DailyProgress;
    if (parsed.date === getTodayKey()) {
      return parsed;
    }
  }
  return {
    date: getTodayKey(),
    completions: {
      "pokergrada": null,
      "poker-boggle": null,
      "slide-poker": null,
      "poker-swap": null,
    }
  };
};

const saveDailyProgress = (progress: DailyProgress) => {
  localStorage.setItem('daily-poker-progress', JSON.stringify(progress));
};

const GAMES: GameConfig[] = [
  {
    id: "pokergrada",
    title: "Pokergrada",
    icon: <Grid3X3 className="w-6 h-6" />,
    description: "Fill the 5×5 grid with poker hands",
    rules: [
      "Fill the 5×5 grid with cards to form poker hands",
      "Complete the entire board for a +100 point bonus!",
      "Each turn, you draw 2 cards and must play 1",
      "Cards must match cell requirements (suit, color, rank, etc.)",
      "Blank cells accept any card",
      "You get one Skip per game to discard both cards",
      "If you can't play either card and you've used your Skip, the game ends",
      "Score points for poker hands in each row and column",
    ],
    scoring: "Royal Flush (200), Straight Flush (100), Four of a Kind (75), Full House (50), Flush (40), Straight (30), Three of a Kind (20), Two Pair (10), Pair (5), Ace High (2)",
  },
  {
    id: "poker-boggle",
    title: "Poker Boggle",
    icon: <Clock className="w-6 h-6" />,
    description: "Speed search for poker hands",
    rules: [
      "Click adjacent cards to form 5-card poker hands",
      "Make as many unique hands as possible before time runs out",
      "Each unique hand scores points based on strength",
      "You have 2 minutes to find as many hands as you can",
    ],
    scoring: "Royal Flush (1000), Straight Flush (500), Four of a Kind (250), Full House (100), Flush (50), Straight (25)",
  },
  {
    id: "slide-poker",
    title: "Slide Poker",
    icon: <Shuffle className="w-6 h-6" />,
    description: "Slide puzzle meets poker",
    rules: [
      "Slide cards to form the best poker hands in each of the 3 columns",
      "Click any card adjacent to the empty spot to slide it",
      "When you confirm, the empty spot becomes a wild Joker",
      "The Joker transforms into the best possible card for that column!",
    ],
  },
  {
    id: "poker-swap",
    title: "Poker Swap",
    icon: <Trophy className="w-6 h-6" />,
    description: "Trade cards to make the best hands",
    rules: [
      "You have 4 poker hands and 10 swaps",
      "Click a card to select it, then click another card to swap them",
      "Maximize the score of your top 3 hands",
      "Win by reaching the calculated maximum score!",
    ],
  },
];

const DailyPokerPowerUp = () => {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [showRules, setShowRules] = useState<GameType | null>(null);
  const [playingGame, setPlayingGame] = useState<GameType | null>(null);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(loadDailyProgress);

  useEffect(() => {
    setDailyProgress(loadDailyProgress());
  }, []);

  const handleSelectGame = (gameId: GameType) => {
    setSelectedGame(gameId);
    setShowRules(gameId);
  };

  const handleStartGame = () => {
    if (selectedGame) {
      setPlayingGame(selectedGame);
      setShowRules(null);
    }
  };

  const handleGameComplete = (gameId: GameType, score: number) => {
    const updated = {
      ...dailyProgress,
      completions: {
        ...dailyProgress.completions,
        [gameId]: score,
      }
    };
    setDailyProgress(updated);
    saveDailyProgress(updated);
  };

  const handleBackToMenu = () => {
    setPlayingGame(null);
    setSelectedGame(null);
    setShowRules(null);
  };

  // Render the actual game component
  if (playingGame) {
    switch (playingGame) {
      case "pokergrada":
        return <PokergradaGame initialDifficulty="hard" onBackToMenu={handleBackToMenu} onGameComplete={(score) => handleGameComplete("pokergrada", score)} />;
      case "poker-boggle":
        return <PokerBoggleGame initialDifficulty="hard" onBackToMenu={handleBackToMenu} onGameComplete={(score) => handleGameComplete("poker-boggle", score)} />;
      case "slide-poker":
        return <SlidePokerGame initialDifficulty="hard" onBackToMenu={handleBackToMenu} onGameComplete={(score) => handleGameComplete("slide-poker", score)} />;
      case "poker-swap":
        return <PokerSwapGame initialDifficulty="hard" onBackToMenu={handleBackToMenu} onGameComplete={(score) => handleGameComplete("poker-swap", score)} />;
    }
  }

  const selectedGameConfig = GAMES.find(g => g.id === selectedGame);

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4">
      <header className="w-full max-w-md mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Games</span>
        </Link>
        <h1 className="text-3xl sm:text-4xl font-display text-gradient text-center">
          Daily Poker Power Up
        </h1>
        <p className="text-muted-foreground text-center mt-2">
          Complete all 4 poker challenges
        </p>
      </header>

      {/* Game Selection */}
      {!showRules && (
        <div className="w-full max-w-md space-y-4">
          <h2 className="text-lg font-semibold text-center text-white/90 mb-4">
            Choose Your Challenge
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {GAMES.map((game) => {
              const completedScore = dailyProgress.completions[game.id];
              const isCompleted = completedScore !== null;
              
              return (
                <Button
                  key={game.id}
                  variant="outline"
                  className={`flex items-center gap-4 h-auto py-4 px-5 bg-black/60 hover:bg-black/70 transition-all backdrop-blur-sm text-left ${
                    isCompleted ? "border-green-500/50" : "border-white/30 hover:border-primary/50"
                  }`}
                  onClick={() => handleSelectGame(game.id)}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                    isCompleted ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"
                  }`}>
                    {isCompleted ? <Check className="w-6 h-6" /> : game.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-lg">{game.title}</p>
                    <p className="text-sm text-white/70">{game.description}</p>
                  </div>
                  {isCompleted && (
                    <div className="flex-shrink-0 text-right">
                      <p className="text-green-400 font-bold text-lg">{completedScore}</p>
                      <p className="text-green-400/70 text-xs">pts</p>
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rules Screen */}
      {showRules && selectedGameConfig && (
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-4">
              {selectedGameConfig.icon}
            </div>
            <h2 className="text-2xl font-display text-white mb-1">
              {selectedGameConfig.title}
            </h2>
            <p className="text-white/70 text-sm">Hard Mode</p>
          </div>

          <div className="p-5 bg-black/70 backdrop-blur-sm rounded-xl border border-white/20">
            <h3 className="font-display text-primary text-lg mb-3">How to Play</h3>
            <ul className="space-y-2 text-white/80 text-sm">
              {selectedGameConfig.rules.map((rule, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
            {selectedGameConfig.scoring && (
              <div className="pt-3 mt-3 border-t border-white/10">
                <p className="text-white/60 text-xs">
                  <span className="text-white/80 font-medium">Scoring:</span> {selectedGameConfig.scoring}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 bg-black/60 hover:bg-black/70 border-white/30"
              onClick={() => {
                setShowRules(null);
                setSelectedGame(null);
              }}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleStartGame}
            >
              Start Game
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyPokerPowerUp;
