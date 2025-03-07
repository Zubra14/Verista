import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

console.log("✅ index.js is loading...");

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ ERROR: 'root' element is missing from index.html");
} else {
  console.log("✅ Found 'root' element:", rootElement);

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}