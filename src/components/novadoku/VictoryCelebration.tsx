import { useEffect, useState } from "react";

interface FloatingImage {
  id: number;
  x: number;
  startY: number;
  rotation: number;
  scale: number;
  duration: number;
  delay: number;
}

export const VictoryCelebration = () => {
  const [floatingImages, setFloatingImages] = useState<FloatingImage[]>([]);

  useEffect(() => {
    const count = Math.floor(Math.random() * 11) + 10; // 10-20 images
    const images: FloatingImage[] = [];

    for (let i = 0; i < count; i++) {
      images.push({
        id: i,
        x: Math.random() * 80 + 10, // 10-90% to keep within bounds
        startY: 60 + Math.random() * 30, // Start from bottom area (60-90%)
        rotation: Math.random() * 40 - 20, // -20 to +20 degrees
        scale: 0.6 + Math.random() * 0.4, // 0.6-1.0
        duration: 2 + Math.random() * 2, // 2-4 seconds
        delay: Math.random() * 1.5, // 0-1.5 second delay
      });
    }

    setFloatingImages(images);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-10">
      {floatingImages.map((img) => (
        <div
          key={img.id}
          className="absolute animate-float-up"
          style={{
            left: `${img.x}%`,
            top: `${img.startY}%`,
            animationDuration: `${img.duration}s`,
            animationDelay: `${img.delay}s`,
            transform: `rotate(${img.rotation}deg) scale(${img.scale})`,
          }}
        >
          <img
            src="/images/gg-celebration.png"
            alt="GG"
            className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
          />
        </div>
      ))}
    </div>
  );
};
