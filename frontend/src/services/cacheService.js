import supabase from '../lib/supabase';

// Cache keys
const CACHE_KEYS = {
  USER_PROFILE: 'verista_user_profile',
  ROUTE: 'verista_route_',
  VEHICLE: 'verista_vehicle_',
  STUDENTS: 'verista_students_',
  TRIPS: 'verista_trips_',
};

// Cache expiration times (in milliseconds)
const CACHE_EXPIRY = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 24 * 60 * 60 * 1000, // 24 hours
};

// Cache item with timestamp and expiry
const setCacheItem = (key, data, expiryTime = CACHE_EXPIRY.MEDIUM) => {
  const item = {
    data,
    timestamp: Date.now(),
    expiry: Date.now() + expiryTime,
  };
  
  localStorage.setItem(key, JSON.stringify(item));
};

// Get cache item if not expired
const getCacheItem = (key) => {
  try {
    const itemStr = localStorage.getItem(key);
    
    if (!itemStr) return null;
    
    const item = JSON.parse(itemStr);
    
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.data;
  } catch (error) {
    console.error('Cache retrieval error:', error);
    localStorage.removeItem(key);
    return null;
  }
};

// Clear all cache items
export const clearCache = () => {
  Object.values(CACHE_KEYS).forEach(keyPrefix => {
    Object.keys(localStorage).forEach(key => {
      if (key === keyPrefix || key.startsWith(keyPrefix)) {
        localStorage.removeItem(key);
      }
    });
  });
};

// Cache user profile
export const cacheUserProfile = (profileData) => {
  setCacheItem(CACHE_KEYS.USER_PROFILE, profileData, CACHE_EXPIRY.LONG);
};

// Get cached user profile
export const getCachedUserProfile = () => {
  return getCacheItem(CACHE_KEYS.USER_PROFILE);
};

// Cache route data
export const cacheRouteData = async (routeId, forceFetch = false) => {
  const cacheKey = CACHE_KEYS.ROUTE + routeId;
  
  // Return cached data if available and not force fetching
  if (!forceFetch) {
    const cachedData = getCacheItem(cacheKey);
    if (cachedData) return cachedData;
  }
  
  try {
    // Fetch from API
    const { data, error } = await supabase
      .from('routes')
      .select(`
        *,
        schools:school_id(*),
        trips:id(*)
      `)
      .eq('id', routeId)
      .single();
    
    if (error) throw error;
    
    // Cache the result
    setCacheItem(cacheKey, data, CACHE_EXPIRY.MEDIUM);
    return data;
  } catch (error) {
    console.error('Failed to fetch route data:', error);
    return null;
  }
};

// Cache vehicle data
export const cacheVehicleData = async (vehicleId, forceFetch = false) => {
  const cacheKey = CACHE_KEYS.VEHICLE + vehicleId;
  
  if (!forceFetch) {
    const cachedData = getCacheItem(cacheKey);
    if (cachedData) return cachedData;
  }
  
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();
    
    if (error) throw error;
    
    setCacheItem(cacheKey, data, CACHE_EXPIRY.SHORT); // Short cache for vehicles as they move
    return data;
  } catch (error) {
    console.error('Failed to fetch vehicle data:', error);
    return null;
  }
};

// Cache students for a parent
export const cacheParentStudents = async (parentId, forceFetch = false) => {
  const cacheKey = CACHE_KEYS.STUDENTS + parentId;
  
  if (!forceFetch) {
    const cachedData = getCacheItem(cacheKey);
    if (cachedData) return cachedData;
  }
  
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        school:school_id(*),
        route:route_id(*)
      `)
      .eq('parent_id', parentId);
    
    if (error) throw error;
    
    setCacheItem(cacheKey, data, CACHE_EXPIRY.MEDIUM);
    return data;
  } catch (error) {
    console.error('Failed to fetch parent students:', error);
    return [];
  }
};

// Sync offline changes when online
export const syncOfflineChanges = async () => {
  // Check if there's a connection
  if (!navigator.onLine) return { success: false, reason: 'offline' };
  
  try {
    // Implementation depends on your offline capabilities
    // This is a placeholder for potential offline changes
    const pendingChanges = localStorage.getItem('verista_pending_changes');
    
    if (!pendingChanges) return { success: true, changes: 0 };
    
    const changes = JSON.parse(pendingChanges);
    let syncedCount = 0;
    
    // Process each pending change
    for (const change of changes) {
      if (change.table && change.operation && change.data) {
        let result;
        
        switch (change.operation) {
          case 'insert':
            result = await supabase.from(change.table).insert(change.data);
            break;
          case 'update':
            result = await supabase.from(change.table)
              .update(change.data)
              .eq('id', change.id);
            break;
          case 'delete':
            result = await supabase.from(change.table)
              .delete()
              .eq('id', change.id);
            break;
        }
        
        if (!result.error) syncedCount++;
      }
    }
    
    // Clear synced changes
    localStorage.removeItem('verista_pending_changes');
    
    return { success: true, changes: syncedCount };
  } catch (error) {
    console.error('Failed to sync offline changes:', error);
    return { success: false, error };
  }
};

// Check sync
export const checkAndSyncChanges = async () => {
  window.addEventListener('online', () => {
    syncOfflineChanges().then(result => {
      if (result.success && result.changes > 0) {
        console.log(`Synced ${result.changes} offline changes`);
      }
    });
  });
};

// Initialize offline sync
export const initializeOfflineSync = () => {
  checkAndSyncChanges();
};