import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, shuffleDeck } from "@/data/pokergradaBoard";
import { CardDisplay } from "@/components/pokergrada/CardDisplay";
import { evaluateHand, HandResult, HandRank } from "@/components/pokergrada/handEvaluator";
import { ArrowLeft, Play, RotateCcw, Timer, Trophy, Volume2, VolumeX } from "lucide-react";
import { Link } from "react-router-dom";

export interface PokerBoggleGameProps {
  isMusicPlaying?: boolean;
  onToggleMusic?: () => void;
  initialDifficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  onBackToMenu?: () => void;
  onGameComplete?: (score: number) => void;
}

// Create deck for Poker Boggle (excludes 2, 3, 4, and one random suit)
const createPokerBoggleDeck = (): Card[] => {
  const allSuits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  // Remove one random suit
  const excludedSuitIndex = Math.floor(Math.random() * 4);
  const suits = allSuits.filter((_, i) => i !== excludedSuitIndex);
  
  const deck: Card[] = [];

  for (const suit of suits) {
    for (let i = 0; i < ranks.length; i++) {
      deck.push({
        suit,
        rank: ranks[i],
        value: i + 5, // 5 = 5, ... A = 14
      });
    }
  }

  return deck;
};

const GRID_SIZE = 4;

// Shuffle an array of numbers
const shuffleNumbers = (arr: number[]): number[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Check if two positions are adjacent (including diagonals)
const isAdjacentPos = (pos1: number, pos2: number): boolean => {
  const row1 = Math.floor(pos1 / GRID_SIZE);
  const col1 = pos1 % GRID_SIZE;
  const row2 = Math.floor(pos2 / GRID_SIZE);
  const col2 = pos2 % GRID_SIZE;
  
  const rowDiff = Math.abs(row1 - row2);
  const colDiff = Math.abs(col1 - col2);
  
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
};

// Get adjacent positions for a given grid position (4x4 grid)
const getGridAdjacentPositions = (pos: number): number[] => {
  const adjacent: number[] = [];
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    if (isAdjacentPos(pos, i)) {
      adjacent.push(i);
    }
  }
  return adjacent;
};

// Find 3 connected positions for the triple rank cards
const findConnectedTriplePositions = (): [number, number, number] => {
  // Get all possible starting positions
  const allPositions = Array.from({ length: 16 }, (_, i) => i);
  const shuffledStarts = shuffleNumbers(allPositions);
  
  for (const start of shuffledStarts) {
    const adjacent1 = getGridAdjacentPositions(start);
    const shuffledAdj1 = shuffleNumbers(adjacent1);
    
    for (const second of shuffledAdj1) {
      // Third card must be adjacent to first OR second
      const adjacentToFirst = getGridAdjacentPositions(start);
      const adjacentToSecond = getGridAdjacentPositions(second);
      const possibleThirds = [...new Set([...adjacentToFirst, ...adjacentToSecond])]
        .filter(p => p !== start && p !== second);
      
      if (possibleThirds.length > 0) {
        const third = possibleThirds[Math.floor(Math.random() * possibleThirds.length)];
        return [start, second, third];
      }
    }
  }
  
  // Fallback (should never happen)
  return [0, 1, 2];
};

