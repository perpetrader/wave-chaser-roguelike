import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DuckCell, DuckColor } from "./DuckCell";
import { RotateCcw, Trophy, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Home, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { Difficulty, DIFFICULTY_CONFIG, saveHighScore, getHighScores } from "./DifficultySelect";

const DRAG_THRESHOLD = 30;

type Grid = DuckColor[][];

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startRow: number;
  startCol: number;
}

const ALL_COLORS: Exclude<DuckColor, "rainbow">[] = ["yellow", "pink", "purple", "blue", "green"];

const createRandomGrid = (difficulty: Difficulty): Grid => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const { gridSize, colors: colorCount, rainbowCount } = config;
  
  const colorsToUse = ALL_COLORS.slice(0, colorCount);
  const allDucks: DuckColor[] = [];
  
  if (difficulty === "beginner") {
    // 3x3 with 2 colors: 6 of one color, 3 of the other (one row of 3 each)
    allDucks.push(...Array(6).fill(colorsToUse[0]));
    allDucks.push(...Array(3).fill(colorsToUse[1]));
  } else {
    // Standard distribution: gridSize of each color
    colorsToUse.forEach(color => {
      for (let i = 0; i < gridSize; i++) {
        allDucks.push(color);
      }
    });
    
    // Replace some with rainbow ducks
    if (rainbowCount > 0) {
      // Remove one of each color and replace with rainbows
      for (let i = 0; i < rainbowCount; i++) {
        const colorToRemove = colorsToUse[i % colorsToUse.length];
        const idx = allDucks.indexOf(colorToRemove);
        if (idx !== -1) {
          allDucks[idx] = "rainbow";
        }
      }
    }
  }

  // Shuffle
  for (let i = allDucks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allDucks[i], allDucks[j]] = [allDucks[j], allDucks[i]];
  }

  const grid: Grid = [];
  for (let row = 0; row < gridSize; row++) {
    grid.push(allDucks.slice(row * gridSize, (row + 1) * gridSize));
  }

  return grid;
};

const checkWin = (grid: Grid, difficulty: Difficulty): boolean => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const gridSize = config.gridSize;
  
  for (let row = 0; row < gridSize; row++) {
    const rowColors = grid[row];
    const nonRainbowColors = rowColors.filter(c => c !== "rainbow");
    
    if (nonRainbowColors.length === 0) {
      // All rainbows - counts as valid
      continue;
    }
    
    const targetColor = nonRainbowColors[0];
    const allMatch = nonRainbowColors.every(c => c === targetColor);
    
    if (!allMatch) {
      return false;
    }
  }
  return true;
};

const slideRowLeft = (grid: Grid, rowIndex: number): Grid => {
  const newGrid = grid.map(row => [...row]);
  const row = newGrid[rowIndex];
  const first = row.shift()!;
  row.push(first);
  return newGrid;
};

const slideRowRight = (grid: Grid, rowIndex: number): Grid => {
  const newGrid = grid.map(row => [...row]);
  const row = newGrid[rowIndex];
  const last = row.pop()!;
  row.unshift(last);
  return newGrid;
};

const slideColumnUp = (grid: Grid, colIndex: number, gridSize: number): Grid => {
  const newGrid = grid.map(row => [...row]);
  const first = newGrid[0][colIndex];
  for (let row = 0; row < gridSize - 1; row++) {
    newGrid[row][colIndex] = newGrid[row + 1][colIndex];
  }
  newGrid[gridSize - 1][colIndex] = first;
  return newGrid;
};

const slideColumnDown = (grid: Grid, colIndex: number, gridSize: number): Grid => {
  const newGrid = grid.map(row => [...row]);
  const last = newGrid[gridSize - 1][colIndex];
  for (let row = gridSize - 1; row > 0; row--) {
    newGrid[row][colIndex] = newGrid[row - 1][colIndex];
  }
  newGrid[0][colIndex] = last;
  return newGrid;
};

interface DucksGameProps {
  difficulty: Difficulty;
  onBackToMenu: () => void;
  isMusicPlaying?: boolean;
  onToggleMusic?: () => void;
}

