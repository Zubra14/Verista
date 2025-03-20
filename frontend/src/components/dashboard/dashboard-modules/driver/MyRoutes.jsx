// src/components/dashboard/dashboard-modules/driver/MyRoutes.jsx
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import DriverRouteMap from "./DriverRouteMap";
import LoadingSpinner from "../../../common/LoadingSpinner";

// Fallback location generator for when geolocation fails
const offlineFallback = {
  generateLocation: () => {
    // Default to a location in Johannesburg area
    return {
      latitude: -26.2041,
      longitude: 28.0473,
      speed: 0,
      timestamp: new Date().toISOString(),
      isFallback: true,
    };
  },
};

export const MyRoutes = () => {
  const [selectedDate, setSelectedDate] = useState("Today");
  const [viewMode, setViewMode] = useState("split"); // 'split', 'list', or 'map'
  const [activeRoute, setActiveRoute] = useState("morning"); // 'morning' or 'afternoon'
  const [expandedRoute, setExpandedRoute] = useState("morning"); // 'morning' or 'afternoon' or null
  const [activeStopIndex, setActiveStopIndex] = useState(2); // Index of the active stop
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [vehicleId, setVehicleId] = useState("demo-vehicle-1");
  const [mapStatus, setMapStatus] = useState("loading"); // "loading", "error", "fallback", "success"
  const [watchPositionId, setWatchPositionId] = useState(null);

  // Mock data - this would come from your API in production
  const routeData = {
    morningPickup: {
      id: "morning-route-1",
      startTime: "07:00 AM",
      endTime: "07:45 AM",
      status: "in_progress",
      stops: [
        {
          id: 1,
          time: "07:05 AM",
          name: "Khanya Residence",
          address: "12 Mbeki Street, Soweto",
          students: 3,
          status: "completed",
          coordinates: { lat: -26.2644, lng: 27.8555 },
        },
        {
          id: 2,
          time: "07:15 AM",
          name: "Thabo Heights",
          address: "45 Sisulu Avenue, Soweto",
          students: 2,
          status: "completed",
          coordinates: { lat: -26.2555, lng: 27.865 },
        },
        {
          id: 3,
          time: "07:25 AM",
          name: "Mandela Gardens",
          address: "78 Freedom Road, Soweto",
          students: 4,
          status: "active",
          coordinates: { lat: -26.2488, lng: 27.8726 },
        },
        {
          id: 4,
          time: "07:35 AM",
          name: "Unity Complex",
          address: "23 Horizon Drive, Johannesburg",
          students: 3,
          status: "pending",
          coordinates: { lat: -26.1932, lng: 28.0195 },
        },
      ],
      destination: {
        id: 5,
        time: "07:45 AM",
        name: "Mzamomhle Primary School",
        address: "56 Education Road, Johannesburg",
        coordinates: { lat: -26.1877, lng: 28.0285 },
      },
    },
    afternoonPickup: {
      id: "afternoon-route-1",
      startTime: "14:00 PM",
      endTime: "14:45 PM",
      status: "upcoming",
      stops: [
        {
          id: 1,
          time: "14:05 PM",
          name: "Mzamomhle Primary School",
          address: "56 Education Road, Johannesburg",
          students: 12,
          status: "pending",
          coordinates: { lat: -26.1877, lng: 28.0285 },
        },
        {
          id: 2,
          time: "14:15 PM",
          name: "Unity Complex",
          address: "23 Horizon Drive, Johannesburg",
          students: 3,
          status: "pending",
          coordinates: { lat: -26.1932, lng: 28.0195 },
        },
        {
          id: 3,
          time: "14:25 PM",
          name: "Mandela Gardens",
          address: "78 Freedom Road, Soweto",
          students: 4,
          status: "pending",
          coordinates: { lat: -26.2488, lng: 27.8726 },
        },
        {
          id: 4,
          time: "14:35 PM",
          name: "Thabo Heights",
          address: "45 Sisulu Avenue, Soweto",
          students: 2,
          status: "pending",
          coordinates: { lat: -26.2555, lng: 27.865 },
        },
        {
          id: 5,
          time: "14:45 PM",
          name: "Khanya Residence",
          address: "12 Mbeki Street, Soweto",
          students: 3,
          status: "pending",
          coordinates: { lat: -26.2644, lng: 27.8555 },
        },
      ],
    },
  };

  // Format stops for the map component
  const getFormattedStops = useCallback(() => {
    const routeKey =
      activeRoute === "morning" ? "morningPickup" : "afternoonPickup";
    const selectedRoute = routeData[routeKey];

    // Format regular stops
    const formattedStops = selectedRoute.stops.map((stop) => ({
      id: stop.id,
      name: stop.name,
      address: stop.address,
      time: stop.time,
      status: stop.status,
      students: stop.students,
      coordinates: stop.coordinates,
    }));

    // Add destination for morning route
    if (activeRoute === "morning" && selectedRoute.destination) {
      formattedStops.push({
        id: selectedRoute.destination.id,
        name: selectedRoute.destination.name,
        address: selectedRoute.destination.address,
        time: selectedRoute.destination.time,
        status: "pending",
        students: 0,
        isDestination: true,
        coordinates: selectedRoute.destination.coordinates,
      });
    }

    return formattedStops;
  }, [activeRoute]);

  // Get index of the currently active stop
  const getActiveStopIndex = useCallback(() => {
    const routeKey =
      activeRoute === "morning" ? "morningPickup" : "afternoonPickup";
    const stops = routeData[routeKey].stops;
    return stops.findIndex((stop) => stop.status === "active");
  }, [activeRoute]);

  // Update stop status
  const updateStopStatus = (stopId, newStatus) => {
    // In a real app, this would make an API call
    // For the demo, we'll just update the local state
    const routeKey =
      activeRoute === "morning" ? "morningPickup" : "afternoonPickup";
    const updatedRouteData = { ...routeData };

    // Find the stop to update
    const stopIndex = updatedRouteData[routeKey].stops.findIndex(
      (stop) => stop.id === stopId
    );
    if (stopIndex >= 0) {
      updatedRouteData[routeKey].stops[stopIndex].status = newStatus;

      // If completed, update the next stop to active (if any)
      if (
        newStatus === "completed" &&
        stopIndex < updatedRouteData[routeKey].stops.length - 1
      ) {
        updatedRouteData[routeKey].stops[stopIndex + 1].status = "active";
        setActiveStopIndex(stopIndex + 1);
      }

      // Toast notification
      toast.success(
        `Stop "${updatedRouteData[routeKey].stops[stopIndex].name}" marked as ${newStatus}`
      );
    }
  };

  // Render the map content based on the current status
  const renderMapContent = () => {
    switch (mapStatus) {
      case "loading":
        return (
          <div className="flex items-center justify-center h-[500px]">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading map...</span>
          </div>
        );

      case "error":
        return (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              <p className="font-medium">Unable to initialize map</p>
              <p>Map initialization failed. Please try again.</p>
            </div>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => {
                setMapStatus("loading");
                // After a short delay, either we'll get a callback from the map component
                // or we'll switch to fallback if it takes too long
                setTimeout(() => {
                  if (mapStatus === "loading") {
                    setMapStatus("fallback");
                  }
                }, 5000);
              }}
            >
              Retry Map
            </button>
          </div>
        );

      case "fallback":
        return (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              <p className="font-medium">Map Display Unavailable</p>
              <p>Using simplified route view due to initialization issues.</p>
            </div>

            {getFormattedStops().map((stop, index) => (
              <div
                key={index}
                className="mb-4 p-3 border border-gray-200 rounded-lg bg-white relative"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                  style={{
                    backgroundColor:
                      stop.status === "completed"
                        ? "#34D399"
                        : stop.status === "active"
                        ? "#3B82F6"
                        : "#9CA3AF",
                  }}
                ></div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold mr-2"
                      style={{
                        backgroundColor:
                          stop.status === "completed"
                            ? "#34D399"
                            : stop.status === "active"
                            ? "#3B82F6"
                            : "#9CA3AF",
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{stop.name}</h4>
                      <p className="text-sm text-gray-500">{stop.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{stop.time}</p>
                    <div className="mt-1">
                      {stop.status && (
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                            stop.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : stop.status === "active"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {stop.status.charAt(0).toUpperCase() +
                            stop.status.slice(1)}
                        </span>
                      )}
                      {stop.students && (
                        <span className="ml-1 inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-teal-100 text-teal-800">
                          {stop.students} students
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {stop.status === "active" && (
                  <div className="mt-3 pl-8">
                    <button
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      onClick={() => updateStopStatus(stop.id, "completed")}
                    >
                      Mark Completed
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div className="mt-4">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => setMapStatus("loading")}
              >
                Retry Map
              </button>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="h-[500px] p-3">
            <DriverRouteMap
              routeId={
                activeRoute === "morning"
                  ? routeData.morningPickup.id
                  : routeData.afternoonPickup.id
              }
              stops={getFormattedStops()}
              vehicleId={vehicleId}
              activeStopIndex={activeStopIndex}
              currentLocation={currentLocation}
              onLoadingStart={() => setMapStatus("loading")}
              onLoadingComplete={() => setMapStatus("success")}
              onMapError={() => setMapStatus("error")}
              onMapFailure={() => setMapStatus("fallback")}
            />
          </div>
        );

      default:
        return <div>Unknown map status</div>;
    }
  };

  // Enhanced location tracking function
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    // Better geolocation options with shorter timeout
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 5000, // Reduce timeout to 5 seconds (original timeout was likely too long)
      maximumAge: 10000,
    };

    // Initial location fetch with error handling
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success handler
        const { latitude, longitude } = position.coords;
        setCurrentLocation({
          latitude,
          longitude,
          speed: position.coords.speed || 0,
          timestamp: new Date().toISOString(),
        });
      },
      (error) => {
        // Error handler
        console.error("Geolocation error:", error);
        switch (error.code) {
          case error.TIMEOUT:
            toast.warning(
              "Location request timed out. Using default location."
            );
            // Provide fallback location
            setCurrentLocation(offlineFallback.generateLocation());
            break;
          case error.PERMISSION_DENIED:
            toast.error(
              "Location access denied. Please enable location services in your browser settings."
            );
            break;
          default:
            toast.error(`Location error: ${error.message}`);
        }
      },
      geoOptions
    );

    // Set up watch position with the same options
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({
          latitude,
          longitude,
          speed: position.coords.speed || 0,
          timestamp: new Date().toISOString(),
        });
      },
      (error) => {
        console.error("Error watching position:", error);
        // Handle watch position errors
        if (error.code === error.TIMEOUT) {
          // If it's just a timeout, use the last known position if available
          // or fallback if needed
          if (!currentLocation) {
            setCurrentLocation(offlineFallback.generateLocation());
          }
        }
      },
      geoOptions
    );

    // Store watch ID for cleanup
    setWatchPositionId(watchId);

    return watchId;
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (watchPositionId !== null) {
      navigator.geolocation.clearWatch(watchPositionId);
      setWatchPositionId(null);
      toast.info("Location tracking stopped");
    }
  };

  // Toggle location tracking
  const toggleLocationTracking = () => {
    if (isLocationTracking) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
    setIsLocationTracking(!isLocationTracking);
  };

  // Handle location tracking based on isLocationTracking state
  useEffect(() => {
    if (isLocationTracking) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    // Cleanup function
    return () => {
      if (watchPositionId !== null) {
        navigator.geolocation.clearWatch(watchPositionId);
      }
    };
  }, [isLocationTracking]);

  // Initialize active stop index when component mounts
  useEffect(() => {
    const index = getActiveStopIndex();
    if (index >= 0) {
      setActiveStopIndex(index);
    }
  }, [getActiveStopIndex]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">My Routes</h1>
        <p className="text-gray-500">
          Manage your daily transportation routes and schedules
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between mb-6">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          >
            <option>Today</option>
            <option>Tomorrow</option>
            <option>March 17, 2025</option>
            <option>March 18, 2025</option>
          </select>

          {/* View Mode Toggle */}
          <div className="hidden md:flex bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode("split")}
              className={`px-3 py-1 rounded-md ${
                viewMode === "split" ? "bg-white shadow-sm" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded-md ${
                viewMode === "list" ? "bg-white shadow-sm" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm5 0a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H8a1 1 0 01-1-1V4zm5 0a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                <path d="M2 9a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V9zm5 0a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H8a1 1 0 01-1-1V9zm5 0a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V9z" />
                <path d="M2 14a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2zm5 0a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H8a1 1 0 01-1-1v-2zm5 0a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-1 rounded-md ${
                viewMode === "map" ? "bg-white shadow-sm" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Export Route
          </button>

          <button
            className="px-4 py-2 bg-teal-600 text-white rounded-md shadow-sm hover:bg-teal-700 flex items-center"
            onClick={toggleLocationTracking}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                clipRule="evenodd"
              />
            </svg>
            {isLocationTracking ? "Stop Tracking" : "Start Route"}
          </button>
        </div>
      </div>

      {/* Main content container - split or full width based on view mode */}
      <div
        className={`${
          viewMode === "split" ? "flex flex-col md:flex-row gap-4" : ""
        }`}
      >
        {/* Route list section */}
        {(viewMode === "split" || viewMode === "list") && (
          <div className={`${viewMode === "split" ? "md:w-1/2" : "w-full"}`}>
            {/* Morning Route */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
              <div
                className="px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => {
                  setActiveRoute("morning");
                  setExpandedRoute(
                    expandedRoute === "morning" ? null : "morning"
                  );
                }}
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-800">
                    Morning Pickup Route
                  </h3>
                  <p className="text-sm text-gray-500">
                    {routeData.morningPickup.startTime} -{" "}
                    {routeData.morningPickup.endTime}
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 mr-2">
                    In Progress
                  </span>
                  <button className="text-teal-600 hover:text-teal-800">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  </button>
                </div>
              </div>

              {(expandedRoute === "morning" || viewMode === "split") && (
                <div className="p-6">
                  <div className="relative pb-12">
                    {routeData.morningPickup.stops.map((stop, index) => (
                      <div
                        key={stop.id}
                        className="relative flex items-start group"
                      >
                        <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full mt-3 ml-3">
                          {stop.status === "completed" ? (
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-green-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          ) : stop.status === "active" ? (
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                            </div>
                          ) : (
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            </div>
                          )}
                        </div>

                        {index < routeData.morningPickup.stops.length - 1 && (
                          <div className="absolute left-6 top-6 bottom-0 w-px bg-gray-200"></div>
                        )}

                        <div className="ml-4 min-w-0 flex-1 py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {stop.name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {stop.address}
                              </p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <span className="text-sm font-medium text-gray-900">
                                {stop.time}
                              </span>
                              {stop.status === "completed" && (
                                <span className="ml-2 text-xs text-green-600">
                                  Completed
                                </span>
                              )}
                              {stop.status === "active" && (
                                <span className="ml-2 text-xs text-blue-600">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-1 flex items-center">
                            <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                              {stop.students} students
                            </span>

                            {stop.status === "active" && (
                              <button
                                className="ml-3 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full hover:bg-green-700"
                                onClick={() =>
                                  updateStopStatus(stop.id, "completed")
                                }
                              >
                                Mark Completed
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Final Destination */}
                    <div className="relative flex items-start group">
                      <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full mt-3 ml-3">
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="ml-4 min-w-0 flex-1 py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {routeData.morningPickup.destination.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {routeData.morningPickup.destination.address}
                            </p>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <span className="text-sm font-medium text-gray-900">
                              {routeData.morningPickup.destination.time}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1 flex items-center">
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                            Final destination
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Afternoon Route */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div
                className="px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => {
                  setActiveRoute("afternoon");
                  setExpandedRoute(
                    expandedRoute === "afternoon" ? null : "afternoon"
                  );
                }}
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-800">
                    Afternoon Drop-off Route
                  </h3>
                  <p className="text-sm text-gray-500">
                    {routeData.afternoonPickup.startTime} -{" "}
                    {routeData.afternoonPickup.endTime}
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 mr-2">
                    Upcoming
                  </span>
                  <button className="text-teal-600 hover:text-teal-800">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  </button>
                </div>
              </div>

              {(expandedRoute === "afternoon" ||
                (viewMode === "split" && activeRoute === "afternoon")) && (
                <div className="p-6">
                  <div className="relative pb-12">
                    {routeData.afternoonPickup.stops.map((stop, index) => (
                      <div
                        key={stop.id}
                        className="relative flex items-start group"
                      >
                        <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full mt-3 ml-3">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          </div>
                        </div>

                        {index < routeData.afternoonPickup.stops.length - 1 && (
                          <div className="absolute left-6 top-6 bottom-0 w-px bg-gray-200"></div>
                        )}

                        <div className="ml-4 min-w-0 flex-1 py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {stop.name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {stop.address}
                              </p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <span className="text-sm font-medium text-gray-900">
                                {stop.time}
                              </span>
                            </div>
                          </div>
                          {index === 0 ? (
                            <div className="mt-1 flex items-center">
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                School pickup
                              </span>
                            </div>
                          ) : (
                            <div className="mt-1 flex items-center">
                              <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                                {stop.students} students
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map section */}
        {(viewMode === "split" || viewMode === "map") && (
          <div
            className={`${
              viewMode === "split" ? "md:w-1/2" : "w-full"
            } bg-white rounded-lg border border-gray-200 shadow-sm`}
          >
            <div className="px-6 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-800">
                Route Map{" "}
                {activeRoute === "morning" ? "(Morning)" : "(Afternoon)"}
              </h3>
            </div>

            {/* Map content with mutually exclusive rendering */}
            {renderMapContent()}

            {/* Map controls - show only when the map is in success state */}
            {mapStatus === "success" && (
              <div className="px-6 py-3 border-t border-gray-200 flex justify-between">
                <div>
                  <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">
                    Show All Stops
                  </button>
                </div>
                <div>
                  <button
                    className="px-3 py-1.5 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm"
                    onClick={toggleLocationTracking}
                  >
                    {isLocationTracking
                      ? "Stop Real-time Tracking"
                      : "Start Real-time Tracking"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRoutes;
