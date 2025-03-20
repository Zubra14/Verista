// src/components/dashboard/dashboard-modules/LiveTracking.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import trackingService from "../../../services/trackingService";
import LoadingSpinner from "../../common/LoadingSpinner";
import ErrorAlert from "../../common/ErrorAlert";
import mapConfigChecker from "../../../utils/mapConfigChecker";
import offlineManager from "../../../utils/enhancedOfflineManager";

// Map container styles
const mapContainerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "400px",
  borderRadius: "0.5rem",
};

// Default center (Johannesburg)
const DEFAULT_CENTER = { lat: -26.2041, lng: 28.0473 };

/**
 * Simple fallback component for when the map fails to load
 */
const InlineMapFallback = ({
  location,
  onRetry,
  isRetrying,
  tripInfo = null,
}) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 rounded-lg p-6">
      <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          Map Unavailable
        </h3>
        <p className="mb-4 text-gray-600">
          We're having trouble loading the map. Using simple view instead.
        </p>

        {location && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-left mb-4">
            <p className="font-medium text-blue-900">Vehicle Location:</p>
            <p className="text-blue-800">
              Latitude: {location.latitude.toFixed(6)}
            </p>
            <p className="text-blue-800">
              Longitude: {location.longitude.toFixed(6)}
            </p>
            <p className="text-blue-800">Speed: {location.speed || 0} km/h</p>
            <p className="text-blue-800">
              Updated: {formatTime(location.timestamp)}
            </p>

            {tripInfo && (
              <>
                <hr className="my-2 border-blue-200" />
                <p className="font-medium text-blue-900">Trip Information:</p>
                <p className="text-blue-800">
                  Route: {tripInfo.route?.name || "Unknown"}
                </p>
                <p className="text-blue-800">
                  Vehicle: {tripInfo.vehicle?.registration || "Unknown"}
                </p>
                <p className="text-blue-800">
                  Driver: {tripInfo.driver?.name || "Unknown"}
                </p>
                <p className="text-blue-800">
                  Status: {formatStatus(tripInfo.status)}
                </p>
              </>
            )}
          </div>
        )}

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <>
              <span className="inline-block mr-2 h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></span>
              Retrying...
            </>
          ) : (
            "Retry Loading Map"
          )}
        </button>
      </div>
    </div>
  );
};

/**
 * Helper to format timestamps
 */
const formatTime = (timestamp) => {
  if (!timestamp) return "Unknown";
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch (err) {
    return "Invalid time";
  }
};

/**
 * Helper to format status strings
 */
