import React from "react";
import { Link } from "react-router-dom";

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

export default AuthenticationButtons;