import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { startServiceWorker } from './lib/pwa';

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
  void startServiceWorker();
}
