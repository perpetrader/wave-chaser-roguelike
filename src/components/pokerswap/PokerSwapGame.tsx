import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RotateCcw, Eye } from "lucide-react";
import { toast } from "sonner";
import { Card, createDeck, shuffleDeck } from "@/data/pokergradaBoard";
import { evaluateHand, HandResult } from "@/components/pokergrada/handEvaluator";
import { CardDisplay } from "@/components/pokergrada/CardDisplay";
import { DifficultySelect, Difficulty, DIFFICULTY_CONFIG, saveHighScore, getHighScores } from "./DifficultySelect";

type GameState = 'difficulty' | 'playing' | 'gameOver';

interface OptimalResult {
  score: number;
  hands: Card[][];
}

interface HandState {
  cards: Card[];
  result: HandResult | null;
}

// Calculate max possible score with given swaps using beam search
const calculateMaxScore = (hands: Card[][], maxSwaps: number, scoringHands: number): OptimalResult => {
  const handCount = hands.length;
  
  const evaluateHands = (h: Card[][]): number => {
    const scores = h.map(hand => {
      const result = evaluateHand(hand);
      return result?.score || 0;
    }).sort((a, b) => b - a);
    return scores.slice(0, scoringHands).reduce((sum, s) => sum + s, 0);
  };

  const cloneHands = (h: Card[][]): Card[][] => h.map(hand => [...hand]);

  // Get all possible swaps between different hands
  const getAllSwaps = (): { h1: number; c1: number; h2: number; c2: number }[] => {
    const swaps: { h1: number; c1: number; h2: number; c2: number }[] = [];
    for (let h1 = 0; h1 < handCount; h1++) {
      for (let c1 = 0; c1 < 5; c1++) {
        for (let h2 = h1 + 1; h2 < handCount; h2++) {
          for (let c2 = 0; c2 < 5; c2++) {
            swaps.push({ h1, c1, h2, c2 });
          }
        }
      }
    }
    return swaps;
  };

  const allSwaps = getAllSwaps();

  const applySwap = (h: Card[][], swap: { h1: number; c1: number; h2: number; c2: number }) => {
    const temp = h[swap.h1][swap.c1];
    h[swap.h1][swap.c1] = h[swap.h2][swap.c2];
    h[swap.h2][swap.c2] = temp;
  };

  const getKey = (h: Card[][]): string => 
    h.map(hand => hand.map(c => `${c.rank}${c.suit}`).sort().join(',')).sort().join('|');

  // Use beam search - keep top K states at each level
  // This allows us to search up to maxSwaps levels efficiently
  const BEAM_WIDTH = 200;
  
  interface State {
    hands: Card[][];
    score: number;
    key: string;
  }

  let currentBeam: State[] = [{
    hands: cloneHands(hands),
    score: evaluateHands(hands),
    key: getKey(hands)
  }];
  
  let bestState = currentBeam[0];
  const seenStates = new Set<string>();
  seenStates.add(currentBeam[0].key);

  // Run beam search for each swap level
  for (let swap = 0; swap < maxSwaps; swap++) {
    const nextBeam: State[] = [];
    const nextSeen = new Set<string>();

    for (const state of currentBeam) {
      // Try all possible swaps from this state
      for (const swapMove of allSwaps) {
        const newHands = cloneHands(state.hands);
        applySwap(newHands, swapMove);
        const key = getKey(newHands);
        
        // Skip if we've seen this state in this level or previous levels
        if (seenStates.has(key) || nextSeen.has(key)) continue;
        nextSeen.add(key);
        
        const score = evaluateHands(newHands);
        const newState = { hands: newHands, score, key };
        
        if (score > bestState.score) {
          bestState = newState;
        }
        
        nextBeam.push(newState);
      }
    }

    if (nextBeam.length === 0) break;

    // Keep only top BEAM_WIDTH states
    nextBeam.sort((a, b) => b.score - a.score);
    currentBeam = nextBeam.slice(0, BEAM_WIDTH);
    
    // Add new states to seen set
    for (const state of currentBeam) {
      seenStates.add(state.key);
    }
  }

  return { score: bestState.score, hands: bestState.hands };
};

