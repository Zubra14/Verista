// src/components/dashboard/DriverDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import TestAccountBanner from "../common/TestAccountBanner";
import LoadingSpinner from "../common/LoadingSpinner";
import { toast } from "react-toastify";

// Import the sub-components
import { MyVehicle } from "./dashboard-modules/driver/MyVehicle";
import { MyRoutes } from "./dashboard-modules/driver/MyRoutes";
import { Students } from "./dashboard-modules/driver/Students";

const DriverDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isTestAccount = currentUser?.email === "veristatest@gmail.com";
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sample driver data
  const driverData = {
    name: "Thabo Mabaso",
    vehicleInfo: {
      make: "Toyota",
      model: "Hiace",
      registration: "JHB-452-GP",
      status: "Active",
      lastInspection: "2025-02-20",
      nextInspection: "2025-05-20",
    },
    routeInfo: {
      name: "Northern Suburbs Route",
      schools: ["Greenview Primary School"],
      stops: 4,
      students: 16,
      distanceKm: 12.5,
    },
    todaysSchedule: [
      {
        id: 1,
        type: "Morning Route",
        startTime: "06:45",
        endTime: "07:30",
        status: "completed",
      },
      {
        id: 2,
        type: "Afternoon Route",
        startTime: "14:15",
        endTime: "15:00",
        status: "upcoming",
      },
    ],
    alerts: [
      {
        id: 1,
        type: "vehicle",
        message: "Vehicle inspection due in 30 days",
        priority: "medium",
        timestamp: "2025-03-16T08:00:00Z",
      },
      {
        id: 2,
        type: "route",
        message: "Traffic alert: Heavy congestion reported on Main Road",
        priority: "high",
        timestamp: "2025-03-16T13:45:00Z",
      },
    ],
    stats: {
      tripsCompleted: 387,
      studentsTransported: 6192,
      totalKm: 4835,
      onTimePercentage: 98.2,
    },
  };

  const getCurrentStatus = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTimeStr = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;

    for (const trip of driverData.todaysSchedule) {
      const [startHour, startMinute] = trip.startTime.split(":").map(Number);
      const [endHour, endMinute] = trip.endTime.split(":").map(Number);
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      const currentTime = hours * 60 + minutes;

      if (currentTime >= startTime - 15 && currentTime <= endTime) {
        if (currentTime < startTime) {
          return {
            status: "preparing",
            message: `Prepare for ${trip.type} - Starting in ${
              startTime - currentTime
            } minutes`,
            route: driverData.routeInfo.name,
            tripId: trip.id,
          };
        } else {
          return {
            status: "inProgress",
            message: `${trip.type} in progress`,
            route: driverData.routeInfo.name,
            tripId: trip.id,
          };
        }
      }
    }

    return {
      status: "idle",
      message: "No active routes at this time",
      route: null,
      tripId: null,
    };
  };

  const currentStatus = getCurrentStatus();

  // Function to handle errors
  const handleError = (error, context) => {
    console.error(`Error in ${context}:`, error);
    setError(error.message);
    toast.error(`Failed to load ${context}. ${error.message}`);
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
          <span className="ml-2">Loading dashboard...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <h3 className="font-bold">Error Loading Dashboard</h3>
          <p>{error}</p>
          <button
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Welcome, {driverData.name}
                </h1>
                <p className="text-gray-600">Driver Dashboard</p>
              </div>
              <div className="mt-4 lg:mt-0">
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    currentStatus.status === "inProgress"
                      ? "bg-green-100 text-green-800"
                      : currentStatus.status === "preparing"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <span
                    className={`mr-2 h-3 w-3 rounded-full ${
                      currentStatus.status === "inProgress"
                        ? "bg-green-500"
                        : currentStatus.status === "preparing"
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                    }`}
                  ></span>
                  {currentStatus.message}
                </div>
                {currentStatus.status !== "idle" && (
                  <button
                    className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setActiveTab("myRoutes")}
                  >
                    {currentStatus.status === "preparing"
                      ? "Start Route"
                      : "View Active Route"}
                  </button>
                )}
              </div>
            </div>

            {isTestAccount && <TestAccountBanner />}
          </div>

          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-800">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold text-gray-700">
                      Trips Completed
                    </h2>
                    <p className="text-3xl font-bold text-gray-900">
                      {driverData.stats.tripsCompleted}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-800">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold text-gray-700">
                      Students Transported
                    </h2>
                    <p className="text-3xl font-bold text-gray-900">
                      {driverData.stats.studentsTransported}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-800">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold text-gray-700">
                      Total Distance
                    </h2>
                    <p className="text-3xl font-bold text-gray-900">
                      {driverData.stats.totalKm} km
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100 text-yellow-800">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold text-gray-700">
                      On-Time Rate
                    </h2>
                    <p className="text-3xl font-bold text-gray-900">
                      {driverData.stats.onTimePercentage}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-6 ${
                  activeTab === "overview"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("myRoutes")}
                className={`py-4 px-6 ${
                  activeTab === "myRoutes"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Routes
              </button>
              <button
                onClick={() => setActiveTab("myVehicle")}
                className={`py-4 px-6 ${
                  activeTab === "myVehicle"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Vehicle
              </button>
              <button
                onClick={() => setActiveTab("students")}
                className={`py-4 px-6 ${
                  activeTab === "students"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Students
              </button>
            </nav>
          </div>

          <div className="bg-white rounded-lg shadow-md">
            {activeTab === "overview" && (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <h2 className="text-lg font-semibold mb-4">
                      Today's Schedule
                    </h2>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {driverData.todaysSchedule.length === 0 ? (
                        <p className="text-gray-500">
                          No scheduled routes for today.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {driverData.todaysSchedule.map((schedule) => (
                            <div
                              key={schedule.id}
                              className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="font-medium">
                                    {schedule.type}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {schedule.startTime} - {schedule.endTime}
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    schedule.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : schedule.status === "upcoming"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {schedule.status.charAt(0).toUpperCase() +
                                    schedule.status.slice(1)}
                                </span>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm">
                                  {driverData.routeInfo.name} (
                                  {driverData.routeInfo.distanceKm} km)
                                </p>
                                <p className="text-sm text-gray-500">
                                  {driverData.routeInfo.students} students,{" "}
                                  {driverData.routeInfo.stops} stops
                                </p>
                              </div>
                              <div className="mt-3 flex space-x-2">
                                {schedule.status === "upcoming" && (
                                  <button
                                    className="text-white bg-blue-600 hover:bg-blue-700 text-xs font-medium px-3 py-1.5 rounded"
                                    onClick={() => setActiveTab("myRoutes")}
                                  >
                                    Start Route
                                  </button>
                                )}
                                {schedule.status === "inProgress" && (
                                  <button
                                    className="text-white bg-green-600 hover:bg-green-700 text-xs font-medium px-3 py-1.5 rounded"
                                    onClick={() => setActiveTab("myRoutes")}
                                  >
                                    Continue Route
                                  </button>
                                )}
                                <button
                                  className="text-gray-700 bg-gray-100 hover:bg-gray-200 text-xs font-medium px-3 py-1.5 rounded"
                                  onClick={() => setActiveTab("myRoutes")}
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold mb-4">
                      Alerts & Notifications
                    </h2>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                      {driverData.alerts.length === 0 ? (
                        <p className="text-gray-500">No alerts at this time.</p>
                      ) : (
                        <div className="space-y-3">
                          {driverData.alerts.map((alert) => (
                            <div
                              key={alert.id}
                              className={`p-3 rounded-lg border ${
                                alert.priority === "high"
                                  ? "border-red-200 bg-red-50"
                                  : alert.priority === "medium"
                                  ? "border-yellow-200 bg-yellow-50"
                                  : "border-gray-200 bg-white"
                              }`}
                            >
                              <div className="flex items-start">
                                <div
                                  className={`p-1 rounded-full ${
                                    alert.priority === "high"
                                      ? "bg-red-100"
                                      : alert.priority === "medium"
                                      ? "bg-yellow-100"
                                      : "bg-gray-100"
                                  }`}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-gray-700"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                </div>
                                <div className="ml-3 flex-1">
                                  <p className="text-sm font-medium">
                                    {alert.message}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(alert.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-4">
                    Quick Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="font-medium mb-2">Vehicle Information</h3>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Vehicle:</span>{" "}
                          {driverData.vehicleInfo.make}{" "}
                          {driverData.vehicleInfo.model}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Registration:</span>{" "}
                          {driverData.vehicleInfo.registration}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Status:</span>{" "}
                          {driverData.vehicleInfo.status}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Next Inspection:</span>{" "}
                          {driverData.vehicleInfo.nextInspection}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("myVehicle")}
                        className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details →
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="font-medium mb-2">Route Information</h3>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Route:</span>{" "}
                          {driverData.routeInfo.name}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Schools:</span>{" "}
                          {driverData.routeInfo.schools.join(", ")}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Stops:</span>{" "}
                          {driverData.routeInfo.stops}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Students:</span>{" "}
                          {driverData.routeInfo.students}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("myRoutes")}
                        className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "myRoutes" && <MyRoutes />}
            {activeTab === "myVehicle" && <MyVehicle />}
            {activeTab === "students" && <Students />}
          </div>
        </>
      )}
    </div>
  );
};

export default DriverDashboard;
