import { Card } from "@/data/pokergradaBoard";

export type HandRank = 
  | 'royal-flush'
  | 'straight-flush'
  | 'four-of-a-kind'
  | 'full-house'
  | 'flush'
  | 'straight'
  | 'three-of-a-kind'
  | 'two-pair'
  | 'one-pair'
  | 'ace-high'
  | 'high-card';

export type HandResult = {
  rank: HandRank;
  name: string;
  score: number;
};

const HAND_SCORES: Record<HandRank, { name: string; score: number }> = {
  'royal-flush': { name: 'Royal Flush', score: 200 },
  'straight-flush': { name: 'Straight Flush', score: 100 },
  'four-of-a-kind': { name: 'Four of a Kind', score: 75 },
  'full-house': { name: 'Full House', score: 50 },
  'flush': { name: 'Flush', score: 40 },
  'straight': { name: 'Straight', score: 30 },
  'three-of-a-kind': { name: 'Three of a Kind', score: 20 },
  'two-pair': { name: 'Two Pair', score: 10 },
  'one-pair': { name: 'One Pair', score: 5 },
  'ace-high': { name: 'Ace High', score: 2 },
  'high-card': { name: 'High Card', score: 0 },
};

const isFlush = (cards: Card[]): boolean => {
  return cards.every(c => c.suit === cards[0].suit);
};

const isStraight = (cards: Card[]): boolean => {
  const values = cards.map(c => c.value).sort((a, b) => a - b);
  
  // Check for regular straight
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i - 1] + 1) {
      // Check for A-2-3-4-5 (wheel)
      if (i === values.length - 1 && values[values.length - 1] === 14) {
        const lowAce = [1, ...values.slice(0, -1)].sort((a, b) => a - b);
        let isWheel = true;
        for (let j = 1; j < lowAce.length; j++) {
          if (lowAce[j] !== lowAce[j - 1] + 1) {
            isWheel = false;
            break;
          }
        }
        if (isWheel) return true;
      }
      return false;
    }
  }
  return true;
};

const isRoyalFlush = (cards: Card[]): boolean => {
  if (!isFlush(cards)) return false;
  const values = cards.map(c => c.value).sort((a, b) => a - b);
  return values[0] === 10 && values[4] === 14;
};

const getRankCounts = (cards: Card[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
  }
  return counts;
};

export const evaluateHand = (cards: (Card | null)[]): HandResult | null => {
  // Filter out null cards
  const validCards = cards.filter((c): c is Card => c !== null);
  
  // No cards = no hand
  if (validCards.length === 0) return null;

  const rankCounts = getRankCounts(validCards);
  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);

  // Full 5-card hand - can evaluate all hand types including flushes and straights
  if (validCards.length === 5) {
    const flush = isFlush(validCards);
    const straight = isStraight(validCards);

    let rank: HandRank;

    if (isRoyalFlush(validCards)) {
      rank = 'royal-flush';
    } else if (flush && straight) {
      rank = 'straight-flush';
    } else if (counts[0] === 4) {
      rank = 'four-of-a-kind';
    } else if (counts[0] === 3 && counts[1] === 2) {
      rank = 'full-house';
    } else if (flush) {
      rank = 'flush';
    } else if (straight) {
      rank = 'straight';
    } else if (counts[0] === 3) {
      rank = 'three-of-a-kind';
    } else if (counts[0] === 2 && counts[1] === 2) {
      rank = 'two-pair';
    } else if (counts[0] === 2) {
      rank = 'one-pair';
    } else if (validCards.some(c => c.value === 14)) {
      rank = 'ace-high';
    } else {
      rank = 'high-card';
    }

    return {
      rank,
      ...HAND_SCORES[rank],
    };
  }

  // Partial hand (1-4 cards) - only evaluate rank-based hands (no flushes/straights)
  let rank: HandRank;

  if (counts[0] === 4) {
    rank = 'four-of-a-kind';
  } else if (counts[0] === 3 && counts[1] === 2) {
    rank = 'full-house';
  } else if (counts[0] === 3) {
    rank = 'three-of-a-kind';
  } else if (counts[0] === 2 && counts[1] === 2) {
    rank = 'two-pair';
  } else if (counts[0] === 2) {
    rank = 'one-pair';
  } else if (validCards.some(c => c.value === 14)) {
    rank = 'ace-high';
  } else {
    rank = 'high-card';
  }

  return {
    rank,
    ...HAND_SCORES[rank],
  };
};

export const evaluateBoard = (board: (Card | null)[][]): { rows: (HandResult | null)[]; cols: (HandResult | null)[]; total: number } => {
  const rows: (HandResult | null)[] = [];
  const cols: (HandResult | null)[] = [];

  // Evaluate rows
  for (let r = 0; r < 5; r++) {
    rows.push(evaluateHand(board[r]));
  }

  // Evaluate columns
  for (let c = 0; c < 5; c++) {
    const col = [board[0][c], board[1][c], board[2][c], board[3][c], board[4][c]];
    cols.push(evaluateHand(col));
  }

  const total = [...rows, ...cols].reduce((sum, hand) => sum + (hand?.score || 0), 0);

  return { rows, cols, total };
};
