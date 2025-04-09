// src/components/dashboard/dashboard-modules/LiveTracking.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useLocation } from 'react-router-dom';
import { toast } from "react-toastify";
import trackingService from "../../../services/trackingService";
import LoadingSpinner from "@components/common/LoadingSpinner";
import ErrorAlert from "@components/common/ErrorAlert";
import MapErrorBoundary from "@components/common/MapErrorBoundary";
import mapConfigChecker from "../../../utils/mapConfigChecker";
import offlineManager from "../../../utils/enhancedOfflineManager";
import locationFallback from "../../../utils/locationFallback";
import { loadGoogleMapsScript, initializeMapWithFallback, createMapFallback } from "../../../utils/mapUtils";
import "../../../styles/premium-styles.css";

// Map container styles
const mapContainerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "300px",
  maxHeight: "50vh", // Use viewport height to ensure responsive sizing
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
  trackingId: propTrackingId,
  trackingType = "child",
  onLocationUpdate,
  enableInfoWindow = true,
  routeId,
  userType,
  childId,
  defaultLocation = { lat: -26.2041, lng: 28.0473 }, // Add default location prop
}) => {
  // Determine if in development mode
  const isDevelopment =
    import.meta.env.DEV || import.meta.env.MODE === "development";

  // Get URL params and location for tracking ID extraction
  const params = useParams();
  const routerLocation = useLocation();
  
  // Extract tracking ID from URL params, query params, or props
  const getTrackingId = () => {
    // First try from props
    if (propTrackingId) return propTrackingId;
    
    // Then try from URL params
    if (params.trackingId) return params.trackingId;
    
    // Then try from query params
    const queryParams = new URLSearchParams(routerLocation.search);
    const urlTrackingId = queryParams.get('id') || queryParams.get('trackingId');
    if (urlTrackingId) return urlTrackingId;
    
    // If routeId or childId was provided directly
    if (routeId) return routeId;
    if (childId) return childId;
    
    // If user is logged in, try to get from user's default child
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.children && user.children.length > 0) {
          return user.children[0].trackingId || user.children[0].id;
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    return null;
  };
  
  // Get the final tracking ID and type
  const actualTrackingId = getTrackingId();
  const actualTrackingType = propTrackingId
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
  const mapContainerRef = useRef(null);

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

  // Use the centralized Google Maps loading function from mapUtils
  const loadGoogleMapsScript = useCallback(() => {
    // If already loaded, use existing instance
    if (window.google && window.google.maps) {
      googleMapsRef.current = window.google.maps;
      setMapsLoaded(true);
      return Promise.resolve(window.google.maps);
    }

    // Check for API key availability
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("Cannot load Google Maps: Missing API key");
      setMapStatus("apikey-missing");
      setLoading(false);
      return Promise.reject(new Error("Missing API key"));
    }

    // Use the imported loadGoogleMapsScript from mapUtils
    return loadGoogleMapsScript()
      .then(maps => {
        console.log("Google Maps loaded successfully through centralized loader");
        googleMapsRef.current = maps;
        setMapsLoaded(true);
        return maps;
      })
      .catch(error => {
        console.error("Failed to load Google Maps:", error);
        setError("Failed to load Google Maps. Check your internet connection.");
        setLoading(false);
        setMapStatus("fallback");
        throw error;
      });
  }, []);

  // Add a helper function to build the custom marker element
  const buildCustomMarkerElement = useCallback(() => {
    const element = document.createElement("div");
    element.className = "vehicle-marker";
    element.style.position = "relative";

    // Create a container for the icon
    const iconContainer = document.createElement("div");
    iconContainer.style.backgroundColor = "#4285F4";
    iconContainer.style.borderRadius = "50%";
    iconContainer.style.padding = "6px";
    iconContainer.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    iconContainer.style.width = "40px";
    iconContainer.style.height = "40px";
    iconContainer.style.display = "flex";
    iconContainer.style.justifyContent = "center";
    iconContainer.style.alignItems = "center";

    // Try to use custom icon image
    const iconImg = document.createElement("img");
    iconImg.src = "/assets/bus-icon.png";
    iconImg.style.width = "28px";
    iconImg.style.height = "28px";
    iconImg.style.objectFit = "contain";

    // Fallback if image fails to load
    iconImg.onerror = () => {
      iconImg.remove();
      iconContainer.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="28" height="28">
          <path d="M4 16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v8zm2-1V9h12v6H6zm0-10h5v2H6V5zm12 0h-5v2h5V5zM6 19h5v2H6v-2zm7 0h5v2h-5v-2z"/>
        </svg>
      `;
    };

    iconContainer.appendChild(iconImg);
    element.appendChild(iconContainer);

    // Add speed indicator if available
    if (location?.speed) {
      const speedBadge = document.createElement("div");
      speedBadge.textContent = `${Math.round(location.speed)} km/h`;
      speedBadge.style.position = "absolute";
      speedBadge.style.bottom = "-10px";
      speedBadge.style.right = "-5px";
      speedBadge.style.backgroundColor = "#fff";
      speedBadge.style.color = "#333";
      speedBadge.style.fontSize = "10px";
      speedBadge.style.fontWeight = "bold";
      speedBadge.style.padding = "2px 5px";
      speedBadge.style.borderRadius = "10px";
      speedBadge.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
      element.appendChild(speedBadge);
    }

    return element;
  }, [location]);

  // Create info window content - moved up for proper reference order
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

  // Load the marker icon - move this up
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

  // Create info window - move this up
  const createInfoWindow = useCallback(
    (marker) => {
      if (!window.google || !window.google.maps || !marker) return;

      const infoWindow = new window.google.maps.InfoWindow({
        content: createInfoWindowContent(),
      });

      // Add click listener to marker
      marker.addListener("click", () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });

      infoWindowRef.current = infoWindow;
    },
    [createInfoWindowContent]
  );

  // Initialize map after script loads using enhanced function from mapUtils
  const initializeMap = useCallback(() => {
    if (!window.google || !window.google.maps || !mapRef.current) {
      console.warn("Cannot initialize map: Dependencies not loaded");
      return;
    }

    try {
      // Use initializeMapWithFallback from mapUtils for enhanced error handling
      initializeMapWithFallback({
        mapElement: mapRef.current,
        center: location
          ? { lat: location.latitude, lng: location.longitude }
          : defaultLocation,
        zoom: 15,
        markerPosition: location ? { lat: location.latitude, lng: location.longitude } : null,
        markerIcon: "/assets/bus-icon.png",
        onSuccess: (result) => {
          // Store map and marker instances
          mapInstanceRef.current = result.map;
          markerRef.current = result.marker;
          
          // Update map status to loaded
          setMapStatus("loaded");
        },
        onError: (error) => {
          console.error("Error initializing map:", error);
          setError(`Map initialization failed: ${error.message}`);
          setMapStatus("fallback");
        },
        abortSignal: null // Optional abort controller signal
      }).catch(err => {
        console.error("Error initializing map:", err);
        setError(`Map initialization failed: ${err.message}`);
        setMapStatus("fallback");
      });
    } catch (err) {
      console.error("Error initializing Google Maps:", err);
      setError(`Map initialization failed: ${err.message}`);
      setMapStatus("fallback");
    }
  }, [location, defaultLocation]);

  // Create or update marker - simplified since we now use initializeMapWithFallback
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

    // If we're using the marker created by initializeMapWithFallback
    if (markerRef.current) {
      // Update existing marker with proper type checking
      try {
        // For advanced marker
        if (
          markerRef.current.content &&
          typeof markerRef.current.position === "object"
        ) {
          markerRef.current.position = newPosition;
          
          // If the marker uses custom content, update it
          if (typeof buildCustomMarkerElement === 'function') {
            markerRef.current.content = buildCustomMarkerElement();
          }
        }
        // For standard marker
        else if (typeof markerRef.current.setPosition === "function") {
          markerRef.current.setPosition(newPosition);
        }

        // Update info window if it exists
        if (
          infoWindowRef.current &&
          typeof infoWindowRef.current.setContent === "function"
        ) {
          infoWindowRef.current.setContent(createInfoWindowContent());
        }
      } catch (err) {
        console.warn("Error updating marker:", err);
        
        // If marker update fails, try to recreate it
        try {
          // Clean up old marker first
          if (typeof markerRef.current.setMap === 'function') {
            markerRef.current.setMap(null);
          }
          
          // Fall back to standard marker
          fallbackToStandardMarker(newPosition);
        } catch (recreateErr) {
          console.error("Failed to recreate marker after update error:", recreateErr);
        }
      }
    } else {
      // Fall back to standard marker if the marker wasn't created by initializeMapWithFallback
      fallbackToStandardMarker(newPosition);
    }

    // Center map on marker
    try {
      mapInstanceRef.current.panTo(newPosition);
    } catch (err) {
      console.warn("Error panning map:", err);
    }
  }, [
    location,
    enableInfoWindow,
    buildCustomMarkerElement,
    createInfoWindowContent,
    fallbackToStandardMarker
  ]);

  // Helper function for fallback to standard marker
  const fallbackToStandardMarker = useCallback(
    (position) => {
      const marker = new window.google.maps.Marker({
        position: position,
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
    },
    [enableInfoWindow, loadMarkerIcon, createInfoWindow]
  );

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

  // Clean up map resources on unmount
  useEffect(() => {
    return () => {
      // Clean up info window if it exists
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      
      // Remove marker from map
      if (markerRef.current) {
        if (typeof markerRef.current.setMap === 'function') {
          markerRef.current.setMap(null);
        }
        markerRef.current = null;
      }
      
      // Clear map instance
      mapInstanceRef.current = null;
    };
  }, []);

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
          const mockLocation = locationFallback.generateLocation(
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
            latitude: defaultLocation.lat,
            longitude: defaultLocation.lng,
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
          latitude: defaultLocation.lat,
          longitude: defaultLocation.lng,
          speed: 0,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Failed to load tracking data:", err);
      setError(`Tracking error: ${err.message || "Unknown error"}`);

      // Use default location
      setLocation({
        latitude: defaultLocation.lat,
        longitude: defaultLocation.lng,
        speed: 0,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, [
    actualTrackingId,
    actualTrackingType,
    isDevelopment,
    onLocationUpdate,
    defaultLocation,
  ]);

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

  // Improve the loading spinner with more informative stages
  const EnhancedMapLoadingState = ({ stage = "map" }) => {
    const loadingMessages = {
      map: "Loading map service...",
      data: "Retrieving vehicle location...",
      marker: "Preparing tracking interface...",
    };

    return (
      <div className="flex flex-col items-center justify-center h-full bg-white p-6 rounded-lg">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          {stage === "data" && (
            <div className="absolute top-1 right-1 h-3 w-3 rounded-full bg-yellow-400 animate-pulse"></div>
          )}
          {stage === "marker" && (
            <div className="absolute top-1 right-1 h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
          )}
        </div>
        <p className="text-gray-700 font-medium mb-1">
          {loadingMessages[stage]}
        </p>
        <p className="text-xs text-gray-500 text-center">
          This may take a moment depending on your connection
        </p>
        <div className="mt-4 w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full animate-pulse"
            style={{
              width: stage === "map" ? "30%" : stage === "data" ? "60%" : "90%",
            }}
          ></div>
        </div>
      </div>
    );
  };

  // Show loading spinner
  if (loading) {
    const loadingStage = !mapsLoaded ? "map" : !location ? "data" : "marker";
    return <EnhancedMapLoadingState stage={loadingStage} />;
  }

  // Map fallback mode
  if (
    mapStatus === "fallback" ||
    mapStatus === "error" ||
    mapStatus === "apikey-missing"
  ) {
    return (
      <div className="live-tracking-container h-96 w-full">
        {isOffline && (
          <div className="bg-amber-100 border-l-4 border-amber-500 p-3 mb-3 rounded-r-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-amber-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  You are currently offline. Displaying last known information.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">
              {trackingType === "child"
                ? "Student Location"
                : "Vehicle Location"}
            </h2>
            <p className="text-sm text-gray-600">
              {mapStatus === "apikey-missing"
                ? "Map service not configured properly"
                : isOffline
                ? "Offline mode - limited functionality"
                : "Map service unavailable"}
            </p>
          </div>

          <div ref={mapContainerRef} className="h-64 w-full">
            {/* Fallback will be created here by locationFallback */}
            <InlineMapFallback 
              location={location}
              tripInfo={currentTrip}
              onRetry={() => {
                setLoading(true);
                loadTrackingData();
                loadGoogleMapsScript();
              }}
              isRetrying={loading}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 mb-16">
      {/* Offline notice */}
      {isOffline && (
        <div className="glass-card shadow-colored bg-amber-50 border-l-4 border-amber-500 p-3 mb-3 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-500 pulse"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700 font-medium">
                You are currently offline. Displaying last known information.
              </p>
            </div>
          </div>
        </div>
      )}

      {trackingStatus.isUsingMock && (
        <div className="glass-card shadow-soft bg-blue-50 border-l-4 border-blue-300 p-3 mb-3 rounded-md">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-blue-800 font-medium">
              Using demo data for display purposes.
            </p>
          </div>
        </div>
      )}

      {/* Error display - only show if not showing offline notice */}
      {error && !isOffline && (
        <div className="glass-card shadow-colored border-l-4 border-red-500 p-4 mb-4 rounded-md bg-red-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-medium">{error}</p>
              <p className="text-xs text-red-500 mt-1">Try refreshing the page or checking your connection.</p>
            </div>
          </div>
        </div>
      )}

      {/* Map container with premium styling */}
      <div className="premium-card relative overflow-hidden shadow-layered" style={{ height: "450px", maxHeight: "55vh", minHeight: "350px" }}>
        <div className="card-highlight"></div>
        <div className="absolute top-0 left-0 right-0 z-10 p-3">
          <div className="glass-nav backdrop-blur-lg bg-white bg-opacity-50 rounded-full shadow-soft px-4 py-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-blue-800">Live Tracking {actualTrackingId && <span className="ml-2 text-sm text-gray-500">#{actualTrackingId}</span>}</span>
            {location && (
              <span className="ml-auto text-sm text-blue-600">
                {location.timestamp ? `Updated: ${formatTime(location.timestamp)}` : ""}
              </span>
            )}
          </div>
        </div>
        
        <div ref={mapRef} style={{ height: "100%", width: "100%" }}></div>
        
        {/* Loading overlay with premium styling */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center glass-card dark p-6 shadow-layered">
              <div className="premium-loader mb-4"></div>
              <span className="mt-2 text-white font-medium">Loading live tracking map...</span>
              <p className="text-xs text-blue-200 mt-1">Please wait while we establish connection</p>
            </div>
          </div>
        )}
      </div>

      {/* Trip details section with premium styling */}
      <div className="glass-card shadow-layered p-4 mb-8">
        {location ? (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Tracking Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="premium-card hover-lift transition-all p-3 rounded-md">
                <p className="text-sm text-blue-600 font-semibold">User</p>
                <p className="font-medium">{currentTrip?.child?.name || "User information unavailable"}</p>
              </div>
              <div className="premium-card hover-lift transition-all p-3 rounded-md">
                <p className="text-sm text-blue-600 font-semibold">Status</p>
                <p className="font-medium flex items-center">
                  <span className="h-2 w-2 bg-green-500 rounded-full mr-2 pulse"></span>
                  {currentTrip?.status ? formatStatus(currentTrip.status) : "En Route"}
                </p>
              </div>
              <div className="premium-card hover-lift transition-all p-3 rounded-md">
                <p className="text-sm text-blue-600 font-semibold">ETA</p>
                <p className="font-medium">{currentTrip?.estimated_arrival ? formatTime(currentTrip.estimated_arrival) : "Calculating..."}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="premium-card hover-lift transition-all p-3 rounded-md">
                <p className="text-sm text-blue-600 font-semibold">Driver</p>
                <p className="font-medium">{currentTrip?.driver?.name || "Driver information unavailable"}</p>
              </div>
              <div className="premium-card hover-lift transition-all p-3 rounded-md">
                <p className="text-sm text-blue-600 font-semibold">Vehicle</p>
                <p className="font-medium">{currentTrip?.vehicle?.registration || "Vehicle information unavailable"}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-600 font-semibold">Last Updated</p>
                <p className="text-xs">{location.timestamp ? new Date(location.timestamp).toLocaleTimeString() : "Unknown"}</p>
              </div>
              <button 
                className="btn-premium hover-lift text-xs px-3 py-1.5 rounded flex items-center"
                onClick={loadTrackingData}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-gray-500 font-medium">No active trip found</p>
            <p className="text-sm text-gray-400 mt-1">There are no currently tracked trips</p>
            <button 
              className="mt-4 btn-premium hover-lift text-sm px-4 py-2 rounded flex items-center mx-auto"
              onClick={loadTrackingData}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Check for Active Trips
            </button>
          </div>
        )}
      </div>
      
      {/* Live mode toggle button with premium styling */}
      <button 
        className="btn-premium hover-lift flex items-center justify-center fixed bottom-6 right-6 rounded-full w-auto px-6 py-3 z-50 shadow-layered"
        onClick={() => loadTrackingData()}
        aria-label="Refresh live tracking data"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
        Refresh Tracking
      </button>
    </div>
  );
};

export default LiveTracking;