import React, { useState } from 'react';

const OperatorManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [selectedOperator, setSelectedOperator] = useState(null);
  
  // Sample operator data that would come from your API
  const operators = [
    {
      id: 1,
      name: "City Transport Services",
      owner: "Jacob Molefe",
      contactEmail: "jacob@citytransport.co.za",
      contactPhone: "071 234 5678",
      region: "urban",
      status: "approved",
      licenseNumber: "TO-2025-1234",
      licenseExpiry: "2026-04-15",
      registrationDate: "2023-06-10",
      vehicles: 24,
      activeRoutes: 18,
      complianceScore: 94,
      lastInspection: "2025-02-20",
      notes: "Reliable operator with excellent safety record"
    },
    {
      id: 2,
      name: "Township Scholars",
      owner: "Nomsa Dlamini",
      contactEmail: "nomsa@townshipscholars.co.za",
      contactPhone: "082 345 6789",
      region: "township",
      status: "probation",
      licenseNumber: "TO-2024-7891",
      licenseExpiry: "2025-11-30",
      registrationDate: "2024-01-15",
      vehicles: 12,
      activeRoutes: 8,
      complianceScore: 72,
      lastInspection: "2025-03-05",
      notes: "Recently placed on probation due to vehicle maintenance issues"
    },
    {
      id: 3,
      name: "Rural Routes Transport",
      owner: "Thomas Sithole",
      contactEmail: "thomas@ruralroutes.co.za",
      contactPhone: "064 567 8901",
      region: "rural",
      status: "pending",
      licenseNumber: "TO-2025-5432",
      licenseExpiry: null,
      registrationDate: "2025-02-28",
      vehicles: 6,
      activeRoutes: 0,
      complianceScore: null,
      lastInspection: null,
      notes: "New operator awaiting final license approval"
    },
    {
      id: 4,
      name: "Safe Journey Ltd",
      owner: "Priya Naidoo",
      contactEmail: "priya@safejourney.co.za",
      contactPhone: "083 678 9012",
      region: "urban",
      status: "approved",
      licenseNumber: "TO-2024-3456",
      licenseExpiry: "2026-01-20",
      registrationDate: "2022-08-05",
      vehicles: 16,
      activeRoutes: 14,
      complianceScore: 89,
      lastInspection: "2025-01-12",
      notes: "Consistent performance and good safety protocols"
    },
    {
      id: 5,
      name: "EduRide Services",
      owner: "William Madiba",
      contactEmail: "william@eduride.co.za",
      contactPhone: "072 789 0123",
      region: "township",
      status: "suspended",
      licenseNumber: "TO-2023-7654",
      licenseExpiry: "2025-07-10",
      registrationDate: "2023-01-20",
      vehicles: 10,
      activeRoutes: 0,
      complianceScore: 58,
      lastInspection: "2025-03-01",
      notes: "License suspended due to safety violations. Remediation plan in progress."
    }
  ];
  
  // Filter and search operators
  const filteredOperators = operators.filter(operator => {
    // Apply status filter
    if (statusFilter !== 'all' && operator.status !== statusFilter) return false;
    
    // Apply region filter
    if (regionFilter !== 'all' && operator.region !== regionFilter) return false;
    
    // Apply search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        operator.name.toLowerCase().includes(searchLower) ||
        operator.owner.toLowerCase().includes(searchLower) ||
        operator.licenseNumber.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Helper function for status badge styling
  const getStatusBadgeStyle = (status) => {
    switch(status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'probation':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Helper function for region badge
  const getRegionLabel = (region) => {
    switch(region) {
      case 'urban':
        return 'Urban Area';
      case 'township':
        return 'Township Area';
      case 'rural':
        return 'Rural Area';
      default:
        return region;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Operator Management</h2>
      
      {/* Search and Filter Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-grow max-w-md">
          <label htmlFor="search" className="sr-only">Search operators</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              id="search"
              name="search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search operators"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="probation">On Probation</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        
        <div>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            <option value="all">All Regions</option>
            <option value="urban">Urban Areas</option>
            <option value="township">Township Areas</option>
            <option value="rural">Rural Areas</option>
          </select>
        </div>
        
        <button className="bg-blue-600 text-white py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Add New Operator
        </button>
      </div>
      
      {/* Operators List */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicles</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOperators.length > 0 ? (
              filteredOperators.map((operator) => (
                <tr 
                  key={operator.id} 
                  className={`hover:bg-gray-50 ${selectedOperator === operator.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedOperator(selectedOperator === operator.id ? null : operator.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{operator.name}</div>
                    <div className="text-sm text-gray-500">{operator.licenseNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getRegionLabel(operator.region)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeStyle(operator.status)}`}>
                      {operator.status.charAt(0).toUpperCase() + operator.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {operator.vehicles} ({operator.activeRoutes} active)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {operator.complianceScore ? (
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${
                          operator.complianceScore >= 90 ? 'text-green-600' : 
                          operator.complianceScore >= 80 ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {operator.complianceScore}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-4">View</button>
                    <button className="text-gray-600 hover:text-gray-900">Edit</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  No operators match your search criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Operator Details Panel (shows when operator is selected) */}
      {selectedOperator !== null && (
        <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
          {(() => {
            const operator = operators.find(op => op.id === selectedOperator);
            return (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{operator.name}</h3>
                    <p className="text-sm text-gray-500">License: {operator.licenseNumber}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedOperator(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Contact Information</h4>
                    <p className="text-sm text-gray-900 mb-1">Owner: {operator.owner}</p>
                    <p className="text-sm text-gray-900 mb-1">Email: {operator.contactEmail}</p>
                    <p className="text-sm text-gray-900">Phone: {operator.contactPhone}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">License Details</h4>
                    <p className="text-sm text-gray-900 mb-1">Registration: {operator.registrationDate}</p>
                    <p className="text-sm text-gray-900">
                      Expiry: {operator.licenseExpiry || 'Pending'}
                      {operator.licenseExpiry && new Date(operator.licenseExpiry) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                        <span className="ml-2 text-yellow-600 text-xs font-medium">Expiring soon</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Fleet Information</h4>
                    <p className="text-sm text-gray-900 mb-1">Total Vehicles: {operator.vehicles}</p>
                    <p className="text-sm text-gray-900">Active Routes: {operator.activeRoutes}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Notes</h4>
                  <p className="text-sm text-gray-900 bg-white p-3 rounded border border-gray-200">
                    {operator.notes || 'No notes available'}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    View Full Profile
                  </button>
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                    View Fleet
                  </button>
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700">
                    View Routes
                  </button>
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
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

export default OperatorManagement;