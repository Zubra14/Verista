import React, { useState } from 'react';

const IncidentReports = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [expandedIncident, setExpandedIncident] = useState(null);
  
  // Sample incident data that would come from your API
  const incidents = [
    {
      id: 1,
      date: "2025-03-15",
      time: "07:35",
      type: "breakdown",
      status: "resolved",
      location: "Johannesburg, Main Rd & 5th Ave",
      description: "Vehicle engine failure during morning route",
      driver: "Thabo Mabaso",
      vehicle: "JHB-452-GP",
      affectedStudents: 12,
      response: "Replacement vehicle dispatched within 15 minutes",
      resolutionTime: 28
    },
    {
      id: 2,
      date: "2025-03-14",
      time: "15:22",
      type: "delay",
      status: "resolved",
      location: "Pretoria, Church St",
      description: "Traffic congestion caused 25-minute delay",
      driver: "Sarah Naidoo",
      vehicle: "PTA-835-GP",
      affectedStudents: 18,
      response: "Parents notified via SMS alert system",
      resolutionTime: 25
    },
    {
      id: 3,
      date: "2025-03-12",
      time: "14:10",
      type: "deviation",
      status: "under_investigation",
      location: "Cape Town, Ndabeni",
      description: "Driver deviated from approved route",
      driver: "Michael Adams",
      vehicle: "CA-783-WC",
      affectedStudents: 15,
      response: "Route deviation detected and reported",
      resolutionTime: null
    },
    {
      id: 4,
      date: "2025-03-10",
      time: "08:45",
      type: "accident",
      status: "under_investigation",
      location: "Durban, Umhlanga Main Rd",
      description: "Minor collision with another vehicle, no injuries",
      driver: "Lindiwe Zulu",
      vehicle: "ND-324-KZN",
      affectedStudents: 22,
      response: "Police report filed, parents notified",
      resolutionTime: null
    }
  ];
  
  // Filter the incidents based on selected filters
  const filteredIncidents = incidents.filter(incident => {
    if (filterStatus !== 'all' && incident.status !== filterStatus) return false;
    if (filterType !== 'all' && incident.type !== filterType) return false;
    return true;
  });
  
  // Helper function to format incident type for display
  const formatIncidentType = (type) => {
    switch(type) {
      case 'breakdown': return 'Vehicle Breakdown';
      case 'delay': return 'Route Delay';
      case 'deviation': return 'Route Deviation';
      case 'accident': return 'Traffic Accident';
      default: return type;
    }
  };
  
  // Helper function to get status colors
  const getStatusColor = (status) => {
    switch(status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'under_investigation': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Helper function to get incident type badge color
  const getTypeColor = (type) => {
    switch(type) {
      case 'breakdown': return 'bg-blue-100 text-blue-800';
      case 'delay': return 'bg-purple-100 text-purple-800';
      case 'deviation': return 'bg-orange-100 text-orange-800';
      case 'accident': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Incident Reports</h2>
        <div className="flex space-x-2">
          <select 
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="resolved">Resolved</option>
            <option value="under_investigation">Under Investigation</option>
            <option value="critical">Critical</option>
          </select>
          <select 
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="breakdown">Breakdown</option>
            <option value="delay">Delay</option>
            <option value="deviation">Route Deviation</option>
            <option value="accident">Accident</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incident</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredIncidents.length > 0 ? filteredIncidents.map((incident) => (
              <React.Fragment key={incident.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{incident.date}</div>
                    <div className="text-sm text-gray-500">{incident.time}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(incident.type)}`}>
                      {formatIncidentType(incident.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{incident.location}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                      {incident.status === 'resolved' ? 'Resolved' : incident.status === 'under_investigation' ? 'Under Investigation' : 'Critical'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => setExpandedIncident(expandedIncident === incident.id ? null : incident.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {expandedIncident === incident.id ? 'Hide Details' : 'View Details'}
                    </button>
                  </td>
                </tr>
                {expandedIncident === incident.id && (
                  <tr className="bg-gray-50">
                    <td colSpan="5" className="px-4 py-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Driver</p>
                          <p className="text-sm text-gray-900">{incident.driver}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Vehicle</p>
                          <p className="text-sm text-gray-900">{incident.vehicle}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Affected Students</p>
                          <p className="text-sm text-gray-900">{incident.affectedStudents}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Resolution Time</p>
                          <p className="text-sm text-gray-900">{incident.resolutionTime ? `${incident.resolutionTime} minutes` : 'Pending'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-gray-500">Description</p>
                          <p className="text-sm text-gray-900">{incident.description}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-gray-500">Response</p>
                          <p className="text-sm text-gray-900">{incident.response}</p>
                        </div>
                        <div className="col-span-2 mt-2">
                          <div className="flex space-x-2">
                            <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700">
                              {incident.status === 'resolved' ? 'View Report' : 'Update Status'}
                            </button>
                            <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                              Send Notification
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )) : (
              <tr>
                <td colSpan="5" className="px-4 py-3 text-center text-sm text-gray-500">
                  No incidents match the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          Generate Monthly Report
        </button>
        <div className="text-sm text-gray-500">
          Showing {filteredIncidents.length} of {incidents.length} incidents
        </div>
      </div>
    </div>
  );
};

export default IncidentReports;