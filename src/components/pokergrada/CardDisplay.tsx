import { cn } from "@/lib/utils";
import { Card } from "@/data/pokergradaBoard";

// Face card and ace images
import jackHearts from "@/assets/cards/jack-hearts.png";
import queenHearts from "@/assets/cards/queen-hearts.png";
import kingHearts from "@/assets/cards/king-hearts.png";
import aceHearts from "@/assets/cards/ace-hearts.png";
import jackDiamonds from "@/assets/cards/jack-diamonds.png";
import queenDiamonds from "@/assets/cards/queen-diamonds.png";
import kingDiamonds from "@/assets/cards/king-diamonds.png";
import aceDiamonds from "@/assets/cards/ace-diamonds.png";
import jackSpades from "@/assets/cards/jack-spades.png";
import queenSpades from "@/assets/cards/queen-spades.png";
import kingSpades from "@/assets/cards/king-spades.png";
import aceSpades from "@/assets/cards/ace-spades.png";
import jackClubs from "@/assets/cards/jack-clubs.png";
import queenClubs from "@/assets/cards/queen-clubs.png";
import kingClubs from "@/assets/cards/king-clubs.png";
import aceClubs from "@/assets/cards/ace-clubs.png";

export interface CardDisplayProps {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  highlighted?: boolean;
  className?: string;
}

const suitSymbols: Record<Card['suit'], string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors: Record<Card['suit'], string> = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-gray-900',
  spades: 'text-gray-900',
};

// Card images map
const cardImages: Record<string, string> = {
  'J-hearts': jackHearts,
  'Q-hearts': queenHearts,
  'K-hearts': kingHearts,
  'A-hearts': aceHearts,
  'J-diamonds': jackDiamonds,
  'Q-diamonds': queenDiamonds,
  'K-diamonds': kingDiamonds,
  'A-diamonds': aceDiamonds,
  'J-spades': jackSpades,
  'Q-spades': queenSpades,
  'K-spades': kingSpades,
  'A-spades': aceSpades,
  'J-clubs': jackClubs,
  'Q-clubs': queenClubs,
  'K-clubs': kingClubs,
  'A-clubs': aceClubs,
};

// Generate pip positions for number cards
const getPipLayout = (value: number): { row: number; col: number; flip?: boolean }[] => {
  const layouts: Record<number, { row: number; col: number; flip?: boolean }[]> = {
    2: [{ row: 0, col: 1 }, { row: 4, col: 1, flip: true }],
    3: [{ row: 0, col: 1 }, { row: 2, col: 1 }, { row: 4, col: 1, flip: true }],
    4: [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 4, col: 0, flip: true }, { row: 4, col: 2, flip: true }],
    5: [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 2, col: 1 }, { row: 4, col: 0, flip: true }, { row: 4, col: 2, flip: true }],
    6: [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 2, col: 0 }, { row: 2, col: 2 }, { row: 4, col: 0, flip: true }, { row: 4, col: 2, flip: true }],
    7: [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 1, col: 1 }, { row: 2, col: 0 }, { row: 2, col: 2 }, { row: 4, col: 0, flip: true }, { row: 4, col: 2, flip: true }],
    8: [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 1, col: 1 }, { row: 2, col: 0 }, { row: 2, col: 2 }, { row: 3, col: 1, flip: true }, { row: 4, col: 0, flip: true }, { row: 4, col: 2, flip: true }],
    9: [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 2 }, { row: 2, col: 1 }, { row: 3, col: 0, flip: true }, { row: 3, col: 2, flip: true }, { row: 4, col: 0, flip: true }, { row: 4, col: 2, flip: true }],
    10: [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 1, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 2 }, { row: 3, col: 0, flip: true }, { row: 3, col: 1, flip: true }, { row: 3, col: 2, flip: true }, { row: 4, col: 0, flip: true }, { row: 4, col: 2, flip: true }],
  };
  return layouts[value] || [];
};

