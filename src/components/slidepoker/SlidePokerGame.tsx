import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, shuffleDeck } from "@/data/pokergradaBoard";
import { CardDisplay } from "@/components/pokergrada/CardDisplay";
import { evaluateHand, HandResult } from "@/components/pokergrada/handEvaluator";
import { ArrowLeft, RotateCcw, Check, Trophy, Move, Eye } from "lucide-react";
import jokerImage from "@/assets/cards/joker.png";
import { Difficulty, DIFFICULTY_CONFIG, DifficultySelect, saveHighScore, getHighScores } from "./DifficultySelect";

const ROWS = 5;
const COLS = 3;

type GameState = 'select-difficulty' | 'countdown' | 'playing' | 'confirmed' | 'game-over';

const COUNTDOWN_SECONDS = 3;

// Create a deck based on difficulty settings and specific suits
const createDifficultyDeck = (difficulty: Difficulty, suits: Card['suit'][]): Card[] => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const deck: Card[] = [];
  
  for (const suit of suits) {
    for (const rank of config.ranks) {
      const value = rank === 'A' ? 14 : rank === 'K' ? 13 : rank === 'Q' ? 12 : rank === 'J' ? 11 : parseInt(rank);
      deck.push({ suit, rank, value });
    }
  }
  
  return deck;
};

// Generate random suits for a difficulty level
const generateRandomSuits = (difficulty: Difficulty): Card['suit'][] => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const allSuits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const shuffledSuits = [...allSuits].sort(() => Math.random() - 0.5);
  return shuffledSuits.slice(0, config.suitCount);
};

// Find the best PLAYER wild card for the column that contains the empty spot.
// The wild card can be ANY of the 52 standard cards, including duplicates of cards on the board.
const findBestWildCard = (
  grid: (Card | null)[],
  emptyColIndex: number
): { card: Card; score: number; handName: string } => {
  // Build the full 52-card deck (duplicates allowed)
  const allSuits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const allRanks: Card['rank'][] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const fullDeck: Card[] = [];
  for (const suit of allSuits) {
    for (const rank of allRanks) {
      const value = rank === 'A' ? 14 : rank === 'K' ? 13 : rank === 'Q' ? 12 : rank === 'J' ? 11 : parseInt(rank);
      fullDeck.push({ suit, rank, value });
    }
  }


  const emptyIdx = grid.findIndex(c => c === null);
  const emptyRowIndex = Math.floor(emptyIdx / COLS);

  // Extract the column cards (with the null)
  const baseCol: (Card | null)[] = [];
  for (let row = 0; row < ROWS; row++) {
    baseCol.push(grid[row * COLS + emptyColIndex]);
  }

  let bestCard = fullDeck[0];
  let bestScore = -Infinity;
  let bestHandName = 'High Card';

  // Iterate through all 52 cards and pick the highest-scoring hand for THIS column.
  for (const testCard of fullDeck) {
    const testCol = [...baseCol];
    testCol[emptyRowIndex] = testCard;

    const result = evaluateHand(testCol);
    const score = result?.score ?? 0;

    if (score > bestScore) {
      bestScore = score;
      bestCard = testCard;
      bestHandName = result?.name ?? 'High Card';
    }
  }

  return { card: bestCard, score: bestScore, handName: bestHandName };
};

