// /Users/zukonkonjane/Verista/frontend/src/components/VideoSection.jsx
import React from 'react';

const VideoSection = () => {
  return (
    <section className="py-24 text-center bg-gray-50 relative overflow-hidden">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "url('data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E')",
      }}/>
      
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-2xl font-medium text-blue-600 mb-2">HOW IT WORKS</h2>
        <h3 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800">See Verista in action</h3>
        
        <div className="relative max-w-3xl mx-auto group">
          <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-xl shadow-lg overflow-hidden transform transition-all group-hover:scale-[1.01] group-hover:shadow-xl">
            {/* Video Placeholder - Replace with actual video embed */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700/20 to-black/40 text-gray-500">
              <span className="text-lg text-white">Video Placeholder</span>
            </div>
            
            {/* Play button with hover effect */}
            <button className="absolute inset-0 w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <div className="bg-blue-600 p-5 rounded-full text-white shadow-lg transform transition-all group-hover:bg-blue-700 group-hover:scale-110 pulse-animation">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </button>
          </div>
        </div>
        <p className="text-gray-600 mt-6 text-lg max-w-2xl mx-auto">
          Discover how Verista ensures your child's safe commute in under 2 minutes, showing real-time tracking, notifications, and emergency protocols in action.
        </p>
      </div>
    </section>
  );
};

export default VideoSection;