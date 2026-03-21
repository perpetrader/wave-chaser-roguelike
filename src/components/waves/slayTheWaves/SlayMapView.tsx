// Slay the Waves - Map Visualization Component

import { useMemo } from "react";
import { MapNode, SlayMap, FLOORS_PER_ACT } from "./types";
import { Skull, Waves, Coffee, Sparkles, ShoppingBag, HelpCircle, Snowflake, Fish, Moon, Wind, Clock, Footprints, Zap, Anchor } from "lucide-react";
import { BEACH_COLORS } from "../beachColors";
import { BEACH_INFO, BeachType } from "../BeachSelectionScreen";
import { cn } from "@/lib/utils";

interface SlayMapViewProps {
  map: SlayMap;
  availableNodeIds: string[];
  onSelectNode: (nodeId: string) => void;
  gold: number;
}

// Beach-specific icons for combat nodes
const BEACH_ICONS: Record<BeachType, React.ReactNode> = {
  quicksand: <Clock className="w-4 h-4" />,
  spikeWaves: <Zap className="w-4 h-4" />,
  gummyBeach: <Footprints className="w-4 h-4" />,
  coldWater: <Snowflake className="w-4 h-4" />,
  crazyWaves: <Wind className="w-4 h-4" />,
  fishNet: <Fish className="w-4 h-4" />,
  nighttime: <Moon className="w-4 h-4" />,
  roughWaters: <Anchor className="w-4 h-4" />,
  heavySand: <Footprints className="w-4 h-4" />,
  busyBeach: <Waves className="w-4 h-4" />,
};

const NODE_ICONS: Record<string, React.ReactNode> = {
  beach: <Waves className="w-5 h-5" />,
  elite: <Skull className="w-5 h-5" />,
  rest: <Coffee className="w-5 h-5" />,
  event: <HelpCircle className="w-5 h-5" />,
  shop: <ShoppingBag className="w-5 h-5" />,
  boss: <Skull className="w-6 h-6" />,
};

const NODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  beach: { bg: "bg-blue-500/30", border: "border-blue-400", text: "text-blue-300" },
  elite: { bg: "bg-orange-500/30", border: "border-orange-400", text: "text-orange-300" },
  rest: { bg: "bg-green-500/30", border: "border-green-400", text: "text-green-300" },
  event: { bg: "bg-purple-500/30", border: "border-purple-400", text: "text-purple-300" },
  shop: { bg: "bg-yellow-500/30", border: "border-yellow-400", text: "text-yellow-300" },
  boss: { bg: "bg-red-500/30", border: "border-red-400", text: "text-red-300" },
};

