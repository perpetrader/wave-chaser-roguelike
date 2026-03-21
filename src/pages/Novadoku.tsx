import { Link } from "react-router-dom";
import { NovadokuGame } from "@/components/novadoku/NovadokuGame";
import { useEffect, useRef, useState, useCallback } from "react";

import cosmicBg from "@/assets/mastermind/backgrounds/cosmic.png";
import energyBg from "@/assets/mastermind/backgrounds/energy.png";
import magicBg from "@/assets/mastermind/backgrounds/magic.png";
import cyberBg from "@/assets/mastermind/backgrounds/cyber.png";
import distortionBg from "@/assets/mastermind/backgrounds/distortion.png";
import floralBg from "@/assets/mastermind/backgrounds/floral.png";
import moxieBg from "@/assets/mastermind/backgrounds/moxie.png";
import centralBg from "@/assets/mastermind/backgrounds/central.png";
import boomBg from "@/assets/mastermind/backgrounds/boom.png";

const backgrounds = [
  cosmicBg,
  energyBg,
  magicBg,
  cyberBg,
  distortionBg,
  floralBg,
  moxieBg,
  centralBg,
  boomBg,
];

const Novadoku = () => {
  const backgroundRef = useRef(
    backgrounds[Math.floor(Math.random() * backgrounds.length)]
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);

  useEffect(() => {
    audioRef.current = new Audio("/audio/floral-farm.ogg");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;

    const playAudio = () => {
      audioRef.current?.play().catch(() => {});
    };

    document.addEventListener("click", playAudio, { once: true });
    document.addEventListener("touchstart", playAudio, { once: true });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      document.removeEventListener("click", playAudio);
      document.removeEventListener("touchstart", playAudio);
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

  return (
    <div
      className="min-h-screen flex flex-col items-center py-6 px-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundRef.current})` }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        <Link
          to="/"
          className="text-white/70 hover:text-white text-sm mb-2 transition-colors"
        >
          ← Back to Games
        </Link>

        <h1 className="text-3xl sm:text-4xl font-display text-gradient mb-6 drop-shadow-lg text-center">
          NOVA NUMBERS
        </h1>

        <NovadokuGame isMusicPlaying={isMusicPlaying} onToggleMusic={toggleMusic} />
      </div>
    </div>
  );
};

export default Novadoku;