// Find the best arrangement using greedy approach with local optimization
const findBestArrangement = (cards: Card[]): { score: number; columns: Card[][] } => {
  // Start with a smart initial distribution based on suit grouping
  const bySuit = new Map<string, Card[]>();
  for (const card of cards) {
    const arr = bySuit.get(card.suit) || [];
    arr.push(card);
    bySuit.set(card.suit, arr);
  }
  
  // Distribute cards to columns, trying to keep suits together
  const cols: Card[][] = [[], [], []];
  let colIdx = 0;
  for (const suitCards of bySuit.values()) {
    for (const card of suitCards) {
      // Find column with fewest cards that's not full
      const targetCol = cols.reduce((best, col, idx) => 
        col.length < 5 && col.length < cols[best].length ? idx : best, 0);
      if (cols[targetCol].length < 5) {
        cols[targetCol].push(card);
      } else {
        // Find any column with space
        for (let i = 0; i < 3; i++) {
          if (cols[i].length < 5) {
            cols[i].push(card);
            break;
          }
        }
      }
    }
  }
  
  // Local optimization: swap cards between columns to improve score
  let improved = true;
  let iterations = 0;
  const MAX_ITERATIONS = 3;
  
  while (improved && iterations < MAX_ITERATIONS) {
    improved = false;
    iterations++;
    
    const currentScore = cols.reduce((sum, col) => sum + (evaluateHand(col)?.score || 0), 0);
    
    for (let c1 = 0; c1 < 3 && !improved; c1++) {
      for (let c2 = c1 + 1; c2 < 3 && !improved; c2++) {
        for (let i1 = 0; i1 < 5 && !improved; i1++) {
          for (let i2 = 0; i2 < 5 && !improved; i2++) {
            // Swap
            [cols[c1][i1], cols[c2][i2]] = [cols[c2][i2], cols[c1][i1]];
            const newScore = cols.reduce((sum, col) => sum + (evaluateHand(col)?.score || 0), 0);
            
            if (newScore > currentScore) {
              improved = true;
            } else {
              // Swap back
              [cols[c1][i1], cols[c2][i2]] = [cols[c2][i2], cols[c1][i1]];
            }
          }
        }
      }
    }
  }
  
  const finalScore = cols.reduce((sum, col) => sum + (evaluateHand(col)?.score || 0), 0);
  return { score: finalScore, columns: cols };
};

type OptimalResult = { score: number; columns: Card[][]; wildCard: Card };

// Calculate the theoretical max score by finding optimal arrangement of all 15 cards
const calculateMaxScore = (boardCards: Card[], difficulty: Difficulty, suits: Card['suit'][]): OptimalResult | null => {
  if (boardCards.length !== 14) return null;
  
  // Build full 52-card deck for wild card options
  const allSuits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const allRanks: Card['rank'][] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const fullDeck: Card[] = [];
  for (const suit of allSuits) {
    for (const rank of allRanks) {
      const value = rank === 'A' ? 14 : rank === 'K' ? 13 : rank === 'Q' ? 12 : rank === 'J' ? 11 : parseInt(rank);
      fullDeck.push({ suit, rank, value });
    }
  }
  
  let best: OptimalResult | null = null;
  
  // Try each of the 52 possible wild cards
  for (const wildCard of fullDeck) {
    const allCards = [...boardCards, wildCard];
    const result = findBestArrangement(allCards);
    if (!best || result.score > best.score) {
      best = { score: result.score, columns: result.columns, wildCard };
    }
  }
  
  return best;
};

export interface SlidePokerGameProps {
  initialDifficulty?: Difficulty;
  onBackToMenu?: () => void;
  onGameComplete?: (score: number) => void;
}

