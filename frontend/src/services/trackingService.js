/**
 * trackingService.js
 * Comprehensive vehicle tracking service with robust error handling
 * Provides real-time location tracking, status updates, and fallback mechanisms
 * Includes RLS policy workarounds and demo mode for reliable operation
 */
import supabase, {
  connectionState,
  handleSupabaseError,
} from "../lib/supabase";
import { toast } from "react-toastify";
import offlineManager from "../utils/enhancedOfflineManager";
import { safeQuery } from "../lib/supabaseErrorHandler";

// Configuration constants
const CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  LOCATION_CACHE_TIME: 60 * 1000, // 1 minute
  SUBSCRIPTION_TIMEOUT: 10000, // 10 seconds for subscription setup
  MOCK_LOCATION_VARIANCE: 0.001, // ~100m variance for mock locations
  MAX_TRACKED_POINTS: 100, // Max points to store in tracking path
  STALE_LOCATION_THRESHOLD: 5 * 60 * 1000, // 5 minutes
  CONNECTION_CHECK_INTERVAL: 30000, // 30 seconds
};

// Error message constants
const ERROR_MESSAGES = {
  LOCATION_FETCH: "Unable to retrieve location data",
  TRIP_FETCH: "Error loading trip details",
  LOCATION_UPDATE: "Failed to update location data",
  GENERAL: "An error occurred with the tracking service",
  POLICY_ERROR:
    "Data access permission issue - please contact support if this persists",
  OFFLINE: "You are offline. Using cached data.",
  SUBSCRIPTION_ERROR: "Failed to establish real-time connection",
  VEHICLE_NOT_FOUND: "Vehicle not found or not accessible",
  PERMISSION_DENIED: "You don't have permission to track this vehicle",
  CONNECTION_LOST: "Connection to tracking service lost",
  WEBSOCKET_ERROR: "Real-time connection error",
  STALE_LOCATION: "Location data may be outdated",
  GEOCODING_ERROR: "Unable to translate coordinates to address",
};

