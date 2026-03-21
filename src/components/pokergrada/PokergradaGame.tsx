import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Card, 
  BoardLayout,
  Difficulty,
  generateRandomBoard, 
  createDeck, 
  shuffleDeck, 
  cardMeetsRequirement 
} from "@/data/pokergradaBoard";
import { BoardCell } from "./BoardCell";
import { CardDisplay } from "./CardDisplay";
import { evaluateBoard, HandResult } from "./handEvaluator";
import { ArrowLeft, RotateCcw, Layers, FastForward, Volume2, VolumeX, Snowflake } from "lucide-react";
import { Link } from "react-router-dom";
import { DifficultySelect, DIFFICULTY_CONFIG, saveHighScore } from "./DifficultySelect";
import { ScoringAnimation } from "./ScoringAnimation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface PokergradaGameProps {
  isMusicPlaying?: boolean;
  onToggleMusic?: () => void;
  initialDifficulty?: Difficulty;
  onBackToMenu?: () => void;
  onGameComplete?: (score: number) => void;
}

type GameState = 'select-difficulty' | 'playing' | 'scoring-animation' | 'game-over';

export const PokergradaGame = ({ isMusicPlaying, onToggleMusic, initialDifficulty, onBackToMenu, onGameComplete }: PokergradaGameProps) => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(initialDifficulty || null);
  const [startedFromHub, setStartedFromHub] = useState(!!initialDifficulty);
  const [boardLayout, setBoardLayout] = useState<BoardLayout | null>(null);
  const [board, setBoard] = useState<(Card | null)[][]>(() => 
    Array(5).fill(null).map(() => Array(5).fill(null))
  );
  const [deck, setDeck] = useState<Card[]>(() => shuffleDeck(createDeck()));
  const [drawnCards, setDrawnCards] = useState<[Card, Card] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<0 | 1 | null>(null);
  const [gameState, setGameState] = useState<GameState>('select-difficulty');
  const [cardsPlaced, setCardsPlaced] = useState(0);
  const [skipUsed, setSkipUsed] = useState(false);
  const [freezeUsed, setFreezeUsed] = useState(false);
  const [frozenCard, setFrozenCard] = useState<Card | null>(null);
  const [frozenCardSelected, setFrozenCardSelected] = useState(false);
  const [stuckEnding, setStuckEnding] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [scoringHighlight, setScoringHighlight] = useState<{ row: number | null; col: number | null }>({ row: null, col: null });
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showBonusCelebration, setShowBonusCelebration] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedCard = frozenCardSelected && frozenCard 
    ? frozenCard 
    : (selectedIndex !== null && drawnCards ? drawnCards[selectedIndex] : null);
  const hasInitialized = useRef(false);

  const boardComplete = cardsPlaced === 25;
  const BOARD_COMPLETE_BONUS = 100;

  // Auto-start game if initialDifficulty is provided
  useEffect(() => {
    if (initialDifficulty && !hasInitialized.current) {
      hasInitialized.current = true;
      setBoardLayout(generateRandomBoard(initialDifficulty));
      setGameState('playing');
    }
  }, [initialDifficulty]);

  const results = useMemo(() => {
    if (gameState === 'scoring-animation' || gameState === 'game-over') {
      const baseResults = evaluateBoard(board);
      // Add 100 point bonus for completing the board
      if (boardComplete) {
        return {
          ...baseResults,
          total: baseResults.total + BOARD_COMPLETE_BONUS
        };
      }
      return baseResults;
    }
    return null;
  }, [board, gameState, boardComplete]);

  const drawCards = useCallback(() => {
    if (deck.length >= 2) {
      const newDeck = [...deck];
      const card1 = newDeck.pop()!;
      const card2 = newDeck.pop()!;
      setDeck(newDeck);
      setDrawnCards([card1, card2]);
      setSelectedIndex(null);
    }
  }, [deck]);

  // Check if a card can be placed anywhere on the board
  const canPlaceCard = useCallback((card: Card) => {
    if (!boardLayout) return false;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (!board[row][col] && cardMeetsRequirement(card, boardLayout[row][col])) {
          return true;
        }
      }
    }
    return false;
  }, [board, boardLayout]);

  // Auto-draw on first render or after placing
  useMemo(() => {
    if (!drawnCards && deck.length >= 2 && gameState === 'playing') {
      const newDeck = [...deck];
      const card1 = newDeck.pop()!;
      const card2 = newDeck.pop()!;
      setDeck(newDeck);
      setDrawnCards([card1, card2]);
    }
  }, [drawnCards, deck.length, gameState]);

  // Check if game is stuck (neither card can be placed and skip is used, and no frozen card available)
  useMemo(() => {
    if (drawnCards && skipUsed && gameState === 'playing' && !frozenCard) {
      const canPlayCard1 = canPlaceCard(drawnCards[0]);
      const canPlayCard2 = canPlaceCard(drawnCards[1]);
      if (!canPlayCard1 && !canPlayCard2) {
        setStuckEnding(true);
        setGameState('scoring-animation');
      }
    }
  }, [drawnCards, skipUsed, gameState, canPlaceCard, frozenCard]);

  const handlePlace = useCallback((row: number, col: number) => {
    if (!selectedCard || board[row][col]) return;
    
    const requirement = boardLayout[row][col];
    if (!cardMeetsRequirement(selectedCard, requirement)) return;

    // Playing frozen card - discard both current drawn cards
    if (frozenCardSelected && frozenCard) {
      if (drawnCards) {
        // Only add non-duplicate cards to discard pile
        if (drawnCards[0] !== drawnCards[1]) {
          setDiscardPile(prev => [...prev, drawnCards[0], drawnCards[1]]);
        } else {
          setDiscardPile(prev => [...prev, drawnCards[0]]);
        }
        setDrawnCards(null);
      }
      setFrozenCard(null);
      setFrozenCardSelected(false);
    } else if (drawnCards) {
      // Normal play - add the unplayed card to discard pile
      // For single card mode (after freeze), only discard if different
      if (drawnCards[0] !== drawnCards[1]) {
        const unplayedCard = selectedIndex === 0 ? drawnCards[1] : drawnCards[0];
        setDiscardPile(prev => [...prev, unplayedCard]);
      }
      setDrawnCards(null);
    }

    const newBoard = board.map((r, ri) => 
      r.map((c, ci) => (ri === row && ci === col ? selectedCard : c))
    );
    setBoard(newBoard);
    setSelectedIndex(null);
    
    const newCardsPlaced = cardsPlaced + 1;
    setCardsPlaced(newCardsPlaced);
    
    if (newCardsPlaced === 25) {
      setShowBonusCelebration(true);
      setTimeout(() => {
        setShowBonusCelebration(false);
        setGameState('scoring-animation');
      }, 3000);
    }
  }, [selectedCard, drawnCards, selectedIndex, board, cardsPlaced, frozenCardSelected, frozenCard, boardLayout]);

  const handleFreeze = useCallback(() => {
    if (freezeUsed || !drawnCards || selectedIndex === null) return;
    
    // Freeze the selected card
    const cardToFreeze = drawnCards[selectedIndex];
    setFrozenCard(cardToFreeze);
    setFreezeUsed(true);
    
    // Keep the other card as the only playable card (duplicate to fit the type)
    const otherCard = selectedIndex === 0 ? drawnCards[1] : drawnCards[0];
    setDrawnCards([otherCard, otherCard]);
    setSelectedIndex(null);
  }, [freezeUsed, drawnCards, selectedIndex]);

  // Check if any card in the deck can be placed on any remaining spot
  const canAnyCardBePlaced = useCallback((deckToCheck: Card[]) => {
    if (!boardLayout) return false;
    for (const card of deckToCheck) {
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (!board[row][col] && cardMeetsRequirement(card, boardLayout[row][col])) {
            return true;
          }
        }
      }
    }
    return false;
  }, [board, boardLayout]);

  const handleSkip = useCallback(() => {
    if (skipUsed || !drawnCards) return;
    setSkipUsed(true);
    // Add both cards to discard pile
    setDiscardPile(prev => [...prev, drawnCards[0], drawnCards[1]]);
    setDrawnCards(null);
    setSelectedIndex(null);
    
    // Check if the game is unwinnable - no remaining cards can be placed
    if (deck.length === 0 || !canAnyCardBePlaced(deck)) {
      setStuckEnding(true);
      setGameState('scoring-animation');
    }
  }, [skipUsed, drawnCards, deck, canAnyCardBePlaced]);

  const startGame = useCallback((selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    setBoardLayout(generateRandomBoard(selectedDifficulty));
    setBoard(Array(5).fill(null).map(() => Array(5).fill(null)));
    setDeck(shuffleDeck(createDeck()));
    setDrawnCards(null);
    setSelectedIndex(null);
    setGameState('playing');
    setCardsPlaced(0);
    setSkipUsed(false);
    setFreezeUsed(false);
    setFrozenCard(null);
    setFrozenCardSelected(false);
    setStuckEnding(false);
    setIsNewHighScore(false);
    setDiscardPile([]);
    setScoringHighlight({ row: null, col: null });
  }, []);

  const resetGame = useCallback(() => {
    if (difficulty) {
      startGame(difficulty);
    }
  }, [difficulty, startGame]);

  const backToMenu = useCallback(() => {
    if (onBackToMenu) {
      onBackToMenu();
      return;
    }
    setGameState('select-difficulty');
    setDifficulty(null);
    setBoardLayout(null);
    setBoard(Array(5).fill(null).map(() => Array(5).fill(null)));
    setDeck(shuffleDeck(createDeck()));
    setDrawnCards(null);
    setSelectedIndex(null);
    setCardsPlaced(0);
    setSkipUsed(false);
    setFreezeUsed(false);
    setFrozenCard(null);
    setFrozenCardSelected(false);
    setStuckEnding(false);
    setDiscardPile([]);
    setScoringHighlight({ row: null, col: null });
  }, [onBackToMenu]);

  const handleScoringComplete = useCallback(() => {
    setGameState('game-over');
    setScoringHighlight({ row: null, col: null });
    if (results && difficulty) {
      onGameComplete?.(results.total);
      const isNew = saveHighScore(difficulty, results.total);
      if (isNew) {
        setIsNewHighScore(true);
      }
    }
  }, [results, difficulty, onGameComplete]);

  // Find a valid placement for a card
  const findValidPlacement = useCallback((card: Card): { row: number; col: number } | null => {
    if (!boardLayout) return null;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (!board[row][col] && cardMeetsRequirement(card, boardLayout[row][col])) {
          return { row, col };
        }
      }
    }
    return null;
  }, [board, boardLayout]);

  // Auto-play one step
  const autoPlayStep = useCallback(() => {
    if (!drawnCards || !boardLayout || gameState !== 'playing') {
      setIsAutoPlaying(false);
      return false;
    }

    // Try to place the first card, if not possible try the second
    const placement1 = findValidPlacement(drawnCards[0]);
    const placement2 = findValidPlacement(drawnCards[1]);

    let cardToPlace: Card | null = null;
    let placement: { row: number; col: number } | null = null;

    if (placement1) {
      cardToPlace = drawnCards[0];
      placement = placement1;
    } else if (placement2) {
      cardToPlace = drawnCards[1];
      placement = placement2;
    } else {
      // Neither card can be placed
      if (!skipUsed) {
        // Use skip
        setSkipUsed(true);
        setDiscardPile(prev => [...prev, drawnCards[0], drawnCards[1]]);
        setDrawnCards(null);
        setSelectedIndex(null);
        return true; // Continue auto-playing
      } else {
        // Game over - stuck
        setStuckEnding(true);
        setGameState('scoring-animation');
        setIsAutoPlaying(false);
        return false;
      }
    }

    if (cardToPlace && placement) {
      // Add the unplayed card to discard pile
      const unplayedCard = cardToPlace === drawnCards[0] ? drawnCards[1] : drawnCards[0];
      setDiscardPile(prev => [...prev, unplayedCard]);

      const newBoard = board.map((r, ri) => 
        r.map((c, ci) => (ri === placement!.row && ci === placement!.col ? cardToPlace : c))
      );
      setBoard(newBoard);
      setDrawnCards(null);
      setSelectedIndex(null);
      
      const newCardsPlaced = cardsPlaced + 1;
      setCardsPlaced(newCardsPlaced);
      
      if (newCardsPlaced === 25) {
        setShowBonusCelebration(true);
        setIsAutoPlaying(false);
        setTimeout(() => {
          setShowBonusCelebration(false);
          setGameState('scoring-animation');
        }, 3000);
        return false;
      }
      return true; // Continue auto-playing
    }

    return false;
  }, [drawnCards, boardLayout, board, gameState, skipUsed, cardsPlaced, findValidPlacement]);

  // Handle auto-play loop
  useEffect(() => {
    if (isAutoPlaying && drawnCards && gameState === 'playing') {
      autoPlayRef.current = setTimeout(() => {
        const shouldContinue = autoPlayStep();
        if (!shouldContinue) {
          setIsAutoPlaying(false);
        }
      }, 300); // 300ms delay between moves for visual feedback
    }

    return () => {
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, drawnCards, gameState, autoPlayStep]);

  const handleAutoFinish = useCallback(() => {
    setIsAutoPlaying(true);
  }, []);

  // Sort discard pile by rank (value)
  const sortedDiscardPile = useMemo(() => {
    return [...discardPile].sort((a, b) => a.value - b.value);
  }, [discardPile]);

  // Sort deck by rank (value) for viewing
  const sortedDeck = useMemo(() => {
    return [...deck].sort((a, b) => a.value - b.value);
  }, [deck]);

  const getScoreColor = (score: number) => {
    if (score >= 50) return 'text-yellow-400';
    if (score >= 20) return 'text-primary';
    if (score >= 10) return 'text-accent';
    if (score >= 2) return 'text-muted-foreground';
    return 'text-muted-foreground/50';
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center py-4 sm:py-8 px-2 sm:px-4 relative"
      style={{
        background: 'radial-gradient(ellipse at center, #1a472a 0%, #0d2818 50%, #071510 100%)',
      }}
    >
      {/* Felt texture overlay */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Difficulty Selection */}
      {gameState === 'select-difficulty' && (
        <div className="w-full max-w-2xl flex flex-col items-center">
          <DifficultySelect onSelect={startGame} />
        </div>
      )}

      {/* Game Header */}
      {gameState !== 'select-difficulty' && (
        <header className="w-full max-w-2xl flex items-center justify-between mb-4 sm:mb-6">
          <Button variant="ghost" size="sm" onClick={backToMenu} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Menu</span>
          </Button>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display text-gradient">
              POKERGRADA
            </h1>
            {difficulty && (
              <span className="text-xs text-white/60">{DIFFICULTY_CONFIG[difficulty].label}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onToggleMusic && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onToggleMusic}
                title={isMusicPlaying ? "Mute music" : "Unmute music"}
              >
                {isMusicPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={resetGame} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          </div>
        </header>
      )}

      {/* Scoring Animation */}
      {gameState === 'scoring-animation' && results && (
        <ScoringAnimation
          rows={results.rows}
          cols={results.cols}
          total={results.total}
          onComplete={handleScoringComplete}
          stuckEnding={stuckEnding}
          boardComplete={boardComplete}
          onHighlightChange={(row, col) => setScoringHighlight({ row, col })}
        />
      )}

      {/* Game Over */}
      {gameState === 'game-over' && results && (
        <div className="mb-4 sm:mb-6 text-center p-4 sm:p-6 bg-card/80 backdrop-blur rounded-xl border border-border animate-scale-in">
          <h2 className="text-xl sm:text-2xl font-display text-primary mb-2">Game Complete!</h2>
          {stuckEnding && (
            <p className="text-sm text-muted-foreground mb-2">
              Neither card could be played and your skip was used!
            </p>
          )}
          {/* Show the unplayable cards when stuck */}
          {stuckEnding && drawnCards && (
            <div className="flex flex-col items-center gap-2 mb-3">
              <p className="text-xs text-muted-foreground/70">Unplayable cards:</p>
              <div className="flex gap-3">
                <CardDisplay card={drawnCards[0]} size="md" disabled />
                <CardDisplay card={drawnCards[1]} size="md" disabled />
              </div>
            </div>
          )}
          <p className="text-3xl sm:text-4xl font-display text-gradient">
            Total Score: {results.total}
          </p>
          {isNewHighScore && (
            <p className="text-sm text-yellow-400 mt-2 flex items-center justify-center gap-1 animate-bounce-in">
              🏆 New High Score!
            </p>
          )}
        </div>
      )}

      {/* Board with row/col scores */}
      {gameState !== 'select-difficulty' && boardLayout && (
        <div className="flex gap-2 mb-4 sm:mb-6 relative">
          <div className="flex flex-col gap-1">
            {/* Board grid */}
            <div className="grid grid-cols-5 gap-1 sm:gap-2 p-2 sm:p-4 bg-black/30 rounded-xl relative">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <BoardCell
                    key={`${rowIndex}-${colIndex}`}
                    requirement={boardLayout[rowIndex][colIndex]}
                    placedCard={cell}
                    selectedCard={selectedCard}
                    onPlace={() => handlePlace(rowIndex, colIndex)}
                    disabled={gameState === 'game-over' || gameState === 'scoring-animation' || showBonusCelebration}
                    highlighted={scoringHighlight.row === rowIndex || scoringHighlight.col === colIndex}
                  />
                ))
              )}
              
              {/* Board Complete Bonus Celebration Overlay */}
              {showBonusCelebration && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl z-10 animate-fade-in">
                  <h2 className="text-3xl sm:text-5xl md:text-6xl font-display text-yellow-400 mb-4 animate-bounce-in text-center px-4"
                      style={{ textShadow: '0 0 20px rgba(250, 204, 21, 0.8), 0 0 40px rgba(250, 204, 21, 0.5)' }}>
                    🎉 BOARD COMPLETE! 🎉
                  </h2>
                  <div className="text-6xl sm:text-8xl md:text-9xl font-display text-yellow-400 animate-pulse"
                       style={{ textShadow: '0 0 30px rgba(250, 204, 21, 0.8), 0 0 60px rgba(250, 204, 21, 0.5)' }}>
                    +100
                  </div>
                  <p className="text-lg sm:text-xl text-white/80 mt-4 font-display">Completion Bonus!</p>
                </div>
              )}
            </div>
          
          {/* Column scores */}
          {results && (
            <div className="grid grid-cols-5 gap-1 sm:gap-2 px-2 sm:px-4">
              {results.cols.map((hand, i) => (
                <div key={i} className="text-center">
                  <span className={cn("text-xs sm:text-sm font-bold", getScoreColor(hand?.score || 0))}>
                    {hand?.score || 0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row scores */}
        {results && (
          <div className="flex flex-col gap-1 sm:gap-2 justify-center py-2 sm:py-4">
            {results.rows.map((hand, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-16 xs:h-20 sm:h-22 md:h-28 flex items-center",
                  "text-xs sm:text-sm font-bold",
                  getScoreColor(hand?.score || 0)
                )}
              >
                {hand?.score || 0}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Card Selection */}
      {gameState === 'playing' && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm sm:text-base text-muted-foreground">
            {frozenCardSelected && frozenCard
              ? "Tap a valid cell to place the frozen card"
              : drawnCards 
                ? selectedCard 
                  ? "Tap a valid cell to place the card" 
                  : "Select a card to play"
                : frozenCard
                  ? "Tap the frozen card to play it"
                  : "Drawing cards..."}
          </p>
          
          <div className="flex flex-col items-center gap-3">
            {/* Drawn cards */}
            {drawnCards && (
              <div className="flex gap-4 sm:gap-6">
                {/* Only show both cards if they're different (not the single card after freeze) */}
                {drawnCards[0] !== drawnCards[1] ? (
                  <>
                    <CardDisplay
                      card={drawnCards[0]}
                      selected={selectedIndex === 0 && !frozenCardSelected}
                      onClick={() => {
                        setFrozenCardSelected(false);
                        setSelectedIndex(0);
                      }}
                      size="lg"
                    />
                    <CardDisplay
                      card={drawnCards[1]}
                      selected={selectedIndex === 1 && !frozenCardSelected}
                      onClick={() => {
                        setFrozenCardSelected(false);
                        setSelectedIndex(1);
                      }}
                      size="lg"
                    />
                  </>
                ) : (
                  <CardDisplay
                    card={drawnCards[0]}
                    selected={selectedIndex === 0 && !frozenCardSelected}
                    onClick={() => {
                      setFrozenCardSelected(false);
                      setSelectedIndex(0);
                    }}
                    size="lg"
                  />
                )}
              </div>
            )}
            
            {/* Show frozen card when no drawn cards */}
            {!drawnCards && frozenCard && (
              <div className="text-center">
                <p className="text-xs text-cyan-400 mb-2">Frozen Card Available</p>
                <CardDisplay
                  card={frozenCard}
                  selected={frozenCardSelected}
                  onClick={() => setFrozenCardSelected(true)}
                  size="lg"
                  className="ring-2 ring-cyan-400"
                />
              </div>
            )}
            
            {/* Freeze Box */}
            {!freezeUsed && (
              <button
                onClick={handleFreeze}
                disabled={!drawnCards || selectedIndex === null || isAutoPlaying}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed transition-all",
                  drawnCards && selectedIndex !== null && !isAutoPlaying
                    ? "border-cyan-400 bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20 cursor-pointer"
                    : "border-muted-foreground/30 text-muted-foreground/50 cursor-not-allowed"
                )}
              >
                <Snowflake className="w-4 h-4" />
                <span className="text-xs font-medium">Freeze Card (1x)</span>
              </button>
            )}
            
            {/* Show frozen card indicator when there are drawn cards */}
            {frozenCard && drawnCards && (
              <div 
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer",
                  frozenCardSelected 
                    ? "border-cyan-400 bg-cyan-400/20" 
                    : "border-cyan-400/50 bg-cyan-400/10 hover:bg-cyan-400/15"
                )}
                onClick={() => {
                  setFrozenCardSelected(!frozenCardSelected);
                  if (!frozenCardSelected) setSelectedIndex(null);
                }}
              >
                <Snowflake className="w-4 h-4 text-cyan-400" />
                <CardDisplay card={frozenCard} size="sm" selected={frozenCardSelected} />
                <span className="text-xs text-cyan-400">Frozen</span>
              </div>
            )}
            
            <div className="flex gap-2">
              {!skipUsed && drawnCards && drawnCards[0] !== drawnCards[1] && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSkip}
                  className="text-xs"
                  disabled={isAutoPlaying}
                >
                  Skip (1x)
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAutoFinish}
                className="text-xs gap-1"
                disabled={isAutoPlaying}
              >
                <FastForward className="w-3 h-3" />
                {isAutoPlaying ? "Playing..." : "Finish for me"}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground/70">
            <span>Cards placed: {cardsPlaced}/25</span>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
                  <Layers className="w-3 h-3" />
                  Deck ({deck.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Remaining Cards</DialogTitle>
                </DialogHeader>
                {sortedDeck.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Deck is empty</p>
                ) : (
                  <div className="flex flex-wrap gap-2 justify-center py-2">
                    {sortedDeck.map((card, i) => (
                      <CardDisplay key={i} card={card} size="sm" disabled />
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
                  <Layers className="w-3 h-3" />
                  Discards ({discardPile.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Discard Pile</DialogTitle>
                </DialogHeader>
                {sortedDiscardPile.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No cards discarded yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2 justify-center py-2">
                    {sortedDiscardPile.map((card, i) => (
                      <CardDisplay key={i} card={card} size="sm" disabled />
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {/* Scoring Legend */}
      <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-card/50 rounded-xl border border-border max-w-md w-full">
        <h3 className="text-sm sm:text-base font-display text-primary mb-2">Scoring</h3>
        <div className="grid grid-cols-2 gap-1 text-xs sm:text-sm text-muted-foreground">
          <span>Royal Flush: 200</span>
          <span>Straight Flush: 100</span>
          <span>Four of a Kind: 75</span>
          <span>Full House: 50</span>
          <span>Flush: 40</span>
          <span>Straight: 30</span>
          <span>Three of a Kind: 20</span>
          <span>Two Pair: 10</span>
          <span>One Pair: 5</span>
          <span>Ace High: 2</span>
        </div>
      </div>
    </div>
  );
};
