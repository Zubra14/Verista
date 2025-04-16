// src/utils/mapUtils.js

// Keep track of map loading status to prevent duplicate loads
let mapsPromise = null;
let loadInProgress = false;
let timeoutId = null;
const MAPS_LOAD_TIMEOUT = 20000; // 20 seconds timeout

/**
 * Load Google Maps script with enhanced error handling and single instance loading
 * Completely fixes "message channel closed" error by implementing a robust callback
 * management system with proper lifecycle handling
 * 
 * @returns {Promise<object>} - Google Maps object once loaded
 */
export const loadGoogleMapsScript = () => {
  // If Maps is already loaded, return it immediately
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }
  
  // Return existing promise if already loading
  if (mapsPromise && loadInProgress) {
    return mapsPromise;
  }
  
  // Reset the loading state for a new attempt
  loadInProgress = true;
  
  // Clear any existing timeout
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }

  // Create new loading promise with proper cleanup
  mapsPromise = new Promise((resolve, reject) => {
    // Store the original callbacks to ensure they don't get garbage collected
    // This is critical to prevent "message channel closed" errors
    const resolveCallback = resolve;
    const rejectCallback = reject;
    
    // First, check if the script already exists in the DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      console.log("Google Maps script tag already exists, waiting for load");
      
      // Define a polling mechanism with proper cleanup
      let checkCount = 0;
      const MAX_CHECKS = 100; // Prevent infinite polling
      
      const checkInterval = setInterval(() => {
        checkCount++;
        
        // Successfully loaded
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          loadInProgress = false;
          
          // Use a small delay to resolve after cleanup
          // This helps avoid race conditions with React's rendering cycle
          setTimeout(() => {
            resolveCallback(window.google.maps);
          }, 0);
          return;
        }
        
        // Too many checks, giving up
        if (checkCount >= MAX_CHECKS) {
          clearInterval(checkInterval);
          loadInProgress = false;
          const error = new Error("Google Maps failed to initialize after multiple checks");
          console.error(error);
          
          // Use a small delay to reject after cleanup
          setTimeout(() => {
            rejectCallback(error);
          }, 0);
        }
      }, 200);
      
      return;
    }

    try {
      // Create a random and unique callback name for this specific load attempt
      // Adding entropy to avoid any possible name collisions 
      const callbackName = `initGoogleMaps_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      // Retain a reference to the original window object to ensure we can always
      // access it even if the context changes
      const windowRef = window;
      
      // Set up the callback with enhanced error handling and cleanup
      windowRef[callbackName] = function() {
        // Clear the timeout since callback was triggered
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        // Store values locally to ensure they're available during cleanup
        const googleRef = windowRef.google;
        
        // Check if Google Maps was loaded successfully
        if (googleRef && googleRef.maps) {
          console.log("Google Maps loaded successfully");
          loadInProgress = false;
          
          // First resolve the promise to avoid blocking
          try {
            resolveCallback(googleRef.maps);
          } catch (resolveError) {
            console.error("Error during Maps callback resolution:", resolveError);
          }
          
          // IMPORTANT: Clean up callback AFTER resolving but with a delay
          // This prevents "message channel closed" errors by ensuring the callback
          // remains available during any ongoing processes
          setTimeout(() => {
            try {
              delete windowRef[callbackName];
            } catch (e) {
              windowRef[callbackName] = undefined;
            }
          }, 500); // Longer delay for safety
        } else {
          loadInProgress = false;
          const error = new Error("Google Maps failed to load completely");
          console.error(error);
          
          // First reject the promise
          try {
            rejectCallback(error);
          } catch (rejectError) {
            console.error("Error during Maps callback rejection:", rejectError);
          }
          
          // Then clean up callback with a delay
          setTimeout(() => {
            try {
              delete windowRef[callbackName];
            } catch (e) {
              windowRef[callbackName] = undefined;
            }
          }, 100);
        }
      };
  
      // Create script element with proper error handling
      const script = document.createElement("script");
      
      // Use import.meta.env (Vite) instead of process.env (Node/React)
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
      const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || '';
      
      // Build URL with all necessary parameters
      let scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&v=quarterly`;
      
      // Add libraries parameter to ensure all required features are available
      // Include marker library to support AdvancedMarkerElement (recommended over Marker)
      scriptUrl += '&libraries=places,marker';
      
      // Add map ID if available (use singular map_id parameter, not plural map_ids)
      if (mapId) {
        scriptUrl += `&map_id=${mapId}`;
      }
      
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      
      // Additional safety attributes to improve loading behavior
      script.setAttribute('crossorigin', 'anonymous');
      
      // Track script loading state
      let scriptLoaded = false;
      
      // Handle script load event
      script.onload = function() {
        scriptLoaded = true;
        console.log("Google Maps script loaded, waiting for callback initialization");
      };
      
      // Handle script loading errors explicitly
      script.onerror = function(event) {
        loadInProgress = false;
        const error = new Error("Failed to load Google Maps API script");
        console.error(error, event);
        
        // Clean up callback
        try {
          delete windowRef[callbackName];
        } catch (e) {
          windowRef[callbackName] = undefined;
        }
        
        // Clear timeout if it exists
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        rejectCallback(error);
      };
  
      // Add script to document
      document.head.appendChild(script);
      
      // Set up a timeout to avoid hanging if the script never loads/callbacks
      timeoutId = setTimeout(() => {
        if (!windowRef.google || !windowRef.google.maps) {
          loadInProgress = false;
          
          let errorMessage = "Google Maps API load timeout after " + (MAPS_LOAD_TIMEOUT/1000) + " seconds";
          
          // Add more diagnostic information
          if (scriptLoaded) {
            errorMessage += " (Script loaded but callback never executed)";
          } else {
            errorMessage += " (Script loading incomplete)";
          }
          
          const error = new Error(errorMessage);
          console.error(error);
          
          // Clean up callback
          try {
            delete windowRef[callbackName];
          } catch (e) {
            windowRef[callbackName] = undefined;
          }
          
          timeoutId = null;
          rejectCallback(error);
        }
      }, MAPS_LOAD_TIMEOUT);
    } catch (error) {
      // Handle any synchronous errors during setup
      console.error("Error setting up Google Maps load:", error);
      loadInProgress = false;
      rejectCallback(error);
    }
  });

  // Add error handling to the promise chain
  mapsPromise = mapsPromise.catch(error => {
    // Always make sure to reset the loading state on error
    loadInProgress = false;
    console.error("Google Maps loading failed:", error);
    throw error; // Re-throw to propagate to caller
  });

  return mapsPromise;
};

