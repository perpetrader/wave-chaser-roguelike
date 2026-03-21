import { useState, useEffect, useMemo } from "react";
import { useGameStore } from "../../store/gameStore";
import { GameEngine } from "../../engine/GameEngine";
import type { UpgradeOptions } from "../../engine/systems/ProgressionSystem";
import type { AbilityType, PermanentUpgradeType } from "../../engine/core/types";
import {
  ROGUELIKE_BASE_DURATIONS,
  UPGRADE_INCREMENTS_MS,
} from "../../engine/data/constants";

const ABILITY_EMOJIS: Record<AbilityType, string> = {
  wetsuit: "🦺",
  superTap: "👆",
  ghostToe: "👻",
  crystalBall: "🔮",
  slowdown: "⏰",
  waveMagnet: "🧲",
  waveSurfer: "🏄",
  towelOff: "🏖️",
  doubleDip: "✌️",
  jumpAround: "🦘",
};

const ABILITY_NAMES: Record<AbilityType, string> = {
  wetsuit: "Wetsuit",
  superTap: "Super Tap",
  ghostToe: "Ghost Toe",
  crystalBall: "Crystal Ball",
  slowdown: "Slowdown",
  waveMagnet: "Wave Magnet",
  waveSurfer: "Wave Surfer",
  towelOff: "Towel Off",
  doubleDip: "Double Dip",
  jumpAround: "Jump Around",
};

const ABILITY_DESCRIPTIONS: Record<AbilityType, string> = {
  wetsuit: "Water doesn't drain your timer while active",
  superTap: "Toe tap reaches 3× further",
  ghostToe: "Extends touch detection by 2 extra rows",
  crystalBall: "Preview upcoming wave peaks",
  slowdown: "Waves move 60% slower",
  waveMagnet: "Waves peak closer to your feet",
  waveSurfer: "Teleport to the next incoming wave",
  towelOff: "Recover 20% of time when out of water",
  doubleDip: "Each wave touch counts as 2",
  jumpAround: "Move 4× faster",
};

const PERM_UPGRADE_INFO: Record<PermanentUpgradeType, { emoji: string; name: string; desc: string }> = {
  fastFeet: { emoji: "👟", name: "Fast Feet", desc: "+10% movement speed" },
  tapDancer: { emoji: "💃", name: "Tap Dancer", desc: "+15% toe tap distance" },
  wetShoes: { emoji: "💧", name: "Wet Shoes", desc: "10% slower water drain" },
};

interface Props {
  engine: GameEngine;
  onDone: () => void;
}