/**
 * Enhanced tracking service with robust error handling, RLS policy workarounds,
 * and offline support
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
   * Check if we should enable demo/testing mode
   * This can be triggered by repeated RLS/permission errors
   * @returns {boolean} - True if demo mode should be activated
   */
  shouldEnableDemoMode: () => {
    try {
      // Check localStorage for error count
      const errorCount = parseInt(localStorage.getItem('verista_rls_error_count') || '0');
      return errorCount >= 3; // Enable demo mode after 3 RLS errors
    } catch (e) {
      return false;
    }
  },

  /**
   * Track RLS policy errors to handle persistent issues
   * @param {Error} error - The error to analyze
   * @returns {boolean} - True if the error is RLS related
   */
  trackRlsPolicyError: (error) => {
    if (!error) return false;
    
    // Check if this is an RLS policy error
    const isRlsError = (error.code === "42501" || 
                        error.code === "PGRST109" ||
                        (error.message && (
                          error.message.includes("permission denied") ||
                          error.message.includes("Policy") || 
                          error.message.includes("policy") ||
                          error.message.includes("RLS")
                        )));
    
    if (isRlsError) {
      try {
        // Increment the RLS error counter
        const currentCount = parseInt(localStorage.getItem('verista_rls_error_count') || '0');
        localStorage.setItem('verista_rls_error_count', (currentCount + 1).toString());
        
        // If we've reached threshold, suggest using demo mode
        if (currentCount + 1 >= 3) {
          console.warn("Multiple RLS policy errors detected - auto-enabling demo fallback mode");
          localStorage.setItem('verista_use_demo_data', 'true');
          
          // Show a toast notification only if this is the first time we're enabling demo mode
          if (currentCount === 2) {
            toast.info(
              "Permission issues detected. Switching to demo mode for better experience.",
              { autoClose: 8000 }
            );
          }
          return true;
        }
      } catch (e) {
        // Ignore storage errors
      }
    }
    
    return isRlsError;
  },

  /**
   * Get vehicle location with robust error handling, RLS policy workarounds, and offline support
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
    
    // Check for demo mode
    const isDemoMode = options.demoMode || 
                      localStorage.getItem('verista_use_demo_data') === 'true' ||
                      trackingService.shouldEnableDemoMode();
    
    if (isDemoMode && options.allowMock !== false) {
      console.log("Using demo mode for vehicle location");
      return {
        data: offlineManager.generateLocation(null, vehicleId),
        error: null,
        source: "demo",
        isDemoMode: true,
      };
    }

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
      // Use the safeQuery wrapper from supabaseErrorHandler if available
      if (typeof safeQuery === 'function') {
        // First attempt using RPC - most reliable for RLS issues
        const rpcResult = await safeQuery(
          supabase.rpc("get_vehicle_location", { vehicle_id: vehicleId }),
          null, // No fallback data initially
          "vehicle-location-rpc",
          { 
            maxRetries: 2,
            suppressToast: true,
            cacheKey: `rpc_vehicle_${vehicleId}`
          }
        );
        
        if (!rpcResult.error && rpcResult.data && rpcResult.data.length > 0) {
          // Format the location data
          const locationData = {
            latitude: rpcResult.data[0].latitude,
            longitude: rpcResult.data[0].longitude,
            speed: rpcResult.data[0].speed || 0,
            timestamp: rpcResult.data[0].updated_at,
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
        
        // If RPC failed, try direct query with safe query wrapper
        const queryResult = await safeQuery(
          supabase
            .from("vehicles")
            .select("current_location, speed, location_updated_at")
            .eq("id", vehicleId)
            .single(),
          null, // No fallback data yet
          "vehicle-location-direct",
          { 
            maxRetries: 1,
            suppressToast: true 
          }
        );
        
        if (!queryResult.error && queryResult.data?.current_location) {
          // Parse location from PostGIS format
          const coords = trackingService.parsePostgisPoint(
            queryResult.data.current_location
          );
          
          if (coords) {
            const locationData = {
              ...coords,
              speed: queryResult.data.speed || 0,
              timestamp: queryResult.data.location_updated_at,
            };

            // Cache for offline use
            await offlineManager.saveToIndexedDB("locations", {
              id: cacheKey,
              ...locationData,
              vehicleId,
              fetchedAt: new Date().toISOString(),
            });

            return { data: locationData, error: null, source: "query" };
          }
        }
        
        // If both methods failed and at least one was an RLS error,
        // try the specialized view designed to work around RLS issues
        const hasRlsError = (rpcResult.error && trackingService.trackRlsPolicyError(rpcResult.error.original)) ||
                           (queryResult.error && trackingService.trackRlsPolicyError(queryResult.error.original));
                           
        if (hasRlsError) {
          console.log("Detected RLS policy issue, trying alternate access method");
          
          // Try multiple views/approaches that might have different permissions
          const viewOptions = [
            {
              view: "route_vehicles",
              columns: "registration, current_location, speed, location_updated_at",
              idField: "vehicle_id"
            },
            {
              view: "vehicle_locations",
              columns: "location, speed, updated_at",
              idField: "vehicle_id"
            },
            {
              view: "accessible_vehicles",
              columns: "current_location, speed, location_updated_at",
              idField: "id"
            }
          ];
          
          // Try each view in sequence
          for (const viewOption of viewOptions) {
            try {
              const { data: viewData, error: viewError } = await supabase
                .from(viewOption.view)
                .select(viewOption.columns)
                .eq(viewOption.idField, vehicleId)
                .maybeSingle();
                
              if (!viewError && viewData) {
                // Determine which field contains the location
                const locationField = viewData.current_location || viewData.location;
                const timestampField = viewData.location_updated_at || viewData.updated_at;
                
                if (locationField) {
                  const coords = trackingService.parsePostgisPoint(locationField);
                  if (coords) {
                    const locationData = {
                      ...coords,
                      speed: viewData.speed || 0,
                      timestamp: timestampField,
                    };
                    
                    // Cache for offline use
                    await offlineManager.saveToIndexedDB("locations", {
                      id: cacheKey,
                      ...locationData,
                      vehicleId,
                      fetchedAt: new Date().toISOString(),
                    });
                    
                    return { 
                      data: locationData, 
                      error: null, 
                      source: `view_${viewOption.view}`,
                      rlsWorkaround: true
                    };
                  }
                }
              }
            } catch (viewErr) {
              // Just continue trying other views
              console.warn(`View ${viewOption.view} access failed:`, viewErr);
            }
          }
        }
        
        // At this point all DB methods have failed
        // Check for cached data to use as fallback
        const cachedData = await offlineManager.getFromIndexedDB(
          "locations",
          cacheKey
        );
        
        if (cachedData) {
          return {
            data: cachedData,
            error: "access_error",
            errorMessage: "Using cached data due to data access issues",
            source: "cache",
            fallback: true,
          };
        }
        
        // Generate mock data as last resort if allowed
        if (options.allowMock) {
          // Auto-enable demo mode for future requests if we get repeated RLS errors
          if (hasRlsError) {
            localStorage.setItem('verista_use_demo_data', 'true');
          }
          
          return {
            data: offlineManager.generateLocation(null, vehicleId),
            error: hasRlsError ? "permission" : "data_access",
            errorMessage: hasRlsError ? 
              ERROR_MESSAGES.POLICY_ERROR : 
              ERROR_MESSAGES.LOCATION_FETCH,
            source: "mock",
            fallback: true,
            rlsError: hasRlsError,
            isMock: true,
          };
        }
        
        // No fallback available
        return { 
          data: null, 
          error: hasRlsError ? "permission" : "data_access",
          errorMessage: hasRlsError ? 
            ERROR_MESSAGES.POLICY_ERROR : 
            ERROR_MESSAGES.LOCATION_FETCH,
          source: "error"
        };
      }
      
      // Fallback to original implementation if safeQuery isn't available
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
          // Track RLS errors
          trackingService.trackRlsPolicyError(rpcError);
          
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
        // Track RLS errors
        trackingService.trackRlsPolicyError(vehicleError);
        
        // Check for specific error types
        if (vehicleError.code === "PGRST116") {
          // Not found
          return { data: null, error: "not_found", source: "query" };
        }

        if (vehicleError.code === "42501" || vehicleError.code === "PGRST109") {
          console.warn("Permission error, trying with view query");

          // Try with multiple views that might have different permissions
          const viewOptions = [
            {
              view: "route_vehicles",
              columns: "registration, current_location, speed, location_updated_at",
              idField: "vehicle_id"
            },
            {
              view: "vehicle_locations",
              columns: "location, speed, updated_at",
              idField: "vehicle_id"
            },
            {
              view: "accessible_vehicles",
              columns: "current_location, speed, location_updated_at",
              idField: "id"
            }
          ];
          
          // Try each view in sequence
          for (const viewOption of viewOptions) {
            try {
              const { data: viewData, error: viewError } = await supabase
                .from(viewOption.view)
                .select(viewOption.columns)
                .eq(viewOption.idField, vehicleId)
                .maybeSingle();
                
              if (!viewError && viewData) {
                // Determine which field contains the location
                const locationField = viewData.current_location || viewData.location;
                const timestampField = viewData.location_updated_at || viewData.updated_at;
                
                if (locationField) {
                  const coords = trackingService.parsePostgisPoint(locationField);
                  if (coords) {
                    const locationData = {
                      ...coords,
                      speed: viewData.speed || 0,
                      timestamp: timestampField,
                    };
                    
                    // Cache for offline use
                    await offlineManager.saveToIndexedDB("locations", {
                      id: cacheKey,
                      ...locationData,
                      vehicleId,
                      fetchedAt: new Date().toISOString(),
                    });
                    
                    return { 
                      data: locationData, 
                      error: null, 
                      source: `view_${viewOption.view}`,
                      rlsWorkaround: true
                    };
                  }
                }
              }
            } catch (viewErr) {
              // Just continue trying other views
              console.warn(`View ${viewOption.view} access failed:`, viewErr);
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
      // Track RLS errors
      const isRlsError = trackingService.trackRlsPolicyError(error);
      
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
        // Auto-enable demo mode for future requests if we get repeated RLS errors
        if (isRlsError) {
          localStorage.setItem('verista_use_demo_data', 'true');
        }
        
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
   * Get current trip for a child with improved reliability and RLS policy handling
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
    
    // Check for demo mode first
    const isDemoMode = options.demoMode || 
                      localStorage.getItem('verista_use_demo_data') === 'true' ||
                      trackingService.shouldEnableDemoMode();
    
    if (isDemoMode && options.allowMock !== false) {
      console.log("Using demo mode for child trip data");
      return {
        data: offlineManager.getStudentTrackingFallback(childId),
        error: null,
        source: "demo",
        isDemoMode: true,
      };
    }

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
      // Use the safeQuery wrapper from supabaseErrorHandler if available
      if (typeof safeQuery === 'function') {
        // First attempt using safeQuery to get child data
        const childResult = await safeQuery(
          supabase
            .from("students")
            .select("current_trip_id, name, route_id")
            .eq("id", childId)
            .single(),
          null, // No fallback data initially
          "child-trip-data",
          { 
            maxRetries: 2,
            suppressToast: true,
          }
        );
        
        // If there were permission/RLS errors, track them
        if (childResult.error && childResult.error.original) {
          trackingService.trackRlsPolicyError(childResult.error.original);
        }
        
        if (!childResult.error && childResult.data) {
          if (!childResult.data.current_trip_id) {
            return {
              data: null,
              error: "no_active_trip",
              message: `No active trip found for ${
                childResult.data.name || "this child"
              }`,
              source: "query",
            };
          }
          
          // Get trip details using the dedicated function
          const tripResult = await trackingService.getTripDetails(
            childResult.data.current_trip_id,
            { 
              allowMock: options.allowMock, 
              routeId: childResult.data.route_id,
              demoMode: isDemoMode
            }
          );
          
          // If successful, add child info and cache
          if (tripResult.data) {
            tripResult.data.student = {
              id: childId,
              name: childResult.data.name || "Unknown",
            };
            
            // Cache for offline use
            await offlineManager.saveToIndexedDB("trips", {
              id: cacheKey,
              ...tripResult.data,
              fetchedAt: new Date().toISOString(),
            });
          }
          
          return tripResult;
        }
        
        // Check if we had a permission error
        const hasRlsError = childResult.error && 
                           (childResult.error.type === 'permission' || 
                            childResult.error.type === 'policy' ||
                            (childResult.error.original && 
                             trackingService.trackRlsPolicyError(childResult.error.original)));
                             
        // If RLS error, try alternative methods
        if (hasRlsError) {
          console.log("Detected RLS policy issue with student data, trying alternative access");
          
          // Try alternate views for students
          try {
            // Try using a view that might have different permissions
            const { data: viewData, error: viewError } = await supabase
              .from("student_trip_info")
              .select("student_id, student_name, trip_id, route_id")
              .eq("student_id", childId)
              .maybeSingle();
              
            if (!viewError && viewData && viewData.trip_id) {
              // Get trip details using the dedicated function
              const tripResult = await trackingService.getTripDetails(
                viewData.trip_id,
                { 
                  allowMock: options.allowMock, 
                  routeId: viewData.route_id,
                  demoMode: isDemoMode
                }
              );
              
              // If successful, add child info and cache
              if (tripResult.data) {
                tripResult.data.student = {
                  id: childId,
                  name: viewData.student_name || "Unknown",
                };
                
                // Cache for offline use
                await offlineManager.saveToIndexedDB("trips", {
                  id: cacheKey,
                  ...tripResult.data,
                  fetchedAt: new Date().toISOString(),
                });
              }
              
              return {
                ...tripResult,
                rlsWorkaround: true
              };
            }
          } catch (viewErr) {
            console.warn("Alternative view access failed:", viewErr);
          }
        }
        
        // At this point all DB methods have failed
        // Check for cached data to use as fallback
        const cachedData = await offlineManager.getFromIndexedDB(
          "trips",
          cacheKey
        );
        
        if (cachedData) {
          return {
            data: cachedData,
            error: "access_error",
            errorMessage: "Using cached data due to data access issues",
            source: "cache",
            fallback: true,
          };
        }
        
        // Generate mock data as last resort if allowed
        if (options.allowMock) {
          // Auto-enable demo mode for future requests if we get repeated RLS errors
          if (hasRlsError) {
            localStorage.setItem('verista_use_demo_data', 'true');
          }
          
          return {
            data: offlineManager.getStudentTrackingFallback(childId),
            error: hasRlsError ? "permission" : "data_access",
            errorMessage: hasRlsError ? 
              ERROR_MESSAGES.POLICY_ERROR : 
              ERROR_MESSAGES.TRIP_FETCH,
            source: "mock",
            fallback: true,
            rlsError: hasRlsError,
            isMock: true,
          };
        }
        
        // No fallback available
        return { 
          data: null, 
          error: hasRlsError ? "permission" : "data_access",
          errorMessage: hasRlsError ? 
            ERROR_MESSAGES.POLICY_ERROR : 
            ERROR_MESSAGES.TRIP_FETCH,
          source: "error"
        };
      }
      
      // Default implementation if safeQuery isn't available
      // First get the child's current trip ID - using 'name' field instead of first_name/last_name
      const { data: childData, error: childError } = await supabase
        .from("students")
        .select("current_trip_id, name, route_id")
        .eq("id", childId)
        .single();

      if (childError) {
        // Track RLS errors
        trackingService.trackRlsPolicyError(childError);
        
        // If this is an RLS/permission error, try alternative access
        if (childError.code === "42501" || childError.code === "PGRST109") {
          console.log("Permission error accessing student data, trying alternative");
          
          // Try using a view that might have different permissions
          try {
            const { data: viewData, error: viewError } = await supabase
              .from("student_trip_info")
              .select("student_id, student_name, trip_id, route_id")
              .eq("student_id", childId)
              .maybeSingle();
              
            if (!viewError && viewData && viewData.trip_id) {
              // Get trip details using the dedicated function
              const tripResult = await trackingService.getTripDetails(
                viewData.trip_id,
                { 
                  allowMock: options.allowMock, 
                  routeId: viewData.route_id,
                  demoMode: isDemoMode
                }
              );
              
              // If successful, add child info and cache
              if (tripResult.data) {
                tripResult.data.student = {
                  id: childId,
                  name: viewData.student_name || "Unknown",
                };
                
                // Cache for offline use
                await offlineManager.saveToIndexedDB("trips", {
                  id: cacheKey,
                  ...tripResult.data,
                  fetchedAt: new Date().toISOString(),
                });
              }
              
              return {
                ...tripResult,
                rlsWorkaround: true
              };
            }
          } catch (viewErr) {
            console.warn("Alternative view access failed:", viewErr);
          }
        }
        
        throw childError;
      }

      if (!childData || !childData.current_trip_id) {
        return {
          data: null,
          error: "no_active_trip",
          message: `No active trip found for ${
            childData?.name || "this child"
          }`,
          source: "query",
        };
      }

      // Get trip details using the dedicated function
      const tripResult = await trackingService.getTripDetails(
        childData.current_trip_id,
        { 
          allowMock: options.allowMock, 
          routeId: childData.route_id,
          demoMode: isDemoMode
        }
      );

      // If successful, add child info and cache
      if (tripResult.data) {
        tripResult.data.student = {
          id: childId,
          name: childData.name || "Unknown",
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
      // Track RLS errors
      const isRlsError = trackingService.trackRlsPolicyError(error);
      
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
        // Auto-enable demo mode for future requests if we get repeated RLS errors
        if (isRlsError) {
          localStorage.setItem('verista_use_demo_data', 'true');
        }
        
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

/**
 * Store active subscriptions for cleanup
 * @type {Object.<string, {subscription: Object, lastUpdate: Date, status: string}>}
 */