const formatStatus = (status) => {
  if (!status) return "Unknown";
  const statusMap = {
    started: "Started",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    delayed: "Delayed",
  };
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * LiveTracking component with improved reliability and error handling
 */
const LiveTracking = ({
  trackingId,
  trackingType = "child",
  onLocationUpdate,
  enableInfoWindow = true,
  routeId,
  userType,
  childId,
}) => {
  // Determine if in development mode
  const isDevelopment =
    import.meta.env.DEV || import.meta.env.MODE === "development";

  // For backwards compatibility
  const actualTrackingId = trackingId || routeId || childId;
  const actualTrackingType = trackingId
    ? trackingType
    : routeId
    ? "route"
    : "child";

  // Component state
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const googleMapsRef = useRef(null);

  const [currentTrip, setCurrentTrip] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapStatus, setMapStatus] = useState("loading");
  const [trackingStatus, setTrackingStatus] = useState({
    active: false,
    lastUpdate: null,
    source: null,
    isUsingMock: false,
  });

  // Check if map API is properly configured
  const apiKeyCheck = useRef(null);
  useEffect(() => {
    // Check Google Maps API key once
    if (!apiKeyCheck.current) {
      apiKeyCheck.current = mapConfigChecker.checkGoogleMapsApiKey();
      console.log("Maps API key check:", apiKeyCheck.current);

      if (!apiKeyCheck.current.valid) {
        console.warn("Maps API key issue:", apiKeyCheck.current.message);
        setMapStatus("apikey-missing");
      }
    }
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("You are back online. Reconnecting...");
      // Reload data when coming back online
      loadTrackingData();
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.warn("You are offline. Map updates paused.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load Google Maps script
  const loadGoogleMapsScript = useCallback(() => {
    // If already loaded, use existing instance
    if (window.google && window.google.maps) {
      googleMapsRef.current = window.google.maps;
      setMapsLoaded(true);
      return;
    }

    // Check if API key is valid
    if (!apiKeyCheck.current?.valid) {
      console.warn("Cannot load Google Maps: Invalid API key");
      // Mark as fallback mode
      setMapStatus("fallback");
      setLoading(false);
      return;
    }

    const apiKey = apiKeyCheck.current.key;

    // Create script element
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("Google Maps script loaded successfully");
      googleMapsRef.current = window.google.maps;
      setMapsLoaded(true);

      // After script loads, initialize map
      if (location) {
        setTimeout(() => {
          initializeMap();
        }, 100);
      }
    };

    script.onerror = (e) => {
      console.error("Failed to load Google Maps script:", e);
      setError(
        "Failed to load Google Maps. Check your internet connection and API key."
      );
      setLoading(false);
      setMapStatus("fallback");
    };

    document.head.appendChild(script);

    return () => {
      // Clean up script if component unmounts during loading
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [location]);

  // Initialize map after script loads
  const initializeMap = useCallback(() => {
    if (!window.google || !window.google.maps || !mapRef.current) {
      console.warn("Cannot initialize map: Dependencies not loaded");
      return;
    }

    try {
      const googleMaps = window.google.maps;

      // Create new map instance
      const mapOptions = {
        center: location
          ? { lat: location.latitude, lng: location.longitude }
          : DEFAULT_CENTER,
        zoom: 15,
        fullscreenControl: true,
        mapTypeControl: true,
        streetViewControl: false,
        zoomControl: true,
        gestureHandling: "cooperative",
      };

      const map = new googleMaps.Map(mapRef.current, mapOptions);

      // Store map instance in ref
      mapInstanceRef.current = map;

      // Create marker if we have location
      if (location) {
        createOrUpdateMarker();
      }

      // Update map status to loaded
      setMapStatus("loaded");
    } catch (err) {
      console.error("Error initializing Google Maps:", err);
      setError(`Map initialization failed: ${err.message}`);
      setMapStatus("fallback");
    }
  }, [location]);

  // Create or update marker
  const createOrUpdateMarker = useCallback(() => {
    if (
      !window.google ||
      !window.google.maps ||
      !mapInstanceRef.current ||
      !location
    ) {
      return;
    }

    const newPosition = {
      lat: location.latitude,
      lng: location.longitude,
    };

    // If marker doesn't exist, create it
    if (!markerRef.current) {
      const marker = new window.google.maps.Marker({
        position: newPosition,
        map: mapInstanceRef.current,
        title: "Vehicle Location",
      });

      // Try to use custom icon
      loadMarkerIcon(marker);

      markerRef.current = marker;

      // Create info window if enabled
      if (enableInfoWindow) {
        createInfoWindow(marker);
      }
    } else {
      // Update existing marker
      markerRef.current.setPosition(newPosition);

      // Update info window content if it exists
      if (infoWindowRef.current) {
        infoWindowRef.current.setContent(createInfoWindowContent());
      }
    }

    // Center map on marker with smooth animation
    mapInstanceRef.current.panTo(newPosition);
  }, [location, enableInfoWindow]);

  // Load the marker icon
  const loadMarkerIcon = useCallback((marker) => {
    try {
      const iconUrl = "/assets/bus-icon.png";
      const img = new Image();

      img.onload = () => {
        if (marker && window.google && window.google.maps) {
          marker.setIcon({
            url: iconUrl,
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20),
          });
        }
      };

      img.onerror = () => {
        console.warn("Failed to load bus icon image. Using default marker.");
      };

      img.src = iconUrl;
    } catch (iconErr) {
      console.warn("Failed to set custom marker icon:", iconErr);
    }
  }, []);

  // Create info window
  const createInfoWindow = useCallback((marker) => {
    if (!window.google || !window.google.maps || !marker) return;

    const infoWindow = new window.google.maps.InfoWindow({
      content: createInfoWindowContent(),
    });

    // Add click listener to marker
    marker.addListener("click", () => {
      infoWindow.open(mapInstanceRef.current, marker);
    });

    infoWindowRef.current = infoWindow;
  }, []);

  // Create info window content
  const createInfoWindowContent = useCallback(() => {
    const div = document.createElement("div");
    div.className = "p-3";

    if (!currentTrip || !location) {
      div.innerHTML = `
        <h3 class="font-bold mb-1">Vehicle Information</h3>
        <p>Status: Active</p>
        <p>Last updated: ${formatTime(new Date().toISOString())}</p>
      `;
      return div;
    }

    div.innerHTML = `
      <h3 class="font-bold mb-1">Trip Details</h3>
      <p>Driver: ${currentTrip.driver?.name || "Not available"}</p>
      <p>Vehicle: ${currentTrip.vehicle?.registration || "Not available"}</p>
      <p>Speed: ${location.speed || 0} km/h</p>
      <p>Last updated: ${formatTime(location.timestamp)}</p>
    `;

    return div;
  }, [currentTrip, location]);

  // Update map when location or maps loaded state changes
  useEffect(() => {
    if (mapsLoaded && location) {
      if (!mapInstanceRef.current) {
        setTimeout(() => {
          initializeMap();
        }, 100);
      } else {
        createOrUpdateMarker();
      }
    }
  }, [mapsLoaded, location, initializeMap, createOrUpdateMarker]);

  // Initialize maps on component mount
  useEffect(() => {
    if (
      apiKeyCheck.current?.valid ||
      mapConfigChecker.checkGoogleMapsApiKey().valid
    ) {
      loadGoogleMapsScript();
    } else {
      // Set fallback mode and continue
      setMapStatus("fallback");
    }
  }, [loadGoogleMapsScript]);

  // Load tracking data function
  const loadTrackingData = useCallback(async () => {
    if (!actualTrackingId) {
      setError("No tracking ID provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let tripResult;

      // Use the appropriate tracking service method based on type
      if (actualTrackingType === "child") {
        tripResult = await trackingService.getChildCurrentTrip(
          actualTrackingId,
          {
            allowMock: isDevelopment,
          }
        );
      } else if (actualTrackingType === "route") {
        // First try to get active trip for this route
        const { data: activeTrips } = await trackingService.getAllActiveTrips();

        const matchingTrip = activeTrips?.find(
          (trip) => trip.route?.id === actualTrackingId
        );

        if (matchingTrip) {
          tripResult = { data: matchingTrip, source: "query" };
        } else {
          // No active trip, use detailed API to get route data
          const cacheKey = `route_${actualTrackingId}`;
          const cachedRoute = await offlineManager.getFromIndexedDB(
            "routes",
            cacheKey
          );

          if (cachedRoute) {
            // Use cached route data to construct trip object
            tripResult = {
              data: {
                id: `mock-${Date.now()}`,
                status: "pending",
                route: cachedRoute,
                vehicle: { registration: "Pending assignment" },
                driver: { name: "Not assigned" },
              },
              source: "cache",
            };
          } else {
            // Generate mock data for development
            tripResult = {
              data: offlineManager.generateMockTrip(actualTrackingId),
              source: "mock",
              isMock: true,
            };
          }
        }
      } else {
        // Direct tracking ID
        tripResult = await trackingService.getTripDetails(actualTrackingId, {
          allowMock: isDevelopment,
        });
      }

      // Update tracking status
      setTrackingStatus({
        active: true,
        lastUpdate: new Date(),
        source: tripResult.source,
        isUsingMock: tripResult.isMock || false,
      });

      // Handle trip data
      if (tripResult.data) {
        setCurrentTrip(tripResult.data);

        // Extract and set location if available
        let locationData = null;

        // Try different location sources
        if (tripResult.data.tracking_data?.last_location) {
          const { coordinates } = tripResult.data.tracking_data.last_location;
          locationData = {
            latitude: coordinates[1],
            longitude: coordinates[0],
            speed: tripResult.data.tracking_data.speed || 0,
            timestamp:
              tripResult.data.tracking_data.last_location.timestamp ||
              new Date().toISOString(),
          };
        } else if (tripResult.data.vehicle?.current_location) {
          // Parse PostGIS point from vehicle
          const coords = trackingService.parsePostgisPoint(
            tripResult.data.vehicle.current_location
          );

          if (coords) {
            locationData = {
              ...coords,
              speed: tripResult.data.vehicle.speed || 0,
              timestamp:
                tripResult.data.vehicle.location_updated_at ||
                new Date().toISOString(),
            };
          }
        }

        if (locationData) {
          setLocation(locationData);

          // Trigger callback if provided
          if (onLocationUpdate) {
            onLocationUpdate(locationData);
          }
        } else if (isDevelopment) {
          // In development, use mock location if no real location available
          const mockLocation = offlineManager.generateLocation(
            null,
            tripResult.data.vehicle?.id
          );

          setLocation(mockLocation);

          if (onLocationUpdate) {
            onLocationUpdate(mockLocation);
          }

          console.log("Using mock location data");
        } else {
          // Use default center if no location available
          setLocation({
            latitude: DEFAULT_CENTER.lat,
            longitude: DEFAULT_CENTER.lng,
            speed: 0,
            timestamp: new Date().toISOString(),
          });
        }

        // Clear error if we have data
        setError(null);
      } else {
        // No data found, but we may have errors
        setError(tripResult.error || "No data available for this tracking ID");
        console.warn("Tracking data error:", tripResult.error);

        // Use default location for map
        setLocation({
          latitude: DEFAULT_CENTER.lat,
          longitude: DEFAULT_CENTER.lng,
          speed: 0,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Failed to load tracking data:", err);
      setError(`Tracking error: ${err.message || "Unknown error"}`);

      // Use default location
      setLocation({
        latitude: DEFAULT_CENTER.lat,
        longitude: DEFAULT_CENTER.lng,
        speed: 0,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, [actualTrackingId, actualTrackingType, isDevelopment, onLocationUpdate]);

  // Load tracking data when component mounts or tracking ID changes
  useEffect(() => {
    loadTrackingData();

    // Set up polling for updates
    const interval = setInterval(() => {
      if (!isOffline && actualTrackingId) {
        loadTrackingData();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [actualTrackingId, isOffline, loadTrackingData]);

  // Show loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 w-full">
        <LoadingSpinner size="lg" />
        <span className="ml-2">Loading tracking data...</span>
      </div>
    );
  }

  // Map fallback mode
  if (
    (mapStatus === "fallback" || mapStatus === "apikey-missing") &&
    location
  ) {
    return (
      <div className="live-tracking-container h-96 w-full">
        {isOffline && (
          <div className="bg-amber-100 border-l-4 border-amber-500 p-4 mb-4">
            <p className="text-amber-700">
              You are currently offline. Displaying last known information.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 p-2 mb-2 text-sm">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {mapStatus === "apikey-missing" && (
          <div className="mb-2 p-2 bg-yellow-100 text-yellow-800 rounded text-sm">
            Google Maps API key is missing or invalid. Using simplified view.
          </div>
        )}

        <InlineMapFallback
          location={location}
          onRetry={loadTrackingData}
          isRetrying={loading}
          tripInfo={currentTrip}
        />

        {/* Trip information */}
        {currentTrip && (
          <div className="trip-info mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-bold text-lg mb-2">Current Trip</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p>
                  <span className="font-medium">Route:</span>{" "}
                  {currentTrip.route?.name || "Not available"}
                </p>
                <p>
                  <span className="font-medium">Driver:</span>{" "}
                  {currentTrip.driver?.name || "Not available"}
                </p>
                <p>
                  <span className="font-medium">Vehicle:</span>{" "}
                  {currentTrip.vehicle?.registration || "Not available"}
                </p>
              </div>
              <div>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={`font-semibold ${
                      currentTrip.status === "completed"
                        ? "text-green-600"
                        : currentTrip.status === "cancelled"
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  >
                    {formatStatus(currentTrip.status)}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Started:</span>{" "}
                  {formatTime(currentTrip.start_time)}
                </p>
                <p>
                  <span className="font-medium">Estimated arrival:</span>{" "}
                  {formatTime(currentTrip.estimated_arrival)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              {currentTrip.driver?.phone && (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => window.open(`tel:${currentTrip.driver.phone}`)}
                >
                  Contact Driver
                </button>
              )}
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                onClick={() => {
                  setLoading(true);
                  loadTrackingData();
                }}
              >
                Refresh Data
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main render with map
  return (
    <div className="live-tracking-container h-96 w-full">
      {isOffline && (
        <div className="bg-amber-100 border-l-4 border-amber-500 p-4 mb-4">
          <p className="text-amber-700">
            You are currently offline. Displaying last known information.
          </p>
        </div>
      )}

      {trackingStatus.isUsingMock && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-2 mb-2 text-sm">
          <p className="text-yellow-800">
            Using demo data for display purposes.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 p-2 mb-2 text-sm">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Map container */}
      <div
        ref={mapRef}
        className="rounded-lg border border-gray-300"
        style={mapContainerStyle}
      >
        {!mapsLoaded && (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p>Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Trip information */}
      {currentTrip && (
        <div className="trip-info mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-bold text-lg mb-2">Current Trip</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p>
                <span className="font-medium">Route:</span>{" "}
                {currentTrip.route?.name || "Not available"}
              </p>
              <p>
                <span className="font-medium">Driver:</span>{" "}
                {currentTrip.driver?.name || "Not available"}
              </p>
              <p>
                <span className="font-medium">Vehicle:</span>{" "}
                {currentTrip.vehicle?.registration || "Not available"}
              </p>
            </div>
            <div>
              <p>
                <span className="font-medium">Status:</span>{" "}
                <span
                  className={`font-semibold ${
                    currentTrip.status === "completed"
                      ? "text-green-600"
                      : currentTrip.status === "cancelled"
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {formatStatus(currentTrip.status)}
                </span>
              </p>
              <p>
                <span className="font-medium">Started:</span>{" "}
                {formatTime(currentTrip.start_time)}
              </p>
              <p>
                <span className="font-medium">Estimated arrival:</span>{" "}
                {formatTime(currentTrip.estimated_arrival)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex space-x-2">
            {currentTrip.driver?.phone && (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => window.open(`tel:${currentTrip.driver.phone}`)}
              >
                Contact Driver
              </button>
            )}
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              onClick={() => {
                setLoading(true);
                loadTrackingData();
              }}
            >
              Refresh Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTracking;
