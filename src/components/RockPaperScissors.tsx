import { useState, useCallback } from "react";
import { ChoiceButton } from "./ChoiceButton";
import { ScoreBoard } from "./ScoreBoard";
import { GameResult } from "./GameResult";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

type Choice = "rock" | "paper" | "scissors" | "spy" | "sniper";
type Result = "win" | "lose" | "tie" | null;

const regularChoices: ("rock" | "paper" | "scissors")[] = ["rock", "paper", "scissors"];
const specialChoices: ("spy" | "sniper")[] = ["spy", "sniper"];

const generateRandomInventory = (): Record<Choice, number> => {
  const amounts = [3, 4, 5];
  // Shuffle the amounts randomly
  for (let i = amounts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [amounts[i], amounts[j]] = [amounts[j], amounts[i]];
  }
  return {
    rock: amounts[0],
    paper: amounts[1],
    scissors: amounts[2],
    spy: 1,
    sniper: 1,
  };
};

// Spy: beats rock, paper, scissors. Ties spy. Loses to sniper.
// Sniper: ties rock, paper, scissors. Beats spy. Ties sniper.
const getResult = (player: Choice, computer: Choice): Result => {
  if (player === computer) return "tie";

  // Spy beats all regular, ties spy, loses to sniper
  if (player === "spy") {
    if (computer === "sniper") return "lose";
    return "win"; // beats rock, paper, scissors
  }
  if (computer === "spy") {
    if (player === "sniper") return "win";
    return "lose"; // computer spy beats player's rock/paper/scissors
  }

  // Sniper ties regular, beats spy (handled above), ties sniper
  if (player === "sniper") {
    // computer is rock, paper, or scissors at this point
    return "tie";
  }
  if (computer === "sniper") {
    // player is rock, paper, or scissors
    return "tie";
  }

  // Regular vs regular
  const winConditions: Record<"rock" | "paper" | "scissors", "rock" | "paper" | "scissors"> = {
    rock: "scissors",
    paper: "rock",
    scissors: "paper",
  };

  if (winConditions[player as "rock" | "paper" | "scissors"] === computer) {
    return "win";
  }
  return "lose";
};

const getComputerChoice = (inventory: Record<Choice, number>): Choice | null => {
  const allChoices: Choice[] = [...regularChoices, ...specialChoices];
  const available = allChoices.filter((c) => inventory[c] > 0);
  if (available.length === 0) return null;

  // 35% chance to use Spy if available
  if (inventory.spy > 0 && Math.random() < 0.35) {
    return "spy";
  }

  // 15% chance to use other specials if available
  const availableSpecials = specialChoices.filter((c) => c !== "spy" && inventory[c] > 0);
  if (availableSpecials.length > 0 && Math.random() < 0.15) {
    return availableSpecials[Math.floor(Math.random() * availableSpecials.length)];
  }

  // Otherwise pick from regular choices
  const regularAvailable = regularChoices.filter((c) => inventory[c] > 0);
  if (regularAvailable.length === 0) {
    const allSpecials = specialChoices.filter((c) => inventory[c] > 0);
    return allSpecials[Math.floor(Math.random() * allSpecials.length)];
  }
  return regularAvailable[Math.floor(Math.random() * regularAvailable.length)];
};

const specialDescriptions: Record<"spy" | "sniper", string> = {
  spy: "Beats 🪨📄✂️, loses to 👀",
  sniper: "Beats 🕵️, ties 🪨📄✂️",
};

export const RockPaperScissors = () => {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scores, setScores] = useState({ player: 0, computer: 0, ties: 0 });
  const [round, setRound] = useState(1);
  const [playerInventory, setPlayerInventory] = useState(() => generateRandomInventory());
  const [computerInventory, setComputerInventory] = useState(() => generateRandomInventory());
  const [matchOver, setMatchOver] = useState(false);

  const totalRounds = 10;

  const playGame = useCallback((choice: Choice) => {
    if (isPlaying || playerInventory[choice] <= 0 || matchOver) return;

    setIsPlaying(true);
    setPlayerChoice(choice);
    setResult(null);
    setComputerChoice(null);

    // Decrease player inventory
    setPlayerInventory((prev) => ({
      ...prev,
      [choice]: prev[choice] - 1,
    }));

    setTimeout(() => {
      const computer = getComputerChoice(computerInventory);
      if (!computer) {
        setIsPlaying(false);
        return;
      }

      setComputerChoice(computer);
      setComputerInventory((prev) => ({
        ...prev,
        [computer]: prev[computer] - 1,
      }));

      const gameResult = getResult(choice, computer);
      setResult(gameResult);

      setScores((prev) => ({
        player: prev.player + (gameResult === "win" ? 1 : 0),
        computer: prev.computer + (gameResult === "lose" ? 1 : 0),
        ties: prev.ties + (gameResult === "tie" ? 1 : 0),
      }));

      setIsPlaying(false);
    }, 800);
  }, [isPlaying, playerInventory, computerInventory, matchOver]);

  const nextRound = () => {
    if (round < totalRounds) {
      setRound((prev) => prev + 1);
      setPlayerChoice(null);
      setComputerChoice(null);
      setResult(null);
    }
  };

  const finishMatch = () => {
    setMatchOver(true);
  };

  const resetGame = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
    setScores({ player: 0, computer: 0, ties: 0 });
    setRound(1);
    setPlayerInventory(generateRandomInventory());
    setComputerInventory(generateRandomInventory());
    setMatchOver(false);
  };

  const getFinalResult = () => {
    if (scores.player > scores.computer) return "win";
    if (scores.computer > scores.player) return "lose";
    return "tie";
  };

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto px-4">
      {/* Header */}
      <header className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display text-gradient mb-2">
          ROCK, PAPER, SCISSORS, SNIPE!
        </h1>
        <p className="text-muted-foreground">
          Round <span className="text-primary font-bold">{round}</span> of {totalRounds}
        </p>
      </header>

      {/* Scoreboard */}
      <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
        <ScoreBoard
          playerScore={scores.player}
          computerScore={scores.computer}
          ties={scores.ties}
        />
      </div>

      {/* Match Over Screen */}
      {matchOver && (
        <div className="text-center mb-8 animate-bounce-in">
          <h2 className="text-2xl sm:text-3xl font-display text-muted-foreground mb-2">
            MATCH OVER
          </h2>
          <p className={`text-4xl sm:text-5xl font-display ${
            getFinalResult() === "win" ? "text-win" : 
            getFinalResult() === "lose" ? "text-lose" : "text-tie"
          }`}>
            {getFinalResult() === "win" ? "YOU WON THE MATCH! 🏆" :
             getFinalResult() === "lose" ? "CPU WINS THE MATCH" :
             "MATCH TIED!"}
          </p>
          <Button
            onClick={resetGame}
            size="lg"
            className="mt-6 font-display text-lg px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105"
          >
            Play New Match
          </Button>
        </div>
      )}

      {/* Battle Arena */}
      {!matchOver && (playerChoice || computerChoice) && (
        <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6">
          <div className="flex flex-col items-center">
            <span className="text-xs sm:text-sm text-muted-foreground mb-2 uppercase tracking-wider">You</span>
            {playerChoice && (
              <ChoiceButton
                choice={playerChoice}
                onClick={() => {}}
                selected
                disabled
                winAnimation={
                  result === "win" && playerChoice === "rock" && computerChoice === "scissors" ? "rock-crush-right" :
                  result === "win" && playerChoice === "paper" && computerChoice === "rock" ? "paper-wrap-right" :
                  result === "win" && playerChoice === "scissors" && computerChoice === "paper" ? "scissors-cut-right" :
                  result === "lose" && computerChoice === "rock" && playerChoice === "scissors" ? "crushed" :
                  result === "lose" && computerChoice === "paper" && playerChoice === "rock" ? "crushed" :
                  result === "lose" && computerChoice === "scissors" && playerChoice === "paper" ? "crushed" :
                  null
                }
              />
            )}
          </div>

          <div className="text-2xl sm:text-3xl font-display text-muted-foreground">
            VS
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs sm:text-sm text-muted-foreground mb-2 uppercase tracking-wider">CPU</span>
            {computerChoice ? (
              <ChoiceButton
                choice={computerChoice}
                onClick={() => {}}
                selected
                disabled
                isComputer
                winAnimation={
                  result === "lose" && computerChoice === "rock" && playerChoice === "scissors" ? "rock-crush-left" :
                  result === "lose" && computerChoice === "paper" && playerChoice === "rock" ? "paper-wrap-left" :
                  result === "lose" && computerChoice === "scissors" && playerChoice === "paper" ? "scissors-cut-left" :
                  result === "win" && playerChoice === "rock" && computerChoice === "scissors" ? "crushed" :
                  result === "win" && playerChoice === "paper" && computerChoice === "rock" ? "crushed" :
                  result === "win" && playerChoice === "scissors" && computerChoice === "paper" ? "crushed" :
                  null
                }
              />
            ) : (
              <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl border-2 border-border bg-card flex items-center justify-center">
                <span className="text-3xl xs:text-4xl sm:text-5xl animate-shake">❓</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Result Display */}
      {!matchOver && result && (
        <div className="mb-6">
          <GameResult result={result} />
        </div>
      )}

      {/* Choice Buttons with Inventory */}
      {!matchOver && !playerChoice && (
        <div className="w-full">
          <p className="text-center text-sm text-muted-foreground mb-4">Your remaining choices:</p>
          
          {/* Regular choices */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6">
            {regularChoices.map((choice) => (
              <div key={choice} className="flex flex-col items-center">
                <ChoiceButton
                  choice={choice}
                  onClick={() => playGame(choice)}
                  disabled={isPlaying || playerInventory[choice] <= 0}
                />
                <span className={`mt-2 text-sm font-medium ${
                  playerInventory[choice] === 0 ? "text-destructive" : "text-primary"
                }`}>
                  {playerInventory[choice]} left
                </span>
              </div>
            ))}
          </div>

          {/* Special choices */}
          <div className="p-4 rounded-2xl border border-secondary/30 bg-gradient-to-b from-secondary/5 to-accent/5">
            <p className="text-center text-xs text-secondary uppercase tracking-widest mb-4">⭐ Special Moves ⭐</p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              {specialChoices.map((choice) => (
                <div key={choice} className="flex flex-col items-center">
                  <ChoiceButton
                    choice={choice}
                    onClick={() => playGame(choice)}
                    disabled={isPlaying || playerInventory[choice] <= 0}
                  />
                  <span className={`mt-2 text-xs font-medium ${
                    playerInventory[choice] === 0 ? "text-destructive" : "text-accent"
                  }`}>
                    {playerInventory[choice] === 0 ? "Used!" : `${playerInventory[choice]} left`}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {specialDescriptions[choice]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Next Round / Finish Match Button */}
      {!matchOver && result && round < totalRounds && (
        <Button
          onClick={nextRound}
          size="lg"
          className="mt-4 font-display text-lg px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105"
        >
          Next Round
        </Button>
      )}

      {!matchOver && result && round >= totalRounds && (
        <Button
          onClick={finishMatch}
          size="lg"
          className="mt-4 font-display text-lg px-8 py-6 bg-gradient-to-r from-secondary to-accent text-primary-foreground hover:opacity-90 transition-all duration-300 hover:scale-105"
        >
          See Final Results
        </Button>
      )}

      {/* CPU Inventory Display */}
      {!matchOver && (
        <div className="mt-8 p-4 rounded-xl bg-card/30 border border-border/50">
          <p className="text-xs text-muted-foreground mb-2 text-center uppercase tracking-wider">CPU Remaining</p>
          <div className="flex gap-4 justify-center text-sm flex-wrap">
            <span className={computerInventory.rock === 0 ? "text-destructive" : "text-foreground"}>
              🪨 {computerInventory.rock}
            </span>
            <span className={computerInventory.paper === 0 ? "text-destructive" : "text-foreground"}>
              📄 {computerInventory.paper}
            </span>
            <span className={computerInventory.scissors === 0 ? "text-destructive" : "text-foreground"}>
              ✂️ {computerInventory.scissors}
            </span>
            <span className="text-muted-foreground">|</span>
            <span className={computerInventory.spy === 0 ? "text-destructive" : "text-accent"}>
              🕵️ {computerInventory.spy}
            </span>
            <span className={computerInventory.sniper === 0 ? "text-destructive" : "text-accent"}>
              🎯 {computerInventory.sniper}
            </span>
          </div>
        </div>
      )}

      {/* Reset Button */}
      {!matchOver && round > 1 && (
        <Button
          onClick={resetGame}
          variant="ghost"
          className="mt-6 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Restart Match
        </Button>
      )}
    </div>
  );
};
