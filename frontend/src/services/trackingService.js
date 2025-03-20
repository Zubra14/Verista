// src/services/trackingService.js
import supabase, {
  connectionState,
  handleSupabaseError,
} from "../lib/supabase";
import { toast } from "react-toastify";
import offlineManager from "../utils/enhancedOfflineManager";

// Error message constants
const ERROR_MESSAGES = {
  LOCATION_FETCH: "Unable to retrieve location data",
  TRIP_FETCH: "Error loading trip details",
  LOCATION_UPDATE: "Failed to update location data",
  GENERAL: "An error occurred with the tracking service",
  POLICY_ERROR:
    "Data access permission issue - please contact support if this persists",
  OFFLINE: "You are offline. Using cached data.",
};

/**
 * Enhanced tracking service with improved error handling and offline support
 */
const trackingService = {
  /**
   * Parse PostGIS POINT format into coordinates
   * @param {string} pointString - PostGIS POINT string (e.g. "POINT(lng lat)")
   * @returns {Object|null} - Coordinates object or null if invalid
   */
  parsePostgisPoint: (pointString) => {
    if (!pointString) return null;

    try {
      // Handle both formats: POINT(lng lat) and plain text
      const pointMatch = pointString.match(/POINT\(([^ ]+) ([^)]+)\)/);

      if (pointMatch) {
        return {
          longitude: parseFloat(pointMatch[1]),
          latitude: parseFloat(pointMatch[2]),
        };
      }

      // Try to parse as plain coordinates
      const parts = pointString.split(",").map((p) => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return {
          longitude: parts[0],
          latitude: parts[1],
        };
      }

      return null;
    } catch (err) {
      console.warn("Error parsing PostGIS point:", err);
      return null;
    }
  },

  /**
   * Format coordinates as a PostGIS POINT
   * @param {number} longitude - Longitude
   * @param {number} latitude - Latitude
   * @returns {string} - Formatted PostGIS POINT
   */
  formatAsPostgisPoint: (longitude, latitude) => {
    return `POINT(${longitude} ${latitude})`;
  },

  /**
   * Get vehicle location with enhanced error handling and offline support
   * @param {string} vehicleId - The vehicle ID to fetch location for
   * @param {Object} options - Optional settings
   * @returns {Promise<Object>} - Location data with metadata
   */
  getVehicleLocation: async (vehicleId, options = {}) => {
    if (!vehicleId) {
      console.warn("Vehicle ID is required");
      return { data: null, error: "missing_id", source: "validation" };
    }

    const cacheKey = `vehicle_location_${vehicleId}`;

    // Check if we're offline first
    if (!navigator.onLine || !connectionState.isConnected()) {
      // Try to get from cache
      const cachedData = await offlineManager.getFromIndexedDB(
        "locations",
        cacheKey
      );

      if (cachedData) {
        console.log("Using cached vehicle location");
        return {
          data: cachedData,
          error: null,
          source: "cache",
          isOffline: true,
        };
      }

      if (options.allowMock) {
        // Generate mock location if allowed and nothing in cache
        return {
          data: offlineManager.generateLocation(null, vehicleId),
          error: null,
          source: "mock",
          isOffline: true,
          isMock: true,
        };
      }

      return {
        data: null,
        error: ERROR_MESSAGES.OFFLINE,
        source: "offline",
      };
    }

    try {
      // Try using the RPC function first - most reliable approach
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "get_vehicle_location",
          { vehicle_id: vehicleId }
        );

        if (!rpcError && rpcData && rpcData.length > 0) {
          // Format the location data
          const locationData = {
            latitude: rpcData[0].latitude,
            longitude: rpcData[0].longitude,
            speed: rpcData[0].speed || 0,
            timestamp: rpcData[0].updated_at,
          };

          // Cache result for offline use
          await offlineManager.saveToIndexedDB("locations", {
            id: cacheKey,
            ...locationData,
            vehicleId,
            fetchedAt: new Date().toISOString(),
          });

          return { data: locationData, error: null, source: "rpc" };
        }

        if (rpcError) {
          console.warn(
            "RPC location fetch failed, trying direct query:",
            rpcError
          );
        }
      } catch (rpcErr) {
        console.warn("Error in RPC location fetch:", rpcErr);
      }

      // Try direct query as fallback
      const { data: vehicleData, error: vehicleError } = await supabase
        .from("vehicles")
        .select("current_location, speed, location_updated_at")
        .eq("id", vehicleId)
        .single();

      if (vehicleError) {
        // Check for specific error types
        if (vehicleError.code === "PGRST116") {
          // Not found
          return { data: null, error: "not_found", source: "query" };
        }

        if (vehicleError.code === "42501" || vehicleError.code === "PGRST109") {
          console.warn("Permission error, trying with view query");

          // Try with a view that might have different permissions
          const { data: viewData, error: viewError } = await supabase
            .from("route_vehicles")
            .select(
              "registration, current_location, speed, location_updated_at"
            )
            .eq("vehicle_id", vehicleId)
            .maybeSingle();

          if (!viewError && viewData?.current_location) {
            const coords = trackingService.parsePostgisPoint(
              viewData.current_location
            );
            if (coords) {
              const locationData = {
                ...coords,
                speed: viewData.speed || 0,
                timestamp: viewData.location_updated_at,
              };

              // Cache for offline use
              await offlineManager.saveToIndexedDB("locations", {
                id: cacheKey,
                ...locationData,
                vehicleId,
                fetchedAt: new Date().toISOString(),
              });

              return { data: locationData, error: null, source: "view" };
            }
          }
        }

        throw vehicleError;
      }

      if (!vehicleData || !vehicleData.current_location) {
        return { data: null, error: "no_location", source: "query" };
      }

      // Parse location from PostGIS format
      const coords = trackingService.parsePostgisPoint(
        vehicleData.current_location
      );
      if (!coords) {
        return { data: null, error: "invalid_format", source: "query" };
      }

      const locationData = {
        ...coords,
        speed: vehicleData.speed || 0,
        timestamp: vehicleData.location_updated_at,
      };

      // Cache for offline use
      await offlineManager.saveToIndexedDB("locations", {
        id: cacheKey,
        ...locationData,
        vehicleId,
        fetchedAt: new Date().toISOString(),
      });

      return { data: locationData, error: null, source: "query" };
    } catch (error) {
      // Enhanced error classification
      let errorType = "unknown";
      let errorMessage = ERROR_MESSAGES.LOCATION_FETCH;

      if (error.code) {
        switch (error.code) {
          case "42501":
          case "PGRST109":
            errorType = "permission";
            errorMessage = ERROR_MESSAGES.POLICY_ERROR;
            break;
          case "PGRST116":
            errorType = "not_found";
            errorMessage = "Vehicle not found";
            break;
          case "PGRST104":
            errorType = "invalid_input";
            errorMessage = "Invalid vehicle ID";
            break;
          case "22P02":
            errorType = "invalid_uuid";
            errorMessage = "Invalid vehicle identifier";
            break;
          default:
            // Use general error message
            break;
        }
      } else if (error instanceof TypeError) {
        errorType = "network";
        errorMessage = "Network connection issue";
      }

      console.error(`Error fetching vehicle location (${errorType}):`, error);

      // Check if we have cached data to fall back to
      const cachedData = await offlineManager.getFromIndexedDB(
        "locations",
        cacheKey
      );

      if (cachedData) {
        return {
          data: cachedData,
          error: errorMessage,
          source: "cache",
          fallback: true,
          errorType,
        };
      }

      // Generate mock data as last resort if allowed
      if (options.allowMock) {
        return {
          data: offlineManager.generateLocation(null, vehicleId),
          error: errorMessage,
          source: "mock",
          fallback: true,
          errorType,
          isMock: true,
        };
      }

      return { data: null, error: errorMessage, errorType, source: "error" };
    }
  },

  /**
   * Get active trip data with comprehensive error handling
   * @param {string} tripId - The trip ID to fetch
   * @param {Object} options - Optional settings
   * @returns {Promise<Object>} - Trip data with metadata
   */
  getTripDetails: async (tripId, options = {}) => {
    if (!tripId) {
      console.warn("Trip ID is required");
      return { data: null, error: "missing_id", source: "validation" };
    }

    const cacheKey = `trip_details_${tripId}`;

    // Check if we're offline first
    if (!navigator.onLine || !connectionState.isConnected()) {
      // Try to get from cache
      const cachedData = await offlineManager.getFromIndexedDB(
        "trips",
        cacheKey
      );

      if (cachedData) {
        console.log("Using cached trip data");
        return {
          data: cachedData,
          error: null,
          source: "cache",
          isOffline: true,
        };
      }

      if (options.allowMock) {
        return {
          data: offlineManager.generateMockTrip(options.routeId || "default"),
          error: null,
          source: "mock",
          isOffline: true,
          isMock: true,
        };
      }

      return {
        data: null,
        error: ERROR_MESSAGES.OFFLINE,
        source: "offline",
      };
    }

    try {
      // Try using the RPC function first
      try {
        const { data: tripsData, error: tripsError } = await supabase.rpc(
          "get_active_trips_with_route_info"
        );

        if (!tripsError && tripsData && tripsData.length > 0) {
          // Find matching trip
          const matchingTrip = tripsData.find((t) => t.trip_id === tripId);

          if (matchingTrip) {
            // Transform into expected format
            const tripData = {
              id: matchingTrip.trip_id,
              status: matchingTrip.status,
              start_time: matchingTrip.start_time,
              estimated_arrival: matchingTrip.estimated_arrival,
              route: {
                id: matchingTrip.route_id,
                name: matchingTrip.route_name,
              },
              vehicle: {
                id: matchingTrip.vehicle_id,
                registration: matchingTrip.vehicle_registration,
                current_location: matchingTrip.current_location,
                speed: matchingTrip.speed,
                location_updated_at: matchingTrip.location_updated_at,
              },
              driver: {
                id: matchingTrip.driver_id,
                name: matchingTrip.driver_name,
              },
              tracking_data: matchingTrip.tracking_data || {},
            };

            // Cache for offline use
            await offlineManager.saveToIndexedDB("trips", {
              id: cacheKey,
              ...tripData,
              fetchedAt: new Date().toISOString(),
            });

            return { data: tripData, error: null, source: "rpc" };
          }
        }

        if (tripsError) {
          console.warn(
            "RPC trips fetch failed, trying direct query:",
            tripsError
          );
        }
      } catch (rpcErr) {
        console.warn("Error in RPC trips fetch:", rpcErr);
      }

      // Direct query as fallback
      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .select(
          `
          id,
          status,
          start_time,
          estimated_arrival,
          tracking_data,
          route_id,
          vehicle_id,
          driver_id
        `
        )
        .eq("id", tripId)
        .single();

      if (tripError) {
        throw tripError;
      }

      // Fetch related data
      const [routeResult, vehicleResult, driverResult] = await Promise.all([
        supabase
          .from("routes")
          .select("id, name")
          .eq("id", tripData.route_id)
          .single(),
        supabase
          .from("vehicles")
          .select(
            "id, registration, current_location, speed, location_updated_at"
          )
          .eq("id", tripData.vehicle_id)
          .single(),
        supabase
          .from("profiles")
          .select("id, name, phone")
          .eq("id", tripData.driver_id)
          .single(),
      ]);

      // Combine all data
      const combinedData = {
        ...tripData,
        route: routeResult.error
          ? { id: tripData.route_id, name: "Unknown Route" }
          : routeResult.data,
        vehicle: vehicleResult.error
          ? { id: tripData.vehicle_id, registration: "Unknown Vehicle" }
          : vehicleResult.data,
        driver: driverResult.error
          ? { id: tripData.driver_id, name: "Unknown Driver" }
          : driverResult.data,
      };

      // Cache for offline use
      await offlineManager.saveToIndexedDB("trips", {
        id: cacheKey,
        ...combinedData,
        fetchedAt: new Date().toISOString(),
      });

      return { data: combinedData, error: null, source: "query" };
    } catch (error) {
      // Enhanced error handling
      let errorType = "unknown";
      let errorMessage = ERROR_MESSAGES.TRIP_FETCH;

      if (error.code) {
        switch (error.code) {
          case "42501":
          case "PGRST109":
            errorType = "permission";
            errorMessage = ERROR_MESSAGES.POLICY_ERROR;
            break;
          case "PGRST116":
            errorType = "not_found";
            errorMessage = "Trip not found";
            break;
          default:
            // Use general error message
            break;
        }
      } else if (error instanceof TypeError) {
        errorType = "network";
        errorMessage = "Network connection issue";
      }

      console.error(`Error fetching trip data (${errorType}):`, error);

      // Check for cached data
      const cachedData = await offlineManager.getFromIndexedDB(
        "trips",
        cacheKey
      );

      if (cachedData) {
        return {
          data: cachedData,
          error: errorMessage,
          source: "cache",
          fallback: true,
          errorType,
        };
      }

      // Generate mock data as last resort if allowed
      if (options.allowMock) {
        return {
          data: offlineManager.generateMockTrip(options.routeId || "default"),
          error: errorMessage,
          source: "mock",
          fallback: true,
          errorType,
          isMock: true,
        };
      }

      return { data: null, error: errorMessage, errorType, source: "error" };
    }
  },

  /**
   * Get current trip for a child with improved reliability
   * @param {string} childId - The child ID
   * @param {Object} options - Optional settings
   * @returns {Promise<Object>} - Trip data with location
   */
  getChildCurrentTrip: async (childId, options = {}) => {
    if (!childId) {
      console.warn("Child ID is required");
      return { data: null, error: "missing_id", source: "validation" };
    }

    const cacheKey = `child_trip_${childId}`;

    // Check if offline
    if (!navigator.onLine || !connectionState.isConnected()) {
      // Try to get from cache
      const cachedData = await offlineManager.getFromIndexedDB(
        "trips",
        cacheKey
      );

      if (cachedData) {
        return {
          data: cachedData,
          error: null,
          source: "cache",
          isOffline: true,
        };
      }

      if (options.allowMock) {
        return {
          data: offlineManager.getStudentTrackingFallback(childId),
          error: null,
          source: "mock",
          isOffline: true,
          isMock: true,
        };
      }

      return {
        data: null,
        error: ERROR_MESSAGES.OFFLINE,
        source: "offline",
      };
    }

    try {
      // First get the child's current trip ID
      const { data: childData, error: childError } = await supabase
        .from("students")
        .select("current_trip_id, first_name, last_name")
        .eq("id", childId)
        .single();

      if (childError) throw childError;

      if (!childData || !childData.current_trip_id) {
        return {
          data: null,
          error: "no_active_trip",
          message: `No active trip found for ${
            childData?.first_name || "this child"
          }`,
          source: "query",
        };
      }

      // Get trip details using the dedicated function
      const tripResult = await trackingService.getTripDetails(
        childData.current_trip_id,
        { allowMock: options.allowMock, routeId: childData.route_id }
      );

      // If successful, add child info and cache
      if (tripResult.data) {
        tripResult.data.student = {
          id: childId,
          name: `${childData.first_name} ${childData.last_name}`.trim(),
          first_name: childData.first_name,
          last_name: childData.last_name,
        };

        // Cache for offline use
        await offlineManager.saveToIndexedDB("trips", {
          id: cacheKey,
          ...tripResult.data,
          fetchedAt: new Date().toISOString(),
        });
      }

      return tripResult;
    } catch (error) {
      // Enhanced error handling
      let errorType = "unknown";
      let errorMessage = ERROR_MESSAGES.TRIP_FETCH;

      if (error.code) {
        switch (error.code) {
          case "42501":
          case "PGRST109":
            errorType = "permission";
            errorMessage = ERROR_MESSAGES.POLICY_ERROR;
            break;
          case "PGRST116":
            errorType = "not_found";
            errorMessage = "Child not found";
            break;
          default:
            // Use general error message
            break;
        }
      } else if (error instanceof TypeError) {
        errorType = "network";
        errorMessage = "Network connection issue";
      }

      console.error(`Error fetching child trip (${errorType}):`, error);

      // Check for cached data
      const cachedData = await offlineManager.getFromIndexedDB(
        "trips",
        cacheKey
      );

      if (cachedData) {
        return {
          data: cachedData,
          error: errorMessage,
          source: "cache",
          fallback: true,
          errorType,
        };
      }

      // Generate mock data as last resort if allowed
      if (options.allowMock) {
        return {
          data: offlineManager.getStudentTrackingFallback(childId),
          error: errorMessage,
          source: "mock",
          fallback: true,
          errorType,
          isMock: true,
        };
      }

      return { data: null, error: errorMessage, errorType, source: "error" };
    }
  },

  /**
   * Update vehicle location using the most reliable method available
   * @param {string} vehicleId - The vehicle ID
   * @param {Object} location - Location data {latitude, longitude, speed}
   * @param {string} tripId - Optional trip ID to also update trip tracking data
   * @returns {Promise<Object>} - Result with success status and metadata
   */
  updateVehicleLocation: async (vehicleId, location, tripId = null) => {
    if (
      !vehicleId ||
      !location ||
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number"
    ) {
      console.warn("Vehicle ID and valid location are required");
      return { success: false, error: "invalid_input", source: "validation" };
    }

    // If offline, queue operation for later sync
    if (!navigator.onLine || !connectionState.isConnected()) {
      await offlineManager.recordPendingOperation({
        table: "vehicles",
        action: "locationUpdate",
        vehicleId,
        location: { ...location, timestamp: new Date().toISOString() },
        tripId,
      });

      return {
        success: true,
        queued: true,
        message: "Location update queued for sync",
        source: "offline",
      };
    }

    try {
      // Try using the RPC function first (most reliable)
      try {
        const { data, error } = await supabase.rpc("update_vehicle_location", {
          v_id: vehicleId,
          lng: location.longitude,
          lat: location.latitude,
          spd: location.speed || 0,
        });

        if (!error) {
          console.log("Successfully updated location via RPC");

          // Update trip tracking data in background if tripId provided
          if (tripId) {
            updateTripTrackingData(tripId, location).catch((err) => {
              console.warn(
                "Non-critical error updating trip tracking data:",
                err
              );
            });
          }

          return { success: true, source: "rpc" };
        }

        console.warn(
          "RPC location update failed, trying direct update:",
          error
        );
      } catch (rpcErr) {
        console.warn("Error in RPC location update:", rpcErr);
      }

      // Direct update as fallback
      const pointLocation = trackingService.formatAsPostgisPoint(
        location.longitude,
        location.latitude
      );

      const { error: updateError } = await supabase
        .from("vehicles")
        .update({
          current_location: pointLocation,
          speed: location.speed || 0,
          location_updated_at: new Date().toISOString(),
        })
        .eq("id", vehicleId);

      if (updateError) {
        throw updateError;
      }

      // Update trip tracking data in background if tripId provided
      if (tripId) {
        updateTripTrackingData(tripId, location).catch((err) => {
          console.warn("Non-critical error updating trip tracking data:", err);
        });
      }

      return { success: true, source: "query" };
    } catch (error) {
      // Enhanced error handling
      let errorType = "unknown";
      let errorMessage = ERROR_MESSAGES.LOCATION_UPDATE;

      if (error.code) {
        switch (error.code) {
          case "42501":
          case "PGRST109":
            errorType = "permission";
            errorMessage = ERROR_MESSAGES.POLICY_ERROR;
            break;
          case "23503":
            errorType = "foreign_key";
            errorMessage = "Vehicle record not found";
            break;
          default:
            // Use general error message
            break;
        }
      } else if (error instanceof TypeError) {
        errorType = "network";
        errorMessage = "Network connection issue";
      }

      console.error(`Error updating vehicle location (${errorType}):`, error);

      // Queue for later sync
      await offlineManager.recordPendingOperation({
        table: "vehicles",
        action: "locationUpdate",
        vehicleId,
        location: { ...location, timestamp: new Date().toISOString() },
        tripId,
        error: errorMessage,
        errorType,
      });

      return {
        success: false,
        queued: true,
        error: errorMessage,
        errorType,
        source: "error",
      };
    }
  },

  /**
   * Get all active trips with comprehensive error handling
   * @returns {Promise<Object>} - List of active trips with metadata
   */
  getAllActiveTrips: async () => {
    try {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("status", "active");

      if (error) {
        throw error;
      }

      return { data, error: null, source: "query" };
    } catch (error) {
      console.error("Error fetching all active trips:", error);
      return { data: null, error: error.message, source: "error" };
    }
  },
};

