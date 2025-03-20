// src/components/dashboard/dashboard-modules/driver/DriverRouteMap.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import supabase from "../../../../lib/supabase";
import LoadingSpinner from "../../../common/LoadingSpinner";
import { toast } from "react-toastify";
import mapEmergencyFix from "../../../../utils/mapEmergencyFix";
import offlineManager from "../../../../utils/enhancedOfflineManager";

// Default center (Johannesburg)
const defaultCenter = { lat: -26.2041, lng: 28.0473 };

/**
 * Generate a mock location for fallback purposes
 * @param {Object} baseLocation - Optional base location to vary slightly
 * @returns {Object} - Generated location object
 */
const generateFallbackLocation = (baseLocation = null) => {
  if (baseLocation) {
    // Slightly vary the existing location
    return {
      latitude: baseLocation.latitude + (Math.random() - 0.5) * 0.005,
      longitude: baseLocation.longitude + (Math.random() - 0.5) * 0.005,
      speed: Math.floor(Math.random() * 25) + 10,
      timestamp: new Date().toISOString(),
    };
  }

  // Default to Johannesburg coordinates
  return {
    latitude: defaultCenter.lat,
    longitude: defaultCenter.lng,
    speed: Math.floor(Math.random() * 25) + 10,
    timestamp: new Date().toISOString(),
  };
};

