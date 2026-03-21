import { useState, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, ChevronDown, Volume2, VolumeX } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DifficultySelect } from "./DifficultySelect";
import { FriendCard } from "./FriendCard";
import { GridCell } from "./GridCell";
import { SuperpowerCard } from "./SuperpowerCard";
import { VictoryCelebration } from "./VictoryCelebration";
import {
  Difficulty,
  DIFFICULTY_CONFIG,
  Friend,
  FRIENDS,
  GridCell as GridCellType,
  PlacedFriend,
  SUPERPOWERS,
  Superpower,
} from "./types";

interface NovadokuGameProps {
  isMusicPlaying?: boolean;
  onToggleMusic?: () => void;
}

type GameState = "difficulty-select" | "playing" | "won";

// Shuffle array utility
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Card groups for selection
const CARD_GROUPS = {
  onePower: ["dc", "jazzy", "mopheous", "spike"],
  ramp: ["spike", "volata"],
  buff: ["spike", "volata", "charger", "fil", "dynamo", "mopheous", "flash", "jazzy"],
  redistribute: ["sizzle", "overheater"],
};

// Select 5 random friends based on group rules
const selectRandomFriends = (): Friend[] => {
  const selected: Friend[] = [];
  const selectedIds = new Set<string>();
  
  const pickFromGroup = (groupIds: string[]): Friend | null => {
    const available = groupIds.filter(id => !selectedIds.has(id));
    if (available.length === 0) return null;
    const shuffled = shuffleArray(available);
    const pickedId = shuffled[0];
    const friend = FRIENDS.find(f => f.id === pickedId);
    if (friend) {
      selectedIds.add(pickedId);
      return friend;
    }
    return null;
  };
  
  // Choice 1: one from ramp OR redistribute
  const choice1Pool = [...CARD_GROUPS.ramp, ...CARD_GROUPS.redistribute];
  const choice1 = pickFromGroup(choice1Pool);
  if (choice1) selected.push(choice1);
  
  // Choice 2 & 3: two from buff
  const choice2 = pickFromGroup(CARD_GROUPS.buff);
  if (choice2) selected.push(choice2);
  const choice3 = pickFromGroup(CARD_GROUPS.buff);
  if (choice3) selected.push(choice3);
  
  // Choice 4: one from 1power OR redistribute
  const choice4Pool = [...CARD_GROUPS.onePower, ...CARD_GROUPS.redistribute];
  const choice4 = pickFromGroup(choice4Pool);
  if (choice4) selected.push(choice4);
  
  // Choice 5: if no 1power card selected, pick from 1power; otherwise pick from buff
  const hasOnePower = selected.some(f => CARD_GROUPS.onePower.includes(f.id));
  const choice5Pool = hasOnePower ? CARD_GROUPS.buff : CARD_GROUPS.onePower;
  const choice5 = pickFromGroup(choice5Pool);
  if (choice5) selected.push(choice5);
  
  // Fallback: if we somehow have less than 5, fill from any remaining friends
  if (selected.length < 5) {
    const remainingFriends = FRIENDS.filter(f => !selectedIds.has(f.id));
    const shuffledRemaining = shuffleArray(remainingFriends);
    while (selected.length < 5 && shuffledRemaining.length > 0) {
      selected.push(shuffledRemaining.shift()!);
    }
  }
  
  return selected;
};

// Ability queue item types
type AbilityQueueItem = 
  | { type: "overheater"; overheaterIndex: number; excessPower: number }
  | { type: "sizzle"; sizzleIndex: number }
  | { type: "mopheous"; targetIndex: number }
  | { type: "fil"; filIndex: number; targetIndex: number }
  | { type: "flash"; flashIndex: number };

