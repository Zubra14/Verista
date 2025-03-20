// src/utils/enhancedOfflineManager.js
import { openDB } from "idb";
import { toast } from "react-toastify";
import supabase from "../lib/supabase";
import { connectionState } from "../lib/supabase";

// Configuration constants
const CACHE_VERSION = "v2";
const DEFAULT_CENTER = { lat: -26.2041, lng: 28.0473 }; // Johannesburg
const DB_NAME = "verista-offline-db";
const DB_VERSION = 1;

/**
 * Initialize IndexedDB database
 */
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create all required object stores
      const stores = ["trips", "routes", "students", "vehicles", "locations"];
      stores.forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "id" });
        }
      });

      // Create pending operations store with auto-increment
      if (!db.objectStoreNames.contains("pendingOperations")) {
        db.createObjectStore("pendingOperations", {
          keyPath: "id",
          autoIncrement: true,
        });
      }

      // Create a store for cached route data from localStorage migration
      if (!db.objectStoreNames.contains("routeCache")) {
        db.createObjectStore("routeCache", { keyPath: "routeId" });
      }
    },
  });
};

/**
 * Save data to IndexedDB
 * @param {string} storeName - The name of the store
 * @param {Object|Array} data - Data to save
 * @returns {Promise<boolean>} Success status
 */
export const saveToIndexedDB = async (storeName, data) => {
  try {
    const db = await initDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    if (Array.isArray(data)) {
      for (const item of data) {
        await store.put(item);
      }
    } else {
      await store.put(data);
    }

    await tx.done;
    return true;
  } catch (error) {
    console.error(`Error saving to ${storeName}:`, error);
    return false;
  }
};

/**
 * Retrieve data from IndexedDB
 * @param {string} storeName - The name of the store
 * @param {string} [id=null] - Optional ID to retrieve specific item
 * @returns {Promise<Object|Array|null>} Retrieved data
 */
export const getFromIndexedDB = async (storeName, id = null) => {
  try {
    const db = await initDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);

    if (id) {
      return await store.get(id);
    } else {
      return await store.getAll();
    }
  } catch (error) {
    console.error(`Error getting from ${storeName}:`, error);
    return null;
  }
};

/**
 * Cache route data
 * Compatible with previous routeDataCache.js implementation
 * @param {string} routeId - The route identifier
 * @param {Object} data - The route data to cache
 * @param {number} expiryMinutes - Cache expiry time in minutes (default: 30)
 */
export const cacheRouteData = async (routeId, data, expiryMinutes = 30) => {
  if (!routeId || !data) return;

  // First store in IndexedDB (primary storage)
  const cacheItem = {
    routeId,
    data,
    timestamp: Date.now(),
    expiry: Date.now() + expiryMinutes * 60 * 1000,
    version: CACHE_VERSION,
  };

  try {
    await saveToIndexedDB("routeCache", cacheItem);
    console.log(
      `Cached route data for ${routeId}, expires in ${expiryMinutes} minutes`
    );

    // As fallback, also use localStorage for backward compatibility
    localStorage.setItem(
      `verista_route_${routeId}_${CACHE_VERSION}`,
      JSON.stringify(cacheItem)
    );
  } catch (error) {
    console.warn("Failed to cache route data:", error);

    // Try to clear older caches if storage is full
    try {
      await clearExpiredCaches();
    } catch (clearError) {
      console.error("Error clearing expired caches:", clearError);
    }
  }
};

/**
 * Get cached route data
 * Compatible with previous routeDataCache.js implementation
 * @param {string} routeId - The route identifier
 * @returns {Promise<Object|null>} - Cached data or null if not available/expired
 */
