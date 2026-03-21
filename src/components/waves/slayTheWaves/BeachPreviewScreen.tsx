// Beach Effect Preview Screen - shows the effect before starting a beach battle

import { Button } from "@/components/ui/button";
import { BEACH_COLORS } from "../beachColors";
import { BEACH_INFO, BeachType } from "../BeachSelectionScreen";
import { MapNodeType } from "./types";
import { Waves, Skull, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeachPreviewScreenProps {
  beachType: BeachType;
  nodeType: MapNodeType;
  gold: number;
  onStart: () => void;
}

const NODE_TYPE_INFO: Record<"beach" | "elite" | "boss", { label: string; icon: React.ReactNode; color: string }> = {
  beach: { label: "Beach Battle", icon: <Waves className="w-8 h-8" />, color: "text-blue-400" },
  elite: { label: "Elite Beach", icon: <Skull className="w-8 h-8" />, color: "text-orange-400" },
  boss: { label: "Boss Beach", icon: <Crown className="w-8 h-8" />, color: "text-red-400" },
};

const BeachPreviewScreen = ({ beachType, nodeType, gold, onStart }: BeachPreviewScreenProps) => {
  const beachInfo = BEACH_INFO[beachType];
  const colors = BEACH_COLORS[beachType];
  const typeInfo = NODE_TYPE_INFO[nodeType as "beach" | "elite" | "boss"] || NODE_TYPE_INFO.beach;
  
  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full max-w-md mx-auto">
      {/* Gold display */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-yellow-500/30">
        <span className="text-yellow-400 font-bold">💰 {gold}</span>
      </div>
      
      {/* Node type header */}
      <div className={cn("flex items-center gap-3", typeInfo.color)}>
        {typeInfo.icon}
        <h2 className="text-2xl font-display">{typeInfo.label}</h2>
      </div>
      
      {/* Beach card */}
      <div className={cn(
        "w-full rounded-xl p-6 border-2 shadow-xl",
        colors.bg,
        colors.border,
      )}>
        <h3 className={cn("text-3xl font-display text-center mb-4", colors.text)}>
          {beachInfo.name}
        </h3>
        
        {/* Effect description */}
        <div className="bg-black/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-white/60 uppercase tracking-wider mb-1">Beach Effect</p>
          <p className={cn("text-lg font-medium", colors.text)}>
            {beachInfo.effectDescription}
          </p>
        </div>
        
        {/* Boss description for boss nodes */}
        {nodeType === "boss" && (
          <div className="bg-red-900/30 rounded-lg p-4 border border-red-500/30">
            <p className="text-sm text-red-400 uppercase tracking-wider mb-1">⚠️ Boss Modifier</p>
            <p className="text-white/90">
              {beachInfo.bossDescription}
            </p>
          </div>
        )}
        
        {/* Elite modifier notice */}
        {nodeType === "elite" && (
          <div className="bg-orange-900/30 rounded-lg p-4 border border-orange-500/30">
            <p className="text-sm text-orange-400 uppercase tracking-wider mb-1">⚡ Elite Challenge</p>
            <p className="text-white/90">
              Harder waves, but better rewards!
            </p>
          </div>
        )}
      </div>
      
      {/* Start button */}
      <Button
        onClick={onStart}
        size="lg"
        className={cn(
          "w-full h-14 text-xl font-display",
          "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400",
          "text-white shadow-lg"
        )}
      >
        Start Battle
      </Button>
    </div>
  );
};

export default BeachPreviewScreen;
