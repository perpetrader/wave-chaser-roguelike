import { BrowserRouter, Routes, Route } from "react-router-dom";
import GameScreen from "@/ui/screens/GameScreen";

const App = () => (
  <BrowserRouter basename="/wave-chaser-roguelike">
    <Routes>
      <Route path="/" element={<GameScreen />} />
    </Routes>
  </BrowserRouter>
);

export default App;
