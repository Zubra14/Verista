import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from '../public/favicon.svg'; // Adjust path as needed

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        
        {/* Logo */}
        <Link to="/" className="text-xl font-bold flex items-center">
          <img src={logo} alt="Logo" style={{ width: '30px', height: '30px', marginRight: '10px' }} />
          Verista
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6">
          <Link to="/" className="hover:text-gray-300">Home</Link>
          <Link to="/about" className="hover:text-gray-300">About</Link>
          <Link to="/services" className="hover:text-gray-300">Services</Link>
          <Link to="/contact" className="hover:text-gray-300">Contact</Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden focus:outline-none" 
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "✖" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-blue-700 p-4 space-y-2">
          <Link to="/" className="block hover:text-gray-300">Home</Link>
          <Link to="/about" className="block hover:text-gray-300">About</Link>
          <Link to="/services" className="block hover:text-gray-300">Services</Link>
          <Link to="/contact" className="block hover:text-gray-300">Contact</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;