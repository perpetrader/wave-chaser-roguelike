import { useState } from "react";
import { OptionsTrainerGame } from "@/components/optionstrainer/OptionsTrainerGame";
import { DifficultySelect, Difficulty } from "@/components/optionstrainer/DifficultySelect";

const OptionsTrainer = () => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  if (!difficulty) {
    return <DifficultySelect onSelect={setDifficulty} />;
  }

  return <OptionsTrainerGame difficulty={difficulty} onBack={() => setDifficulty(null)} />;
};

export default OptionsTrainer;
