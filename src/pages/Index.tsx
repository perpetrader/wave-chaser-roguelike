import { RockPaperScissors } from "@/components/RockPaperScissors";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Index = () => {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center py-8 sm:py-12">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Games
      </Link>
      <RockPaperScissors />
    </main>
  );
};

export default Index;
