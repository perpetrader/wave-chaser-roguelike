import { Button } from "@/components/ui/button";
import { Shirt, Zap, Ghost, Plus, TrendingUp, Shell, Droplets, Snail, Magnet, Waves, Wind, Rabbit, Shield, Footprints, Timer, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type AbilityType = "wetsuit" | "superTap" | "ghostToe" | "crystalBall" | "slowdown" | "waveMagnet" | "waveSurfer" | "towelOff" | "doubleDip" | "jumpAround";

export type PermanentUpgradeType = "fastFeet" | "tapDancer" | "wetShoes";

export interface UnlockedAbility {
  type: AbilityType;
  upgradeCount: number; // Number of upgrades applied (0-10)
}

export interface PermanentUpgrades {
  fastFeet: number;    // Number of times upgraded (each = +10% base movement)
  tapDancer: number;   // Number of times upgraded (each = +15% toe tap distance)
  wetShoes: number;    // Number of times upgraded (each = 10% slower water drain)
}

export const MAX_PERMANENT_UPGRADES = 5;

// Upgrade increments in seconds
const UPGRADE_INCREMENTS: Record<AbilityType, number> = {
  wetsuit: 0.8,    // +0.8s duration per upgrade
  slowdown: 1.2,
  superTap: 0.7,
  ghostToe: 0.6,
  crystalBall: 0.5,
  waveMagnet: 0.5,
  waveSurfer: 0.4, // Teleport
  towelOff: 0.7,
  doubleDip: 0.5,
  jumpAround: 0.6,
};

const WETSUIT_WATER_LIMIT_INCREMENT = 0.3; // +0.3s water tolerance per upgrade

const MAX_UPGRADES = 10;

const PERMANENT_UPGRADE_INFO: Record<PermanentUpgradeType, {
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  bonusText: (count: number) => string;
}> = {
  fastFeet: {
    name: "Fast Feet",
    description: "+10% distance per move",
    icon: <Footprints className="w-8 h-8" />,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/50 hover:border-green-400",
    bonusText: (count) => `${count * 10}%`,
  },
  tapDancer: {
    name: "Tap Dancer",
    description: "+15% toe tap distance",
    icon: <Zap className="w-8 h-8" />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-500/50 hover:border-yellow-400",
    bonusText: (count) => `${count * 15}%`,
  },
  wetShoes: {
    name: "Wet Shoes",
    description: "Water timer drains 10% slower",
    icon: <Timer className="w-8 h-8" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/50 hover:border-blue-400",
    bonusText: (count) => `${count * 10}%`,
  },
};

interface RoguelikeAbilitySelectProps {
  level: number;
  unlockedAbilities: UnlockedAbility[];
  waterTimeBonus: number; // Current water time bonus in ms
  wavesMissedBonus: number; // Current permanent waves missed bonus
  baseWaterTime: number; // Base water time for current level in ms
  baseWavesToLose: number; // Base waves to lose for next level (without bonus)
  previousWavesToLose: number; // Previous level's waves to lose (for comparison)
  wavesToWin: number; // Current waves needed to win
  previousWavesToWin: number; // Previous level's waves to win (for comparison)
  permanentUpgrades: PermanentUpgrades; // Current permanent upgrades
  excludedAbilities: AbilityType[]; // Abilities randomly excluded for this run
  onSelectNewAbility: (ability: AbilityType) => void;
  onUpgradeAbility: (ability: AbilityType) => void;
  onUpgradeWaterTime: () => void;
  onUpgradeWavesMissed: () => void;
  onSelectPermanentUpgrade: (upgrade: PermanentUpgradeType) => void; // Handler for permanent upgrades
  onContinueWithoutUpgrade: () => void; // Continue when no upgrades available
  isFirstUnlock: boolean; // After level 1, must unlock an ability
  disabled?: boolean; // Prevent button clicks during transition
  upcomingBossEffect?: { name: string; description: string } | null; // Boss beach effect for next level
  levelScore?: number; // Score earned this level
  totalScore?: number; // Total score for the run
}

const ABILITY_INFO: Record<AbilityType, { 
  name: string; 
  description?: string;
  baseDuration: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  wetsuit: {
    name: "Wet Suit",
    description: "Immunity to water damage (3s exposure limit)",
    baseDuration: "8s",
    icon: <Shirt className="w-8 h-8" />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-500/50 hover:border-yellow-400",
  },
  superTap: {
    name: "Super Tap",
    description: "Toe Tap 3x longer",
    baseDuration: "7s",
    icon: <Zap className="w-8 h-8" />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-500/50 hover:border-orange-400",
  },
  ghostToe: {
    name: "Ghost Feet",
    description: "Extended reach immune to water",
    baseDuration: "6s",
    icon: <Ghost className="w-8 h-8" />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/50 hover:border-purple-400",
  },
  crystalBall: {
    name: "Crystal Conch",
    description: "Preview upcoming waves",
    baseDuration: "5s",
    icon: <Shell className="w-8 h-8" />,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-500/50 hover:border-cyan-400",
  },
  slowdown: {
    name: "Slowdown",
    description: "Waves 60% slower",
    baseDuration: "12s",
    icon: <Snail className="w-8 h-8" />,
    color: "text-pink-400",
    bgColor: "bg-pink-500/20",
    borderColor: "border-pink-500/50 hover:border-pink-400",
  },
  waveMagnet: {
    name: "Wave Magnet",
    description: "Waves peak closer to feet",
    baseDuration: "5s",
    icon: <Magnet className="w-8 h-8" />,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/50 hover:border-red-400",
  },
  waveSurfer: {
    name: "Teleport",
    description: "Teleports close to next wave, immunity until wave recedes",
    baseDuration: "4s",
    icon: <Waves className="w-8 h-8" />,
    color: "text-teal-400",
    bgColor: "bg-teal-500/20",
    borderColor: "border-teal-500/50 hover:border-teal-400",
  },
  towelOff: {
    name: "Towel Off",
    description: "+20% dry time recovery",
    baseDuration: "7s",
    icon: <Wind className="w-8 h-8" />,
    color: "text-sky-400",
    bgColor: "bg-sky-500/20",
    borderColor: "border-sky-500/50 hover:border-sky-400",
  },
  doubleDip: {
    name: "Double Dip",
    description: "2x wave credit",
    baseDuration: "5s",
    icon: <span className="w-8 h-8 flex items-center justify-center font-bold text-lg">2x</span>,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/50 hover:border-emerald-400",
  },
  jumpAround: {
    name: "Jump Around",
    description: "4x move distance",
    baseDuration: "6s",
    icon: <Rabbit className="w-8 h-8" />,
    color: "text-lime-400",
    bgColor: "bg-lime-500/20",
    borderColor: "border-lime-500/50 hover:border-lime-400",
  },
};

// Ability pools based on level
// TIER_0_POOL: For testing - these abilities are always offered after level 1 (move abilities here temporarily to test them)
const TIER_0_POOL: AbilityType[] = []; // Testing pool - empty in production
const BASE_POOL: AbilityType[] = ["superTap", "ghostToe", "jumpAround", "waveMagnet", "waveSurfer"]; // Tier 1: Level 1+
const TIER_2_POOL: AbilityType[] = ["crystalBall", "towelOff", "wetsuit"]; // Tier 2: Level 2+
const TIER_3_POOL: AbilityType[] = ["doubleDip", "slowdown"]; // Tier 3: Level 10+

// All abilities in the game (for random exclusion)
export const ALL_ABILITIES: AbilityType[] = [...BASE_POOL, ...TIER_2_POOL, ...TIER_3_POOL];

const getAvailablePool = (level: number, excludedAbilities: AbilityType[] = []): AbilityType[] => {
  let pool = [...TIER_0_POOL, ...BASE_POOL];
  if (level >= 6) {
    pool = [...pool, ...TIER_2_POOL];
  }
  if (level >= 10) {
    pool = [...pool, ...TIER_3_POOL];
  }
  // Filter out excluded abilities for this run
  return pool.filter(ability => !excludedAbilities.includes(ability));
};

// Fisher-Yates shuffle for random selection
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const RoguelikeAbilitySelect = ({
  level,
  unlockedAbilities,
  waterTimeBonus,
  wavesMissedBonus,
  baseWaterTime,
  baseWavesToLose,
  previousWavesToLose,
  wavesToWin,
  previousWavesToWin,
  permanentUpgrades,
  excludedAbilities,
  onSelectNewAbility,
  onUpgradeAbility,
  onUpgradeWaterTime,
  onUpgradeWavesMissed,
  onSelectPermanentUpgrade,
  onContinueWithoutUpgrade,
  isFirstUnlock,
  disabled = false,
  upcomingBossEffect,
  levelScore,
  totalScore,
}: RoguelikeAbilitySelectProps) => {
  const unlockedTypes = unlockedAbilities.map((a) => a.type);
  
  // New abilities can only be unlocked at levels 1, 3, 5, 7, 9, 12, 15, 18, 21, 24...
  const isUnlockLevel = (level <= 9 && level % 2 === 1) || (level >= 12 && (level - 12) % 3 === 0);
  
  // Levels where ONLY new abilities are offered (no upgrades): 3, 7, 9, 12, 18
  const isUnlockOnlyLevel = [3, 7, 9, 12, 18].includes(level);
  
  // Water time upgrade available at levels 8, 11, 14, 17...
  const isWaterTimeUpgradeLevel = level >= 8 && (level - 8) % 3 === 0;
  
  // Waves missed upgrade available at levels 15, 20, 25, 30... (every 5 levels starting at 15, no cap)
  const isWavesMissedUpgradeLevel = level % 5 === 0 && level >= 15;
  
  // Permanent upgrades available after boss beaches (levels 5, 10, 15, 20...)
  const isPermanentUpgradeLevel = level % 5 === 0 && level > 0;
  
  // Water time upgrade scales with level: 0.3s before 20, 0.2s at 20+, 0.1s at 30+
  const getWaterTimeUpgradeMs = (lvl: number) => {
    if (lvl >= 30) return 100;
    if (lvl >= 20) return 200;
    return 300;
  };
  const WATER_TIME_UPGRADE_MS = getWaterTimeUpgradeMs(level);

  
  // Get available pool based on level, filter out already unlocked and excluded abilities
  // TIER_0 abilities are ALWAYS offered first (for testing), then fill remaining slots randomly
  const availableToUnlock: AbilityType[] = (() => {
    if (!isUnlockLevel || level > 20) return []; // Stop offering new abilities after level 20
    
    // First, get any tier 0 abilities that aren't unlocked or excluded (always offered for testing)
    const tier0Available = TIER_0_POOL.filter((t) => !unlockedTypes.includes(t) && !excludedAbilities.includes(t));
    
    // Then get the rest of the pool (already filters out excluded abilities)
    const pool = getAvailablePool(level, excludedAbilities);
    const regularPool = pool.filter((t) => !unlockedTypes.includes(t) && !TIER_0_POOL.includes(t));
    
    // Tier 0 always comes first, then fill remaining slots (up to 2 total) with random from regular pool
    const shuffled = shuffleArray(regularPool);
    const remaining = Math.max(0, 2 - tier0Available.length);
    return [...tier0Available, ...shuffled.slice(0, remaining)];
  })();

  // Base durations in seconds - must match ROGUELIKE_BASE_DURATIONS in WavesGame.tsx
  const BASE_DURATIONS: Record<AbilityType, number> = {
    wetsuit: 8,      // 8s
    slowdown: 12,    // 12s
    superTap: 7,     // 7s
    ghostToe: 6,     // 6s
    crystalBall: 5,  // 5s
    waveMagnet: 5,   // 5s
    waveSurfer: 4,   // 4s (Teleport)
    towelOff: 7,     // 7s
    doubleDip: 5,    // 5s
    jumpAround: 6,   // 6s
  };
  const WETSUIT_BASE_WATER_LIMIT = 3; // Wetsuit has 3s base water tolerance (matches ROGUELIKE_BASE_WETSUIT_WATER_LIMIT)
  
  const getAbilitySeconds = (type: AbilityType, upgradeCount: number) => {
    return (BASE_DURATIONS[type] + (UPGRADE_INCREMENTS[type] * upgradeCount)).toFixed(1);
  };
  
  const getWetsuitWaterSeconds = (upgradeCount: number) => {
    return (WETSUIT_BASE_WATER_LIMIT + (WETSUIT_WATER_LIMIT_INCREMENT * upgradeCount)).toFixed(1);
  };
  
  // Calculate water time in seconds (waterTimeBonus is now in ms)
  const currentWaterTimeSeconds = (baseWaterTime + waterTimeBonus) / 1000;
  const upgradedWaterTimeSeconds = (baseWaterTime + waterTimeBonus + WATER_TIME_UPGRADE_MS) / 1000;

  // Check if goal increased or misses decreased (use clamped totals including bonus)
  const goalIncreased = wavesToWin > previousWavesToWin;
  const currentTotalMisses = Math.max(1, baseWavesToLose + wavesMissedBonus);
  const previousTotalMisses = Math.max(1, previousWavesToLose + wavesMissedBonus);
  const goalDecreasedMisses = currentTotalMisses < previousTotalMisses;

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-display text-cyan-400 mb-2">
          Level {level} Complete!
        </h2>
        {/* Score Display */}
        {levelScore !== undefined && totalScore !== undefined && (
          <div className="flex justify-center items-center gap-4 mt-2">
            <div className="text-center">
              <p className="text-white/60 text-xs uppercase tracking-wider">Level</p>
              <p className="text-xl font-display text-yellow-400 font-mono">{levelScore > 0 ? '+' : ''}{levelScore}</p>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <div className="text-center">
              <p className="text-white/60 text-xs uppercase tracking-wider">Total</p>
              <p className="text-xl font-display text-cyan-300 font-mono">{totalScore}</p>
            </div>
          </div>
        )}
      </div>

      {/* Boss Beach Warning - directly below title */}
      {upcomingBossEffect && (
        <div className="w-full p-3 bg-red-900/50 border-2 border-red-500 rounded-lg animate-pulse">
          <p className="text-red-400 font-display text-center text-lg">⚠️ Boss Beach Level Next! ⚠️</p>
          <p className="text-white/80 text-center text-sm mt-1">
            Effect: <span className="text-red-300 font-semibold">{upcomingBossEffect.name}</span>
          </p>
          <p className="text-white/60 text-center text-xs mt-1">{upcomingBossEffect.description}</p>
        </div>
      )}

      {/* Goal Change Warning - directly below title */}
      {(goalIncreased || goalDecreasedMisses || level === 20 || level === 40) && (
        <div className="w-full bg-red-500/20 border border-red-500/50 rounded-lg p-3">
          <div className="flex flex-col items-center gap-2 text-sm">
            {goalIncreased && (
              <span className="text-white/70">
                ⚠️ Waves to win: <span className="text-red-400">{previousWavesToWin} → {wavesToWin}</span>
              </span>
            )}
            {goalDecreasedMisses && (
              <span className="text-white/70">
                ⚠️ Wave Misses: <span className="text-red-400">{previousTotalMisses} → {currentTotalMisses}</span>
              </span>
            )}
            {level === 20 && (
              <span className="text-white/70">
                ⚠️ Wave variance increased: <span className="text-red-400">±2 → ±3 rows</span>
              </span>
            )}
            {level === 40 && (
              <span className="text-white/70">
                ⚠️ Wave variance increased: <span className="text-red-400">±3 → ±4 rows</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Instruction text - after difficulty warning */}
      <p className="text-white/70 text-center">
        {isFirstUnlock 
          ? "Choose your first ability:" 
          : isPermanentUpgradeLevel
            ? "Boss Beach Complete! Choose a permanent upgrade:"
            : isUnlockOnlyLevel && availableToUnlock.length > 0
              ? "Unlock a new ability!"
              : availableToUnlock.length > 0
                ? "Unlock a new ability or upgrade an existing one:"
                : "Pick an Upgrade:"}
      </p>

      {/* Permanent Upgrades Section - Only shown after boss beaches (levels 5, 10, 15...) */}
      {isPermanentUpgradeLevel && (
          <div className="w-full">
            <h3 className="text-lg font-display text-purple-400 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Permanent Upgrades
            </h3>
            <div className="flex flex-col gap-2">
              {(Object.keys(PERMANENT_UPGRADE_INFO) as PermanentUpgradeType[]).map((upgradeType) => {
                const info = PERMANENT_UPGRADE_INFO[upgradeType];
                const currentCount = permanentUpgrades[upgradeType];
                const isMaxed = currentCount >= MAX_PERMANENT_UPGRADES;
                return (
                  <Button
                    key={upgradeType}
                    variant="outline"
                    onClick={() => !isMaxed && onSelectPermanentUpgrade(upgradeType)}
                    disabled={disabled || isMaxed}
                    className={cn(
                      "flex items-center justify-between h-auto py-4 px-4 overflow-hidden",
                      "bg-slate-900/70 border-slate-600",
                      isMaxed 
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-slate-900/70 hover:border-purple-500 hover:ring-2 hover:ring-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={cn("p-2 rounded-lg shrink-0", info.bgColor)}>
                        <span className={info.color}>{info.icon}</span>
                      </div>
                      <div className="text-left min-w-0">
                        <p className={cn("font-semibold text-base truncate", info.color)}>{info.name}</p>
                        <p className="text-xs text-white/50 truncate">{info.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      {isMaxed ? (
                        <>
                          <p className="text-amber-400 text-xs font-semibold">Max!</p>
                          <p className="text-amber-400 text-sm font-mono">
                            +{info.bonusText(currentCount)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-white/40 text-xs">{currentCount}/{MAX_PERMANENT_UPGRADES}</p>
                          <p className="text-green-400 text-sm font-mono whitespace-nowrap">
                            {info.bonusText(currentCount)} → {info.bonusText(currentCount + 1)}
                          </p>
                        </>
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
      )}

      {/* Waves Missed Upgrade Section - Only shown at levels 20, 25, 30... */}
      {isWavesMissedUpgradeLevel && (
        <div className="w-full">
          <h3 className="text-lg font-display text-amber-400 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Upgrade Waves Allowed
          </h3>
          <Button
            variant="outline"
            onClick={onUpgradeWavesMissed}
            disabled={disabled}
            className={cn(
              "w-full flex items-center justify-between h-auto py-4 px-4 overflow-hidden",
              "bg-slate-900/70 border-slate-600",
              "hover:bg-slate-900/70 hover:border-purple-500 hover:ring-2 hover:ring-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            )}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
                <Shield className="w-8 h-8 text-amber-400" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-semibold text-base text-amber-400 truncate">Waves Missed Limit</p>
              </div>
            </div>
            <div className="text-green-400 text-sm font-mono shrink-0 ml-2 whitespace-nowrap">
              {Math.max(1, baseWavesToLose + wavesMissedBonus)} → {Math.max(1, baseWavesToLose + wavesMissedBonus + 1)}
            </div>
          </Button>
        </div>
      )}

      {/* Water Time Upgrade Section - Only shown at levels 8, 11, 14... but NOT on permanent upgrade levels */}
      {isWaterTimeUpgradeLevel && !isPermanentUpgradeLevel && (
        <div className="w-full">
          <h3 className="text-lg font-display text-blue-400 mb-3 flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            Upgrade Water Limit
          </h3>
          <Button
            variant="outline"
            onClick={onUpgradeWaterTime}
            disabled={disabled}
            className={cn(
              "w-full flex items-center justify-between h-auto py-4 px-4 overflow-hidden",
              "bg-slate-900/70 border-slate-600",
              "hover:bg-slate-900/70 hover:border-purple-500 hover:ring-2 hover:ring-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            )}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 rounded-lg bg-blue-500/20 shrink-0">
                <Droplets className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-semibold text-base text-blue-400 truncate">Water Time</p>
              </div>
            </div>
            <div className="text-green-400 text-sm font-mono shrink-0 ml-2 whitespace-nowrap">
              {currentWaterTimeSeconds.toFixed(1)}s → {upgradedWaterTimeSeconds.toFixed(1)}s
            </div>
          </Button>
        </div>
      )}

      {/* Unlock New Ability Section - NOT shown after boss beaches */}
      {availableToUnlock.length > 0 && !isPermanentUpgradeLevel && (
        <div className="w-full">
          <div className="flex flex-col gap-2">
            {availableToUnlock.map((abilityType) => {
              const info = ABILITY_INFO[abilityType];
              return (
                <Button
                  key={abilityType}
                  variant="outline"
                  onClick={() => onSelectNewAbility(abilityType)}
                  disabled={disabled}
                  className={cn(
                    "flex items-center justify-start gap-4 h-auto py-4 px-4",
                    "bg-slate-900/70 border-slate-600",
                    "hover:bg-slate-900/70 hover:border-purple-500 hover:ring-2 hover:ring-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  )}
                >
                  <div className={cn("p-2 rounded-lg", info.bgColor)}>
                    <span className={info.color}>{info.icon}</span>
                  </div>
                  <div className="text-left">
                    <p className={cn("font-semibold text-lg", info.color)}>
                      {info.name} <span className="text-white/50 text-sm font-normal">({info.baseDuration})</span>
                    </p>
                    {info.description && (
                      <p className="text-white/50 text-sm">{info.description}</p>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Upgrade Existing Ability Section - Only shown after first unlock, NOT after boss beaches, NOT on unlock-only levels */}
      {!isFirstUnlock && !isPermanentUpgradeLevel && !isUnlockOnlyLevel && unlockedAbilities.length > 0 && (() => {
        // Filter to upgradeable abilities, then randomly pick up to 3
        const upgradeableAbilities = unlockedAbilities.filter((ability) => ability.upgradeCount < MAX_UPGRADES);
        const shuffledUpgradeable = shuffleArray(upgradeableAbilities);
        const displayedUpgradeOptions = shuffledUpgradeable.slice(0, 3);
        
        if (displayedUpgradeOptions.length === 0) return null;
        
        return (
        <div className="w-full">
          <h3 className="text-lg font-display text-amber-400 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Upgrade Ability
          </h3>
          <div className="flex flex-col gap-2">
            {displayedUpgradeOptions.map((ability) => {
                const info = ABILITY_INFO[ability.type];
                const increment = UPGRADE_INCREMENTS[ability.type];
                return (
                  <Button
                    key={ability.type}
                    variant="outline"
                    onClick={() => onUpgradeAbility(ability.type)}
                    disabled={disabled}
                    className={cn(
                      "flex items-center justify-between h-auto py-4 px-4 overflow-hidden",
                      "bg-slate-900/70 border-slate-600",
                      "hover:bg-slate-900/70 hover:border-purple-500 hover:ring-2 hover:ring-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={cn("p-2 rounded-lg shrink-0", info.bgColor)}>
                        <span className={info.color}>{info.icon}</span>
                      </div>
                      <div className="text-left min-w-0">
                        <p className={cn("font-semibold text-base truncate", info.color)}>{info.name}</p>
                        <p className="text-xs text-white/40">
                          {ability.upgradeCount}/{MAX_UPGRADES} upgrades
                        </p>
                      </div>
                    </div>
                    <div className="text-green-400 text-sm font-mono text-right shrink-0 ml-2">
                      {ability.type === "wetsuit" ? (
                        <div className="flex flex-col whitespace-nowrap">
                          <span>
                            {getAbilitySeconds(ability.type, ability.upgradeCount)}s → {getAbilitySeconds(ability.type, ability.upgradeCount + 1)}s
                          </span>
                          <span className="text-cyan-400 text-xs">
                            +{WETSUIT_WATER_LIMIT_INCREMENT}s water
                          </span>
                        </div>
                      ) : (
                        <span className="whitespace-nowrap">
                          {getAbilitySeconds(ability.type, ability.upgradeCount)}s → {getAbilitySeconds(ability.type, ability.upgradeCount + 1)}s
                        </span>
                      )}
                    </div>
                  </Button>
                );
              })}
          </div>
        </div>
        );
      })()}

      {/* All Abilities Maxed - Continue Button */}
      {(() => {
        // For boss levels, only check permanent upgrades
        if (isPermanentUpgradeLevel) {
          const availablePermanentUpgrades = (Object.keys(PERMANENT_UPGRADE_INFO) as PermanentUpgradeType[])
            .filter((upgradeType) => permanentUpgrades[upgradeType] < MAX_PERMANENT_UPGRADES);
          
          // Show continue if all permanent upgrades are maxed
          if (availablePermanentUpgrades.length === 0) {
            return (
              <div className="w-full mt-4">
                <Button
                  onClick={onContinueWithoutUpgrade}
                  disabled={disabled}
                  className={cn(
                    "w-full h-auto py-4 px-4",
                    "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400",
                    "text-white font-semibold text-lg"
                  )}
                >
                  All Permanent Upgrades Maxed - Continue to Level {level + 1}
                </Button>
              </div>
            );
          }
          return null;
        }
        
        // For non-boss levels, check all upgrade options
        const hasNewAbilities = availableToUnlock.length > 0;
        const hasWaterTimeUpgrade = isWaterTimeUpgradeLevel;
        const hasWavesMissedUpgrade = isWavesMissedUpgradeLevel;
        const upgradeableAbilities = unlockedAbilities.filter((a) => a.upgradeCount < MAX_UPGRADES);
        const hasUpgradeableAbilities = upgradeableAbilities.length > 0;
        
        // Only show continue button if nothing is available
        if (isFirstUnlock || hasNewAbilities || hasWaterTimeUpgrade || hasWavesMissedUpgrade || hasUpgradeableAbilities) {
          return null;
        }
        
        return (
          <div className="w-full mt-4">
            <Button
              onClick={onContinueWithoutUpgrade}
              disabled={disabled}
              className={cn(
                "w-full h-auto py-4 px-4",
                "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400",
                "text-white font-semibold text-lg"
              )}
            >
              All Abilities Max Level - Continue to Level {level + 1}
            </Button>
          </div>
        );
      })()}
    </div>
  );
};

export default RoguelikeAbilitySelect;