// Create a 16-card grid ensuring at least one of each rank and at least 3 of one rank
// The 3 matching rank cards are guaranteed to be adjacent to each other
const createPokerBoggleGrid = (): Card[] => {
  const deck = createPokerBoggleDeck(); // 30 cards (3 suits × 10 ranks)
  const ranks = ['5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const usedIndices = new Set<number>();
  
  // Pick a random rank to have 3 copies of (for guaranteed three-of-a-kind potential)
  const tripleRank = ranks[Math.floor(Math.random() * ranks.length)];
  
  // Get the 3 cards of the triple rank
  const tripleCards = deck
    .map((card, idx) => ({ card, idx }))
    .filter(({ card }) => card.rank === tripleRank);
  
  for (const { idx } of tripleCards) {
    usedIndices.add(idx);
  }
  
  // Collect other cards: one of each other rank
  const otherCards: Card[] = [];
  for (const rank of ranks) {
    if (rank === tripleRank) continue;
    
    const cardsOfRank = deck
      .map((card, idx) => ({ card, idx }))
      .filter(({ card, idx }) => card.rank === rank && !usedIndices.has(idx));
    
    const randomChoice = cardsOfRank[Math.floor(Math.random() * cardsOfRank.length)];
    otherCards.push(randomChoice.card);
    usedIndices.add(randomChoice.idx);
  }
  
  // Fill remaining 4 spots with random cards from unused pool
  const remaining = deck.filter((_, idx) => !usedIndices.has(idx));
  const shuffledRemaining = shuffleDeck(remaining);
  otherCards.push(...shuffledRemaining.slice(0, 4));
  
  // Shuffle the other cards
  const shuffledOthers = shuffleDeck(otherCards);
  
  // Find 3 connected positions for the triple rank cards
  const triplePositions = findConnectedTriplePositions();
  const triplePositionSet = new Set(triplePositions);
  
  // Build the final grid
  const grid: Card[] = new Array(16);
  
  // Place triple cards in their designated adjacent positions
  tripleCards.forEach(({ card }, i) => {
    grid[triplePositions[i]] = card;
  });
  
  // Fill remaining positions with other cards
  let otherIdx = 0;
  for (let pos = 0; pos < 16; pos++) {
    if (!triplePositionSet.has(pos)) {
      grid[pos] = shuffledOthers[otherIdx++];
    }
  }
  
  return grid;
};

// Poker Boggle specific scoring (straight is minimum)
const POKER_BOGGLE_SCORES: Partial<Record<HandRank, number>> = {
  'royal-flush': 200,
  'straight-flush': 100,
  'four-of-a-kind': 75,
  'full-house': 50,
  'flush': 50,
  'straight': 25,
};

const getPokerBoggleScore = (result: HandResult): number => {
  return POKER_BOGGLE_SCORES[result.rank] ?? 0;
};

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
type GameState = 'select-difficulty' | 'ready' | 'grace-period' | 'playing' | 'game-over';

const GRACE_PERIOD = 5;

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; duration: number; description: string }> = {
  easy: { label: 'Easy', duration: 300, description: '5 minutes' },
  medium: { label: 'Medium', duration: 180, description: '3 minutes' },
  hard: { label: 'Hard', duration: 120, description: '2 minutes' },
  expert: { label: 'Expert', duration: 60, description: '1 minute' },
};

// High score storage
const getHighScores = (): Record<Difficulty, number> => {
  const stored = localStorage.getItem('pokerBoggleHighScores');
  return stored ? JSON.parse(stored) : { easy: 0, medium: 0, hard: 0, expert: 0 };
};

const saveHighScore = (difficulty: Difficulty, score: number): boolean => {
  const highScores = getHighScores();
  if (score > highScores[difficulty]) {
    highScores[difficulty] = score;
    localStorage.setItem('pokerBoggleHighScores', JSON.stringify(highScores));
    return true;
  }
  return false;
};

// Check if two positions are adjacent (including diagonals)
const isAdjacent = (pos1: number, pos2: number): boolean => {
  const row1 = Math.floor(pos1 / GRID_SIZE);
  const col1 = pos1 % GRID_SIZE;
  const row2 = Math.floor(pos2 / GRID_SIZE);
  const col2 = pos2 % GRID_SIZE;
  
  const rowDiff = Math.abs(row1 - row2);
  const colDiff = Math.abs(col1 - col2);
  
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
};

