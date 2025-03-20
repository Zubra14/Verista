import supabase from '../lib/supabase';
import { toast } from 'react-toastify';

// Cache keys for offline data
const CACHE_KEYS = {
  CURRENT_ROUTE: 'driver_current_route',
  ASSIGNED_STUDENTS: 'driver_assigned_students',
};

// Helper for offline mode detection
const isOffline = () => !navigator.onLine;

// Cache data with expiry
const cacheData = (key, data, expiryMinutes = 30) => {
  const item = {
    data,
    expiry: Date.now() + (expiryMinutes * 60 * 1000)
  };
  localStorage.setItem(key, JSON.stringify(item));
};

// Get cached data if not expired
const getCachedData = (key) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const parsedItem = JSON.parse(item);
    if (Date.now() > parsedItem.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsedItem.data;
  } catch (error) {
    console.error(`Error reading cached data for ${key}:`, error);
    return null;
  }
};

// Add to pending changes queue for offline sync
const addToPendingChanges = (operation) => {
  try {
    const pendingChanges = JSON.parse(localStorage.getItem('verista_pending_changes') || '[]');
    pendingChanges.push({
      ...operation,
      timestamp: Date.now()
    });
    localStorage.setItem('verista_pending_changes', JSON.stringify(pendingChanges));
  } catch (error) {
    console.error('Error adding to pending changes:', error);
  }
};

