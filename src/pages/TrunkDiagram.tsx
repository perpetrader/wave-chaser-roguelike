import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Line, RoundedBox } from "@react-three/drei";
import { useState } from "react";
import * as THREE from "three";

// RAV4 cargo dims in inches, scaled down for 3D scene (1 unit = 5 inches)
const TRUNK_W = 41.5 / 5;   // ~8.3
const TRUNK_D = 37.5 / 5;   // ~7.5
const WALL_H = 10 / 5;      // 2 (10 inches tall)
const WALL_THICK = 0.06;     // thin plastic
const FLOOR_THICK = 0.05;

const PLASTIC_COLOR = "#c8d0d8";
const PLASTIC_EDGE = "#9aa5b0";
const SLOT_COLOR = "#f59e0b";

function TrunkFloor() {
  return (
    <mesh position={[0, -FLOOR_THICK / 2, 0]} receiveShadow>
      <boxGeometry args={[TRUNK_W, FLOOR_THICK, TRUNK_D]} />
      <meshStandardMaterial color="#3a3f47" roughness={0.8} />
    </mesh>
  );
}

function TrunkWalls() {
  const wallH = WALL_H;
  const halfW = TRUNK_W / 2;
  const halfD = TRUNK_D / 2;

  return (
    <group>
      {/* Left wall */}
      <mesh position={[-halfW, wallH / 2, 0]}>
        <boxGeometry args={[FLOOR_THICK, wallH, TRUNK_D]} />
        <meshStandardMaterial color="#2a2e35" transparent opacity={0.3} />
      </mesh>
      {/* Right wall */}
      <mesh position={[halfW, wallH / 2, 0]}>
        <boxGeometry args={[FLOOR_THICK, wallH, TRUNK_D]} />
        <meshStandardMaterial color="#2a2e35" transparent opacity={0.3} />
      </mesh>
      {/* Back (rear seats) */}
      <mesh position={[0, wallH / 2, -halfD]}>
        <boxGeometry args={[TRUNK_W, wallH, FLOOR_THICK]} />
        <meshStandardMaterial color="#2a2e35" transparent opacity={0.3} />
      </mesh>
      {/* Front (tailgate) */}
      <mesh position={[0, wallH / 2, halfD]}>
        <boxGeometry args={[TRUNK_W, wallH, FLOOR_THICK]} />
        <meshStandardMaterial color="#2a2e35" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// The horizontal divider (left-right) has a slot cut DOWN from the top at center
function HorizontalDivider() {
  const halfSlot = WALL_THICK * 1.5; // slot width (slightly wider than panel thickness)
  const slotDepth = WALL_H / 2;

  return (
    <group position={[0, WALL_H / 2, 0]}>
      {/* Left half */}
      <mesh position={[-TRUNK_W / 4, 0, 0]} castShadow>
        <boxGeometry args={[TRUNK_W / 2 - halfSlot, WALL_H, WALL_THICK]} />
        <meshStandardMaterial color={PLASTIC_COLOR} roughness={0.4} />
      </mesh>
      {/* Right half */}
      <mesh position={[TRUNK_W / 4, 0, 0]} castShadow>
        <boxGeometry args={[TRUNK_W / 2 - halfSlot, WALL_H, WALL_THICK]} />
        <meshStandardMaterial color={PLASTIC_COLOR} roughness={0.4} />
      </mesh>
      {/* Top bridge (above slot) */}
      <mesh position={[0, WALL_H / 4, 0]} castShadow>
        <boxGeometry args={[halfSlot * 2, WALL_H / 2, WALL_THICK]} />
        <meshStandardMaterial color={PLASTIC_COLOR} roughness={0.4} />
      </mesh>
      {/* Slot highlight */}
      <mesh position={[0, -WALL_H / 4, 0]}>
        <boxGeometry args={[halfSlot * 2.5, slotDepth + 0.02, WALL_THICK + 0.02]} />
        <meshStandardMaterial color={SLOT_COLOR} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// The vertical divider (front-back) has a slot cut UP from the bottom at center
function VerticalDivider() {
  const halfSlot = WALL_THICK * 1.5;
  const slotDepth = WALL_H / 2;

  return (
    <group position={[0, WALL_H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
      {/* Front half */}
      <mesh position={[-TRUNK_D / 4, 0, 0]} castShadow>
        <boxGeometry args={[TRUNK_D / 2 - halfSlot, WALL_H, WALL_THICK]} />
        <meshStandardMaterial color={PLASTIC_COLOR} roughness={0.4} />
      </mesh>
      {/* Back half */}
      <mesh position={[TRUNK_D / 4, 0, 0]} castShadow>
        <boxGeometry args={[TRUNK_D / 2 - halfSlot, WALL_H, WALL_THICK]} />
        <meshStandardMaterial color={PLASTIC_COLOR} roughness={0.4} />
      </mesh>
      {/* Bottom bridge (below slot) */}
      <mesh position={[0, -WALL_H / 4, 0]} castShadow>
        <boxGeometry args={[halfSlot * 2, WALL_H / 2, WALL_THICK]} />
        <meshStandardMaterial color={PLASTIC_COLOR} roughness={0.4} />
      </mesh>
      {/* Slot highlight */}
      <mesh position={[0, WALL_H / 4, 0]}>
        <boxGeometry args={[halfSlot * 2.5, slotDepth + 0.02, WALL_THICK + 0.02]} />
        <meshStandardMaterial color={SLOT_COLOR} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function TrunkItems() {
  // Section D center: [TRUNK_W/4, 0, TRUNK_D/4]
  const cx = TRUNK_W / 4;
  const cz = TRUNK_D / 4;

  return (
    <group>
      {/* Reusable grocery bag */}
      <mesh position={[cx - 0.6, 0.45, cz - 0.4]} castShadow>
        <boxGeometry args={[1.2, 0.9, 0.8]} />
        <meshStandardMaterial color="#4a7c59" roughness={0.7} />
      </mesh>
      {/* Bag handle */}
      <mesh position={[cx - 0.6, 0.95, cz - 0.4]}>
        <torusGeometry args={[0.3, 0.03, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#3d6b4a" />
      </mesh>

      {/* First aid kit */}
      <mesh position={[cx + 0.5, 0.3, cz - 0.5]} castShadow>
        <boxGeometry args={[0.8, 0.6, 0.5]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} />
      </mesh>
      {/* Cross on kit */}
      <mesh position={[cx + 0.5, 0.61, cz - 0.5]}>
        <boxGeometry args={[0.35, 0.01, 0.1]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[cx + 0.5, 0.61, cz - 0.5]}>
        <boxGeometry args={[0.1, 0.01, 0.35]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Water bottle (cylinder) */}
      <mesh position={[cx + 0.5, 0.55, cz + 0.6]} castShadow rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 1.1, 12]} />
        <meshStandardMaterial color="#2563eb" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Bottle cap */}
      <mesh position={[cx + 0.5, 1.15, cz + 0.6]}>
        <cylinderGeometry args={[0.12, 0.16, 0.1, 12]} />
        <meshStandardMaterial color="#1e40af" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Umbrella (lying flat) */}
      <mesh position={[cx - 0.5, 0.12, cz + 0.7]} castShadow rotation={[Math.PI / 2, 0, 0.3]}>
        <cylinderGeometry args={[0.06, 0.06, 1.6, 8]} />
        <meshStandardMaterial color="#1e1e1e" roughness={0.6} />
      </mesh>
      {/* Umbrella handle */}
      <mesh position={[cx - 1.2, 0.12, cz + 0.93]} rotation={[Math.PI / 2, 0, 0.3]}>
        <torusGeometry args={[0.1, 0.03, 8, 12, Math.PI]} />
        <meshStandardMaterial color="#1e1e1e" />
      </mesh>
      {/* === Section C: Dirty wet blankets === */}
      {/* Blanket 1 - crumpled heap */}
      <mesh position={[-cx + 0.1, 0.25, cz - 0.2]} castShadow rotation={[0.1, 0.4, -0.05]}>
        <boxGeometry args={[1.6, 0.5, 1.2]} />
        <meshStandardMaterial color="#5c4a3a" roughness={0.95} />
      </mesh>
      {/* Mud splotch on blanket 1 */}
      <mesh position={[-cx + 0.3, 0.51, cz - 0.1]} rotation={[-Math.PI / 2, 0, 0.2]}>
        <circleGeometry args={[0.35, 8]} />
        <meshStandardMaterial color="#3b2f1e" roughness={1} />
      </mesh>
      <mesh position={[-cx - 0.3, 0.52, cz - 0.5]} rotation={[-Math.PI / 2, 0, 1.1]}>
        <circleGeometry args={[0.2, 7]} />
        <meshStandardMaterial color="#33281a" roughness={1} />
      </mesh>

      {/* Blanket 2 - draped on top, slightly offset */}
      <mesh position={[-cx - 0.2, 0.6, cz + 0.3]} castShadow rotation={[-0.08, -0.3, 0.12]}>
        <boxGeometry args={[1.4, 0.35, 1.0]} />
        <meshStandardMaterial color="#6b5d50" roughness={0.9} />
      </mesh>
      {/* Wet sheen patch */}
      <mesh position={[-cx - 0.1, 0.79, cz + 0.2]} rotation={[-Math.PI / 2, 0, 0.5]}>
        <circleGeometry args={[0.4, 10]} />
        <meshStandardMaterial color="#4a3f33" roughness={0.2} metalness={0.15} />
      </mesh>

      {/* Blanket 3 - smaller, bunched up */}
      <mesh position={[-cx + 0.5, 0.85, cz + 0.1]} castShadow rotation={[0.15, 0.7, -0.1]}>
        <boxGeometry args={[0.9, 0.3, 0.7]} />
        <meshStandardMaterial color="#4e3d2e" roughness={0.95} />
      </mesh>
      {/* Mud drip */}
      <mesh position={[-cx + 0.6, 1.01, cz + 0.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 6]} />
        <meshStandardMaterial color="#2e2315" roughness={1} />
      </mesh>
    </group>
  );
}

function SectionLabels() {
  const y = 0.15;
  const labels = [
    { text: "A", pos: [-TRUNK_W / 4, y, -TRUNK_D / 4] as [number, number, number] },
    { text: "B", pos: [TRUNK_W / 4, y, -TRUNK_D / 4] as [number, number, number] },
    { text: "C", pos: [-TRUNK_W / 4, y, TRUNK_D / 4] as [number, number, number] },
    { text: "D", pos: [TRUNK_W / 4, y, TRUNK_D / 4] as [number, number, number] },
  ];
  return (
    <>
      {labels.map((l) => (
        <Text key={l.text} position={l.pos} rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.6} color="white" anchorX="center" anchorY="middle" fillOpacity={0.5}>
          {l.text}
        </Text>
      ))}
    </>
  );
}

function DimensionLabel({ text, position, rotation }: { text: string; position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <Text position={position} rotation={rotation || [0, 0, 0]}
      fontSize={0.3} color="white" anchorX="center" anchorY="middle" fillOpacity={0.45}>
      {text}
    </Text>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
      <directionalLight position={[-3, 4, -3]} intensity={0.3} />

      <TrunkFloor />
      <TrunkWalls />
      <HorizontalDivider />
      <VerticalDivider />
      <TrunkItems />
      <SectionLabels />

      {/* Dimension labels */}
      <DimensionLabel text='41.5" wide' position={[0, -0.3, TRUNK_D / 2 + 0.6]} />
      <DimensionLabel text='37.5" deep' position={[-TRUNK_W / 2 - 0.8, -0.3, 0]} rotation={[0, Math.PI / 2, 0]} />
      <DimensionLabel text='10" tall' position={[TRUNK_W / 2 + 0.7, WALL_H / 2, TRUNK_D / 2]} rotation={[0, -Math.PI / 4, 0]} />

      <DimensionLabel text="← REAR SEATS" position={[0, WALL_H + 0.4, -TRUNK_D / 2]} />
      <DimensionLabel text="TAILGATE →" position={[0, WALL_H + 0.4, TRUNK_D / 2]} />

      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={18}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

const TrunkDiagram = () => {
  return (
    <div className="min-h-screen bg-[hsl(220,20%,12%)] text-white flex flex-col items-center py-8 px-4">
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">Trunk Divider System</h1>
      <p className="text-white/60 text-sm mb-2">2024 Toyota RAV4 — Interlocking Cross Divider</p>
      <p className="text-white/40 text-xs mb-4">Drag to rotate • Scroll to zoom</p>

      <div className="w-full max-w-[700px] aspect-[4/3] bg-[hsl(220,20%,10%)] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <Canvas camera={{ position: [6, 6, 8], fov: 45 }} shadows>
          <Scene />
        </Canvas>
      </div>

      {/* Info cards */}
      <div className="mt-6 max-w-[700px] w-full grid sm:grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: PLASTIC_COLOR }} />
            <p className="font-semibold text-sm">HDPE Plastic Panels</p>
          </div>
          <p className="text-white/60 text-xs">
            Two rigid 3mm-thick panels form a cross. Each panel has a centered slot cut halfway through its height — one from the top, one from the bottom — so they interlock and lock flush at the intersection.
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: SLOT_COLOR }} />
            <p className="font-semibold text-sm">Interlocking Slot Joint</p>
          </div>
          <p className="text-white/60 text-xs">
            Gold-highlighted slots show where the panels slide together. The horizontal panel slots down from the top; the vertical panel slots up from the bottom. Friction fit holds them securely — no hardware needed.
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 sm:col-span-2">
          <p className="font-semibold text-sm mb-1">Specifications</p>
          <div className="grid grid-cols-3 gap-2 text-xs text-white/60">
            <div><span className="text-white/80 font-medium">Height:</span> 10"</div>
            <div><span className="text-white/80 font-medium">Material:</span> HDPE</div>
            <div><span className="text-white/80 font-medium">Thickness:</span> 3mm</div>
            <div><span className="text-white/80 font-medium">Sections:</span> 4 equal</div>
            <div><span className="text-white/80 font-medium">Fasteners:</span> None</div>
            <div><span className="text-white/80 font-medium">Assembly:</span> Slide & lock</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrunkDiagram;
