// Board cell requirements for Pokergrada
// null = any card allowed, otherwise specifies a constraint

export type CellRequirement = {
  type: 'suit' | 'rank' | 'color' | 'range' | 'odd' | 'even' | 'any';
  value?: string | string[] | [number, number];
  label: string;
};

export type BoardLayout = (CellRequirement | null)[][];

// Shuffle array helper
const shuffleArray = <T>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';

// Pool of all possible requirements (with max counts from expert mode)
const getRequirementPool = (): { req: CellRequirement; maxCount: number }[] => {
  const allRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const shuffledRanks = shuffleArray(allRanks);
  
  return [
    { req: { type: 'rank', value: ['J', 'Q', 'K'], label: 'Face' }, maxCount: 1 },
    { req: { type: 'color', value: 'red', label: 'Red' }, maxCount: 2 },
    { req: { type: 'color', value: 'black', label: 'Black' }, maxCount: 2 },
    { req: { type: 'suit', value: 'spades', label: '♠' }, maxCount: 1 },
    { req: { type: 'suit', value: 'clubs', label: '♣' }, maxCount: 1 },
    { req: { type: 'suit', value: 'hearts', label: '♥' }, maxCount: 1 },
    { req: { type: 'suit', value: 'diamonds', label: '♦' }, maxCount: 1 },
    { req: { type: 'range', value: [2, 5], label: '2-5' }, maxCount: 1 },
    { req: { type: 'range', value: [3, 6], label: '3-6' }, maxCount: 1 },
    { req: { type: 'range', value: [4, 7], label: '4-7' }, maxCount: 1 },
    { req: { type: 'range', value: [6, 9], label: '6-9' }, maxCount: 1 },
    { req: { type: 'range', value: [7, 10], label: '7-10' }, maxCount: 1 },
    { req: { type: 'odd', label: 'Odd' }, maxCount: 1 },
    { req: { type: 'even', label: 'Even' }, maxCount: 1 },
    { req: { type: 'rank', value: shuffledRanks[0], label: shuffledRanks[0] }, maxCount: 1 },
    { req: { type: 'rank', value: shuffledRanks[1], label: shuffledRanks[1] }, maxCount: 1 },
    { req: { type: 'rank', value: shuffledRanks[2], label: shuffledRanks[2] }, maxCount: 1 },
    { req: { type: 'rank', value: shuffledRanks[3], label: shuffledRanks[3] }, maxCount: 1 },
  ];
};

// Generate a randomized board layout based on difficulty
export const generateRandomBoard = (difficulty: Difficulty = 'expert'): BoardLayout => {
  const requirements: (CellRequirement | null)[] = [];
  
  // Number of requirements based on difficulty
  const reqCounts: Record<Difficulty, number> = {
    beginner: 0,
    easy: 5,
    medium: 10,
    hard: 15,
    expert: 20, // All 20 requirements from expert mode
  };
  
  const targetReqCount = reqCounts[difficulty];
  
  if (difficulty === 'expert') {
    // Expert mode: use all requirements
    requirements.push({ type: 'rank', value: ['J', 'Q', 'K'], label: 'Face' });
    requirements.push({ type: 'color', value: 'red', label: 'Red' });
    requirements.push({ type: 'color', value: 'red', label: 'Red' });
    requirements.push({ type: 'color', value: 'black', label: 'Black' });
    requirements.push({ type: 'color', value: 'black', label: 'Black' });
    requirements.push({ type: 'suit', value: 'spades', label: '♠' });
    requirements.push({ type: 'suit', value: 'clubs', label: '♣' });
    requirements.push({ type: 'suit', value: 'hearts', label: '♥' });
    requirements.push({ type: 'suit', value: 'diamonds', label: '♦' });
    requirements.push({ type: 'range', value: [2, 5], label: '2-5' });
    requirements.push({ type: 'range', value: [3, 6], label: '3-6' });
    requirements.push({ type: 'range', value: [4, 7], label: '4-7' });
    requirements.push({ type: 'range', value: [6, 9], label: '6-9' });
    requirements.push({ type: 'range', value: [7, 10], label: '7-10' });
    requirements.push({ type: 'odd', label: 'Odd' });
    requirements.push({ type: 'even', label: 'Even' });
    
    const allRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const shuffledRanks = shuffleArray(allRanks);
    for (let i = 0; i < 4; i++) {
      requirements.push({ type: 'rank', value: shuffledRanks[i], label: shuffledRanks[i] });
    }
  } else {
    // For other difficulties: pick random requirements from the pool
    const pool = getRequirementPool();
    const shuffledPool = shuffleArray(pool);
    const usedCounts: Map<string, number> = new Map();
    
    for (const item of shuffledPool) {
      if (requirements.length >= targetReqCount) break;
      
      const key = item.req.label;
      const used = usedCounts.get(key) || 0;
      
      if (used < item.maxCount) {
        requirements.push(item.req);
        usedCounts.set(key, used + 1);
      }
    }
  }
  
  // Fill remaining spots with blanks
  const blanks = 25 - requirements.length;
  for (let i = 0; i < blanks; i++) {
    requirements.push(null);
  }

  // Shuffle all requirements and arrange into 5x5 grid
  const shuffled = shuffleArray(requirements);
  const board: BoardLayout = [];
  for (let r = 0; r < 5; r++) {
    board.push(shuffled.slice(r * 5, r * 5 + 5));
  }

  return board;
};

// Default board layout (kept for reference)
export const defaultBoardLayout: BoardLayout = generateRandomBoard();

// Card type definition
export type Card = {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
  value: number; // For sorting: 2-14 (Ace = 14)
};

// Create a standard 52-card deck
export const createDeck = (): Card[] => {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (let i = 0; i < ranks.length; i++) {
      deck.push({
        suit,
        rank: ranks[i],
        value: i + 2, // 2 = 2, ... A = 14
      });
    }
  }

  return deck;
};

// Shuffle array using Fisher-Yates
export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Check if a card meets a cell requirement
export const cardMeetsRequirement = (card: Card, req: CellRequirement | null): boolean => {
  if (!req || req.type === 'any') return true;

  switch (req.type) {
    case 'suit':
      return card.suit === req.value;
    case 'color':
      if (req.value === 'red') {
        return card.suit === 'hearts' || card.suit === 'diamonds';
      }
      return card.suit === 'clubs' || card.suit === 'spades';
    case 'rank':
      if (Array.isArray(req.value)) {
        return (req.value as string[]).includes(card.rank);
      }
      return card.rank === req.value;
    case 'range':
      const [min, max] = req.value as [number, number];
      return card.value >= min && card.value <= max;
    case 'odd':
      // Odd: A, 3, 5, 7, 9 (face cards don't count)
      const oddRanks = ['A', '3', '5', '7', '9'];
      return oddRanks.includes(card.rank);
    case 'even':
      // Even: 2, 4, 6, 8, 10 (face cards don't count)
      const evenRanks = ['2', '4', '6', '8', '10'];
      return evenRanks.includes(card.rank);
    default:
      return true;
  }
};