// Generate a unique key for a hand based on the scoring cards only
// For hands like pairs, only the paired cards matter (not kickers)
// Special rules: Straights duplicate by same 5 values, Flushes duplicate by same suit
const getHandKey = (cards: Card[], handRank: string): string => {
  // Straight flushes and royal flushes are never duplicates (use exact cards)
  if (handRank === 'straight-flush' || handRank === 'royal-flush') {
    const cardKey = cards.map(c => `${c.rank}-${c.suit}`).sort().join(',');
    return `${handRank}:${cardKey}`;
  }
  
  // Straights duplicate by same 5 values (regardless of suit)
  if (handRank === 'straight') {
    const valueKey = cards.map(c => c.value).sort((a, b) => a - b).join(',');
    return `straight:${valueKey}`;
  }
  
  // Flushes duplicate by same suit (regardless of specific cards)
  if (handRank === 'flush') {
    return `flush:${cards[0].suit}`;
  }
  
  const rankCounts = new Map<string, Card[]>();
  for (const card of cards) {
    if (!rankCounts.has(card.rank)) {
      rankCounts.set(card.rank, []);
    }
    rankCounts.get(card.rank)!.push(card);
  }
  
  const sortedByCount = Array.from(rankCounts.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  // Extract the cards that form the hand based on hand type
  let scoringCards: Card[] = [];
  
  switch (handRank) {
    case 'four-of-a-kind':
      // The 4 matching cards
      scoringCards = sortedByCount[0][1];
      break;
    case 'full-house': {
      // Full house uniqueness is defined by the ranks only (suits don't matter)
      const tripleRank = sortedByCount[0][0];
      const pairRank = sortedByCount[1][0];
      return `full-house:${tripleRank}+${pairRank}`;
    }
    case 'three-of-a-kind':
      // Just the 3 matching cards
      scoringCards = sortedByCount[0][1];
      break;
    case 'two-pair':
      // Just the 4 cards that form the pairs
      scoringCards = [...sortedByCount[0][1], ...sortedByCount[1][1]];
      break;
    case 'one-pair':
      // Just the 2 matching cards
      scoringCards = sortedByCount[0][1];
      break;
    default:
      // For ace high, high card - all 5 cards contribute
      scoringCards = cards;
  }
  
  // Create key from hand type + sorted scoring card identifiers
  const cardKey = scoringCards
    .map(c => `${c.rank}-${c.suit}`)
    .sort()
    .join(',');
  
  return `${handRank}:${cardKey}`;
};

// Get a descriptive name for a hand based on its cards
const getHandDescription = (hand: HandResult, cards: Card[]): string => {
  const rankCounts = new Map<string, Card[]>();
  for (const card of cards) {
    if (!rankCounts.has(card.rank)) {
      rankCounts.set(card.rank, []);
    }
    rankCounts.get(card.rank)!.push(card);
  }
  const sortedByCount = Array.from(rankCounts.entries())
    .sort((a, b) => b[1].length - a[1].length || b[1][0].value - a[1][0].value);

  const suitSymbols: Record<string, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };

  const sortedValues = cards.map(c => c.value).sort((a, b) => a - b);
  const lowRank = cards.find(c => c.value === sortedValues[0])?.rank.toUpperCase();
  const highRank = cards.find(c => c.value === sortedValues[4])?.rank.toUpperCase();

  switch (hand.rank) {
    case 'royal-flush':
      return `Royal Flush ${suitSymbols[cards[0].suit]}`;
    case 'straight-flush':
      return `Straight Flush ${lowRank}-${highRank} ${suitSymbols[cards[0].suit]}`;
    case 'four-of-a-kind':
      return `Four ${sortedByCount[0][0].toUpperCase()}s`;
    case 'full-house':
      return `Full House ${sortedByCount[0][0].toUpperCase()}s/${sortedByCount[1][0].toUpperCase()}s`;
    case 'flush':
      return `Flush ${suitSymbols[cards[0].suit]}`;
    case 'straight':
      return `Straight ${lowRank}-${highRank}`;
    case 'three-of-a-kind':
      return `Three ${sortedByCount[0][0].toUpperCase()}s`;
    case 'two-pair':
      const pair1 = sortedByCount[0][0].toUpperCase();
      const pair2 = sortedByCount[1][0].toUpperCase();
      return `Two Pair ${pair1}s & ${pair2}s`;
    case 'one-pair':
      return `Pair of ${sortedByCount[0][0].toUpperCase()}s`;
    case 'ace-high':
      return 'Ace High';
    default:
      return `${highRank} High`;
  }
};

