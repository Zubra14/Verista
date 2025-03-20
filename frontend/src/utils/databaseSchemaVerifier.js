// src/utils/databaseSchemaVerifier.js
import supabase from '../lib/supabase';
import { toast } from 'react-toastify';

/**
 * Utility to verify database schema and handle missing objects gracefully
 */
const databaseSchemaVerifier = {
  /**
   * Check if a table exists in the database
   * @param {string} tableName - The table name to check
   * @returns {Promise<boolean>} - Whether the table exists
   */
  tableExists: async (tableName) => {
    try {
      // Use a simple query to check if the table exists
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      // If we get a specific error about relation not existing, the table is missing
      if (error && (error.code === '42P01' || error.message.includes('relation') && error.message.includes('does not exist'))) {
        return false;
      }
      
      // If another error occurs, assume permissions issue but table might exist
      if (error) {
        console.warn(`Limited permissions to check table ${tableName}:`, error);
        return true; // Assume table exists but we lack permissions
      }
      
      return true;
    } catch (err) {
      console.error(`Error checking if table ${tableName} exists:`, err);
      return false;
    }
  },
  
  /**
   * Check required tables and report missing ones
   * @returns {Promise<Object>} - Results of table verification
   */
  verifyTables: async () => {
    const results = {
      success: true,
      missingTables: [],
      checkedTables: []
    };
    
    // List of essential tables
    const requiredTables = ['routes', 'vehicles', 'trips', 'profiles', 'students'];
    
    for (const table of requiredTables) {
      try {
        const exists = await databaseSchemaVerifier.tableExists(table);
        results.checkedTables.push(table);
        
        if (!exists) {
          results.missingTables.push(table);
          results.success = false;
        }
      } catch (err) {
        console.error(`Error checking table ${table}:`, err);
      }
    }
    
    return results;
  },
  
  /**
   * Verify if we can access the route_vehicles view
   * @returns {Promise<boolean>} - Whether the view is accessible
   */
  checkRouteVehiclesView: async () => {
    try {
      // Try a simple query to the view
      const { error } = await supabase
        .from('route_vehicles')
        .select('route_id, vehicle_id')
        .limit(1);
      
      // If we get a specific error about relation not existing, the view is missing
      if (error && (error.code === '42P01' || error.message.includes('relation') && error.message.includes('does not exist'))) {
        return false;
      }
      
      // If no error, view exists and is accessible
      if (!error) {
        return true;
      }
      
      // For other errors, log but assume limited permissions
      console.warn('Limited permissions to access route_vehicles view:', error);
      return false;
    } catch (err) {
      console.error('Error checking route_vehicles view:', err);
      return false;
    }
  },
  
  /**
   * Verify if the get_active_trips_with_route_info function works
   * @returns {Promise<boolean>} - Whether the function is working
   */
  checkTripsFunction: async () => {
    try {
      // Try to call the function
      const { error } = await supabase.rpc('get_active_trips_with_route_info');
      
      // Check for function not found error
      if (error && (error.code === '42883' || error.message.includes('function') && error.message.includes('does not exist'))) {
        return false;
      }
      
      // If no error or a different error (like empty result), function likely exists
      return !error || error.code !== '42883';
    } catch (err) {
      console.error('Error checking trips function:', err);
      return false;
    }
  },
  
  /**
   * Create a join query function that will work regardless of view existence
   * @returns {Function} - A function to safely get route and vehicle data
   */
  createSafeJoinMethod: () => {
    // This returns a function that can be used in place of the view/function
    return async (routeId) => {
      try {
        // First get route data
        const { data: route, error: routeError } = await supabase
          .from('routes')
          .select('id, name, description, school_id, vehicle_id')
          .eq('id', routeId)
          .single();
        
        if (routeError) throw routeError;
        
        // If the route has a vehicle_id, get vehicle data
        if (route.vehicle_id) {
          const { data: vehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .select('id, registration, current_location, speed, location_updated_at')
            .eq('id', route.vehicle_id)
            .single();
            
          if (!vehicleError) {
            // Return combined data similar to the view
            return {
              route_id: route.id,
              route_name: route.name,
              description: route.description,
              school_id: route.school_id,
              vehicle_id: vehicle.id,
              registration: vehicle.registration,
              current_location: vehicle.current_location,
              speed: vehicle.speed,
              location_updated_at: vehicle.location_updated_at
            };
          }
        }
        
        // Return route data even if vehicle is not found
        return {
          route_id: route.id,
          route_name: route.name,
          description: route.description,
          school_id: route.school_id,
          vehicle_id: route.vehicle_id,
          registration: null,
          current_location: null,
          speed: null,
          location_updated_at: null
        };
      } catch (err) {
        console.error('Error in safe join method:', err);
        return null;
      }
    };
  },
  
  /**
   * Create a function to get active trips with route info that doesn't rely on the database function
   * @returns {Function} - A function to safely get trip data with route info
   */
  createSafeTripsMethod: () => {
    // This returns a function that can be used in place of the database function
    return async () => {
      try {
        // Get active trips
        const { data: trips, error: tripsError } = await supabase
          .from('trips')
          .select(`
            id,
            status,
            start_time,
            estimated_arrival,
            route_id,
            vehicle_id,
            driver_id,
            tracking_data
          `)
          .in('status', ['started', 'in_progress']);
        
        if (tripsError) throw tripsError;
        if (!trips || trips.length === 0) return [];
        
        // Get route data
        const routeIds = trips.map(trip => trip.route_id).filter(Boolean);
        const { data: routes, error: routesError } = await supabase
          .from('routes')
          .select('id, name')
          .in('id', routeIds);
          
        if (routesError) console.warn('Error fetching routes:', routesError);
        
        // Get vehicle data
        const vehicleIds = trips.map(trip => trip.vehicle_id).filter(Boolean);
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, registration, current_location, speed, location_updated_at')
          .in('id', vehicleIds);
          
        if (vehiclesError) console.warn('Error fetching vehicles:', vehiclesError);
        
        // Get driver data
        const driverIds = trips.map(trip => trip.driver_id).filter(Boolean);
        const { data: drivers, error: driversError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', driverIds);
          
        if (driversError) console.warn('Error fetching drivers:', driversError);
        
        // Create maps for lookup
        const routeMap = routes ? routes.reduce((map, route) => {
          map[route.id] = route;
          return map;
        }, {}) : {};
        
        const vehicleMap = vehicles ? vehicles.reduce((map, vehicle) => {
          map[vehicle.id] = vehicle;
          return map;
        }, {}) : {};
        
        const driverMap = drivers ? drivers.reduce((map, driver) => {
          map[driver.id] = driver;
          return map;
        }, {}) : {};
        
        // Format data similar to the database function
        return trips.map(trip => ({
          trip_id: trip.id,
          status: trip.status,
          start_time: trip.start_time,
          estimated_arrival: trip.estimated_arrival,
          route_id: trip.route_id,
          route_name: routeMap[trip.route_id]?.name || 'Unknown Route',
          vehicle_id: trip.vehicle_id,
          vehicle_registration: vehicleMap[trip.vehicle_id]?.registration || 'Unknown Vehicle',
          current_location: vehicleMap[trip.vehicle_id]?.current_location || null,
          driver_id: trip.driver_id,
          driver_name: driverMap[trip.driver_id]?.name || 'Unknown Driver',
          tracking_data: trip.tracking_data
        }));
      } catch (err) {
        console.error('Error in safe trips method:', err);
        return [];
      }
    };
  },
  
  /**
   * Register fallback methods in the global window object
   * to make them available across the application
   */
  registerFallbackMethods: () => {
    // Create global object for fallback methods if not exists
    if (!window.veristaFallbacks) {
      window.veristaFallbacks = {};
    }
    
    // Add fallback methods
    window.veristaFallbacks.getRouteVehicleData = databaseSchemaVerifier.createSafeJoinMethod();
    window.veristaFallbacks.getActiveTripsWithRouteInfo = databaseSchemaVerifier.createSafeTripsMethod();
    
    console.log('Registered fallback methods for missing database objects');
  },
  
  /**
   * Main method to verify schema and set up fallbacks
   * @returns {Promise<Object>} - Verification results
   */
  verifySchema: async () => {
    const results = {
      tables: { checked: false, success: false, missingTables: [] },
      views: { checked: false, exists: false },
      functions: { checked: false, exists: false }
    };
    
    try {
      // Check tables
      const tableResults = await databaseSchemaVerifier.verifyTables();
      results.tables = {
        checked: true,
        success: tableResults.success,
        missingTables: tableResults.missingTables
      };
      
      // Check view
      const viewExists = await databaseSchemaVerifier.checkRouteVehiclesView();
      results.views = {
        checked: true,
        exists: viewExists
      };
      
      // Check function
      const functionExists = await databaseSchemaVerifier.checkTripsFunction();
      results.functions = {
        checked: true,
        exists: functionExists
      };
      
      // Register fallback methods regardless of verification results
      // This ensures the app can work even with limited database objects
      databaseSchemaVerifier.registerFallbackMethods();
      
      return results;
    } catch (err) {
      console.error('Error during schema verification:', err);
      
      // Register fallbacks even if verification fails
      databaseSchemaVerifier.registerFallbackMethods();
      
      return {
        ...results,
        error: err.message
      };
    }
  },
  
  /**
   * Initialize database schema checking and setup fallbacks
   */
  initialize: async () => {
    try {
      // Run verification and log results
      const results = await databaseSchemaVerifier.verifySchema();
      console.log('Database schema verification results:', results);
      
      // Show appropriate notifications based on results
      if (results.tables.checked && !results.tables.success) {
        const missing = results.tables.missingTables.join(', ');
        toast.warning(`Some required database tables are missing: ${missing}. Contact support.`, {
          autoClose: 8000
        });
      }
      
      if (results.views.checked && !results.views.exists) {
        toast.info('Using fallback methods for route-vehicle data. Performance may be affected.', {
          autoClose: 5000
        });
      }
      
      if (results.functions.checked && !results.functions.exists) {
        toast.info('Using fallback methods for trips data. Performance may be affected.', {
          autoClose: 5000
        });
      }
      
      return results;
    } catch (err) {
      console.error('Failed to initialize database schema verification:', err);
      
      // Always register fallbacks for safety
      databaseSchemaVerifier.registerFallbackMethods();
      
      toast.error('Database connection issues detected. Limited functionality available.', {
        autoClose: 8000
      });
      
      return {
        error: err.message,
        fallbacksRegistered: true
      };
    }
  }
};

export default databaseSchemaVerifier;