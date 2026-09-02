// Slay the Waves - Map Generation (Simplified Tree Structure)

import { MapNode, MapNodeType, SlayMap, FLOORS_PER_ACT } from "./types";
import { BeachType } from "../BeachSelectionScreen";

const ALL_BEACHES: BeachType[] = [
  "quicksand", "spikeWaves", "gummyBeach", "coldWater", "crazyWaves",
  "fishNet", "nighttime", "roughWaters", "heavySand", "busyBeach"
];

// Shuffle array (Fisher-Yates)
const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Get random beach type
const getRandomBeach = (usedBeaches: BeachType[]): BeachType => {
  const available = ALL_BEACHES.filter(b => !usedBeaches.includes(b));
  if (available.length === 0) {
    return shuffle(ALL_BEACHES)[0];
  }
  return shuffle(available)[0];
};

// Roll one node's type. Types mix WITHIN a row (Slay the Spire style) —
// the old scheme typed entire rows, which made whole floors of shops/rests
// and left the run's pacing hostage to hardcoded row lists that silently
// desynced from FLOORS_PER_ACT. Constraints:
// - row 0: always beach (intro fights)
// - row 1: beach/event only (no economy nodes before any gold is earned)
// - elites: only from row 3 on, and never on the pre-boss row
// - pre-boss row additionally guarantees one rest (see rollRowTypes)
const rollNodeType = (row: number, totalRows: number): MapNodeType => {
  if (row === totalRows - 1) return "boss";
  if (row === 0) return "beach";
  if (row === 1) return Math.random() < 0.2 ? "event" : "beach";

  const isPreBoss = row === totalRows - 2;
  const eliteAllowed = row >= 3 && !isPreBoss;
  const r = Math.random();
  if (eliteAllowed) {
    // beach 50% / elite 14% / shop 11% / rest 14% / event 11%
    if (r < 0.50) return "beach";
    if (r < 0.64) return "elite";
    if (r < 0.75) return "shop";
    if (r < 0.89) return "rest";
    return "event";
  }
  // beach 60% / shop 12% / rest 16% / event 12%
  if (r < 0.60) return "beach";
  if (r < 0.72) return "shop";
  if (r < 0.88) return "rest";
  return "event";
};

// Roll a whole row's types, applying row-level guarantees:
// the floor right before the boss always offers at least one rest site.
const rollRowTypes = (row: number, totalRows: number, numNodes: number): MapNodeType[] => {
  const types = Array.from({ length: numNodes }, () => rollNodeType(row, totalRows));
  const isPreBoss = row === totalRows - 2 && numNodes > 0;
  if (isPreBoss && !types.includes("rest")) {
    types[Math.floor(Math.random() * numNodes)] = "rest";
  }
  return types;
};

