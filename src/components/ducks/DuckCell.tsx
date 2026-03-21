import { cn } from "@/lib/utils";

export type DuckColor = "yellow" | "pink" | "purple" | "blue" | "green" | "rainbow";

interface DuckCellProps {
  color: DuckColor;
  onClick?: () => void;
  isHighlighted?: boolean;
}

const colorStyles: Record<DuckColor, { body: string; darker: string; glow: string }> = {
  yellow: {
    body: "from-yellow-300 to-yellow-400",
    darker: "bg-yellow-500",
    glow: "shadow-[0_0_15px_hsl(45,100%,60%,0.5)]",
  },
  pink: {
    body: "from-pink-300 to-pink-400",
    darker: "bg-pink-500",
    glow: "shadow-[0_0_15px_hsl(330,80%,65%,0.5)]",
  },
  purple: {
    body: "from-purple-700 to-purple-900",
    darker: "bg-purple-950",
    glow: "shadow-[0_0_15px_hsl(270,50%,30%,0.5)]",
  },
  blue: {
    body: "from-sky-300 to-sky-400",
    darker: "bg-sky-500",
    glow: "shadow-[0_0_15px_hsl(200,80%,55%,0.5)]",
  },
  green: {
    body: "from-emerald-300 to-emerald-400",
    darker: "bg-emerald-500",
    glow: "shadow-[0_0_15px_hsl(150,60%,50%,0.5)]",
  },
  rainbow: {
    body: "",
    darker: "",
    glow: "shadow-[0_0_20px_hsl(300,80%,60%,0.6)]",
  },
};

const getColorStops = (color: DuckColor) => {
  if (color === "rainbow") return null;
  
  const colorMap: Record<Exclude<DuckColor, "rainbow">, { light: string; dark: string }> = {
    yellow: { light: "#fef08a", dark: "#facc15" },
    pink: { light: "#fbcfe8", dark: "#f472b6" },
    purple: { light: "#7c3aed", dark: "#3b0764" },
    blue: { light: "#bae6fd", dark: "#38bdf8" },
    green: { light: "#a7f3d0", dark: "#34d399" },
  };
  
  return colorMap[color];
};

export const DuckCell = ({ color, onClick, isHighlighted }: DuckCellProps) => {
  const styles = colorStyles[color];
  const isRainbow = color === "rainbow";

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 transition-all duration-200 select-none touch-manipulation",
        "hover:scale-110 active:scale-95",
        isHighlighted && styles.glow
      )}
    >
      <svg viewBox="0 0 50 50" className="w-full h-full drop-shadow-md">
        <defs>
          {isRainbow ? (
            <>
              {/* Rainbow gradient for body - horizontal stripes */}
              <linearGradient id="rainbowBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="20%" stopColor="#f97316" />
                <stop offset="40%" stopColor="#facc15" />
                <stop offset="60%" stopColor="#22c55e" />
                <stop offset="80%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              {/* Shimmer animation */}
              <linearGradient id="rainbowShimmer" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0">
                  <animate attributeName="offset" values="-0.5;1.5" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="white" stopOpacity="0.3">
                  <animate attributeName="offset" values="0;2" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="white" stopOpacity="0">
                  <animate attributeName="offset" values="0.5;2.5" dur="2s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
            </>
          ) : (
            <linearGradient id={`bodyGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={getColorStops(color)?.light} />
              <stop offset="100%" stopColor={getColorStops(color)?.dark} />
            </linearGradient>
          )}
        </defs>
        
        {/* Body - rounded teardrop pointing right */}
        <ellipse 
          cx="22" 
          cy="30" 
          rx="16" 
          ry="14" 
          fill={isRainbow ? "url(#rainbowBodyGrad)" : `url(#bodyGrad-${color})`}
        />
        
        {/* Tail feather */}
        <ellipse 
          cx="6" 
          cy="28" 
          rx="5" 
          ry="6" 
          fill={isRainbow ? "url(#rainbowBodyGrad)" : `url(#bodyGrad-${color})`}
        />
        
        {/* Head */}
        <circle 
          cx="36" 
          cy="18" 
          r="11" 
          fill={isRainbow ? "url(#rainbowBodyGrad)" : `url(#bodyGrad-${color})`}
        />
        
        {/* Rainbow shimmer overlay */}
        {isRainbow && (
          <>
            <ellipse cx="22" cy="30" rx="16" ry="14" fill="url(#rainbowShimmer)" />
            <circle cx="36" cy="18" r="11" fill="url(#rainbowShimmer)" />
          </>
        )}
        
        {/* Highlight on head */}
        <circle 
          cx="32" 
          cy="14" 
          r="3" 
          fill="white"
          opacity="0.5"
        />
        
        {/* Eye */}
        <circle 
          cx="39" 
          cy="16" 
          r="2" 
          fill="#1f2937"
        />
        
        {/* Eye highlight */}
        <circle 
          cx="39.5" 
          cy="15" 
          r="0.7" 
          fill="white"
        />
        
        {/* Beak */}
        <ellipse 
          cx="48" 
          cy="20" 
          rx="4" 
          ry="2.5" 
          fill="#fb923c"
        />
      </svg>
    </button>
  );
};