/**
 * Helper function to update trip tracking data
 * @param {string} tripId - Trip ID
 * @param {Object} location - Location data
 * @returns {Promise<Object>} - Result
 */
async function updateTripTrackingData(tripId, location) {
  try {
    // Get current tracking data
    const { data: tripData, error: tripError } = await supabase
      .from("trips")
      .select("tracking_data")
      .eq("id", tripId)
      .single();

    if (tripError) {
      throw tripError;
    }

    // Create or update tracking data
    const trackingData = tripData.tracking_data || {
      path: [],
      last_location: null,
    };

    // Add to path (if path doesn't exist, create it)
    if (!trackingData.path) trackingData.path = [];

    const timestamp = new Date().toISOString();

    // Add point to path
    trackingData.path.push({
      coordinates: [location.longitude, location.latitude],
      timestamp,
      speed: location.speed || 0,
    });

    // Keep path at a reasonable size (last 100 points)
    if (trackingData.path.length > 100) {
      trackingData.path = trackingData.path.slice(-100);
    }

    // Update last_location
    trackingData.last_location = {
      coordinates: [location.longitude, location.latitude],
      timestamp,
    };

    // Store speed
    trackingData.speed = location.speed || 0;

    // Update trip tracking data
    const { error: updateError } = await supabase
      .from("trips")
      .update({ tracking_data: trackingData })
      .eq("id", tripId);

    if (updateError) {
      throw updateError;
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating trip tracking data:", error);
    return { success: false, error };
  }
}

export default trackingService;