export const getCachedRouteData = async (routeId) => {
  if (!routeId) return null;

  try {
    // Try to get from IndexedDB first
    const cacheItem = await getFromIndexedDB("routeCache", routeId);

    if (!cacheItem) {
      // Fall back to localStorage
      const localStorageKey = `verista_route_${routeId}_${CACHE_VERSION}`;
      const cacheItemRaw = localStorage.getItem(localStorageKey);

      if (!cacheItemRaw) return null;

      const localCacheItem = JSON.parse(cacheItemRaw);

      // Check if cache is expired
      if (Date.now() > localCacheItem.expiry) {
        localStorage.removeItem(localStorageKey);
        return null;
      }

      // Migrate to IndexedDB for future use
      saveToIndexedDB("routeCache", localCacheItem);

      return localCacheItem.data;
    }

    // Check if IndexedDB cache is expired
    if (Date.now() > cacheItem.expiry) {
      const db = await initDB();
      const tx = db.transaction("routeCache", "readwrite");
      const store = tx.objectStore("routeCache");
      await store.delete(routeId);
      await tx.done;
      return null;
    }

    // Log cache age
    const ageMinutes = Math.round((Date.now() - cacheItem.timestamp) / 60000);
    console.log(
      `Using cached route data for ${routeId} (${ageMinutes} minutes old)`
    );

    return cacheItem.data;
  } catch (error) {
    console.warn("Failed to get cached route data:", error);
    return null;
  }
};

/**
 * Clear all expired caches to free up storage space
 */
export const clearExpiredCaches = async () => {
  try {
    // Clear IndexedDB expired caches
    const now = Date.now();
    const db = await initDB();
    const tx = db.transaction("routeCache", "readwrite");
    const store = tx.objectStore("routeCache");
    const allCaches = await store.getAll();
    let removedCount = 0;

    for (const cache of allCaches) {
      if (cache.expiry < now) {
        await store.delete(cache.routeId);
        removedCount++;
      }
    }

    await tx.done;

    // Also clear localStorage expired caches for backward compatibility
    const keysToRemove = [];
    const cachePrefix = `verista_route_`;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(cachePrefix)) {
        try {
          const cacheItem = JSON.parse(localStorage.getItem(key));
          if (cacheItem && cacheItem.expiry && cacheItem.expiry < now) {
            keysToRemove.push(key);
          }
        } catch (e) {
          // If we can't parse it, it's probably corrupted, so remove it
          keysToRemove.push(key);
        }
      }
    }

    // Remove expired localStorage keys
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    removedCount += keysToRemove.length;

    if (removedCount > 0) {
      console.log(`Cleared ${removedCount} expired route caches`);
    }

    return removedCount;
  } catch (error) {
    console.error("Error clearing expired caches:", error);
    return 0;
  }
};

/**
 * Record pending operation to be synchronized when back online
 * @param {Object} operation - The operation to record
 * @returns {Promise<boolean>} Success status
 */
export const recordPendingOperation = async (operation) => {
  try {
    const db = await initDB();
    const tx = db.transaction("pendingOperations", "readwrite");
    const store = tx.objectStore("pendingOperations");

    const pendingOp = {
      ...operation,
      timestamp: new Date().toISOString(),
      attempts: 0,
      status: "pending",
    };

    await store.add(pendingOp);
    await tx.done;

    // Try to sync immediately if online
    if (connectionState.isConnected()) {
      syncPendingOperations();
    }

    return true;
  } catch (error) {
    console.error("Error recording pending operation:", error);
    return false;
  }
};

/**
 * Synchronize all pending operations
 * @returns {Promise<Object>} Synchronization result
 */