export const DucksGame = ({ difficulty, onBackToMenu, isMusicPlaying, onToggleMusic }: DucksGameProps) => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const gridSize = config.gridSize;
  
  const [grid, setGrid] = useState<Grid>(() => createRandomGrid(difficulty));
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(() => getHighScores()[difficulty]);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  
  const dragState = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startRow: 0,
    startCol: 0,
  });

  const applyMove = useCallback((newGrid: Grid) => {
    setGrid(newGrid);
    setMoves(prev => prev + 1);

    if (checkWin(newGrid, difficulty)) {
      setIsWon(true);
      const newMoves = moves + 1;
      const isNewBest = saveHighScore(difficulty, newMoves);
      if (isNewBest) {
        setBestScore(newMoves);
        toast.success("New best score! 🎉");
      } else {
        toast.success("You solved it! 🦆");
      }
    }
  }, [moves, difficulty]);

  const handleMove = useCallback((action: () => Grid) => {
    if (isWon) return;
    applyMove(action());
  }, [isWon, applyMove]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, row: number, col: number) => {
    if (isWon) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragState.current = {
      isDragging: true,
      startX: clientX,
      startY: clientY,
      startRow: row,
      startCol: col,
    };
  };

  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragState.current.isDragging || isWon) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragState.current.startX;
    const deltaY = clientY - dragState.current.startY;
    
    if (Math.abs(deltaX) >= DRAG_THRESHOLD || Math.abs(deltaY) >= DRAG_THRESHOLD) {
      const { startRow, startCol } = dragState.current;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          applyMove(slideRowRight(grid, startRow));
        } else {
          applyMove(slideRowLeft(grid, startRow));
        }
      } else {
        if (deltaY > 0) {
          applyMove(slideColumnDown(grid, startCol, gridSize));
        } else {
          applyMove(slideColumnUp(grid, startCol, gridSize));
        }
      }
      
      dragState.current = {
        isDragging: false,
        startX: 0,
        startY: 0,
        startRow: 0,
        startCol: 0,
      };
    }
  }, [grid, isWon, applyMove, gridSize]);

  const handleDragEnd = () => {
    dragState.current.isDragging = false;
  };

  const resetGame = () => {
    setGrid(createRandomGrid(difficulty));
    setMoves(0);
    setIsWon(false);
  };

  const indices = Array.from({ length: gridSize }, (_, i) => i);

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-4">
      {/* Header */}
      <header className="text-center mb-6 w-full">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onBackToMenu}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Difficulty
          </button>
          {onToggleMusic && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleMusic}
              className="bg-card/50 border-border hover:bg-card/80"
              title={isMusicPlaying ? "Mute music" : "Unmute music"}
            >
              {isMusicPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-gradient mb-2">
          DUCKS IN A ROW
        </h1>
        <p className="text-muted-foreground text-sm">
          {config.label} Mode — Drag rows & columns!
        </p>
      </header>

      {/* Stats */}
      <div className="flex gap-6 mb-6 p-4 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Moves</p>
          <p className="text-2xl font-display text-primary">{moves}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Best</p>
          <p className="text-2xl font-display text-secondary">
            {bestScore ?? "—"}
          </p>
        </div>
      </div>

      {/* Win Message */}
      {isWon && (
        <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-win/20 to-primary/20 border border-win/50 text-center animate-bounce-in">
          <Trophy className="w-12 h-12 mx-auto mb-2 text-win" />
          <h2 className="text-2xl font-display text-win mb-2">SOLVED!</h2>
          <p className="text-muted-foreground">
            Completed in <span className="text-primary font-bold">{moves}</span> moves
          </p>
        </div>
      )}

      {/* Game Grid with Controls */}
      <div className="relative mb-6">
        {/* Column Up Arrows */}
        <div className="flex justify-center gap-0 mb-1 sm:mb-2 ml-8 sm:ml-10">
          {indices.map(col => (
            <button
              key={`up-${col}`}
              onClick={() => handleMove(() => slideColumnUp(grid, col, gridSize))}
              onMouseEnter={() => setHoveredCol(col)}
              onMouseLeave={() => setHoveredCol(null)}
              disabled={isWon}
              className="w-10 h-6 xs:w-11 xs:h-7 sm:w-12 sm:h-8 md:w-14 md:h-8 flex items-center justify-center text-muted-foreground hover:text-primary active:text-primary transition-colors disabled:opacity-50 touch-manipulation"
            >
              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ))}
        </div>

        <div className="flex items-center">
          {/* Row Left Arrows */}
          <div className="flex flex-col gap-0 mr-1 sm:mr-2">
            {indices.map(row => (
              <button
                key={`left-${row}`}
                onClick={() => handleMove(() => slideRowLeft(grid, row))}
                onMouseEnter={() => setHoveredRow(row)}
                onMouseLeave={() => setHoveredRow(null)}
                disabled={isWon}
                className="w-6 h-10 xs:h-11 sm:w-8 sm:h-12 md:h-14 flex items-center justify-center text-muted-foreground hover:text-primary active:text-primary transition-colors disabled:opacity-50 touch-manipulation"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            ))}
          </div>

          {/* Grid */}
          <div 
            className={`grid gap-0.5 sm:gap-1 p-2 sm:p-3 rounded-2xl bg-card/80 border border-border select-none cursor-grab active:cursor-grabbing touch-none`}
            style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            {grid.map((row, rowIndex) =>
              row.map((color, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onMouseDown={(e) => handleDragStart(e, rowIndex, colIndex)}
                  onTouchStart={(e) => handleDragStart(e, rowIndex, colIndex)}
                >
                  <DuckCell
                    color={color}
                    isHighlighted={hoveredRow === rowIndex || hoveredCol === colIndex}
                  />
                </div>
              ))
            )}
          </div>

          {/* Row Right Arrows */}
          <div className="flex flex-col gap-0 ml-1 sm:ml-2">
            {indices.map(row => (
              <button
                key={`right-${row}`}
                onClick={() => handleMove(() => slideRowRight(grid, row))}
                onMouseEnter={() => setHoveredRow(row)}
                onMouseLeave={() => setHoveredRow(null)}
                disabled={isWon}
                className="w-6 h-10 xs:h-11 sm:w-8 sm:h-12 md:h-14 flex items-center justify-center text-muted-foreground hover:text-primary active:text-primary transition-colors disabled:opacity-50 touch-manipulation"
              >
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Column Down Arrows */}
        <div className="flex justify-center gap-0 mt-1 sm:mt-2 ml-8 sm:ml-10">
          {indices.map(col => (
            <button
              key={`down-${col}`}
              onClick={() => handleMove(() => slideColumnDown(grid, col, gridSize))}
              onMouseEnter={() => setHoveredCol(col)}
              onMouseLeave={() => setHoveredCol(null)}
              disabled={isWon}
              className="w-10 h-6 xs:w-11 xs:h-7 sm:w-12 sm:h-8 md:w-14 md:h-8 flex items-center justify-center text-muted-foreground hover:text-primary active:text-primary transition-colors disabled:opacity-50 touch-manipulation"
            >
              <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={onBackToMenu}
          variant="outline"
          className="font-display"
        >
          <Home className="w-4 h-4 mr-2" />
          Menu
        </Button>
        <Button
          onClick={resetGame}
          variant="outline"
          className="font-display"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          New Puzzle
        </Button>
      </div>
    </div>
  );
};
