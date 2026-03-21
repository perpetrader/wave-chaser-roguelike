// Slay the Waves - Random Event Definitions

import { GameEvent } from "./types";

export const EVENTS: GameEvent[] = [
  {
    id: "mysterious_shell",
    title: "Mysterious Shell",
    description: "You find a strange conch shell half-buried in the sand. It seems to whisper secrets of the waves...",
    options: [
      {
        text: "Listen closely",
        effect: { type: "gainAbility" },
      },
      {
        text: "Sell it to a collector",
        effect: { type: "gainGold", amount: 50 },
      },
      {
        text: "Leave it alone",
        effect: { type: "nothing" },
      },
    ],
  },
  {
    id: "beach_vendor",
    title: "Wandering Vendor",
    description: "A sun-weathered merchant approaches with a cart full of curious items.",
    options: [
      {
        text: "Buy mystery item (40 gold)",
        effect: { type: "upgradeRandomAbility" },
        costGold: 40,
      },
      {
        text: "Haggle aggressively",
        effect: { type: "gainGold", amount: 25 },
      },
      {
        text: "Ignore them",
        effect: { type: "nothing" },
      },
    ],
  },
  {
    id: "tide_pool",
    title: "Enchanted Tide Pool",
    description: "A shimmering tide pool catches your eye. Its waters seem to glow with an inner light.",
    options: [
      {
        text: "Drink from it",
        effect: { type: "healWaterTime", amount: 1500 },
      },
      {
        text: "Search for treasures",
        effect: { type: "gainGold", amount: 35 },
      },
      {
        text: "Too risky, walk away",
        effect: { type: "nothing" },
      },
    ],
  },
  {
    id: "sand_castle",
    title: "Ancient Sand Castle",
    description: "An impossibly intricate sand castle stands before you, seemingly centuries old yet perfectly preserved.",
    options: [
      {
        text: "Explore its depths",
        effect: { type: "gainAbility" },
        costHealth: 1000, // Lose 1s water time
      },
      {
        text: "Take the golden flag",
        effect: { type: "gainGold", amount: 75 },
      },
      {
        text: "Admire and move on",
        effect: { type: "nothing" },
      },
    ],
  },
  {
    id: "stranded_surfer",
    title: "Stranded Surfer",
    description: "A fellow beach-goer is stuck in a riptide and calls for help!",
    options: [
      {
        text: "Dive in to help!",
        effect: { type: "gainPermanentUpgrade" },
        costHealth: 500,
      },
      {
        text: "Throw them a rope",
        effect: { type: "gainGold", amount: 30 },
      },
      {
        text: "Call for lifeguards",
        effect: { type: "nothing" },
      },
    ],
  },
  {
    id: "message_bottle",
    title: "Message in a Bottle",
    description: "A bottle washes ashore containing a weathered treasure map.",
    options: [
      {
        text: "Follow the map",
        effect: { type: "gainGold", amount: 100 },
        costHealth: 800,
      },
      {
        text: "Sell the map",
        effect: { type: "gainGold", amount: 40 },
      },
      {
        text: "Keep it as a souvenir",
        effect: { type: "healWaterTime", amount: 500 },
      },
    ],
  },
  {
    id: "jellyfish_swarm",
    title: "Jellyfish Warning",
    description: "The beach is swarming with jellyfish! A local offers you protective gear... for a price.",
    options: [
      {
        text: "Buy protection (30 gold)",
        effect: { type: "healWaterTime", amount: 1000 },
        costGold: 30,
      },
      {
        text: "Risk it anyway",
        effect: { type: "damageWaterTime", amount: 800 },
      },
      {
        text: "Find another path",
        effect: { type: "nothing" },
      },
    ],
  },
  {
    id: "sunken_treasure",
    title: "Sunken Treasure",
    description: "You spot something glinting beneath the shallow waves. It could be treasure... or trouble.",
    options: [
      {
        text: "Dive deep!",
        effect: { type: "gainGold", amount: 80 },
        costHealth: 600,
      },
      {
        text: "Careful investigation",
        effect: { type: "gainGold", amount: 40 },
      },
      {
        text: "Not worth the risk",
        effect: { type: "nothing" },
      },
    ],
  },
];

// Get a random event
export const getRandomEvent = (): GameEvent => {
  const index = Math.floor(Math.random() * EVENTS.length);
  return EVENTS[index];
};
