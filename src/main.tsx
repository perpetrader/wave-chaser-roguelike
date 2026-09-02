import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// StrictMode double-invokes state updaters and effects in dev to surface
// impurity. Safe to enable since the game loop refactor made all setState
// updaters pure (simulation side effects live in plain loop code).
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
