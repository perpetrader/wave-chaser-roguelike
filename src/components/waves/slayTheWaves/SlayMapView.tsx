// Slay the Waves - Ocean Voyage Map

import { useMemo, useRef, useEffect } from "react";
import { MapNode, SlayMap, FLOORS_PER_ACT } from "./types";
import { Skull, Swords, Flame, HelpCircle, ShoppingBag, Crown, Coins, Anchor } from "lucide-react";
import { BEACH_COLORS } from "../beachColors";
import { BeachType } from "../BeachSelectionScreen";

interface SlayMapViewProps {
  map: SlayMap;
  availableNodeIds: string[];
  onSelectNode: (nodeId: string) => void;
  gold: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAP_WIDTH = 340;
const MAP_PADDING_X = 35;
const MAP_PADDING_TOP = 80;
const MAP_PADDING_BOTTOM = 50;
const ROW_HEIGHT = 90;
const NODE_SIZE = 42;
const BOSS_NODE_SIZE = 56;

const ACT_THEMES = [
  { name: "The Shallows", waterTop: "hsl(195, 70%, 35%)", waterBot: "hsl(200, 75%, 25%)", accent: "hsl(180, 70%, 50%)" },
  { name: "The Deep", waterTop: "hsl(210, 75%, 25%)", waterBot: "hsl(220, 80%, 15%)", accent: "hsl(200, 60%, 45%)" },
  { name: "The Abyss", waterTop: "hsl(230, 60%, 18%)", waterBot: "hsl(240, 50%, 8%)", accent: "hsl(270, 50%, 40%)" },
];

// ─── Node Type Config ─────────────────────────────────────────────────────────

const NODE_CONFIG: Record<string, {
  icon: React.ReactNode;
  bg: string;
  border: string;
  glow: string;
  emoji: string;
}> = {
  beach: {
    icon: <Swords className="w-4 h-4" />,
    bg: "rgba(37, 99, 235, 0.5)",
    border: "rgba(96, 165, 250, 0.6)",
    glow: "rgba(96, 165, 250, 0.4)",
    emoji: "🏝️",
  },
  elite: {
    icon: <Skull className="w-4 h-4" />,
    bg: "rgba(234, 88, 12, 0.5)",
    border: "rgba(251, 146, 60, 0.6)",
    glow: "rgba(251, 146, 60, 0.4)",
    emoji: "⚡",
  },
  rest: {
    icon: <Flame className="w-4 h-4" />,
    bg: "rgba(22, 163, 74, 0.5)",
    border: "rgba(74, 222, 128, 0.6)",
    glow: "rgba(74, 222, 128, 0.4)",
    emoji: "🔥",
  },
  shop: {
    icon: <ShoppingBag className="w-4 h-4" />,
    bg: "rgba(202, 138, 4, 0.5)",
    border: "rgba(250, 204, 21, 0.6)",
    glow: "rgba(250, 204, 21, 0.4)",
    emoji: "⛵",
  },
  event: {
    icon: <HelpCircle className="w-4 h-4" />,
    bg: "rgba(147, 51, 234, 0.5)",
    border: "rgba(192, 132, 252, 0.6)",
    glow: "rgba(192, 132, 252, 0.4)",
    emoji: "🐚",
  },
  boss: {
    icon: <Crown className="w-5 h-5" />,
    bg: "rgba(220, 38, 38, 0.6)",
    border: "rgba(248, 113, 113, 0.8)",
    glow: "rgba(248, 113, 113, 0.6)",
    emoji: "🌊",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jitter(nodeId: string, axis: "x" | "y"): number {
  let hash = 0;
  const salt = axis === "x" ? 7 : 13;
  for (let i = 0; i < nodeId.length; i++) {
    hash = ((hash << 5) - hash + nodeId.charCodeAt(i) + salt) | 0;
  }
  return ((hash % 17) - 8) * 0.7;
}

function getNodeX(node: MapNode, nodesInRow: MapNode[]): number {
  const count = nodesInRow.length;
  if (count === 1) return MAP_WIDTH / 2;
  const usableWidth = MAP_WIDTH - MAP_PADDING_X * 2;
  const spacing = usableWidth / (count - 1);
  const idx = nodesInRow.findIndex((n) => n.id === node.id);
  return MAP_PADDING_X + idx * spacing + jitter(node.id, "x");
}

function getNodeY(node: MapNode, maxRow: number): number {
  const invertedRow = maxRow - node.row;
  return MAP_PADDING_TOP + invertedRow * ROW_HEIGHT + jitter(node.id, "y");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SlayMapView({ map, availableNodeIds, onSelectNode, gold }: SlayMapViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const actTheme = ACT_THEMES[(map.actNumber - 1) % 3];

  const rowGroups = useMemo(() => {
    const groups: Record<number, MapNode[]> = {};
    for (const node of map.nodes) {
      if (!groups[node.row]) groups[node.row] = [];
      groups[node.row].push(node);
    }
    for (const row of Object.values(groups)) row.sort((a, b) => a.col - b.col);
    return groups;
  }, [map.nodes]);

  const maxRow = useMemo(() => Math.max(...map.nodes.map((n) => n.row)), [map.nodes]);
  const totalHeight = MAP_PADDING_TOP + (maxRow + 1) * ROW_HEIGHT + MAP_PADDING_BOTTOM;

  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    for (const node of map.nodes) {
      const nodesInRow = rowGroups[node.row] || [];
      positions[node.id] = { x: getNodeX(node, nodesInRow), y: getNodeY(node, maxRow) };
    }
    return positions;
  }, [map.nodes, rowGroups, maxRow]);

  const connections = useMemo(() => {
    const lines: { from: string; to: string; fromNode: MapNode; toNode: MapNode }[] = [];
    for (const node of map.nodes) {
      for (const targetId of node.connections) {
        const targetNode = map.nodes.find((n) => n.id === targetId);
        if (targetNode) lines.push({ from: node.id, to: targetId, fromNode: node, toNode: targetNode });
      }
    }
    return lines;
  }, [map.nodes]);

  const availableSet = useMemo(() => new Set(availableNodeIds), [availableNodeIds]);
  const currentNode = useMemo(() => map.nodes.find((n) => n.current), [map.nodes]);

  useEffect(() => {
    if (!currentNode || !scrollRef.current) return;
    const pos = nodePositions[currentNode.id];
    if (pos) scrollRef.current.scrollTop = pos.y - 200;
  }, [currentNode, nodePositions]);

  function renderPath(fromId: string, toId: string): string {
    const from = nodePositions[fromId];
    const to = nodePositions[toId];
    if (!from || !to) return "";
    const dy = to.y - from.y;
    return `M ${from.x} ${from.y} C ${from.x} ${from.y + dy * 0.35}, ${to.x} ${from.y + dy * 0.65}, ${to.x} ${to.y}`;
  }

  function getLineState(conn: typeof connections[0]): "available" | "visited" | "background" {
    if (currentNode && conn.fromNode.id === currentNode.id && availableSet.has(conn.toNode.id)) return "available";
    if (!currentNode && conn.fromNode.row === 0 && availableSet.has(conn.fromNode.id)) return "available";
    if (conn.fromNode.visited && conn.toNode.visited) return "visited";
    if (conn.fromNode.visited || conn.toNode.visited) return "visited";
    return "background";
  }

  return (
    <div className="flex flex-col h-full" style={{ background: `linear-gradient(to bottom, ${actTheme.waterTop}, ${actTheme.waterBot})` }}>
      {/* Header */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
        <div>
          <h2 className="text-lg font-display text-white flex items-center gap-2">
            <Anchor className="w-4 h-4 text-cyan-400/70" />
            Act {map.actNumber}
            <span className="text-white/40 text-sm font-normal">
              — {actTheme.name}
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-yellow-400">
          <Coins className="w-4 h-4" />
          <span className="font-mono font-bold text-sm">{gold}</span>
        </div>
      </div>

      {/* Scrollable map */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {/* Ocean texture layer */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.06 }}>
          <svg width="100%" height="100%">
            <pattern id="waves-pattern" x="0" y="0" width="120" height="20" patternUnits="userSpaceOnUse">
              <path d="M 0 10 Q 30 0 60 10 Q 90 20 120 10" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#waves-pattern)" />
          </svg>
        </div>

        {/* Animated wave shimmer lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0"
              style={{
                top: `${15 + i * 16}%`,
                height: 1,
                background: `linear-gradient(to right, transparent 0%, ${actTheme.accent}33 30%, ${actTheme.accent}22 50%, ${actTheme.accent}33 70%, transparent 100%)`,
                animation: `shimmer ${3 + i * 0.5}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>

        <div className="relative" style={{ width: MAP_WIDTH, height: totalHeight, margin: "0 auto" }}>
          {/* SVG connection lines */}
          <svg className="absolute inset-0 pointer-events-none" width={MAP_WIDTH} height={totalHeight} style={{ overflow: "visible" }}>
            <defs>
              <filter id="line-glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Dashed sea route pattern */}
              <filter id="route-glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Pass 1: Background — faint dashed sea routes */}
            {connections.map((conn) => {
              const path = renderPath(conn.from, conn.to);
              if (!path) return null;
              return (
                <path
                  key={`bg-${conn.from}-${conn.to}`}
                  d={path}
                  fill="none"
                  stroke="rgba(255,255,255,0.20)"
                  strokeWidth="1.5"
                  strokeDasharray="6 6"
                />
              );
            })}

            {/* Pass 2: Visited — golden sailed routes */}
            {connections.map((conn) => {
              if (getLineState(conn) !== "visited") return null;
              const path = renderPath(conn.from, conn.to);
              if (!path) return null;
              return (
                <path
                  key={`vis-${conn.from}-${conn.to}`}
                  d={path}
                  fill="none"
                  stroke="rgba(251, 191, 36, 0.45)"
                  strokeWidth="2.5"
                  strokeDasharray="8 4"
                  filter="url(#route-glow)"
                />
              );
            })}

            {/* Pass 3: Available — bright glowing routes */}
            {connections.map((conn) => {
              if (getLineState(conn) !== "available") return null;
              const path = renderPath(conn.from, conn.to);
              if (!path) return null;
              return (
                <g key={`avail-${conn.from}-${conn.to}`}>
                  {/* Glow layer */}
                  <path d={path} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="8" filter="url(#line-glow)" />
                  {/* Main line */}
                  <path d={path} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" />
                  {/* Dotted overlay for texture */}
                  <path d={path} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeDasharray="2 6" />
                </g>
              );
            })}
          </svg>

          {/* Floor labels */}
          {Object.keys(rowGroups).map((rowStr) => {
            const row = parseInt(rowStr);
            const dummyNode = { row, id: `f${row}`, col: 0, type: "beach" as const, connections: [], visited: false, current: false };
            const y = getNodeY(dummyNode, maxRow);
            return (
              <div key={`floor-${row}`} className="absolute text-xs font-mono" style={{ left: 4, top: y - 6, color: `${actTheme.accent}55` }}>
                {row + 1}
              </div>
            );
          })}

          {/* Island nodes */}
          {map.nodes.map((node) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;

            const config = NODE_CONFIG[node.type] || NODE_CONFIG.beach;
            const isAvailable = availableSet.has(node.id);
            const isCurrent = node.current;
            const isVisited = node.visited && !isCurrent;
            const isBoss = node.type === "boss";
            const size = isBoss ? BOSS_NODE_SIZE : NODE_SIZE;
            const half = size / 2;

            return (
              <button
                key={node.id}
                onClick={() => isAvailable && onSelectNode(node.id)}
                disabled={!isAvailable}
                className={`absolute flex flex-col items-center justify-center rounded-full transition-all duration-200
                  ${isAvailable ? "cursor-pointer hover:scale-115" : "cursor-default"}
                  ${isAvailable && !isCurrent ? "animate-pulse" : ""}
                `}
                style={{
                  left: pos.x - half,
                  top: pos.y - half,
                  width: size,
                  height: size,
                  background: isBoss
                    ? `radial-gradient(circle at 35% 35%, rgba(248,113,113,0.7), rgba(127,29,29,0.8))`
                    : `radial-gradient(circle at 35% 35%, ${config.bg}, rgba(0,0,0,0.3))`,
                  border: `2.5px solid ${isAvailable ? "rgba(255,255,255,0.85)" : isCurrent ? "rgba(255,255,255,0.95)" : isVisited ? "rgba(255,255,255,0.12)" : config.border}`,
                  boxShadow: isCurrent
                    ? `0 0 0 4px ${config.glow}, 0 0 25px ${config.glow}, inset 0 0 8px rgba(255,255,255,0.1)`
                    : isAvailable
                    ? `0 0 15px ${config.glow}, inset 0 0 6px rgba(255,255,255,0.05)`
                    : isVisited
                    ? "none"
                    : `0 0 8px rgba(0,0,0,0.5), inset 0 0 4px rgba(255,255,255,0.05)`,
                  opacity: isVisited ? 0.3 : 1,
                  filter: isVisited ? "grayscale(0.7) brightness(0.6)" : "none",
                  zIndex: isCurrent ? 20 : isAvailable ? 15 : 10,
                  color: isVisited ? "rgba(255,255,255,0.3)" : "white",
                }}
              >
                {config.icon}

                {/* Current node indicator */}
                {isCurrent && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce">
                    <span className="text-sm">📍</span>
                  </div>
                )}

                {/* Node type label (below node, only for available/current) */}
                {(isAvailable || isCurrent) && !isBoss && (
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-[9px] font-medium capitalize" style={{ color: config.border }}>
                      {node.type}
                    </span>
                  </div>
                )}

                {/* Boss label */}
                {isBoss && (
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                      Boss
                    </span>
                  </div>
                )}
              </button>
            );
          })}

          {/* Start label */}
          <div
            className="absolute text-center"
            style={{
              bottom: MAP_PADDING_BOTTOM - 30,
              left: 0,
              right: 0,
            }}
          >
            <span className="text-xs font-display tracking-widest uppercase" style={{ color: `${actTheme.accent}66` }}>
              ⚓ Set Sail ⚓
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 px-3 py-2.5 flex-wrap" style={{ backgroundColor: "rgba(0,0,0,0.4)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        {(["beach", "elite", "rest", "shop", "event", "boss"] as const).map((type) => {
          const config = NODE_CONFIG[type];
          return (
            <div key={type} className="flex items-center gap-1 text-xs" style={{ color: config.border }}>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: config.bg, border: `1px solid ${config.border}` }}
              >
                <span className="text-white scale-75">{config.icon}</span>
              </div>
              <span className="capitalize">{type}</span>
            </div>
          );
        })}
      </div>

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.3; transform: translateX(-10px); }
          100% { opacity: 0.7; transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
}
