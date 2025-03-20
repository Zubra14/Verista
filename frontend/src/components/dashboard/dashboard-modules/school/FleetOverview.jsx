import React, { useState } from 'react';

const FleetOverview = () => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // Sample fleet data
  const vehicles = [
    {
      id: 1,
      registrationNumber: 'JHB-452-GP',
      make: 'Toyota',
      model: 'Hiace',
      year: 2023,
      capacity: 16,
      driver: 'Thabo Mabaso',
      status: 'active',
      lastInspection: '2025-02-20',
      nextInspection: '2025-05-20',
      complianceStatus: 'compliant',
      route: 'Northern Suburbs Route',
      mileage: 15280,
      fuelConsumption: 12.5,
      maintenanceHistory: [
        { date: '2025-02-20', type: 'Routine', details: 'Oil change, brake inspection' },
        { date: '2024-11-15', type: 'Repair', details: 'Replaced right rear tire' },
        { date: '2024-08-02', type: 'Routine', details: 'Full service and safety check' }
      ]
    },
    {
      id: 2,
      registrationNumber: 'JHB-783-GP',
      make: 'Volkswagen',
      model: 'Crafter',
      year: 2022,
      capacity: 22,
      driver: 'Sarah Naidoo',
      status: 'active',
      lastInspection: '2025-01-15',
      nextInspection: '2025-04-15',
      complianceStatus: 'compliant',
      route: 'Eastern Routes',
      mileage: 24680,
      fuelConsumption: 14.2,
      maintenanceHistory: [
        { date: '2025-01-15', type: 'Routine', details: 'Full service' },
        { date: '2024-10-05', type: 'Repair', details: 'Fixed A/C system' },
        { date: '2024-07-22', type: 'Routine', details: 'Oil change, filters replacement' }
      ]
    },
    {
      id: 3,
      registrationNumber: 'JHB-614-GP',
      make: 'Mercedes-Benz',
      model: 'Sprinter',
      year: 2021,
      capacity: 18,
      driver: 'David Mkhize',
      status: 'maintenance',
      lastInspection: '2025-03-01',
      nextInspection: '2025-06-01',
      complianceStatus: 'pending',
      route: 'Southern Route',
      mileage: 32450,
      fuelConsumption: 13.8,
      maintenanceHistory: [
        { date: '2025-03-01', type: 'Repair', details: 'Transmission service - awaiting parts' },
        { date: '2024-12-12', type: 'Routine', details: 'Oil change, brake inspection' },
        { date: '2024-09-05', type: 'Repair', details: 'Replaced windshield wipers and headlight' }
      ]
    }
  ];

  // Get status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Fleet Overview</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add Vehicle
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Inspection</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicles.map(vehicle => (
                <tr 
                  key={vehicle.id} 
                  className={`hover:bg-gray-50 ${selectedVehicle === vehicle.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedVehicle(selectedVehicle === vehicle.id ? null : vehicle.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{vehicle.make} {vehicle.model}</div>
                    <div className="text-sm text-gray-500">{vehicle.registrationNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.driver}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.route}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.nextInspection}</td>
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

      {selectedVehicle && (
        <div className="bg-white rounded-lg shadow p-6">
          {(() => {
            const vehicle = vehicles.find(v => v.id === selectedVehicle);
            return (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{vehicle.make} {vehicle.model} - {vehicle.registrationNumber}</h3>
                  <button 
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setSelectedVehicle(null)}
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Vehicle Details</h4>
                    <p className="text-sm text-gray-900 mb-1">Year: {vehicle.year}</p>
                    <p className="text-sm text-gray-900 mb-1">Capacity: {vehicle.capacity} students</p>
                    <p className="text-sm text-gray-900">Mileage: {vehicle.mileage} km</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Inspection Status</h4>
                    <p className="text-sm text-gray-900 mb-1">Last: {vehicle.lastInspection}</p>
                    <p className="text-sm text-gray-900 mb-1">Next: {vehicle.nextInspection}</p>
                    <p className="text-sm text-gray-900">
                      Status: 
                      <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        vehicle.complianceStatus === 'compliant' ? 'bg-green-100 text-green-800' : 
                        vehicle.complianceStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {vehicle.complianceStatus.charAt(0).toUpperCase() + vehicle.complianceStatus.slice(1)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Operation</h4>
                    <p className="text-sm text-gray-900 mb-1">Route: {vehicle.route}</p>
                    <p className="text-sm text-gray-900 mb-1">Driver: {vehicle.driver}</p>
                    <p className="text-sm text-gray-900">Fuel: {vehicle.fuelConsumption} L/100km</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Maintenance History</h4>
                  <div className="overflow-hidden border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {vehicle.maintenanceHistory.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                            <td className="px-6 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                item.type === 'Routine' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                              }`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-900">{item.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">
                    Schedule Maintenance
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
                    View Complete History
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
                    Update Status
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default FleetOverview;