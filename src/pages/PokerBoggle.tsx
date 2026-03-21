import { useEffect, useRef, useState, useCallback } from "react";
import { PokerBoggleGame } from "@/components/pokerboggle/PokerBoggleGame";

const PokerBoggle = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);

  // Background music at page level
  useEffect(() => {
    const audio = new Audio('/audio/electric-village.ogg');
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

  return <PokerBoggleGame isMusicPlaying={isMusicPlaying} onToggleMusic={toggleMusic} />;
};

export default PokerBoggle;