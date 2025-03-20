// /Users/zukonkonjane/Verista/frontend/src/components/StatsSection.jsx
import React from 'react';

const StatsSection = () => {
  return (
    <section className="py-16 bg-blue-600 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Making a Real Difference</h2>
          <p className="text-blue-100 mt-2">Our impact in numbers</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">5,000+</div>
            <div className="text-xl text-blue-100">Students Protected</div>
          </div>
          
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">98%</div>
            <div className="text-xl text-blue-100">On-Time Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">350+</div>
            <div className="text-xl text-blue-100">Verified Drivers</div>
          </div>
          
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">45+</div>
            <div className="text-xl text-blue-100">School Partners</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;