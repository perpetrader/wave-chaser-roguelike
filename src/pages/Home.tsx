import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import novaCodeIcon from "@/assets/nova-code-icon.png";
import novadokuIcon from "@/assets/novadoku-icon.png";
import ducksIcon from "@/assets/ducks-icon.png";
import pokergradaIcon from "@/assets/pokergrada-icon.png";
import pokerBoggleIcon from "@/assets/poker-boggle-icon.png";
import slidePokerIcon from "@/assets/slide-poker-icon.png";
import pokerSwapIcon from "@/assets/poker-swap-icon.png";
import rpsIcon from "@/assets/rps-icon.png";
import wavesIcon from "@/assets/waves-icon.png";

interface GameCardProps {
  title: string;
  description: string;
  icon?: string;
  backgroundImage?: string;
  to: string;
  gradient: string;
  titleClassName?: string;
  descriptionClassName?: string;
  badge?: string;
}

const GameCard = ({ title, description, icon, backgroundImage, to, gradient, titleClassName, descriptionClassName, badge }: GameCardProps) => (
  <Link
    to={to}
    className={cn(
      "group relative flex flex-col items-center justify-center p-8 rounded-2xl overflow-hidden",
      "border-2 border-border transition-all duration-300",
      "hover:scale-105 hover:border-primary",
      backgroundImage ? "" : "bg-card/50 backdrop-blur-sm",
      gradient
    )}
  >
    {backgroundImage && (
      <img 
        src={backgroundImage} 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover"
      />
    )}
    {backgroundImage && <div className="absolute inset-0 bg-black/40" />}
    {icon && (
      <span className="relative z-10 text-6xl sm:text-7xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:animate-float">
        {icon}
      </span>
    )}
    <h2 className={cn("relative z-10 text-xl sm:text-2xl font-display text-white mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]", titleClassName)}>{title}</h2>
    <p className={cn("relative z-10 text-sm text-white/90 text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]", descriptionClassName)}>{description}</p>
    {badge && (
      <span className="absolute bottom-2 right-2 z-10 px-2 py-0.5 text-sm font-mono bg-black/60 text-white/70 rounded border border-white/20">
        {badge}
      </span>
    )}
  </Link>
);

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4">
      <header className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display text-gradient mb-4">
          GAME ARCADE
        </h1>
        <p className="text-muted-foreground text-lg">Choose a game to play</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl w-full">
        <GameCard
          title="Nova Numbers"
          description="Fill the grid with unique numbers"
          backgroundImage="/images/novadoku-card.png"
          to="/novadoku"
          gradient="hover:shadow-[0_0_40px_hsl(var(--secondary)/0.3)]"
          badge="v0.40"
        />
        <GameCard
          title="Wave Chaser"
          description="Touch the waves without getting too wet!"
          backgroundImage={wavesIcon}
          to="/waves-of-anguilla"
          gradient="hover:shadow-[0_0_40px_hsl(185_70%_50%/0.3)]"
          badge="v0.01"
        />
        <GameCard
          title="Wave Chaser: Roguelike"
          description="Progressive levels • Unlock abilities"
          backgroundImage={wavesIcon}
          to="/wave-chaser-roguelike"
          gradient="hover:shadow-[0_0_40px_hsl(280_70%_50%/0.3)]"
          badge="v0.959"
        />
        <GameCard
          title="Nova Code"
          description="Crack the secret character code"
          backgroundImage={novaCodeIcon}
          to="/code-breaker"
          gradient="hover:shadow-[0_0_40px_hsl(var(--accent)/0.3)]"
          badge="v0.60"
        />
        <GameCard
          title="Ducks in a Row"
          description="Slide ducks to match colors"
          backgroundImage={ducksIcon}
          to="/ducks-in-a-row"
          gradient="hover:shadow-[0_0_40px_hsl(var(--secondary)/0.3)]"
          badge="v0.01"
        />
        <GameCard
          title="Rock, Paper, Scissors, Snipe!"
          description="Classic hand game with special moves"
          backgroundImage={rpsIcon}
          to="/rock-paper-scissors"
          gradient="hover:shadow-[0_0_40px_hsl(var(--primary)/0.3)]"
          badge="v0.10"
        />
      </div>

      <h2 className="text-2xl sm:text-3xl font-display text-gradient mt-12 mb-6">
        Poker Games
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl w-full">
        <GameCard
          title="Daily Poker Power Up"
          description="Your daily dose of poker puzzles!"
          icon="🃏"
          to="/daily-poker"
          gradient="hover:shadow-[0_0_40px_hsl(45_80%_50%/0.3)]"
        />
        <GameCard
          title="Pokergrada"
          description="Poker solitaire puzzle"
          backgroundImage={pokergradaIcon}
          to="/pokergrada"
          gradient="hover:shadow-[0_0_40px_hsl(var(--primary)/0.3)]"
          badge="v0.51"
        />
        <GameCard
          title="Poker Boggle"
          description="Speed search for poker hands"
          backgroundImage={pokerBoggleIcon}
          to="/poker-boggle"
          gradient="hover:shadow-[0_0_40px_hsl(var(--accent)/0.3)]"
          badge="v0.21"
        />
        <GameCard
          title="Slide Poker"
          description="Slide puzzle meets poker"
          backgroundImage={slidePokerIcon}
          to="/slide-poker"
          gradient="hover:shadow-[0_0_40px_hsl(var(--secondary)/0.3)]"
          badge="v0.10"
        />
        <GameCard
          title="Poker Swap"
          description="Trade cards to make the best hands"
          backgroundImage={pokerSwapIcon}
          to="/poker-swap"
          gradient="hover:shadow-[0_0_40px_hsl(var(--primary)/0.3)]"
          badge="v0.02"
        />
      </div>

      <h2 className="text-2xl sm:text-3xl font-display text-gradient mt-12 mb-6">
        In Development
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl w-full">
        <GameCard
          title="Options Trainer"
          description="Learn put-call parity"
          icon="📈"
          to="/options-trainer"
          gradient="hover:shadow-[0_0_40px_hsl(150_70%_50%/0.3)]"
        />
      </div>

      <h2 className="text-2xl sm:text-3xl font-display text-gradient mt-12 mb-6">
        Mockups
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl w-full">
        <GameCard
          title="Barking Glad"
          description="Dog walking business mockup"
          icon="🐾"
          to="/barking-glad"
          gradient="hover:shadow-[0_0_40px_hsl(145_45%_42%/0.3)]"
        />
      </div>
    </div>
  );
};

export default Home;
