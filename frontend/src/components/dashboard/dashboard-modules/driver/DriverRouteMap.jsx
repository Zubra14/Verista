// src/components/dashboard/dashboard-modules/driver/DriverRouteMap.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import supabase from "../../../../lib/supabase";
import LoadingSpinner from "../../../common/LoadingSpinner";
import { toast } from "react-toastify";
import mapEmergencyFix from "../../../../utils/mapEmergencyFix";
import offlineManager from "../../../../utils/enhancedOfflineManager";
import locationFallback from "../../../../utils/locationFallback";
import { createMapInstance, createMapMarker } from "@services/mapService";
import { loadGoogleMapsScript, initializeMapWithFallback } from "../../../../utils/mapUtils";
import { locationTracker } from "../../../../utils/locationUtils";

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const googleMapsMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "";

// Default center (Johannesburg)
const defaultCenter = { lat: -26.2041, lng: 28.0473 };

// Enhanced loading state component
const MapLoadingState = () => (
  <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50 rounded-lg border border-gray-200 p-6">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
    <p className="text-gray-700 font-medium">Loading interactive map...</p>
    <p className="text-xs text-gray-500 mt-2 text-center">
      This may take a moment depending on your connection speed
    </p>
    <div className="mt-4 w-full max-w-md">
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full animate-pulse"
          style={{ width: "60%" }}
        ></div>
      </div>
    </div>
    <p className="text-xs text-gray-400 mt-3">
      Loading Google Maps API and route information
    </p>
  </div>
);

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
  const [driverLocation, setDriverLocation] = useState(currentLocation);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const stopMarkersRef = useRef([]);
  const initTimeoutRef = useRef(null);
  const polylineRef = useRef(null);
  const locationTrackerRef = useRef(null);

  const mapContainerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "8px",
  };

  // Initialize offline support on app startup
  useEffect(() => {
    offlineManager.initializeOfflineSupport();
    
    // Check geolocation permission
    const checkPermission = async () => {
      try {
        const permission = await locationTracker.checkPermission();
        setLocationPermission(permission);
      } catch (err) {
        console.warn("Failed to check location permission:", err);
      }
    };
    
    checkPermission();
  }, []);
  
  // Handle location tracking
  useEffect(() => {
    // Start location tracking if not already tracking
    if (!isTrackingActive && mapReady) {
      const startTracking = async () => {
        try {
          // Try to get permission if not granted yet
          if (locationPermission !== 'granted') {
            const newPermission = await locationTracker.requestPermission();
            setLocationPermission(newPermission);
            
            if (newPermission !== 'granted') {
              // If permission denied, use provided location if available
              if (currentLocation) {
                setDriverLocation(currentLocation);
              }
              return;
            }
          }
          
          // Start tracking with the location tracker
          locationTrackerRef.current = locationTracker.startTracking(
            (location) => {
              // Update driver location when we get updates
              setDriverLocation(location);
              
              // Update database if we have a vehicle ID
              if (vehicleId) {
                updateVehicleLocation(
                  vehicleId,
                  location.latitude,
                  location.longitude,
                  location.speed
                );
              }
            },
            {
              enableHighAccuracy: true,
              updateInterval: 10000, // 10 seconds
              continuousUpdates: true,
              mockLocationInDev: import.meta.env.DEV && !navigator.geolocation,
              errorCallback: (error) => {
                console.warn("Location tracking error:", error);
                // Fall back to provided location if available
                if (currentLocation && !driverLocation) {
                  setDriverLocation(currentLocation);
                }
              }
            }
          );
          
          setIsTrackingActive(true);
        } catch (err) {
          console.error("Failed to start location tracking:", err);
          // Fall back to provided location
          if (currentLocation) {
            setDriverLocation(currentLocation);
          }
        }
      };
      
      startTracking();
    }
    
    // Cleanup function
    return () => {
      if (locationTrackerRef.current && locationTrackerRef.current.stop) {
        locationTrackerRef.current.stop();
        setIsTrackingActive(false);
      }
    };
  }, [mapReady, isTrackingActive, locationPermission, currentLocation, vehicleId]);

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
            if (driverLocation) {
              emergencyMap.updateVehiclePosition(
                driverLocation.latitude,
                driverLocation.longitude
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
  }, [loading, stops, driverLocation, onLoadingComplete, onMapFailure]);

  // Safely initialize map with container existence check using enhanced utilities
  const initializeMap = useCallback(async () => {
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
        setMapStatus("fallback");
        onMapFailure();
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

    try {
      console.log("Initializing map with container:", mapRef.current);

      // Create an AbortController for possible cancellation
      const abortController = new AbortController();
      
      // Use the enhanced initializeMapWithFallback function
      const mapResult = await initializeMapWithFallback({
        mapElement: mapRef.current,
        center: driverLocation
          ? { lat: driverLocation.latitude, lng: driverLocation.longitude }
          : defaultCenter,
        zoom: 14,
        markerPosition: driverLocation 
          ? { lat: driverLocation.latitude, lng: driverLocation.longitude }
          : null,
        markerIcon: "/assets/bus-icon.png",
        abortSignal: abortController.signal,
        onSuccess: (result) => {
          console.log("Map initialization successful");
        },
        onError: (error) => {
          console.error("Map initialization error in callback:", error);
        }
      });
      
      // Store map and marker instances
      mapInstanceRef.current = mapResult.map;
      markerRef.current = mapResult.marker;

      console.log("Map fully initialized and ready");
      setMapReady(true);
      setMapStatus("ready");
      onLoadingComplete();

      // Create driver marker if we have location and one wasn't created by initializeMapWithFallback
      if (driverLocation && !markerRef.current) {
        createOrUpdateDriverMarker();
      }

      // Create direction renderer
      if (window.google && window.google.maps) {
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true,
          preserveViewport: true,
          polylineOptions: {
            strokeColor: "#4285F4",
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        });
        directionsRenderer.setMap(mapResult.map);
        directionsRendererRef.current = directionsRenderer;

        // Create stop markers
        createStopMarkers();

        // Calculate and display route
        if (stops && stops.length > 1) {
          calculateRoute();
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("Error initializing map:", err);
      setError(`Map initialization failed: ${err.message}`);
      setMapStatus("error");
      setLoading(false);
      onMapError();
    }
  }, [
    driverLocation,
    stops,
    initializationAttempts,
    onLoadingComplete,
    onMapError,
    onMapFailure,
    createOrUpdateDriverMarker,
    createStopMarkers,
    calculateRoute
  ]);

  // Load Google Maps script using the imported loadGoogleMapsScript function
  const loadMapScript = useCallback(() => {
    // Don't load if already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Fix: Use import.meta.env instead of process.env for Vite
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    
    if (!apiKey) {
      console.error("Google Maps API key missing");
      setMapStatus("apikey-missing");
      setLoading(false);
      onMapFailure();
      return;
    }

    // Use the imported loadGoogleMapsScript function
    loadGoogleMapsScript()
      .then(() => {
        console.log("Google Maps loaded successfully through centralized loader");
        initializeMap();
      })
      .catch(error => {
        console.error("Failed to load Google Maps:", error);
        setError("Failed to load map service");
        setMapStatus("error");
        setLoading(false);
        onMapFailure();
      });

    return () => {
      // No cleanup needed here since the loadGoogleMapsScript handles cleanup
    };
  }, [initializeMap, onMapFailure]);

  // Helper function to create custom marker element for driver
  const buildDriverMarkerElement = useCallback(() => {
    const element = document.createElement("div");
    element.className = "vehicle-marker";

    // Create vehicle icon container
    const iconElement = document.createElement("div");
    iconElement.className = "bus-icon-container";
    iconElement.style.width = "48px";
    iconElement.style.height = "48px";
    iconElement.style.position = "relative";

    // Create the image element
    const imgElement = document.createElement("img");
    imgElement.src = "/assets/bus-icon.png";
    imgElement.style.width = "100%";
    imgElement.style.height = "100%";
    iconElement.appendChild(imgElement);

    // Add speed indicator if available
    if (driverLocation?.speed) {
      const speedBadge = document.createElement("div");
      speedBadge.className = "speed-badge";
      speedBadge.style.position = "absolute";
      speedBadge.style.bottom = "-10px";
      speedBadge.style.right = "-10px";
      speedBadge.style.backgroundColor = "#4285F4";
      speedBadge.style.color = "white";
      speedBadge.style.borderRadius = "10px";
      speedBadge.style.padding = "2px 6px";
      speedBadge.style.fontSize = "10px";
      speedBadge.style.fontWeight = "bold";
      speedBadge.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
      speedBadge.textContent = `${Math.round(driverLocation.speed)} km/h`;
      iconElement.appendChild(speedBadge);
    }

    element.appendChild(iconElement);
    return element;
  }, [driverLocation]);

  // Create driver marker
  const createOrUpdateDriverMarker = useCallback(() => {
    if (
      !window.google ||
      !window.google.maps ||
      !mapInstanceRef.current ||
      !driverLocation
    ) {
      return;
    }

    const newPosition = {
      lat: driverLocation.latitude,
      lng: driverLocation.longitude,
    };

    // If marker doesn't exist, create it
    if (!markerRef.current) {
      try {
        // Use dynamic import to get the mapService with AdvancedMarkerElement support
        import("@services/mapService")
          .then(async ({ createMapMarker }) => {
            const marker = await createMapMarker(
              mapInstanceRef.current,
              newPosition,
              {
                title: "Your Location",
                iconUrl: "/assets/bus-icon.png",
                iconSize: [48, 48],
                zIndex: 1000,
              }
            );

            markerRef.current = marker;
          })
          .catch((err) => {
            console.error("Failed to import map services:", err);
            // Fallback to standard marker logic (existing code)
          });
      } catch (err) {
        console.error("Error creating marker:", err);

        // Try a minimal marker as last resort - existing fallback code
        try {
          markerRef.current = new window.google.maps.Marker({
            position: newPosition,
            map: mapInstanceRef.current,
          });
        } catch (fallbackErr) {
          console.error(
            "Critical error creating any marker type:",
            fallbackErr
          );
        }
      }
    } else {
      // Update existing marker with proper type checking - existing code
      try {
        // For advanced marker (AdvancedMarkerElement)
        if (
          markerRef.current.content &&
          typeof markerRef.current.position === "object"
        ) {
          markerRef.current.position = newPosition;
        }
        // For standard marker
        else if (typeof markerRef.current.setPosition === "function") {
          markerRef.current.setPosition(newPosition);
        }
      } catch (err) {
        console.warn("Error updating marker position:", err);
      }
    }

    // If we are in location tracking mode, center map on current location
    if (isLocationTracking && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(newPosition);
    }
  }, [driverLocation, isLocationTracking]);

  // Helper function to create custom marker element for stops
  const buildStopMarkerElement = useCallback((stop, index, isActive) => {
    const element = document.createElement("div");
    element.className = "stop-marker";
    element.style.position = "relative";

    // Create the main circle
    const markerCircle = document.createElement("div");
    markerCircle.className = "marker-circle";
    markerCircle.style.width = "24px";
    markerCircle.style.height = "24px";
    markerCircle.style.borderRadius = "50%";
    markerCircle.style.backgroundColor = getStatusColor(
      stop.status,
      index,
      activeStopIndex
    );
    markerCircle.style.border = "2px solid white";
    markerCircle.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
    markerCircle.style.display = "flex";
    markerCircle.style.alignItems = "center";
    markerCircle.style.justifyContent = "center";
    markerCircle.style.color = "white";
    markerCircle.style.fontWeight = "bold";
    markerCircle.style.fontSize = "12px";
    markerCircle.textContent = (index + 1).toString();

    element.appendChild(markerCircle);

    // For destination/school, use a different element
    if (stop.isDestination || index === stops.length - 1) {
      const imgContainer = document.createElement("div");
      imgContainer.style.width = "36px";
      imgContainer.style.height = "36px";

      const imgElement = document.createElement("img");
      imgElement.src = "/assets/school-icon.png";
      imgElement.style.width = "100%";
      imgElement.style.height = "100%";

      imgContainer.appendChild(imgElement);
      element.innerHTML = "";
      element.appendChild(imgContainer);
    }

    return element;
  }, [activeStopIndex]);

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
    stopMarkersRef.current.forEach((marker) => {
      if (marker instanceof window.google.maps.marker.AdvancedMarkerElement) {
        marker.map = null;
      } else {
        marker.setMap(null);
      }
    });
    stopMarkersRef.current = [];

    const markers = stops
      .map((stop, index) => {
        // Skip if no position
        if (!stop.coordinates) return null;

        try {
          // Prefer AdvancedMarkerElement (recommended by Google)
          if (
            window.google.maps.marker &&
            typeof window.google.maps.marker.AdvancedMarkerElement ===
              "function"
          ) {
            try {
              const markerContent = buildStopMarkerElement(
                stop,
                index,
                index === activeStopIndex
              );

              const marker =
                new window.google.maps.marker.AdvancedMarkerElement({
                  position: stop.coordinates,
                  map: mapInstanceRef.current,
                  title: stop.name,
                  content: markerContent,
                  zIndex: 100 - index,
                });

              // Use newer event model with error handling
              try {
                marker.addEventListener("click", () => {
                  const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                    <div class="p-3">
                      <h3 class="font-bold mb-1">${stop.name}</h3>
                      <p>${stop.address || ""}</p>
                      <p>${stop.time || ""}</p>
                      <p><b>${stop.students || 0} students</b></p>
                    </div>
                    `,
                  });
                  infoWindow.open(mapInstanceRef.current, marker);
                });
              } catch (eventErr) {
                // Try newer gmp-click event if standard click fails
                marker.addEventListener("gmp-click", () => {
                  const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                    <div class="p-3">
                      <h3 class="font-bold mb-1">${stop.name}</h3>
                      <p>${stop.address || ""}</p>
                      <p>${stop.time || ""}</p>
                      <p><b>${stop.students || 0} students</b></p>
                    </div>
                    `,
                  });
                  infoWindow.open(mapInstanceRef.current, marker);
                });
              }

              return marker;
            } catch (markerErr) {
              console.warn("Error creating advanced marker:", markerErr);
              return createStandardStopMarker(stop, index);
            }
          } else {
            // Fall back to standard marker
            return createStandardStopMarker(stop, index);
          }
        } catch (err) {
          console.error("Error creating advanced marker, falling back:", err);
          return createStandardStopMarker(stop, index);
        }
      })
      .filter(Boolean);

    stopMarkersRef.current = markers;
    setStopMarkers(markers);
  }, [stops, activeStopIndex, buildStopMarkerElement]);

  // Helper function for creating standard markers as fallback
  const createStandardStopMarker = useCallback((stop, index) => {
    let markerIcon = {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: getStatusColor(stop.status, index, activeStopIndex),
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "#FFFFFF",
      scale: 12,
    };

    if (stop.isDestination || index === stops.length - 1) {
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
      zIndex: 100 - index,
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
  }, [activeStopIndex]);

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

  // Location permission request button
  const LocationPermissionButton = () => (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Location Access Required</h3>
      <p className="text-gray-600 text-center mb-4">To track your position on the route, we need permission to access your device's location.</p>
      <button 
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        onClick={async () => {
          const permission = await locationTracker.requestPermission();
          setLocationPermission(permission);
          
          if (permission === 'granted') {
            setIsTrackingActive(false); // Reset to trigger tracking start
          } else {
            toast.warning("Location permission denied. Route tracking will be limited.");
          }
        }}
      >
        Enable Location Tracking
      </button>
    </div>
  );

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

  // Initialize map with enhanced cleanup to prevent "message channel closed" errors
  useEffect(() => {
    // Create an AbortController to help manage async operations during unmount
    const abortController = new AbortController();
    const signal = abortController.signal;
    
    // Track mounted state for additional safety
    let isMounted = true;
    
    // Function to safely execute callbacks only if component is still mounted
    const safeExecute = (callback) => {
      if (isMounted && !signal.aborted) {
        callback();
      }
    };
    
    // Delay initialization slightly to ensure DOM is ready
    const timer = setTimeout(() => {
      if (signal.aborted) return;
      
      // Safely load Google Maps with abort checking
      try {
        loadMapScript();
      } catch (err) {
        console.error("Error in map initialization:", err);
        if (isMounted && !signal.aborted) {
          setError(`Map initialization failed: ${err.message}`);
          setMapStatus("error");
          onMapError();
        }
      }
    }, 300);

    // Enhanced cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
      clearTimeout(timer);
      
      // Clear any pending initialization timeout
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      
      // If we have map instance references, clean them up
      if (mapInstanceRef.current) {
        // Clean up Google Maps event listeners
        if (window.google?.maps) {
          window.google.maps.event.clearInstanceListeners(mapInstanceRef.current);
        }
        mapInstanceRef.current = null;
      }
      
      // Clean up any markers
      if (markerRef.current) {
        if (typeof markerRef.current.setMap === 'function') {
          markerRef.current.setMap(null);
        }
        markerRef.current = null;
      }
    };
  }, [loadMapScript, onMapError]);

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
      driverLocation
    ) {
      createOrUpdateDriverMarker();

      // Update vehicle location in database if needed
      if (vehicleId) {
        updateVehicleLocation(
          vehicleId,
          driverLocation.latitude,
          driverLocation.longitude,
          driverLocation.speed
        );
      }
    }

    // If using emergency map, update vehicle position
    if (driverLocation && window.emergencyRouteMap) {
      window.emergencyRouteMap.updateVehiclePosition(
        driverLocation.latitude,
        driverLocation.longitude
      );
    }
  }, [driverLocation, createOrUpdateDriverMarker, vehicleId, mapReady]);

  // Ensure map failure is called on error
  useEffect(() => {
    if (error) {
      onMapError();
    }
  }, [error, onMapError]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      // Stop location tracking
      if (locationTrackerRef.current && locationTrackerRef.current.stop) {
        locationTrackerRef.current.stop();
      }
    
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

  // Check if we need to prompt for location permission
  if (locationPermission === 'prompt' || locationPermission === 'denied') {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <LocationPermissionButton />
      </div>
    );
  }

  // Show loading spinner
  if (loading) {
    return <MapLoadingState />;
  }

  // Show fallback component when map can't be loaded
  if (mapStatus === "fallback") {
    return (
      <div className="h-full w-full">
        <div ref={mapRef}>
          {/* Fallback display will be created inside this element */}
        </div>
        {locationFallback.createFallbackDisplay(mapRef, driverLocation, {
          title: "Route Map",
          showRetry: true,
          onRetry: () => {
            setError(null);
            setInitializationAttempts(0);
            setLoading(true);
            setMapStatus("loading");
            onLoadingStart();
            initializeMap();
          },
          additionalInfo: {
            stops: stops,
            activeStopIndex: activeStopIndex,
            routeId: routeId,
          },
        })}
      </div>
    );
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
          className={`p-2 rounded-full shadow-md ${isLocationTracking ? 'bg-blue-500 text-white' : 'bg-white text-blue-600'}`}
          onClick={() => {
            if (driverLocation && mapInstanceRef.current) {
              mapInstanceRef.current.panTo({
                lat: driverLocation.latitude,
                lng: driverLocation.longitude,
              });
              mapInstanceRef.current.setZoom(16);
              setIsLocationTracking(true);
            }
          }}
          title="Center on my location"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
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
      
      {/* Location accuracy indicator */}
      {driverLocation && driverLocation.accuracy && (
        <div className="absolute top-4 right-4 bg-white py-1 px-3 rounded-full shadow-md text-xs">
          {driverLocation.accuracy > 100 ? (
            <span className="text-yellow-600">Low accuracy: {Math.round(driverLocation.accuracy)}m</span>
          ) : driverLocation.accuracy > 50 ? (
            <span className="text-blue-600">Accuracy: {Math.round(driverLocation.accuracy)}m</span>
          ) : (
            <span className="text-green-600">High accuracy: {Math.round(driverLocation.accuracy)}m</span>
          )}
        </div>
      )}
      
      {/* Position timestamp */}
      {driverLocation && driverLocation.timestamp && (
        <div className="absolute top-4 left-4 bg-white py-1 px-3 rounded-full shadow-md text-xs text-gray-600">
          Updated: {new Date(driverLocation.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

import MapErrorBoundary from "../../../common/MapErrorBoundary";

const DriverRouteMapWithErrorBoundary = (props) => (
  <MapErrorBoundary>
    <DriverRouteMap {...props} />
  </MapErrorBoundary>
);

export default DriverRouteMapWithErrorBoundary;