import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./lib/theme";
import "./index.css";

if (!window.location.hash) {
  window.location.hash = "#/";
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
);
