import React, { useState } from 'react';

const StudentManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Sample student data
  const students = [
    {
      id: 1,
      firstName: "Thabo",
      lastName: "Mokoena",
      grade: "5",
      parentName: "Grace Mokoena",
      parentContact: "071 234 5678",
      address: "25 Oak Avenue, Parktown",
      status: "active",
      route: "Northern Suburbs Route",
      pickupLocation: "Parkview Mall",
      pickupTime: "06:45",
      dropoffTime: "14:25",
      specialNeeds: false,
      emergencyContact: "James Mokoena (Uncle) - 082 345 6789",
      attendance: {
        present: 45,
        absent: 2,
        late: 3,
        total: 50
      }
    },
    {
      id: 2,
      firstName: "Lerato",
      lastName: "Ndlovu",
      grade: "7",
      parentName: "David Ndlovu",
      parentContact: "082 345 6789",
      address: "12 Maple Street, Ferndale",
      status: "active",
      route: "Northern Suburbs Route",
      pickupLocation: "Ferndale Shopping Center",
      pickupTime: "07:05",
      dropoffTime: "14:30",
      specialNeeds: true,
      specialNeedsDetails: "Requires assistance boarding vehicle (mobility limitations)",
      emergencyContact: "Sarah Ndlovu (Mother) - 073 456 7890",
      attendance: {
        present: 48,
        absent: 1,
        late: 1,
        total: 50
      }
    },
    {
      id: 3,
      firstName: "Amina",
      lastName: "Patel",
      grade: "4",
      parentName: "Rajesh Patel",
      parentContact: "083 456 7890",
      address: "56 Baobab Drive, Bedfordview",
      status: "inactive",
      route: "Eastern Routes",
      pickupLocation: "Bedfordview Center",
      pickupTime: "06:30",
      dropoffTime: "14:25",
      specialNeeds: false,
      emergencyContact: "Anita Patel (Mother) - 073 567 8901",
      attendance: {
        present: 40,
        absent: 10,
        late: 0,
        total: 50
      }
    }
  ];

  // Filter students based on search term and status
  const filteredStudents = students.filter(student => {
    // Apply status filter
    if (filterStatus !== 'all' && student.status !== filterStatus) return false;
    
    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        student.firstName.toLowerCase().includes(search) ||
        student.lastName.toLowerCase().includes(search) ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(search) ||
        student.grade.toLowerCase().includes(search) ||
        student.route.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  // Helper function for status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Student Management</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add Student
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-grow max-w-md">
          <label htmlFor="search" className="sr-only">Search students</label>
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
              placeholder="Search students"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Special Needs</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map(student => (
                <tr 
                  key={student.id}
                  className={`hover:bg-gray-50 ${selectedStudent === student.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                    <div className="text-sm text-gray-500">{student.parentName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.grade}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.route}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(student.status)}`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.specialNeeds ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button className="text-gray-600 hover:text-gray-900">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <div className="bg-white rounded-lg shadow p-6">
          {(() => {
            const student = students.find(s => s.id === selectedStudent);
            return (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{student.firstName} {student.lastName}</h3>
                  <button 
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setSelectedStudent(null)}
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Student Details</h4>
                    <p className="text-sm text-gray-900 mb-1">Grade: {student.grade}</p>
                    <p className="text-sm text-gray-900 mb-1">Status: 
                      <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(student.status)}`}>
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-900">Address: {student.address}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Transportation</h4>
                    <p className="text-sm text-gray-900 mb-1">Route: {student.route}</p>
                    <p className="text-sm text-gray-900 mb-1">Pickup: {student.pickupLocation} ({student.pickupTime})</p>
                    <p className="text-sm text-gray-900">Dropoff: {student.dropoffTime}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Contact Information</h4>
                    <p className="text-sm text-gray-900 mb-1">Parent: {student.parentName}</p>
                    <p className="text-sm text-gray-900 mb-1">Contact: {student.parentContact}</p>
                    <p className="text-sm text-gray-900">Emergency: {student.emergencyContact}</p>
                  </div>
                </div>

                {student.specialNeeds && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="text-xs font-medium text-yellow-800 uppercase tracking-wider mb-1">Special Needs</h4>
                    <p className="text-sm text-yellow-900">{student.specialNeedsDetails}</p>
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Attendance</h4>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-4 mr-4">
                      <div className="flex h-4 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-4" style={{width: `${(student.attendance.present / student.attendance.total) * 100}%`}}></div>
                        <div className="bg-yellow-500 h-4" style={{width: `${(student.attendance.late / student.attendance.total) * 100}%`}}></div>
                        <div className="bg-red-500 h-4" style={{width: `${(student.attendance.absent / student.attendance.total) * 100}%`}}></div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{Math.round((student.attendance.present / student.attendance.total) * 100)}%</span> present
                    </div>
                  </div>
                  <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                      <span>Present: {student.attendance.present}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                      <span>Late: {student.attendance.late}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                      <span>Absent: {student.attendance.absent}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">
                    Edit Information
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
                    View Transport History
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
                    Send Notification
                  </button>
                  {student.status === 'active' ? (
                    <button className="border border-red-300 text-red-700 px-3 py-1.5 rounded text-sm hover:bg-red-50">
                      Deactivate
                    </button>
                  ) : (
                    <button className="border border-green-300 text-green-700 px-3 py-1.5 rounded text-sm hover:bg-green-50">
                      Activate
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default StudentManagement;