const driverService = {
  getCurrentRoute: async () => {
    try {
      // Check for cached data if offline
      if (isOffline()) {
        const cachedRoute = getCachedData(CACHE_KEYS.CURRENT_ROUTE);
        if (cachedRoute) {
          console.log('Using cached route data (offline)');
          return cachedRoute;
        }
        throw new Error('You are offline and no cached data is available');
      }
      
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // Get current active trip
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          route:route_id (*),
          vehicle:vehicle_id (*),
          school:school_id (id, name, address, phone),
          trip_students (
            student:student_id (*)
          )
        `)
        .eq('driver_id', user.user.id)
        .eq('status', 'in_progress')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // If no active trip, check for upcoming trips
      if (!data) {
        const { data: scheduledTrip, error: scheduledError } = await supabase
          .from('trips')
          .select(`
            *,
            route:route_id (*),
            vehicle:vehicle_id (*),
            school:school_id (id, name, address, phone),
            trip_students (
              student:student_id (*)
            )
          `)
          .eq('driver_id', user.user.id)
          .eq('status', 'scheduled')
          .order('start_time', { ascending: true })
          .limit(1)
          .single();
        
        if (scheduledError && scheduledError.code !== 'PGRST116') throw scheduledError;
        
        // Cache the scheduled trip data
        if (scheduledTrip) {
          cacheData(CACHE_KEYS.CURRENT_ROUTE, scheduledTrip);
        }
        
        return scheduledTrip || null;
      }
      
      // Cache the active trip data
      cacheData(CACHE_KEYS.CURRENT_ROUTE, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching current route:', error);
      
      // Only show toast if not offline (we handle offline case separately)
      if (!isOffline() || !error.message.includes('offline')) {
        toast.error('Failed to fetch current route');
      }
      
      throw error;
    }
  },
  
  startTrip: async (tripId) => {
    try {
      if (isOffline()) {
        toast.warning('You are offline. This action will be synced when you reconnect.');
        
        // Add to pending changes for sync when online
        addToPendingChanges({
          operation: 'start_trip',
          tripId,
          timestamp: Date.now()
        });
        
        // Update local cache for UI consistency
        const cachedRoute = getCachedData(CACHE_KEYS.CURRENT_ROUTE);
        if (cachedRoute && cachedRoute.id === tripId) {
          cachedRoute.status = 'in_progress';
          cachedRoute.start_time = new Date().toISOString();
          cacheData(CACHE_KEYS.CURRENT_ROUTE, cachedRoute);
          return cachedRoute;
        }
        
        return null;
      }
      
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // Update trip status
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('trips')
        .update({
          status: 'in_progress',
          start_time: now
        })
        .eq('id', tripId)
        .eq('driver_id', user.user.id)
        .eq('status', 'scheduled')
        .select()
        .single();
      
      if (error) throw error;
      
      // Update cache
      cacheData(CACHE_KEYS.CURRENT_ROUTE, data);
      
      toast.success('Trip started successfully');
      return data;
    } catch (error) {
      console.error('Error starting trip:', error);
      toast.error('Failed to start trip');
      throw error;
    }
  },
  
  endTrip: async (tripId) => {
    try {
      if (isOffline()) {
        toast.warning('You are offline. This action will be synced when you reconnect.');
        
        // Add to pending changes for sync when online
        addToPendingChanges({
          operation: 'end_trip',
          tripId,
          timestamp: Date.now()
        });
        
        // Update local cache for UI consistency
        const cachedRoute = getCachedData(CACHE_KEYS.CURRENT_ROUTE);
        if (cachedRoute && cachedRoute.id === tripId) {
          cachedRoute.status = 'completed';
          cachedRoute.end_time = new Date().toISOString();
          cachedRoute.actual_arrival = new Date().toISOString();
          cacheData(CACHE_KEYS.CURRENT_ROUTE, cachedRoute);
          return cachedRoute;
        }
        
        return null;
      }
      
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // Update trip status
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('trips')
        .update({
          status: 'completed',
          end_time: now,
          actual_arrival: now
        })
        .eq('id', tripId)
        .eq('driver_id', user.user.id)
        .eq('status', 'in_progress')
        .select()
        .single();
      
      if (error) throw error;
      
      // Clear current_trip_id from students
      await supabase
        .from('students')
        .update({ current_trip_id: null })
        .eq('current_trip_id', tripId);
      
      // Clear cache since the trip is completed
      localStorage.removeItem(CACHE_KEYS.CURRENT_ROUTE);
      
      toast.success('Trip completed successfully');
      return data;
    } catch (error) {
      console.error('Error ending trip:', error);
      toast.error('Failed to end trip');
      throw error;
    }
  },
  
  getAssignedStudents: async (tripId = null) => {
    try {
      // Check for cached data if offline
      if (isOffline()) {
        const cachedStudents = getCachedData(CACHE_KEYS.ASSIGNED_STUDENTS);
        if (cachedStudents) {
          console.log('Using cached student data (offline)');
          return cachedStudents;
        }
        throw new Error('You are offline and no cached data is available');
      }
      
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // If tripId provided, get students for that trip
      if (tripId) {
        const { data, error } = await supabase
          .from('trip_students')
          .select(`
            status,
            timestamp,
            student:student_id (*)
          `)
          .eq('trip_id', tripId);
        
        if (error) throw error;
        
        // Format the response
        const formattedData = data.map(item => ({
          ...item.student,
          trip_status: item.status,
          timestamp: item.timestamp
        }));
        
        // Cache the result
        cacheData(CACHE_KEYS.ASSIGNED_STUDENTS, formattedData);
        
        return formattedData;
      }
      
      // Otherwise, get current active trip
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('id')
        .eq('driver_id', user.user.id)
        .eq('status', 'in_progress')
        .single();
      
      if (tripError && tripError.code !== 'PGRST116') throw tripError;
      
      // If no active trip, return empty array
      if (!tripData) {
        cacheData(CACHE_KEYS.ASSIGNED_STUDENTS, []);
        return [];
      }
      
      // Get students for active trip
      const { data, error } = await supabase
        .from('trip_students')
        .select(`
          status,
          timestamp,
          student:student_id (*)
        `)
        .eq('trip_id', tripData.id);
      
      if (error) throw error;
      
      // Format the response
      const formattedData = data.map(item => ({
        ...item.student,
        trip_status: item.status,
        timestamp: item.timestamp
      }));
      
      // Cache the result
      cacheData(CACHE_KEYS.ASSIGNED_STUDENTS, formattedData);
      
      return formattedData;
    } catch (error) {
      console.error('Error fetching assigned students:', error);
      
      // Only show toast if not offline (we handle offline case separately)
      if (!isOffline() || !error.message.includes('offline')) {
        toast.error('Failed to fetch assigned students');
      }
      
      throw error;
    }
  },
  
  updateStudentStatus: async (studentId, status, tripId) => {
    try {
      if (isOffline()) {
        toast.warning('You are offline. Student status will be updated when you reconnect.');
        
        // Add to pending changes for sync when online
        addToPendingChanges({
          operation: 'update_student_status',
          studentId,
          status,
          tripId,
          timestamp: Date.now()
        });
        
        // Update local cache for UI consistency
        const cachedStudents = getCachedData(CACHE_KEYS.ASSIGNED_STUDENTS);
        if (cachedStudents) {
          const updatedStudents = cachedStudents.map(student => {
            if (student.id === studentId) {
              return {
                ...student,
                trip_status: status,
                timestamp: new Date().toISOString()
              };
            }
            return student;
          });
          
          cacheData(CACHE_KEYS.ASSIGNED_STUDENTS, updatedStudents);
        }
        
        return { success: true, offline: true };
      }
      
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // Verify status is valid
      if (!['waiting', 'picked_up', 'dropped_off', 'absent'].includes(status)) {
        throw new Error('Invalid status');
      }
      
      // Update trip_students status
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('trip_students')
        .update({
          status,
          timestamp: now
        })
        .eq('student_id', studentId)
        .eq('trip_id', tripId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update student current_status
      await supabase
        .from('students')
        .update({
          current_status: status,
          ...(status === 'picked_up' ? { current_trip_id: tripId } : {})
        })
        .eq('id', studentId);
      
      // Update cached students list
      const cachedStudents = getCachedData(CACHE_KEYS.ASSIGNED_STUDENTS);
      if (cachedStudents) {
        const updatedStudents = cachedStudents.map(student => {
          if (student.id === studentId) {
            return {
              ...student,
              trip_status: status,
              timestamp: now
            };
          }
          return student;
        });
        
        cacheData(CACHE_KEYS.ASSIGNED_STUDENTS, updatedStudents);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating student status:', error);
      toast.error('Failed to update student status');
      throw error;
    }
  },
  
  reportIssue: async (tripId, issueData) => {
    try {
      if (isOffline()) {
        toast.warning('You are offline. Issue will be reported when you reconnect.');
        
        // Add to pending changes for sync when online
        addToPendingChanges({
          operation: 'report_issue',
          tripId,
          issueData,
          timestamp: Date.now()
        });
        
        return { success: true, offline: true };
      }
      
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      const { type, description, latitude, longitude } = issueData;
      
      // Create location point if coordinates provided
      let locationPoint = null;
      if (latitude && longitude) {
        locationPoint = `POINT(${longitude} ${latitude})`;
      }
      
      // Insert incident
      const { data, error } = await supabase
        .from('trip_incidents')
        .insert({
          trip_id: tripId,
          type,
          description,
          location: locationPoint,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Issue reported successfully');
      return data;
    } catch (error) {
      console.error('Error reporting issue:', error);
      toast.error('Failed to report issue');
      throw error;
    }
  },
  
  updateLocation: async (locationData) => {
    try {
      if (isOffline()) {
        // Store location updates locally for sync when reconnected
        const offlineLocations = JSON.parse(localStorage.getItem('offline_location_updates') || '[]');
        offlineLocations.push({
          ...locationData,
          timestamp: new Date().toISOString()
        });
        
        // Keep only the last 100 location points to prevent excessive storage usage
        if (offlineLocations.length > 100) {
          offlineLocations.shift(); // Remove oldest
        }
        
        localStorage.setItem('offline_location_updates', JSON.stringify(offlineLocations));
        return { success: true, offline: true };
      }
      
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      const { latitude, longitude, tripId, speed } = locationData;
      
      // Update vehicle location
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({
          current_location: `POINT(${longitude} ${latitude})`,
          location_updated_at: new Date().toISOString(),
          speed: speed || 0
        })
        .eq('driver_id', user.user.id);
      
      if (vehicleError) throw vehicleError;
      
      // Update trip tracking data if tripId provided
      if (tripId) {
        // Process in background - don't wait for response to improve performance
        (async () => {
          try {
            // Get current tracking data
            const { data: tripData, error: tripError } = await supabase
              .from('trips')
              .select('tracking_data')
              .eq('id', tripId)
              .single();
            
            if (tripError) {
              console.error('Error fetching trip tracking data:', tripError);
              return;
            }
            
            // Update tracking data
            const trackingData = tripData.tracking_data || { path: [], last_location: null };
            
            // Add to path
            trackingData.path.push({
              coordinates: [longitude, latitude],
              timestamp: new Date().toISOString(),
              speed: speed || 0
            });
            
            // Keep only the last 1000 path points to prevent excessive data
            if (trackingData.path.length > 1000) {
              trackingData.path = trackingData.path.slice(trackingData.path.length - 1000);
            }
            
            // Update last location
            trackingData.last_location = {
              coordinates: [longitude, latitude],
              timestamp: new Date().toISOString()
            };
            
            // Update trip
            const { error: updateError } = await supabase
              .from('trips')
              .update({ tracking_data: trackingData })
              .eq('id', tripId);
            
            if (updateError) {
              console.error('Error updating trip tracking data:', updateError);
            }
          } catch (error) {
            console.error('Error in background tracking update:', error);
          }
        })();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating location:', error);
      return { success: false }; // Silent failure for background updates
    }
  },
  
  // New function to sync offline changes
  syncOfflineChanges: async () => {
    if (isOffline()) {
      return { success: false, message: 'Still offline' };
    }
    
    try {
      // Process location updates first
      const offlineLocations = JSON.parse(localStorage.getItem('offline_location_updates') || '[]');
      
      if (offlineLocations.length > 0) {
        console.log(`Syncing ${offlineLocations.length} offline location updates`);
        
        // Process in batches to avoid overwhelming the server
        const batchSize = 10;
        for (let i = 0; i < offlineLocations.length; i += batchSize) {
          const batch = offlineLocations.slice(i, i + batchSize);
          
          // Process batch sequentially
          for (const location of batch) {
            await driverService.updateLocation(location);
          }
        }
        
        // Clear processed locations
        localStorage.removeItem('offline_location_updates');
      }
      
      // Process other pending changes
      const pendingChanges = JSON.parse(localStorage.getItem('verista_pending_changes') || '[]');
      
      if (pendingChanges.length > 0) {
        console.log(`Syncing ${pendingChanges.length} pending operations`);
        
        // Process each operation based on type
        for (const change of pendingChanges) {
          switch (change.operation) {
            case 'start_trip':
              await driverService.startTrip(change.tripId);
              break;
              
            case 'end_trip':
              await driverService.endTrip(change.tripId);
              break;
              
            case 'update_student_status':
              await driverService.updateStudentStatus(
                change.studentId,
                change.status,
                change.tripId
              );
              break;
              
            case 'report_issue':
              await driverService.reportIssue(change.tripId, change.issueData);
              break;
          }
        }
        
        // Clear processed changes
        localStorage.removeItem('verista_pending_changes');
      }
      
      if (offlineLocations.length > 0 || pendingChanges.length > 0) {
        toast.success('Synchronized offline changes successfully');
      }
      
      return { 
        success: true, 
        syncedItems: offlineLocations.length + pendingChanges.length 
      };
    } catch (error) {
      console.error('Error syncing offline changes:', error);
      toast.error('Failed to sync some offline changes');
      return { success: false, error };
    }
  }
};

// Set up automatic sync when coming back online
window.addEventListener('online', () => {
  console.log('Back online, attempting to sync changes');
  driverService.syncOfflineChanges().then(result => {
    console.log('Sync result:', result);
  });
});

export default driverService;