export const SlidePokerGame = ({ initialDifficulty, onBackToMenu, onGameComplete }: SlidePokerGameProps = {}) => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(initialDifficulty || null);
  const [grid, setGrid] = useState<(Card | null)[]>([]);
  const [gameState, setGameState] = useState<GameState>('select-difficulty');
  const [moveCount, setMoveCount] = useState(0);
  const [wildCardInfo, setWildCardInfo] = useState<{ card: Card; rowIndex: number; handName: string } | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [optimalResult, setOptimalResult] = useState<OptimalResult | null>(null);
  const [isPerfectWin, setIsPerfectWin] = useState(false);
  const [showOptimalHands, setShowOptimalHands] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [gameSuits, setGameSuits] = useState<Card['suit'][]>([]);
  const startedFromHub = !!initialDifficulty;

  // Auto-start if initialDifficulty provided
  useEffect(() => {
    if (initialDifficulty && gameState === 'select-difficulty') {
      handleSelectDifficulty(initialDifficulty);
    }
  }, []);

  const emptyIndex = useMemo(() => grid.findIndex(c => c === null), [grid]);

  // Get adjacent indices that can slide into empty spot
  const getAdjacentIndices = useCallback((emptyIdx: number): number[] => {
    const row = Math.floor(emptyIdx / COLS);
    const col = emptyIdx % COLS;
    const adjacent: number[] = [];
    
    // Up
    if (row > 0) adjacent.push(emptyIdx - COLS);
    // Down
    if (row < ROWS - 1) adjacent.push(emptyIdx + COLS);
    // Left
    if (col > 0) adjacent.push(emptyIdx - 1);
    // Right
    if (col < COLS - 1) adjacent.push(emptyIdx + 1);
    
    return adjacent;
  }, []);

  const canSlide = useCallback((cardIndex: number): boolean => {
    return getAdjacentIndices(emptyIndex).includes(cardIndex);
  }, [emptyIndex, getAdjacentIndices]);

  const slideCard = useCallback((cardIndex: number) => {
    if (gameState !== 'playing' || !canSlide(cardIndex)) return;
    
    setGrid(prev => {
      const newGrid = [...prev];
      [newGrid[cardIndex], newGrid[emptyIndex]] = [newGrid[emptyIndex], newGrid[cardIndex]];
      return newGrid;
    });
    setMoveCount(prev => prev + 1);
  }, [gameState, canSlide, emptyIndex]);

  // Evaluate current columns (each column is a 5-card hand)
  const colResults = useMemo((): (HandResult | null)[] => {
    // Ensure grid is fully initialized (15 cells: 14 cards + 1 empty)
    if (grid.length < ROWS * COLS) return [];
    const results: (HandResult | null)[] = [];
    for (let c = 0; c < COLS; c++) {
      const colCards: (Card | null)[] = [];
      for (let r = 0; r < ROWS; r++) {
        colCards.push(grid[r * COLS + c]);
      }
      // Only evaluate complete columns (no null or undefined)
      if (colCards.every(card => card != null)) {
        results.push(evaluateHand(colCards as Card[]));
      } else {
        results.push(null);
      }
    }
    return results;
  }, [grid]);

  // Calculate score (only for complete columns or after confirmation)
  const currentScore = useMemo(() => {
    if (gameState === 'game-over' && wildCardInfo && grid.length > 0) {
      // Include the wild card column score
      return colResults.reduce((sum, r, colIdx) => {
        if (colIdx === wildCardInfo.rowIndex) {
          // This column uses the wild card
          const colCards: (Card | null)[] = [];
          for (let row = 0; row < ROWS; row++) {
            colCards.push(grid[row * COLS + colIdx]);
          }
          const emptyIdx = colCards.findIndex(c => c === null);
          const filledCol = [...colCards];
          filledCol[emptyIdx] = wildCardInfo.card;
          const result = evaluateHand(filledCol);
          return sum + (result?.score || 0);
        }
        return sum + (r?.score || 0);
      }, 0);
    }
    return colResults.reduce((sum, r) => sum + (r?.score || 0), 0);
  }, [colResults, gameState, wildCardInfo, grid]);

  function initializeGrid(diff: Difficulty): { grid: (Card | null)[]; boardCards: Card[]; suits: Card['suit'][] } {
    const suits = generateRandomSuits(diff);
    const deck = shuffleDeck(createDifficultyDeck(diff, suits));
    const cards = deck.slice(0, 14);
    const gridWithEmpty: (Card | null)[] = [...cards, null];
    // Shuffle to randomize empty position
    const shuffledGrid = shuffleDeck(gridWithEmpty as Card[]) as (Card | null)[];
    return { grid: shuffledGrid, boardCards: cards, suits };
  }

  const [pendingMaxCalc, setPendingMaxCalc] = useState<{ cards: Card[]; diff: Difficulty; suits: Card['suit'][] } | null>(null);

  // Calculate max score in background during countdown
  useEffect(() => {
    if (!pendingMaxCalc) return;
    
    const timeoutId = setTimeout(() => {
      const result = calculateMaxScore(pendingMaxCalc.cards, pendingMaxCalc.diff, pendingMaxCalc.suits);
      setOptimalResult(result);
      setPendingMaxCalc(null);
    }, 50); // Small delay to let UI render first
    
    return () => clearTimeout(timeoutId);
  }, [pendingMaxCalc]);

  // Countdown timer
  useEffect(() => {
    if (gameState !== 'countdown') return;
    
    if (countdown <= 0) {
      setGameState('playing');
      return;
    }
    
    const timerId = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timerId);
  }, [gameState, countdown]);

  const handleSelectDifficulty = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    const { grid: newGrid, boardCards, suits } = initializeGrid(diff);
    setGrid(newGrid);
    setGameSuits(suits);
    setOptimalResult(null); // Will be calculated in background
    setPendingMaxCalc({ cards: boardCards, diff, suits });
    setCountdown(COUNTDOWN_SECONDS);
    setGameState('countdown');
    setMoveCount(0);
    setWildCardInfo(null);
    setIsNewHighScore(false);
    setIsPerfectWin(false);
    setShowOptimalHands(false);
  }, []);

  const handleBackToMenu = useCallback(() => {
    setDifficulty(null);
    setGameState('select-difficulty');
    setPendingMaxCalc(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!difficulty || grid.length === 0 || gameSuits.length === 0) return;
    // Find which column has the empty spot
    const emptyColIndex = emptyIndex % COLS;
    
    // Find the best wild card for the column (from full 52-card deck)
    const { card, handName } = findBestWildCard(grid, emptyColIndex);
    
    setWildCardInfo({ card, rowIndex: emptyColIndex, handName });
    setGameState('game-over');
    
    // Calculate final score with wild card
    const finalScore = colResults.reduce((sum, r, idx) => {
      if (idx === emptyColIndex) {
        const colCards: (Card | null)[] = [];
        for (let row = 0; row < ROWS; row++) {
          colCards.push(grid[row * COLS + emptyColIndex]);
        }
        const filledCol = [...colCards];
        const emptyIdx = colCards.findIndex(c => c === null);
        filledCol[emptyIdx] = card;
        const result = evaluateHand(filledCol);
        return sum + (result?.score || 0);
      }
      return sum + (r?.score || 0);
    }, 0);
    
    // Check for perfect win (optimalResult already calculated in background)
    const maxScore = optimalResult?.score ?? 0;
    if (finalScore >= maxScore && maxScore > 0) {
      setIsPerfectWin(true);
    }
    
    onGameComplete?.(finalScore);
    setIsNewHighScore(saveHighScore(difficulty, finalScore));
  }, [emptyIndex, grid, colResults, difficulty, optimalResult, gameSuits, onGameComplete]);

  const handleReset = useCallback(() => {
    if (!difficulty) return;
    const { grid: newGrid, boardCards, suits } = initializeGrid(difficulty);
    setGrid(newGrid);
    setGameSuits(suits);
    setOptimalResult(null);
    setPendingMaxCalc({ cards: boardCards, diff: difficulty, suits });
    setCountdown(COUNTDOWN_SECONDS);
    setGameState('countdown');
    setMoveCount(0);
    setWildCardInfo(null);
    setIsNewHighScore(false);
    setIsPerfectWin(false);
    setShowOptimalHands(false);
  }, [difficulty]);

  const maxPossibleScore = optimalResult?.score ?? 0;
  const highScore = difficulty ? getHighScores()[difficulty] : 0;

  // Early return AFTER all hooks
  if (gameState === 'select-difficulty') {
    return <DifficultySelect onSelect={handleSelectDifficulty} />;
  }

  // Countdown screen
  if (gameState === 'countdown') {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center py-4 px-2 sm:py-8 sm:px-4"
        style={{
          background: `
            radial-gradient(ellipse at center, hsl(142 40% 28%) 0%, hsl(142 45% 18%) 70%, hsl(142 50% 12%) 100%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")
          `,
          backgroundBlendMode: 'overlay',
        }}
      >
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-display text-gradient mb-8">SLIDE POKER</h1>
          <div className="bg-black/50 rounded-2xl px-12 py-8 mb-6">
            <p className="text-2xl sm:text-3xl font-display text-white animate-pulse drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              Preparing puzzle...
            </p>
          </div>
          <p className="text-white/60 text-sm drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {difficulty && DIFFICULTY_CONFIG[difficulty].label} Mode
          </p>
        </div>
      </div>
    );
  }

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
      {/* Header */}
      <header className="w-full max-w-2xl flex items-center justify-between mb-4 sm:mb-6">
        <button onClick={handleBackToMenu} className="flex items-center gap-2 text-white/90 hover:text-primary transition-colors drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-display text-gradient">SLIDE POKER</h1>
        <div className="flex items-center gap-2 text-white/90 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-sm">{highScore}</span>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="w-full max-w-2xl flex items-center justify-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg">
          <Move className="w-4 h-4 text-primary" />
          <span className="text-white">{moveCount} moves</span>
        </div>
        <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg">
          <span className="text-white/80">Score:</span>
          <span className="text-white font-bold">{currentScore}</span>
        </div>
      </div>

      {/* Game Grid - 3 columns x 5 rows, scoring columns */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Grid */}
        <div className="flex flex-col gap-1 sm:gap-2">
          {Array.from({ length: ROWS }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex gap-1 sm:gap-2 justify-center">
              {Array.from({ length: COLS }).map((_, colIdx) => {
                const cellIndex = rowIdx * COLS + colIdx;
                const card = grid[cellIndex];
                const isAdjacent = canSlide(cellIndex);
                const isEmpty = card === null;
                const isWildCol = wildCardInfo?.rowIndex === colIdx;
                const isWildCell = isEmpty && gameState === 'game-over' && isWildCol;
                
                if (isEmpty && gameState !== 'game-over') {
                  return (
                    <div
                      key={cellIndex}
                      className="w-[72px] h-[100px] xs:w-20 xs:h-28 sm:w-24 sm:h-[132px] rounded border-2 border-dashed border-white/30 bg-black/20 flex items-center justify-center"
                    >
                      <span className="text-white/30 text-2xl">?</span>
                    </div>
                  );
                }
                
                if (isWildCell && wildCardInfo) {
                  return (
                    <div
                      key={cellIndex}
                      className="relative w-[72px] h-[100px] xs:w-20 xs:h-28 sm:w-24 sm:h-[132px] rounded overflow-hidden shadow-lg ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent"
                    >
                      <img 
                        src={jokerImage} 
                        alt="Wild Card (Joker)"
                        className="absolute inset-0 w-full h-full object-contain rounded"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-center py-0.5 text-[10px] text-yellow-400 font-bold">
                        {wildCardInfo.card.rank}{wildCardInfo.card.suit === 'hearts' ? '♥' : wildCardInfo.card.suit === 'diamonds' ? '♦' : wildCardInfo.card.suit === 'clubs' ? '♣' : '♠'}
                      </div>
                    </div>
                  );
                }
                
                if (card) {
                  return (
                    <div
                      key={cellIndex}
                      className={cn(
                        "transition-all duration-200",
                        isAdjacent && gameState === 'playing' && "cursor-pointer hover:scale-105 hover:-translate-y-1"
                      )}
                      onClick={() => slideCard(cellIndex)}
                    >
                      <CardDisplay
                        card={card}
                        size="lg"
                        disabled={gameState !== 'playing'}
                        highlighted={isAdjacent && gameState === 'playing'}
                      />
                    </div>
                  );
                }
                
                return null;
              })}
            </div>
          ))}
        </div>
        
        {/* Column scores below grid */}
        <div className="flex gap-1 sm:gap-2 justify-center">
          {Array.from({ length: COLS }).map((_, colIdx) => {
            const colResult = colResults[colIdx];
            const isWildCol = wildCardInfo?.rowIndex === colIdx;
            
            // Calculate wild column score
            let wildColScore = 0;
            if (isWildCol && wildCardInfo) {
              const colCards: (Card | null)[] = [];
              for (let r = 0; r < ROWS; r++) {
                colCards.push(grid[r * COLS + colIdx]);
              }
              const filledCol = colCards.map(c => c === null ? wildCardInfo.card : c);
              wildColScore = evaluateHand(filledCol)?.score || 0;
            }
            
            return (
              <div key={colIdx} className="w-[72px] xs:w-20 sm:w-24 text-center">
                {colResult ? (
                  <div className="bg-black/40 px-2 py-1 rounded text-xs">
                    <div className="text-foreground font-medium truncate">{colResult.name}</div>
                    <div className="text-primary font-bold">+{colResult.score}</div>
                  </div>
                ) : isWildCol && wildCardInfo ? (
                  <div className="bg-black/40 px-2 py-1 rounded text-xs border border-yellow-400/50">
                    <div className="text-yellow-400 font-medium truncate">{wildCardInfo.handName}</div>
                    <div className="text-yellow-400 font-bold">+{wildColScore}</div>
                  </div>
                ) : (
                  <div className="text-muted-foreground/50 text-xs">—</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {gameState === 'playing' && (
          <>
            <Button
              onClick={handleReset}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button
              onClick={handleConfirm}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Check className="w-4 h-4" />
              Confirm & Use Wild
            </Button>
          </>
        )}
        
        {gameState === 'game-over' && (
          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              "text-center bg-black/50 px-6 py-4 rounded-xl transition-all duration-500",
              isPerfectWin && "ring-4 ring-primary/50 shadow-[0_0_40px_rgba(var(--primary),0.4)]"
            )}>
              {isPerfectWin ? (
                <div className="relative mb-3">
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-primary/20 via-yellow-400/20 to-primary/20 rounded-lg blur-xl" />
                  <h2 className="relative text-2xl font-display text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-primary animate-pulse">
                    🎉 Perfect Score! 🎉
                  </h2>
                </div>
              ) : isNewHighScore ? (
                <div className="text-yellow-400 font-display text-lg mb-2 animate-pulse">
                  🏆 NEW HIGH SCORE! 🏆
                </div>
              ) : null}
              <div className="text-2xl font-display text-white">
                {isPerfectWin ? 'Score' : 'Final Score'}: <span className="text-primary">{currentScore}</span>
                {maxPossibleScore > 0 && (
                  <span className="text-white/70"> / {Math.max(maxPossibleScore, currentScore)}</span>
                )}
              </div>
              {maxPossibleScore > 0 && (
                <div className="text-sm text-white/80 mt-1">
                  ({Math.min(100, Math.round((currentScore / maxPossibleScore) * 100))}% of max)
                </div>
              )}
              <div className="text-sm text-white/80 mt-1">
                Completed in {moveCount} moves
              </div>
              {wildCardInfo && (
                <div className="text-sm text-yellow-400 mt-2">
                  Wild card became: {wildCardInfo.card.rank} of {wildCardInfo.card.suit}
                </div>
              )}
            </div>
            
            {/* Optimal Hands Display */}
            {showOptimalHands && optimalResult && (
              <div className="bg-black/60 rounded-xl p-4 max-w-md w-full">
                <h3 className="text-lg font-display text-white mb-3 text-center">Optimal Hands</h3>
                <div className="flex gap-3 justify-center">
                  {optimalResult.columns.map((col, colIdx) => {
                    const handResult = evaluateHand(col);
                    const isWildInCol = col.some(c => 
                      c.rank === optimalResult.wildCard.rank && c.suit === optimalResult.wildCard.suit
                    );
                    return (
                      <div key={colIdx} className="flex flex-col items-center gap-1">
                        {col.map((card, cardIdx) => {
                          const isWild = card.rank === optimalResult.wildCard.rank && 
                                        card.suit === optimalResult.wildCard.suit;
                          return (
                            <div 
                              key={cardIdx} 
                              className={cn(
                                "relative",
                                isWild && "ring-2 ring-yellow-400 rounded"
                              )}
                            >
                              <CardDisplay card={card} size="sm" />
                              {isWild && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                                  <span className="text-[8px] text-black font-bold">W</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <div className="bg-black/40 px-2 py-1 rounded text-xs mt-1 text-center">
                          <div className={cn(
                            "font-medium truncate",
                            isWildInCol ? "text-yellow-400" : "text-foreground"
                          )}>
                            {handResult?.name}
                          </div>
                          <div className={cn(
                            "font-bold",
                            isWildInCol ? "text-yellow-400" : "text-primary"
                          )}>
                            +{handResult?.score || 0}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center text-sm text-yellow-400 mt-3">
                  Optimal wild card: {optimalResult.wildCard.rank} of {optimalResult.wildCard.suit}
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              {optimalResult && !isPerfectWin && (
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
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {gameState === 'playing' && (
        <div className="mt-6 text-center text-sm text-white/90 max-w-md drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          <p>Slide cards into the empty spot to form 3 poker hands (columns).</p>
          <p className="mt-1">Click "Confirm" when ready — the wild card will become the best possible card for its column!</p>
        </div>
      )}
    </div>
  );
};
