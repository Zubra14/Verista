// src/components/dashboard-modules/parent/TripHistory.jsx
import React, { useState } from 'react';

export const TripHistory = () => {
  const [selectedMonth, setSelectedMonth] = useState('March 2025');
  
  const tripData = [
    { id: 1, date: 'Mar 14, 2025', departure: '07:30 AM', arrival: '07:52 AM', driver: 'John Dube', status: 'Completed' },
    { id: 2, date: 'Mar 13, 2025', departure: '07:32 AM', arrival: '07:55 AM', driver: 'John Dube', status: 'Completed' },
    { id: 3, date: 'Mar 12, 2025', departure: '07:29 AM', arrival: '07:50 AM', driver: 'Sarah Nkosi', status: 'Completed' },
    { id: 4, date: 'Mar 11, 2025', departure: '07:31 AM', arrival: '07:58 AM', driver: 'John Dube', status: 'Completed' },
    { id: 5, date: 'Mar 10, 2025', departure: '07:35 AM', arrival: '08:05 AM', driver: 'John Dube', status: 'Delayed' },
    { id: 6, date: 'Mar 7, 2025', departure: '07:30 AM', arrival: '07:49 AM', driver: 'Sarah Nkosi', status: 'Completed' },
    { id: 7, date: 'Mar 6, 2025', departure: '07:28 AM', arrival: '07:51 AM', driver: 'John Dube', status: 'Completed' },
    { id: 8, date: 'Mar 5, 2025', departure: '07:34 AM', arrival: '08:10 AM', driver: 'John Dube', status: 'Delayed' }
  ];
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Trip History</h1>
        <p className="text-gray-500">View and analyze past school transportation trips</p>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option>March 2025</option>
            <option>February 2025</option>
            <option>January 2025</option>
          </select>
          
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
              All
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
              Completed
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
              Delayed
            </button>
          </div>
        </div>
        
        <button className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Export
        </button>
      </div>
      
      {/* Trip Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Departure
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arrival
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tripData.map((trip) => {
                // Calculate duration (simplified)
                const duration = "22 min";
                
                return (
                  <tr key={trip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {trip.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trip.departure}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trip.arrival}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trip.driver}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        trip.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                      <button className="text-blue-600 hover:text-blue-900">Report</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">8</span> of <span className="font-medium">20</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Previous
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-blue-600 hover:bg-blue-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  2
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  3
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};