export interface PokerSwapGameProps {
  initialDifficulty?: Difficulty;
  onBackToMenu?: () => void;
  onGameComplete?: (score: number) => void;
}

export const PokerSwapGame = ({ initialDifficulty, onBackToMenu, onGameComplete }: PokerSwapGameProps = {}) => {
  const [gameState, setGameState] = useState<GameState>(initialDifficulty ? 'playing' : 'difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty || 'medium');
  const [hands, setHands] = useState<HandState[]>([]);
  const [selectedCard, setSelectedCard] = useState<{ handIndex: number; cardIndex: number } | null>(null);
  const [swapsRemaining, setSwapsRemaining] = useState(0);
  const [maxPossibleScore, setMaxPossibleScore] = useState(0);
  const [optimalHands, setOptimalHands] = useState<Card[][] | null>(null);
  const [showOptimalHands, setShowOptimalHands] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const startedFromHub = !!initialDifficulty;

  // Auto-initialize if started with initial difficulty
  useEffect(() => {
    if (initialDifficulty && hands.length === 0) {
      initializeGame(initialDifficulty);
    }
  }, [initialDifficulty]);

  const initializeGame = useCallback((diff: Difficulty) => {
    const config = DIFFICULTY_CONFIG[diff];
    const deck = shuffleDeck(createDeck());
    const newHands: HandState[] = [];
    
    for (let i = 0; i < config.handCount; i++) {
      const cards = deck.slice(i * 5, (i + 1) * 5);
      newHands.push({
        cards,
        result: evaluateHand(cards),
      });
    }
    
    setHands(newHands);
    setSwapsRemaining(config.swaps);
    setSelectedCard(null);
    setIsNewHighScore(false);
    setShowOptimalHands(false);
    
    // Calculate max possible score and optimal configuration
    const allCards = newHands.map(h => h.cards);
    const result = calculateMaxScore(allCards, config.swaps, config.scoringHands);
    setMaxPossibleScore(result.score);
    setOptimalHands(result.hands);
  }, []);

  const handleDifficultySelect = (diff: Difficulty) => {
    setDifficulty(diff);
    initializeGame(diff);
    setGameState('playing');
  };

  const handleCardClick = (handIndex: number, cardIndex: number) => {
    if (gameState !== 'playing' || swapsRemaining <= 0) return;
    
    if (!selectedCard) {
      setSelectedCard({ handIndex, cardIndex });
    } else {
      if (selectedCard.handIndex === handIndex && selectedCard.cardIndex === cardIndex) {
        // Deselect if clicking the same card
        setSelectedCard(null);
      } else if (selectedCard.handIndex === handIndex) {
        // Can't swap within the same hand
        setSelectedCard({ handIndex, cardIndex });
      } else {
        // Perform swap between different hands
        const newHands = [...hands];
        const hand1 = { ...newHands[selectedCard.handIndex], cards: [...newHands[selectedCard.handIndex].cards] };
        const hand2 = { ...newHands[handIndex], cards: [...newHands[handIndex].cards] };
        
        const temp = hand1.cards[selectedCard.cardIndex];
        hand1.cards[selectedCard.cardIndex] = hand2.cards[cardIndex];
        hand2.cards[cardIndex] = temp;
        
        hand1.result = evaluateHand(hand1.cards);
        hand2.result = evaluateHand(hand2.cards);
        
        newHands[selectedCard.handIndex] = hand1;
        newHands[handIndex] = hand2;
        
        setHands(newHands);
        setSwapsRemaining(prev => prev - 1);
        setSelectedCard(null);
        
        // Update max score if player achieves higher (algorithm is heuristic)
        const scoringCount = DIFFICULTY_CONFIG[difficulty].scoringHands;
        const newScore = [...newHands].map(h => evaluateHand(h.cards)?.score || 0)
          .sort((a, b) => b - a).slice(0, scoringCount).reduce((sum, s) => sum + s, 0);
        if (newScore > maxPossibleScore) {
          setMaxPossibleScore(newScore);
        }
      }
    }
  };

  const getCurrentScore = () => {
    const scoringCount = DIFFICULTY_CONFIG[difficulty].scoringHands;
    const scores = hands.map(hand => hand.result?.score || 0).sort((a, b) => b - a);
    return scores.slice(0, scoringCount).reduce((sum, s) => sum + s, 0);
  };

  // Get indices of top scoring hands
  const getTopIndices = (): number[] => {
    const scoringCount = DIFFICULTY_CONFIG[difficulty].scoringHands;
    const indexed = hands.map((hand, idx) => ({ score: hand.result?.score || 0, idx }));
    indexed.sort((a, b) => b.score - a.score);
    return indexed.slice(0, scoringCount).map(h => h.idx);
  };

  const topIndices = getTopIndices();
  const currentScore = getCurrentScore();
  const [isPerfectWin, setIsPerfectWin] = useState(false);

  const handleEndGame = useCallback((isPerfect: boolean = false) => {
    const finalScore = getCurrentScore();
    onGameComplete?.(finalScore);
    const isNew = saveHighScore(difficulty, finalScore);
    setIsNewHighScore(isNew);
    setIsPerfectWin(isPerfect);
    setGameState('gameOver');
  }, [hands, difficulty, onGameComplete]);

  const handleReset = () => {
    initializeGame(difficulty);
    setIsPerfectWin(false);
    setShowOptimalHands(false);
    setGameState('playing');
  };

  const handleChangeDifficulty = () => {
    setGameState('difficulty');
  };

  // Check for win condition (max score reached)
  useEffect(() => {
    if (gameState === 'playing' && maxPossibleScore > 0 && currentScore >= maxPossibleScore) {
      const timer = setTimeout(() => {
        handleEndGame(true);
        toast.success("🎉 Congrats, you win! Perfect score!");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentScore, maxPossibleScore, gameState, handleEndGame]);

  // Auto-end game when swaps run out
  useEffect(() => {
    if (gameState === 'playing' && swapsRemaining === 0 && currentScore < maxPossibleScore) {
      const timer = setTimeout(() => {
        handleEndGame(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [swapsRemaining, gameState, handleEndGame, currentScore, maxPossibleScore]);

  if (gameState === 'difficulty') {
    return (
      <div className="min-h-screen flex flex-col items-center p-4 pt-8">
        <DifficultySelect onSelect={handleDifficultySelect} />
      </div>
    );
  }

  const displayMax = Math.max(maxPossibleScore, currentScore);
  const scorePercentage = displayMax > 0 ? Math.min(100, Math.round((currentScore / displayMax) * 100)) : 0;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-8">
      <Link
        to="/"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        ← Back to Games
      </Link>
      <h1 className="text-2xl sm:text-3xl font-display text-gradient mb-4">POKER SWAP</h1>

      {/* Score and swaps display */}
      <div className="flex gap-6 mb-4 text-center">
        <div className="bg-card/80 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-xs text-muted-foreground">Score</div>
          <div className="text-xl font-display text-primary">
            {currentScore} / {displayMax}
          </div>
          <div className="text-xs text-muted-foreground">({scorePercentage}%)</div>
        </div>
        <div className="bg-card/80 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-xs text-muted-foreground">Swaps Left</div>
          <div className="text-xl font-display text-primary">{swapsRemaining}</div>
        </div>
      </div>

      {/* Game Over overlay */}
      {gameState === 'gameOver' && (
        <div className={`bg-card/95 backdrop-blur-sm rounded-lg p-6 mb-4 text-center transition-all duration-500 ${
          isPerfectWin ? 'animate-scale-in ring-4 ring-primary/50 shadow-[0_0_40px_rgba(var(--primary),0.4)]' : ''
        }`}>
          {isPerfectWin ? (
            <div className="relative">
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-primary/20 via-yellow-400/20 to-primary/20 rounded-lg blur-xl" />
              <h2 className="relative text-2xl font-display text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-primary mb-2 animate-pulse">
                🎉 Congrats, you win! 🎉
              </h2>
            </div>
          ) : (
            <h2 className="text-2xl font-display text-foreground mb-2">Game Over!</h2>
          )}
          {isNewHighScore && (
            <p className="text-yellow-500 font-display mb-2">🏆 New High Score!</p>
          )}
          <p className="text-lg text-muted-foreground mb-1">
            {isPerfectWin ? 'Perfect ' : 'Final '}Score: <span className="text-primary font-display">{currentScore}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Max Possible: {displayMax} ({scorePercentage}%)
          </p>
          
          {/* Optimal Hands Display */}
          {showOptimalHands && optimalHands && (
            <div className="bg-black/40 rounded-lg p-4 mb-4 max-w-md w-full">
              <h3 className="text-sm font-display text-foreground mb-3 text-center">Optimal Configuration</h3>
              <div className="flex flex-col gap-3">
                {optimalHands.map((hand, handIdx) => {
                  const handResult = evaluateHand(hand);
                  const optScores = optimalHands.map(h => evaluateHand(h)?.score || 0).sort((a, b) => b - a);
                  const scoringCount = DIFFICULTY_CONFIG[difficulty].scoringHands;
                  const threshold = optScores[scoringCount - 1] || 0;
                  const isScoring = (handResult?.score || 0) >= threshold;
                  return (
                    <div key={handIdx} className={`rounded p-2 ${isScoring ? 'bg-card/50' : 'bg-card/20 opacity-60'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">Hand {handIdx + 1}</span>
                        <span className={`text-xs font-display ${isScoring ? 'text-primary' : 'text-muted-foreground'}`}>
                          {handResult?.name} ({handResult?.score || 0})
                        </span>
                      </div>
                      <div className="flex gap-1 justify-center">
                        {hand.map((card, cardIdx) => (
                          <CardDisplay key={cardIdx} card={card} size="sm" />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="flex gap-2 justify-center flex-wrap">
            {optimalHands && !isPerfectWin && (
              <Button 
                onClick={() => setShowOptimalHands(prev => !prev)} 
                variant="outline"
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                {showOptimalHands ? 'Hide' : 'Show'} Optimal
              </Button>
            )}
            <Button onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Play Again
            </Button>
            <Button onClick={handleChangeDifficulty} variant="outline">
              Change Difficulty
            </Button>
          </div>
        </div>
      )}

      {/* Hands display */}
      <div className="flex flex-col gap-4 w-full max-w-lg">
        {hands.map((hand, handIndex) => {
          const isScoring = topIndices.includes(handIndex);
          return (
          <div key={handIndex} className={`backdrop-blur-sm rounded-lg p-3 transition-all ${
            isScoring ? 'bg-card/50' : 'bg-card/20 opacity-60'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                Hand {handIndex + 1} {!isScoring && <span className="text-xs">(not scored)</span>}
              </span>
              <span className={`text-sm font-display ${isScoring ? 'text-primary' : 'text-muted-foreground'}`}>
                {hand.result?.name || 'No Hand'} ({hand.result?.score || 0})
              </span>
            </div>
            <div className="flex gap-2 justify-center">
              {hand.cards.map((card, cardIndex) => {
                const isSelected = selectedCard?.handIndex === handIndex && selectedCard?.cardIndex === cardIndex;
                return (
                  <div
                    key={cardIndex}
                    onClick={() => gameState === 'playing' && handleCardClick(handIndex, cardIndex)}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-primary scale-105 -translate-y-1' : ''
                    } ${gameState === 'playing' && swapsRemaining > 0 ? 'hover:scale-105' : 'cursor-default'}`}
                  >
                    <CardDisplay card={card} size="md" />
                  </div>
                );
              })}
            </div>
          </div>
        );
        })}
      </div>

      {/* Action buttons */}
      {gameState === 'playing' && (
        <div className="flex gap-2 mt-6">
          {swapsRemaining > 0 && (
            <Button onClick={() => handleEndGame(false)} variant="outline">
              End Game
            </Button>
          )}
          <Button onClick={handleChangeDifficulty} variant="ghost">
            Change Difficulty
          </Button>
        </div>
      )}

      {selectedCard && gameState === 'playing' && (
        <p className="text-sm text-muted-foreground mt-4">
          Tap a card in another hand to swap
        </p>
      )}
    </div>
  );
};
