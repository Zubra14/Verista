// src/components/dashboard/dashboard-modules/MapFallbackComponent.jsx
import React from "react";
import { toast } from "react-toastify";
import locationFallback from "../../../utils/locationFallback";

/**
 * Fallback component to display when map initialization fails
 */
const MapFallbackComponent = ({
  stops = [],
  activeStopIndex = 0,
  onRetry = () => {},
  isRetrying = false,
}) => {
  // If no stops are provided, generate mock stops
  const displayStops =
    stops && stops.length > 0 ? stops : locationFallback.generateMockStops();

  // Determine status color for visual indicators
  const getStatusColor = (status, index) => {
    if (status === "completed") return "#34D399"; // Green
    if (status === "active" || index === activeStopIndex) return "#3B82F6"; // Blue for active
    return "#9CA3AF"; // Gray for upcoming
  };

  // Handle retry attempt
  const handleRetry = () => {
    toast.info("Retrying map initialization...");
    onRetry();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">Route Details</h3>
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="px-4 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isRetrying ? "Retrying..." : "Retry Map"}
        </button>
      </div>

      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          <p className="font-medium">Map Display Unavailable</p>
          <p>Using simplified route view due to initialization issues.</p>
        </div>

        <div className="relative mt-6">
          {/* Route timeline visualization */}
          <div className="absolute top-0 bottom-0 left-8 w-0.5 bg-gray-200"></div>

          {displayStops.map((stop, index) => (
            <div key={index} className="relative mb-8 pl-12">
              {/* Status indicator */}
              <div
                className="absolute left-6 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white"
                style={{
                  backgroundColor: getStatusColor(stop.status, index),
                  boxShadow: "0 0 0 4px rgba(229, 231, 235, 0.5)",
                }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                  {index + 1}
                </span>
              </div>

              {/* Stop info */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex justify-between">
                  <h4 className="font-medium text-gray-900">{stop.name}</h4>
                  <span className="text-sm font-medium">{stop.time}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{stop.address}</p>

                {/* Status and students */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {stop.status && (
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
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
                    <span className="px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-800 rounded-full">
                      {stop.students} students
                    </span>
                  )}

                  {stop.isDestination && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      Final destination
                    </span>
                  )}
                </div>

                {/* Action buttons for active stop */}
                {stop.status === "active" && (
                  <div className="mt-3">
                    <button className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700">
                      Mark as Completed
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapFallbackComponent;