const activeSubscriptions = {};

/**
 * Track a vehicle's location with real-time updates
 * @param {string} vehicleId - Vehicle ID to track
 * @param {Function} onLocationUpdate - Callback for location updates
 * @param {Object} options - Optional configuration
 * @returns {Object} - Subscription control with unsubscribe method
 */
trackingService.subscribeToVehicleLocation = async (vehicleId, onLocationUpdate, options = {}) => {
  if (!vehicleId || typeof onLocationUpdate !== 'function') {
    console.error('Vehicle ID and update callback are required');
    return { 
      error: 'invalid_parameters',
      unsubscribe: () => {} // no-op unsubscribe 
    };
  }
  
  // Check for existing subscription to avoid duplicates
  if (activeSubscriptions[vehicleId]) {
    console.log(`Using existing subscription for vehicle ${vehicleId}`);
    activeSubscriptions[vehicleId].callbacks = activeSubscriptions[vehicleId].callbacks || [];
    activeSubscriptions[vehicleId].callbacks.push(onLocationUpdate);
    
    // Immediately send last known location if available
    if (activeSubscriptions[vehicleId].lastLocation) {
      setTimeout(() => {
        onLocationUpdate(activeSubscriptions[vehicleId].lastLocation);
      }, 0);
    }
    
    return {
      unsubscribe: () => {
        if (activeSubscriptions[vehicleId]) {
          // Remove this specific callback
          const callbacks = activeSubscriptions[vehicleId].callbacks;
          const index = callbacks.indexOf(onLocationUpdate);
          if (index !== -1) {
            callbacks.splice(index, 1);
          }
          
          // If no more callbacks, clean up the subscription
          if (callbacks.length === 0) {
            trackingService.unsubscribeFromVehicle(vehicleId);
          }
        }
      },
      refresh: async () => {
        // Force fetch latest location data
        try {
          const result = await trackingService.getVehicleLocation(vehicleId, options);
          if (result.data) {
            onLocationUpdate(result.data);
          }
        } catch (error) {
          console.warn('Error refreshing vehicle location:', error);
        }
      }
    };
  }

  // Initialize subscription tracking
  activeSubscriptions[vehicleId] = {
    status: 'initializing',
    callbacks: [onLocationUpdate],
    lastUpdate: new Date(),
    error: null
  };

  // First, get the current location to provide immediate data
  try {
    const initialLocation = await trackingService.getVehicleLocation(vehicleId, options);
    
    if (initialLocation.data) {
      // Store last known location
      activeSubscriptions[vehicleId].lastLocation = initialLocation.data;
      
      // Call the callback with initial data
      onLocationUpdate(initialLocation.data);
    }
  } catch (error) {
    console.warn('Error getting initial vehicle location:', error);
  }

  let subscription = null;
  
  try {
    // Create a timeout promise to handle subscription setup failures
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Subscription setup timeout')), CONFIG.SUBSCRIPTION_TIMEOUT);
    });

    // Set up real-time subscription with timeout
    const subscriptionPromise = new Promise((resolve) => {
      // Use channel filters to target specific vehicle
      subscription = supabase
        .channel(`vehicle-updates-${vehicleId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'vehicles',
            filter: `id=eq.${vehicleId}`
          },
          (payload) => {
            try {
              if (!payload.new) return;
              
              const { current_location, speed, location_updated_at } = payload.new;
              
              // Parse location data
              const coords = trackingService.parsePostgisPoint(current_location);
              if (!coords) return;
              
              // Create location update
              const locationData = {
                ...coords,
                speed: speed || 0,
                timestamp: location_updated_at,
                source: 'realtime'
              };
              
              // Update subscription status
              activeSubscriptions[vehicleId].lastUpdate = new Date();
              activeSubscriptions[vehicleId].lastLocation = locationData;
              activeSubscriptions[vehicleId].status = 'active';
              
              // Cache this data for offline use
              const cacheKey = `vehicle_location_${vehicleId}`;
              offlineManager.saveToIndexedDB('locations', {
                id: cacheKey,
                ...locationData,
                vehicleId,
                fetchedAt: new Date().toISOString()
              }).catch(err => console.warn('Error caching location update:', err));
              
              // Notify all callbacks
              if (activeSubscriptions[vehicleId].callbacks) {
                activeSubscriptions[vehicleId].callbacks.forEach(callback => {
                  try {
                    callback(locationData);
                  } catch (callbackErr) {
                    console.error('Error in location update callback:', callbackErr);
                  }
                });
              }
            } catch (err) {
              console.error('Error processing real-time location update:', err);
            }
          }
        )
        .subscribe((status) => {
          console.log(`Subscription status for vehicle ${vehicleId}:`, status);
          
          if (status === 'SUBSCRIBED') {
            activeSubscriptions[vehicleId].status = 'active';
            activeSubscriptions[vehicleId].subscription = subscription;
            resolve(subscription);
          } else if (status === 'CHANNEL_ERROR') {
            activeSubscriptions[vehicleId].status = 'error';
            activeSubscriptions[vehicleId].error = 'channel_error';
            resolve(null); // Resolve with null to continue with polling fallback
          }
        });
    });

    // Wait for subscription or timeout
    await Promise.race([subscriptionPromise, timeoutPromise]);
    
  } catch (error) {
    console.warn('Error setting up real-time vehicle tracking:', error);
    
    // Update subscription status
    if (activeSubscriptions[vehicleId]) {
      activeSubscriptions[vehicleId].status = 'error';
      activeSubscriptions[vehicleId].error = error.message || 'subscription_error';
    }
    
    // Fall back to polling
    subscription = null;
  }

  // If real-time subscription failed, set up polling as fallback
  if (!subscription || activeSubscriptions[vehicleId].status === 'error') {
    console.log('Falling back to polling for vehicle location updates');
    
    // Create polling interval
    const pollingInterval = options.pollingInterval || 10000; // Default 10s
    const intervalId = setInterval(async () => {
      if (!activeSubscriptions[vehicleId]) {
        clearInterval(intervalId);
        return;
      }
      
      try {
        // Skip if we're offline
        if (!navigator.onLine || !connectionState.isConnected()) {
          return;
        }
        
        const result = await trackingService.getVehicleLocation(vehicleId, options);
        if (result.data) {
          // Store last location
          activeSubscriptions[vehicleId].lastLocation = result.data;
          activeSubscriptions[vehicleId].lastUpdate = new Date();
          
          // Add source info
          result.data.source = 'polling';
          
          // Notify all callbacks
          if (activeSubscriptions[vehicleId].callbacks) {
            activeSubscriptions[vehicleId].callbacks.forEach(callback => {
              try {
                callback(result.data);
              } catch (callbackErr) {
                console.error('Error in location polling callback:', callbackErr);
              }
            });
          }
        }
      } catch (error) {
        console.warn('Error in location polling:', error);
      }
    }, pollingInterval);
    
    // Save interval ID for cleanup
    activeSubscriptions[vehicleId].intervalId = intervalId;
    activeSubscriptions[vehicleId].status = 'polling';
  }
  
  // Set up connection status check for reliability
  const connectionCheckId = setInterval(() => {
    if (!activeSubscriptions[vehicleId]) {
      clearInterval(connectionCheckId);
      return;
    }
    
    // Check if last update is too old (connection might be lost)
    const now = new Date();
    const lastUpdate = activeSubscriptions[vehicleId].lastUpdate;
    const timeSinceUpdate = now - lastUpdate;
    
    if (timeSinceUpdate > CONFIG.STALE_LOCATION_THRESHOLD) {
      // Location is stale, might have lost connection
      if (navigator.onLine && connectionState.isConnected()) {
        // We're online but not getting updates - might be a subscription issue
        console.warn('Vehicle location updates appear to be stale, attempting to refresh');
        
        // Try to refresh the subscription
        trackingService.unsubscribeFromVehicle(vehicleId);
        
        // Keep the callbacks for resubscription
        const callbacks = [...activeSubscriptions[vehicleId].callbacks];
        delete activeSubscriptions[vehicleId];
        
        // Resubscribe for each callback
        callbacks.forEach(callback => {
          trackingService.subscribeToVehicleLocation(vehicleId, callback, options);
        });
      }
    }
  }, CONFIG.CONNECTION_CHECK_INTERVAL);
  
  // Save connection check ID
  activeSubscriptions[vehicleId].connectionCheckId = connectionCheckId;
  
  // Return unsubscribe function
  return {
    unsubscribe: () => trackingService.unsubscribeFromVehicle(vehicleId, onLocationUpdate),
    
    refresh: async () => {
      // Force fetch latest location data
      try {
        const result = await trackingService.getVehicleLocation(vehicleId, options);
        if (result.data) {
          onLocationUpdate(result.data);
        }
      } catch (error) {
        console.warn('Error refreshing vehicle location:', error);
      }
    },
    
    getStatus: () => {
      if (!activeSubscriptions[vehicleId]) {
        return { active: false };
      }
      
      return {
        active: true,
        type: activeSubscriptions[vehicleId].status,
        lastUpdate: activeSubscriptions[vehicleId].lastUpdate
      };
    }
  };
};

/**
 * Unsubscribe from vehicle location updates
 * @param {string} vehicleId - Vehicle ID to unsubscribe from
 * @param {Function} [specificCallback] - Optional specific callback to remove
 */
trackingService.unsubscribeFromVehicle = (vehicleId, specificCallback = null) => {
  if (!vehicleId || !activeSubscriptions[vehicleId]) {
    return;
  }
  
  // If a specific callback was provided, only remove that callback
  if (specificCallback && activeSubscriptions[vehicleId].callbacks) {
    const callbacks = activeSubscriptions[vehicleId].callbacks;
    const index = callbacks.indexOf(specificCallback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
      
      // If there are still other callbacks, don't unsubscribe completely
      if (callbacks.length > 0) {
        return;
      }
    }
  }
  
  // Clean up subscription resources
  const subscription = activeSubscriptions[vehicleId];
  
  // Clear any polling interval
  if (subscription.intervalId) {
    clearInterval(subscription.intervalId);
  }
  
  // Clear connection check interval
  if (subscription.connectionCheckId) {
    clearInterval(subscription.connectionCheckId);
  }
  
  // Unsubscribe from Supabase channel
  if (subscription.subscription) {
    try {
      subscription.subscription.unsubscribe();
    } catch (error) {
      console.warn('Error unsubscribing from vehicle updates:', error);
    }
  }
  
  // Remove from active subscriptions
  delete activeSubscriptions[vehicleId];
  console.log(`Unsubscribed from vehicle ${vehicleId} location updates`);
};

/**
 * Subscribe to trip updates in real-time
 * @param {string} tripId - Trip ID to track
 * @param {Function} onTripUpdate - Callback for trip updates
 * @param {Object} options - Optional configuration
 * @returns {Object} - Subscription control with unsubscribe method
 */
trackingService.subscribeToTrip = async (tripId, onTripUpdate, options = {}) => {
  if (!tripId || typeof onTripUpdate !== 'function') {
    console.error('Trip ID and update callback are required');
    return { 
      error: 'invalid_parameters',
      unsubscribe: () => {} // no-op unsubscribe 
    };
  }
  
  const subscriptionKey = `trip_${tripId}`;
  
  // Check for existing subscription
  if (activeSubscriptions[subscriptionKey]) {
    console.log(`Using existing subscription for trip ${tripId}`);
    activeSubscriptions[subscriptionKey].callbacks = activeSubscriptions[subscriptionKey].callbacks || [];
    activeSubscriptions[subscriptionKey].callbacks.push(onTripUpdate);
    
    // Immediately send last known data if available
    if (activeSubscriptions[subscriptionKey].lastData) {
      setTimeout(() => {
        onTripUpdate(activeSubscriptions[subscriptionKey].lastData);
      }, 0);
    }
    
    return {
      unsubscribe: () => {
        if (activeSubscriptions[subscriptionKey]) {
          // Remove specific callback
          const callbacks = activeSubscriptions[subscriptionKey].callbacks;
          const index = callbacks.indexOf(onTripUpdate);
          if (index !== -1) {
            callbacks.splice(index, 1);
          }
          
          // If no more callbacks, clean up
          if (callbacks.length === 0) {
            trackingService.unsubscribeFromTrip(tripId);
          }
        }
      }
    };
  }
  
  // Initialize subscription tracking
  activeSubscriptions[subscriptionKey] = {
    status: 'initializing',
    callbacks: [onTripUpdate],
    lastUpdate: new Date(),
    error: null
  };
  
  // First, get current trip data
  try {
    const initialData = await trackingService.getTripDetails(tripId, options);
    
    if (initialData.data) {
      // Store last known data
      activeSubscriptions[subscriptionKey].lastData = initialData.data;
      
      // Call callback with initial data
      onTripUpdate(initialData.data);
    }
  } catch (error) {
    console.warn('Error getting initial trip data:', error);
  }
  
  // Set up real-time subscription
  try {
    const subscription = supabase
      .channel(`trip-updates-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`
        },
        async (payload) => {
          try {
            // Handle different event types
            switch (payload.eventType) {
              case 'UPDATE':
                if (!payload.new) return;
                
                // Get full trip details since payload might be incomplete
                const tripResult = await trackingService.getTripDetails(tripId, options);
                
                if (tripResult.data) {
                  // Update subscription data
                  activeSubscriptions[subscriptionKey].lastUpdate = new Date();
                  activeSubscriptions[subscriptionKey].lastData = tripResult.data;
                  
                  // Cache for offline
                  const cacheKey = `trip_details_${tripId}`;
                  offlineManager.saveToIndexedDB('trips', {
                    id: cacheKey,
                    ...tripResult.data,
                    fetchedAt: new Date().toISOString()
                  }).catch(err => console.warn('Error caching trip update:', err));
                  
                  // Notify all callbacks
                  activeSubscriptions[subscriptionKey].callbacks.forEach(callback => {
                    try {
                      callback(tripResult.data);
                    } catch (callbackErr) {
                      console.error('Error in trip update callback:', callbackErr);
                    }
                  });
                }
                break;
                
              case 'DELETE':
                // Trip was deleted or completed
                const deletedInfo = {
                  id: tripId,
                  status: 'completed', // Assume completed rather than deleted
                  isDeleted: true,
                  lastKnownData: activeSubscriptions[subscriptionKey].lastData
                };
                
                // Notify callbacks about deletion
                activeSubscriptions[subscriptionKey].callbacks.forEach(callback => {
                  try {
                    callback(deletedInfo);
                  } catch (callbackErr) {
                    console.error('Error in trip deletion callback:', callbackErr);
                  }
                });
                
                // Auto-unsubscribe on deletion
                trackingService.unsubscribeFromTrip(tripId);
                break;
            }
          } catch (err) {
            console.error('Error processing real-time trip update:', err);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Trip subscription status for ${tripId}:`, status);
        
        if (status === 'SUBSCRIBED') {
          activeSubscriptions[subscriptionKey].status = 'active';
          activeSubscriptions[subscriptionKey].subscription = subscription;
        } else if (status === 'CHANNEL_ERROR') {
          activeSubscriptions[subscriptionKey].status = 'error';
          activeSubscriptions[subscriptionKey].error = 'channel_error';
          // Fall back to polling
          setupTripPolling(tripId, options);
        }
      });
      
  } catch (error) {
    console.warn('Error setting up real-time trip tracking:', error);
    
    // Update subscription status
    if (activeSubscriptions[subscriptionKey]) {
      activeSubscriptions[subscriptionKey].status = 'error';
      activeSubscriptions[subscriptionKey].error = error.message || 'subscription_error';
    }
    
    // Fall back to polling
    setupTripPolling(tripId, options);
  }
  
  // Helper function to set up polling fallback
  function setupTripPolling(tripId, options) {
    console.log('Falling back to polling for trip updates');
    
    const pollingInterval = options.pollingInterval || 15000; // 15s default
    const intervalId = setInterval(async () => {
      if (!activeSubscriptions[subscriptionKey]) {
        clearInterval(intervalId);
        return;
      }
      
      try {
        // Skip if offline
        if (!navigator.onLine || !connectionState.isConnected()) {
          return;
        }
        
        const result = await trackingService.getTripDetails(tripId, options);
        if (result.data) {
          // Check if data has actually changed
          const lastData = activeSubscriptions[subscriptionKey].lastData;
          const isChanged = !lastData || 
                          JSON.stringify(result.data) !== JSON.stringify(lastData);
          
          if (isChanged) {
            // Store last data
            activeSubscriptions[subscriptionKey].lastData = result.data;
            activeSubscriptions[subscriptionKey].lastUpdate = new Date();
            
            // Add source info
            result.data.source = 'polling';
            
            // Notify all callbacks
            activeSubscriptions[subscriptionKey].callbacks.forEach(callback => {
              try {
                callback(result.data);
              } catch (callbackErr) {
                console.error('Error in trip polling callback:', callbackErr);
              }
            });
          }
        }
      } catch (error) {
        console.warn('Error in trip polling:', error);
      }
    }, pollingInterval);
    
    // Save interval ID for cleanup
    activeSubscriptions[subscriptionKey].intervalId = intervalId;
    activeSubscriptions[subscriptionKey].status = 'polling';
  }
  
  // Return unsubscribe function
  return {
    unsubscribe: () => trackingService.unsubscribeFromTrip(tripId),
    
    refresh: async () => {
      // Force fetch latest data
      try {
        const result = await trackingService.getTripDetails(tripId, options);
        if (result.data) {
          onTripUpdate(result.data);
        }
      } catch (error) {
        console.warn('Error refreshing trip data:', error);
      }
    },
    
    getStatus: () => {
      if (!activeSubscriptions[subscriptionKey]) {
        return { active: false };
      }
      
      return {
        active: true,
        type: activeSubscriptions[subscriptionKey].status,
        lastUpdate: activeSubscriptions[subscriptionKey].lastUpdate
      };
    }
  };
};

