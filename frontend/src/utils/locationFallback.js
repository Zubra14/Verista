// src/utils/locationFallback.js
/**
 * Provides reliable fallback location data for development and error scenarios
 */

// Default center (Johannesburg)
const DEFAULT_CENTER = { lat: -26.2041, lng: 28.0473 };

// Cache for simulated movement
let cachedLocations = {};

/**
 * Generate a valid location point near the specified coordinates
 * @param {Object} baseLocation - Base location to generate movement around
 * @param {string} vehicleId - Vehicle ID for tracking specific vehicles
 * @returns {Object} Location data with coordinates, timestamp and speed
 */
export const generateLocation = (baseLocation, vehicleId) => {
  // Use stored location or default
  const lastLocation = cachedLocations[vehicleId] || {
    latitude: baseLocation?.latitude || DEFAULT_CENTER.lat,
    longitude: baseLocation?.longitude || DEFAULT_CENTER.lng,
    timestamp: new Date().toISOString(),
    speed: Math.floor(Math.random() * 50) + 10,
  };

  // Create small random movement
  const newLocation = {
    latitude: lastLocation.latitude + (Math.random() - 0.5) * 0.001,
    longitude: lastLocation.longitude + (Math.random() - 0.5) * 0.001,
    timestamp: new Date().toISOString(),
    speed: Math.max(
      5,
      Math.min(80, lastLocation.speed + (Math.random() - 0.5) * 5)
    ),
  };

  // Store for next time
  cachedLocations[vehicleId] = newLocation;

  return newLocation;
};

/**
 * Generate a complete mock trip with route info
 * @param {string} routeId - Route identifier
 * @param {string} vehicleId - Vehicle identifier
 * @returns {Object} Mock trip data structure
 */
export const generateMockTrip = (routeId, vehicleId) => {
  return {
    id: `demo-trip-${routeId || Date.now()}`,
    status: "in_progress",
    start_time: new Date(Date.now() - 15 * 60000).toISOString(),
    estimated_arrival: new Date(Date.now() + 15 * 60000).toISOString(),
    route: {
      id: routeId || "demo-route",
      name:
        routeId === "Northern Suburbs Route"
          ? "Northern Suburbs Route"
          : "Demo Route",
    },
    vehicle: {
      id: vehicleId || "demo-vehicle",
      registration: "JHB-452-GP",
      current_location: null,
    },
    driver: {
      id: "demo-driver",
      name: "Thabo Mabaso",
      phone: "060-123-4567",
    },
    tracking_data: {
      last_location: {
        coordinates: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
        timestamp: new Date().toISOString(),
      },
      speed: 35,
    },
  };
};

/**
 * Generate mock stops for route visualization
 * @param {string} routeName - Name of the route
 * @returns {Array} Array of stop objects with coordinates
 */
export const generateMockStops = (routeName) => {
  // Base coordinates (Johannesburg)
  const baseCoords = DEFAULT_CENTER;

  // Create simulated stops in a rough circle around the base point
  const stops = [
    {
      id: 1,
      name: "Khanya Residence",
      address: "12 Mbeki Street, Soweto",
      time: "07:05 AM",
      status: "completed",
      students: 3,
      coordinates: {
        lat: baseCoords.lat - 0.01,
        lng: baseCoords.lng - 0.015,
      },
    },
    {
      id: 2,
      name: "Thabo Heights",
      address: "45 Sisulu Avenue, Soweto",
      time: "07:15 AM",
      status: "completed",
      students: 2,
      coordinates: {
        lat: baseCoords.lat - 0.005,
        lng: baseCoords.lng - 0.008,
      },
    },
    {
      id: 3,
      name: "Mandela Gardens",
      address: "78 Freedom Road, Soweto",
      time: "07:25 AM",
      status: "active",
      students: 4,
      coordinates: {
        lat: baseCoords.lat + 0.005,
        lng: baseCoords.lng - 0.004,
      },
    },
    {
      id: 4,
      name: "Unity Complex",
      address: "23 Horizon Drive, Johannesburg",
      time: "07:35 AM",
      status: "pending",
      students: 3,
      coordinates: {
        lat: baseCoords.lat + 0.01,
        lng: baseCoords.lng + 0.006,
      },
    },
    {
      id: 5,
      name: "Mzamomhle Primary School",
      time: "07:45 AM",
      address: "56 Education Road, Johannesburg",
      isDestination: true,
      coordinates: {
        lat: baseCoords.lat + 0.015,
        lng: baseCoords.lng + 0.015,
      },
    },
  ];

  return stops;
};

/**
 * Handle cases where the maps API key is invalid or unavailable
 * @returns {Object} Status of maps availability
 */
export const checkMapsAvailability = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapsLoaded = window.google && window.google.maps;

  return {
    apiKeyConfigured: !!apiKey && apiKey !== "your-api-key-here",
    mapsLoaded,
    useFallback: !apiKey || apiKey === "your-api-key-here" || !mapsLoaded,
  };
};

/**
 * Get the most appropriate fallback mode based on current state
 * @param {Object} options - Current state information
 * @returns {string} - The appropriate fallback mode
 */
export const getFallbackMode = ({ error, networkOffline, apiKeyMissing }) => {
  if (networkOffline) return "offline";
  if (apiKeyMissing) return "no-api-key";
  if (error) return "error";
  return "loading";
};

export default {
  generateLocation,
  generateMockTrip,
  generateMockStops,
  checkMapsAvailability,
  getFallbackMode,
  DEFAULT_CENTER,
};
