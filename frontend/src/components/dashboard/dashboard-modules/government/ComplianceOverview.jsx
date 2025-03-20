import React, { useState } from 'react';

const ComplianceOverview = () => {
  const [selectedRegion, setSelectedRegion] = useState('all');
  
  // Sample compliance data that would come from your API
  const complianceData = {
    all: {
      overallComplianceRate: 87,
      totalOperators: 450,
      compliantOperators: 392,
      totalVehicles: 1250,
      compliantVehicles: 1088,
      recentInspections: [
        { id: 1, operator: "City Transport Services", date: "2025-03-14", status: "Compliant", score: 94 },
        { id: 2, operator: "Township Scholars", date: "2025-03-13", status: "Non-Compliant", score: 72 },
        { id: 3, operator: "Safe Journey Ltd", date: "2025-03-12", status: "Compliant", score: 89 },
        { id: 4, operator: "EduRide Services", date: "2025-03-11", status: "Compliant", score: 91 }
      ]
    },
    urban: {
      overallComplianceRate: 92,
      totalOperators: 215,
      compliantOperators: 198,
      totalVehicles: 685,
      compliantVehicles: 637,
      recentInspections: [
        { id: 1, operator: "City Transport Services", date: "2025-03-14", status: "Compliant", score: 94 },
        { id: 3, operator: "Safe Journey Ltd", date: "2025-03-12", status: "Compliant", score: 89 }
      ]
    },
    township: {
      overallComplianceRate: 84,
      totalOperators: 162,
      compliantOperators: 136,
      totalVehicles: 428,
      compliantVehicles: 344,
      recentInspections: [
        { id: 2, operator: "Township Scholars", date: "2025-03-13", status: "Non-Compliant", score: 72 },
        { id: 4, operator: "EduRide Services", date: "2025-03-11", status: "Compliant", score: 91 }
      ]
    },
    rural: {
      overallComplianceRate: 78,
      totalOperators: 73,
      compliantOperators: 58,
      totalVehicles: 137,
      compliantVehicles: 107,
      recentInspections: []
    }
  };

  const currentData = complianceData[selectedRegion];
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Compliance Overview</h2>
        <div>
          <select 
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <option value="all">All Regions</option>
            <option value="urban">Urban Areas</option>
            <option value="township">Township Areas</option>
            <option value="rural">Rural Areas</option>
          </select>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <span className="text-3xl font-bold text-blue-700">{currentData.overallComplianceRate}%</span>
          <span className="ml-2 text-gray-600">Overall Compliance Rate</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className={`h-4 rounded-full ${currentData.overallComplianceRate >= 90 ? 'bg-green-600' : currentData.overallComplianceRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${currentData.overallComplianceRate}%` }}
          ></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 mb-1">Operators</h3>
          <p className="text-lg font-semibold">
            <span className="text-green-600">{currentData.compliantOperators}</span> / {currentData.totalOperators}
          </p>
          <p className="text-xs text-gray-500">
            {Math.round((currentData.compliantOperators / currentData.totalOperators) * 100)}% Compliant
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 mb-1">Vehicles</h3>
          <p className="text-lg font-semibold">
            <span className="text-green-600">{currentData.compliantVehicles}</span> / {currentData.totalVehicles}
          </p>
          <p className="text-xs text-gray-500">
            {Math.round((currentData.compliantVehicles / currentData.totalVehicles) * 100)}% Compliant
          </p>
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Recent Inspections</h3>
        {currentData.recentInspections.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.recentInspections.map((inspection) => (
                  <tr key={inspection.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{inspection.operator}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{inspection.date}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${inspection.status === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {inspection.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{inspection.score}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No recent inspections for this region</p>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          View Detailed Reports
        </button>
        <button className="ml-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
          Schedule Inspections
        </button>
      </div>
    </div>
  );
};

export default ComplianceOverview;