import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { IntercomProvider } from "react-use-intercom";
import "./App.css"; // Import the CSS file

const INTERCOM_APP_ID = "vzrjxxpp";

function HomePage() {
  return <h1>🏠 Home Page</h1>;
}

function AboutPage() {
  return <h1>ℹ️ About Page</h1>;
}

function App() {
  return (
    <IntercomProvider appId={INTERCOM_APP_ID}>
      <div className="App">
        <nav>
          <Link to="/">Home</Link> | <Link to="/about">About</Link>
        </nav>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </div>
    </IntercomProvider>
  );
}

export default App;