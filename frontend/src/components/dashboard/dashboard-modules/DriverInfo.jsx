import React, { useState, useEffect } from 'react';

const DriverInfo = () => {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Sample driver data
  const driverData = {
    id: 1,
    firstName: 'Thabo',
    lastName: 'Mabaso',
    photo: '/images/driver-placeholder.jpg',
    licenseNumber: 'DL5678901234',
    licenseExpiry: '2026-05-15',
    pdp: 'PDP78901234',
    pdpExpiry: '2025-11-30',
    contactNumber: '071 234 5678',
    email: 'thabo.mabaso@example.com',
    address: '123 Maple Street, Parktown, Johannesburg',
    experience: 8,
    rating: 4.8,
    status: 'active',
    emergencyContact: 'Nomsa Mabaso (Wife): 082 345 6789',
    vehicleInfo: {
      make: 'Toyota',
      model: 'Hiace',
      year: 2023,
      registration: 'JHB-452-GP',
      capacity: 16,
      lastInspection: '2025-02-20',
      nextInspection: '2025-05-20'
    },
    route: {
      name: 'Northern Suburbs Route',
      stops: 4,
      students: 16,
      distance: 12.5,
      startTime: '06:45',
      endTime: '14:45'
    },
    safetyRecord: {
      incidents: 0,
      complaints: 1,
      compliments: 7,
      trainingComplete: true,
      lastTraining: '2024-12-10'
    }
  };

  // Simulate loading state
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-600 p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-blue-600 text-2xl font-bold mr-4">
              {driverData.firstName.charAt(0)}{driverData.lastName.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{driverData.firstName} {driverData.lastName}</h1>
              <div className="flex items-center mt-1">
                <span className="px-2 py-1 bg-blue-800 text-xs rounded-full mr-2">Driver ID: {driverData.id}</span>
                <span className={`px-2 py-1 ${driverData.status === 'active' ? 'bg-green-500' : 'bg-red-500'} text-xs rounded-full`}>
                  {driverData.status.charAt(0).toUpperCase() + driverData.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex items-center">
            <div className="mr-6">
              <div className="text-sm opacity-80">Experience</div>
              <div className="text-xl font-semibold">{driverData.experience} years</div>
            </div>
            <div>
              <div className="text-sm opacity-80">Rating</div>
              <div className="flex items-center">
                <span className="text-xl font-semibold mr-1">{driverData.rating}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-6 ${
              activeTab === 'profile'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Driver Profile
          </button>
          <button
            onClick={() => setActiveTab('vehicle')}
            className={`py-4 px-6 ${
              activeTab === 'vehicle'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Vehicle
          </button>
          <button
            onClick={() => setActiveTab('route')}
            className={`py-4 px-6 ${
              activeTab === 'route'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Route Information
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`py-4 px-6 ${
              activeTab === 'safety'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Safety Record
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'profile' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Full Name</div>
                    <div className="mt-1 text-sm text-gray-900">{driverData.firstName} {driverData.lastName}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Contact Number</div>
                    <div className="mt-1 text-sm text-gray-900">{driverData.contactNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Email</div>
                    <div className="mt-1 text-sm text-gray-900">{driverData.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Address</div>
                    <div className="mt-1 text-sm text-gray-900">{driverData.address}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Emergency Contact</div>
                    <div className="mt-1 text-sm text-gray-900">{driverData.emergencyContact}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">License Information</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Driver's License</div>
                    <div className="mt-1 text-sm text-gray-900">{driverData.licenseNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">License Expiry</div>
                    <div className="mt-1 text-sm text-gray-900">{driverData.licenseExpiry}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Professional Driving Permit (PDP)</div>
                    <div className="mt-1 text-sm text-gray-900">{driverData.pdp}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">PDP Expiry</div>
                    <div className="mt-1 text-sm text-gray-900">{driverData.pdpExpiry}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Experience</div>
                    <div className="mt-1 text-sm text-gray-900">{driverData.experience} years</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Contact Driver
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50">
                Report Issue
              </button>
            </div>
          </div>
        )}

        {activeTab === 'vehicle' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vehicle Information</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Vehicle</div>
                  <div className="mt-1 text-sm text-gray-900">{driverData.vehicleInfo.make} {driverData.vehicleInfo.model} ({driverData.vehicleInfo.year})</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Registration</div>
                  <div className="mt-1 text-sm text-gray-900">{driverData.vehicleInfo.registration}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Capacity</div>
                  <div className="mt-1 text-sm text-gray-900">{driverData.vehicleInfo.capacity} students</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg overflow-hidden mb-6">
              <div className="px-4 py-5 border-b sm:px-6">
                <h3 className="text-sm font-medium text-gray-900">Inspection Information</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Last Inspection</div>
                    <div className="mt-1 text-sm text-gray-900">{driverData.vehicleInfo.lastInspection}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Next Inspection Due</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {driverData.vehicleInfo.nextInspection}
                      {new Date(driverData.vehicleInfo.nextInspection) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                View Vehicle Details
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50">
                View Inspection History
              </button>
            </div>
          </div>
        )}

        {activeTab === 'route' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Route Information</h3>
              <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {driverData.route.name}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-500">Stops</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">{driverData.route.stops}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-500">Students</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">{driverData.route.students}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-500">Distance</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">{driverData.route.distance} km</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-500">Operating Hours</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">{driverData.route.startTime} - {driverData.route.endTime}</div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                View Route Details
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50">
                View Student List
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50">
                Track Current Location
              </button>
            </div>
          </div>
        )}

        {activeTab === 'safety' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Safety Record</h3>
            
            <div className="bg-white border rounded-lg overflow-hidden mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                <div className="p-6 border-b md:border-b-0 md:border-r">
                  <div className="text-sm font-medium text-gray-500">Incidents</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">{driverData.safetyRecord.incidents}</div>
                  <div className="mt-1 text-sm text-gray-500">No reported incidents</div>
                </div>
                <div className="p-6 border-b md:border-b-0 md:border-r">
                  <div className="text-sm font-medium text-gray-500">Complaints</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">{driverData.safetyRecord.complaints}</div>
                  <div className="mt-1 text-sm text-gray-500">1 minor complaint resolved</div>
                </div>
                <div className="p-6">
                  <div className="text-sm font-medium text-gray-500">Compliments</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">{driverData.safetyRecord.compliments}</div>
                  <div className="mt-1 text-sm text-gray-500">From parents and school staff</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg overflow-hidden mb-6">
              <div className="px-4 py-5 border-b sm:px-6">
                <h3 className="text-sm font-medium text-gray-900">Training & Certifications</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-gray-900">Safety and Emergency Response Training</div>
                </div>
                <div className="flex items-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-gray-900">Child Safety and Protection Certification</div>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-gray-900">Defensive Driving Certification</div>
                </div>
                
                <div className="mt-4 text-sm">
                  <span className="text-gray-500">Last training completed:</span> 
                  <span className="ml-1 font-medium">{driverData.safetyRecord.lastTraining}</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                View Full Safety Record
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50">
                Report Safety Concern
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverInfo;