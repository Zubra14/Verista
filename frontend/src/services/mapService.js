// src/services/mapService.js
import { toast } from "react-toastify";
import supabase from "../lib/supabase";
import { loadGoogleMapsScript, initializeMapWithFallback, createMapFallback } from "../utils/mapUtils";

/**
 * Configuration for API key validation and fallback handling
 */
const API_KEY_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  retryCount: 0,
  initialized: false,
  fallbackMode: false,
  libraries: ["places", "directions", "geometry"],
  lastError: null,
  validationAttempts: 0,
};

/**
 * Maps service for handling Google Maps API integration
 * Enhanced with robust error handling and integration with mapUtils
 */
export const mapService = {
  /**
   * Validate Google Maps API key
   * @returns {Promise<boolean>} - Validation result
   */
  async validateApiKey() {
    const apiKey = API_KEY_CONFIG.apiKey;

    if (!apiKey || apiKey === "" || apiKey === "your-api-key-here") {
      console.error("Invalid or missing Google Maps API key");
      return false;
    }

    // Skip validation if we've already attempted multiple times
    if (API_KEY_CONFIG.validationAttempts > 2) {
      return true; // Assume valid to not block functionality
    }

    try {
      // Use geocoding API as a reliable way to test key validity
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${apiKey}`
      );
      const data = await response.json();

      API_KEY_CONFIG.validationAttempts++;

      if (data.status === "REQUEST_DENIED") {
        console.error("Maps API key validation failed:", data.error_message);
        API_KEY_CONFIG.lastError = data.error_message;
        return false;
      }

      return true;
    } catch (error) {
      console.warn("Error validating Maps API key (might be CORS):", error);
      API_KEY_CONFIG.validationAttempts++;
      // Don't fail validation due to CORS issues with the test request
      return true;
    }
  },

  /**
   * Initialize Maps service with robust error handling
   * @returns {Promise<Object>} - Initialization result
   */
  async init() {
    if (API_KEY_CONFIG.initialized) {
      return API_KEY_CONFIG.fallbackMode
        ? { success: false, fallback: true, error: API_KEY_CONFIG.lastError }
        : { success: true };
    }

    // Check if the API key is configured
    if (!API_KEY_CONFIG.apiKey) {
      console.error("Google Maps API key not configured");
      API_KEY_CONFIG.fallbackMode = true;
      API_KEY_CONFIG.initialized = true;
      API_KEY_CONFIG.lastError = "API key not configured";
      return {
        success: false,
        error: "API key not configured",
        fallback: true,
      };
    }

    // Validate API key
    const isValidKey = await this.validateApiKey();
    if (!isValidKey) {
      API_KEY_CONFIG.fallbackMode = true;
      API_KEY_CONFIG.initialized = true;
      return {
        success: false,
        error: API_KEY_CONFIG.lastError || "Invalid API key",
        fallback: true,
      };
    }

    try {
      // Use the centralized, enhanced loadGoogleMapsScript from mapUtils.js
      // This has improved error handling and fixes "message channel closed" errors
      await loadGoogleMapsScript();
      
      API_KEY_CONFIG.initialized = true;
      return { success: true };
    } catch (error) {
      console.error("Error initializing Google Maps:", error);
      API_KEY_CONFIG.fallbackMode = true;
      API_KEY_CONFIG.initialized = true;
      API_KEY_CONFIG.lastError = error.message || "Unknown initialization error";
      return {
        success: false,
        error: error.message,
        fallback: true,
      };
    }
  },

  /**
   * Calculate a route with fallback handling and retries
   * @param {Object} origin - Origin location
   * @param {Object} destination - Destination location
   * @param {Array} waypoints - Optional waypoints
   * @param {number} retryCount - Current retry count
   * @returns {Promise<Object>} - Route calculation result
   */
  async calculateRoute(origin, destination, waypoints = [], retryCount = 0) {
    // Make sure Maps is initialized first
    const initResult = await this.init();
    if (!initResult.success) {
      console.log(
        "Using fallback route calculation due to initialization failure"
      );
      return this.calculateFallbackRoute(origin, destination, waypoints);
    }

    try {
      // Use Google's Directions service
      const directionsService = new window.google.maps.DirectionsService();

      const formattedWaypoints = waypoints.map((wp) => ({
        location:
          wp.coordinates ||
          new window.google.maps.LatLng(
            wp.lat || wp.latitude || 0,
            wp.lng || wp.longitude || 0
          ),
        stopover: true,
      }));

      const request = {
        origin:
          origin.coordinates ||
          new window.google.maps.LatLng(
            origin.lat || origin.latitude || 0,
            origin.lng || origin.longitude || 0
          ),
        destination:
          destination.coordinates ||
          new window.google.maps.LatLng(
            destination.lat || destination.latitude || 0,
            destination.lng || destination.longitude || 0
          ),
        waypoints: formattedWaypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      };

      // Return a Promise for the directions request
      return new Promise((resolve, reject) => {
        directionsService.route(request, (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            resolve({ success: true, data: result });
          } else {
            console.error("Directions request failed:", status);

            // If API key issue, switch to fallback mode
            if (status === "REQUEST_DENIED") {
              API_KEY_CONFIG.fallbackMode = true;
              resolve(
                this.calculateFallbackRoute(origin, destination, waypoints)
              );
            }
            // Retry on transient errors
            else if (
              retryCount < 2 &&
              (status === "OVER_QUERY_LIMIT" ||
                status === "UNKNOWN_ERROR" ||
                status === "TIMEOUT")
            ) {
              setTimeout(() => {
                console.log(
                  `Retrying route calculation (attempt ${retryCount + 1})...`
                );
                this.calculateRoute(
                  origin,
                  destination,
                  waypoints,
                  retryCount + 1
                )
                  .then(resolve)
                  .catch(() => {
                    // If retries fail, use fallback
                    resolve(
                      this.calculateFallbackRoute(
                        origin,
                        destination,
                        waypoints
                      )
                    );
                  });
              }, 1000 * (retryCount + 1)); // Exponential backoff
            } else {
              // Use fallback for other errors
              resolve({
                success: false,
                error: status,
                fallback: true,
                fallbackRoute: this.calculateFallbackRoute(
                  origin,
                  destination,
                  waypoints
                ),
              });
            }
          }
        });
      });
    } catch (error) {
      console.error("Error calculating route:", error);
      return this.calculateFallbackRoute(origin, destination, waypoints);
    }
  },

  /**
   * Generate a simplified route when API fails
   * @param {Object} origin - Origin location
   * @param {Object} destination - Destination location
   * @param {Array} waypoints - Optional waypoints
   * @returns {Object} - Simplified route data
   */
  calculateFallbackRoute(origin, destination, waypoints = []) {
    // Standardize coordinate formats to handle different input formats
    const standardizeCoords = (point) => ({
      lat:
        point.lat ||
        point.latitude ||
        (point.coordinates ? point.coordinates.lat : 0),
      lng:
        point.lng ||
        point.longitude ||
        (point.coordinates ? point.coordinates.lng : 0),
    });

    // Ensure origin and destination have valid coordinates
    const originCoords = standardizeCoords(origin);
    const destinationCoords = standardizeCoords(destination);

    // Process waypoints with standardized coordinates
    const processedWaypoints = waypoints.map(standardizeCoords);

    // Combine all points including origin, waypoints, and destination
    const allPoints = [originCoords, ...processedWaypoints, destinationCoords];

    // Create a simple straight-line path
    const route = {
      legs: [],
      overview_path: allPoints.map((point) => ({
        lat: () => point.lat || 0,
        lng: () => point.lng || 0,
      })),
    };

    // Create legs between each point
    for (let i = 0; i < allPoints.length - 1; i++) {
      const start = allPoints[i];
      const end = allPoints[i + 1];

      route.legs.push({
        distance: { text: "Unknown", value: 0 },
        duration: { text: "Unknown", value: 0 },
        start_location: {
          lat: () => start.lat || 0,
          lng: () => start.lng || 0,
        },
        end_location: {
          lat: () => end.lat || 0,
          lng: () => end.lng || 0,
        },
        steps: [
          {
            path: [
              {
                lat: () => start.lat || 0,
                lng: () => start.lng || 0,
              },
              {
                lat: () => end.lat || 0,
                lng: () => end.lng || 0,
              },
            ],
          },
        ],
      });
    }

    return {
      success: true,
      data: { routes: [route] },
      fallback: true,
    };
  },

  /**
   * Check if we're in fallback mode
   * @returns {boolean} - Fallback mode status
   */
  isFallbackMode() {
    return API_KEY_CONFIG.fallbackMode;
  },

  /**
   * Get maps API key validation status
   * @returns {Object} - API status information
   */
  getApiStatus() {
    return {
      initialized: API_KEY_CONFIG.initialized,
      fallbackMode: API_KEY_CONFIG.fallbackMode,
      lastError: API_KEY_CONFIG.lastError,
      apiKey: API_KEY_CONFIG.apiKey ? "Configured" : "Missing",
    };
  },

  /**
   * Reset initialization state for testing
   * @returns {Object} - Reset result
   */
  reset() {
    API_KEY_CONFIG.initialized = false;
    API_KEY_CONFIG.fallbackMode = false;
    API_KEY_CONFIG.lastError = null;
    API_KEY_CONFIG.validationAttempts = 0;
    return { success: true };
  },
};

/**
 * Initialize Google Maps API with proper error handling and retries
 * Enhanced to use the central loadGoogleMapsScript function from mapUtils.js
 * @returns {Promise<Object>} Google Maps instance
 */
export const initializeGoogleMaps = () => {
  // Check if already loaded
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  if (!apiKey) {
    console.error("Google Maps API key is missing");
    return Promise.reject(new Error("Google Maps API key is missing"));
  }

  // Use the centralized loading function
  return loadGoogleMapsScript()
    .then((maps) => {
      console.log("Google Maps loaded successfully through centralized loader");
      return maps;
    })
    .catch(error => {
      console.error("Failed to load Google Maps:", error);
      throw error;
    });
};

/**
 * Create a map instance with standardized options
 * Enhanced to use error handling from mapUtils
 * @param {Object} mapElement - React ref to the map container element
 * @param {Object} options - Map initialization options
 * @returns {Promise<Object>} - The created map instance
 */
export const createMapInstance = async (mapElement, options = {}) => {
  if (!mapElement || !mapElement.current) {
    throw new Error("Map element reference is invalid");
  }

  try {
    // Use the enhanced map initialization from mapUtils.js
    // This properly cleans up resources and prevents "message channel closed" errors
    const mapResult = await initializeMapWithFallback({
      mapElement: mapElement.current,
      center: options.center || { lat: -26.2041, lng: 28.0473 }, // Johannesburg default
      zoom: options.zoom || 12,
      markerPosition: options.markerPosition,
      markerIcon: options.markerIcon,
      abortSignal: options.abortSignal,
      onSuccess: options.onSuccess,
      onError: options.onError,
    });

    return mapResult.map;
  } catch (error) {
    console.error("Error creating map:", error);
    
    // Create fallback display if requested
    if (options.createFallback && mapElement.current) {
      createMapFallback(
        mapElement.current,
        "Map could not be loaded",
        {
          location: options.center,
          errorMessage: error.message,
          onRetry: options.onRetry
        }
      );
    }
    
    throw error;
  }
};

/**
 * Create an advanced marker element with fallback to standard marker
 * @param {Object} map - Google Maps instance
 * @param {Object} position - Marker position {lat, lng}
 * @param {Object} options - Marker options
 * @returns {Object} - Created marker
 */
export const createMapMarker = async (map, position, options = {}) => {
  if (!map || !position) {
    throw new Error("Invalid map or position for marker creation");
  }

  try {
    // Prefer AdvancedMarkerElement if available (recommended by Google)
    if (
      window.google.maps.marker &&
      typeof window.google.maps.marker.AdvancedMarkerElement === "function"
    ) {
      // Import marker library if needed (for newer Maps versions)
      if (!window.google.maps.marker.AdvancedMarkerElement) {
        await window.google.maps.importLibrary("marker");
      }

      let markerContent;
      if (options.content) {
        markerContent = options.content;
      } else if (options.iconUrl) {
        // Create custom marker element with image
        const element = document.createElement("div");
        element.className = "marker-container";

        const imgElement = document.createElement("img");
        imgElement.src = options.iconUrl;
        imgElement.style.width = options.iconSize?.[0] || "32px";
        imgElement.style.height = options.iconSize?.[1] || "32px";
        element.appendChild(imgElement);

        markerContent = element;
      }

      // Create the advanced marker
      return new window.google.maps.marker.AdvancedMarkerElement({
        position,
        map,
        title: options.title,
        content: markerContent,
        zIndex: options.zIndex || 1,
      });
    } else {
      // Fall back to standard marker
      const marker = new window.google.maps.Marker({
        position,
        map,
        title: options.title,
        zIndex: options.zIndex || 1,
      });

      // Apply icon if provided
      if (options.iconUrl) {
        marker.setIcon({
          url: options.iconUrl,
          scaledSize: new window.google.maps.Size(
            options.iconSize?.[0] || 32,
            options.iconSize?.[1] || 32
          ),
          anchor: new window.google.maps.Point(
            (options.iconSize?.[0] || 32) / 2,
            (options.iconSize?.[1] || 32) / 2
          ),
        });
      }

      return marker;
    }
  } catch (error) {
    console.error("Error creating marker:", error);

    // Create minimal standard marker as last resort
    return new window.google.maps.Marker({
      position,
      map,
    });
  }
};

/**
 * Comprehensive map service for vehicle tracking and location management
 * Handles Supabase permissions issues with multi-layered fallback approach
 */

// Constants for configuration
const CONFIG = {
  CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutes
  MAX_LOCATION_AGE_MS: 24 * 60 * 60 * 1000, // 24 hours
  USE_SIMULATION: false, // Set to true for development/testing
  DEFAULT_CENTER: { latitude: -26.2041, longitude: 28.0473 }, // Johannesburg
};

/**
 * Get current location for a specific vehicle with robust error handling
 * @param {string} vehicleId - ID of the vehicle to track
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} Location data
 */
export const getVehicleLocation = async (vehicleId, options = {}) => {
  const errorContext = `getVehicleLocation(${vehicleId})`;

  try {
    // Try RPC function first (bypasses RLS permission issues)
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_vehicle_location",
      { vehicle_id: vehicleId }
    );

    if (!rpcError && rpcData) {
      // Cache successful response
      const locationData = {
        latitude: rpcData.latitude,
        longitude: rpcData.longitude,
        speed: rpcData.speed || 0,
        heading: rpcData.heading,
        timestamp: rpcData.updated_at,
        source: "rpc",
        lastVerified: Date.now(), // Add verification timestamp
      };

      // Use improved caching function with TTL
      cacheLocationData(vehicleId, locationData, 300); // 5 minute TTL

      return locationData;
    }

    if (rpcError) {
      // Log RPC error but don't fail yet - try fallback
      console.warn(
        `RPC location fetch failed for vehicle ${vehicleId}:`,
        rpcError
      );

      // Try secondary approach with direct query
      const { data: vehicleData, error: vehicleError } = await supabase
        .from("vehicles")
        .select("id, current_location, speed, heading, location_updated_at")
        .eq("id", vehicleId)
        .maybeSingle();

      if (vehicleError) {
        throw new Error(`Database query failed: ${vehicleError.message}`);
      }

      if (vehicleData?.current_location) {
        const coords = parsePostgisPoint(vehicleData.current_location);

        const locationData = {
          ...coords,
          speed: vehicleData.speed || 0,
          heading: vehicleData.heading || 0,
          timestamp: vehicleData.location_updated_at,
          source: "query",
        };

        // Cache this data too
        cacheLocationData(vehicleId, locationData);

        return locationData;
      }
    }

    // If we get here, both primary methods failed - use cached data
    const cachedData = await getFallbackLocationData(vehicleId);
    if (cachedData) {
      // Add flag to indicate this is cached data
      return { ...cachedData, cached: true };
    }

    // As a last resort, check if simulation is enabled
    if (CONFIG.USE_SIMULATION || options.useSimulation) {
      return getSimulatedLocation(vehicleId);
    }

    // Everything failed
    throw new Error("No location data available for this vehicle");
  } catch (error) {
    console.error(`Error in ${errorContext}:`, error);

    if (!options.suppressToast) {
      toast.error("Unable to retrieve vehicle location data");
    }

    // Try to use cached data even in error case
    const emergencyCache = await getFallbackLocationData(vehicleId);
    if (emergencyCache) {
      return {
        ...emergencyCache,
        cached: true,
        emergency: true,
      };
    }

    // Return null location as last resort
    return {
      latitude: CONFIG.DEFAULT_CENTER.latitude,
      longitude: CONFIG.DEFAULT_CENTER.longitude,
      speed: 0,
      timestamp: new Date().toISOString(),
      error: true,
      errorMessage: error.message,
    };
  }
};

/**
 * Get locations for multiple vehicles simultaneously with batching
 * @param {Array<string>} vehicleIds - Array of vehicle IDs
 * @returns {Promise<Object>} Map of vehicle IDs to location data
 */
export const getMultipleVehicleLocations = async (vehicleIds) => {
  if (!vehicleIds || !vehicleIds.length) {
    return {};
  }

  try {
    // Try batch RPC first if available
    const { data: batchData, error: batchError } = await supabase.rpc(
      "get_multiple_vehicle_locations",
      { vehicle_ids: vehicleIds }
    );

    if (!batchError && batchData) {
      const result = {};

      // Process and format the batch response
      batchData.forEach((vehicle) => {
        result[vehicle.id] = {
          latitude: vehicle.latitude,
          longitude: vehicle.longitude,
          speed: vehicle.speed || 0,
          heading: vehicle.heading,
          timestamp: vehicle.updated_at,
          source: "batch_rpc",
        };

        // Cache each result
        cacheLocationData(vehicle.id, result[vehicle.id]);
      });

      return result;
    }

    // Fallback to individual fetches on batch error
    const results = {};
    const promises = vehicleIds.map((id) =>
      getVehicleLocation(id, { suppressToast: true })
        .then((location) => {
          results[id] = location;
        })
        .catch((error) => {
          console.warn(`Failed to fetch location for vehicle ${id}:`, error);
          results[id] = null;
        })
    );

    // Wait for all individual fetches to complete
    await Promise.all(promises);
    return results;
  } catch (error) {
    console.error("Error fetching multiple vehicle locations:", error);

    toast.error("Unable to retrieve vehicle locations");

    // Return an object with null values as fallback
    return vehicleIds.reduce((acc, id) => {
      acc[id] = null;
      return acc;
    }, {});
  }
};

/**
 * Get a vehicle's location history for tracking
 * @param {string} vehicleId - Vehicle ID to get history for
 * @param {Object} options - Query options (timeframe, limit, etc)
 * @returns {Promise<Array>} Array of location points
 */
export const getVehicleLocationHistory = async (vehicleId, options = {}) => {
  const {
    startTime = new Date(Date.now() - 24 * 60 * 60 * 1000), // Default to 24h ago
    endTime = new Date(),
    limit = 100,
  } = options;

  try {
    // Try the RPC approach first
    const { data: historyData, error: historyError } = await supabase.rpc(
      "get_vehicle_location_history",
      {
        v_id: vehicleId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        max_points: limit,
      }
    );

    if (!historyError && historyData) {
      return historyData.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
        speed: point.speed || 0,
        timestamp: point.timestamp,
        heading: point.heading,
      }));
    }

    // Fall back to direct query
    const { data: queryData, error: queryError } = await supabase
      .from("vehicle_locations")
      .select("location, speed, heading, timestamp")
      .eq("vehicle_id", vehicleId)
      .gte("timestamp", startTime.toISOString())
      .lte("timestamp", endTime.toISOString())
      .order("timestamp", { ascending: true })
      .limit(limit);

    if (queryError) {
      throw new Error(`History query failed: ${queryError.message}`);
    }

    if (queryData?.length) {
      return queryData.map((point) => {
        const coords = parsePostgisPoint(point.location);
        return {
          ...coords,
          speed: point.speed || 0,
          heading: point.heading || 0,
          timestamp: point.timestamp,
        };
      });
    }

    // Return empty array if no data found
    return [];
  } catch (error) {
    console.error("Error fetching vehicle location history:", error);
    return [];
  }
};

/**
 * Update vehicle location (used by driver app)
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} locationData - New location data
 * @returns {Promise<Object>} Update result
 */
export const updateVehicleLocation = async (vehicleId, locationData) => {
  try {
    const { latitude, longitude, speed, heading } = locationData;

    // Validate input data
    if (!vehicleId || latitude === undefined || longitude === undefined) {
      throw new Error("Invalid location data");
    }

    // Use the RPC function for updating
    const { data, error } = await supabase.rpc("update_vehicle_location", {
      v_id: vehicleId,
      lat: latitude,
      lng: longitude,
      spd: speed || 0,
      hdg: heading || 0,
    });

    if (error) {
      // Try direct update as fallback
      const { error: updateError } = await supabase
        .from("vehicles")
        .update({
          current_location: `POINT(${longitude} ${latitude})`,
          speed: speed || 0,
          heading: heading || 0,
          location_updated_at: new Date().toISOString(),
        })
        .eq("id", vehicleId);

      if (updateError) {
        throw new Error(`Failed to update location: ${updateError.message}`);
      }
    }

    // Update the cache with fresh data
    cacheLocationData(vehicleId, {
      ...locationData,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating vehicle location:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Parse PostGIS point data into latitude/longitude
 * @param {any} pointData - PostGIS point representation
 * @returns {Object} Standardized coordinates
 */
const parsePostgisPoint = (pointData) => {
  if (!pointData) return { latitude: 0, longitude: 0 };

  try {
    // Handle string format: "POINT(lng lat)"
    if (typeof pointData === "string") {
      const match = pointData.match(/POINT\(([^ ]+) ([^)]+)\)/);
      if (match) {
        return {
          longitude: parseFloat(match[1]),
          latitude: parseFloat(match[2]),
        };
      }
    }

    // Handle object format with x/y properties
    if (pointData.x !== undefined && pointData.y !== undefined) {
      return {
        longitude: parseFloat(pointData.x),
        latitude: parseFloat(pointData.y),
      };
    }

    // Handle object format with longitude/latitude properties
    if (pointData.longitude !== undefined && pointData.latitude !== undefined) {
      return {
        longitude: parseFloat(pointData.longitude),
        latitude: parseFloat(pointData.latitude),
      };
    }

    console.warn("Unknown point data format:", pointData);
    return { latitude: 0, longitude: 0 };
  } catch (e) {
    console.error("Error parsing point data:", e);
    return { latitude: 0, longitude: 0 };
  }
};

/**
 * Cache location data with expiration
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} locationData - Location data to cache
 * @param {number} ttlMinutes - Cache time-to-live in minutes
 */
const cacheLocationData = (vehicleId, locationData, ttlMinutes = 5) => {
  try {
    const cacheKey = `vehicle_location_${vehicleId}`;

    // Add cache metadata
    const dataToCache = {
      ...locationData,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    };

    // Use sessionStorage for more frequent location updates
    // This prevents localStorage from being cluttered
    sessionStorage.setItem(cacheKey, JSON.stringify(dataToCache));

    // Also store last known location in localStorage with longer TTL
    if (!locationData.cached && !locationData.emergency) {
      localStorage.setItem(
        `last_known_${vehicleId}`,
        JSON.stringify({
          ...dataToCache,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hour backup
        })
      );
    }
  } catch (e) {
    console.warn("Failed to cache location data:", e);
  }
};

/**
 * Get fallback location data with improved strategy
 * Tries sessionStorage first, then localStorage as backup
 */
const getFallbackLocationData = async (vehicleId) => {
  try {
    // Try sessionStorage first (short-term cache)
    const cacheKey = `vehicle_location_${vehicleId}`;
    const cachedData = sessionStorage.getItem(cacheKey);

    if (cachedData) {
      const parsedData = JSON.parse(cachedData);

      // Check if cache is still valid
      if (parsedData.expiresAt && parsedData.expiresAt > Date.now()) {
        return parsedData;
      }

      console.log("Session cache expired for vehicle", vehicleId);
    }

    // Try localStorage as backup (long-term last known position)
    const lastKnownData = localStorage.getItem(`last_known_${vehicleId}`);
    if (lastKnownData) {
      const parsedLastKnown = JSON.parse(lastKnownData);
      return { ...parsedLastKnown, backupCache: true };
    }

    return null;
  } catch (e) {
    console.warn("Error reading cache:", e);
    return null;
  }
};

/**
 * Generate simulated location data (for development/testing)
 * @param {string} vehicleId - Vehicle ID
 * @returns {Object} Simulated location
 */
const getSimulatedLocation = (vehicleId) => {
  // Use hash of vehicle ID to get somewhat consistent but different locations
  const hash = vehicleId.split("").reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  // Generate location near Johannesburg with some variation
  const baseLatitude = -26.2041;
  const baseLongitude = 28.0473;

  return {
    latitude: baseLatitude + (hash % 100) / 1000,
    longitude: baseLongitude + (hash % 100) / 1000,
    speed: Math.floor(hash % 60),
    heading: hash % 360,
    timestamp: new Date().toISOString(),
    simulated: true,
  };
};

// Add a cleanup utility to prevent cache accumulation
export const cleanupLocationCache = () => {
  try {
    const now = Date.now();

    // Clean session storage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key.startsWith("vehicle_location_")) {
        try {
          const data = JSON.parse(sessionStorage.getItem(key));
          if (data.expiresAt && data.expiresAt < now) {
            sessionStorage.removeItem(key);
          }
        } catch (e) {}
      }
    }

    // Clean localStorage (only expired items older than 24h)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("last_known_")) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.expiresAt && data.expiresAt < now - 24 * 60 * 60 * 1000) {
            localStorage.removeItem(key);
          }
        } catch (e) {}
      }
    }
  } catch (e) {
    console.warn("Error cleaning cache:", e);
  }
};

export default {
  ...mapService,
  initializeGoogleMaps,
  createMapInstance,
  createMapMarker,
  getVehicleLocation,
  getMultipleVehicleLocations,
  getVehicleLocationHistory,
  updateVehicleLocation,
  parsePostgisPoint: (pointData) => parsePostgisPoint(pointData),
  cleanupLocationCache, // Add the new utility function
};