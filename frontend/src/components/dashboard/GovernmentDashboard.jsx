import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";  // Adjust path as needed
import { useNavigate } from 'react-router-dom';
import ComplianceOverview from './dashboard-modules/government/ComplianceOverview';
import IncidentReports from './dashboard-modules/government/IncidentReports';
import OperatorManagement from './dashboard-modules/government/OperatorManagement';
import AnalyticsReporting from './dashboard-modules/government/AnalyticsReporting';
import TestAccountBanner from '../common/TestAccountBanner';

const GovernmentDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isTestAccount = currentUser?.email === 'veristatest@gmail.com';
  const [activeTab, setActiveTab] = useState('overview');

  // Sample statistics data
  const statistics = {
    totalSchools: 245,
    totalOperators: 178,
    totalVehicles: 683,
    totalStudents: 18746,
    complianceRate: 93.2,
    activeRoutes: 412,
    pendingApprovals: 14,
    recentIncidents: 5
  };

  // Sample geographical data
  const regionalData = [
    { region: 'Johannesburg', schools: 87, operators: 64, compliance: 94.5 },
    { region: 'Pretoria', schools: 63, operators: 48, compliance: 92.8 },
    { region: 'Cape Town', schools: 52, operators: 37, compliance: 95.1 },
    { region: 'Durban', schools: 43, operators: 29, compliance: 90.7 }
  ];

  // Sample alerts data
  const alerts = [
    { id: 1, type: 'compliance', priority: 'high', message: '5 operators have vehicles with expired inspections', timestamp: '2025-03-16T09:15:00Z' },
    { id: 2, type: 'incident', priority: 'medium', message: 'New incident report: Minor accident reported in Randburg area', timestamp: '2025-03-16T10:30:00Z' },
    { id: 3, type: 'approval', priority: 'normal', message: '14 new vehicle registrations pending approval', timestamp: '2025-03-15T16:45:00Z' }
  ];

  const getStatusColor = (value) => {
    if (value >= 90) return 'bg-green-500';
    if (value >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Government Dashboard</h1>
            <p className="text-gray-600">Transportation Regulatory Oversight</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Generate Report
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Export Data
            </button>
          </div>
        </div>
        
        <TestAccountBanner />
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-6 ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`py-4 px-6 ${
              activeTab === 'compliance'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Compliance
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`py-4 px-6 ${
              activeTab === 'incidents'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Incidents
          </button>
          <button
            onClick={() => setActiveTab('operators')}
            className={`py-4 px-6 ${
              activeTab === 'operators'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Operators
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-4 px-6 ${
              activeTab === 'analytics'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-4 text-white">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-400 bg-opacity-30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold">Schools</h2>
                    <p className="text-3xl font-bold">{statistics.totalSchools}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-4 text-white">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-400 bg-opacity-30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold">Compliance</h2>
                    <p className="text-3xl font-bold">{statistics.complianceRate}%</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-md p-4 text-white">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-400 bg-opacity-30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold">Operators</h2>
                    <p className="text-3xl font-bold">{statistics.totalOperators}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow-md p-4 text-white">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-400 bg-opacity-30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold">Students</h2>
                    <p className="text-3xl font-bold">{statistics.totalStudents.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold mb-4">Regional Overview</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Region
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Schools
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Operators
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Compliance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {regionalData.map((region, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {region.region}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {region.schools}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {region.operators}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                  <div className={`${getStatusColor(region.compliance)} h-2.5 rounded-full`} style={{ width: `${region.compliance}%` }}></div>
                                </div>
                                <span className="text-sm font-medium">{region.compliance}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-4">Alerts & Actions</h2>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {alerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`p-4 mb-3 rounded-lg border ${
                        alert.priority === 'high'
                          ? 'border-red-200 bg-red-50'
                          : alert.priority === 'medium'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`p-1.5 rounded-full ${
                          alert.priority === 'high'
                            ? 'bg-red-100'
                            : alert.priority === 'medium'
                            ? 'bg-yellow-100'
                            : 'bg-blue-100'
                        }`}>
                          {alert.type === 'compliance' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          ) : alert.type === 'incident' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPriorityClass(alert.priority)}`}>
                              {alert.priority.charAt(0).toUpperCase() + alert.priority.slice(1)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium">{alert.message}</p>
                          <div className="mt-2">
                            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                              Take Action
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-4">Action Items</h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="divide-y divide-gray-200">
                      <li className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="flex-shrink-0 h-6 w-6 rounded-full bg-yellow-100 flex items-center justify-center">
                            <span className="text-yellow-800 text-xs font-medium">{statistics.pendingApprovals}</span>
                          </span>
                          <span className="ml-3 text-sm text-gray-900">Pending vehicle approvals</span>
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-800">Review</button>
                      </li>
                      <li className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="flex-shrink-0 h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-red-800 text-xs font-medium">{statistics.recentIncidents}</span>
                          </span>
                          <span className="ml-3 text-sm text-gray-900">Recent incidents to investigate</span>
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-800">View</button>
                      </li>
                      <li className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-800 text-xs font-medium">3</span>
                          </span>
                          <span className="ml-3 text-sm text-gray-900">Compliance reports due</span>
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-800">Generate</button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'compliance' && <ComplianceOverview />}
        {activeTab === 'incidents' && <IncidentReports />}
        {activeTab === 'operators' && <OperatorManagement />}
        {activeTab === 'analytics' && <AnalyticsReporting />}
      </div>
    </div>
  );
};

export default GovernmentDashboard;