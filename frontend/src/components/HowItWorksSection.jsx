// /Users/zukonkonjane/Verista/frontend/src/components/HowItWorksSection.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const HowItWorksSection = () => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-blue-600 font-medium mb-2">PROCESS</h2>
          <h3 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">How Verista Works</h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform connects parents, schools, and drivers in a seamless ecosystem focused on safety and reliability.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-24 left-1/2 transform -translate-x-1/2 h-0.5 bg-blue-200" style={{ width: '70%' }}></div>
          
          {/* Step 1 */}
          <div className="relative">
            <div className="bg-white rounded-xl p-8 shadow-md relative z-10">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
              <div className="text-center mb-4">
                <div className="bg-blue-50 w-16 h-16 mx-auto rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Sign Up & Verification</h4>
                <p className="text-gray-600">Parents register their children, while drivers undergo thorough background checks and vehicle inspections.</p>
              </div>
            </div>
          </div>
          
          {/* Step 2 */}
          <div className="relative">
            <div className="bg-white rounded-xl p-8 shadow-md relative z-10">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">2</div>
              <div className="text-center mb-4">
                <div className="bg-blue-50 w-16 h-16 mx-auto rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Route Assignment & Monitoring</h4>
                <p className="text-gray-600">Students are assigned to verified transport providers, with routes optimized for efficiency and safety.</p>
              </div>
            </div>
          </div>
          
          {/* Step 3 */}
          <div className="relative">
            <div className="bg-white rounded-xl p-8 shadow-md relative z-10">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">3</div>
              <div className="text-center mb-4">
                <div className="bg-blue-50 w-16 h-16 mx-auto rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Real-Time Tracking & Notifications</h4>
                <p className="text-gray-600">Parents receive real-time updates on their child's journey, with alerts for pick-up, drop-off and any delays.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <Link to="/how-it-works" className="text-blue-600 font-medium flex items-center justify-center hover:text-blue-800 transition">
            View Detailed Process
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;