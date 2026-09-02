import { describe, it, expect } from "vitest";
import { generateMap, getAvailableNodes, moveToNode } from "./mapGenerator";
import { FLOORS_PER_ACT, type MapNode } from "./types";

// The generator is random, so every invariant is checked across many maps.
const MAPS = Array.from({ length: 200 }, (_, i) => generateMap((i % 3) + 1));

const byRow = (nodes: MapNode[]) => {
  const rows: MapNode[][] = [];
  for (const n of nodes) (rows[n.row] ??= []).push(n);
  return rows;
};

describe("generateMap invariants", () => {
  it("has the expected row structure (2/4/5.../1 across FLOORS_PER_ACT rows)", () => {
    for (const map of MAPS) {
      const rows = byRow(map.nodes);
      expect(rows.length).toBe(FLOORS_PER_ACT);
      expect(rows[0].length).toBe(2);
      expect(rows[1].length).toBe(4);
      expect(rows[FLOORS_PER_ACT - 1].length).toBe(1);
      for (let r = 2; r < FLOORS_PER_ACT - 1; r++) expect(rows[r].length).toBe(5);
    }
  });

  it("types the boss row as boss and row 0 as beaches", () => {
    for (const map of MAPS) {
      const rows = byRow(map.nodes);
      expect(rows[FLOORS_PER_ACT - 1][0].type).toBe("boss");
      for (const n of rows[0]) expect(n.type).toBe("beach");
    }
  });

  it("allows only beach/event on row 1 (no economy before gold exists)", () => {
    for (const map of MAPS) {
      for (const n of byRow(map.nodes)[1]) {
        expect(["beach", "event"]).toContain(n.type);
      }
    }
  });

  it("never places elites before row 3 or on the pre-boss row", () => {
    for (const map of MAPS) {
      for (const n of map.nodes) {
        if (n.type === "elite") {
          expect(n.row).toBeGreaterThanOrEqual(3);
          expect(n.row).not.toBe(FLOORS_PER_ACT - 2);
        }
      }
    }
  });

  it("guarantees at least one rest site on the pre-boss row", () => {
    for (const map of MAPS) {
      const preBoss = byRow(map.nodes)[FLOORS_PER_ACT - 2];
      expect(preBoss.some((n) => n.type === "rest")).toBe(true);
    }
  });

  it("mixes node types within rows (not every row is uniform)", () => {
    // Row-level typing was the old bug: whole floors of shops/rests.
    // With per-node rolls, the 5-node middle rows should regularly mix.
    let mixedRows = 0;
    let totalRows = 0;
    for (const map of MAPS) {
      const rows = byRow(map.nodes);
      for (let r = 2; r < FLOORS_PER_ACT - 1; r++) {
        totalRows++;
        if (new Set(rows[r].map((n) => n.type)).size > 1) mixedRows++;
      }
    }
    expect(mixedRows / totalRows).toBeGreaterThan(0.8);
  });

  it("keeps every node reachable from row 0 and connections one row forward", () => {
    for (const map of MAPS) {
      const nodesById = new Map(map.nodes.map((n) => [n.id, n]));
      // connections must point to the next row only
      for (const n of map.nodes) {
        for (const targetId of n.connections) {
          const target = nodesById.get(targetId);
          expect(target).toBeDefined();
          expect(target!.row).toBe(n.row + 1);
        }
      }
      // BFS from row 0 reaches everything
      const reached = new Set<string>();
      const queue = map.nodes.filter((n) => n.row === 0).map((n) => n.id);
      while (queue.length) {
        const id = queue.pop()!;
        if (reached.has(id)) continue;
        reached.add(id);
        queue.push(...nodesById.get(id)!.connections);
      }
      expect(reached.size).toBe(map.nodes.length);
    }
  });

  it("gives every combat node a beach type", () => {
    for (const map of MAPS) {
      for (const n of map.nodes) {
        if (n.type === "beach" || n.type === "elite" || n.type === "boss") {
          expect(n.beachType).toBeDefined();
        }
      }
    }
  });
});

describe("map navigation", () => {
  it("offers row 0 before any move, then the moved-to node's connections", () => {
    const map = MAPS[0];
    const start = getAvailableNodes(map);
    expect(start.every((n) => n.row === 0)).toBe(true);
    expect(start.length).toBe(2);

    const after = moveToNode(map, start[0].id);
    const next = getAvailableNodes(after);
    const moved = after.nodes.find((n) => n.id === start[0].id)!;
    expect(moved.current).toBe(true);
    expect(moved.visited).toBe(true);
    expect(next.map((n) => n.id).sort()).toEqual([...moved.connections].sort());
  });
});
