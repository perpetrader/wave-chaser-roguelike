import { useState, useEffect, useRef, useCallback } from "react";
import { DucksGame } from "@/components/ducks/DucksGame";
import { DifficultySelect, Difficulty } from "@/components/ducks/DifficultySelect";

const DucksInARow = () => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);

  // Background music at page level
  useEffect(() => {
    const audio = new Audio('/audio/floral-farm.ogg');
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    const startMusic = () => {
      audio.play().catch(() => {});
    };

    audio.play().catch(() => {
      document.addEventListener('click', startMusic, { once: true });
      document.addEventListener('keydown', startMusic, { once: true });
    });

    return () => {
      audio.pause();
      audio.src = '';
      document.removeEventListener('click', startMusic);
      document.removeEventListener('keydown', startMusic);
    };
  }, []);

  const toggleMusic = useCallback(() => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  }, [isMusicPlaying]);

  const handleBackToMenu = () => {
    setSelectedDifficulty(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 px-4">
      {selectedDifficulty ? (
        <DucksGame difficulty={selectedDifficulty} onBackToMenu={handleBackToMenu} isMusicPlaying={isMusicPlaying} onToggleMusic={toggleMusic} />
      ) : (
        <DifficultySelect onSelect={setSelectedDifficulty} />
      )}
    </div>
  );
};

export default DucksInARow;