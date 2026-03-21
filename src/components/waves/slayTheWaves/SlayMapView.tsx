// Slay the Waves - Map Visualization (Slay the Spire-style)

import { useMemo, useRef, useEffect } from "react";
import { MapNode, SlayMap, FLOORS_PER_ACT } from "./types";
import { Skull, Swords, Flame, HelpCircle, ShoppingBag, Crown, Coins } from "lucide-react";
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
const MAP_PADDING_TOP = 70;
const MAP_PADDING_BOTTOM = 40;
const ROW_HEIGHT = 85;
const NODE_SIZE = 40;
const BOSS_NODE_SIZE = 52;

const ACT_NAMES = ["The Shallows", "The Deep", "The Abyss"];

// ─── Node Type Config ─────────────────────────────────────────────────────────

const NODE_CONFIG: Record<string, {
  icon: React.ReactNode;
  bg: string;
  border: string;
  glow: string;
}> = {
  beach: {
    icon: <Swords className="w-4 h-4" />,
    bg: "rgba(37, 99, 235, 0.4)",
    border: "rgba(96, 165, 250, 0.5)",
    glow: "rgba(96, 165, 250, 0.3)",
  },
  elite: {
    icon: <Skull className="w-4 h-4" />,
    bg: "rgba(234, 88, 12, 0.4)",
    border: "rgba(251, 146, 60, 0.5)",
    glow: "rgba(251, 146, 60, 0.3)",
  },
  rest: {
    icon: <Flame className="w-4 h-4" />,
    bg: "rgba(22, 163, 74, 0.4)",
    border: "rgba(74, 222, 128, 0.5)",
    glow: "rgba(74, 222, 128, 0.3)",
  },
  shop: {
    icon: <ShoppingBag className="w-4 h-4" />,
    bg: "rgba(202, 138, 4, 0.4)",
    border: "rgba(250, 204, 21, 0.5)",
    glow: "rgba(250, 204, 21, 0.3)",
  },
  event: {
    icon: <HelpCircle className="w-4 h-4" />,
    bg: "rgba(147, 51, 234, 0.4)",
    border: "rgba(192, 132, 252, 0.5)",
    glow: "rgba(192, 132, 252, 0.3)",
  },
  boss: {
    icon: <Crown className="w-5 h-5" />,
    bg: "rgba(220, 38, 38, 0.6)",
    border: "rgba(248, 113, 113, 0.7)",
    glow: "rgba(248, 113, 113, 0.5)",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Deterministic jitter based on node id */
function jitter(nodeId: string, axis: "x" | "y"): number {
  let hash = 0;
  const salt = axis === "x" ? 7 : 13;
  for (let i = 0; i < nodeId.length; i++) {
    hash = ((hash << 5) - hash + nodeId.charCodeAt(i) + salt) | 0;
  }
  return ((hash % 17) - 8) * 0.8; // ±6px
}

/** Get the X position for a node in its row */
function getNodeX(node: MapNode, nodesInRow: MapNode[]): number {
  const count = nodesInRow.length;
  if (count === 1) return MAP_WIDTH / 2;

  const usableWidth = MAP_WIDTH - MAP_PADDING_X * 2;
  const spacing = usableWidth / (count - 1);
  const idx = nodesInRow.findIndex((n) => n.id === node.id);
  return MAP_PADDING_X + idx * spacing + jitter(node.id, "x");
}

/** Get the Y position for a node (bottom-to-top, row 0 at bottom) */
function getNodeY(node: MapNode, maxRow: number): number {
  const invertedRow = maxRow - node.row;
  return MAP_PADDING_TOP + invertedRow * ROW_HEIGHT + jitter(node.id, "y");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SlayMapView({ map, availableNodeIds, onSelectNode, gold }: SlayMapViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group nodes by row
  const rowGroups = useMemo(() => {
    const groups: Record<number, MapNode[]> = {};
    for (const node of map.nodes) {
      if (!groups[node.row]) groups[node.row] = [];
      groups[node.row].push(node);
    }
    // Sort each row by col
    for (const row of Object.values(groups)) {
      row.sort((a, b) => a.col - b.col);
    }
    return groups;
  }, [map.nodes]);

  const maxRow = useMemo(() => Math.max(...map.nodes.map((n) => n.row)), [map.nodes]);
  const totalHeight = MAP_PADDING_TOP + (maxRow + 1) * ROW_HEIGHT + MAP_PADDING_BOTTOM;

  // Compute pixel positions for each node
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    for (const node of map.nodes) {
      const nodesInRow = rowGroups[node.row] || [];
      positions[node.id] = {
        x: getNodeX(node, nodesInRow),
        y: getNodeY(node, maxRow),
      };
    }
    return positions;
  }, [map.nodes, rowGroups, maxRow]);

  // Build connection data
  const connections = useMemo(() => {
    const lines: { from: string; to: string; fromNode: MapNode; toNode: MapNode }[] = [];
    for (const node of map.nodes) {
      for (const targetId of node.connections) {
        const targetNode = map.nodes.find((n) => n.id === targetId);
        if (targetNode) {
          lines.push({ from: node.id, to: targetId, fromNode: node, toNode: targetNode });
        }
      }
    }
    return lines;
  }, [map.nodes]);

  // Available set for fast lookup
  const availableSet = useMemo(() => new Set(availableNodeIds), [availableNodeIds]);

  // Current node
  const currentNode = useMemo(() => map.nodes.find((n) => n.current), [map.nodes]);

  // Auto-scroll to current node
  useEffect(() => {
    if (!currentNode || !scrollRef.current) return;
    const pos = nodePositions[currentNode.id];
    if (pos) {
      scrollRef.current.scrollTop = pos.y - 200;
    }
  }, [currentNode, nodePositions]);

  // ─── SVG path for a connection ──────────────────────────────────────────

  function renderPath(fromId: string, toId: string): string {
    const from = nodePositions[fromId];
    const to = nodePositions[toId];
    if (!from || !to) return "";

    const dy = to.y - from.y;
    const cp1y = from.y + dy * 0.33;
    const cp2y = from.y + dy * 0.66;
    return `M ${from.x} ${from.y} C ${from.x} ${cp1y}, ${to.x} ${cp2y}, ${to.x} ${to.y}`;
  }

  // ─── Determine line state ──────────────────────────────────────────────

  function getLineState(conn: typeof connections[0]): "available" | "visited" | "background" {
    // Available: from current node to an available node
    if (currentNode && conn.fromNode.id === currentNode.id && availableSet.has(conn.toNode.id)) {
      return "available";
    }
    // Also available: from start (no current) to available nodes
    if (!currentNode && conn.fromNode.row === 0 && availableSet.has(conn.fromNode.id)) {
      return "available";
    }
    // Visited: both nodes visited
    if (conn.fromNode.visited && conn.toNode.visited) {
      return "visited";
    }
    // Visited: from current to a visited node
    if (conn.fromNode.visited || conn.toNode.visited) {
      return "visited";
    }
    return "background";
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-white/10">
        <div>
          <h2 className="text-lg font-display text-white">
            Act {map.actNumber}
            <span className="text-white/40 text-sm ml-2 font-normal">
              — {ACT_NAMES[(map.actNumber - 1) % 3]}
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
        <div className="relative" style={{ width: MAP_WIDTH, height: totalHeight, margin: "0 auto" }}>

          {/* SVG layer for all connection lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={MAP_WIDTH}
            height={totalHeight}
            style={{ overflow: "visible" }}
          >
            {/* SVG filter for glow effect */}
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Pass 1: Background lines (all connections, faint) */}
            {connections.map((conn) => {
              const path = renderPath(conn.from, conn.to);
              if (!path) return null;
              return (
                <path
                  key={`bg-${conn.from}-${conn.to}`}
                  d={path}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                />
              );
            })}

            {/* Pass 2: Visited lines (solid gold) */}
            {connections.map((conn) => {
              if (getLineState(conn) !== "visited") return null;
              const path = renderPath(conn.from, conn.to);
              if (!path) return null;
              return (
                <path
                  key={`vis-${conn.from}-${conn.to}`}
                  d={path}
                  fill="none"
                  stroke="rgba(251, 191, 36, 0.5)"
                  strokeWidth="2"
                />
              );
            })}

            {/* Pass 3: Available lines (bright white with glow) */}
            {connections.map((conn) => {
              if (getLineState(conn) !== "available") return null;
              const path = renderPath(conn.from, conn.to);
              if (!path) return null;
              return (
                <path
                  key={`avail-${conn.from}-${conn.to}`}
                  d={path}
                  fill="none"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="2.5"
                  filter="url(#glow)"
                />
              );
            })}
          </svg>

          {/* Floor labels */}
          {Object.keys(rowGroups).map((rowStr) => {
            const row = parseInt(rowStr);
            const y = getNodeY({ row, id: "", col: 0, type: "beach", connections: [], visited: false, current: false }, maxRow);
            return (
              <div
                key={`floor-${row}`}
                className="absolute text-white/20 text-xs font-mono"
                style={{ left: 4, top: y - 6 }}
              >
                {row + 1}
              </div>
            );
          })}

          {/* Node layer */}
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
                className={`absolute flex items-center justify-center rounded-full transition-all duration-200
                  ${isAvailable ? "cursor-pointer hover:scale-110" : "cursor-default"}
                  ${isAvailable && !isCurrent ? "animate-pulse" : ""}
                `}
                style={{
                  left: pos.x - half,
                  top: pos.y - half,
                  width: size,
                  height: size,
                  backgroundColor: config.bg,
                  border: `2px solid ${isAvailable ? "rgba(255,255,255,0.8)" : isCurrent ? "rgba(255,255,255,0.9)" : isVisited ? "rgba(255,255,255,0.15)" : config.border}`,
                  boxShadow: isCurrent
                    ? `0 0 0 3px ${config.glow}, 0 0 20px ${config.glow}`
                    : isAvailable
                    ? `0 0 12px ${config.glow}`
                    : "none",
                  opacity: isVisited ? 0.35 : 1,
                  filter: isVisited ? "grayscale(0.6)" : "none",
                  zIndex: isCurrent ? 20 : isAvailable ? 15 : 10,
                  color: isVisited ? "rgba(255,255,255,0.4)" : "white",
                }}
              >
                {config.icon}

                {/* Current node indicator */}
                {isCurrent && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-white animate-bounce text-xs"
                  >
                    ▼
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 px-3 py-2 bg-slate-900/80 border-t border-white/10 flex-wrap">
        {(["beach", "elite", "rest", "shop", "event", "boss"] as const).map((type) => {
          const config = NODE_CONFIG[type];
          return (
            <div key={type} className="flex items-center gap-1 text-white/50 text-xs">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: config.bg, border: `1px solid ${config.border}` }}
              >
                <span className="text-white scale-75">{config.icon}</span>
              </div>
              <span className="capitalize">{type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
