import { cn } from "@/lib/utils";
import type { Character } from "@/data/characterPool";

interface CharacterPickerProps {
  characters: Character[];
  usedCharacters: number[];
  onSelect: (characterIndex: number) => void;
}

export const CharacterPicker = ({
  characters,
  usedCharacters,
  onSelect,
}: CharacterPickerProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border max-w-sm sm:max-w-md mx-auto">
      {characters.map((character, index) => {
        const isUsed = usedCharacters.includes(index);
        return (
          <button
            key={character.id}
            onClick={() => !isUsed && onSelect(index)}
            disabled={isUsed}
            className={cn(
              "w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 transition-all duration-200 select-none touch-manipulation",
              "flex items-center justify-center",
              "active:scale-95",
              isUsed
                ? "opacity-30 cursor-not-allowed grayscale"
                : "hover:scale-110 cursor-pointer"
            )}
          >
            <img
              src={character.image}
              alt={character.name}
              className="w-full h-full object-contain pointer-events-none"
            />
          </button>
        );
      })}
    </div>
  );
};
