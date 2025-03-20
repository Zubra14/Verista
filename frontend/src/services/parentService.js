import supabase from '../lib/supabase';
import { handleSupabaseError } from '../lib/supabase';
import { cacheParentStudents, getCacheItem, CACHE_KEYS } from './cacheService';

// Get parent profile with children
export const getParentProfile = async (parentId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', parentId)
      .eq('role', 'parent')
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleSupabaseError(error, 'Failed to load parent profile');
  }
};

// Get parent's children/students
export const getParentStudents = async (parentId, useCache = true) => {
  try {
    // Try cache first
    if (useCache) {
      const cachedData = await cacheParentStudents(parentId, false);
      if (cachedData) return { data: cachedData };
    }
    
    // Fetch from API
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        name,
        grade,
        school_id,
        route_id,
        schools:school_id(id, name),
        routes:route_id(id, name)
      `)
      .eq('parent_id', parentId);
    
    if (error) throw error;
    
    // Update cache
    if (data) {
      cacheParentStudents(parentId, data);
    }
    
    return { data };
  } catch (error) {
    return handleSupabaseError(error, 'Failed to load student information');
  }
};

// Get trip history for a student
export const getStudentTripHistory = async (studentId, page = 0, pageSize = 10) => {
  try {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    const { data, count, error } = await supabase
      .from('trips')
      .select(`
        id,
        route_id,
        start_time,
        end_time,
        status,
        routes:route_id(name)
      `, { count: 'exact' })
      .eq('student_id', studentId)
      .order('start_time', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    
    return {
      data,
      totalCount: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize)
    };
  } catch (error) {
    return handleSupabaseError(error, 'Failed to load trip history');
  }
};

// Get active trip details
export const getActiveTripDetails = async (tripId) => {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        id,
        route_id,
        vehicle_id,
        driver_id,
        start_time,
        status,
        current_location,
        routes:route_id(*),
        vehicles:vehicle_id(*),
        drivers:driver_id(id, name, phone)
      `)
      .eq('id', tripId)
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleSupabaseError(error, 'Failed to load trip details');
  }
};

// Update parent notification preferences
export const updateNotificationPreferences = async (parentId, preferences) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        notification_preferences: preferences
      })
      .eq('id', parentId)
      .eq('role', 'parent');
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return handleSupabaseError(error, 'Failed to update notification preferences');
  }
};