import { Button } from "@/components/ui/button";
import { AbilityType, UnlockedAbility } from "../RoguelikeAbilitySelect";

interface SlayActCompleteScreenProps {
  actNumber: number;
  slayGold: number;
  unlockedAbilities: UnlockedAbility[];
  selectedAbilities: AbilityType[];
  onEnterAct: () => void;
}

const SlayActCompleteScreen = ({
  actNumber,
  slayGold,
  unlockedAbilities,
  selectedAbilities,
  onEnterAct,
}: SlayActCompleteScreenProps) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80">
      <div className="bg-slate-800 rounded-xl p-8 max-w-md mx-4 text-center border-2 border-purple-500/50 shadow-2xl">
        <h2 className="text-3xl font-display text-purple-400 mb-2">
          Act {actNumber - 1} Complete!
        </h2>
        <p className="text-white/70 mb-1">
          {actNumber === 2 ? "The Shallows conquered. The Deep awaits..." : "The Deep conquered. The Abyss awaits..."}
        </p>
        <p className="text-yellow-400 text-2xl font-mono font-bold my-4">
          💰 {slayGold} gold
        </p>
        <p className="text-white/50 text-sm mb-6">
          {unlockedAbilities.length} abilities • {selectedAbilities.length}/4 equipped
        </p>
        <Button
          onClick={onEnterAct}
          className="bg-purple-600 hover:bg-purple-500 text-white font-display px-8 py-4 text-lg"
        >
          Enter Act {actNumber}
        </Button>
      </div>
    </div>
  );
};

export default SlayActCompleteScreen;
