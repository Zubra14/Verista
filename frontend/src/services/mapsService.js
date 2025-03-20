// src/services/mapsService.js
import { toast } from "react-toastify";

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
 */
export const mapsService = {
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
      // If Maps API is already loaded, just return success
      if (window.google && window.google.maps) {
        API_KEY_CONFIG.initialized = true;
        return { success: true };
      }

      return new Promise((resolve) => {
        // Load the script with timeout
        const script = document.createElement("script");
        const libraries = API_KEY_CONFIG.libraries.join(",");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY_CONFIG.apiKey}&libraries=${libraries}&callback=initMapsCallback`;
        script.async = true;
        script.defer = true;

        // Create global callback function
        window.initMapsCallback = () => {
          API_KEY_CONFIG.initialized = true;
          resolve({ success: true });
        };

        // Set loading timeout - 15 seconds
        const timeoutId = setTimeout(() => {
          console.error("Google Maps script loading timed out");
          API_KEY_CONFIG.fallbackMode = true;
          API_KEY_CONFIG.initialized = true;
          API_KEY_CONFIG.lastError = "Script loading timed out";
          resolve({
            success: false,
            error: "Loading timed out",
            fallback: true,
          });
        }, 15000);

        // Handle script loading failure
        script.onerror = (err) => {
          clearTimeout(timeoutId);
          console.error("Failed to load Google Maps script:", err);
          API_KEY_CONFIG.fallbackMode = true;
          API_KEY_CONFIG.initialized = true;
          API_KEY_CONFIG.lastError = "Script loading failed";
          resolve({
            success: false,
            error: "Failed to load Maps script",
            fallback: true,
          });
        };

        // Clear timeout when loaded
        script.onload = () => {
          clearTimeout(timeoutId);
          // Callback will resolve the promise
        };

        document.head.appendChild(script);
      });
    } catch (error) {
      console.error("Error initializing Google Maps:", error);
      API_KEY_CONFIG.fallbackMode = true;
      API_KEY_CONFIG.initialized = true;
      API_KEY_CONFIG.lastError =
        error.message || "Unknown initialization error";
      return {
        success: false,
        error: error.message,
        fallback: true,
      };
    }
  },

  /**
   * Calculate a route with fallback handling and retries
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
   */
  isFallbackMode() {
    return API_KEY_CONFIG.fallbackMode;
  },

  /**
   * Get maps API key validation status
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
   */
  reset() {
    API_KEY_CONFIG.initialized = false;
    API_KEY_CONFIG.fallbackMode = false;
    API_KEY_CONFIG.lastError = null;
    API_KEY_CONFIG.validationAttempts = 0;
    return { success: true };
  },
};

export default mapsService;
