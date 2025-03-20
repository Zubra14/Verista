// src/components/dashboard-modules/driver/Students.jsx
import React, { useState } from 'react';

export const Students = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const studentData = [
    { id: 1, name: 'Sipho Ndlovu', grade: 'Grade 4', pickupLocation: 'Khanya Residence', parent: 'Thandi Ndlovu', phone: '+27 82 345 6789', status: 'Active' },
    { id: 2, name: 'Amahle Zulu', grade: 'Grade 2', pickupLocation: 'Khanya Residence', parent: 'Bongani Zulu', phone: '+27 83 567 8901', status: 'Active' },
    { id: 3, name: 'Thabo Molefe', grade: 'Grade 5', pickupLocation: 'Thabo Heights', parent: 'Lerato Molefe', phone: '+27 84 678 9012', status: 'Active' },
    { id: 4, name: 'Zanele Dlamini', grade: 'Grade 3', pickupLocation: 'Thabo Heights', parent: 'Nomsa Dlamini', phone: '+27 82 789 0123', status: 'Active' },
    { id: 5, name: 'Mpho Sithole', grade: 'Grade 1', pickupLocation: 'Mandela Gardens', parent: 'Themba Sithole', phone: '+27 83 890 1234', status: 'Active' },
    { id: 6, name: 'Nosipho Khumalo', grade: 'Grade 3', pickupLocation: 'Mandela Gardens', parent: 'Ayanda Khumalo', phone: '+27 84 901 2345', status: 'Inactive' },
    { id: 7, name: 'Mandla Nkosi', grade: 'Grade 4', pickupLocation: 'Mandela Gardens', parent: 'Sibusiso Nkosi', phone: '+27 82 012 3456', status: 'Active' },
    { id: 8, name: 'Thandi Mkhize', grade: 'Grade 2', pickupLocation: 'Unity Complex', parent: 'Nkosinathi Mkhize', phone: '+27 83 123 4567', status: 'Active' },
    { id: 9, name: 'Lungile Ngcobo', grade: 'Grade 5', pickupLocation: 'Unity Complex', parent: 'Zanele Ngcobo', phone: '+27 84 234 5678', status: 'Inactive' }
  ];
  
  // Filter students based on search query and filter status
  const filteredStudents = studentData.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.parent.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || student.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Students</h1>
        <p className="text-gray-500">Manage students on your transportation routes</p>
      </div>
      
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div className="w-full md:w-auto flex items-center space-x-2 mb-4 md:mb-0">
          <div className="relative flex-grow md:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          >
            <option>All</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
        
        <div className="w-full md:w-auto flex space-x-2">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export List
          </button>
          
          <button className="px-4 py-2 bg-teal-600 text-white rounded-md shadow-sm hover:bg-teal-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Take Attendance
          </button>
        </div>
      </div>
      
      {/* Students Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pickup Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent/Guardian
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                        {student.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.grade}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.pickupLocation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.parent}</div>
                    <div className="text-sm text-gray-500">{student.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      student.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-teal-600 hover:text-teal-900 mr-3">Call Parent</button>
                    <button className="text-teal-600 hover:text-teal-900">Mark Present</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredStudents.length}</span> of <span className="font-medium">{filteredStudents.length}</span> students
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Previous
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-teal-600 hover:bg-teal-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};