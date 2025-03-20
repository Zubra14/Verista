// src/components/dashboard-modules/parent/DriverInfo.jsx
import React from 'react';

export const DriverInfo = () => {
  const driverData = {
    name: "John Dube",
    phone: "+27 82 123 4567",
    licenseNumber: "DL-2547865",
    prdrStatus: "Valid",
    backgroundCheck: "Verified",
    experience: "8 years",
    rating: 4.9,
    vehicleType: "Toyota Quantum",
    registration: "CA 123-456",
    roadworthiness: "Valid until Dec 2025",
    lastInspection: "Feb 25, 2025",
    insuranceValid: true,
    profileImage: "https://randomuser.me/api/portraits/men/32.jpg"
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Driver Information</h1>
        <p className="text-gray-500">Details about your child's transportation provider</p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="p-6 flex flex-col md:flex-row items-start">
          <div className="mb-4 md:mb-0 mr-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden">
              <img src={driverData.profileImage} alt={driverData.name} className="w-full h-full object-cover" />
            </div>
          </div>
          
          <div className="flex-grow">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{driverData.name}</h2>
                <p className="text-gray-600">Primary Driver • {driverData.registration}</p>
              </div>
              
              <div className="mt-3 md:mt-0 flex items-center">
                <div className="flex items-center bg-green-50 px-3 py-1 rounded-full mr-3">
                  <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-green-700">Verified</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 text-gray-700">{driverData.rating}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap mb-6">
              <button className="mr-3 mb-3 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center">
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Driver
              </button>
              
              <button className="mr-3 mb-3 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center">
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Message
              </button>
              
              <button className="mb-3 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center">
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Report Issue
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Driver Details */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">Driver Details</h3>
          </div>
          <div className="p-6">
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">License Number</dt>
                <dd className="text-sm font-medium text-gray-900">{driverData.licenseNumber}</dd>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-500">PrDP Status</dt>
                <dd className="text-sm font-medium text-green-600">{driverData.prdrStatus}</dd>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-500">Background Check</dt>
                <dd className="text-sm font-medium text-green-600">{driverData.backgroundCheck}</dd>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-500">Years of Experience</dt>
                <dd className="text-sm font-medium text-gray-900">{driverData.experience}</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-sm font-medium text-gray-500">Contact Number</dt>
                <dd className="text-sm font-medium text-gray-900">{driverData.phone}</dd>
              </div>
            </dl>
          </div>
        </div>
        
        {/* Vehicle Information */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">Vehicle Information</h3>
          </div>
          <div className="p-6">
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Vehicle Type</dt>
                <dd className="text-sm font-medium text-gray-900">{driverData.vehicleType}</dd>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-500">Registration</dt>
                <dd className="text-sm font-medium text-gray-900">{driverData.registration}</dd>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-500">Roadworthiness</dt>
                <dd className="text-sm font-medium text-green-600">{driverData.roadworthiness}</dd>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-500">Last Inspection</dt>
                <dd className="text-sm font-medium text-gray-900">{driverData.lastInspection}</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-sm font-medium text-gray-500">Insurance Status</dt>
                <dd className="text-sm font-medium text-green-600">{driverData.insuranceValid ? 'Valid' : 'Invalid'}</dd>
              </div>
            </dl>
          </div>
        </div>
        
        {/* Trip History with This Driver */}
        <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Recent Trips with This Driver</h3>
            <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
          </div>
          <div className="p-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departure
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arrival
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Mar 14, 2025</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">07:30 AM</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">07:52 AM</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Mar 13, 2025</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">07:32 AM</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">07:55 AM</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Mar 11, 2025</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">07:31 AM</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">07:58 AM</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};