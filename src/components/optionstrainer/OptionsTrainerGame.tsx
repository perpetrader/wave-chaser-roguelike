import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Difficulty, saveHighScore } from "./DifficultySelect";

interface Question {
  stockPrice: number;
  strike: number;
  callPrice: number;
  putPrice: number;
  basis: number; // 0 for non-hard/expert modes
  interest: number; // 0 for non-expert modes
  dividends: number; // 0 for non-expert modes
  hiddenType: 'call' | 'put';
  correctAnswer: number;
  options: number[];
}

const generateQuestion = (difficulty: Difficulty): Question => {
  let stockPrice: number;
  
  if (difficulty === 'beginner') {
    // Integer between 20-50
    stockPrice = Math.floor(20 + Math.random() * 31);
  } else if (difficulty === 'easy') {
    // Rounded to nearest .05, between 20-80
    stockPrice = Math.round((20 + Math.random() * 60) * 20) / 20;
  } else {
    // Full cents, between 20-120 (medium, hard, expert)
    stockPrice = Math.round((20 + Math.random() * 100) * 100) / 100;
  }
  
  // Strike: random integer within 20% of stock price
  const minStrike = Math.round(stockPrice * 0.8);
  const maxStrike = Math.round(stockPrice * 1.2);
  let strike = Math.floor(minStrike + Math.random() * (maxStrike - minStrike + 1));
  
  // In beginner/easy/medium modes, ensure strike ≠ stock to avoid trivial Call = Put scenarios
  // In hard/expert modes, basis creates meaningful differences so ATM is allowed
  if (difficulty !== 'hard' && difficulty !== 'expert') {
    const roundedStock = Math.round(stockPrice);
    if (strike === roundedStock) {
      // Shift strike by 1 in a random direction
      strike += Math.random() < 0.5 ? 1 : -1;
    }
  }
  
  // Interest and Dividends for expert mode
  // Interest: 0-5% of strike
  // Dividends: 0-2% of stock price
  // Basis = Interest - Dividends
  let interest = 0;
  let dividends = 0;
  let basis = 0;
  
  if (difficulty === 'expert') {
    interest = Math.round(strike * Math.random() * 0.05 * 100) / 100;
    dividends = Math.round(stockPrice * Math.random() * 0.02 * 100) / 100;
    basis = Math.round((interest - dividends) * 100) / 100;
  } else if (difficulty === 'hard') {
    basis = Math.round(stockPrice * Math.random() * 0.03 * 100) / 100;
  }
  
  // Call value calculation
  let callPrice: number;
  if (stockPrice > strike) {
    const intrinsic = stockPrice - strike;
    callPrice = Math.round((intrinsic + Math.random() * (intrinsic * 0.2)) * 100) / 100;
  } else {
    callPrice = Math.round(Math.random() * (strike / 5) * 100) / 100;
  }
  
  // Put price from equation: Call - Put = Stock - Strike + Basis
  // Put = Call - Stock + Strike - Basis
  const putPrice = Math.round((callPrice - stockPrice + strike - basis) * 100) / 100;
  
  // Randomly pick which to hide
  const hiddenType = Math.random() < 0.5 ? 'call' : 'put';
  const correctAnswer = hiddenType === 'call' ? callPrice : putPrice;
  
  // Generate wrong answers: 2 for beginner, 3 for all other difficulties
  const numWrongAnswers = difficulty === 'beginner' ? 2 : 3;
  const wrongAnswers: number[] = [];
  // Use a minimum range of $1 to avoid infinite loops with small correct answers
  const range = Math.max(correctAnswer * 0.1, 1);
  const minWrong = Math.max(0.01, correctAnswer - range);
  const maxWrong = correctAnswer + range;
  const minDiff = Math.min(0.05, range / 5); // Scale minimum difference for small values
  
  let attempts = 0;
  const maxAttempts = 100;
  
  while (wrongAnswers.length < numWrongAnswers && attempts < maxAttempts) {
    attempts++;
    const wrong = Math.round((minWrong + Math.random() * (maxWrong - minWrong)) * 100) / 100;
    // Ensure it's different from correct answer and other wrong answers
    if (Math.abs(wrong - correctAnswer) > minDiff && !wrongAnswers.some(w => Math.abs(w - wrong) < minDiff)) {
      wrongAnswers.push(wrong);
    }
  }
  
  // Fallback if we couldn't generate enough wrong answers
  while (wrongAnswers.length < numWrongAnswers) {
    const offset = (wrongAnswers.length + 1) * 0.5;
    wrongAnswers.push(Math.round((correctAnswer + offset) * 100) / 100);
  }
  
  // Shuffle options
  const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
  
  return {
    stockPrice,
    strike,
    callPrice,
    putPrice,
    basis,
    interest,
    dividends,
    hiddenType,
    correctAnswer,
    options,
  };
};

