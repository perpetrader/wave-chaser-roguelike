import { cn } from "@/lib/utils";
import { Card, CellRequirement, cardMeetsRequirement } from "@/data/pokergradaBoard";
import { CardDisplay } from "./CardDisplay";

interface BoardCellProps {
  requirement: CellRequirement | null;
  placedCard: Card | null;
  selectedCard: Card | null;
  onPlace: () => void;
  disabled?: boolean;
  highlighted?: boolean;
}

export const BoardCell = ({ 
  requirement, 
  placedCard, 
  selectedCard, 
  onPlace, 
  disabled,
  highlighted 
}: BoardCellProps) => {
  const canPlace = selectedCard && !placedCard && cardMeetsRequirement(selectedCard, requirement);

  // Check if requirement is a suit
  const isSuitRequirement = requirement?.type === 'suit';
  const suitColorClass = requirement?.value === 'hearts' || requirement?.value === 'diamonds' 
    ? 'text-red-500' 
    : 'text-gray-900 drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]';

  // When a card is placed, render it directly without button wrapper
  if (placedCard) {
    return <CardDisplay card={placedCard} size="md" disabled highlighted={highlighted} />;
  }

  return (
    <button
      onClick={onPlace}
      disabled={disabled || !selectedCard || !canPlace}
      className={cn(
        "relative flex items-center justify-center rounded-lg transition-all duration-200",
        "w-14 h-20 xs:w-16 xs:h-[88px] sm:w-[72px] sm:h-[100px]",
        "border-2 select-none touch-manipulation",
        "bg-card/80 backdrop-blur-sm",
        requirement ? "border-primary/40" : "border-border",
        canPlace && "border-primary bg-primary/20 cursor-pointer hover:bg-primary/30",
        highlighted && "ring-2 ring-accent",
        !canPlace && selectedCard && "opacity-50"
      )}
    >
      {isSuitRequirement ? (
        <span className={cn("text-3xl sm:text-4xl", suitColorClass)}>
          {requirement?.label}
        </span>
      ) : (
        <span className={cn(
          "text-xs sm:text-sm font-medium text-muted-foreground text-center px-1",
          requirement && "text-primary"
        )}>
          {requirement?.label || ''}
        </span>
      )}
    </button>
  );
};
