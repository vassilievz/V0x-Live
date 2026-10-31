import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import { initAntiDevtool } from "@/lib/initAntiDevtool";
import "@/i18n";
import "@/styles/index.css";

initAntiDevtool();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