const generateQuestions = (difficulty: Difficulty): Question[] => {
  return Array.from({ length: 10 }, () => generateQuestion(difficulty));
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
};

interface OptionsTrainerGameProps {
  difficulty: Difficulty;
  onBack: () => void;
}

export const OptionsTrainerGame = ({ difficulty, onBack }: OptionsTrainerGameProps) => {
  const [questions, setQuestions] = useState<Question[]>(() => generateQuestions(difficulty));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);
  const autoAdvanceRef = useRef<number | null>(null);

  const question = questions[currentQuestion];

  // Timer effect
  useEffect(() => {
    if (!gameOver) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameOver]);

  // Reset answer state when question changes
  useEffect(() => {
    setSelectedAnswerIndex(null);
    setShowResult(false);
    
    // Cleanup any pending auto-advance timeout
    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
    };
  }, [currentQuestion]);

  const handleAnswer = (answer: number, answerIndex: number) => {
    if (showResult) return;
    
    setSelectedAnswerIndex(answerIndex);
    setShowResult(true);
    
    const isCorrect = Math.abs(answer - question.correctAnswer) < 0.01;
    if (isCorrect) {
      setScore(prev => prev + 1);
      // Auto-advance after correct answer
      autoAdvanceRef.current = window.setTimeout(() => {
        if (currentQuestion < 9) {
          setCurrentQuestion(prev => prev + 1);
        } else {
          finishGame();
        }
      }, 800);
    }
  };

  const finishGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setElapsedTime(finalTime);
    const isNew = saveHighScore(difficulty, score + 1, finalTime); // +1 because last correct answer hasn't been added yet
    setIsNewHighScore(isNew);
    setGameOver(true);
  }, [difficulty, score]);

  const handleNext = () => {
    if (currentQuestion < 9) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswerIndex(null);
      setShowResult(false);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      const finalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(finalTime);
      const isNew = saveHighScore(difficulty, score, finalTime);
      setIsNewHighScore(isNew);
      setGameOver(true);
    }
  };

  const handleRestart = useCallback(() => {
    setQuestions(generateQuestions(difficulty));
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswerIndex(null);
    setShowResult(false);
    setGameOver(false);
    setElapsedTime(0);
    setIsNewHighScore(false);
    startTimeRef.current = Date.now();
  }, [difficulty]);

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center border border-emerald-500/30">
          <h2 className="text-3xl font-bold text-white mb-4">Quiz Complete!</h2>
          <div className="text-6xl font-bold text-emerald-400 mb-2">{score}/10</div>
          <div className="flex items-center justify-center gap-2 text-white/60 mb-4">
            <Clock className="w-5 h-5" />
            <span className="text-xl">{formatTime(elapsedTime)}</span>
          </div>
          {isNewHighScore && (
            <div className="text-yellow-400 font-bold mb-4">🏆 New High Score!</div>
          )}
          <p className="text-white/70 mb-6">
            {score === 10 ? "Perfect! You're an options master!" :
             score >= 8 ? "Excellent work!" :
             score >= 6 ? "Good job! Keep practicing." :
             score >= 4 ? "Not bad, room for improvement." :
             "Keep studying the put-call parity!"}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={handleRestart} className="bg-emerald-600 hover:bg-emerald-700">
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
            <Button onClick={onBack} variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Change Difficulty
            </Button>
            <Link to="/">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Back to Games
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <div className="text-white/70">
          Question {currentQuestion + 1}/10 • Score: {score}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">Options Trainer</h1>
        <p className="text-emerald-400/70 text-sm mb-6 capitalize">{difficulty} Mode</p>
        
        {/* Price display cards */}
        <div className="grid grid-cols-2 gap-4 w-full mb-8">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-white/50 text-sm mb-1">Stock Price</div>
            <div className="text-2xl font-bold text-white">{formatPrice(question.stockPrice)}</div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-white/50 text-sm mb-1">Strike</div>
            <div className="text-2xl font-bold text-white">${question.strike}</div>
          </div>
          
          {/* Call Price - always left */}
          {question.hiddenType === 'call' ? (
            <div className="backdrop-blur-sm rounded-xl p-4 border-2 border-dashed border-emerald-500/50 bg-emerald-900/20">
              <div className="flex items-center gap-1 text-emerald-400/70 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Call Price
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {showResult ? formatPrice(question.correctAnswer) : "???"}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-900/50 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/30">
              <div className="flex items-center gap-1 text-emerald-400/70 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Call Price
              </div>
              <div className="text-2xl font-bold text-emerald-400">{formatPrice(question.callPrice)}</div>
            </div>
          )}
          
          {/* Put Price - always right */}
          {question.hiddenType === 'put' ? (
            <div className="backdrop-blur-sm rounded-xl p-4 border-2 border-dashed border-red-500/50 bg-red-900/20">
              <div className="flex items-center gap-1 text-red-400/70 text-sm mb-1">
                <TrendingDown className="w-4 h-4" />
                Put Price
              </div>
              <div className="text-2xl font-bold text-red-400">
                {showResult ? formatPrice(question.correctAnswer) : "???"}
              </div>
            </div>
          ) : (
            <div className="bg-red-900/50 backdrop-blur-sm rounded-xl p-4 border border-red-500/30">
              <div className="flex items-center gap-1 text-red-400/70 text-sm mb-1">
                <TrendingDown className="w-4 h-4" />
                Put Price
              </div>
              <div className="text-2xl font-bold text-red-400">{formatPrice(question.putPrice)}</div>
            </div>
          )}
          
          {/* Basis - only in hard mode */}
          {difficulty === 'hard' && (
            <div className="col-span-2 bg-amber-900/30 backdrop-blur-sm rounded-xl p-4 border border-amber-500/30">
              <div className="text-amber-400/70 text-sm mb-1">Basis (Cost of Carry)</div>
              <div className="text-2xl font-bold text-amber-400">{formatPrice(question.basis)}</div>
            </div>
          )}
          
          {/* Interest & Dividends - only in expert mode */}
          {difficulty === 'expert' && (
            <>
              <div className="bg-blue-900/30 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
                <div className="text-blue-400/70 text-sm mb-1">Interest</div>
                <div className="text-2xl font-bold text-blue-400">{formatPrice(question.interest)}</div>
              </div>
              <div className="bg-purple-900/30 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30">
                <div className="text-purple-400/70 text-sm mb-1">Dividends</div>
                <div className="text-2xl font-bold text-purple-400">{formatPrice(question.dividends)}</div>
              </div>
            </>
          )}
        </div>

        {/* Answer options */}
        <div className="w-full space-y-3 mb-6">
          <p className="text-white/70 text-center mb-4">
            What is the {question.hiddenType === 'call' ? 'Call' : 'Put'} Price?
          </p>
          {question.options.map((option, index) => {
            const isCorrect = Math.abs(option - question.correctAnswer) < 0.01;
            const isSelected = selectedAnswerIndex === index;
            
            let buttonClass = "w-full py-4 text-lg font-semibold transition-all ";
            if (showResult) {
              if (isCorrect) {
                buttonClass += "bg-emerald-600 hover:bg-emerald-600 text-white border-emerald-500";
              } else if (isSelected) {
                buttonClass += "bg-red-600 hover:bg-red-600 text-white border-red-500";
              } else {
                buttonClass += "bg-slate-700/50 text-white/50 border-white/10";
              }
            } else {
              buttonClass += "bg-slate-700 hover:bg-slate-600 text-white border-white/20";
            }
            
            return (
              <Button
                key={`${currentQuestion}-${index}`}
                onClick={() => handleAnswer(option, index)}
                disabled={showResult}
                variant="outline"
                className={buttonClass}
              >
                {formatPrice(option)}
              </Button>
            );
          })}
        </div>

        {/* Step-by-step breakdown for wrong answers */}
        {showResult && selectedAnswerIndex !== null && Math.abs(question.options[selectedAnswerIndex] - question.correctAnswer) >= 0.01 && (
          <div className="w-full bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/10 mb-6">
            <p className="text-white/70 text-sm font-semibold mb-3">Step-by-Step Solution:</p>
            <div className="space-y-2 text-sm font-mono">
              {difficulty === 'expert' ? (
                <>
                  <p className="text-white/60">
                    <span className="text-white/40">Formula:</span> Call − Put = Stock − Strike + Interest − Dividends
                  </p>
                  <p className="text-white/60">
                    <span className="text-white/40">Basis:</span> Interest − Dividends = {formatPrice(question.interest)} − {formatPrice(question.dividends)} = {formatPrice(question.basis)}
                  </p>
                  {question.hiddenType === 'put' ? (
                    <>
                      <p className="text-white/60">
                        <span className="text-white/40">Rearrange:</span> Put = Call − Stock + Strike − Interest + Dividends
                      </p>
                      <p className="text-white/60">
                        <span className="text-white/40">Plug in:</span> Put = {formatPrice(question.callPrice)} − {formatPrice(question.stockPrice)} + ${question.strike} − {formatPrice(question.interest)} + {formatPrice(question.dividends)}
                      </p>
                      <p className="text-white/60">
                        <span className="text-white/40">Calculate:</span> Put = {formatPrice(question.callPrice - question.stockPrice + question.strike - question.basis)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-white/60">
                        <span className="text-white/40">Rearrange:</span> Call = Put + Stock − Strike + Interest − Dividends
                      </p>
                      <p className="text-white/60">
                        <span className="text-white/40">Plug in:</span> Call = {formatPrice(question.putPrice)} + {formatPrice(question.stockPrice)} − ${question.strike} + {formatPrice(question.interest)} − {formatPrice(question.dividends)}
                      </p>
                      <p className="text-white/60">
                        <span className="text-white/40">Calculate:</span> Call = {formatPrice(question.putPrice + question.stockPrice - question.strike + question.basis)}
                      </p>
                    </>
                  )}
                </>
              ) : difficulty === 'hard' ? (
                <>
                  <p className="text-white/60">
                    <span className="text-white/40">Formula:</span> Call − Put = Stock − Strike + Basis
                  </p>
                  {question.hiddenType === 'put' ? (
                    <>
                      <p className="text-white/60">
                        <span className="text-white/40">Rearrange:</span> Put = Call − Stock + Strike − Basis
                      </p>
                      <p className="text-white/60">
                        <span className="text-white/40">Plug in:</span> Put = {formatPrice(question.callPrice)} − {formatPrice(question.stockPrice)} + ${question.strike} − {formatPrice(question.basis)}
                      </p>
                      <p className="text-white/60">
                        <span className="text-white/40">Calculate:</span> Put = {formatPrice(question.callPrice - question.stockPrice + question.strike - question.basis)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-white/60">
                        <span className="text-white/40">Rearrange:</span> Call = Put + Stock − Strike + Basis
                      </p>
                      <p className="text-white/60">
                        <span className="text-white/40">Plug in:</span> Call = {formatPrice(question.putPrice)} + {formatPrice(question.stockPrice)} − ${question.strike} + {formatPrice(question.basis)}
                      </p>
                      <p className="text-white/60">
                        <span className="text-white/40">Calculate:</span> Call = {formatPrice(question.putPrice + question.stockPrice - question.strike + question.basis)}
                      </p>
                    </>
                  )}
                </>
              ) : (
                <>
                  <p className="text-white/60">
                    <span className="text-white/40">Formula:</span> Call − Put = Stock − Strike
                  </p>
                  {question.hiddenType === 'put' ? (
                    <>
                      <p className="text-white/60">
                        <span className="text-white/40">Rearrange:</span> Put = Call − Stock + Strike
                      </p>
                      <p className="text-white/60">
                        <span className="text-white/40">Plug in:</span> Put = {formatPrice(question.callPrice)} − {formatPrice(question.stockPrice)} + ${question.strike}
                      </p>
                      <p className="text-white/60">
                        <span className="text-white/40">Calculate:</span> Put = {formatPrice(question.callPrice - question.stockPrice + question.strike)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-white/60">
                        <span className="text-white/40">Rearrange:</span> Call = Put + Stock − Strike
                      </p>
                      <p className="text-white/60">
                        <span className="text-white/40">Plug in:</span> Call = {formatPrice(question.putPrice)} + {formatPrice(question.stockPrice)} − ${question.strike}
                      </p>
                      <p className="text-white/60">
                        <span className="text-white/40">Calculate:</span> Call = {formatPrice(question.putPrice + question.stockPrice - question.strike)}
                      </p>
                    </>
                  )}
                </>
              )}
              <p className="text-emerald-400 font-semibold pt-2 border-t border-white/10">
                Answer: {formatPrice(question.correctAnswer)}
              </p>
            </div>
          </div>
        )}

        {/* Next button - only show for wrong answers */}
        {showResult && selectedAnswerIndex !== null && Math.abs(question.options[selectedAnswerIndex] - question.correctAnswer) >= 0.01 && (
          <Button 
            onClick={handleNext}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3"
          >
            {currentQuestion < 9 ? "Next Question" : "See Results"}
          </Button>
        )}

        {/* Formula hint */}
        <div className="mt-8 text-center text-white/40 text-sm">
          <p>
            Put-Call Parity: Call − Put = Stock − Strike
            {difficulty === 'hard' && " + Basis"}
            {difficulty === 'expert' && " + Interest − Dividends"}
          </p>
        </div>
      </div>
    </div>
  );
};
