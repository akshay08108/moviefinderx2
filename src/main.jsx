import React from "react";
import { createRoot } from "react-dom/client";
import App, { PlayerPage } from "./App.jsx";
import "./styles.css";

const isPlayerPage = new URLSearchParams(window.location.search).get("watch") === "1";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isPlayerPage ? <PlayerPage /> : <App />}
  </React.StrictMode>,
);