// Generate the simplified tree map
export const generateMap = (actNumber: number): SlayMap => {
  const usedBeaches: BeachType[] = [];
  const allNodes: MapNode[] = [];
  const nodesByRow: MapNode[][] = [];
  const totalRows = FLOORS_PER_ACT;

  for (let row = 0; row < totalRows; row++) {
    const rowNodes: MapNode[] = [];
    
    // Determine number of nodes for this row
    let numNodes: number;
    if (row === 0) {
      // Level 1: 2 starting beach options
      numNodes = 2;
    } else if (row === 1) {
      // Level 2: 4 nodes (2 per level 1 node)
      numNodes = 4;
    } else if (row === totalRows - 1) {
      // Boss row: 1 node
      numNodes = 1;
    } else {
      // Level 3+: 5 nodes each
      numNodes = 5;
    }
    
    // Generate nodes for this row (types rolled together so row-level
    // guarantees like the pre-boss rest can be enforced)
    const rowTypes = rollRowTypes(row, totalRows, numNodes);
    for (let i = 0; i < numNodes; i++) {
      const type = rowTypes[i];

      const node: MapNode = {
        id: generateId(),
        type,
        row,
        col: i,
        visited: false,
        current: false,
        connections: [],
      };
      
      // Add beach type for combat nodes
      if (type === "beach" || type === "elite" || type === "boss") {
        node.beachType = getRandomBeach(usedBeaches);
        usedBeaches.push(node.beachType);
      }
      
      rowNodes.push(node);
    }
    
    nodesByRow.push(rowNodes);
    allNodes.push(...rowNodes);
  }
  
  // Generate connections
  for (let row = 0; row < totalRows - 1; row++) {
    const currentRow = nodesByRow[row];
    const nextRow = nodesByRow[row + 1];
    
    if (row === 0) {
      // Level 1 (2 nodes) -> Level 2 (4 nodes): each level 1 connects to 2 level 2 nodes
      // Node 0 connects to nodes 0, 1
      // Node 1 connects to nodes 2, 3
      currentRow[0].connections = [nextRow[0].id, nextRow[1].id];
      currentRow[1].connections = [nextRow[2].id, nextRow[3].id];
    } else if (row === 1) {
      // Level 2 (4 nodes) -> Level 3 (5 nodes): each level 2 connects to 2-3 level 3 nodes
      // Ensure overlap so all 5 are reachable
      currentRow[0].connections = [nextRow[0].id, nextRow[1].id];
      currentRow[1].connections = [nextRow[1].id, nextRow[2].id];
      currentRow[2].connections = [nextRow[2].id, nextRow[3].id];
      currentRow[3].connections = [nextRow[3].id, nextRow[4].id];
    } else if (nextRow.length === 1) {
      // Connecting to boss: all nodes connect to the single boss
      currentRow.forEach(node => {
        node.connections = [nextRow[0].id];
      });
    } else {
      // Level 3+ (5 nodes) -> Next level (5 nodes): each connects to 3 adjacent nodes
      currentRow.forEach((node, i) => {
        // Connect to nodes at positions i-1, i, i+1 (clamped to valid range)
        const targets: string[] = [];
        for (let offset = -1; offset <= 1; offset++) {
          const targetIdx = Math.max(0, Math.min(nextRow.length - 1, i + offset));
          const targetId = nextRow[targetIdx].id;
          if (!targets.includes(targetId)) {
            targets.push(targetId);
          }
        }
        node.connections = targets;
      });
      
      // Ensure all next row nodes have at least one incoming connection
      nextRow.forEach((nextNode, nextIdx) => {
        const hasIncoming = currentRow.some(curr => curr.connections.includes(nextNode.id));
        if (!hasIncoming) {
          // Connect from closest node
          const closestIdx = Math.max(0, Math.min(currentRow.length - 1, nextIdx));
          if (!currentRow[closestIdx].connections.includes(nextNode.id)) {
            currentRow[closestIdx].connections.push(nextNode.id);
          }
        }
      });
    }
  }
  
  // Mark first row nodes as available (no current node yet - player picks first)
  return {
    nodes: allNodes,
    currentNodeId: null, // No starting node - player picks from level 1
    actNumber,
  };
};

// Get available next nodes from current position
export const getAvailableNodes = (map: SlayMap): MapNode[] => {
  // If no current node, return all level 1 nodes (row 0)
  if (!map.currentNodeId) {
    return map.nodes.filter(n => n.row === 0);
  }
  
  const currentNode = map.nodes.find(n => n.id === map.currentNodeId);
  if (!currentNode) return [];
  
  return map.nodes.filter(n => currentNode.connections.includes(n.id));
};

// Move to a node
export const moveToNode = (map: SlayMap, nodeId: string): SlayMap => {
  const newNodes = map.nodes.map(n => ({
    ...n,
    visited: n.id === nodeId ? true : n.visited,
    current: n.id === nodeId,
  }));
  
  // Also mark the previous current node as visited
  const currentNode = map.nodes.find(n => n.current);
  if (currentNode) {
    const idx = newNodes.findIndex(n => n.id === currentNode.id);
    if (idx !== -1) {
      newNodes[idx].visited = true;
      newNodes[idx].current = false;
    }
  }
  
  return {
    ...map,
    currentNodeId: nodeId,
    nodes: newNodes,
  };
};
