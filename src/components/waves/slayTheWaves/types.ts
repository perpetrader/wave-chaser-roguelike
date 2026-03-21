// Slay the Waves - Type definitions

import { AbilityType, UnlockedAbility, PermanentUpgrades } from "../RoguelikeAbilitySelect";
import { BeachType } from "../BeachSelectionScreen";
import { MovementMode } from "../WavesGame";
import { FootType, ToeTapMode } from "../RoguelikeStartScreen";

// Node types in the map
export type MapNodeType = "beach" | "elite" | "rest" | "event" | "shop" | "boss";

// Map node definition
export interface MapNode {
  id: string;
  type: MapNodeType;
  row: number; // 0 = bottom (start), increasing upward
  col: number; // Position within the row (0-3)
  connections: string[]; // IDs of nodes this connects to (in the next row)
  beachType?: BeachType; // Beach type for beach/elite/boss nodes
  visited: boolean;
  current: boolean;
}

// Map structure
export interface SlayMap {
  nodes: MapNode[];
  currentNodeId: string | null;
  actNumber: number; // 1, 2, or 3
}

// Event definitions
export interface GameEvent {
  id: string;
  title: string;
  description: string;
  options: EventOption[];
}

export interface EventOption {
  text: string;
  effect: EventEffect;
  costGold?: number;
  costHealth?: number; // Water timer penalty
}

export type EventEffect = 
  | { type: "gainGold"; amount: number }
  | { type: "loseGold"; amount: number }
  | { type: "gainAbility"; ability?: AbilityType }
  | { type: "upgradeRandomAbility" }
  | { type: "healWaterTime"; amount: number }
  | { type: "damageWaterTime"; amount: number }
  | { type: "gainPermanentUpgrade" }
  | { type: "nothing" };

// Shop item
export interface ShopItem {
  id: string;
  type: "ability" | "upgrade" | "waterTime" | "permanentUpgrade";
  ability?: AbilityType;
  cost: number;
  purchased: boolean;
}

// Card reward (ability choice after beach)
export interface CardReward {
  abilities: AbilityType[];
  skipGoldBonus: number; // Gold for skipping
}

// Full Slay the Waves run state
export interface SlayTheWavesRun {
  // Map state
  map: SlayMap;
  
  // Player resources
  gold: number;
  maxWaterTime: number; // Current max water time in ms
  
  // Abilities
  unlockedAbilities: UnlockedAbility[];
  selectedAbilities: AbilityType[]; // Active loadout (max 4)
  excludedAbilities: AbilityType[];
  
  // Progression
  permanentUpgrades: PermanentUpgrades;
  totalScore: number;
  floorsCleared: number;
  
  // Settings
  movementMode: MovementMode;
  footType: FootType;
  toeTapMode: ToeTapMode;
  
  // For save/load
  savedAt: number;
}

// Constants
export const STARTING_GOLD = 100;
export const STARTING_MAX_WATER_TIME = 5000; // 5 seconds
export const GOLD_PER_BEACH = 25;
export const GOLD_PER_ELITE = 50;
export const GOLD_PER_BOSS = 100;
export const SKIP_CARD_GOLD = 15;
export const FLOORS_PER_ACT = 15;
export const TOTAL_ACTS = 3;

// Shop prices
export const SHOP_PRICES = {
  ability: 75,
  upgrade: 50,
  waterTime: 30, // +0.3s
  permanentUpgrade: 150,
};

// Rest site options
export const REST_WATER_TIME_HEAL = 1000; // +1s to max water time
export const REST_UPGRADE_BOOST = 1; // +1 upgrade level to ability
