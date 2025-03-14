import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { IntercomProvider } from "react-use-intercom";
import "./App.css";

const INTERCOM_APP_ID = "vzrjxxpp";

const Navbar = () => {
  return (
    <header className="bg-white shadow-lg fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-5">
          <Link to="/" className="flex items-center space-x-3">
            <img src="/favicon.svg" alt="Verista" className="h-10 w-auto" />
            <span className="text-2xl font-bold text-blue-600">Verista</span>
          </Link>
          <nav className="hidden md:flex space-x-8 lg:space-x-12 text-gray-700 text-lg font-medium">
            <Link to="/" className="hover:text-blue-500 transition">Home</Link>
            <Link to="/features" className="hover:text-blue-500 transition">Features</Link>
            <Link to="/pricing" className="hover:text-blue-500 transition">Pricing</Link>
            <Link to="/signup" className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all">
              Sign Up
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

const Hero = () => {
  return (
    <section className="pt-28 md:pt-36 h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl lg:text-6xl font-bold text-gray-800 mb-8 leading-tight">
          Transforming School Transportation <br className="hidden lg:inline" /> for a Safer South Africa
        </h1>
        <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
          Real-time GPS tracking, military-grade safety protocols, and government-
          approved compliance management for schools and families
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Link
            to="/how-it-works"
            className="px-8 py-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all"
          >
            Watch Demo
          </Link>
          <Link
            to="/signup"
            className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-full hover:bg-blue-50 transition-all"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
};

const VideoSection = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="relative w-full max-w-5xl mx-auto mb-12">
          <img
            src="https://via.placeholder.com/1200x675"
            alt="Video Preview"
            className="rounded-3xl shadow-2xl w-full"
          />
          <button className="absolute inset-0 flex items-center justify-center">
            <div className="bg-blue-600 p-6 rounded-full shadow-lg text-white text-4xl hover:bg-blue-700 transition-all">
              ▶
            </div>
          </button>
        </div>
        <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
          See how Verista ensures child safety and operational efficiency in 2 minutes
        </p>
      </div>
    </section>
  );
};

const KeyBenefits = () => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl lg:text-5xl font-bold text-blue-600 text-center mb-16">
          Why Choose Verista?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {[
            {
              icon: "🔍",
              title: "Real-time Tracking",
              text: "Live location updates for parents and schools"
            },
            {
              icon: "🛡️",
              title: "Driver Vetting",
              text: "Rigorous background checks and vehicle inspections"
            },
            {
              icon: "🗺️",
              title: "Route Optimization",
              text: "AI-powered route planning for efficiency"
            },
            {
              icon: "🚨",
              title: "Emergency Response",
              text: "Instant alerts for safety incidents"
            }
          ].map((item, index) => (
            <div key={index} className="p-8 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl text-blue-600 mb-6">{item.icon}</div>
              <h3 className="text-2xl font-semibold mb-4">{item.title}</h3>
              <p className="text-gray-600 text-lg">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const AuthenticationButtons = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl lg:text-5xl font-bold text-blue-600 mb-16">
          Login as:
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {[
            { role: "Parent", color: "blue" },
            { role: "Driver", color: "teal" },
            { role: "School", color: "green" },
            { role: "Government", color: "indigo" }
          ].map((item) => (
            <Link
              key={item.role}
              to={`/login/${item.role.toLowerCase()}`}
              className={`px-8 py-5 rounded-full shadow-lg text-white transition-all 
                ${item.color === "blue" && "bg-blue-600 hover:bg-blue-700"}
                ${item.color === "teal" && "bg-teal-600 hover:bg-teal-700"}
                ${item.color === "green" && "bg-green-600 hover:bg-green-700"}
                ${item.color === "indigo" && "bg-indigo-600 hover:bg-indigo-700"}
              `}
            >
              {item.role}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-base md:text-lg">
          © {new Date().getFullYear()} Verista. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

function App() {
  return (
    <IntercomProvider appId={INTERCOM_APP_ID}>
      <div className="min-h-screen">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Hero />} />
            <Route path="/how-it-works" element={<VideoSection />} />
            <Route path="/features" element={<KeyBenefits />} />
            <Route path="/login" element={<AuthenticationButtons />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </IntercomProvider>
  );
}

export default App;