/**
 * Create a fallback map display when Google Maps is unavailable
 * @param {HTMLElement} element - DOM element to contain the map
 * @param {Object} options - Map configuration options
 * @returns {Object} Fallback map object
 */
export const createFallbackMap = (element, options = {}) => {
  if (!element) return { success: false, error: 'No element provided' };
  
  // Clear the element
  element.innerHTML = '';
  element.style.position = 'relative';
  element.style.backgroundColor = '#f0f0f0';
  element.style.borderRadius = '8px';
  element.style.overflow = 'hidden';
  
  // Create the map container
  const mapContainer = document.createElement('div');
  mapContainer.style.width = '100%';
  mapContainer.style.height = '100%';
  mapContainer.style.position = 'relative';
  
  // Create the grid background
  const grid = document.createElement('div');
  grid.style.position = 'absolute';
  grid.style.top = '0';
  grid.style.left = '0';
  grid.style.right = '0';
  grid.style.bottom = '0';
  grid.style.backgroundImage = 'linear-gradient(#ddd 1px, transparent 1px), linear-gradient(90deg, #ddd 1px, transparent 1px)';
  grid.style.backgroundSize = '20px 20px';
  grid.style.opacity = '0.6';
  
  // Create the center point
  const center = document.createElement('div');
  center.style.position = 'absolute';
  center.style.top = '50%';
  center.style.left = '50%';
  center.style.transform = 'translate(-50%, -50%)';
  center.style.width = '10px';
  center.style.height = '10px';
  center.style.borderRadius = '50%';
  center.style.backgroundColor = '#3b82f6';
  
  // Create the label
  const label = document.createElement('div');
  label.style.position = 'absolute';
  label.style.bottom = '10px';
  label.style.left = '10px';
  label.style.padding = '5px 10px';
  label.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
  label.style.borderRadius = '4px';
  label.style.fontSize = '12px';
  label.style.fontWeight = 'bold';
  label.innerText = 'Fallback Map - Live tracking available in app';
  
  // Add the attribution
  const attribution = document.createElement('div');
  attribution.style.position = 'absolute';
  attribution.style.bottom = '5px';
  attribution.style.right = '5px';
  attribution.style.fontSize = '10px';
  attribution.style.color = '#666';
  attribution.innerText = '© Verista 2025';
  
  // Add elements to the container
  mapContainer.appendChild(grid);
  mapContainer.appendChild(center);
  mapContainer.appendChild(label);
  mapContainer.appendChild(attribution);
  
  // Add the container to the element
  element.appendChild(mapContainer);
  
  // Store markers
  const markers = [];
  
  // Return the fallback map object
  return {
    success: true,
    fallback: true,
    map: {
      // Add a marker to the map
      addMarker: (lat, lng, title = 'Vehicle') => {
        const marker = document.createElement('div');
        marker.style.position = 'absolute';
        marker.style.top = '50%';
        marker.style.left = '50%';
        marker.style.transform = 'translate(-50%, -50%)';
        marker.style.width = '32px';
        marker.style.height = '32px';
        marker.style.backgroundImage = 'url(/assets/bus-icon.svg)';
        marker.style.backgroundSize = 'contain';
        marker.style.backgroundPosition = 'center';
        marker.style.backgroundRepeat = 'no-repeat';
        marker.style.zIndex = '10';
        
        // Store original coordinates
        marker._lat = lat;
        marker._lng = lng;
        marker._title = title;
        
        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.style.position = 'absolute';
        tooltip.style.top = '-25px';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '2px 5px';
        tooltip.style.borderRadius = '3px';
        tooltip.style.fontSize = '10px';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.display = 'none';
        tooltip.innerText = title;
        
        marker.appendChild(tooltip);
        
        // Show tooltip on hover
        marker.addEventListener('mouseenter', () => {
          tooltip.style.display = 'block';
        });
        
        marker.addEventListener('mouseleave', () => {
          tooltip.style.display = 'none';
        });
        
        mapContainer.appendChild(marker);
        markers.push(marker);
        
        return {
          // Update marker position
          update: (newLat, newLng, speed) => {
            marker._lat = newLat;
            marker._lng = newLng;
            
            if (speed) {
              tooltip.innerText = `${title} (${speed} km/h)`;
            }
          }
        };
      },
      
      // Update map center
      panTo: (coords) => {
        // In a real implementation, this would adjust the map view
        // For fallback, we just store the coordinates
        mapContainer._center = coords;
      }
    }
  };
};

