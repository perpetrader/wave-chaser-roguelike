import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import WavesGame from "@/components/waves/WavesGame";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <BrowserRouter basename="/wave-chaser-roguelike">
      <Routes>
        <Route path="/" element={<WavesGame startInRoguelike />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
