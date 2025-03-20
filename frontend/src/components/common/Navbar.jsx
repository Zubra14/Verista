// src/components/common/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Dynamic navigation items based on user role
  const getNavItems = () => {
    if (!currentUser) {
      return [
        { name: "Home", path: "/" },
        { name: "Features", path: "/features" },
        { name: "How It Works", path: "/how-it-works" },
        { name: "Pricing", path: "/pricing" },
        { name: "Contact", path: "/contact" },
      ];
    }

    // Base items for all users
    const items = [
      { name: "Dashboard", path: `/dashboard/${currentUser.role}` },
    ];

    // Role-specific items
    switch (currentUser.role) {
      case "parent":
        items.push(
          {
            name: "Live Tracking",
            path: `/dashboard/${currentUser.role}/tracking`,
          },
          {
            name: "Trip History",
            path: `/dashboard/${currentUser.role}/history`,
          }
        );
        break;
      case "driver":
        items.push(
          { name: "My Routes", path: `/dashboard/${currentUser.role}/routes` },
          { name: "My Vehicle", path: `/dashboard/${currentUser.role}/vehicle` }
        );
        break;
      case "school":
        items.push(
          { name: "Students", path: `/dashboard/${currentUser.role}/students` },
          { name: "Routes", path: `/dashboard/${currentUser.role}/routes` },
          { name: "Fleet", path: `/dashboard/${currentUser.role}/fleet` }
        );
        break;
      case "government":
        items.push(
          {
            name: "Compliance",
            path: `/dashboard/${currentUser.role}/compliance`,
          },
          {
            name: "Operators",
            path: `/dashboard/${currentUser.role}/operators`,
          },
          {
            name: "Analytics",
            path: `/dashboard/${currentUser.role}/analytics`,
          }
        );
        break;
      default:
        break;
    }

    return items;
  };

  // Get role-specific styling
  const getRoleStyles = () => {
    if (!currentUser) return { bg: "bg-blue-600", hover: "hover:bg-blue-700" };

    const styles = {
      parent: { bg: "bg-blue-600", hover: "hover:bg-blue-700" },
      driver: { bg: "bg-green-600", hover: "hover:bg-green-700" },
      school: { bg: "bg-yellow-600", hover: "hover:bg-yellow-700" },
      government: { bg: "bg-purple-600", hover: "hover:bg-purple-700" },
    };

    return styles[currentUser.role] || styles.parent;
  };

  const roleStyles = getRoleStyles();
  const navItems = getNavItems();

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <img className="h-8 w-auto" src="/favicon.svg" alt="Verista" />
                <span className="ml-2 text-xl font-bold text-blue-600">
                  Verista
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                    location.pathname === item.path ||
                    location.pathname.startsWith(`${item.path}/`)
                      ? `border-${roleStyles.bg.split("-")[1]} text-gray-900`
                      : "border-transparent text-gray-500 hover:border-blue-500 hover:text-gray-700"
                  } text-sm font-medium`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {!currentUser ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${roleStyles.bg} ${roleStyles.hover}`}
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="ml-4 relative flex-shrink-0">
                <div>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${roleStyles.bg}`}
                    >
                      {currentUser.name
                        ? currentUser.name.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                  </button>
                </div>
                {isDropdownOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                  >
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <p className="font-semibold">
                        {currentUser.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {currentUser.role}
                      </p>
                    </div>
                    <Link
                      to={`/dashboard/${currentUser.role}/profile`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Your Profile
                    </Link>
                    <Link
                      to={`/dashboard/${currentUser.role}/settings`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Settings
                    </Link>
                    <Link
                      to="/pricing"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Subscription
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon for menu open/close */}
              <svg
                className={`${isMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? "block" : "hidden"} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`block pl-3 pr-4 py-2 border-l-4 ${
                location.pathname === item.path
                  ? `border-${roleStyles.bg.split("-")[1]} text-${
                      roleStyles.bg.split("-")[1]
                    }-700 bg-${roleStyles.bg.split("-")[1]}-50`
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-blue-500 hover:text-gray-800"
              } text-base font-medium`}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          {currentUser ? (
            <div>
              <div className="flex items-center px-4">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${roleStyles.bg}`}
                >
                  {currentUser.name
                    ? currentUser.name.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {currentUser.name || "User"}
                  </div>
                  <div className="text-sm font-medium text-gray-500 capitalize">
                    {currentUser.role}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  to={`/dashboard/${currentUser.role}/profile`}
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-500 hover:text-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Your Profile
                </Link>
                <Link
                  to={`/dashboard/${currentUser.role}/settings`}
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-500 hover:text-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Settings
                </Link>
                <Link
                  to="/pricing"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-500 hover:text-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Subscription
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-500 hover:text-gray-800"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Link
                to="/login"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-500 hover:text-gray-800"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-500 hover:text-gray-800"
                onClick={() => setIsMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
