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

// Determine node type based on row position
const getNodeTypeForRow = (row: number, totalRows: number): MapNodeType => {
  // Last row is always boss
  if (row === totalRows - 1) return "boss";
  
  // Shop or rest at specific floors (rows 2, 5, 8, 11 = floors 3, 6, 9, 12)
  const SHOP_REST_ROWS = [2, 5, 8, 11];
  if (SHOP_REST_ROWS.includes(row)) {
    return Math.random() < 0.5 ? "shop" : "rest";
  }
  
  // Elite at rows 4, 7, 10 (40% chance)
  const ELITE_ROWS = [4, 7, 10];
  if (ELITE_ROWS.includes(row) && Math.random() < 0.4) {
    return "elite";
  }
  
  // Events have ~15% chance on other rows
  if (Math.random() < 0.15) return "event";
  
  // Default to beach battle
  return "beach";
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
    
    // Generate nodes for this row
    for (let i = 0; i < numNodes; i++) {
      const type = row === 0 ? "beach" : getNodeTypeForRow(row, totalRows);
      
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
