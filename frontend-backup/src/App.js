import React from "react";
import { Routes, Route } from "react-router-dom";
import { IntercomProvider } from "react-use-intercom";
import Navbar from "./components/Navbar"; // Import Navbar component
import "./App.css"; // Import the CSS file

const INTERCOM_APP_ID = "vzrjxxpp";

function HomePage() {
  return <h1 className="text-4xl font-bold text-blue-500">Hello, Tailwind!</h1>;
}

function AboutPage() {
  return <h1>ℹ️ About Page</h1>;
}

function App() {
  return (
    <IntercomProvider appId={INTERCOM_APP_ID}>
      <div className="App">
        <Navbar /> {/* Use Navbar component */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </div>
    </IntercomProvider>
  );
}

export default function App() {
  return (
    <h1 className="text-3xl font-bold text-blue-500 text-center mt-8">
      Tailwind CSS + Vite + React
    </h1>
  );
}