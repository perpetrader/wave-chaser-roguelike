import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { Character } from "@/data/characterPool";

interface CharacterSlotProps {
  character: Character | null;
  isSelected?: boolean;
  onClick?: () => void;
  onClear?: () => void;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-12 md:h-12",
  md: "w-11 h-11 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16",
  lg: "w-14 h-14 xs:w-16 xs:h-16 sm:w-18 sm:h-18 md:w-20 md:h-20",
};

export const CharacterSlot = ({
  character,
  isSelected,
  onClick,
  onClear,
  size = "md",
}: CharacterSlotProps) => {
  return (
    <div
      className={cn(
        "relative transition-all duration-200 select-none touch-manipulation",
        "flex items-center justify-center",
        sizeClasses[size],
        !character && "rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20",
        isSelected && character && "ring-2 ring-primary ring-offset-2 ring-offset-transparent rounded-xl",
        isSelected && !character && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        onClick && "cursor-pointer active:scale-95"
      )}
      onClick={onClick}
    >
      {character ? (
        <>
          <img
            src={character.image}
            alt={character.name}
            className="w-full h-full object-contain"
          />
          {onClear && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </>
      ) : (
        <span className="text-muted-foreground text-lg">?</span>
      )}
    </div>
  );
};
