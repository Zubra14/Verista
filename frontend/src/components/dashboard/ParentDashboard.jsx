import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";  // Adjust path as needed
import { useNavigate } from 'react-router-dom';
import LiveTracking from './dashboard-modules/LiveTracking';
import TripHistory from './dashboard-modules/TripHistory';
import DriverInfo from './dashboard-modules/DriverInfo';
import Settings from './dashboard-modules/Settings';
import TestAccountBanner from '../common/TestAccountBanner';

const ParentDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isTestAccount = currentUser?.email === 'veristatest@gmail.com';
  const [activeTab, setActiveTab] = useState('overview');

  // Sample parent data
  const parentData = {
    name: 'Grace Mokoena',
    children: [
      {
        id: 1,
        name: 'Thabo Mokoena',
        grade: '5',
        school: 'Greenview Primary School',
        route: 'Northern Suburbs Route',
        driver: 'Thabo Mabaso',
        vehicle: 'Toyota Hiace (JHB-452-GP)',
        pickupLocation: 'Parkview Mall',
        pickupTime: '06:45',
        dropoffTime: '14:25',
        status: 'at-school'
      }
    ],
    recentTrips: [
      {
        id: 1,
        date: '2025-03-15',
        type: 'Morning Route',
        child: 'Thabo Mokoena',
        startTime: '06:45',
        endTime: '07:30',
        status: 'completed',
        onTime: true
      },
      {
        id: 2,
        date: '2025-03-14',
        type: 'Afternoon Route',
        child: 'Thabo Mokoena',
        startTime: '14:15',
        endTime: '15:00',
        status: 'completed',
        onTime: false,
        delay: '15 minutes'
      }
    ],
    notifications: [
      {
        id: 1,
        type: 'trip-start',
        message: 'Morning route has started',
        timestamp: '2025-03-16T06:45:00Z',
        read: true
      },
      {
        id: 2,
        type: 'arrival',
        message: 'Thabo has arrived at school',
        timestamp: '2025-03-16T07:32:00Z',
        read: false
      },
      {
        id: 3,
        type: 'delay',
        message: 'Afternoon route delayed by 15 minutes due to traffic',
        timestamp: '2025-03-15T14:10:00Z',
        read: true
      }
    ]
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'at-school':
        return {
          label: 'At School',
          className: 'bg-green-100 text-green-800'
        };
      case 'in-transit-to-school':
        return {
          label: 'In Transit to School',
          className: 'bg-blue-100 text-blue-800'
        };
      case 'in-transit-from-school':
        return {
          label: 'In Transit from School',
          className: 'bg-purple-100 text-purple-800'
        };
      case 'arrived-home':
        return {
          label: 'Arrived Home',
          className: 'bg-yellow-100 text-yellow-800'
        };
      default:
        return {
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800'
        };
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome, {parentData.name}</h1>
            <p className="text-gray-600">Parent Dashboard</p>
          </div>
          <div className="mt-4 md:mt-0">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Contact Support
            </button>
          </div>
        </div>
        
        <TestAccountBanner />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Children Status</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Child
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School & Grade
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {parentData.children.map(child => {
                const badge = getStatusBadge(child.status);
                return (
                  <tr key={child.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{child.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{child.school}</div>
                      <div className="text-sm text-gray-500">Grade {child.grade}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{child.route}</div>
                      <div className="text-sm text-gray-500">Pickup: {child.pickupTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setActiveTab('tracking')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Track Now
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
            onClick={() => setActiveTab('tracking')}
            className={`py-4 px-6 ${
              activeTab === 'tracking'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Live Tracking
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-6 ${
              activeTab === 'history'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Trip History
          </button>
          <button
            onClick={() => setActiveTab('driver')}
            className={`py-4 px-6 ${
              activeTab === 'driver'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Driver Info
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-6 ${
              activeTab === 'settings'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Settings
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold mb-4">Recent Trips</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  {parentData.recentTrips.length === 0 ? (
                    <p className="text-gray-500">No recent trips found.</p>
                  ) : (
                    <div className="space-y-4">
                      {parentData.recentTrips.map(trip => (
                        <div
                          key={trip.id}
                          className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{trip.type} - {trip.date}</h3>
                              <p className="text-sm text-gray-500">
                                {trip.startTime} - {trip.endTime}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              trip.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : trip.status === 'upcoming'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                            </span>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm">{trip.child}</p>
                            {!trip.onTime && (
                              <p className="text-sm text-yellow-600">Delayed by {trip.delay}</p>
                            )}
                          </div>
                          <div className="mt-3">
                            <button
                              onClick={() => setActiveTab('history')}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 text-right">
                    <button
                      onClick={() => setActiveTab('history')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All Trips
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-4">Notifications</h2>
                <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                  {parentData.notifications.length === 0 ? (
                    <p className="text-gray-500">No notifications at this time.</p>
                  ) : (
                    <div className="space-y-3">
                      {parentData.notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border ${notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              {notification.type === 'trip-start' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                                </svg>
                              ) : notification.type === 'arrival' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="ml-2 flex-shrink-0">
                                <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 text-right">
                    <button
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('tracking')}
                  className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg border border-blue-200 text-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="font-medium">Track Child</span>
                </button>
                <button
                  onClick={() => setActiveTab('driver')}
                  className="bg-green-50 hover:bg-green-100 p-4 rounded-lg border border-green-200 text-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">Driver Information</span>
                </button>
                <button className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg border border-purple-200 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-purple-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="font-medium">Contact Support</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'tracking' && <LiveTracking routeId={parentData.children[0]?.route || ''} userType="parent" />}
        {activeTab === 'history' && <TripHistory />}
        {activeTab === 'driver' && <DriverInfo />}
        {activeTab === 'settings' && <Settings />}
      </div>
    </div>
  );
};

export default ParentDashboard;