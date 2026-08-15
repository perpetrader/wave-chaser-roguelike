import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import RoguelikeAbilitySelect, { AbilityType, UnlockedAbility, PermanentUpgradeType, PermanentUpgrades } from "../RoguelikeAbilitySelect";
import BeachFrame from "../BeachFrame";
import {
  BEACH_EFFECTS, type BeachEffectType,
  getRoguelikeLevelSettings,
  type RunType,
} from "../game/constants";

interface LevelCompleteScreenProps {
  roguelikeLevel: number;
  levelCompleteReady: boolean;
  runType: RunType;
  currentBeachEffect: BeachEffectType | null;
  completedBeachForDisplay: BeachEffectType | null;
  unlockedAbilities: UnlockedAbility[];
  waterTimeBonus: number;
  wavesMissedBonus: number;
  lastWavesMissedUpgradeLevel: number;
  permanentUpgrades: PermanentUpgrades;
  excludedAbilities: AbilityType[];
  upcomingBossEffect: { type: BeachEffectType; name: string; description: string } | null;
  levelScore: number;
  totalScore: number;
  onSelectNewAbility: (type: AbilityType) => void;
  onUpgradeAbility: (type: AbilityType) => void;
  onUpgradeWaterTime: () => void;
  onUpgradeWavesMissed: () => void;
  onSelectPermanentUpgrade: (upgradeType: PermanentUpgradeType) => void;
  onContinueWithoutUpgrade: () => void;
  onPauseRun: () => void;
}

const LevelCompleteScreen = ({
  roguelikeLevel,
  levelCompleteReady,
  runType,
  currentBeachEffect,
  completedBeachForDisplay,
  unlockedAbilities,
  waterTimeBonus,
  wavesMissedBonus,
  lastWavesMissedUpgradeLevel,
  permanentUpgrades,
  excludedAbilities,
  upcomingBossEffect,
  levelScore,
  totalScore,
  onSelectNewAbility,
  onUpgradeAbility,
  onUpgradeWaterTime,
  onUpgradeWavesMissed,
  onSelectPermanentUpgrade,
  onContinueWithoutUpgrade,
  onPauseRun,
}: LevelCompleteScreenProps) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 overflow-auto py-6 px-4">
      {/* Celebration overlay - shows during transition */}
      {!levelCompleteReady && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          {/* Burst of particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-ping"
              style={{
                backgroundColor: ['#fbbf24', '#a855f7', '#22d3ee', '#34d399', '#f472b6'][i % 5],
                transform: `rotate(${i * 30}deg) translateY(-60px)`,
                animationDuration: '0.6s',
                animationDelay: `${i * 0.03}s`,
                opacity: 0.8,
              }}
            />
          ))}
          {/* Central glow */}
          <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 via-cyan-400 to-yellow-400 opacity-60 animate-pulse blur-xl" />
          {/* Level text */}
          <div className="text-4xl font-display text-white animate-bounce drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">
            🎉 Level {roguelikeLevel}!
          </div>
        </div>
      )}

      {/* Upgrade screen - fades in after celebration */}
      <BeachFrame beachType={runType === "beachBonanza" ? currentBeachEffect : null}>
        <div
          className={cn(
            "bg-slate-800 p-6 max-w-lg shadow-2xl transition-all duration-300",
            runType === "beachBonanza" && currentBeachEffect ? "" : "rounded-xl border-2 border-purple-500/50 mx-4",
            levelCompleteReady ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
        >
        {/* Current Beach Effect Display */}
        {completedBeachForDisplay && (
          <div className="mb-4 p-2 bg-orange-900/40 border border-orange-500/50 rounded-lg">
            <p className="text-orange-400 text-center text-sm">
              🏖️ Completed with: <span className="font-semibold">{BEACH_EFFECTS.find(e => e.type === completedBeachForDisplay)?.name}</span>
            </p>
          </div>
        )}

        <RoguelikeAbilitySelect
          level={roguelikeLevel}
          unlockedAbilities={unlockedAbilities}
          waterTimeBonus={waterTimeBonus}
          wavesMissedBonus={wavesMissedBonus}
          baseWaterTime={getRoguelikeLevelSettings(roguelikeLevel + 1).waterTimer}
          baseWavesToLose={getRoguelikeLevelSettings(roguelikeLevel + 1, lastWavesMissedUpgradeLevel).wavesToLose}
          previousWavesToLose={getRoguelikeLevelSettings(roguelikeLevel, lastWavesMissedUpgradeLevel).wavesToLose}
          wavesToWin={getRoguelikeLevelSettings(roguelikeLevel + 1).wavesToWin}
          previousWavesToWin={getRoguelikeLevelSettings(roguelikeLevel).wavesToWin}
          permanentUpgrades={permanentUpgrades}
          excludedAbilities={excludedAbilities}
          onSelectNewAbility={onSelectNewAbility}
          onUpgradeAbility={onUpgradeAbility}
          onUpgradeWaterTime={onUpgradeWaterTime}
          onUpgradeWavesMissed={onUpgradeWavesMissed}
          onSelectPermanentUpgrade={onSelectPermanentUpgrade}
          onContinueWithoutUpgrade={onContinueWithoutUpgrade}
          isFirstUnlock={roguelikeLevel === 1}
          disabled={!levelCompleteReady}
          upcomingBossEffect={upcomingBossEffect}
          levelScore={levelScore}
          totalScore={totalScore}
        />

        {/* Pause Run Button */}
        {levelCompleteReady && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={onPauseRun}
              className="w-full border-white/30 text-white/70 hover:bg-white/10"
            >
              Pause Run & Return to Menu
            </Button>
          </div>
        )}
        </div>
      </BeachFrame>
    </div>
  );
};

export default LevelCompleteScreen;