/**
 * Create a fallback display when maps fail to load
 * 
 * @param {HTMLElement} element - The DOM element where the map should be
 * @param {string} message - Custom message to display
 * @param {object} options - Additional options for fallback display
 * @param {object} options.location - Optional location coordinates {lat, lng}
 * @param {string} options.errorMessage - Detailed error message to display
 * @param {function} options.onRetry - Function to call when retry button is clicked
 */
export const createMapFallback = (
  element,
  message = "Map unavailable",
  options = {}
) => {
  if (!element || typeof element !== 'object') return;

  const { 
    location,
    errorMessage,
    onRetry = () => window.location.reload()
  } = options;

  const container = document.createElement("div");
  container.className =
    "flex flex-col items-center justify-center p-6 text-center bg-gray-50 border border-gray-200 rounded-lg h-full";
  
  let locationHtml = '';
  if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
    locationHtml = `
      <div class="mt-3 mb-2 p-2 bg-white rounded border border-gray-300 text-sm">
        <div class="font-semibold mb-1">Location Information:</div>
        <div class="font-mono">Latitude: ${location.lat.toFixed(6)}</div>
        <div class="font-mono">Longitude: ${location.lng.toFixed(6)}</div>
      </div>
    `;
  }

  let errorHtml = '';
  if (errorMessage) {
    errorHtml = `
      <div class="mt-2 mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
        <div class="font-semibold">Error details:</div>
        <div class="mt-1">${errorMessage}</div>
      </div>
    `;
  }

  container.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-amber-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 class="text-lg font-medium mb-2">Map Display Unavailable</h3>
      <p class="text-gray-600 mb-2">${message || "We encountered an issue loading the map."}</p>
      ${locationHtml}
      ${errorHtml}
      <button id="retry-map-load" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Try Again
      </button>
    `;

  // Clear and append
  element.innerHTML = "";
  element.appendChild(container);
  
  // Add event listener for retry button
  const retryButton = element.querySelector("#retry-map-load");
  if (retryButton) {
    retryButton.addEventListener("click", onRetry);
  }
};

/**
 * Create and initialize a Google Map with error handling and fallbacks
 *
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.mapElement - DOM element where the map should be rendered
 * @param {Object} options.center - Map center coordinates {lat, lng}
 * @param {number} options.zoom - Initial zoom level
 * @param {Object} options.markerPosition - Marker position coordinates {lat, lng}
 * @param {string} options.markerIcon - Optional URL for custom marker icon
 * @param {Function} options.onSuccess - Callback when map loads successfully
 * @param {Function} options.onError - Callback when map fails to load
 * @returns {Promise<Object>} - Object containing map and marker instances if successful
 */
export const initializeMapWithFallback = async ({
  mapElement,
  center = { lat: 0, lng: 0 },
  zoom = 14,
  markerPosition = null,
  markerIcon = null,
  onSuccess = () => {},
  onError = () => {},
  abortSignal = null, // Optional AbortSignal for cancellation
}) => {
  // Validate required params
  if (!mapElement) {
    const error = new Error("Map element not provided");
    onError(error);
    return Promise.reject(error);
  }

  // Create references for cleanup
  let mapInstance = null;
  let markerInstance = null;
  let listenerIds = [];
  let idleListener = null;
  
  // Function to check if operation was aborted
  const isAborted = () => abortSignal && abortSignal.aborted;
  
  // Function to safely execute callbacks with abort checking
  const safeExecute = (callback, ...args) => {
    if (!isAborted()) {
      try {
        return callback(...args);
      } catch (error) {
        console.error("Error in map callback:", error);
      }
    }
    return undefined;
  };
  
  try {
    // Early abort check
    if (isAborted()) {
      throw new Error("Map initialization aborted");
    }
    
    // Load Google Maps API first with abort handling
    const googleMapsPromise = loadGoogleMapsScript();
    
    // If we have an abort signal, race the load with the abort
    const googleMaps = abortSignal 
      ? await Promise.race([
          googleMapsPromise,
          new Promise((_, reject) => {
            const abortHandler = () => {
              reject(new Error("Map loading aborted"));
            };
            abortSignal.addEventListener('abort', abortHandler, { once: true });
          })
        ])
      : await googleMapsPromise;
    
    // Early abort check after API load
    if (isAborted()) {
      throw new Error("Map initialization aborted after Google Maps loaded");
    }
    
    // Early check - if the map element was removed from DOM during load, abort
    if (!mapElement.isConnected) {
      throw new Error("Map container removed from DOM during map loading");
    }
    
    // Create map instance with defensive options
    const mapOptions = {
      center,
      zoom,
      mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "",
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      // Advanced options to prevent common issues
      clickableIcons: false,
      gestureHandling: "cooperative"
    };
    
    // Create map with comprehensive error handling
    try {
      mapInstance = new google.maps.Map(mapElement, mapOptions);
      
      // Set a flag to track idle state - resolves component-initialization race conditions
      let mapIsIdle = false;
      
      // Wait for map to be idle before continuing - critical for proper initialization
      await new Promise((resolve) => {
        // Set a safeguard timeout to prevent hanging
        const mapIdleTimeout = setTimeout(() => {
          if (!mapIsIdle) {
            console.warn("Map idle event never fired, continuing anyway");
            resolve();
          }
        }, 5000);
        
        // Register idle listener
        idleListener = google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
          mapIsIdle = true;
          clearTimeout(mapIdleTimeout);
          resolve();
        });
      });
      
      // Abort check after map is ready
      if (isAborted()) {
        throw new Error("Map initialization aborted after map creation");
      }
      
    } catch (mapError) {
      console.error("Error creating Google Map instance:", mapError);
      throw mapError;
    }
    
    // Create marker if position is provided - with error handling
    if (markerPosition && !isAborted()) {
      try {
        markerInstance = new google.maps.Marker({
          position: markerPosition,
          map: mapInstance,
          title: "Location Marker",
          animation: google.maps.Animation.DROP
        });
        
        // Try to set custom icon if provided
        if (markerIcon) {
          try {
            markerInstance.setIcon({
              url: markerIcon,
              scaledSize: new google.maps.Size(32, 32),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(16, 16)
            });
          } catch (iconError) {
            console.warn("Failed to set custom marker icon:", iconError);
            // Continue even if icon setting fails
          }
        }
      } catch (markerError) {
        console.warn("Error creating marker:", markerError);
        // We don't throw here so the map can still work without the marker
      }
    }
    
    // Final abort check before success
    if (isAborted()) {
      throw new Error("Map initialization aborted before completion");
    }
    
    // Call success callback with created instances
    safeExecute(onSuccess, { map: mapInstance, marker: markerInstance });
    
    // Return map and marker with an enhanced cleanup function
    return { 
      map: mapInstance, 
      marker: markerInstance,
      cleanup: () => {
        // Thorough cleanup to avoid memory leaks and message channel errors
        
        // Remove all event listeners first
        if (mapInstance && google && google.maps) {
          // Clear the idle listener if it exists
          if (idleListener) {
            google.maps.event.removeListener(idleListener);
            idleListener = null;
          }
          
          // Clear all other listeners
          google.maps.event.clearInstanceListeners(mapInstance);
        }
        
        // Remove marker from map
        if (markerInstance) {
          try {
            markerInstance.setMap(null);
          } catch (e) {
            console.warn("Error removing marker:", e);
          }
          markerInstance = null;
        }
        
        // Clear map instance reference
        mapInstance = null;
      }
    };
  } catch (error) {
    // Only log errors if not aborted
    if (!isAborted()) {
      console.error("Failed to initialize map:", error);
    }
    
    // Clean up any resources that might have been created
    if (markerInstance) {
      try {
        markerInstance.setMap(null);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    // Remove all event listeners
    if (mapInstance && google && google.maps) {
      try {
        if (idleListener) {
          google.maps.event.removeListener(idleListener);
        }
        google.maps.event.clearInstanceListeners(mapInstance);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    // Call error callback if provided
    if (!isAborted()) {
      safeExecute(onError, error);
    }
    
    // Return rejected promise
    return Promise.reject(error);
  }
};

/**
 * Initialize a Google Map in the specified element
 * @param {HTMLElement} element - DOM element to contain the map
 * @param {Object} options - Map configuration options
 * @returns {Promise<Object>} Map object
 */
export const initializeMap = async (element, options = {}) => {
  if (!element) {
    console.error('No element provided for map initialization');
    return { success: false, error: 'Missing map container element' };
  }
  
  const defaultOptions = {
    center: { lat: -26.1052, lng: 28.0567 }, // Johannesburg default
    zoom: 12,
    mapTypeId: 'roadmap',
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false
  };
  
  const mapOptions = { ...defaultOptions, ...options };
  
  try {
    // Check if we should use the fallback map (demo mode or no API key)
    const isDemoMode = localStorage.getItem('useDemoData') === 'true';
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (isDemoMode || !apiKey) {
      console.info('Using fallback map display');
      return createFallbackMap(element, mapOptions);
    }
    
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      const map = new window.google.maps.Map(element, mapOptions);
      return { success: true, map };
    }
    
    // Load Google Maps API
    await loadGoogleMapsScript(apiKey);
    
    // Create the map
    const map = new window.google.maps.Map(element, mapOptions);
    return { success: true, map };
    
  } catch (error) {
    console.error('Error initializing map:', error);
    
    // Create fallback map on error
    return createFallbackMap(element, mapOptions);
  }
};

/**
 * Create a vehicle marker on the map
 * @param {Object} map - Google Map instance
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} label - Marker label
 * @returns {Object} Marker instance
 */
export const createVehicleMarker = (map, lat, lng, label = 'School Bus') => {
  // Check if using Google Maps or fallback
  if (window.google && window.google.maps && map instanceof window.google.maps.Map) {
    // Use Google Maps API
    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: label,
      icon: {
        url: '/assets/bus-icon.svg',
        scaledSize: new window.google.maps.Size(32, 32),
        origin: new window.google.maps.Point(0, 0),
        anchor: new window.google.maps.Point(16, 16)
      }
    });
    
    // Add info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `<div><strong>${label}</strong></div>`
    });
    
    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });
    
    return marker;
  } else if (map && map.addMarker) {
    // Use fallback map
    return map.addMarker(lat, lng, label);
  }
  
  console.warn('Invalid map instance for createVehicleMarker');
  return null;
};

/**
 * Update vehicle marker position
 * @param {Object} marker - Marker instance
 * @param {number} lat - New latitude
 * @param {number} lng - New longitude
 * @param {number} speed - Vehicle speed
 */
export const updateMarkerPosition = (marker, lat, lng, speed = 0) => {
  if (!marker) return;
  
  // Check if using Google Maps API marker
  if (marker.setPosition) {
    marker.setPosition({ lat, lng });
    
    // Update title with speed if available
    if (speed && marker.setTitle) {
      marker.setTitle(`School Bus (${speed} km/h)`);
    }
  } else if (marker.update) {
    // Using fallback marker
    marker.update(lat, lng, speed);
  }
};

export default {
  loadGoogleMapsScript,
  initializeMap,
  createVehicleMarker,
  updateMarkerPosition,
  createFallbackMap,
  createMapFallback,
  initializeMapWithFallback,
};