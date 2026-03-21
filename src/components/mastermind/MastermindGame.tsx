import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CharacterSlot } from "./CharacterSlot";
import { CharacterPicker } from "./CharacterPicker";
import { FeedbackPegs } from "./FeedbackPegs";
import { RotateCcw, Volume2, VolumeX } from "lucide-react";
import { selectRandomCharacters, type Character } from "@/data/characterPool";

const MAX_GUESSES = 10;

type Guess = {
  code: (number | null)[];
  feedback: { correct: number; misplaced: number };
};

function generateSecretCode(characterCount: number, codeLength: number): number[] {
  const shuffled = [...Array(characterCount).keys()].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, codeLength);
}

function calculateFeedback(guess: number[], secret: number[], codeLength: number): { correct: number; misplaced: number } {
  let correct = 0;
  let misplaced = 0;

  const secretCopy = [...secret];
  const guessCopy = [...guess];

  // First pass: find correct positions
  for (let i = 0; i < codeLength; i++) {
    if (guessCopy[i] === secretCopy[i]) {
      correct++;
      secretCopy[i] = -1; // Mark as matched
      guessCopy[i] = -2; // Mark as matched (different value to avoid confusion)
    }
  }

  // Second pass: find misplaced (only check unmatched positions)
  for (let i = 0; i < codeLength; i++) {
    if (guessCopy[i] >= 0) { // Only check if not already matched
      const idx = secretCopy.indexOf(guessCopy[i]);
      if (idx !== -1) {
        misplaced++;
        secretCopy[idx] = -1; // Mark this secret position as used
      }
    }
  }

  // Debug logging
  console.log('Secret:', secret, 'Guess:', guess, 'Feedback:', { correct, misplaced });

  return { correct, misplaced };
}

interface MastermindGameProps {
  onRestart?: () => void;
  onBackToMenu?: () => void;
  codeLength: number;
  characterCount: number;
  isMusicPlaying?: boolean;
  onToggleMusic?: () => void;
}

export const MastermindGame = ({ onRestart, onBackToMenu, codeLength, characterCount, isMusicPlaying, onToggleMusic }: MastermindGameProps) => {
  // Select random characters for this game session
  const [gameCharacters, setGameCharacters] = useState<Character[]>(() => 
    selectRandomCharacters(characterCount)
  );
  
  const [secretCode, setSecretCode] = useState<number[]>(() => 
    generateSecretCode(characterCount, codeLength)
  );
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState<(number | null)[]>(Array(codeLength).fill(null));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(0);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");

  const handleSelectCharacter = useCallback((characterIndex: number) => {
    if (selectedSlot === null || gameState !== "playing") return;

    // Check if character is already used in current guess
    if (currentGuess.includes(characterIndex)) return;

    const newGuess = [...currentGuess];
    newGuess[selectedSlot] = characterIndex;
    setCurrentGuess(newGuess);

    // Move to next empty slot
    const nextEmpty = newGuess.findIndex((slot, idx) => slot === null && idx > selectedSlot);
    if (nextEmpty !== -1) {
      setSelectedSlot(nextEmpty);
    } else {
      const firstEmpty = newGuess.findIndex((slot) => slot === null);
      setSelectedSlot(firstEmpty !== -1 ? firstEmpty : null);
    }
  }, [selectedSlot, currentGuess, gameState]);

  const handleSlotClick = (index: number) => {
    if (gameState !== "playing") return;
    setSelectedSlot(index);
  };

  const handleClearSlot = (index: number) => {
    if (gameState !== "playing") return;
    const newGuess = [...currentGuess];
    newGuess[index] = null;
    setCurrentGuess(newGuess);
    setSelectedSlot(index);
  };

  const handleSubmitGuess = () => {
    if (currentGuess.includes(null) || gameState !== "playing") return;

    const feedback = calculateFeedback(currentGuess as number[], secretCode, codeLength);
    const newGuess: Guess = { code: [...currentGuess], feedback };
    const newGuesses = [...guesses, newGuess];
    setGuesses(newGuesses);

    if (feedback.correct === codeLength) {
      setGameState("won");
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameState("lost");
    } else {
      setCurrentGuess(Array(codeLength).fill(null));
      setSelectedSlot(0);
    }
  };

  const handleRestartGame = () => {
    const newCharacters = selectRandomCharacters(characterCount);
    setGameCharacters(newCharacters);
    setSecretCode(generateSecretCode(characterCount, codeLength));
    setGuesses([]);
    setCurrentGuess(Array(codeLength).fill(null));
    setSelectedSlot(0);
    setGameState("playing");
    onRestart?.();
  };

  const usedInCurrentGuess = currentGuess.filter((c): c is number => c !== null);

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 py-4 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-display text-gradient drop-shadow-lg">Crack the Code!</h2>
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
        </div>
        <p className="text-white/80 text-xs sm:text-sm drop-shadow-md">
          {gameState === "playing"
            ? `Guess ${guesses.length + 1} of ${MAX_GUESSES}`
            : gameState === "won"
            ? "You cracked it!"
            : "Game Over!"}
        </p>
      </div>

      {/* Game Over / Won state */}
      {gameState !== "playing" && (
        <div className="flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl bg-black/60 border border-white/20 backdrop-blur-sm">
          <p className="text-base sm:text-lg font-medium text-white">
            {gameState === "won"
              ? `🎉 Solved in ${guesses.length} guess${guesses.length > 1 ? "es" : ""}!`
              : "The secret code was:"}
          </p>
          <div className="flex gap-2">
            {secretCode.map((charIdx, idx) => (
              <CharacterSlot
                key={idx}
                character={gameCharacters[charIdx]}
                size="sm"
              />
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Button onClick={handleRestartGame} variant="outline" className="bg-black/40 border-white/30 text-white hover:bg-black/60">
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
            {onBackToMenu && (
              <Button onClick={onBackToMenu} className="bg-primary hover:bg-primary/80">
                Change Difficulty
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Previous guesses */}
      <div className="flex flex-col gap-1.5 sm:gap-2 w-full max-w-sm sm:max-w-md">
        {guesses.map((guess, guessIdx) => (
          <div
            key={guessIdx}
            className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg bg-black/50 backdrop-blur-sm"
          >
            <span className="text-xs text-white/70 w-6">{guessIdx + 1}.</span>
            <div className="flex gap-1.5">
              {guess.code.map((charIdx, slotIdx) => (
                <CharacterSlot
                  key={slotIdx}
                  character={charIdx !== null ? gameCharacters[charIdx] : null}
                  size="sm"
                />
              ))}
            </div>
            <FeedbackPegs
              correct={guess.feedback.correct}
              misplaced={guess.feedback.misplaced}
              total={codeLength}
            />
          </div>
        ))}
      </div>

      {/* Current guess */}
      {gameState === "playing" && (
        <>
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="flex gap-1.5 sm:gap-2">
              {currentGuess.map((charIdx, idx) => (
                <CharacterSlot
                  key={idx}
                  character={charIdx !== null ? gameCharacters[charIdx] : null}
                  isSelected={selectedSlot === idx}
                  onClick={() => handleSlotClick(idx)}
                  onClear={() => handleClearSlot(idx)}
                  size="md"
                />
              ))}
            </div>
            <Button
              onClick={handleSubmitGuess}
              disabled={currentGuess.includes(null)}
              className="px-8"
            >
              Submit Guess
            </Button>
          </div>

          {/* Character picker */}
          <CharacterPicker
            characters={gameCharacters}
            usedCharacters={usedInCurrentGuess}
            onSelect={handleSelectCharacter}
          />
        </>
      )}
    </div>
  );
};