const SlayMapView = ({ map, availableNodeIds, onSelectNode, gold }: SlayMapViewProps) => {
  // Group nodes by row
  const nodesByRow = useMemo(() => {
    const grouped: Record<number, MapNode[]> = {};
    map.nodes.forEach(node => {
      if (!grouped[node.row]) grouped[node.row] = [];
      grouped[node.row].push(node);
    });
    // Sort nodes within each row by column
    Object.values(grouped).forEach(row => row.sort((a, b) => a.col - b.col));
    return grouped;
  }, [map.nodes]);

  // Helper to get column position as percentage based on nodes in row
  const getColPercent = (col: number, totalCols: number) => {
    if (totalCols === 1) return 50; // Center single node
    if (totalCols === 2) return 25 + (col * 50); // 25%, 75%
    if (totalCols === 4) return 12.5 + (col * 25); // 12.5%, 37.5%, 62.5%, 87.5%
    if (totalCols === 5) return 10 + (col * 20); // 10%, 30%, 50%, 70%, 90%
    // Default fallback for any other number
    const spacing = 80 / Math.max(1, totalCols - 1);
    return 10 + (col * spacing);
  };

  // Generate SVG path for curved connection
  const generateCurvedPath = (startX: number, endX: number): string => {
    const startY = 0;
    const endY = 100;
    const midY = 50;
    // Control points for smooth bezier curve
    const controlOffset = Math.abs(endX - startX) * 0.3;
    return `M ${startX} ${startY} C ${startX} ${midY - controlOffset}, ${endX} ${midY + controlOffset}, ${endX} ${endY}`;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full max-w-lg mx-auto">
      {/* Header with gold */}
      <div className="flex items-center justify-between w-full bg-slate-900/70 rounded-lg p-3 border border-slate-600">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-lg font-display text-amber-400">Act {map.actNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-bold">💰 {gold}</span>
        </div>
      </div>

      {/* Map scroll container */}
      <div className="w-full h-[60vh] overflow-y-auto bg-slate-900/50 rounded-xl border border-slate-600 p-4">
        <div className="flex flex-col-reverse gap-12 pb-4">
          {Array.from({ length: FLOORS_PER_ACT }, (_, i) => i).map(row => {
            const rowNodes = nodesByRow[row] || [];
            const nextRowNodes = nodesByRow[row + 1] || [];
            
            return (
              <div key={row} className="relative">
                {/* Row label */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-xs text-white/30 font-mono">
                  {row + 1}
                </div>
                
                {/* Nodes in this row */}
                <div className="relative w-full min-h-[70px]">
                  {rowNodes.length === 0 ? (
                    <div className="w-12 h-12 mx-auto" />
                  ) : (
                    <div className="flex justify-center">
                      <div className="relative w-full max-w-[320px]">
                        {rowNodes.map(node => {
                          const isAvailable = availableNodeIds.includes(node.id);
                          const isCurrent = node.current;
                          const isVisited = node.visited;
                          const isCombatNode = ["beach", "elite", "boss"].includes(node.type);
                          const beachColors = node.beachType ? BEACH_COLORS[node.beachType] : null;
                          const beachInfo = node.beachType ? BEACH_INFO[node.beachType] : null;
                          const defaultColors = NODE_COLORS[node.type];
                          
                          // Use beach colors for combat nodes, default colors for others
                          const colors = isCombatNode && beachColors ? {
                            bg: beachColors.bg,
                            border: beachColors.border,
                            text: beachColors.text,
                          } : defaultColors;
                          
                          const leftPercent = getColPercent(node.col, rowNodes.length);
                          
                          return (
                            <button
                              key={node.id}
                              onClick={() => isAvailable && onSelectNode(node.id)}
                              disabled={!isAvailable}
                              style={{ left: `${leftPercent}%` }}
                              className={cn(
                                "absolute flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all duration-200",
                                "w-[75px] -translate-x-1/2",
                                isAvailable && "cursor-pointer hover:scale-110 hover:shadow-lg hover:shadow-white/20",
                                isAvailable && "animate-pulse",
                                isCurrent && "ring-4 ring-white/50 scale-110",
                                isVisited && !isCurrent && "opacity-40 grayscale",
                                !isAvailable && !isVisited && !isCurrent && "opacity-60",
                                colors.bg,
                                isAvailable ? "border-white shadow-lg shadow-white/30" : colors.border,
                              )}
                            >
                              {/* Node icon - use beach icon for combat nodes */}
                              <div className={cn(
                                "p-2 rounded-full flex items-center justify-center",
                                isCombatNode ? "bg-slate-800/80" : colors.bg,
                              )}>
                                <span className={colors.text}>
                                  {isCombatNode && node.beachType ? (
                                    <div className="flex items-center gap-0.5">
                                      {BEACH_ICONS[node.beachType]}
                                      {node.type === "boss" && <Skull className="w-3 h-3 text-red-400" />}
                                      {node.type === "elite" && <Skull className="w-3 h-3 text-orange-400" />}
                                    </div>
                                  ) : (
                                    NODE_ICONS[node.type]
                                  )}
                                </span>
                              </div>
                              
                              {/* Node label - show beach name for combat nodes */}
                              <span className={cn(
                                "text-[9px] font-medium uppercase tracking-wider text-center leading-tight",
                                colors.text,
                              )}>
                                {isCombatNode && beachInfo ? (
                                  <span className="flex flex-col">
                                    <span>{beachInfo.name.split(' ')[0]}</span>
                                    {node.type === "boss" && <span className="text-red-400">BOSS</span>}
                                    {node.type === "elite" && <span className="text-orange-400">ELITE</span>}
                                  </span>
                                ) : (
                                  node.type.toUpperCase()
                                )}
                              </span>
                              
                              {/* Current indicator */}
                              {isCurrent && (
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full animate-bounce shadow-lg shadow-white/50" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Connection lines to next row - using SVG with curved paths */}
                {row < FLOORS_PER_ACT - 1 && nextRowNodes.length > 0 && (
                  <svg 
                    className="absolute w-full left-0 pointer-events-none overflow-visible" 
                    style={{ 
                      height: '48px', 
                      top: '100%',
                      marginTop: '4px',
                    }}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      {/* Gradient for active paths */}
                      <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
                      </linearGradient>
                      {/* Glow filter */}
                      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    {rowNodes.flatMap(node => {
                      return node.connections.map(connId => {
                        const targetNode = nextRowNodes.find(n => n.id === connId);
                        if (!targetNode) return null;
                        
                        // Convert column positions to percentages based on row sizes
                        const getPathPercent = (col: number, totalCols: number) => {
                          if (totalCols === 1) return 50;
                          if (totalCols === 2) return 25 + (col * 50);
                          if (totalCols === 4) return 12.5 + (col * 25);
                          if (totalCols === 5) return 10 + (col * 20);
                          const spacing = 80 / Math.max(1, totalCols - 1);
                          return 10 + (col * spacing);
                        };
                        const startX = getPathPercent(node.col, rowNodes.length);
                        const endX = getPathPercent(targetNode.col, nextRowNodes.length);
                        
                        const isActivePath = node.visited || node.current;
                        const isNextPath = availableNodeIds.includes(targetNode.id);
                        
                        return (
                          <path
                            key={`${node.id}-${connId}`}
                            d={generateCurvedPath(startX, endX)}
                            fill="none"
                            stroke={isActivePath ? "url(#pathGradient)" : isNextPath ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"}
                            strokeWidth={isActivePath ? "2" : isNextPath ? "1.5" : "1"}
                            strokeLinecap="round"
                            filter={isActivePath ? "url(#glow)" : undefined}
                            strokeDasharray={isActivePath ? "none" : isNextPath ? "none" : "3 3"}
                          />
                        );
                      });
                    })}
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 text-xs text-white/70 bg-slate-900/50 rounded-lg p-2 border border-slate-700">
        <div className="flex items-center gap-1">
          <Waves className="w-4 h-4 text-blue-400" />
          <span>Beach</span>
        </div>
        <div className="flex items-center gap-1">
          <Skull className="w-4 h-4 text-orange-400" />
          <span>Elite</span>
        </div>
        <div className="flex items-center gap-1">
          <Coffee className="w-4 h-4 text-green-400" />
          <span>Rest</span>
        </div>
        <div className="flex items-center gap-1">
          <ShoppingBag className="w-4 h-4 text-yellow-400" />
          <span>Shop</span>
        </div>
        <div className="flex items-center gap-1">
          <HelpCircle className="w-4 h-4 text-purple-400" />
          <span>Event</span>
        </div>
        <div className="flex items-center gap-1">
          <Skull className="w-4 h-4 text-red-400" />
          <span>Boss</span>
        </div>
      </div>
    </div>
  );
};

export default SlayMapView;