export const NovadokuGame = ({ isMusicPlaying, onToggleMusic }: NovadokuGameProps) => {
  const [gameState, setGameState] = useState<GameState>("difficulty-select");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [grid, setGrid] = useState<GridCellType[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [selectedSuperpower, setSelectedSuperpower] = useState<Superpower | null>(null);
  const [friendCooldowns, setFriendCooldowns] = useState<Record<string, number>>({});
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [pendingRechargeIndex, setPendingRechargeIndex] = useState<number | null>(null);
  const [superpowerCooldowns, setSuperpowerCooldowns] = useState<Record<string, number>>({});
  const [availableFriends, setAvailableFriends] = useState<Friend[]>([]);
  const [pendingVolataBoost, setPendingVolataBoost] = useState<boolean>(false);
  const [volataDialogOpen, setVolataDialogOpen] = useState<boolean>(false);
  const [pendingRemovalIndex, setPendingRemovalIndex] = useState<number | null>(null);
  const [removalConfirmOpen, setRemovalConfirmOpen] = useState<boolean>(false);
  const [removalPopupPosition, setRemovalPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [powerBoostCells, setPowerBoostCells] = useState<Set<number>>(new Set());
  const [targetNumbers, setTargetNumbers] = useState<number[]>([]);
  const [pendingMopheousBoost, setPendingMopheousBoost] = useState<boolean>(false);
  const [mopheousDialogOpen, setMopheousDialogOpen] = useState<boolean>(false);
  const [pendingMopheousIndex, setPendingMopheousIndex] = useState<number | null>(null);
  const [pendingSizzleDrain, setPendingSizzleDrain] = useState<boolean>(false);
  const [sizzlePlacedIndex, setSizzlePlacedIndex] = useState<number | null>(null);
  const [doubleAUsed, setDoubleAUsed] = useState<boolean>(false);
  const [doubleADialogOpen, setDoubleADialogOpen] = useState<boolean>(false);
  const [pendingDoubleAIndex, setPendingDoubleAIndex] = useState<number | null>(null);
  const [pendingOverheaterBoost, setPendingOverheaterBoost] = useState<{ overheaterIndex: number; excessPower: number } | null>(null);
  const [filDialogOpen, setFilDialogOpen] = useState<boolean>(false);
  const [pendingFilBoostIndex, setPendingFilBoostIndex] = useState<number | null>(null);
  const [filPlacedIndex, setFilPlacedIndex] = useState<number | null>(null);
  const [flashDialogOpen, setFlashDialogOpen] = useState<boolean>(false);
  const [pendingFlashIndex, setPendingFlashIndex] = useState<number | null>(null);
  
  // Ability queue for handling multiple abilities in sequence
  const [abilityQueue, setAbilityQueue] = useState<AbilityQueueItem[]>([]);
  
  // Drag-and-drop state
  const [isDraggingFriend, setIsDraggingFriend] = useState(false);
  
  const gridRef = useRef<HTMLDivElement>(null);

  const { rows, cols } = DIFFICULTY_CONFIG[difficulty];
  const totalCells = rows * cols;
  const maxPower = totalCells;
  
  // Helper to clamp power between 1 and grid size
  const clampPower = useCallback((power: number) => Math.max(1, Math.min(maxPower, power)), [maxPower]);

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    const config = DIFFICULTY_CONFIG[diff];
    const totalGridCells = config.rows * config.cols;
    
    // Generate target numbers for impossible mode
    let targets: number[] = [];
    if (config.hasTargetNumbers) {
      const allPowers = Array.from({ length: totalGridCells }, (_, i) => i + 1);
      targets = shuffleArray(allPowers);
    }
    setTargetNumbers(targets);
    
    // Initialize grid with locked cells if applicable
    let initialGrid: GridCellType[] = new Array(totalGridCells).fill(null);
    
    if (config.lockedCells && config.lockedCells > 0) {
      // Pick random cell indices, excluding middle cell for 3x3 grids
      let availableIndices = Array.from({ length: totalGridCells }, (_, i) => i);
      if (config.rows === 3 && config.cols === 3) {
        // Exclude center cell (index 4) for 3x3 grids
        availableIndices = availableIndices.filter(i => i !== 4);
      }
      // For impossible mode, exclude cells with target numbers 1, 2, or 3
      if (config.hasTargetNumbers && targets.length > 0) {
        availableIndices = availableIndices.filter(i => targets[i] > 3);
      }
      const shuffledIndices = shuffleArray(availableIndices);
      const lockedIndices = shuffledIndices.slice(0, config.lockedCells);
      
      // Create a placeholder "locked" friend for display
      const lockedFriend: Friend = {
        id: "locked",
        name: "Locked",
        image: "",
        basePower: 0,
        ability: "none",
        abilityDescription: "",
      };
      
      // Place locked cells - for impossible mode, use the target number
      lockedIndices.forEach((cellIndex) => {
        const lockedPower = config.hasTargetNumbers ? targets[cellIndex] : 0;
        // For non-impossible modes, pick random powers
        initialGrid[cellIndex] = {
          friend: lockedFriend,
          currentPower: lockedPower,
          locked: true,
        };
      });
      
      // For non-impossible locked modes, assign random non-duplicate powers
      if (!config.hasTargetNumbers) {
        const allPowers = Array.from({ length: totalGridCells }, (_, i) => i + 1);
        const shuffledPowers = shuffleArray(allPowers);
        let powerIdx = 0;
        lockedIndices.forEach((cellIndex) => {
          initialGrid[cellIndex] = {
            friend: lockedFriend,
            currentPower: shuffledPowers[powerIdx++],
            locked: true,
          };
        });
      }
    }
    
    // For Expert mode, pick 7 random cells for +5 power boost
    // For impossible-4x4, pick 7 random cells from those with target 7-16
    let boostCells = new Set<number>();
    if (diff === "expert") {
      const emptyIndices = initialGrid
        .map((cell, idx) => cell === null ? idx : -1)
        .filter(idx => idx !== -1);
      const shuffledEmpty = shuffleArray(emptyIndices);
      boostCells = new Set(shuffledEmpty.slice(0, 7));
    } else if (diff === "impossible-4x4" || diff === "locked-impossible-4x4") {
      // Only cells with target number 7-16 are eligible for +5 boost
      const eligibleIndices = targets
        .map((target, idx) => (target >= 7 && initialGrid[idx] === null) ? idx : -1)
        .filter(idx => idx !== -1);
      const shuffledEligible = shuffleArray(eligibleIndices);
      boostCells = new Set(shuffledEligible.slice(0, 7));
    }
    setPowerBoostCells(boostCells);
    
    setGrid(initialGrid);
    setSelectedFriend(null);
    setSelectedSuperpower(null);
    setFriendCooldowns({});
    setSuperpowerCooldowns({});
    setPendingMopheousBoost(false);
    setMopheousDialogOpen(false);
    setPendingMopheousIndex(null);
    setDoubleAUsed(false);
    setDoubleADialogOpen(false);
    setPendingDoubleAIndex(null);
    
    // Beginner uses fixed 4 friends, Easy uses 5 fixed, other difficulties get 8 random
    if (diff === "beginner" || diff === "locked-beginner") {
      const beginnerFriends = FRIENDS.filter((f) =>
        ["dynamo", "flash", "dc", "fil"].includes(f.id)
      );
      setAvailableFriends(beginnerFriends);
    } else if (diff === "easy" || diff === "locked-easy") {
      const easyFriends = FRIENDS.filter((f) =>
        ["spike", "dc", "flash", "fil", "dynamo"].includes(f.id)
      );
      setAvailableFriends(easyFriends);
    } else {
      setAvailableFriends(selectRandomFriends());
    }
    setGameState("playing");
  }, []);

  const resetGame = useCallback(() => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const totalGridCells = config.rows * config.cols;
    
    // Generate target numbers for impossible mode
    let targets: number[] = [];
    if (config.hasTargetNumbers) {
      const allPowers = Array.from({ length: totalGridCells }, (_, i) => i + 1);
      targets = shuffleArray(allPowers);
    }
    setTargetNumbers(targets);
    
    // Initialize grid with locked cells if applicable
    let initialGrid: GridCellType[] = new Array(totalGridCells).fill(null);
    
    if (config.lockedCells && config.lockedCells > 0) {
      // Pick random cell indices, excluding middle cell for 3x3 grids
      let availableIndices = Array.from({ length: totalGridCells }, (_, i) => i);
      if (config.rows === 3 && config.cols === 3) {
        // Exclude center cell (index 4) for 3x3 grids
        availableIndices = availableIndices.filter(i => i !== 4);
      }
      // For impossible mode, exclude cells with target numbers 1, 2, or 3
      if (config.hasTargetNumbers && targets.length > 0) {
        availableIndices = availableIndices.filter(i => targets[i] > 3);
      }
      const shuffledIndices = shuffleArray(availableIndices);
      const lockedIndices = shuffledIndices.slice(0, config.lockedCells);
      
      const lockedFriend: Friend = {
        id: "locked",
        name: "Locked",
        image: "",
        basePower: 0,
        ability: "none",
        abilityDescription: "",
      };
      
      // Place locked cells - for impossible mode, use the target number
      lockedIndices.forEach((cellIndex) => {
        const lockedPower = config.hasTargetNumbers ? targets[cellIndex] : 0;
        initialGrid[cellIndex] = {
          friend: lockedFriend,
          currentPower: lockedPower,
          locked: true,
        };
      });
      
      // For non-impossible locked modes, assign random non-duplicate powers
      if (!config.hasTargetNumbers) {
        const allPowers = Array.from({ length: totalGridCells }, (_, i) => i + 1);
        const shuffledPowers = shuffleArray(allPowers);
        let powerIdx = 0;
        lockedIndices.forEach((cellIndex) => {
          initialGrid[cellIndex] = {
            friend: lockedFriend,
            currentPower: shuffledPowers[powerIdx++],
            locked: true,
          };
        });
      }
    }
    
    // For Expert mode, pick 7 random cells for +5 power boost
    // For impossible-4x4, pick 7 random cells from those with target 7-16
    let boostCells = new Set<number>();
    if (difficulty === "expert") {
      const emptyIndices = initialGrid
        .map((cell, idx) => cell === null ? idx : -1)
        .filter(idx => idx !== -1);
      const shuffledEmpty = shuffleArray(emptyIndices);
      boostCells = new Set(shuffledEmpty.slice(0, 7));
    } else if (difficulty === "impossible-4x4" || difficulty === "locked-impossible-4x4") {
      // Only cells with target number 7-16 are eligible for +5 boost
      const eligibleIndices = targets
        .map((target, idx) => (target >= 7 && initialGrid[idx] === null) ? idx : -1)
        .filter(idx => idx !== -1);
      const shuffledEligible = shuffleArray(eligibleIndices);
      boostCells = new Set(shuffledEligible.slice(0, 7));
    }
    setPowerBoostCells(boostCells);
    
    setGrid(initialGrid);
    setSelectedFriend(null);
    setSelectedSuperpower(null);
    setFriendCooldowns({});
    setSuperpowerCooldowns({});
    setPendingVolataBoost(false);
    setVolataDialogOpen(false);
    setPendingMopheousBoost(false);
    setMopheousDialogOpen(false);
    setPendingMopheousIndex(null);
    setDoubleAUsed(false);
    setDoubleADialogOpen(false);
    setPendingDoubleAIndex(null);
    
    // Re-randomize friends on full reset
    if (difficulty === "beginner" || difficulty === "locked-beginner") {
      const beginnerFriends = FRIENDS.filter((f) =>
        ["dynamo", "flash", "dc", "fil"].includes(f.id)
      );
      setAvailableFriends(beginnerFriends);
    } else if (difficulty === "easy" || difficulty === "locked-easy") {
      const easyFriends = FRIENDS.filter((f) =>
        ["spike", "dc", "flash", "fil", "dynamo"].includes(f.id)
      );
      setAvailableFriends(easyFriends);
    } else {
      setAvailableFriends(selectRandomFriends());
    }
    setGameState("playing");
  }, [totalCells, difficulty]);

  // Reset game but keep the same friend cards
  const resetGameSameSetup = useCallback(() => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const totalGridCells = config.rows * config.cols;
    
    // Generate target numbers for impossible mode
    let targets: number[] = [];
    if (config.hasTargetNumbers) {
      const allPowers = Array.from({ length: totalGridCells }, (_, i) => i + 1);
      targets = shuffleArray(allPowers);
    }
    setTargetNumbers(targets);
    
    // Initialize grid with locked cells if applicable
    let initialGrid: GridCellType[] = new Array(totalGridCells).fill(null);
    
    if (config.lockedCells && config.lockedCells > 0) {
      let availableIndices = Array.from({ length: totalGridCells }, (_, i) => i);
      if (config.rows === 3 && config.cols === 3) {
        availableIndices = availableIndices.filter(i => i !== 4);
      }
      if (config.hasTargetNumbers && targets.length > 0) {
        availableIndices = availableIndices.filter(i => targets[i] > 3);
      }
      const shuffledIndices = shuffleArray(availableIndices);
      const lockedIndices = shuffledIndices.slice(0, config.lockedCells);
      
      const lockedFriend: Friend = {
        id: "locked",
        name: "Locked",
        image: "",
        basePower: 0,
        ability: "none",
        abilityDescription: "",
      };
      
      lockedIndices.forEach((cellIndex) => {
        const lockedPower = config.hasTargetNumbers ? targets[cellIndex] : 0;
        initialGrid[cellIndex] = {
          friend: lockedFriend,
          currentPower: lockedPower,
          locked: true,
        };
      });
      
      if (!config.hasTargetNumbers) {
        const allPowers = Array.from({ length: totalGridCells }, (_, i) => i + 1);
        const shuffledPowers = shuffleArray(allPowers);
        let powerIdx = 0;
        lockedIndices.forEach((cellIndex) => {
          initialGrid[cellIndex] = {
            friend: lockedFriend,
            currentPower: shuffledPowers[powerIdx++],
            locked: true,
          };
        });
      }
    }
    
    // For Expert mode, pick 7 random cells for +5 power boost
    // For impossible-4x4, pick 7 random cells from those with target 7-16
    let boostCells = new Set<number>();
    if (difficulty === "expert") {
      const emptyIndices = initialGrid
        .map((cell, idx) => cell === null ? idx : -1)
        .filter(idx => idx !== -1);
      const shuffledEmpty = shuffleArray(emptyIndices);
      boostCells = new Set(shuffledEmpty.slice(0, 7));
    } else if (difficulty === "impossible-4x4" || difficulty === "locked-impossible-4x4") {
      // Only cells with target number 7-16 are eligible for +5 boost
      const eligibleIndices = targets
        .map((target, idx) => (target >= 7 && initialGrid[idx] === null) ? idx : -1)
        .filter(idx => idx !== -1);
      const shuffledEligible = shuffleArray(eligibleIndices);
      boostCells = new Set(shuffledEligible.slice(0, 7));
    }
    setPowerBoostCells(boostCells);
    
    setGrid(initialGrid);
    setSelectedFriend(null);
    setSelectedSuperpower(null);
    setFriendCooldowns({});
    setSuperpowerCooldowns({});
    setPendingVolataBoost(false);
    setVolataDialogOpen(false);
    setPendingMopheousBoost(false);
    setMopheousDialogOpen(false);
    setPendingMopheousIndex(null);
    setDoubleAUsed(false);
    setDoubleADialogOpen(false);
    setPendingDoubleAIndex(null);
    
    // Keep the same availableFriends - don't re-randomize
    setGameState("playing");
  }, [totalCells, difficulty]);

  const backToMenu = useCallback(() => {
    setGameState("difficulty-select");
    setSelectedFriend(null);
  }, []);

  const getNeighborIndices = useCallback(
    (index: number): number[] => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const neighbors: number[] = [];

      // Only orthogonal neighbors: up, down, left, right (no diagonals)
      const directions = [
        [-1, 0], // up
        [1, 0],  // down
        [0, -1], // left
        [0, 1],  // right
      ];

      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
          neighbors.push(newRow * cols + newCol);
        }
      }
      return neighbors;
    },
    [rows, cols]
  );

  const getRowColIndices = useCallback(
    (index: number): number[] => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const indices: number[] = [];

      // All cells in the same row
      for (let c = 0; c < cols; c++) {
        const idx = row * cols + c;
        if (idx !== index) indices.push(idx);
      }
      // All cells in the same column
      for (let r = 0; r < rows; r++) {
        const idx = r * cols + col;
        if (idx !== index && !indices.includes(idx)) indices.push(idx);
      }
      return indices;
    },
    [rows, cols]
  );

  const getRowIndices = useCallback(
    (index: number): number[] => {
      const row = Math.floor(index / cols);
      const indices: number[] = [];
      for (let c = 0; c < cols; c++) {
        const idx = row * cols + c;
        if (idx !== index) indices.push(idx);
      }
      return indices;
    },
    [cols]
  );

  const applyAbilities = useCallback(
    (newGrid: GridCellType[], placedIndex: number): GridCellType[] => {
      const placedFriend = newGrid[placedIndex];
      if (!placedFriend) return newGrid;

      // Helper to check if cell can be modified (not locked)
      const canModify = (cell: GridCellType) => 
        cell && !cell.locked;

      // Apply Spike's ability: +1 to all Spikes when any friend is played
      newGrid = newGrid.map((cell, idx) => {
        if (cell && !cell.locked && cell.friend.ability === "growth" && idx !== placedIndex) {
          return { ...cell, currentPower: clampPower(cell.currentPower + 1) };
        }
        return cell;
      });

      // Fil's ability is now handled via dialog - no automatic boost here
      // The boost is triggered in handleCellClick after placement

      // Apply Charger's ability: +1 to adjacent friends (above, below, left, right)
      if (placedFriend.friend.ability === "adjacent-boost") {
        const neighbors = getNeighborIndices(placedIndex);
        newGrid = newGrid.map((cell, idx) => {
          if (canModify(cell) && neighbors.includes(idx)) {
            return { ...cell, currentPower: clampPower(cell.currentPower + 1) };
          }
          return cell;
        });
      }

      // Apply Dynamo's ability: +1 to friends next to it (left and right)
      if (placedFriend.friend.ability === "side-boost") {
        const col = placedIndex % cols;
        const leftIndex = col > 0 ? placedIndex - 1 : -1;
        const rightIndex = col < cols - 1 ? placedIndex + 1 : -1;
        [leftIndex, rightIndex].forEach(idx => {
          if (idx !== -1 && canModify(newGrid[idx])) {
            newGrid[idx] = { ...newGrid[idx]!, currentPower: clampPower(newGrid[idx]!.currentPower + 1) };
          }
        });
      }

      // Sizzle's ability is now handled via dialog - no automatic drain here

      // Overheater's cap is now handled after placement - we just track excess here
      // The actual redistribution happens via dialog in handleCellClick

      // Final clamp pass to ensure all powers are within bounds (skip locked cells)
      newGrid = newGrid.map((cell) => {
        if (cell && !cell.locked) {
          return { ...cell, currentPower: clampPower(cell.currentPower) };
        }
        return cell;
      });

      return newGrid;
    },
    [getNeighborIndices, getRowColIndices, clampPower, maxPower, cols]
  );

  const tickCooldowns = useCallback(() => {
    // Tick superpower cooldowns
    setSuperpowerCooldowns((prev) => {
      const updated: Record<string, number> = {};
      for (const [id, cd] of Object.entries(prev)) {
        if (cd > 1) updated[id] = cd - 1;
      }
      return updated;
    });
    // Tick friend cooldowns
    setFriendCooldowns((prev) => {
      const updated: Record<string, number> = {};
      for (const [id, cd] of Object.entries(prev)) {
        if (cd > 1) updated[id] = cd - 1;
      }
      return updated;
    });
  }, []);

  const checkWinCondition = useCallback((gridToCheck: GridCellType[]) => {
    const allFilled = gridToCheck.every((cell) => cell !== null);
    if (allFilled) {
      const powers = gridToCheck.map((cell) => cell!.currentPower);
      const config = DIFFICULTY_CONFIG[difficulty];
      
      // For impossible mode, check if each cell matches its target
      if (config.hasTargetNumbers && targetNumbers.length > 0) {
        const allMatch = powers.every((power, idx) => power === targetNumbers[idx]);
        if (allMatch) {
          setGameState("won");
        }
      } else {
        // Regular mode: check for unique powers in range
        const uniquePowers = new Set(powers);
        const hasAllUnique = uniquePowers.size === totalCells;
        const hasCorrectRange = powers.every((p) => p >= 1 && p <= maxPower);

        if (hasAllUnique && hasCorrectRange) {
          setGameState("won");
        }
      }
    }
  }, [totalCells, maxPower, difficulty, targetNumbers]);

  // Process the next ability in the queue
  const processNextAbility = useCallback(() => {
    if (abilityQueue.length === 0) {
      // Queue is empty, check win condition
      setGrid((current) => {
        checkWinCondition(current);
        return current;
      });
      return;
    }
    
    const [nextAbility, ...remaining] = abilityQueue;
    setAbilityQueue(remaining);
    
    switch (nextAbility.type) {
      case "overheater":
        setPendingOverheaterBoost({ overheaterIndex: nextAbility.overheaterIndex, excessPower: nextAbility.excessPower });
        break;
      case "sizzle":
        setSizzlePlacedIndex(nextAbility.sizzleIndex);
        setPendingSizzleDrain(true);
        break;
      case "mopheous":
        setPendingMopheousIndex(nextAbility.targetIndex);
        setMopheousDialogOpen(true);
        break;
      case "fil":
        setFilPlacedIndex(nextAbility.filIndex);
        setPendingFilBoostIndex(nextAbility.targetIndex);
        setFilDialogOpen(true);
        break;
      case "flash":
        setPendingFlashIndex(nextAbility.flashIndex);
        setFlashDialogOpen(true);
        break;
    }
  }, [abilityQueue, checkWinCondition]);

  const handleCellClick = useCallback(
    (index: number) => {
      if (gameState !== "playing") return;

      const currentCell = grid[index];
      
      // Locked cells cannot be interacted with
      if (currentCell?.locked) return;

      // If Overheater boost is pending, handle the pick
      if (pendingOverheaterBoost) {
        if (currentCell && !currentCell.locked && index !== pendingOverheaterBoost.overheaterIndex) {
          // Apply the excess power to the picked friend and cap Overheater at 4
          setGrid((prev) => {
            const newGrid = [...prev];
            const targetCell = newGrid[index];
            const overheaterCell = newGrid[pendingOverheaterBoost.overheaterIndex];
            
            if (targetCell && !targetCell.locked) {
              newGrid[index] = { ...targetCell, currentPower: clampPower(targetCell.currentPower + pendingOverheaterBoost.excessPower) };
            }
            // Cap Overheater at 4
            if (overheaterCell && !overheaterCell.locked) {
              newGrid[pendingOverheaterBoost.overheaterIndex] = { ...overheaterCell, currentPower: Math.min(4, maxPower) };
            }
            return newGrid;
          });
          setPendingOverheaterBoost(null);
          // Process next ability in queue
          setTimeout(() => processNextAbility(), 0);
        }
        return;
      }

      // If Sizzle drain is pending, handle the pick (must be same row or column)
      if (pendingSizzleDrain && sizzlePlacedIndex !== null) {
        const sizzleRow = Math.floor(sizzlePlacedIndex / cols);
        const sizzleCol = sizzlePlacedIndex % cols;
        const targetRow = Math.floor(index / cols);
        const targetCol = index % cols;
        const isSameRowOrCol = targetRow === sizzleRow || targetCol === sizzleCol;
        
        if (currentCell && !currentCell.locked && currentCell.currentPower > 1 && index !== sizzlePlacedIndex && isSameRowOrCol) {
          // Apply the -1 drain to the picked friend and +1 to Sizzle
          setGrid((prev) => {
            const newGrid = [...prev];
            const targetCell = newGrid[index];
            if (targetCell && !targetCell.locked) {
              newGrid[index] = { ...targetCell, currentPower: clampPower(targetCell.currentPower - 1) };
            }
            // Give Sizzle +1 power
            if (sizzlePlacedIndex !== null && newGrid[sizzlePlacedIndex]) {
              const sizzleCell = newGrid[sizzlePlacedIndex]!;
              newGrid[sizzlePlacedIndex] = { ...sizzleCell, currentPower: clampPower(sizzleCell.currentPower + 1) };
            }
            return newGrid;
          });
          setPendingSizzleDrain(false);
          setSizzlePlacedIndex(null);
          // Process next ability in queue
          setTimeout(() => processNextAbility(), 0);
        }
        return;
      }

      // If Volata boost is pending, handle the pick
      if (pendingVolataBoost) {
        if (currentCell && !currentCell.locked) {
          // Apply the +2 boost to the picked friend
          setGrid((prev) => {
            const newGrid = [...prev];
            const targetCell = newGrid[index];
            if (targetCell && !targetCell.locked) {
              newGrid[index] = { ...targetCell, currentPower: clampPower(targetCell.currentPower + 2) };
            }
            return newGrid;
          });
          setPendingVolataBoost(false);
          // Check for Overheater overflow, then process queue
          setTimeout(() => {
            setGrid((current) => {
              const { hasPendingPick, cappedGrid } = checkOverheaterAfterSuperpower(current);
              if (cappedGrid) {
                if (hasPendingPick) {
                  return cappedGrid; // Overheater pick pending
                }
                // Capped but no pick needed, process next ability
                setTimeout(() => processNextAbility(), 0);
                return cappedGrid;
              }
              processNextAbility();
              return current;
            });
          }, 0);
        }
        return;
      }

      // If superpower is selected, apply it to occupied cell
      if (selectedSuperpower) {
        if (!currentCell) return; // Superpowers only work on placed friends
        if (currentCell.locked) return; // Can't use superpowers on locked cells

      if (selectedSuperpower.id === "recharge") {
          // Open dialog to choose power boost amount
          setPendingRechargeIndex(index);
          setRechargeDialogOpen(true);
        } else if (selectedSuperpower.id === "double-a") {
          // Open dialog to confirm doubling
          setPendingDoubleAIndex(index);
          setDoubleADialogOpen(true);
        }
        return;
      }

      // If cell is occupied and no superpower, prompt removal (if allowed)
      if (currentCell) {
        const canRemove = DIFFICULTY_CONFIG[difficulty].canRemove;
        if (canRemove && !currentCell.locked) {
          // Calculate position for popup
          if (gridRef.current) {
            const gridCells = gridRef.current.querySelectorAll('[data-grid-cell]');
            const cellElement = gridCells[index] as HTMLElement;
            if (cellElement) {
              const rect = cellElement.getBoundingClientRect();
              setRemovalPopupPosition({
                x: rect.left + rect.width / 2,
                y: rect.top,
              });
            }
          }
          setPendingRemovalIndex(index);
          setRemovalConfirmOpen(true);
        }
        return;
      }

      // If no friend selected, do nothing
      if (!selectedFriend) return;

      // Place the friend
      let newGrid = [...grid];
      
      // Calculate power with boost
      let finalPower = selectedFriend.basePower;
      
      if (powerBoostCells.has(index)) {
        // Apply +5 boost - Overheater will redistribute excess via ability queue
        finalPower = selectedFriend.basePower + 5;
      }
      
      const placedFriend: PlacedFriend = {
        friend: selectedFriend,
        currentPower: clampPower(finalPower),
      };
      newGrid[index] = placedFriend;

      // Tick existing cooldowns first, then set cooldown for this friend
      tickCooldowns();
      // Mopheous has 2-move cooldown, Jazzy has 2, Flash has 2, others have 1
      const friendCooldown = selectedFriend.ability === "cooldown-reduce" ? 2 
        : selectedFriend.ability === "mentor" ? 2 
        : selectedFriend.ability === "self-boost" ? 2
        : 1;
      setFriendCooldowns((prev) => ({
        ...prev,
        [selectedFriend.id]: friendCooldown,
      }));
      setSelectedFriend(null);

      // Apply Jazzy's ability: reduce superpower cooldowns by 1
      if (selectedFriend.ability === "cooldown-reduce") {
        setSuperpowerCooldowns((prev) => {
          const updated: Record<string, number> = {};
          for (const [id, cd] of Object.entries(prev)) {
            if (cd > 1) updated[id] = cd - 1;
          }
          return updated;
        });
      }

      // If Mopheous was just placed, set pending boost for next friend
      if (selectedFriend.ability === "mentor") {
        setPendingMopheousBoost(true);
      }

      // Apply abilities
      newGrid = applyAbilities(newGrid, index);

      setGrid(newGrid);

      // Build ability queue - collect all abilities that need to trigger
      const newQueue: AbilityQueueItem[] = [];
      
      // Check if any Overheater has power above 4 and needs to redistribute
      const overheaterCap = Math.min(4, maxPower);
      const overheaterWithExcess = newGrid.findIndex((cell) => 
        cell && !cell.locked && cell.friend.ability === "cap" && cell.currentPower > overheaterCap
      );
      
      if (overheaterWithExcess !== -1) {
        const overheaterCell = newGrid[overheaterWithExcess]!;
        const excessPower = overheaterCell.currentPower - overheaterCap;
        // Check if there are other friends to give power to
        const otherFriends = newGrid.filter((cell, idx) => 
          cell && !cell.locked && idx !== overheaterWithExcess
        );
        if (otherFriends.length > 0 && excessPower > 0) {
          newQueue.push({ type: "overheater", overheaterIndex: overheaterWithExcess, excessPower });
        } else {
          // No other friends, just cap it
          newGrid[overheaterWithExcess] = { ...overheaterCell, currentPower: overheaterCap };
          setGrid([...newGrid]);
        }
      }

      // If Sizzle was just placed, check if there are friends in same row/column to drain
      if (selectedFriend.ability === "drain") {
        const sizzleRow = Math.floor(index / cols);
        const sizzleCol = index % cols;
        const eligibleFriends = newGrid.filter((cell, idx) => {
          if (!cell || cell.locked || idx === index || cell.currentPower <= 1) return false;
          const cellRow = Math.floor(idx / cols);
          const cellCol = idx % cols;
          return cellRow === sizzleRow || cellCol === sizzleCol;
        });
        if (eligibleFriends.length > 0) {
          newQueue.push({ type: "sizzle", sizzleIndex: index });
        }
      }

      // If there's a pending Mopheous boost and this isn't Mopheous, queue it
      if (pendingMopheousBoost && selectedFriend.ability !== "mentor") {
        newQueue.push({ type: "mopheous", targetIndex: index });
        setPendingMopheousBoost(false); // Clear the pending boost flag
      }

      // If Fil was just placed, check if there's a friend to the right
      if (selectedFriend.ability === "boost-right") {
        const col = index % cols;
        const rightIndex = col < cols - 1 ? index + 1 : -1;
        if (rightIndex !== -1 && newGrid[rightIndex] && !newGrid[rightIndex]!.locked) {
          newQueue.push({ type: "fil", filIndex: index, targetIndex: rightIndex });
        }
      }

      // If Flash was just placed, queue its self-boost ability
      if (selectedFriend.ability === "self-boost") {
        newQueue.push({ type: "flash", flashIndex: index });
      }

      // If there are abilities to process, set the queue and process the first one
      if (newQueue.length > 0) {
        // Set remaining queue items (after the first one)
        setAbilityQueue(newQueue.slice(1));
        // Process the first ability immediately
        const firstAbility = newQueue[0];
        switch (firstAbility.type) {
          case "overheater":
            setPendingOverheaterBoost({ overheaterIndex: firstAbility.overheaterIndex, excessPower: firstAbility.excessPower });
            break;
          case "sizzle":
            setSizzlePlacedIndex(firstAbility.sizzleIndex);
            setPendingSizzleDrain(true);
            break;
          case "mopheous":
            setPendingMopheousIndex(firstAbility.targetIndex);
            setMopheousDialogOpen(true);
            break;
          case "fil":
            setFilPlacedIndex(firstAbility.filIndex);
            setPendingFilBoostIndex(firstAbility.targetIndex);
            setFilDialogOpen(true);
            break;
          case "flash":
            setPendingFlashIndex(firstAbility.flashIndex);
            setFlashDialogOpen(true);
            break;
        }
        return;
      }

      // No abilities to queue, check win condition
      checkWinCondition(newGrid);
    },
    [gameState, grid, selectedFriend, selectedSuperpower, pendingVolataBoost, pendingSizzleDrain, pendingOverheaterBoost, pendingMopheousBoost, applyAbilities, tickCooldowns, checkWinCondition, powerBoostCells, clampPower, maxPower, difficulty, targetNumbers, cols, processNextAbility]
  );

  // Handle placing a friend directly (used for drag-and-drop)
  const handleDropFriend = useCallback(
    (index: number, friend: Friend) => {
      if (gameState !== "playing") return;
      
      const currentCell = grid[index];
      
      // Can only drop on empty, non-locked cells
      if (currentCell || currentCell?.locked) return;
      
      // Can't drop if there are pending actions
      if (pendingVolataBoost || pendingSizzleDrain || pendingOverheaterBoost) return;
      
      // Check if friend is on cooldown
      if (friendCooldowns[friend.id] && friendCooldowns[friend.id] > 0) return;
      
      // Place the friend
      let newGrid = [...grid];
      
      // Calculate power with boost
      let finalPower = friend.basePower;
      
      if (powerBoostCells.has(index)) {
        finalPower = friend.basePower + 5;
      }
      
      const placedFriend: PlacedFriend = {
        friend: friend,
        currentPower: clampPower(finalPower),
      };
      newGrid[index] = placedFriend;

      // Tick existing cooldowns first, then set cooldown for this friend
      tickCooldowns();
      const friendCooldown = friend.ability === "cooldown-reduce" ? 2 
        : friend.ability === "mentor" ? 2 
        : friend.ability === "self-boost" ? 2
        : 1;
      setFriendCooldowns((prev) => ({
        ...prev,
        [friend.id]: friendCooldown,
      }));
      setSelectedFriend(null);

      // Apply Jazzy's ability: reduce superpower cooldowns by 1
      if (friend.ability === "cooldown-reduce") {
        setSuperpowerCooldowns((prev) => {
          const updated: Record<string, number> = {};
          for (const [id, cd] of Object.entries(prev)) {
            if (cd > 1) updated[id] = cd - 1;
          }
          return updated;
        });
      }

      // If Mopheous was just placed, set pending boost for next friend
      if (friend.ability === "mentor") {
        setPendingMopheousBoost(true);
      }

      // Apply abilities
      newGrid = applyAbilities(newGrid, index);

      setGrid(newGrid);

      // Build ability queue - collect all abilities that need to trigger
      const newQueue: AbilityQueueItem[] = [];
      
      // Check if any Overheater has power above 4 and needs to redistribute
      const overheaterCap = Math.min(4, maxPower);
      const overheaterWithExcess = newGrid.findIndex((cell) => 
        cell && !cell.locked && cell.friend.ability === "cap" && cell.currentPower > overheaterCap
      );
      
      if (overheaterWithExcess !== -1) {
        const overheaterCell = newGrid[overheaterWithExcess]!;
        const excessPower = overheaterCell.currentPower - overheaterCap;
        const otherFriends = newGrid.filter((cell, idx) => 
          cell && !cell.locked && idx !== overheaterWithExcess
        );
        if (otherFriends.length > 0 && excessPower > 0) {
          newQueue.push({ type: "overheater", overheaterIndex: overheaterWithExcess, excessPower });
        } else {
          newGrid[overheaterWithExcess] = { ...overheaterCell, currentPower: overheaterCap };
          setGrid([...newGrid]);
        }
      }

      // If Sizzle was just placed, check if there are friends in same row/column to drain
      if (friend.ability === "drain") {
        const sizzleRow = Math.floor(index / cols);
        const sizzleCol = index % cols;
        const eligibleFriends = newGrid.filter((cell, idx) => {
          if (!cell || cell.locked || idx === index || cell.currentPower <= 1) return false;
          const cellRow = Math.floor(idx / cols);
          const cellCol = idx % cols;
          return cellRow === sizzleRow || cellCol === sizzleCol;
        });
        if (eligibleFriends.length > 0) {
          newQueue.push({ type: "sizzle", sizzleIndex: index });
        }
      }

      // If there's a pending Mopheous boost and this isn't Mopheous, queue it
      if (pendingMopheousBoost && friend.ability !== "mentor") {
        newQueue.push({ type: "mopheous", targetIndex: index });
        setPendingMopheousBoost(false);
      }

      // If Fil was just placed, check if there's a friend to the right
      if (friend.ability === "boost-right") {
        const col = index % cols;
        const rightIndex = col < cols - 1 ? index + 1 : -1;
        if (rightIndex !== -1 && newGrid[rightIndex] && !newGrid[rightIndex]!.locked) {
          newQueue.push({ type: "fil", filIndex: index, targetIndex: rightIndex });
        }
      }

      // If Flash was just placed, queue its self-boost ability
      if (friend.ability === "self-boost") {
        newQueue.push({ type: "flash", flashIndex: index });
      }

      // If there are abilities to process, set the queue and process the first one
      if (newQueue.length > 0) {
        setAbilityQueue(newQueue.slice(1));
        const firstAbility = newQueue[0];
        switch (firstAbility.type) {
          case "overheater":
            setPendingOverheaterBoost({ overheaterIndex: firstAbility.overheaterIndex, excessPower: firstAbility.excessPower });
            break;
          case "sizzle":
            setSizzlePlacedIndex(firstAbility.sizzleIndex);
            setPendingSizzleDrain(true);
            break;
          case "mopheous":
            setPendingMopheousIndex(firstAbility.targetIndex);
            setMopheousDialogOpen(true);
            break;
          case "fil":
            setFilPlacedIndex(firstAbility.filIndex);
            setPendingFilBoostIndex(firstAbility.targetIndex);
            setFilDialogOpen(true);
            break;
          case "flash":
            setPendingFlashIndex(firstAbility.flashIndex);
            setFlashDialogOpen(true);
            break;
        }
        return;
      }

      // No abilities to queue, check win condition
      checkWinCondition(newGrid);
    },
    [gameState, grid, friendCooldowns, pendingVolataBoost, pendingSizzleDrain, pendingOverheaterBoost, pendingMopheousBoost, applyAbilities, tickCooldowns, checkWinCondition, powerBoostCells, clampPower, maxPower, cols]
  );

  // Helper to check and handle Overheater overflow after superpowers
  // Returns: { hasPendingPick: boolean, cappedGrid: GridCellType[] | null }
  const checkOverheaterAfterSuperpower = useCallback((gridToCheck: GridCellType[]): { hasPendingPick: boolean; cappedGrid: GridCellType[] | null } => {
    const overheaterCap = Math.min(4, maxPower);
    const overheaterWithExcess = gridToCheck.findIndex((cell) => 
      cell && !cell.locked && cell.friend.ability === "cap" && cell.currentPower > overheaterCap
    );
    
    if (overheaterWithExcess !== -1) {
      const overheaterCell = gridToCheck[overheaterWithExcess]!;
      const excessPower = overheaterCell.currentPower - overheaterCap;
      const otherFriends = gridToCheck.filter((cell, idx) => 
        cell && !cell.locked && idx !== overheaterWithExcess
      );
      
      // Create capped grid
      const cappedGrid = [...gridToCheck];
      cappedGrid[overheaterWithExcess] = { ...overheaterCell, currentPower: overheaterCap };
      
      if (otherFriends.length > 0 && excessPower > 0) {
        // There are other friends to give excess power to
        setPendingOverheaterBoost({ overheaterIndex: overheaterWithExcess, excessPower });
        return { hasPendingPick: true, cappedGrid };
      } else {
        // No other friends, just cap it
        return { hasPendingPick: false, cappedGrid };
      }
    }
    return { hasPendingPick: false, cappedGrid: null }; // No Overheater overflow
  }, [maxPower]);

  const applyRecharge = useCallback((boostAmount: number) => {
    if (pendingRechargeIndex === null) return;
    
    const currentCell = grid[pendingRechargeIndex];
    if (!currentCell) return;
    
    let updatedGrid: GridCellType[] = [];
    let hasVolataOnBoard = false;
    
    setGrid((prev) => {
      let newGrid = [...prev];
      newGrid[pendingRechargeIndex] = {
        ...currentCell,
        currentPower: clampPower(currentCell.currentPower + boostAmount),
      };
      
      // Check if Volata is on the board (for pick mechanic)
      hasVolataOnBoard = newGrid.some(
        (cell) => cell && cell.friend.ability === "pick-superpower-boost"
      );
      
      updatedGrid = newGrid;
      return newGrid;
    });
    
    // Difficulty-based cooldown: beginner=0, easy=1, medium/locked-medium=2, hard=3, expert=3
    const cooldownByDifficulty: Record<Difficulty, number> = {
      beginner: 0,
      easy: 1,
      medium: 2,
      hard: 3,
      expert: 3,
      "impossible-3x3": 3,
      "impossible-4x4": 3,
      "locked-beginner": 0,
      "locked-easy": 1,
      "locked-medium": 2,
      "locked-hard": 3,
      "locked-expert": 3,
      "locked-impossible-3x3": 3,
      "locked-impossible-4x4": 3,
    };
    const cooldown = cooldownByDifficulty[difficulty];
    if (cooldown > 0) {
      setSuperpowerCooldowns((prev) => ({
        ...prev,
        recharge: cooldown,
      }));
    }
    
    setSelectedSuperpower(null);
    setRechargeDialogOpen(false);
    setPendingRechargeIndex(null);
    
    // If Volata is on the board, show the dialog first
    if (hasVolataOnBoard) {
      setVolataDialogOpen(true);
      return; // Don't check win yet - wait for Volata pick
    }
    
    // Check for Overheater overflow
    setTimeout(() => {
      setGrid((current) => {
        const { hasPendingPick, cappedGrid } = checkOverheaterAfterSuperpower(current);
        if (cappedGrid) {
          if (hasPendingPick) {
            return cappedGrid; // Overheater pick pending
          }
          // Capped but no pick needed, check win with capped grid
          checkWinCondition(cappedGrid);
          return cappedGrid;
        }
        checkWinCondition(current);
        return current;
      });
    }, 0);
  }, [pendingRechargeIndex, grid, difficulty, checkWinCondition, clampPower, checkOverheaterAfterSuperpower]);

  const applyDoubleA = useCallback(() => {
    if (pendingDoubleAIndex === null) return;
    
    const currentCell = grid[pendingDoubleAIndex];
    if (!currentCell) return;
    
    let updatedGrid: GridCellType[] = [];
    let hasVolataOnBoard = false;
    
    setGrid((prev) => {
      let newGrid = [...prev];
      newGrid[pendingDoubleAIndex] = {
        ...currentCell,
        currentPower: clampPower(currentCell.currentPower * 2),
      };
      
      // Check if Volata is on the board (for pick mechanic)
      hasVolataOnBoard = newGrid.some(
        (cell) => cell && cell.friend.ability === "pick-superpower-boost"
      );
      
      updatedGrid = newGrid;
      return newGrid;
    });
    
    // Mark Double A as used (one-time use)
    setDoubleAUsed(true);
    
    setSelectedSuperpower(null);
    setDoubleADialogOpen(false);
    setPendingDoubleAIndex(null);
    
    // If Volata is on the board, show the dialog first
    if (hasVolataOnBoard) {
      setVolataDialogOpen(true);
      return; // Don't check win yet - wait for Volata pick
    }
    
    // Check for Overheater overflow
    setTimeout(() => {
      setGrid((current) => {
        const { hasPendingPick, cappedGrid } = checkOverheaterAfterSuperpower(current);
        if (cappedGrid) {
          if (hasPendingPick) {
            return cappedGrid; // Overheater pick pending
          }
          // Capped but no pick needed, check win with capped grid
          checkWinCondition(cappedGrid);
          return cappedGrid;
        }
        checkWinCondition(current);
        return current;
      });
    }, 0);
  }, [pendingDoubleAIndex, grid, difficulty, clampPower, checkWinCondition, checkOverheaterAfterSuperpower]);

  const confirmRemoval = useCallback(() => {
    if (pendingRemovalIndex === null) return;
    
    setGrid((prev) => {
      const newGrid = [...prev];
      newGrid[pendingRemovalIndex] = null;
      return newGrid;
    });
    
    setRemovalConfirmOpen(false);
    setPendingRemovalIndex(null);
    setRemovalPopupPosition(null);
  }, [pendingRemovalIndex]);

  const cancelRemoval = useCallback(() => {
    setRemovalConfirmOpen(false);
    setPendingRemovalIndex(null);
    setRemovalPopupPosition(null);
  }, []);

  const applyMopheousBoost = useCallback((boostAmount: number) => {
    if (pendingMopheousIndex === null) return;
    
    setGrid((prev) => {
      const newGrid = [...prev];
      const targetCell = newGrid[pendingMopheousIndex];
      if (targetCell && !targetCell.locked) {
        newGrid[pendingMopheousIndex] = {
          ...targetCell,
          currentPower: clampPower(targetCell.currentPower + boostAmount),
        };
      }
      return newGrid;
    });
    
    setMopheousDialogOpen(false);
    setPendingMopheousIndex(null);
    
    // Check for Overheater overflow after Mopheous boost, then process next ability
    setTimeout(() => {
      setGrid((current) => {
        const { hasPendingPick, cappedGrid } = checkOverheaterAfterSuperpower(current);
        if (cappedGrid) {
          if (hasPendingPick) {
            return cappedGrid; // Overheater pick pending - will process queue after
          }
          // Capped but no pick needed, process next ability
          setTimeout(() => processNextAbility(), 0);
          return cappedGrid;
        }
        processNextAbility();
        return current;
      });
    }, 0);
  }, [pendingMopheousIndex, clampPower, processNextAbility, checkOverheaterAfterSuperpower]);

  const applyFilBoost = useCallback((boostAmount: number) => {
    if (pendingFilBoostIndex === null) return;
    
    setGrid((prev) => {
      const newGrid = [...prev];
      const targetCell = newGrid[pendingFilBoostIndex];
      if (targetCell && !targetCell.locked) {
        newGrid[pendingFilBoostIndex] = {
          ...targetCell,
          currentPower: clampPower(targetCell.currentPower + boostAmount),
        };
      }
      return newGrid;
    });
    
    setFilDialogOpen(false);
    setPendingFilBoostIndex(null);
    setFilPlacedIndex(null);
    
    // Check for Overheater overflow after Fil boost, then process next ability
    setTimeout(() => {
      setGrid((current) => {
        const { hasPendingPick, cappedGrid } = checkOverheaterAfterSuperpower(current);
        if (cappedGrid) {
          if (hasPendingPick) {
            return cappedGrid; // Overheater pick pending - will process queue after
          }
          // Capped but no pick needed, process next ability
          setTimeout(() => processNextAbility(), 0);
          return cappedGrid;
        }
        processNextAbility();
        return current;
      });
    }, 0);
  }, [pendingFilBoostIndex, clampPower, processNextAbility, checkOverheaterAfterSuperpower]);

  const applyFlashBoost = useCallback((boostAmount: number) => {
    if (pendingFlashIndex === null) return;
    
    setGrid((prev) => {
      const newGrid = [...prev];
      const flashCell = newGrid[pendingFlashIndex];
      if (flashCell && !flashCell.locked) {
        newGrid[pendingFlashIndex] = {
          ...flashCell,
          currentPower: clampPower(flashCell.currentPower + boostAmount),
        };
      }
      return newGrid;
    });
    
    setFlashDialogOpen(false);
    setPendingFlashIndex(null);
    
    // Check for Overheater overflow after Flash boost (in case it boosted Overheater somehow), then process next ability
    setTimeout(() => {
      setGrid((current) => {
        const { hasPendingPick, cappedGrid } = checkOverheaterAfterSuperpower(current);
        if (cappedGrid) {
          if (hasPendingPick) {
            return cappedGrid; // Overheater pick pending - will process queue after
          }
          // Capped but no pick needed, process next ability
          setTimeout(() => processNextAbility(), 0);
          return cappedGrid;
        }
        processNextAbility();
        return current;
      });
    }, 0);
  }, [pendingFlashIndex, clampPower, processNextAbility, checkOverheaterAfterSuperpower]);

  const currentPowers = useMemo(() => {
    return grid.filter((cell) => cell !== null).map((cell) => cell!.currentPower);
  }, [grid]);

  const missingPowers = useMemo(() => {
    const needed = Array.from({ length: maxPower }, (_, i) => i + 1);
    return needed.filter((p) => !currentPowers.includes(p));
  }, [currentPowers, maxPower]);

  const duplicatePowers = useMemo(() => {
    const counts: Record<number, number> = {};
    currentPowers.forEach((p) => {
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([_, count]) => count > 1)
      .map(([power]) => parseInt(power));
  }, [currentPowers]);

  // Check if game is over (board full, no removal allowed, no usable superpowers)
  const isGameOver = useMemo(() => {
    const config = DIFFICULTY_CONFIG[difficulty];
    if (config.canRemove) return false; // Can still remove friends
    
    const boardFull = grid.every((cell) => cell !== null);
    if (!boardFull) return false;
    
    // Check if recharge is usable (not on cooldown and there are friends to boost)
    const rechargeUsable = (superpowerCooldowns["recharge"] || 0) === 0;
    
    // Check if double-a is usable (not used yet and there are friends to double)
    const doubleAUsable = !doubleAUsed;
    
    // If either superpower is usable, game is not over
    if (rechargeUsable || doubleAUsable) return false;
    
    // Board is full, can't remove, and no superpowers available
    return true;
  }, [difficulty, grid, superpowerCooldowns, doubleAUsed]);

  if (gameState === "difficulty-select") {
    return <DifficultySelect onSelect={startGame} />;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 py-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={backToMenu}
          className="bg-black/40 border-white/30 hover:bg-black/50 text-white"
        >
          Menu
        </Button>
        <div className="text-center">
          <span className="text-white/70 text-sm">
            {DIFFICULTY_CONFIG[difficulty].label} Mode
          </span>
        </div>
        <div className="flex gap-1">
          {onToggleMusic && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleMusic}
              className="bg-black/40 border-white/30 hover:bg-black/50 text-white"
              title={isMusicPlaying ? "Mute music" : "Unmute music"}
            >
              {isMusicPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={resetGameSameSetup}
            className="bg-black/40 border-white/30 hover:bg-black/50 text-white"
            title="Restart with same cards"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetGame}
            className="bg-black/40 border-white/30 hover:bg-black/50 text-white"
            title="New game with new cards"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            <span className="text-xs">New</span>
          </Button>
        </div>
      </div>

      {/* Game Over Screen */}
      {isGameOver && gameState !== "won" && (
        <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-6 text-center border border-red-500/50 animate-pulse">
          <h2 className="text-2xl font-display text-red-400 mb-2">
            Game Over!
          </h2>
          <p className="text-white/80 mb-4">
            Board is full and no superpowers available.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={resetGameSameSetup}
              className="bg-primary hover:bg-primary/80"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={resetGame}
              className="border-white/30 text-white hover:bg-white/10"
            >
              New Cards
            </Button>
            <Button
              variant="outline"
              onClick={backToMenu}
              className="border-white/30 text-white hover:bg-white/10"
            >
              Change Difficulty
            </Button>
          </div>
        </div>
      )}

      {/* Win Screen */}
      {gameState === "won" && (
        <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-6 text-center border border-green-500/50">
          <h2 className="text-2xl font-display text-green-400 mb-2">
            🎉 You Win!
          </h2>
          <p className="text-white/80 mb-4">
            All powers are unique from 1 to {maxPower}!
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={resetGameSameSetup}
              className="bg-primary hover:bg-primary/80"
            >
              Play Again
            </Button>
            <Button
              variant="outline"
              onClick={resetGame}
              className="border-white/30 text-white hover:bg-white/10"
            >
              New Cards
            </Button>
            <Button
              variant="outline"
              onClick={backToMenu}
              className="border-white/30 text-white hover:bg-white/10"
            >
              Change Difficulty
            </Button>
          </div>
        </div>
      )}

      {/* Grid + Superpower Side by Side */}
      <div className="flex items-center gap-4">
        {/* Grid with celebration overlay */}
        <div className="relative">
          <div
            ref={gridRef}
            className="grid gap-2 sm:gap-3 p-4 bg-black/30 backdrop-blur-sm rounded-2xl"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
            }}
          >
            {grid.map((cell, index) => (
              <div key={index} data-grid-cell>
                <GridCell
                  cell={cell}
                  onClick={() => handleCellClick(index)}
                  onDrop={(friend) => handleDropFriend(index, friend)}
                  size={Math.max(rows, cols)}
                  highlighted={
                    (selectedFriend !== null && cell === null) ||
                    (selectedSuperpower !== null && cell !== null)
                  }
                  volataBoostTarget={pendingVolataBoost && cell !== null && !cell.locked}
                  sizzleDrainTarget={pendingSizzleDrain && sizzlePlacedIndex !== null && cell !== null && !cell.locked && cell.currentPower > 1 && index !== sizzlePlacedIndex && (Math.floor(index / cols) === Math.floor(sizzlePlacedIndex / cols) || index % cols === sizzlePlacedIndex % cols)}
                  overheaterBoostTarget={pendingOverheaterBoost !== null && cell !== null && !cell.locked && index !== pendingOverheaterBoost.overheaterIndex}
                  hasPowerBoost={powerBoostCells.has(index) && cell === null}
                  targetNumber={targetNumbers.length > 0 ? targetNumbers[index] : undefined}
                  isDragging={isDraggingFriend}
                />
              </div>
            ))}
          </div>
          {gameState === "won" && <VictoryCelebration />}
        </div>

        {/* Superpower - Next to Board */}
        {gameState === "playing" && (
          <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl p-3 border border-amber-500/40">
            <p className="text-amber-300 text-xs text-center mb-2 font-medium">Superpower</p>
            {SUPERPOWERS.map((superpower) => (
              <SuperpowerCard
                key={superpower.id}
                superpower={superpower}
                selected={selectedSuperpower?.id === superpower.id}
                cooldownRemaining={superpowerCooldowns[superpower.id] || 0}
                difficulty={difficulty}
                used={superpower.id === "double-a" && doubleAUsed}
                onSelect={() => {
                  setSelectedFriend(null);
                  setSelectedSuperpower(
                    selectedSuperpower?.id === superpower.id ? null : superpower
                  );
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      {gameState === "playing" && (
        <div className="text-center text-white/70 text-sm">
          {missingPowers.length > 0 && (
            <p>
              Numbers missing:{" "}
              <span className="text-primary font-medium">
                {missingPowers.join(", ")}
              </span>
            </p>
          )}
          {duplicatePowers.length > 0 && (
            <p className="text-amber-400">
              Duplicates: {duplicatePowers.join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Friend Selection - 2 rows of 4 */}
      {gameState === "playing" && (
        <div className="w-full max-w-xl">
          <p className="text-white/70 text-sm text-center mb-3">
            {pendingVolataBoost
              ? <span className="text-purple-400 font-medium">Volata: Pick any Friend to give +2 power</span>
              : selectedSuperpower
              ? `Tap a Friend to use ${selectedSuperpower.name}`
              : selectedFriend
              ? `Tap a cell to place ${selectedFriend.name}`
              : "Select a Friend or Superpower"}
          </p>
          
          {/* Friends Grid - single row for 5 cards, 2 rows for larger pools */}
          <div className={`grid gap-2 sm:gap-3 ${availableFriends.length <= 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
            {availableFriends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                selected={selectedFriend?.id === friend.id}
                cooldownRemaining={friendCooldowns[friend.id] || 0}
                onSelect={() => {
                  setSelectedSuperpower(null);
                  setSelectedFriend(
                    selectedFriend?.id === friend.id ? null : friend
                  );
                }}
                onDragStart={() => {
                  setIsDraggingFriend(true);
                  setSelectedSuperpower(null);
                }}
                onDragEnd={() => {
                  setIsDraggingFriend(false);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ability Reference - Collapsible Dropdown */}
      {gameState === "playing" && (
        <Collapsible className="bg-black/40 backdrop-blur-sm rounded-xl max-w-xl w-full">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-white font-medium text-sm hover:bg-white/5 rounded-xl transition-colors">
            <span>Abilities & Superpowers</span>
            <ChevronDown className="w-4 h-4 transition-transform [[data-state=open]>&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/70">
              {availableFriends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-2">
                  <img
                    src={friend.image}
                    alt={friend.name}
                    className="w-6 h-6 object-contain"
                  />
                  <span>
                    <strong className="text-white">{friend.name}</strong> (
                    {friend.basePower}): {friend.abilityDescription}
                  </span>
                </div>
              ))}
              {SUPERPOWERS.map((sp) => {
                const cooldown = difficulty === "beginner" ? 0 : difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
                return (
                  <div key={sp.id} className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-amber-500/30 rounded flex items-center justify-center text-amber-300 text-xs font-bold">
                      ⚡
                    </div>
                    <span>
                      <strong className="text-amber-300">{sp.name}</strong>: {sp.description} ({cooldown === 0 ? "no" : cooldown + " move"} cooldown)
                    </span>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Recharge Power Choice Dialog */}
      <Dialog open={rechargeDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setRechargeDialogOpen(false);
          setPendingRechargeIndex(null);
          setSelectedSuperpower(null);
        }
      }}>
        <DialogContent className="bg-black/90 border-amber-500/50 text-white max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-amber-300 text-center">Recharge Power</DialogTitle>
          </DialogHeader>
          <p className="text-white/70 text-sm text-center mb-4">
            Choose how much power to give:
          </p>
          <div className="flex justify-center gap-3">
            {[1, 2, 3].map((amount) => (
              <Button
                key={amount}
                onClick={() => applyRecharge(amount)}
                className="bg-amber-500/30 hover:bg-amber-500/50 border border-amber-500/50 text-amber-300 font-bold text-lg w-14 h-14"
              >
                +{amount}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Double A Dialog */}
      <Dialog open={doubleADialogOpen} onOpenChange={(open) => {
        if (!open) {
          setDoubleADialogOpen(false);
          setPendingDoubleAIndex(null);
          setSelectedSuperpower(null);
        }
      }}>
        <DialogContent className="bg-black/90 border-pink-500/50 text-white max-w-xs">
          <DialogHeader className="flex flex-col items-center gap-2">
            <img 
              src={"/assets/novadoku/double-a.png"}
              alt="Double A" 
              className="w-16 h-16 object-contain drop-shadow-[0_0_12px_rgba(236,72,153,0.6)]"
            />
            <DialogTitle className="text-pink-400 text-center text-xl">DOUBLE A</DialogTitle>
          </DialogHeader>
          {pendingDoubleAIndex !== null && grid[pendingDoubleAIndex] && (() => {
            const currentPower = grid[pendingDoubleAIndex]!.currentPower;
            const doubledPower = currentPower * 2;
            const cappedPower = Math.min(doubledPower, maxPower);
            const isCapped = doubledPower > maxPower;
            
            return (
              <div className="flex flex-col items-center gap-2 mb-2">
                <p className="text-white/70 text-xs">Doubling:</p>
                <img 
                  src={grid[pendingDoubleAIndex]!.friend.image} 
                  alt={grid[pendingDoubleAIndex]!.friend.name}
                  className="w-14 h-14 object-contain drop-shadow-[0_0_10px_rgba(236,72,153,0.4)]"
                />
                <p className="text-pink-300 text-sm font-medium">
                  {grid[pendingDoubleAIndex]!.friend.name}: {currentPower} → {cappedPower}
                  {isCapped && <span className="text-pink-400/70 text-xs ml-1">(max allowed)</span>}
                </p>
              </div>
            );
          })()}
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => {
                setDoubleADialogOpen(false);
                setPendingDoubleAIndex(null);
                setSelectedSuperpower(null);
              }}
              variant="outline"
              className="bg-white/10 border-white/30 hover:bg-white/20 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={applyDoubleA}
              className="bg-pink-500/50 hover:bg-pink-500/70 border border-pink-500/50 text-pink-100 font-bold"
            >
              Double It!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sizzle Ability Instruction (positioned above grid, non-modal) */}
      {pendingSizzleDrain && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black/95 border border-orange-500/50 rounded-xl p-4 shadow-xl animate-fade-in flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <img 
              src="/characters/sizzle.png" 
              alt="Sizzle" 
              className="w-12 h-12 object-contain drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]"
            />
            <div>
              <p className="text-orange-400 font-bold">SIZZLE</p>
              <p className="text-white/90 text-sm">Steal 1 Power from a Friend in the same row or column</p>
            </div>
          </div>
        </div>
      )}

      {/* Overheater Ability Instruction (positioned above grid, non-modal) */}
      {pendingOverheaterBoost && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black/95 border border-red-500/50 rounded-xl p-4 shadow-xl animate-fade-in flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <img 
              src="/characters/overheater.png" 
              alt="Overheater" 
              className="w-12 h-12 object-contain drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
            />
            <div>
              <p className="text-red-400 font-bold">OVERHEATER</p>
              <p className="text-white/90 text-sm">Pick a Friend to give +{pendingOverheaterBoost.excessPower} Power to</p>
            </div>
          </div>
        </div>
      )}

      {/* Volata Ability Dialog */}
      <Dialog open={volataDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setVolataDialogOpen(false);
        }
      }}>
        <DialogContent className="bg-black/90 border-purple-500/50 text-white max-w-xs">
          <DialogHeader className="flex flex-col items-center gap-2">
            <img 
              src="/characters/volata.png" 
              alt="Volata" 
              className="w-20 h-20 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]"
            />
            <DialogTitle className="text-purple-400 text-center text-xl">VOLATA</DialogTitle>
          </DialogHeader>
          <p className="text-white/90 text-center mb-4">
            Pick a Friend to give +2
          </p>
          <div className="flex justify-center">
            <Button
              onClick={() => {
                setVolataDialogOpen(false);
                setPendingVolataBoost(true);
              }}
              className="bg-purple-500/30 hover:bg-purple-500/50 border border-purple-500/50 text-purple-300 font-bold px-6"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mopheous Ability Dialog */}
      <Dialog open={mopheousDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setMopheousDialogOpen(false);
          setPendingMopheousIndex(null);
        }
      }}>
        <DialogContent className="bg-black/90 border-cyan-500/50 text-white max-w-xs">
          <DialogHeader className="flex items-center gap-3 pb-2 border-b border-cyan-500/20">
            <img 
              src="/characters/mopheous.png" 
              alt="Mopheous" 
              className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
            />
            <DialogTitle className="text-cyan-400 text-lg">MOPHEOUS</DialogTitle>
          </DialogHeader>
          <p className="text-white/90 text-center my-3">
            Choose power boost:
          </p>
          <div className="flex justify-center gap-3 mb-4">
            {[1, 2, 3].map((amount) => (
              <Button
                key={amount}
                onClick={() => applyMopheousBoost(amount)}
                className="bg-cyan-500/30 hover:bg-cyan-500/50 border border-cyan-500/50 text-cyan-300 font-bold text-lg w-14 h-14"
              >
                +{amount}
              </Button>
            ))}
          </div>
          {pendingMopheousIndex !== null && grid[pendingMopheousIndex] && (
            <div className="flex flex-col items-center pt-3 border-t border-cyan-500/20">
              <p className="text-white/60 text-xs mb-2">Boosting:</p>
              <img 
                src={grid[pendingMopheousIndex]!.friend.image} 
                alt={grid[pendingMopheousIndex]!.friend.name}
                className="w-16 h-16 object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]"
              />
              <p className="text-cyan-300 text-sm font-medium mt-1">{grid[pendingMopheousIndex]!.friend.name}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fil Ability Dialog */}
      <Dialog open={filDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setFilDialogOpen(false);
          setPendingFilBoostIndex(null);
          setFilPlacedIndex(null);
        }
      }}>
        <DialogContent className="bg-black/90 border-green-500/50 text-white max-w-xs">
          <DialogHeader className="flex items-center gap-3 pb-2 border-b border-green-500/20">
            <img 
              src="/characters/fil.png" 
              alt="Fil" 
              className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
            />
            <DialogTitle className="text-green-400 text-lg">FIL</DialogTitle>
          </DialogHeader>
          <p className="text-white/90 text-center my-3">
            Choose power to give:
          </p>
          <div className="flex justify-center gap-3 mb-4">
            {[1, 2].map((amount) => (
              <Button
                key={amount}
                onClick={() => applyFilBoost(amount)}
                className="bg-green-500/30 hover:bg-green-500/50 border border-green-500/50 text-green-300 font-bold text-lg w-14 h-14"
              >
                +{amount}
              </Button>
            ))}
          </div>
          {pendingFilBoostIndex !== null && grid[pendingFilBoostIndex] && (
            <div className="flex flex-col items-center pt-3 border-t border-green-500/20">
              <p className="text-white/60 text-xs mb-2">Boosting:</p>
              <img 
                src={grid[pendingFilBoostIndex]!.friend.image} 
                alt={grid[pendingFilBoostIndex]!.friend.name}
                className="w-16 h-16 object-contain drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]"
              />
              <p className="text-green-300 text-sm font-medium mt-1">{grid[pendingFilBoostIndex]!.friend.name}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Flash Self-Boost Dialog */}
      <Dialog open={flashDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setFlashDialogOpen(false);
          setPendingFlashIndex(null);
        }
      }}>
        <DialogContent className="bg-black/90 border-yellow-500/50 text-white max-w-xs">
          <DialogHeader className="flex items-center gap-3 pb-2 border-b border-yellow-500/20">
            <img 
              src="/characters/flash.png" 
              alt="Flash" 
              className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"
            />
            <DialogTitle className="text-yellow-400 text-lg">FLASH</DialogTitle>
          </DialogHeader>
          <p className="text-white/90 text-center my-3">
            Choose power boost:
          </p>
          <div className="flex justify-center gap-3 mb-4">
            {[1, 2, 3].map((amount) => (
              <Button
                key={amount}
                onClick={() => applyFlashBoost(amount)}
                className="bg-yellow-500/30 hover:bg-yellow-500/50 border border-yellow-500/50 text-yellow-300 font-bold text-lg w-14 h-14"
              >
                +{amount}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Removal Confirmation Popup */}
      {removalConfirmOpen && pendingRemovalIndex !== null && removalPopupPosition && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            left: removalPopupPosition.x,
            top: removalPopupPosition.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div 
            className="bg-black/95 border border-red-500/50 rounded-xl p-4 shadow-xl pointer-events-auto animate-fade-in mb-2"
          >
            <p className="text-white text-center mb-3 font-medium">Remove Friend?</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={cancelRemoval}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/30 hover:bg-white/20 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRemoval}
                size="sm"
                className="bg-red-500/80 hover:bg-red-500 text-white border-none"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