export default function UpgradeScreen({ engine, onDone }: Props) {
  const levelScore = useGameStore((s) => s.levelScore);
  const totalScore = useGameStore((s) => s.totalScore);
  const roguelikeLevel = useGameStore((s) => s.roguelikeLevel);
  const pendingBeachEffect = useGameStore((s) => s.pendingBeachEffect);

  const [options, setOptions] = useState<UpgradeOptions | null>(null);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    setOptions(engine.getUpgradeOptions());
    setSelected(false);
  }, [engine, roguelikeLevel]);

  if (!options) return null;

  const hasAnyChoice =
    options.newAbilities.length > 0 ||
    options.upgradeableAbilities.length > 0 ||
    options.hasWaterTimeBonus ||
    options.hasWavesMissedBonus ||
    options.hasPermanentUpgrades;

  const handleUnlock = (type: AbilityType) => {
    if (selected) return;
    setSelected(true);
    engine.unlockAbility(type);
    onDone();
  };

  const handleUpgrade = (type: AbilityType) => {
    if (selected) return;
    setSelected(true);
    engine.upgradeAbility(type);
    onDone();
  };

  const handleWaterTimeBonus = () => {
    if (selected) return;
    setSelected(true);
    engine.addWaterTimeBonus(options.waterTimeBonusAmount);
    onDone();
  };

  const handleWavesMissedBonus = () => {
    if (selected) return;
    setSelected(true);
    engine.addWavesMissedBonus();
    onDone();
  };

  const handlePermanentUpgrade = (type: PermanentUpgradeType) => {
    if (selected) return;
    setSelected(true);
    engine.applyPermanentUpgrade(type);
    onDone();
  };

  const handleContinue = () => {
    onDone();
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-start bg-slate-900/90 z-10 overflow-y-auto p-4">
      {/* Header */}
      <h2 className="text-xl font-bold text-green-400 mb-1">
        Level {roguelikeLevel} Complete!
      </h2>
      <p className="text-white/60 text-sm mb-4">
        Score: {levelScore} • Total: {totalScore}
      </p>

      {/* Boss beach warning */}
      {pendingBeachEffect && (
        <div className="w-full bg-red-900/50 border border-red-500 rounded-lg p-2 mb-3 text-center">
          <p className="text-red-400 text-sm font-bold">⚠️ Boss Beach Next!</p>
          <p className="text-white/70 text-xs">{pendingBeachEffect}</p>
        </div>
      )}

      {/* Permanent Upgrades (boss levels) */}
      {options.hasPermanentUpgrades && options.permanentUpgradeTypes.length > 0 && (
        <div className="w-full mb-3">
          <p className="text-amber-400 text-xs font-bold mb-1 text-center">⭐ Permanent Upgrade</p>
          <div className="flex flex-col gap-1">
            {options.permanentUpgradeTypes.map((type) => {
              const info = PERM_UPGRADE_INFO[type];
              return (
                <button
                  key={type}
                  onClick={() => handlePermanentUpgrade(type)}
                  disabled={selected}
                  className="w-full bg-amber-800/50 hover:bg-amber-700/60 border border-amber-600 rounded-lg p-2 text-left transition-colors disabled:opacity-50"
                >
                  <span className="text-lg mr-2">{info.emoji}</span>
                  <span className="text-white font-bold text-sm">{info.name}</span>
                  <span className="text-white/60 text-xs ml-2">{info.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Water Time Bonus */}
      {options.hasWaterTimeBonus && (
        <button
          onClick={handleWaterTimeBonus}
          disabled={selected}
          className="w-full bg-blue-800/50 hover:bg-blue-700/60 border border-blue-500 rounded-lg p-2 mb-2 text-center transition-colors disabled:opacity-50"
        >
          <span className="text-lg mr-2">⏱️</span>
          <span className="text-white font-bold text-sm">
            +{(options.waterTimeBonusAmount / 1000).toFixed(1)}s Water Time
          </span>
        </button>
      )}

      {/* Waves Missed Bonus */}
      {options.hasWavesMissedBonus && (
        <button
          onClick={handleWavesMissedBonus}
          disabled={selected}
          className="w-full bg-purple-800/50 hover:bg-purple-700/60 border border-purple-500 rounded-lg p-2 mb-2 text-center transition-colors disabled:opacity-50"
        >
          <span className="text-lg mr-2">🛡️</span>
          <span className="text-white font-bold text-sm">+1 Waves Allowed to Miss</span>
        </button>
      )}

      {/* Unlock New Ability */}
      {options.newAbilities.length > 0 && (
        <div className="w-full mb-3">
          <p className="text-cyan-400 text-xs font-bold mb-1 text-center">🔓 Unlock New Ability</p>
          <div className="flex flex-col gap-1">
            {options.newAbilities.map((type) => (
              <button
                key={type}
                onClick={() => handleUnlock(type)}
                disabled={selected}
                className="w-full bg-cyan-900/50 hover:bg-cyan-800/60 border border-cyan-500 rounded-lg p-2 text-left transition-colors disabled:opacity-50"
              >
                <div className="flex items-center">
                  <span className="text-lg mr-2">{ABILITY_EMOJIS[type]}</span>
                  <div>
                    <p className="text-white font-bold text-sm">{ABILITY_NAMES[type]}</p>
                    <p className="text-white/50 text-xs">{ABILITY_DESCRIPTIONS[type]}</p>
                    <p className="text-cyan-300 text-xs">
                      {(ROGUELIKE_BASE_DURATIONS[type] / 1000).toFixed(0)}s duration
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Existing Ability */}
      {options.upgradeableAbilities.length > 0 && (
        <div className="w-full mb-3">
          <p className="text-green-400 text-xs font-bold mb-1 text-center">⬆️ Upgrade Ability</p>
          <div className="flex flex-col gap-1">
            {options.upgradeableAbilities.map((ability) => {
              const base = ROGUELIKE_BASE_DURATIONS[ability.type] ?? 5000;
              const inc = UPGRADE_INCREMENTS_MS[ability.type] ?? 500;
              const currentDur = (base + inc * ability.upgradeCount) / 1000;
              const nextDur = (base + inc * (ability.upgradeCount + 1)) / 1000;

              return (
                <button
                  key={ability.type}
                  onClick={() => handleUpgrade(ability.type)}
                  disabled={selected}
                  className="w-full bg-green-900/40 hover:bg-green-800/50 border border-green-600 rounded-lg p-2 text-left transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{ABILITY_EMOJIS[ability.type]}</span>
                      <div>
                        <p className="text-white font-bold text-sm">{ABILITY_NAMES[ability.type]}</p>
                        <p className="text-white/50 text-xs">
                          Upgrade {ability.upgradeCount}/10
                        </p>
                      </div>
                    </div>
                    <span className="text-green-300 text-sm font-mono">
                      {currentDur.toFixed(1)}s → {nextDur.toFixed(1)}s
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Continue button (when no choices available) */}
      {!hasAnyChoice && (
        <button
          onClick={handleContinue}
          className="px-8 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg text-lg transition-colors mt-4"
        >
          Continue
        </button>
      )}
    </div>
  );
}
