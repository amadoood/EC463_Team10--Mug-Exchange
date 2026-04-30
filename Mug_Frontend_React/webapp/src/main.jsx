import { createRoot } from "react-dom/client";

// Apply saved theme before first render to avoid flash
const savedTheme = localStorage.getItem("theme") ||
  (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
document.documentElement.setAttribute("data-theme", savedTheme);
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(<App />);