// Get all adjacent positions for a given position
const getAdjacentPositions = (pos: number): number[] => {
  const adjacent: number[] = [];
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    if (isAdjacent(pos, i)) {
      adjacent.push(i);
    }
  }
  return adjacent;
};

type PossibleHand = { hand: HandResult; key: string; cards: Card[] };

// Find all valid 5-card paths and calculate max possible score
const calculateAllHands = (grid: Card[]): { totalScore: number; hands: PossibleHand[] } => {
  const uniqueHandKeys = new Set<string>();
  const hands: PossibleHand[] = [];
  let totalScore = 0;

  // DFS to find all 5-card paths
  const findPaths = (path: number[]) => {
    if (path.length === 5) {
      const cards = path.map(i => grid[i]);
      const result = evaluateHand(cards);
      if (result) {
        const score = getPokerBoggleScore(result);
        // Only count hands that score points (two pair or better)
        if (score > 0) {
          const key = getHandKey(cards, result.rank);
          if (!uniqueHandKeys.has(key)) {
            uniqueHandKeys.add(key);
            totalScore += score;
            hands.push({ hand: result, key, cards });
          }
        }
      }
      return;
    }

    const lastPos = path[path.length - 1];
    const adjacent = getAdjacentPositions(lastPos);
    
    for (const nextPos of adjacent) {
      if (!path.includes(nextPos)) {
        findPaths([...path, nextPos]);
      }
    }
  };

  // Start DFS from each position
  for (let start = 0; start < GRID_SIZE * GRID_SIZE; start++) {
    findPaths([start]);
  }

  // Sort by score descending
  hands.sort((a, b) => getPokerBoggleScore(b.hand) - getPokerBoggleScore(a.hand));

  return { totalScore, hands };
};