export const syncPendingOperations = async () => {
  if (!connectionState.isConnected()) {
    return { success: false, reason: "offline" };
  }

  try {
    const db = await initDB();
    const tx = db.transaction("pendingOperations", "readonly");
    const store = tx.objectStore("pendingOperations");
    const pendingOps = await store.getAll();
    await tx.done;

    if (!pendingOps || pendingOps.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    let successCount = 0;
    let errorCount = 0;

    for (const op of pendingOps) {
      try {
        // Skip operations that have failed too many times
        if (op.attempts >= 5) {
          continue;
        }

        // Update attempt count
        const updateTx = db.transaction("pendingOperations", "readwrite");
        const updateStore = updateTx.objectStore("pendingOperations");
        op.attempts += 1;
        op.lastAttempt = new Date().toISOString();
        await updateStore.put(op);
        await updateTx.done;

        // Process based on operation type
        let result;
        switch (op.action) {
          case "insert":
            result = await supabase.from(op.table).insert(op.data);
            break;
          case "update":
            result = await supabase
              .from(op.table)
              .update(op.data)
              .eq("id", op.data.id);
            break;
          case "delete":
            result = await supabase
              .from(op.table)
              .delete()
              .eq("id", op.data.id);
            break;
          case "tripUpdate":
            result = await supabase
              .from("trips")
              .update(op.updateData)
              .eq("id", op.tripId);
            break;
          default:
            throw new Error(`Unknown operation type: ${op.action}`);
        }

        // Check for errors
        if (result.error) {
          throw result.error;
        }

        // Operation succeeded, remove from pending operations
        const deleteTx = db.transaction("pendingOperations", "readwrite");
        const deleteStore = deleteTx.objectStore("pendingOperations");
        await deleteStore.delete(op.id);
        await deleteTx.done;

        successCount++;
      } catch (error) {
        console.error(`Error syncing operation ${op.id}:`, error);
        errorCount++;

        // Update operation status
        const errorTx = db.transaction("pendingOperations", "readwrite");
        const errorStore = errorTx.objectStore("pendingOperations");
        op.status = "error";
        op.error = error.message;
        await errorStore.put(op);
        await errorTx.done;
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully synchronized ${successCount} operations`);
    }

    return {
      success: true,
      syncedCount: successCount,
      errorCount,
      remainingCount: pendingOps.length - successCount,
    };
  } catch (error) {
    console.error("Error syncing pending operations:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Cache trip update for offline sync
 * Compatible with previous routeDataCache.js implementation
 * @param {string} tripId - Trip identifier
 * @param {Object} updateData - The data to update
 */
export const cacheTripUpdate = async (tripId, updateData) => {
  if (!tripId || !updateData) return;

  await recordPendingOperation({
    table: "trips",
    action: "tripUpdate",
    tripId,
    updateData,
  });

  // Also maintain backward compatibility
  try {
    const pendingUpdates = JSON.parse(
      localStorage.getItem("verista_pending_updates") || "[]"
    );

    pendingUpdates.push({
      tripId,
      updateData,
      timestamp: Date.now(),
    });

    // Keep only the last 50 updates to prevent excessive storage
    if (pendingUpdates.length > 50) {
      pendingUpdates.shift();
    }

    localStorage.setItem(
      "verista_pending_updates",
      JSON.stringify(pendingUpdates)
    );
  } catch (e) {
    console.warn("Failed to cache trip update in localStorage:", e);
  }
};

/**
 * Get pending trip updates
 * Compatible with previous routeDataCache.js implementation
 * @returns {Promise<Array>} Array of pending updates
 */
export const getPendingTripUpdates = async () => {
  try {
    // Try both sources and merge them
    const pendingOps = await getFromIndexedDB("pendingOperations");
    const tripUpdates = pendingOps
      ? pendingOps.filter((op) => op.action === "tripUpdate")
      : [];

    // Also get from localStorage for backward compatibility
    try {
      const legacyUpdates = JSON.parse(
        localStorage.getItem("verista_pending_updates") || "[]"
      );

      // Merge without duplicates
      const tripIds = new Set(tripUpdates.map((update) => update.tripId));
      const uniqueLegacyUpdates = legacyUpdates.filter(
        (update) => !tripIds.has(update.tripId)
      );

      return [...tripUpdates, ...uniqueLegacyUpdates];
    } catch (e) {
      console.warn("Failed to get pending trip updates from localStorage:", e);
      return tripUpdates;
    }
  } catch (error) {
    console.error("Failed to get pending trip updates:", error);

    // Fall back to localStorage
    try {
      return JSON.parse(
        localStorage.getItem("verista_pending_updates") || "[]"
      );
    } catch (e) {
      console.warn(
        "Failed to parse pending trip updates from localStorage:",
        e
      );
      return [];
    }
  }
};

/**
 * Clear pending trip updates
 * Compatible with previous routeDataCache.js implementation
 */
export const clearPendingTripUpdates = async () => {
  try {
    // Clear from IndexedDB
    const db = await initDB();
    const tx = db.transaction("pendingOperations", "readwrite");
    const store = tx.objectStore("pendingOperations");
    const pendingOps = await store.getAll();

    for (const op of pendingOps) {
      if (op.action === "tripUpdate") {
        await store.delete(op.id);
      }
    }

    await tx.done;

    // Also clear from localStorage for backward compatibility
    localStorage.removeItem("verista_pending_updates");
  } catch (error) {
    console.error("Error clearing pending trip updates:", error);

    // At least try to clear localStorage
    localStorage.removeItem("verista_pending_updates");
  }
};

/**
 * Generate mock location data with optional variance from a base location
 * (From offlineFallback.js)
 * @param {Object} baseLocation - Optional base location to vary slightly
 * @param {string} vehicleId - Optional vehicle ID for consistent mock generation
 * @returns {Object} - Location data object
 */
export const generateLocation = (baseLocation = null, vehicleId = null) => {
  // Create deterministic "random" variation if vehicleId is provided
  const getVariance = () => {
    if (vehicleId) {
      // Simple hash function for vehicleId to get consistent variations
      const hash = vehicleId
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return ((hash % 20) - 10) / 1000; // Range of -0.01 to 0.01
    }
    return (Math.random() - 0.5) * 0.01; // Random range of -0.005 to 0.005
  };

  if (baseLocation) {
    // Slightly vary the existing location
    return {
      latitude: baseLocation.latitude + getVariance(),
      longitude: baseLocation.longitude + getVariance(),
      speed: Math.floor(Math.random() * 40) + 10,
      timestamp: new Date().toISOString(),
    };
  }

  // Default to Johannesburg with slight variation
  return {
    latitude: DEFAULT_CENTER.lat + getVariance(),
    longitude: DEFAULT_CENTER.lng + getVariance(),
    speed: Math.floor(Math.random() * 40) + 10,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Generate a mock trip based on route ID
 * (From offlineFallback.js)
 * @param {string} routeId - Route identifier
 * @param {string} vehicleId - Optional vehicle ID
 * @returns {Object} - Mock trip data
 */
export const generateMockTrip = (routeId, vehicleId = null) => {
  // Base mock trip data
  const mockTrip = {
    id: "mock-trip-" + Date.now(),
    status: "in_progress",
    start_time: new Date(Date.now() - 20 * 60000).toISOString(),
    estimated_arrival: new Date(Date.now() + 25 * 60000).toISOString(),
    vehicle: {
      id: vehicleId || "mock-vehicle-" + Math.floor(Math.random() * 1000),
      registration: "JHB-" + Math.floor(Math.random() * 900 + 100) + "-GP",
    },
    driver: {
      id: "mock-driver-" + Math.floor(Math.random() * 1000),
      name: "Default Driver",
      phone: "060-123-4567",
    },
    tracking_data: {
      last_location: {
        coordinates: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
        timestamp: new Date().toISOString(),
      },
      speed: Math.floor(Math.random() * 40) + 10,
    },
  };

  // Customize based on routeId if provided
  if (routeId) {
    // Predefined routes with sensible mock data
    const knownRoutes = {
      "morning-route": {
        name: "Morning School Route",
        stops: [
          {
            name: "Khanya Residence",
            time: "07:05 AM",
            status: "completed",
            students: 3,
          },
          {
            name: "Thabo Heights",
            time: "07:15 AM",
            status: "completed",
            students: 2,
          },
          {
            name: "Mandela Square",
            time: "07:25 AM",
            status: "active",
            students: 5,
          },
          {
            name: "Tutu Gardens",
            time: "07:35 AM",
            status: "upcoming",
            students: 4,
          },
          {
            name: "Central High School",
            time: "07:45 AM",
            status: "upcoming",
            students: 0,
            isDestination: true,
          },
        ],
      },
      "afternoon-route": {
        name: "Afternoon Return Route",
        stops: [
          {
            name: "Central High School",
            time: "14:30 PM",
            status: "completed",
            students: 14,
            isOrigin: true,
          },
          {
            name: "Tutu Gardens",
            time: "14:40 PM",
            status: "active",
            students: 4,
          },
          {
            name: "Mandela Square",
            time: "14:50 PM",
            status: "upcoming",
            students: 5,
          },
          {
            name: "Thabo Heights",
            time: "15:00 PM",
            status: "upcoming",
            students: 2,
          },
          {
            name: "Khanya Residence",
            time: "15:10 PM",
            status: "upcoming",
            students: 3,
          },
        ],
      },
    };

    const routeData = knownRoutes[routeId] || {
      name: "Route " + routeId,
      stops: [
        {
          name: "Starting Point",
          time: "08:00 AM",
          status: "completed",
          students: 0,
        },
        {
          name: "Middle Stop",
          time: "08:15 AM",
          status: "active",
          students: 5,
        },
        {
          name: "Final Destination",
          time: "08:30 AM",
          status: "upcoming",
          students: 0,
          isDestination: true,
        },
      ],
    };

    mockTrip.route = {
      id: routeId,
      name: routeData.name,
    };

    mockTrip.stops = routeData.stops;
  } else {
    mockTrip.route = {
      id: "default-route",
      name: "Default Route",
    };
  }

  return mockTrip;
};

/**
 * Create mock stop coordinates around a center point
 * (From offlineFallback.js)
 * @param {Array} stops - Array of stop objects
 * @param {Object} center - Center coordinates {lat, lng}
 * @returns {Array} - Stops with added coordinates
 */
export const createMockStopCoordinates = (stops, center = DEFAULT_CENTER) => {
  return stops.map((stop, index) => {
    // Generate coordinates in a rough circle around the center
    const angle = (index / stops.length) * 2 * Math.PI;
    const distance = 0.02; // ~2km radius

    const coordinates = {
      lat: center.lat + Math.sin(angle) * distance,
      lng: center.lng + Math.cos(angle) * distance,
    };

    return { ...stop, coordinates };
  });
};

/**
 * Return appropriate fallback data for student location tracking
 * (From offlineFallback.js)
 * @param {string} studentId - Student identifier
 * @returns {Object} - Student location data
 */
export const getStudentTrackingFallback = (studentId) => {
  const mockTrip = generateMockTrip("morning-route");

  // Add student-specific data
  return {
    ...mockTrip,
    student: {
      id: studentId,
      name: "Student " + studentId,
      grade: Math.floor(Math.random() * 12) + 1,
      status: "on_bus",
    },
  };
};

/**
 * Check if the application has a working network connection
 * (From offlineFallback.js)
 * @returns {boolean} True if online
 */
export const isOnline = () => {
  return navigator.onLine && connectionState.isConnected();
};

/**
 * Check if we should use fallback mode
 * (From offlineFallback.js)
 * @param {Object} status - Current system status
 * @returns {boolean} True if fallback should be used
 */
export const shouldUseFallback = (status = {}) => {
  const { isOffline, hasConnectionError, apiKeyMissing, hasTimeout } = status;
  return (
    isOffline ||
    hasConnectionError ||
    apiKeyMissing ||
    hasTimeout ||
    !navigator.onLine
  );
};

/**
 * Fetch data with offline support
 * @param {string} tableName - The table/entity to fetch
 * @param {Object} query - Query parameters
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result with data and metadata
 */
export const fetchWithOfflineSupport = async (
  tableName,
  query = {},
  options = {}
) => {
  // First try to get from IndexedDB (for immediate UI display)
  let cachedData = null;
  if (options.useCache !== false) {
    cachedData = await getFromIndexedDB(tableName);
  }

  // Only try online fetch if we're connected
  if (isOnline()) {
    try {
      // Start with the base query
      let queryBuilder = supabase.from(tableName).select(query.select || "*");

      // Apply filters if provided
      if (query.filters) {
        for (const [key, value] of Object.entries(query.filters)) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      }

      // Apply limit if provided
      if (query.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }

      // Apply order if provided
      if (query.order) {
        queryBuilder = queryBuilder.order(
          query.order.column,
          query.order.options
        );
      }

      // Execute the query
      const { data, error } = await queryBuilder;

      if (error) {
        throw error;
      }

      // Cache the fresh data
      if (data && options.cacheResults !== false) {
        await saveToIndexedDB(tableName, data);
      }

      return { data, error: null, source: "online" };
    } catch (error) {
      console.error(`Error fetching ${tableName} online:`, error);

      // If we have cached data, return it
      if (cachedData) {
        return { data: cachedData, error: null, source: "cache" };
      }

      // If no cached data, try to generate fallback
      if (options.useFallback !== false && tableName === "trips") {
        const fallbackData = generateMockTrip(query.filters?.route_id);
        return {
          data: [fallbackData],
          error: null,
          source: "fallback",
          isFallback: true,
        };
      }

      return { data: null, error, source: "error" };
    }
  } else {
    // We're offline, so use cached data or fallback
    if (cachedData) {
      return {
        data: cachedData,
        error: null,
        source: "cache",
        isOffline: true,
      };
    }

    // Generate fallback data for trips if requested
    if (options.useFallback !== false && tableName === "trips") {
      const fallbackData = generateMockTrip(query.filters?.route_id);
      return {
        data: [fallbackData],
        error: null,
        source: "fallback",
        isOffline: true,
        isFallback: true,
      };
    }

    return {
      data: null,
      error: new Error("Offline and no cached data available"),
      source: "error",
      isOffline: true,
    };
  }
};

/**
 * Initialize by registering service worker and setting up event listeners
 */
export const initializeOfflineSupport = () => {
  // Register service worker if available
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          "/service-worker.js"
        );
        console.log(
          "ServiceWorker registration successful with scope:",
          registration.scope
        );
      } catch (error) {
        console.error("ServiceWorker registration failed:", error);
      }
    });
  }

  // Initialize IndexedDB
  initDB().catch((error) => {
    console.error("Failed to initialize IndexedDB:", error);
  });

  // Set up online/offline event handlers
  window.addEventListener("online", () => {
    console.log("Application is online");
    toast.info("Connection restored. Synchronizing data...");
    syncPendingOperations();
  });

  window.addEventListener("offline", () => {
    console.log("Application is offline");
    toast.warn("You are offline. Limited functionality available.");
  });

  // Migrate data from localStorage to IndexedDB
  migrateFromLocalStorage();
};

/**
 * Migrate data from localStorage to IndexedDB for backward compatibility
 */
const migrateFromLocalStorage = async () => {
  try {
    const cachePrefix = "verista_route_";
    const routesToMigrate = [];

    // Find all cache keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(cachePrefix)) {
        try {
          const cacheItemRaw = localStorage.getItem(key);
          const cacheItem = JSON.parse(cacheItemRaw);

          if (cacheItem && cacheItem.data) {
            // Extract route ID
            const routeId = key.replace(cachePrefix, "").split("_")[0];

            routesToMigrate.push({
              routeId,
              data: cacheItem.data,
              timestamp: cacheItem.timestamp || Date.now(),
              expiry: cacheItem.expiry || Date.now() + 30 * 60 * 1000,
              version: CACHE_VERSION,
            });
          }
        } catch (e) {
          // Skip invalid entries
        }
      }
    }

    // Migrate pending updates
    try {
      const pendingUpdatesRaw = localStorage.getItem("verista_pending_updates");
      if (pendingUpdatesRaw) {
        const pendingUpdates = JSON.parse(pendingUpdatesRaw);

        for (const update of pendingUpdates) {
          await recordPendingOperation({
            table: "trips",
            action: "tripUpdate",
            tripId: update.tripId,
            updateData: update.updateData,
            timestamp: update.timestamp,
          });
        }
      }
    } catch (e) {
      console.warn("Error migrating pending updates:", e);
    }

    // Save migrated routes to IndexedDB
    if (routesToMigrate.length > 0) {
      for (const route of routesToMigrate) {
        await saveToIndexedDB("routeCache", route);
      }

      console.log(
        `Migrated ${routesToMigrate.length} routes from localStorage to IndexedDB`
      );
    }
  } catch (error) {
    console.error("Error during migration from localStorage:", error);
  }
};

// Export enhanced objects that provide both previous interface and new capabilities
export default {
  // Core functions
  initializeOfflineSupport,

  // IndexedDB functions
  saveToIndexedDB,
  getFromIndexedDB,

  // Route cache (from routeDataCache.js)
  cacheRouteData,
  getCachedRouteData,
  clearExpiredCaches,

  // Trip updates (from routeDataCache.js)
  cacheTripUpdate,
  getPendingTripUpdates,
  clearPendingTripUpdates,

  // Mock data generation (from offlineFallback.js)
  generateLocation,
  generateMockTrip,
  createMockStopCoordinates,
  getStudentTrackingFallback,
  isOnline,
  shouldUseFallback,

  // New enhanced functionality
  fetchWithOfflineSupport,
  syncPendingOperations,
  recordPendingOperation,

  // Constants
  DEFAULT_CENTER,
};
