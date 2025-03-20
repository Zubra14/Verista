import React, { useState } from 'react';

const TripHistory = () => {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [dateFilter, setDateFilter] = useState('lastWeek');
  
  // Sample trip history data
  const trips = [
    {
      id: 1,
      date: '2025-03-15',
      day: 'Friday',
      type: 'morning',
      route: 'Northern Suburbs Route',
      driver: 'Thabo Mabaso',
      vehicle: 'Toyota Hiace (JHB-452-GP)',
      startTime: '06:45',
      endTime: '07:30',
      duration: '45 minutes',
      startLocation: 'Parkview Mall',
      endLocation: 'Greenview Primary School',
      status: 'completed',
      onTime: true,
      incidents: 0,
      notes: 'Regular trip, no incidents',
      waypoints: [
        { time: '06:45', location: 'Parkview Mall', status: 'Pickup' },
        { time: '07:05', location: 'Ferndale Shopping Center', status: 'Pickup' },
        { time: '07:20', location: 'Randburg Plaza', status: 'Pickup' },
        { time: '07:30', location: 'Greenview Primary School', status: 'Dropoff' }
      ]
    },
    {
      id: 2,
      date: '2025-03-15',
      day: 'Friday',
      type: 'afternoon',
      route: 'Northern Suburbs Route',
      driver: 'Thabo Mabaso',
      vehicle: 'Toyota Hiace (JHB-452-GP)',
      startTime: '14:15',
      endTime: '15:05',
      duration: '50 minutes',
      startLocation: 'Greenview Primary School',
      endLocation: 'Parkview Mall',
      status: 'completed',
      onTime: false,
      delay: '15 minutes',
      incidents: 0,
      notes: 'Delayed due to traffic congestion on Main Road',
      waypoints: [
        { time: '14:15', location: 'Greenview Primary School', status: 'Pickup' },
        { time: '14:30', location: 'Traffic delay', status: 'Delay' },
        { time: '14:35', location: 'Randburg Plaza', status: 'Dropoff' },
        { time: '14:50', location: 'Ferndale Shopping Center', status: 'Dropoff' },
        { time: '15:05', location: 'Parkview Mall', status: 'Dropoff' }
      ]
    },
    {
      id: 3,
      date: '2025-03-14',
      day: 'Thursday',
      type: 'morning',
      route: 'Northern Suburbs Route',
      driver: 'Thabo Mabaso',
      vehicle: 'Toyota Hiace (JHB-452-GP)',
      startTime: '06:45',
      endTime: '07:35',
      duration: '50 minutes',
      startLocation: 'Parkview Mall',
      endLocation: 'Greenview Primary School',
      status: 'completed',
      onTime: true,
      incidents: 0,
      notes: 'Regular trip, no incidents',
      waypoints: [
        { time: '06:45', location: 'Parkview Mall', status: 'Pickup' },
        { time: '07:05', location: 'Ferndale Shopping Center', status: 'Pickup' },
        { time: '07:20', location: 'Randburg Plaza', status: 'Pickup' },
        { time: '07:35', location: 'Greenview Primary School', status: 'Dropoff' }
      ]
    }
  ];
  
  // Filter trips based on date range
  const filterTrips = () => {
    const today = new Date();
    let filterDate = new Date();
    
    switch(dateFilter) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        filterDate.setDate(today.getDate() - 1);
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'lastWeek':
        filterDate.setDate(today.getDate() - 7);
        break;
      case 'lastMonth':
        filterDate.setMonth(today.getMonth() - 1);
        break;
      default:
        filterDate.setDate(today.getDate() - 7);
    }
    
    // In a real app, you would filter based on actual dates
    // For this sample, we're returning all trips
    return trips;
  };
  
  const filteredTrips = filterTrips();
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Trip History</h2>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="lastWeek">Last 7 Days</option>
          <option value="lastMonth">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>
      
      {filteredTrips.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No trips found for the selected period.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trip Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTrips.map(trip => (
                <tr 
                  key={trip.id} 
                  className={`hover:bg-gray-50 ${selectedTrip === trip.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedTrip(selectedTrip === trip.id ? null : trip.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{trip.date}</div>
                    <div className="text-sm text-gray-500">{trip.startTime} - {trip.endTime}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{trip.route}</div>
                    <div className="text-sm text-gray-500">{trip.driver}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      trip.type === 'morning' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {trip.type === 'morning' ? 'To School' : 'From School'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      trip.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </span>
                    {!trip.onTime && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Delayed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {trip.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {selectedTrip && (
        <div className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
          {(() => {
            const trip = trips.find(t => t.id === selectedTrip);
            return (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Trip Details - {trip.date} ({trip.day})
                  </h3>
                  <button 
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setSelectedTrip(null)}
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Route & Vehicle</h4>
                    <p className="text-sm text-gray-900 mb-1">Route: {trip.route}</p>
                    <p className="text-sm text-gray-900 mb-1">Driver: {trip.driver}</p>
                    <p className="text-sm text-gray-900">Vehicle: {trip.vehicle}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Timing</h4>
                    <p className="text-sm text-gray-900 mb-1">Start: {trip.startTime} ({trip.startLocation})</p>
                    <p className="text-sm text-gray-900 mb-1">End: {trip.endTime} ({trip.endLocation})</p>
                    <p className="text-sm text-gray-900">Duration: {trip.duration}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</h4>
                    <p className="text-sm text-gray-900 mb-1">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        trip.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-900 mb-1">On Time: {trip.onTime ? 'Yes' : `No (${trip.delay} delay)`}</p>
                    <p className="text-sm text-gray-900">Incidents: {trip.incidents}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Notes</h4>
                  <p className="text-sm text-gray-900 bg-white p-3 rounded border border-gray-200">
                    {trip.notes || 'No notes available'}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Trip Timeline</h4>
                  <div className="relative">
                    {trip.waypoints.map((waypoint, index) => (
                      <div key={index} className="flex mb-4 items-start">
                        <div className="flex flex-col items-center mr-4">
                          <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                            waypoint.status === 'Pickup' 
                              ? 'bg-blue-500 text-white' 
                              : waypoint.status === 'Dropoff' 
                                ? 'bg-green-500 text-white' 
                                : 'bg-yellow-500 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          {index < trip.waypoints.length - 1 && (
                            <div className="h-full w-0.5 bg-gray-300 mt-1"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
                            <span className="font-medium">{waypoint.time}</span>
                            <p className="text-sm">{waypoint.location}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              waypoint.status === 'Pickup' 
                                ? 'bg-blue-100 text-blue-800' 
                                : waypoint.status === 'Dropoff' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {waypoint.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <button className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">
                    View Route Map
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
                    Download Details
                  </button>
                  {!trip.onTime && (
                    <button className="border border-yellow-300 text-yellow-700 px-3 py-1.5 rounded text-sm hover:bg-yellow-50">
                      View Delay Details
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default TripHistory;