import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { NavLink } from "@/components/NavLink";
import { MastermindGame } from "@/components/mastermind/MastermindGame";
import { DifficultySelect, DIFFICULTY_CONFIG, type Difficulty } from "@/components/mastermind/DifficultySelect";

import bgBrook from "@/assets/mastermind/background.jpg";
import bgBoom from "@/assets/mastermind/backgrounds/boom.png";
import bgCentral from "@/assets/mastermind/backgrounds/central.png";
import bgCosmic from "@/assets/mastermind/backgrounds/cosmic.png";
import bgCyber from "@/assets/mastermind/backgrounds/cyber.png";
import bgEnergy from "@/assets/mastermind/backgrounds/energy.png";
import bgDistortion from "@/assets/mastermind/backgrounds/distortion.png";
import bgFloral from "@/assets/mastermind/backgrounds/floral.png";
import bgMagic from "@/assets/mastermind/backgrounds/magic.png";
import bgMoxie from "@/assets/mastermind/backgrounds/moxie.png";

const BACKGROUNDS = [
  bgBrook,
  bgBoom,
  bgCentral,
  bgCosmic,
  bgCyber,
  bgEnergy,
  bgDistortion,
  bgFloral,
  bgMagic,
  bgMoxie,
];

const Mastermind = () => {
  const [gameKey, setGameKey] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  
  const backgroundImage = useMemo(() => {
    return BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
  }, [gameKey]);

  // Background music - plays across difficulty select and game
  useEffect(() => {
    const audio = new Audio("/audio/cosmic-fields.ogg");
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;
    
    audio.play().catch(() => {
      const startAudio = () => {
        audio.play();
        document.removeEventListener("click", startAudio);
        document.removeEventListener("keydown", startAudio);
      };
      document.addEventListener("click", startAudio);
      document.addEventListener("keydown", startAudio);
    });

    return () => {
      audio.pause();
      audio.src = "";
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

  const handleRestart = () => {
    setGameKey(prev => prev + 1);
  };

  const handleSelectDifficulty = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    setGameKey(prev => prev + 1);
  };

  const handleBackToMenu = () => {
    setSelectedDifficulty(null);
  };

  const settings = selectedDifficulty ? DIFFICULTY_CONFIG[selectedDifficulty] : null;

  return (
    <div 
      className="min-h-screen py-8 px-4 bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10">
        <header className="text-center mb-6">
          <NavLink to="/" className="text-sm text-white/80 hover:text-white transition-colors mb-4 inline-block drop-shadow-md">
            ← Back to Games
          </NavLink>
          <h1 className="text-3xl sm:text-4xl font-display text-gradient drop-shadow-lg">
            NOVA CODE
          </h1>
          <p className="text-white/80 mt-2 text-sm max-w-md mx-auto drop-shadow-md">
            Guess the secret code. Each guess shows how many are in the right or wrong place, but not which ones.
          </p>
        </header>

        {selectedDifficulty && settings ? (
          <MastermindGame 
            key={gameKey} 
            onRestart={handleRestart}
            onBackToMenu={handleBackToMenu}
            codeLength={settings.slots}
            characterCount={settings.characters}
            isMusicPlaying={isMusicPlaying}
            onToggleMusic={toggleMusic}
          />
        ) : (
          <DifficultySelect onSelect={handleSelectDifficulty} />
        )}
      </div>
    </div>
  );
};

export default Mastermind;
