import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// Global error overlay for early/runtime failures
const showFatalError = (err) => {
  const message = err?.message || String(err);
  console.error("Fatal error:", err);
  const existing = document.getElementById("fatal-error-overlay");
  if (existing) return;
  const div = document.createElement("div");
  div.id = "fatal-error-overlay";
  div.style.cssText =
    "position:fixed;inset:0;z-index:99999;background:#fff;padding:24px;font-family:Segoe UI, sans-serif;color:#b91c1c;overflow:auto;";
  div.innerHTML = `<h1>App crashed</h1><p>${message}</p><pre style="white-space:pre-wrap;color:#444;">${err?.stack || ""}</pre>`;
  document.body.appendChild(div);
};

window.addEventListener("error", (e) => showFatalError(e?.error || e));
window.addEventListener("unhandledrejection", (e) => showFatalError(e?.reason || e));

const root = ReactDOM.createRoot(document.getElementById("root"));

import("./App.jsx")
  .then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  })
  .catch(showFatalError);