const DriverRouteMap = ({
  routeId,
  stops = [],
  vehicleId,
  activeStopIndex = 0,
  currentLocation = null,
  onLoadingStart = () => {},
  onLoadingComplete = () => {},
  onMapError = () => {},
  onMapFailure = () => {},
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [directions, setDirections] = useState(null);
  const [stopMarkers, setStopMarkers] = useState([]);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  const [mapStatus, setMapStatus] = useState("loading");
  const [routeData, setRouteData] = useState(null);
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const stopMarkersRef = useRef([]);
  const initTimeoutRef = useRef(null);
  const polylineRef = useRef(null);

  const mapContainerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "8px",
  };

  // Initialize offline support on app startup
  useEffect(() => {
    offlineManager.initializeOfflineSupport();
  }, []);

  // Fetch route data with offline support
  const fetchRouteData = async (routeId) => {
    const { data, source, isFallback } =
      await offlineManager.fetchWithOfflineSupport("routes", {
        filters: { id: routeId },
      });

    if (data) {
      setRouteData(data);
      if (isFallback) {
        setUsingFallbackData(true);
      }
    }
  };

  // Call loading started when component mounts
  useEffect(() => {
    onLoadingStart();
    fetchRouteData(routeId);
  }, [onLoadingStart, routeId]);

  // Emergency map fix useEffect
  useEffect(() => {
    if (loading && mapRef.current && stops.length > 0) {
      const emergencyTimer = setTimeout(async () => {
        console.log("Applying emergency map fix for route map");
        try {
          // Format stops for emergency map
          const formattedStops = stops.map((stop) => ({
            name: stop.name || "Stop",
            coordinates: stop.coordinates,
            isDestination: stop.isDestination,
          }));

          const emergencyMap = await mapEmergencyFix.createEmergencyMap(
            mapRef.current,
            formattedStops
          );
          if (emergencyMap) {
            setMapReady(true);
            setLoading(false);
            setMapStatus("ready");
            onLoadingComplete();

            // Update vehicle position if we have location data
            if (currentLocation) {
              emergencyMap.updateVehiclePosition(
                currentLocation.latitude,
                currentLocation.longitude
              );
            }

            // Store emergency map reference
            window.emergencyRouteMap = emergencyMap;

            console.log("Emergency route map loaded successfully");
            toast.info("Using simplified map due to data loading issues");
          }
        } catch (err) {
          console.error("Emergency route map fix failed:", err);
          setMapStatus("fallback");
          setLoading(false);
          onMapFailure();
        }
      }, 5000); // Try emergency fix after 5 seconds

      return () => clearTimeout(emergencyTimer);
    }
  }, [loading, stops, currentLocation, onLoadingComplete, onMapFailure]);

  // Safely initialize map with container existence check
  const initializeMap = useCallback(() => {
    // Clear any existing timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }

    // Explicit check for map container existence
    if (!mapRef.current) {
      console.warn("Map container not available yet, scheduling retry...");

      // Force fallback after 3 attempts
      if (initializationAttempts >= 2) {
        console.error(
          "Map initialization failed after multiple attempts, using fallback"
        );
        setMapStatus("fallback"); // This should trigger your fallback UI
        onMapFailure(); // Call the callback to trigger fallback in parent
        return;
      }

      // Schedule another attempt with exponential backoff
      const delay = Math.min(1000 * (1 + initializationAttempts), 2000);
      initTimeoutRef.current = setTimeout(() => {
        setInitializationAttempts((prev) => prev + 1);
        initializeMap();
      }, delay);
      return;
    }

    if (!window.google || !window.google.maps) {
      console.warn("Google Maps API not available, loading script...");
      loadGoogleMapsScript();
      return;
    }

    try {
      const googleMaps = window.google.maps;

      console.log("Initializing map with container:", mapRef.current);

      // Create new map instance
      const mapOptions = {
        center: currentLocation
          ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
          : defaultCenter,
        zoom: 14,
        fullscreenControl: true,
        mapTypeControl: true,
        streetViewControl: false,
        zoomControl: true,
        gestureHandling: "cooperative",
      };

      const map = new googleMaps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;

      // Wait for map to be ready before proceeding
      googleMaps.event.addListenerOnce(map, "idle", () => {
        console.log("Map fully initialized and ready");
        setMapReady(true);
        setMapStatus("ready"); // Update map status
        onLoadingComplete(); // Signal to parent that map is ready

        // Create driver marker if we have location
        if (currentLocation) {
          createOrUpdateDriverMarker();
        }

        // Create direction renderer
        const directionsRenderer = new googleMaps.DirectionsRenderer({
          suppressMarkers: true, // We'll create our own markers
          preserveViewport: true,
          polylineOptions: {
            strokeColor: "#4285F4",
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        });
        directionsRenderer.setMap(map);
        directionsRendererRef.current = directionsRenderer;

        // Create stop markers
        createStopMarkers();

        // Calculate and display route
        if (stops && stops.length > 1) {
          calculateRoute();
        }
      });

      setLoading(false);
    } catch (err) {
      console.error("Error initializing map:", err);
      setError(`Map initialization failed: ${err.message}`);
      setMapStatus("error");
      setLoading(false);
      onMapError(); // Signal error to parent
    }
  }, [
    currentLocation,
    stops,
    initializationAttempts,
    onLoadingComplete,
    onMapError,
    onMapFailure,
  ]);

  // Load Google Maps script
  const loadGoogleMapsScript = useCallback(() => {
    if (window.google && window.google.maps) {
      console.log("Google Maps already loaded");
      initializeMap();
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn("Missing Google Maps API key");
      setError("Google Maps API key not configured");
      setMapStatus("error");
      setLoading(false);
      onMapError();
      return;
    }

    console.log("Loading Google Maps script...");

    // Create script element
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,directions,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("Google Maps script loaded successfully");
      // Short delay to ensure everything is ready
      setTimeout(() => {
        initializeMap();
      }, 100);
    };

    script.onerror = (e) => {
      console.error("Failed to load Google Maps script:", e);
      setError(
        "Failed to load Google Maps. Check your internet connection and API key."
      );
      setMapStatus("error");
      setLoading(false);
      onMapError();
    };

    document.head.appendChild(script);

    return () => {
      // Clean up script if component unmounts during loading
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [initializeMap, onMapError]);

  // Create driver marker
  const createOrUpdateDriverMarker = useCallback(() => {
    if (
      !window.google ||
      !window.google.maps ||
      !mapInstanceRef.current ||
      !currentLocation
    ) {
      return;
    }

    const newPosition = {
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
    };

    // If marker doesn't exist, create it
    if (!markerRef.current) {
      const marker = new window.google.maps.Marker({
        position: newPosition,
        map: mapInstanceRef.current,
        title: "Your Location",
        icon: {
          url: "/assets/bus-icon.png",
          scaledSize: new window.google.maps.Size(48, 48),
          anchor: new window.google.maps.Point(24, 24),
        },
        zIndex: 1000, // Make sure driver marker is on top
      });

      markerRef.current = marker;
    } else {
      // Update existing marker
      markerRef.current.setPosition(newPosition);
    }

    // Center map on marker if tracking is enabled
    if (isLocationTracking) {
      mapInstanceRef.current.panTo(newPosition);
    }
  }, [currentLocation, isLocationTracking]);

  // Create markers for each stop
  const createStopMarkers = useCallback(() => {
    if (
      !window.google ||
      !window.google.maps ||
      !mapInstanceRef.current ||
      !stops
    ) {
      return;
    }

    // Clear existing markers
    stopMarkersRef.current.forEach((marker) => marker.setMap(null));
    stopMarkersRef.current = [];

    const markers = stops
      .map((stop, index) => {
        // Skip if no position
        if (!stop.coordinates) return null;

        // Determine marker color based on status
        let markerIcon = {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: getStatusColor(stop.status, index, activeStopIndex),
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#FFFFFF",
          scale: 12,
        };

        if (stop.isDestination || index === stops.length - 1) {
          // Special marker for final destination
          markerIcon = {
            url: "/assets/school-icon.png",
            scaledSize: new window.google.maps.Size(36, 36),
            anchor: new window.google.maps.Point(18, 18),
          };
        }

        // Create marker
        const marker = new window.google.maps.Marker({
          position: stop.coordinates,
          map: mapInstanceRef.current,
          title: stop.name,
          icon: markerIcon,
          label: {
            text: (index + 1).toString(),
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: "bold",
          },
          zIndex: 100 - index, // Higher index for earlier stops
        });

        // Create info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
          <div class="p-3">
            <h3 class="font-bold mb-1">${stop.name}</h3>
            <p>${stop.address}</p>
            <p>${stop.time || ""}</p>
            <p><b>${stop.students || 0} students</b></p>
          </div>
        `,
        });

        // Add click listener
        marker.addListener("click", () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });

        return marker;
      })
      .filter(Boolean);

    stopMarkersRef.current = markers;
    setStopMarkers(markers);
  }, [stops, activeStopIndex]);

  // Calculate route
  const calculateRoute = useCallback(() => {
    if (
      !window.google ||
      !window.google.maps ||
      !directionsRendererRef.current ||
      !stops ||
      stops.length < 2
    ) {
      return;
    }

    try {
      const directionsService = new window.google.maps.DirectionsService();

      // Create waypoints
      const waypoints = stops
        .slice(1, stops.length - 1)
        .map((stop) => {
          if (!stop.coordinates) return null;

          return {
            location: stop.coordinates,
            stopover: true,
          };
        })
        .filter(Boolean);

      // Origin (first stop)
      const origin = stops[0].coordinates;

      // Destination (last stop)
      const destination = stops[stops.length - 1].coordinates;

      if (!origin || !destination) {
        console.error("Missing origin or destination coordinates");
        return;
      }

      // Request directions
      directionsService.route(
        {
          origin,
          destination,
          waypoints,
          optimizeWaypoints: false,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            directionsRendererRef.current.setDirections(result);
            setDirections(result);
          } else {
            console.error("Directions request failed:", status);

            // Create a simplified fallback route
            createFallbackRoute();

            if (status === "REQUEST_DENIED") {
              toast.error(
                "Map directions access denied. Check API key configuration."
              );
            } else {
              toast.error(
                "Failed to calculate route. Using simplified display."
              );
            }
          }
        }
      );
    } catch (err) {
      console.error("Error calculating route:", err);
      createFallbackRoute(); // Use fallback if API fails
    }
  }, [stops]);

  // Create a fallback route when directions API fails
  const createFallbackRoute = useCallback(() => {
    if (
      !window.google?.maps ||
      !mapInstanceRef.current ||
      !stops ||
      stops.length < 2
    ) {
      return;
    }

    try {
      // Remove existing polyline if any
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }

      // Create a path of all stop coordinates
      const path = stops
        .filter((stop) => stop.coordinates)
        .map((stop) => ({
          lat: stop.coordinates.lat,
          lng: stop.coordinates.lng,
        }));

      // Create a basic polyline
      const polyline = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: "#4285F4",
        strokeOpacity: 0.8,
        strokeWeight: 5,
      });

      polyline.setMap(mapInstanceRef.current);
      polylineRef.current = polyline;

      // Fit bounds to show all stops
      const bounds = new window.google.maps.LatLngBounds();
      path.forEach((point) => bounds.extend(point));
      mapInstanceRef.current.fitBounds(bounds);

      toast.info("Using simplified route display");
    } catch (err) {
      console.error("Failed to create fallback route:", err);
    }
  }, [stops]);

  // Helper function to get color based on stop status
  const getStatusColor = (status, index, activeIndex) => {
    if (status === "completed") return "#34D399"; // Green
    if (status === "active" || index === activeIndex) return "#3B82F6"; // Blue for active
    return "#9CA3AF"; // Gray for upcoming
  };

  // Update vehicle location in database (if needed)
  const updateVehicleLocation = async (
    vehicleId,
    latitude,
    longitude,
    speed
  ) => {
    if (!vehicleId) return;

    try {
      // Format location as PostGIS point
      const pointLocation = `POINT(${longitude} ${latitude})`;

      // Update vehicle location
      const { error } = await supabase
        .from("vehicles")
        .update({
          current_location: pointLocation,
          speed: speed || 0,
          location_updated_at: new Date().toISOString(),
        })
        .eq("id", vehicleId);

      if (error) {
        console.warn("Error updating vehicle location:", error);
      }
    } catch (err) {
      console.warn("Error updating vehicle location:", err);
    }
  };

  // Helper to generate a fallback error display
  const FallbackDisplay = () => (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <div className="flex flex-col items-center justify-center h-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-amber-500 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>

        <h3 className="text-lg font-bold text-gray-800 mb-2">
          Map Unavailable
        </h3>
        <p className="text-gray-600 mb-6 text-center">
          Unable to load the interactive map. Displaying simplified route
          information.
        </p>

        <div className="w-full bg-blue-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-900 mb-2">Route Information:</h4>
          <div className="space-y-2">
            {stops.map((stop, index) => (
              <div
                key={index}
                className={`p-3 rounded-md ${
                  index === activeStopIndex
                    ? "bg-blue-100 border-l-4 border-blue-500"
                    : index < activeStopIndex
                    ? "bg-green-50 border-l-4 border-green-500"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                      index === activeStopIndex
                        ? "bg-blue-500 text-white"
                        : index < activeStopIndex
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <h5 className="font-medium">
                      {stop.name || `Stop ${index + 1}`}
                    </h5>
                    <p className="text-sm">
                      {stop.address || "No address available"}
                    </p>
                    {stop.time && (
                      <p className="text-sm text-gray-500">{stop.time}</p>
                    )}
                  </div>
                </div>
                {stop.students > 0 && (
                  <div className="mt-1 text-sm">
                    <span className="font-medium">{stop.students}</span>{" "}
                    {stop.students === 1 ? "student" : "students"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={() => {
            setError(null);
            setMapStatus("loading");
            setInitializationAttempts(0);
            setLoading(true);
            onLoadingStart();
            initializeMap();
          }}
        >
          Retry Loading Map
        </button>
      </div>
    </div>
  );

  // Initialize map with a delay to ensure container is ready
  useEffect(() => {
    // Delay initialization slightly to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeMap();
    }, 300);

    return () => {
      clearTimeout(timer);
      // Also clear any pending initialization timeout
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [initializeMap]);

  // Automatic fallback if loading takes too long
  useEffect(() => {
    // Set a timer to switch to fallback mode if loading takes too long
    const fallbackTimer = setTimeout(() => {
      if (loading && mapStatus === "loading") {
        console.log("Loading timeout reached, switching to fallback mode");
        setMapStatus("fallback");
        setLoading(false);
        onMapFailure();
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(fallbackTimer);
  }, [loading, mapStatus, onMapFailure]);

  // Update when stops or active stop changes
  useEffect(() => {
    if (
      mapReady &&
      window.google &&
      window.google.maps &&
      mapInstanceRef.current
    ) {
      createStopMarkers();
      calculateRoute();
    }
  }, [stops, activeStopIndex, createStopMarkers, calculateRoute, mapReady]);

  // Update driver marker when location changes
  useEffect(() => {
    if (
      mapReady &&
      window.google &&
      window.google.maps &&
      mapInstanceRef.current &&
      currentLocation
    ) {
      createOrUpdateDriverMarker();

      // Update vehicle location in database if needed
      if (vehicleId) {
        updateVehicleLocation(
          vehicleId,
          currentLocation.latitude,
          currentLocation.longitude,
          currentLocation.speed
        );
      }
    }

    // If using emergency map, update vehicle position
    if (currentLocation && window.emergencyRouteMap) {
      window.emergencyRouteMap.updateVehiclePosition(
        currentLocation.latitude,
        currentLocation.longitude
      );
    }
  }, [currentLocation, createOrUpdateDriverMarker, vehicleId, mapReady]);

  // Ensure map failure is called on error
  useEffect(() => {
    if (error) {
      onMapError();
    }
  }, [error, onMapError]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current && window.google?.maps) {
        // Remove listeners and clean up resources
        window.google.maps.event.clearInstanceListeners(mapInstanceRef.current);
      }

      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }

      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }

      stopMarkersRef.current.forEach((marker) => {
        if (marker) marker.setMap(null);
      });
    };
  }, []);

  // Show loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
        <span>Loading map...</span>
      </div>
    );
  }

  // Show fallback component when map can't be loaded
  if (mapStatus === "fallback") {
    return <FallbackDisplay />;
  }

  // Show error
  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
        <button
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={() => {
            setError(null);
            setInitializationAttempts(0);
            setLoading(true);
            setMapStatus("loading");
            onLoadingStart();
            initializeMap();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Render map
  return (
    <div className="route-map-container h-full w-full relative">
      <div
        ref={mapRef}
        className="rounded-lg border border-gray-300 shadow-sm"
        style={mapContainerStyle}
      ></div>

      {/* Map controls */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        <button
          className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
          onClick={() => {
            if (currentLocation && mapInstanceRef.current) {
              mapInstanceRef.current.panTo({
                lat: currentLocation.latitude,
                lng: currentLocation.longitude,
              });
              mapInstanceRef.current.setZoom(16);
              setIsLocationTracking(true);
            }
          }}
          title="Center on my location"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        <button
          className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
          onClick={() => {
            if (mapInstanceRef.current && stops.length > 0) {
              const bounds = new window.google.maps.LatLngBounds();
              stops.forEach((stop) => {
                if (stop.coordinates) {
                  bounds.extend(stop.coordinates);
                }
              });
              mapInstanceRef.current.fitBounds(bounds);
              setIsLocationTracking(false);
            }
          }}
          title="Show full route"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DriverRouteMap;
