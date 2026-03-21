import { cn } from "@/lib/utils";

interface FeedbackPegsProps {
  correct: number;
  misplaced: number;
  total: number;
}

export const FeedbackPegs = ({ correct, misplaced }: FeedbackPegsProps) => {
  return (
    <div className="flex flex-col shrink-0 text-xs font-medium leading-tight">
      <span className="text-green-400">Right Place: {correct}</span>
      <span className="text-yellow-400">Wrong Place: {misplaced}</span>
    </div>
  );
};
