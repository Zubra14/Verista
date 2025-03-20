// src/utils/dataOperations.js
import supabase, { getConnectionStatus } from '../lib/supabase';

export const fetchWithOfflineFallback = async (table, query, options = {}) => {
  const cacheKey = `verista_${table}_${JSON.stringify(query)}`;
  
  try {
    // Try to get from cache first if offline
    if (!getConnectionStatus()) {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        return { data: JSON.parse(cachedData), source: 'cache' };
      }
      throw new Error('Offline and no cached data available');
    }
    
    // Attempt to fetch from Supabase
    const { data, error } = await supabase.from(table).select(query);
    
    if (error) throw error;
    
    // Cache successful response
    localStorage.setItem(cacheKey, JSON.stringify(data));
    
    return { data, source: 'server' };
  } catch (error) {
    console.error(`Error fetching ${table}:`, error);
    
    // Try to use cached data as fallback
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      return { data: JSON.parse(cachedData), source: 'cache' };
    }
    
    // No cached data available
    return { error, data: null, source: 'error' };
  }
};