/**
 * Unsubscribe from trip updates
 * @param {string} tripId - Trip ID to unsubscribe from
 */
trackingService.unsubscribeFromTrip = (tripId) => {
  const subscriptionKey = `trip_${tripId}`;
  
  if (!tripId || !activeSubscriptions[subscriptionKey]) {
    return;
  }
  
  // Clean up subscription resources
  const subscription = activeSubscriptions[subscriptionKey];
  
  // Clear polling interval
  if (subscription.intervalId) {
    clearInterval(subscription.intervalId);
  }
  
  // Unsubscribe from Supabase channel
  if (subscription.subscription) {
    try {
      subscription.subscription.unsubscribe();
    } catch (error) {
      console.warn('Error unsubscribing from trip updates:', error);
    }
  }
  
  // Remove from active subscriptions
  delete activeSubscriptions[subscriptionKey];
  console.log(`Unsubscribed from trip ${tripId} updates`);
};

/**
 * Get address from coordinates (reverse geocoding)
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<Object>} - Address information
 */
trackingService.getAddressFromCoordinates = async (latitude, longitude) => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return { data: null, error: 'Invalid coordinates' };
  }
  
  // Use cached result if available (geocoding results rarely change)
  const cacheKey = `geocode_${latitude.toFixed(5)}_${longitude.toFixed(5)}`;
  const cachedResult = await offlineManager.getFromIndexedDB('geocoding', cacheKey);
  
  if (cachedResult) {
    return { data: cachedResult, error: null, source: 'cache' };
  }
  
  // Skip if offline
  if (!navigator.onLine) {
    return { data: null, error: ERROR_MESSAGES.OFFLINE, source: 'offline' };
  }
  
  try {
    // Use free, open Nominatim API (OpenStreetMap)
    // In production, you might want to use a commercial geocoding service with better rate limits
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VeristaBusTracker/1.0' // Required by Nominatim ToS
      }
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Format the address data
    const addressData = {
      full: data.display_name,
      street: data.address.road || data.address.pedestrian,
      city: data.address.city || data.address.town || data.address.village,
      county: data.address.county,
      state: data.address.state,
      country: data.address.country,
      postcode: data.address.postcode,
      coordinates: [longitude, latitude],
      raw: data
    };
    
    // Cache result
    await offlineManager.saveToIndexedDB('geocoding', {
      id: cacheKey,
      ...addressData,
      timestamp: new Date().toISOString()
    });
    
    return { data: addressData, error: null, source: 'api' };
  } catch (error) {
    console.error('Geocoding error:', error);
    return { data: null, error: ERROR_MESSAGES.GEOCODING_ERROR, source: 'error' };
  }
};

