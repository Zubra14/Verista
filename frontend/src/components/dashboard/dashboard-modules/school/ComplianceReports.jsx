import React, { useState } from 'react';

const ComplianceReports = () => {
  const [reportTimeframe, setReportTimeframe] = useState('monthly');
  
  // Sample compliance data
  const complianceData = {
    vehicles: {
      total: 8,
      compliant: 7,
      pending: 1,
      overdue: 0,
      complianceRate: 87.5
    },
    drivers: {
      total: 12,
      compliant: 11,
      pending: 1,
      overdue: 0,
      complianceRate: 91.7
    },
    routes: {
      total: 6,
      approved: 6,
      pending: 0,
      rejected: 0,
      approvalRate: 100
    },
    inspections: [
      { id: 1, date: '2025-03-10', type: 'Vehicle', result: 'Passed', inspector: 'Government Transport Dept', notes: 'All safety features operational' },
      { id: 2, date: '2025-03-05', type: 'Driver Verification', result: 'Passed', inspector: 'SANTACO', notes: 'License and permits current' },
      { id: 3, date: '2025-02-28', type: 'Route Assessment', result: 'Passed', inspector: 'School Safety Committee', notes: 'Approved pickup/dropoff points' },
      { id: 4, date: '2025-02-15', type: 'Vehicle', result: 'Pending', inspector: 'Government Transport Dept', notes: 'Awaiting updated documentation' }
    ]
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Compliance Reports</h2>
        <select
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
          value={reportTimeframe}
          onChange={(e) => setReportTimeframe(e.target.value)}
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Vehicle Compliance</h3>
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-bold text-blue-600">{complianceData.vehicles.complianceRate}%</span>
            <span className="text-sm text-gray-500">{complianceData.vehicles.compliant}/{complianceData.vehicles.total} Vehicles</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${complianceData.vehicles.complianceRate}%`}}></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Driver Compliance</h3>
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-bold text-green-600">{complianceData.drivers.complianceRate}%</span>
            <span className="text-sm text-gray-500">{complianceData.drivers.compliant}/{complianceData.drivers.total} Drivers</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-green-600 h-2.5 rounded-full" style={{width: `${complianceData.drivers.complianceRate}%`}}></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Route Approval</h3>
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-bold text-purple-600">{complianceData.routes.approvalRate}%</span>
            <span className="text-sm text-gray-500">{complianceData.routes.approved}/{complianceData.routes.total} Routes</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-purple-600 h-2.5 rounded-full" style={{width: `${complianceData.routes.approvalRate}%`}}></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h3 className="text-lg font-semibold p-4 border-b">Recent Inspections</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspector</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complianceData.inspections.map(inspection => (
                <tr key={inspection.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inspection.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inspection.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${inspection.result === 'Passed' ? 'bg-green-100 text-green-800' : 
                      inspection.result === 'Failed' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                      {inspection.result}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inspection.inspector}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{inspection.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex space-x-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Download Report
        </button>
        <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50">
          Schedule Inspection
        </button>
      </div>
    </div>
  );
};

export default ComplianceReports;