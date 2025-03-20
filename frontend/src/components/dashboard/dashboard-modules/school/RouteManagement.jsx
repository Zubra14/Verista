import React, { useState } from 'react';

const RouteManagement = () => {
  const [selectedRoute, setSelectedRoute] = useState(null);
  
  // Sample routes data
  const routes = [
    {
      id: 1,
      name: "Northern Suburbs Route",
      status: "active",
      vehicle: "Toyota Hiace (JHB-452-GP)",
      driver: "Thabo Mabaso",
      studentCount: 16,
      distance: 12.5,
      duration: 45,
      startTime: "06:45",
      arrivalTime: "07:30",
      departureTime: "14:15",
      stops: [
        { id: 1, name: "Parkview Mall", arrivalTime: "06:45", departureTime: "06:55", students: 6 },
        { id: 2, name: "Ferndale Shopping Center", arrivalTime: "07:05", departureTime: "07:10", students: 5 },
        { id: 3, name: "Randburg Plaza", arrivalTime: "07:20", departureTime: "07:25", students: 5 },
        { id: 4, name: "School", arrivalTime: "07:30", departureTime: "14:15", students: 16 }
      ]
    },
    {
      id: 2,
      name: "Eastern Routes",
      status: "active",
      vehicle: "Volkswagen Crafter (JHB-783-GP)",
      driver: "Sarah Naidoo",
      studentCount: 22,
      distance: 18.2,
      duration: 55,
      startTime: "06:30",
      arrivalTime: "07:25",
      departureTime: "14:15",
      stops: [
        { id: 1, name: "Bedfordview Center", arrivalTime: "06:30", departureTime: "06:40", students: 7 },
        { id: 2, name: "Edenvale Station", arrivalTime: "06:50", departureTime: "07:00", students: 8 },
        { id: 3, name: "Eastgate Mall", arrivalTime: "07:10", departureTime: "07:15", students: 7 },
        { id: 4, name: "School", arrivalTime: "07:25", departureTime: "14:15", students: 22 }
      ]
    },
    {
      id: 3,
      name: "Southern Route",
      status: "inactive",
      vehicle: "Mercedes-Benz Sprinter (JHB-614-GP)",
      driver: "David Mkhize",
      studentCount: 0,
      distance: 15.8,
      duration: 50,
      startTime: "06:35",
      arrivalTime: "07:25",
      departureTime: "14:15",
      stops: [
        { id: 1, name: "Glenvista Shopping Center", arrivalTime: "06:35", departureTime: "06:45", students: 6 },
        { id: 2, name: "Mondeor Plaza", arrivalTime: "06:55", departureTime: "07:05", students: 7 },
        { id: 3, name: "South Gate Mall", arrivalTime: "07:15", departureTime: "07:20", students: 5 },
        { id: 4, name: "School", arrivalTime: "07:25", departureTime: "14:15", students: 18 }
      ]
    }
  ];

  // Helper function for status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Route Management</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Create New Route
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle & Driver</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {routes.map(route => (
                <tr 
                  key={route.id}
                  className={`hover:bg-gray-50 ${selectedRoute === route.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedRoute(selectedRoute === route.id ? null : route.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{route.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(route.status)}`}>
                      {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{route.vehicle}</div>
                    <div className="text-sm text-gray-500">{route.driver}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{route.studentCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{route.distance} km</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Track</button>
                    <button className="text-gray-600 hover:text-gray-900">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRoute && (
        <div className="bg-white rounded-lg shadow p-6">
          {(() => {
            const route = routes.find(r => r.id === selectedRoute);
            return (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{route.name}</h3>
                  <button 
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setSelectedRoute(null)}
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Route Details</h4>
                    <p className="text-sm text-gray-900 mb-1">Distance: {route.distance} km</p>
                    <p className="text-sm text-gray-900 mb-1">Duration: {route.duration} minutes</p>
                    <p className="text-sm text-gray-900">Status: 
                      <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(route.status)}`}>
                        {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Schedule</h4>
                    <p className="text-sm text-gray-900 mb-1">Start: {route.startTime}</p>
                    <p className="text-sm text-gray-900 mb-1">School Arrival: {route.arrivalTime}</p>
                    <p className="text-sm text-gray-900">School Departure: {route.departureTime}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Assignment</h4>
                    <p className="text-sm text-gray-900 mb-1">Vehicle: {route.vehicle}</p>
                    <p className="text-sm text-gray-900 mb-1">Driver: {route.driver}</p>
                    <p className="text-sm text-gray-900">Students: {route.studentCount}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Stops</h4>
                  <div className="overflow-hidden border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stop Location</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arrival</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departure</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {route.stops.map(stop => (
                          <tr key={stop.id}>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {stop.name}
                              {stop.name === "School" && <span className="ml-2 text-xs text-blue-600">(Destination)</span>}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{stop.arrivalTime}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{stop.departureTime}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{stop.students}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">
                    Edit Route
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
                    View on Map
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
                    Manage Students
                  </button>
                  {route.status === 'active' ? (
                    <button className="border border-red-300 text-red-700 px-3 py-1.5 rounded text-sm hover:bg-red-50">
                      Deactivate
                    </button>
                  ) : (
                    <button className="border border-green-300 text-green-700 px-3 py-1.5 rounded text-sm hover:bg-green-50">
                      Activate
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

export default RouteManagement;