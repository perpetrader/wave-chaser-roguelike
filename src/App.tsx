import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppErrorBoundary } from "@/components/app/AppErrorBoundary";

const Home = lazy(() => import("./pages/Home"));
const Index = lazy(() => import("./pages/Index"));
const DucksInARow = lazy(() => import("./pages/DucksInARow"));
const Mastermind = lazy(() => import("./pages/Mastermind"));
const Novadoku = lazy(() => import("./pages/Novadoku"));
const Pokergrada = lazy(() => import("./pages/Pokergrada"));
const PokerBoggle = lazy(() => import("./pages/PokerBoggle"));
const SlidePoker = lazy(() => import("./pages/SlidePoker"));
const PokerSwap = lazy(() => import("./pages/PokerSwap"));
const WavesOfAnguilla = lazy(() => import("./pages/WavesOfAnguilla"));
const WaveChaserRoguelike = lazy(() => import("./pages/WaveChaserRoguelike"));
const OptionsTrainer = lazy(() => import("./pages/OptionsTrainer"));
const DailyPokerPowerUp = lazy(() => import("./pages/DailyPokerPowerUp"));
const BarkingGlad = lazy(() => import("./pages/BarkingGlad"));
const TrunkDiagram = lazy(() => import("./pages/TrunkDiagram"));
const Install = lazy(() => import("./pages/Install"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const AppLoading = () => (
  <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
    <div className="text-muted-foreground">Loading…</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<AppLoading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/rock-paper-scissors" element={<Index />} />
              <Route path="/ducks-in-a-row" element={<DucksInARow />} />
              <Route path="/code-breaker" element={<Mastermind />} />
              <Route path="/novadoku" element={<Novadoku />} />
              <Route path="/pokergrada" element={<Pokergrada />} />
              <Route path="/poker-boggle" element={<PokerBoggle />} />
              <Route path="/slide-poker" element={<SlidePoker />} />
              <Route path="/poker-swap" element={<PokerSwap />} />
              <Route path="/waves-of-anguilla" element={<WavesOfAnguilla />} />
              <Route path="/wave-chaser-roguelike" element={<WaveChaserRoguelike />} />
              <Route path="/options-trainer" element={<OptionsTrainer />} />
              <Route path="/daily-poker" element={<DailyPokerPowerUp />} />
              <Route path="/barking-glad" element={<BarkingGlad />} />
              <Route path="/trunk-diagram" element={<TrunkDiagram />} />
              <Route path="/install" element={<Install />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