export const PokerBoggleGame = ({ isMusicPlaying = true, onToggleMusic, initialDifficulty, onBackToMenu, onGameComplete }: PokerBoggleGameProps) => {
  const [grid, setGrid] = useState<Card[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(initialDifficulty || null);
  const [gameState, setGameState] = useState<GameState>(initialDifficulty ? 'ready' : 'select-difficulty');
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [madeHands, setMadeHands] = useState<{ hand: HandResult; key: string; cards: Card[] }[]>([]);
  const [usedHandKeys, setUsedHandKeys] = useState<Set<string>>(new Set());
  const [lastHandResult, setLastHandResult] = useState<{ result: HandResult; isNew: boolean } | null>(null);
  const [graceTimeLeft, setGraceTimeLeft] = useState(GRACE_PERIOD);
  const [maxScore, setMaxScore] = useState(0);
  const [allPossibleHands, setAllPossibleHands] = useState<PossibleHand[]>([]);
  const [showUnfoundHands, setShowUnfoundHands] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [highScores, setHighScores] = useState(getHighScores());
  const [isPerfectWin, setIsPerfectWin] = useState(false);
  const savedGridRef = useRef<Card[]>([]);
  const savedMaxScoreRef = useRef(0);
  const savedAllHandsRef = useRef<PossibleHand[]>([]);
  const startedFromHub = !!initialDifficulty;

  // Initialize grid
  const initializeGrid = useCallback(() => {
    const newGrid = createPokerBoggleGrid();
    setGrid(newGrid);
    const { totalScore, hands } = calculateAllHands(newGrid);
    setMaxScore(totalScore);
    setAllPossibleHands(hands);
    // Save for retry
    savedGridRef.current = newGrid;
    savedMaxScoreRef.current = totalScore;
    savedAllHandsRef.current = hands;
  }, []);

  // Select difficulty and go to ready state
  const selectDifficulty = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setGameState('ready');
  }, []);

  // Start game with a new grid
  const startGame = useCallback(() => {
    if (!difficulty) return;
    initializeGrid();
    setSelectedIndices([]);
    setGameState('grace-period');
    setGraceTimeLeft(GRACE_PERIOD);
    setTimeLeft(DIFFICULTY_CONFIG[difficulty].duration);
    setScore(0);
    setMadeHands([]);
    setUsedHandKeys(new Set());
    setLastHandResult(null);
    setIsNewHighScore(false);
    setShowUnfoundHands(false);
    setIsPerfectWin(false);
  }, [initializeGrid, difficulty]);

  // Retry the same level with the saved grid
  const retryLevel = useCallback(() => {
    if (!difficulty || savedGridRef.current.length === 0) return;
    setGrid(savedGridRef.current);
    setMaxScore(savedMaxScoreRef.current);
    setAllPossibleHands(savedAllHandsRef.current);
    setSelectedIndices([]);
    setGameState('grace-period');
    setGraceTimeLeft(GRACE_PERIOD);
    setTimeLeft(DIFFICULTY_CONFIG[difficulty].duration);
    setScore(0);
    setMadeHands([]);
    setUsedHandKeys(new Set());
    setLastHandResult(null);
    setIsNewHighScore(false);
    setShowUnfoundHands(false);
    setIsPerfectWin(false);
  }, [difficulty]);

  // Back to difficulty selection
  const backToDifficulty = useCallback(() => {
    if (onBackToMenu) {
      onBackToMenu();
      return;
    }
    setDifficulty(null);
    setGameState('select-difficulty');
    setHighScores(getHighScores());
  }, [onBackToMenu]);

  // Start actual timer (skip grace period)
  const startTimer = useCallback(() => {
    if (gameState === 'grace-period') {
      setGameState('playing');
    }
  }, [gameState]);

  // Grace period timer
  useEffect(() => {
    if (gameState !== 'grace-period') return;

    const timer = setInterval(() => {
      setGraceTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('playing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Game timer effect
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('game-over');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Check for high score when game ends
  useEffect(() => {
    if (gameState === 'game-over' && difficulty && score > 0) {
      onGameComplete?.(score);
      const isNew = saveHighScore(difficulty, score);
      setIsNewHighScore(isNew);
      if (isNew) {
        setHighScores(getHighScores());
      }
    }
  }, [gameState, difficulty, score, onGameComplete]);

  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle card click
  const handleCardClick = useCallback((index: number) => {
    if (gameState !== 'playing' && gameState !== 'grace-period') return;

    // Start timer if in grace period
    if (gameState === 'grace-period') {
      setGameState('playing');
    }

    // If already selected, check if it's the last one to deselect
    const existingIndex = selectedIndices.indexOf(index);
    if (existingIndex !== -1) {
      if (existingIndex === selectedIndices.length - 1) {
        // Deselect last card
        setSelectedIndices(prev => prev.slice(0, -1));
      }
      return;
    }

    // Check if adjacent to last selected (or first selection)
    if (selectedIndices.length > 0) {
      const lastIndex = selectedIndices[selectedIndices.length - 1];
      if (!isAdjacent(lastIndex, index)) {
        return;
      }
    }

    const newSelection = [...selectedIndices, index];
    setSelectedIndices(newSelection);

    // If we have 5 cards, evaluate the hand
    if (newSelection.length === 5) {
      const selectedCards = newSelection.map(i => grid[i]);
      const result = evaluateHand(selectedCards);
      
      if (result) {
        const handScore = getPokerBoggleScore(result);
        const handKey = getHandKey(selectedCards, result.rank);
        
        // Only count hands that score (two pair or better)
        if (handScore === 0) {
          setLastHandResult({ result, isNew: false });
        } else if (usedHandKeys.has(handKey)) {
          // Duplicate hand
          setLastHandResult({ result, isNew: false });
        } else {
          // New hand!
          const newScore = score + handScore;
          setScore(newScore);
          setMadeHands(prev => [...prev, { hand: result, key: handKey, cards: selectedCards }]);
          setUsedHandKeys(prev => new Set([...prev, handKey]));
          setLastHandResult({ result, isNew: true });
          
          // Check for perfect win
          if (newScore >= maxScore) {
            setIsPerfectWin(true);
            setTimeout(() => {
              setGameState('game-over');
            }, 600);
          }
        }
      }
      
      // Clear selection after a brief delay
      setTimeout(() => {
        setSelectedIndices([]);
        setLastHandResult(null);
      }, 500);
    }
  }, [gameState, selectedIndices, grid, usedHandKeys]);

  // Get selection order for a card
  const getSelectionOrder = (index: number): number | null => {
    const order = selectedIndices.indexOf(index);
    return order === -1 ? null : order + 1;
  };

  // Check if a card can be selected next
  const canSelectNext = (index: number): boolean => {
    if (selectedIndices.length === 0) return true;
    if (selectedIndices.includes(index)) return false;
    if (selectedIndices.length >= 5) return false;
    const lastIndex = selectedIndices[selectedIndices.length - 1];
    return isAdjacent(lastIndex, index);
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center py-4 sm:py-8 px-2 sm:px-4 relative"
      style={{
        background: 'radial-gradient(ellipse at center, #1a2a4a 0%, #0d1828 50%, #070d15 100%)',
      }}
    >
      {/* Header - only show during gameplay, not difficulty select */}
      {gameState !== 'select-difficulty' && (
        <header className="w-full max-w-2xl flex items-center justify-between mb-4 sm:mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Games</span>
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display text-gradient">
            POKER BOGGLE
          </h1>
          <div className="w-16" />
        </header>
      )}

      {/* Select Difficulty State */}
      {gameState === 'select-difficulty' && (
        <div className="flex flex-col items-center gap-6 py-8 w-full max-w-md">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Link>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display text-gradient">
            POKER BOGGLE
          </h1>
          <div className="text-center max-w-md">
            <h2 className="text-xl font-display text-primary mb-4">How to Play</h2>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li>• Click adjacent cards to form 5-card poker hands</li>
              <li>• Make as many unique hands as possible before time runs out</li>
              <li>• Each unique hand scores points based on strength</li>
            </ul>
          </div>
          
          <div className="p-3 bg-card/50 rounded-xl border border-border">
            <h3 className="text-sm font-display text-primary mb-2 text-center">Scoring</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Royal Flush: 200</span>
              <span>Straight Flush: 100</span>
              <span>Four of a Kind: 75</span>
              <span>Full House: 50</span>
              <span>Flush: 50</span>
              <span>Straight: 25</span>
            </div>
          </div>

          <h3 className="text-lg font-display text-primary">Select Difficulty</h3>
          <div className="grid grid-cols-2 gap-3 w-full">
            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => selectDifficulty(d)}
                className="p-4 bg-card/50 hover:bg-card/80 rounded-xl border border-border transition-all hover:scale-105 text-left"
              >
                <div className="font-display text-foreground">{DIFFICULTY_CONFIG[d].label}</div>
                <div className="text-xs text-muted-foreground">{DIFFICULTY_CONFIG[d].description}</div>
                {highScores[d] > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-yellow-500">
                    <Trophy className="w-3 h-3" />
                    {highScores[d]}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ready State */}
      {gameState === 'ready' && difficulty && (
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="text-center">
            <h2 className="text-xl font-display text-primary mb-2">
              {DIFFICULTY_CONFIG[difficulty].label} Mode
            </h2>
            <p className="text-muted-foreground">
              {DIFFICULTY_CONFIG[difficulty].description} to find hands
            </p>
          </div>

          <Button onClick={startGame} size="lg" className="gap-2">
            <Play className="w-5 h-5" />
            Start Game
          </Button>
          <Button variant="ghost" onClick={backToDifficulty}>
            Change Difficulty
          </Button>
        </div>
      )}

      {/* Grace Period State */}
      {gameState === 'grace-period' && (
        <>
          {/* Grace Period Timer */}
          <div className="flex items-center gap-4 sm:gap-8 mb-4">
            <div className="flex items-center gap-2 text-2xl font-display text-yellow-400">
              <Timer className="w-6 h-6" />
              Get Ready: {graceTimeLeft}s
            </div>
            <div className="text-lg font-display text-muted-foreground">
              Time: {formatTime(timeLeft)}
            </div>
            <div className="text-2xl font-display text-gradient">
              {score} <span className="text-muted-foreground text-lg">/ {maxScore}</span>
            </div>
            {onToggleMusic && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMusic}
                className="ml-auto"
              >
                {isMusicPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
            )}
          </div>

          {/* Grid and Hands side by side */}
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            {/* Grid */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-black/30 rounded-xl">
              {grid.map((card, index) => {
                const selectionOrder = getSelectionOrder(index);
                const isSelected = selectionOrder !== null;
                const canSelect = canSelectNext(index);
                
                return (
                  <div 
                    key={index}
                    className="relative"
                    onClick={() => handleCardClick(index)}
                  >
                    <CardDisplay
                      card={card}
                      size="md"
                      selected={isSelected}
                      disabled={!canSelect && !isSelected}
                    />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {selectionOrder}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Made Hands Panel */}
            <div className="w-full lg:w-48 p-3 bg-card/30 rounded-xl border border-border min-h-[200px]">
              <h3 className="text-sm font-display text-primary mb-2">Hands Made</h3>
              <p className="text-xs text-muted-foreground">Click a card to start the timer!</p>
            </div>
          </div>

          {/* Selection hint */}
          <p className="text-sm text-muted-foreground mt-4">
            Click a card to start the timer
          </p>
        </>
      )}

      {/* Playing State */}
      {gameState === 'playing' && (
        <>
          {/* Timer, Score, and Music Toggle */}
          <div className="flex items-center gap-4 sm:gap-8 mb-4">
            <div className={cn(
              "flex items-center gap-2 text-2xl font-display",
              timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-primary"
            )}>
              <Timer className="w-6 h-6" />
              {formatTime(timeLeft)}
            </div>
            <div className="text-2xl font-display text-gradient">
              {score} <span className="text-muted-foreground text-lg">/ {maxScore}</span>
            </div>
            {onToggleMusic && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMusic}
                className="ml-auto"
              >
                {isMusicPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
            )}
          </div>

          {/* Last Hand Feedback */}
          {lastHandResult && (
            <div className={cn(
              "mb-2 px-4 py-2 rounded-lg text-sm font-medium animate-scale-in",
              lastHandResult.isNew 
                ? "bg-green-500/20 text-green-400" 
                : "bg-red-500/20 text-red-400"
            )}>
              {lastHandResult.isNew 
                ? `${lastHandResult.result.name} +${getPokerBoggleScore(lastHandResult.result)}!` 
                : `${lastHandResult.result.name} (${getPokerBoggleScore(lastHandResult.result) === 0 ? 'no score' : 'already made'})`}
            </div>
          )}

          {/* Grid and Hands side by side */}
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            {/* Grid */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-black/30 rounded-xl">
              {grid.map((card, index) => {
                const selectionOrder = getSelectionOrder(index);
                const isSelected = selectionOrder !== null;
                const canSelect = canSelectNext(index);
                
                return (
                  <div 
                    key={index}
                    className="relative"
                    onClick={() => handleCardClick(index)}
                  >
                    <CardDisplay
                      card={card}
                      size="md"
                      selected={isSelected}
                      disabled={!canSelect && !isSelected}
                    />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {selectionOrder}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Made Hands Panel */}
            <div className="w-full lg:w-64 p-3 bg-card/30 rounded-xl border border-border min-h-[200px] max-h-[400px] overflow-y-auto">
              <h3 className="text-sm font-display text-primary mb-2">Hands Made ({madeHands.length})</h3>
              {madeHands.length === 0 ? (
                <p className="text-xs text-muted-foreground">No hands yet</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {[...madeHands].reverse().map((h, i) => (
                    <div 
                      key={i} 
                      className="flex flex-col gap-1 p-2 bg-background/30 rounded"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-foreground font-medium">{getHandDescription(h.hand, h.cards)}</span>
                        <span className="text-primary font-medium">+{getPokerBoggleScore(h.hand)}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {h.cards.map((card, cardIdx) => (
                          <CardDisplay key={cardIdx} card={card} size="sm" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selection hint */}
          <p className="text-sm text-muted-foreground mt-4">
            {selectedIndices.length === 0 
              ? "Click a card to start" 
              : `${selectedIndices.length}/5 cards selected`}
          </p>
        </>
      )}

      {/* Game Over State */}
      {gameState === 'game-over' && difficulty && (
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="text-center p-4 bg-card/80 backdrop-blur rounded-xl border border-border relative">
            {isPerfectWin ? (
              <>
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-primary/20 via-yellow-400/20 to-primary/20 rounded-xl blur-xl" />
                <h2 className="relative text-2xl font-display text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-primary mb-2 animate-pulse">
                  🎉 Congrats, you win! 🎉
                </h2>
              </>
            ) : (
              <h2 className="text-2xl font-display text-primary mb-2">Time's Up!</h2>
            )}
            {isNewHighScore && (
              <div className="flex items-center justify-center gap-2 mb-2 text-yellow-500">
                <Trophy className="w-5 h-5" />
                <span className="font-display">New High Score!</span>
                <Trophy className="w-5 h-5" />
              </div>
            )}
            <p className="text-4xl font-display text-gradient mb-1">
              {score} <span className="text-2xl text-muted-foreground">/ {maxScore}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {madeHands.length} hands made • {isPerfectWin ? 'Perfect ' : ''}{Math.round((score / maxScore) * 100)}% of max
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {DIFFICULTY_CONFIG[difficulty].label} Mode
            </p>
          </div>

          {/* Grid and Hands side by side - same as playing state */}
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            {/* Grid - disabled/dimmed */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-black/30 rounded-xl opacity-80">
              {grid.map((card, index) => (
                <div key={index} className="relative">
                  <CardDisplay
                    card={card}
                    size="md"
                    disabled={true}
                  />
                </div>
              ))}
            </div>

            {/* Made Hands Panel */}
            <div className="w-full lg:w-64 p-3 bg-card/30 rounded-xl border border-border min-h-[200px] max-h-[350px] overflow-y-auto">
              <h3 className="text-sm font-display text-primary mb-2">Hands Made ({madeHands.length})</h3>
              {madeHands.length === 0 ? (
                <p className="text-xs text-muted-foreground">No hands made</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {madeHands.map((h, i) => (
                    <div 
                      key={i} 
                      className="flex flex-col gap-1 p-2 bg-background/30 rounded"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-foreground font-medium">{getHandDescription(h.hand, h.cards)}</span>
                        <span className="text-primary font-medium">+{getPokerBoggleScore(h.hand)}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {h.cards.map((card, cardIdx) => (
                          <CardDisplay key={cardIdx} card={card} size="sm" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Unfound Hands Section */}
          {showUnfoundHands && (
            <div className="w-full max-w-lg p-4 bg-card/50 rounded-xl border border-border max-h-[250px] overflow-y-auto">
              <h3 className="text-sm font-display text-primary mb-2">
                Unfound Hands ({allPossibleHands.filter(h => !usedHandKeys.has(h.key)).length})
              </h3>
              <div className="flex flex-col gap-2">
                {allPossibleHands
                  .filter(h => !usedHandKeys.has(h.key))
                  .map((h, i) => (
                    <div 
                      key={i} 
                      className="flex flex-col gap-1 p-2 bg-background/30 rounded"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-foreground font-medium">{getHandDescription(h.hand, h.cards)}</span>
                        <span className="text-muted-foreground font-medium">+{getPokerBoggleScore(h.hand)}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {h.cards.map((card, cardIdx) => (
                          <CardDisplay key={cardIdx} card={card} size="sm" />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={retryLevel} size="lg" variant="outline" className="gap-2">
              <RotateCcw className="w-5 h-5" />
              Retry Level
            </Button>
            <Button onClick={startGame} size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              New Board
            </Button>
            <Button variant="outline" onClick={backToDifficulty}>
              Change Difficulty
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowUnfoundHands(!showUnfoundHands)}
            >
              {showUnfoundHands ? 'Hide' : 'Show'} Unfound Hands
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
