import { useRef, useCallback } from "react";
import type { InputSystem } from "../../engine/systems/InputSystem";

interface Props {
  inputSystem: InputSystem;
}

/**
 * TouchControls: On-screen buttons for mobile play.
 * Shows a d-pad (up/down) on the left and a toe-tap button on the right.
 */
export default function TouchControls({ inputSystem }: Props) {
  const upRef = useRef(false);
  const downRef = useRef(false);

  const handleUpStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!upRef.current) {
      upRef.current = true;
      inputSystem.startMoveUp();
    }
  }, [inputSystem]);

  const handleUpEnd = useCallback(() => {
    if (upRef.current) {
      upRef.current = false;
      inputSystem.stopMoveUp();
    }
  }, [inputSystem]);

  const handleDownStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!downRef.current) {
      downRef.current = true;
      inputSystem.startMoveDown();
    }
  }, [inputSystem]);

  const handleDownEnd = useCallback(() => {
    if (downRef.current) {
      downRef.current = false;
      inputSystem.stopMoveDown();
    }
  }, [inputSystem]);

  return (
    <div className="flex justify-between items-end w-full px-4 pb-2 pointer-events-none" style={{ touchAction: "none" }}>
      {/* D-pad (left side) */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        <button
          onTouchStart={handleUpStart}
          onTouchEnd={handleUpEnd}
          onMouseDown={handleUpStart}
          onMouseUp={handleUpEnd}
          onMouseLeave={handleUpEnd}
          className="w-16 h-12 bg-white/15 active:bg-white/30 rounded-lg flex items-center justify-center text-white text-2xl font-bold select-none border border-white/20"
        >
          ▲
        </button>
        <button
          onTouchStart={handleDownStart}
          onTouchEnd={handleDownEnd}
          onMouseDown={handleDownStart}
          onMouseUp={handleDownEnd}
          onMouseLeave={handleDownEnd}
          className="w-16 h-12 bg-white/15 active:bg-white/30 rounded-lg flex items-center justify-center text-white text-2xl font-bold select-none border border-white/20"
        >
          ▼
        </button>
      </div>

      {/* Toe tap (right side) */}
      <button
        onTouchStart={(e) => {
          e.preventDefault();
          // Simulate spacebar press/release
          window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
        }}
        onTouchEnd={() => {
          window.dispatchEvent(new KeyboardEvent("keyup", { key: " " }));
        }}
        className="w-20 h-20 bg-cyan-500/30 active:bg-cyan-500/60 rounded-full flex items-center justify-center text-white text-xs font-bold select-none border-2 border-cyan-400/50 pointer-events-auto"
      >
        TAP
      </button>
    </div>
  );
}
