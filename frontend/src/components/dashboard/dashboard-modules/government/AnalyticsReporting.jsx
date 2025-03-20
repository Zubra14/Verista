import React, { useState } from 'react';

const AnalyticsReporting = () => {
  // Sample data for demonstration purposes
  const [timeframe, setTimeframe] = useState('monthly');
  
  // Sample data that would come from your API
  const complianceData = {
    monthly: {
      totalVehicles: 1250,
      compliantVehicles: 1135,
      pendingInspections: 72,
      failedInspections: 43,
      complianceRate: 90.8
    },
    quarterly: {
      totalVehicles: 3748,
      compliantVehicles: 3456,
      pendingInspections: 185,
      failedInspections: 107,
      complianceRate: 92.2
    },
    yearly: {
      totalVehicles: 14928,
      compliantVehicles: 13842,
      pendingInspections: 712,
      failedInspections: 374,
      complianceRate: 92.7
    }
  };
  
  const currentData = complianceData[timeframe];
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Analytics & Reporting</h2>
        <div className="flex space-x-2">
          <select 
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Vehicles</p>
          <p className="text-2xl font-bold text-blue-700">{currentData.totalVehicles}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Compliance Rate</p>
          <p className="text-2xl font-bold text-green-700">{currentData.complianceRate}%</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Pending Inspections</p>
          <p className="text-2xl font-bold text-yellow-700">{currentData.pendingInspections}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Failed Inspections</p>
          <p className="text-2xl font-bold text-red-700">{currentData.failedInspections}</p>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3">Report Generation</h3>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Compliance Summary
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Safety Incident Report
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Operator Performance
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReporting;