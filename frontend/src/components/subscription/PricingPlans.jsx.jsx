// src/components/subscription/PricingPlans.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const PricingPlans = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Define role-specific pricing plans
  const pricingPlans = {
    parent: [
      {
        id: "basic-parent",
        name: "Basic",
        price: 450,
        features: ["GPS tracking", "Basic notifications", "Emergency alerts"],
        color: "blue",
      },
      {
        id: "standard-parent",
        name: "Standard",
        price: 1000,
        features: [
          "GPS tracking",
          "Enhanced notifications",
          "Route history",
          "Driver information",
          "Priority support (email)",
        ],
        isPopular: true,
        color: "blue",
      },
      {
        id: "premium-parent",
        name: "Premium",
        price: 2000,
        features: [
          "GPS tracking",
          "Advanced notifications",
          "Live video feeds",
          "Route history",
          "Complete driver information",
          "Priority support (24/7)",
        ],
        color: "blue",
      },
    ],
    driver: [
      {
        id: "basic-driver",
        name: "Basic",
        price: 350,
        features: [
          "Route access",
          "Basic student management",
          "Compliance tools",
        ],
        color: "green",
      },
      {
        id: "standard-driver",
        name: "Standard",
        price: 800,
        features: [
          "Route optimization",
          "Student management",
          "Enhanced compliance tools",
          "Driver reputation management",
        ],
        isPopular: true,
        color: "green",
      },
      {
        id: "premium-driver",
        name: "Premium",
        price: 1500,
        features: [
          "Advanced route optimization",
          "Complete student management",
          "Comprehensive compliance tools",
          "Enhanced driver reputation",
          "Revenue reports",
          "Priority support",
        ],
        color: "green",
      },
    ],
    school: [
      {
        id: "basic-school",
        name: "Basic",
        price: 2500,
        features: [
          "Up to 50 students",
          "Basic compliance dashboard",
          "Route management",
          "Driver verification",
        ],
        color: "yellow",
      },
      {
        id: "standard-school",
        name: "Standard",
        price: 5000,
        features: [
          "Up to 200 students",
          "Advanced compliance dashboard",
          "Fleet management",
          "System integration options",
          "Analytics reports",
        ],
        isPopular: true,
        color: "yellow",
      },
      {
        id: "premium-school",
        name: "Premium",
        price: 10000,
        features: [
          "Unlimited students",
          "Comprehensive compliance dashboard",
          "Advanced fleet management",
          "Complete system integration",
          "Advanced analytics",
          "24/7 priority support",
        ],
        color: "yellow",
      },
    ],
    government: [
      {
        id: "custom-government",
        name: "Custom Solution",
        price: "Contact for pricing",
        features: [
          "Customized regulatory dashboards",
          "Compliance monitoring",
          "Safety analytics",
          "Emergency management",
          "Regional deployment options",
          "Integration with existing systems",
        ],
        isPopular: true,
        color: "purple",
      },
    ],
  };

  // Get plans based on user role or default to parent
  const userRole = currentUser?.role || "parent";
  const plans = pricingPlans[userRole] || pricingPlans.parent;

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
    // Will integrate with payment processing
  };

  const handleSubscribe = () => {
    if (!selectedPlan) return;

    if (currentUser) {
      // Navigate to checkout with selected plan
      navigate(`/checkout?plan=${selectedPlan}`);
    } else {
      // Store selection and redirect to signup
      localStorage.setItem("selectedPlan", selectedPlan);
      navigate("/signup");
    }
  };

  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Subscription Plans
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the right plan for your needs. All plans include our core
            safety features.
          </p>

          {/* Role selector if not logged in */}
          {!currentUser && (
            <div className="mt-8 flex justify-center">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                {Object.keys(pricingPlans).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setUserRole(role)}
                    className={`px-4 py-2 text-sm font-medium ${
                      userRole === role
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } ${role === "parent" ? "rounded-l-md" : ""} ${
                      role === "government" ? "rounded-r-md" : ""
                    }`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white border rounded-lg shadow-sm divide-y divide-gray-200 ${
                plan.isPopular ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 px-4 py-1 bg-blue-500 text-white text-xs font-semibold rounded-bl-lg rounded-tr-lg">
                  Popular
                </div>
              )}

              <div className="p-6">
                <h3 className="text-xl font-medium text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-4 text-sm text-gray-500">
                  {plan.description ||
                    `The perfect plan for ${userRole}s looking for essential features.`}
                </p>
                <p className="mt-8">
                  {typeof plan.price === "number" ? (
                    <span className="text-4xl font-extrabold text-gray-900">
                      R{plan.price}
                    </span>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                  )}
                  {typeof plan.price === "number" && (
                    <span className="text-base font-medium text-gray-500">
                      /mo
                    </span>
                  )}
                </p>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`mt-8 block w-full bg-${plan.color}-600 text-white rounded-md py-2 font-medium text-sm hover:bg-${plan.color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${plan.color}-500`}
                >
                  Select Plan
                </button>
              </div>

              <div className="pt-6 pb-8 px-6">
                <h4 className="text-sm font-medium text-gray-900 tracking-wide">
                  What's included
                </h4>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex">
                      <svg
                        className="flex-shrink-0 h-5 w-5 text-green-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-2 text-sm text-gray-500">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {selectedPlan && (
          <div className="mt-8 text-center">
            <button
              onClick={handleSubscribe}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Subscribe Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingPlans;
