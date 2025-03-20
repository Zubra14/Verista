// /Users/zukonkonjane/Verista/frontend/src/components/dashboard/KeyBenefits.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const FeatureCard = ({ icon, title, description, color }) => {
  // Different background colors based on feature category
  const bgColors = {
    blue: "bg-blue-50 border-blue-100",
    green: "bg-green-50 border-green-100",
    purple: "bg-purple-50 border-purple-100",
    yellow: "bg-yellow-50 border-yellow-100",
    red: "bg-red-50 border-red-100",
    indigo: "bg-indigo-50 border-indigo-100",
  };
  
  const iconColors = {
    blue: "text-blue-500",
    green: "text-green-500",
    purple: "text-purple-500",
    yellow: "text-yellow-500",
    red: "text-red-500",
    indigo: "text-indigo-500",
  };
  
  const bgColor = bgColors[color] || bgColors.blue;
  const iconColor = iconColors[color] || iconColors.blue;
  
  return (
    <div className="rounded-xl p-8 border shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white">
      <div className={`${bgColor} w-16 h-16 rounded-lg flex items-center justify-center mb-6`}>
        <div className={`${iconColor}`}>{icon}</div>
      </div>
      <h3 className="text-xl font-bold mb-3 text-gray-800">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

const KeyBenefits = () => {
  return (
    <section className="py-24 bg-white relative">
      {/* Subtle decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100 rounded-full opacity-20 translate-x-1/3 translate-y-1/3"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-blue-600 font-medium mb-2">BENEFITS</h2>
          <h3 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Why choose Verista?</h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our comprehensive platform offers unique advantages for all stakeholders in the school transportation ecosystem.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard 
            color="blue"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
            title="Enhanced Safety"
            description="Comprehensive driver and vehicle verification, real-time tracking, and emergency response systems ensure the highest safety standards for school transportation."
          />
          
          <FeatureCard 
            color="green"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            }
            title="Real-Time Tracking"
            description="Parents and schools can monitor transportation in real-time with GPS tracking, instant notifications for arrivals, departures, and any route deviations."
          />
          
          <FeatureCard 
            color="purple"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            title="Compliance & Regulation"
            description="Built-in compliance mechanisms ensure all transport providers meet safety standards, with transparent reporting for government regulatory bodies."
          />
          
          <FeatureCard 
            color="yellow"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            title="Inclusive Access"
            description="Solutions tailored for urban, township, and rural communities, ensuring all children have access to safe and reliable school transportation regardless of location."
          />
          
          <FeatureCard 
            color="red"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            title="Emergency Management"
            description="Standardized protocols for handling transportation emergencies, with instant notifications and support systems for quick response to any incidents."
          />
          
          <FeatureCard 
            color="indigo"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            title="Data-Driven Insights"
            description="Comprehensive analytics and reporting tools to optimize routes, improve safety measures, and make informed decisions about school transportation."
          />
        </div>
        
        <div className="mt-16 flex justify-center">
          <Link to="/get-started" className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700 transition duration-300 shadow-md mr-4">
            Get Started
          </Link>
          <Link to="/learn-more" className="px-8 py-4 bg-white text-blue-600 border border-blue-200 rounded-lg text-lg font-medium hover:bg-blue-50 transition duration-300 shadow-sm">
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
};

export default KeyBenefits;