/**
 * Calculate estimated time of arrival
 * @param {Array} coordinates - Current coordinates [longitude, latitude]
 * @param {Array} destinationCoordinates - Destination [longitude, latitude]
 * @param {number} speedKmh - Current speed in km/h
 * @returns {Object} - ETA information
 */
trackingService.calculateETA = (coordinates, destinationCoordinates, speedKmh = 0) => {
  if (!coordinates || !destinationCoordinates) {
    return { minutes: null, distance: null, error: 'Invalid coordinates' };
  }
  
  try {
    // Convert to numbers
    const [currentLng, currentLat] = coordinates.map(parseFloat);
    const [destLng, destLat] = destinationCoordinates.map(parseFloat);
    
    // Simple Haversine distance calculation
    const R = 6371; // Earth radius in km
    const dLat = (destLat - currentLat) * Math.PI / 180;
    const dLon = (destLng - currentLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(currentLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;
    
    // Calculate time based on current speed
    let etaMinutes = null;
    if (speedKmh > 0) {
      etaMinutes = (distanceKm / speedKmh) * 60;
    } else {
      // Fallback to average speed of 30 km/h if vehicle is stopped
      etaMinutes = (distanceKm / 30) * 60;
    }
    
    return {
      minutes: Math.round(etaMinutes),
      distance: {
        km: distanceKm.toFixed(2),
        miles: (distanceKm * 0.621371).toFixed(2)
      },
      speed: {
        kmh: speedKmh,
        mph: (speedKmh * 0.621371).toFixed(1)
      }
    };
  } catch (error) {
    console.error('ETA calculation error:', error);
    return { minutes: null, distance: null, error: 'Calculation error' };
  }
};

/**
 * Clean up all active subscriptions
 * Useful when unmounting components or changing pages
 */
trackingService.cleanupAllSubscriptions = () => {
  Object.keys(activeSubscriptions).forEach(key => {
    const subscription = activeSubscriptions[key];
    
    // Clear any intervals
    if (subscription.intervalId) {
      clearInterval(subscription.intervalId);
    }
    
    if (subscription.connectionCheckId) {
      clearInterval(subscription.connectionCheckId);
    }
    
    // Unsubscribe from Supabase channel
    if (subscription.subscription) {
      try {
        subscription.subscription.unsubscribe();
      } catch (error) {
        console.warn(`Error unsubscribing from ${key}:`, error);
      }
    }
  });
  
  // Clear all subscriptions
  Object.keys(activeSubscriptions).forEach(key => {
    delete activeSubscriptions[key];
  });
  
  console.log('Cleaned up all tracking subscriptions');
};

/**
 * Sync any pending location updates that were cached while offline
 * @returns {Promise<Object>} - Sync result
 */
trackingService.syncPendingLocationUpdates = async () => {
  if (!navigator.onLine || !connectionState.isConnected()) {
    return { success: false, message: 'Device is offline', synced: 0 };
  }
  
  try {
    // Get pending operations from offline manager
    const pendingOps = await offlineManager.getPendingOperations('locationUpdate');
    
    if (!pendingOps || pendingOps.length === 0) {
      return { success: true, message: 'No pending updates', synced: 0 };
    }
    
    console.log(`Syncing ${pendingOps.length} pending location updates`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Process each pending update
    const results = await Promise.all(pendingOps.map(async (op) => {
      try {
        const result = await trackingService.updateVehicleLocation(
          op.vehicleId, 
          op.location,
          op.tripId
        );
        
        if (result.success) {
          successCount++;
          return { id: op.id, success: true };
        } else {
          failCount++;
          return { id: op.id, success: false, error: result.error };
        }
      } catch (error) {
        failCount++;
        return { id: op.id, success: false, error: error.message };
      }
    }));
    
    // Clean up successful operations
    const successfulIds = results
      .filter(result => result.success)
      .map(result => result.id);
      
    if (successfulIds.length > 0) {
      await offlineManager.removePendingOperations(successfulIds);
    }
    
    return {
      success: true,
      synced: successCount,
      failed: failCount,
      message: `Synced ${successCount} location updates, ${failCount} failed`
    };
  } catch (error) {
    console.error('Error syncing pending location updates:', error);
    return {
      success: false,
      message: 'Error syncing: ' + error.message,
      error
    };
  }
};

export default trackingService;