export const CardDisplay = ({ card, selected, onClick, disabled, size = 'md', highlighted, className }: CardDisplayProps) => {
  const sizeClasses = {
    sm: 'w-10 h-14 xs:w-11 xs:h-[62px]',
    md: 'w-14 h-20 xs:w-16 xs:h-[88px] sm:w-[72px] sm:h-[100px]',
    lg: 'w-16 h-[88px] xs:w-20 xs:h-[110px] sm:w-24 sm:h-[132px]',
  };

  const fontSizes = {
    sm: 'text-xs xs:text-sm sm:text-xs',
    md: 'text-base xs:text-lg sm:text-base',
    lg: 'text-lg xs:text-xl sm:text-lg',
  };

  const pipSizes = {
    sm: 'text-[8px]',
    md: 'text-[10px] xs:text-xs sm:text-sm',
    lg: 'text-xs xs:text-sm sm:text-base',
  };

  const isFaceCard = ['J', 'Q', 'K'].includes(card.rank);
  const isAce = card.rank === 'A';
  const hasImage = isFaceCard || isAce;
  const imageKey = `${card.rank}-${card.suit}`;
  const cardImage = cardImages[imageKey];

  const numValue = parseInt(card.rank);
  const pips = !isNaN(numValue) ? getPipLayout(numValue) : [];

  const baseClasses = cn(
    "relative flex flex-col rounded transition-all duration-200 overflow-hidden",
    "bg-white border border-gray-300 shadow-lg select-none touch-manipulation",
    sizeClasses[size],
    selected && "ring-2 ring-primary ring-offset-2 scale-105",
    highlighted && "ring-2 ring-accent ring-offset-1 shadow-[0_0_12px_rgba(59,130,246,0.5)]",
    !disabled && "hover:shadow-xl active:scale-95 cursor-pointer",
    disabled && "cursor-default",
    className
  );

  // For face cards and aces, render the image
  if (hasImage && cardImage) {
    const imageContent = (
      <img 
        src={cardImage} 
        alt={`${card.rank} of ${card.suit}`}
        className="absolute inset-0 w-full h-full object-contain rounded"
      />
    );

    if (disabled) {
      return <div className={baseClasses}>{imageContent}</div>;
    }

    return (
      <button onClick={onClick} className={baseClasses}>
        {imageContent}
      </button>
    );
  }

  // For number cards, render pips
  const content = (
    <>
      {/* Top-left corner */}
      <div className={cn("absolute top-0.5 left-0.5 flex flex-col items-center leading-none", fontSizes[size], suitColors[card.suit])}>
        <span className="font-bold">{card.rank}</span>
        <span className="-mt-0.5">{suitSymbols[card.suit]}</span>
      </div>

      {/* Bottom-right corner (rotated) */}
      <div className={cn("absolute bottom-0.5 right-0.5 flex flex-col items-center leading-none rotate-180", fontSizes[size], suitColors[card.suit])}>
        <span className="font-bold">{card.rank}</span>
        <span className="-mt-0.5">{suitSymbols[card.suit]}</span>
      </div>

      {/* Center pips - hidden on mobile to prevent overlap */}
      {pips.length > 0 && (
        <div className="absolute inset-0 hidden sm:flex items-center justify-center">
          <div className="grid grid-cols-3 grid-rows-5 gap-0 w-[60%] h-[70%]">
            {pips.map((pip, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-center",
                  pipSizes[size],
                  suitColors[card.suit],
                  pip.flip && "rotate-180"
                )}
                style={{
                  gridRow: pip.row + 1,
                  gridColumn: pip.col + 1,
                }}
              >
                {suitSymbols[card.suit]}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  if (disabled) {
    return <div className={baseClasses}>{content}</div>;
  }

  return (
    <button onClick={onClick} className={baseClasses}>
      {content}
    </button>
  );
};
