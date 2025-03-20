import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";  // Adjust path as needed
import { useNavigate } from 'react-router-dom';
import ComplianceReports from './dashboard-modules/school/ComplianceReports';
import FleetOverview from './dashboard-modules/school/FleetOverview';
import RouteManagement from './dashboard-modules/school/RouteManagement';
import StudentManagement from './dashboard-modules/school/StudentManagement';
import TestAccountBanner from '../common/TestAccountBanner';

const SchoolDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isTestAccount = currentUser?.email === 'veristatest@gmail.com';
  const [activeTab, setActiveTab] = useState('overview');

  // Sample school data that would typically come from your API
  const schoolData = {
    name: "Greenview Primary School",
    address: "123 Education Road, Johannesburg",
    totalStudents: 750,
    studentsUsingTransport: 412,
    activeVehicles: 8,
    activeRoutes: 6,
    safetyRating: 92
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{schoolData.name}</h1>
            <p className="text-gray-600">{schoolData.address}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Students</p>
                  <p className="text-lg font-semibold">{schoolData.totalStudents}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Using Transport</p>
                  <p className="text-lg font-semibold">{schoolData.studentsUsingTransport}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicles</p>
                  <p className="text-lg font-semibold">{schoolData.activeVehicles}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Routes</p>
                  <p className="text-lg font-semibold">{schoolData.activeRoutes}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <TestAccountBanner />
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-500 font-medium text-blue-600'
                : 'border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`py-4 px-1 ${
              activeTab === 'students'
                ? 'border-b-2 border-blue-500 font-medium text-blue-600'
                : 'border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`py-4 px-1 ${
              activeTab === 'routes'
                ? 'border-b-2 border-blue-500 font-medium text-blue-600'
                : 'border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Routes
          </button>
          <button
            onClick={() => setActiveTab('fleet')}
            className={`py-4 px-1 ${
              activeTab === 'fleet'
                ? 'border-b-2 border-blue-500 font-medium text-blue-600'
                : 'border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Fleet
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`py-4 px-1 ${
              activeTab === 'compliance'
                ? 'border-b-2 border-blue-500 font-medium text-blue-600'
                : 'border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Compliance
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      <div className="bg-white rounded-lg shadow-md">
        {activeTab === 'overview' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">School Transport Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Safety Rating</h3>
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-green-600">{schoolData.safetyRating}%</span>
                  <div className="ml-4 w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-green-600 h-4 rounded-full"
                      style={{ width: `${schoolData.safetyRating}%` }}
                    ></div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">Based on vehicle inspections, driver records, and incident reports</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Transport Utilization</h3>
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-blue-600">
                    {Math.round((schoolData.studentsUsingTransport / schoolData.totalStudents) * 100)}%
                  </span>
                  <div className="ml-4 w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full"
                      style={{
                        width: `${Math.round(
                          (schoolData.studentsUsingTransport / schoolData.totalStudents) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {schoolData.studentsUsingTransport} out of {schoolData.totalStudents} students using school transport
                </p>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
              <div className="border rounded-lg">
                <div className="divide-y">
                  <div className="px-4 py-3 flex items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">Route #3 delayed by 15 minutes</p>
                      <p className="text-sm text-gray-500">Today, 08:15 AM</p>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">Vehicle JHB-452-GP passed inspection</p>
                      <p className="text-sm text-gray-500">Yesterday, 2:30 PM</p>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">5 new students added to transport system</p>
                      <p className="text-sm text-gray-500">March 14, 2025</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'students' && <StudentManagement />}
        {activeTab === 'routes' && <RouteManagement />}
        {activeTab === 'fleet' && <FleetOverview />}
        {activeTab === 'compliance' && <ComplianceReports />}
      </div>
    </div>
  );
};

export default SchoolDashboard;