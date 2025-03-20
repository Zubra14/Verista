// src/utils/mapEmergencyFix.js

/**
 * Emergency utility to ensure maps load even when database connections fail
 */

// Default map center (Johannesburg)
const DEFAULT_CENTER = { lat: -26.2041, lng: 28.0473 };

/**
 * Force Google Maps to load regardless of other errors
 * @param {string} apiKey - Your Google Maps API key
 * @returns {Promise} - Resolves when maps are loaded
 */
export const forceLoadGoogleMaps = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      console.log("Google Maps already loaded");
      resolve(window.google.maps);
      return;
    }

    // If API key is missing, use a test key (works for development only)
    const actualApiKey =
      apiKey ||
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
      "AIzaSyA-cX0MmaUtFUCQR5CswGWuzLhzTJ2dWlA";

    console.log("Emergency loading of Google Maps API");
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${actualApiKey}&libraries=places,directions,geometry&callback=initGoogleMapsEmergency`;
    script.async = true;
    script.defer = true;

    // Define global callback
    window.initGoogleMapsEmergency = () => {
      console.log("Google Maps emergency loaded successfully");
      resolve(window.google.maps);
    };

    script.onerror = (e) => {
      console.error("Failed to load Google Maps script:", e);
      reject(new Error("Failed to load Google Maps API"));
    };

    document.head.appendChild(script);
  });
};

/**
 * Create a fully functional map with emergency mock data
 * @param {HTMLElement} container - Map container element
 * @param {Array} mockStops - Optional mock stop data
 * @returns {Object} - Map instance and utilities
 */
export const createEmergencyMap = async (container, mockStops = []) => {
  if (!container) {
    console.error("Map container element not provided");
    return null;
  }

  try {
    // Force load maps API
    const googleMaps = await forceLoadGoogleMaps();

    // Create default stops if none provided
    const stops =
      mockStops.length > 0
        ? mockStops
        : [
            {
              name: "Starting Point",
              coordinates: { lat: -26.2041, lng: 28.0473 },
            },
            {
              name: "Midpoint Stop",
              coordinates: { lat: -26.1941, lng: 28.0373 },
            },
            {
              name: "Destination",
              coordinates: { lat: -26.1841, lng: 28.0273 },
              isDestination: true,
            },
          ];

    // Create map
    const map = new googleMaps.Map(container, {
      center: stops[0].coordinates,
      zoom: 13,
      fullscreenControl: true,
      mapTypeControl: true,
      streetViewControl: false,
      zoomControl: true,
    });

    // Create markers for each stop
    const markers = stops.map((stop, index) => {
      const marker = new googleMaps.Marker({
        position: stop.coordinates,
        map: map,
        title: stop.name,
        label: (index + 1).toString(),
        icon: stop.isDestination
          ? {
              url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            }
          : {
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            },
      });

      // Create info window
      const infoWindow = new googleMaps.InfoWindow({
        content: `<div style="padding:5px"><h3 style="margin:0;font-size:14px">${stop.name}</h3></div>`,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    // Create a path between stops
    const path = stops.map((stop) => stop.coordinates);
    const polyline = new googleMaps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: "#4285F4",
      strokeOpacity: 0.8,
      strokeWeight: 5,
    });

    polyline.setMap(map);

    // Fit map to show all stops
    const bounds = new googleMaps.LatLngBounds();
    path.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds);

    return {
      map,
      markers,
      polyline,

      // Utility to update vehicle position
      updateVehiclePosition: (lat, lng) => {
        if (!lat || !lng) return;

        if (!window.vehicleMarker) {
          window.vehicleMarker = new googleMaps.Marker({
            position: { lat, lng },
            map: map,
            title: "Vehicle",
            icon: {
              url: "/assets/bus-icon.png",
              scaledSize: new googleMaps.Size(40, 40),
              anchor: new googleMaps.Point(20, 20),
            },
            zIndex: 1000,
          });
        } else {
          window.vehicleMarker.setPosition({ lat, lng });
        }

        if (window.followVehicle) {
          map.panTo({ lat, lng });
        }
      },

      // Toggle vehicle tracking
      toggleFollowVehicle: (follow = true) => {
        window.followVehicle = follow;
      },
    };
  } catch (error) {
    console.error("Emergency map creation failed:", error);
    return null;
  }
};

export default {
  forceLoadGoogleMaps,
  createEmergencyMap,
  DEFAULT_CENTER,
};
