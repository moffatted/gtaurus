
/**
 * @file main.tsx
 * @purpose Application entry point for the Gtaurus frontend, responsible for mounting the React tree.
 */
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>,
);
