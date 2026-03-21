export interface Character {
  id: string;
  name: string;
  image: string;
}

// All available characters in the pool
export const CHARACTER_POOL: Character[] = [
  // Original characters
  { id: "dc", name: "DC", image: "/characters/dc.png" },
  { id: "beebie", name: "Beebie", image: "/characters/beebie.png" },
  { id: "weade", name: "Weade", image: "/characters/weade.png" },
  { id: "barber", name: "Barber", image: "/characters/barber.png" },
  { id: "nightswipe", name: "Nightswipe", image: "/characters/nightswipe.png" },
  { id: "flutter", name: "Flutter", image: "/characters/flutter.png" },
  { id: "sabateur", name: "Sabateur", image: "/characters/sabateur.png" },
  { id: "ip", name: "IP", image: "/characters/ip.png" },
  // Batch 1
  { id: "destructor", name: "Destructor", image: "/characters/destructor.png" },
  { id: "bowa", name: "Bowa", image: "/characters/bowa.png" },
  { id: "brainiac", name: "Brainiac", image: "/characters/brainiac.png" },
  { id: "branehart", name: "Branehart", image: "/characters/branehart.png" },
  { id: "bruiser", name: "Bruiser", image: "/characters/bruiser.png" },
  { id: "charger", name: "Charger", image: "/characters/charger.png" },
  { id: "cosmicosi", name: "Cosmicosi", image: "/characters/cosmicosi.png" },
  { id: "destroyer", name: "Destroyer", image: "/characters/destroyer.png" },
  { id: "bomber", name: "Bomber", image: "/characters/bomber.png" },
  { id: "bloomshooter", name: "Bloomshooter", image: "/characters/bloomshooter.png" },
  // Batch 2
  { id: "felena", name: "Felena", image: "/characters/felena.png" },
  { id: "blazer", name: "Blazer", image: "/characters/blazer.png" },
  { id: "bloomcat", name: "BloomCat", image: "/characters/bloomcat.png" },
  { id: "bloomer", name: "Bloomer", image: "/characters/bloomer.png" },
  { id: "bloomking", name: "BloomKing", image: "/characters/bloomking.png" },
  { id: "bloomkitten", name: "BloomKitten", image: "/characters/bloomkitten.png" },
  { id: "bloomqueen", name: "BloomQueen", image: "/characters/bloomqueen.png" },
  { id: "dynamo", name: "Dynamo", image: "/characters/dynamo.png" },
  { id: "ecko", name: "Ecko", image: "/characters/ecko.png" },
  { id: "executioner", name: "Executioner", image: "/characters/executioner.png" },
  // Batch 3
  { id: "megajoe", name: "MegaJoe", image: "/characters/megajoe.png" },
  { id: "fil", name: "Fil", image: "/characters/fil.png" },
  { id: "flash", name: "Flash", image: "/characters/flash.png" },
  { id: "gemma", name: "Gemma", image: "/characters/gemma.png" },
  { id: "givingtree", name: "GivingTree", image: "/characters/givingtree.png" },
  { id: "hackmaster", name: "Hackmaster", image: "/characters/hackmaster.png" },
  { id: "iceman", name: "Iceman", image: "/characters/iceman.png" },
  { id: "jazzy", name: "Jazzy", image: "/characters/jazzy.png" },
  { id: "joe", name: "Joe", image: "/characters/joe.png" },
  { id: "khrys", name: "Khrys", image: "/characters/khrys.png" },
  // Batch 4
  { id: "papercut", name: "Papercut", image: "/characters/papercut.png" },
  { id: "melder", name: "Melder", image: "/characters/melder.png" },
  { id: "mindwave", name: "Mindwave", image: "/characters/mindwave.png" },
  { id: "minerva", name: "Minerva", image: "/characters/minerva.png" },
  { id: "miniswipe", name: "Miniswipe", image: "/characters/miniswipe.png" },
  { id: "mopheous", name: "Mopheous", image: "/characters/mopheous.png" },
  { id: "negatron", name: "Negatron", image: "/characters/negatron.png" },
  { id: "oddball", name: "Oddball", image: "/characters/oddball.png" },
  { id: "onecent", name: "Onecent", image: "/characters/onecent.png" },
  { id: "overheater", name: "Overheater", image: "/characters/overheater.png" },
  // Batch 5
  { id: "scifon", name: "Scifon", image: "/characters/scifon.png" },
  { id: "pearle", name: "Pearle", image: "/characters/pearle.png" },
  { id: "qadara", name: "Qadara", image: "/characters/qadara.png" },
  { id: "rachelle", name: "Rachelle", image: "/characters/rachelle.png" },
  { id: "ratababy", name: "RatABaby", image: "/characters/ratababy.png" },
  { id: "ratapult", name: "RatAPult", image: "/characters/ratapult.png" },
  { id: "regan", name: "Regan", image: "/characters/regan.png" },
  { id: "remover", name: "Remover", image: "/characters/remover.png" },
  { id: "rerun", name: "Rerun", image: "/characters/rerun.png" },
  { id: "sarge", name: "Sarge", image: "/characters/sarge.png" },
  // Batch 6
  { id: "sprynk", name: "Sprynk", image: "/characters/sprynk.png" },
  { id: "seedlet", name: "Seedlet", image: "/characters/seedlet.png" },
  { id: "sizzle", name: "Sizzle", image: "/characters/sizzle.png" },
  { id: "snakedini", name: "Snakedini", image: "/characters/snakedini.png" },
  { id: "snakeskin", name: "Snakeskin", image: "/characters/snakeskin.png" },
  { id: "snapper", name: "Snapper", image: "/characters/snapper.png" },
  { id: "sparki", name: "Sparki", image: "/characters/sparki.png" },
  { id: "spelzz", name: "Spelzz", image: "/characters/spelzz.png" },
  { id: "spike", name: "Spike", image: "/characters/spike.png" },
  { id: "splyt", name: "Splyt", image: "/characters/splyt.png" },
];

// Number of characters to select for each game
export const GAME_CHARACTER_COUNT = 8;

// Randomly select N characters from the pool
export function selectRandomCharacters(count: number = GAME_CHARACTER_COUNT): Character[] {
  const shuffled = [...CHARACTER_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((char, index) => ({
    ...char,
    id: String(index), // Re-index for game logic
  }));
}
