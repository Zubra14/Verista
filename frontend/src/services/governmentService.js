import supabase from '../lib/supabase';
import { toast } from 'react-toastify';

const governmentService = {
  getDashboardStats: async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // Get vehicle counts
      const { count: totalVehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });
      
      if (vehicleError) throw vehicleError;
      
      // Get non-compliant vehicles (expired inspections)
      const now = new Date().toISOString();
      const { count: expiredInspections, error: inspectionError } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .lt('next_inspection_due', now);
      
      if (inspectionError) throw inspectionError;
      
      // Get driver counts
      const { count: totalDrivers, error: driverError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'driver');
      
      if (driverError) throw driverError;
      
      // Get verified drivers
      const { count: verifiedDrivers, error: verifiedError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'driver')
        .eq('is_verified', true);
      
      if (verifiedError) throw verifiedError;
      
      // Get school counts
      const { count: schoolCount, error: schoolError } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true });
      
      if (schoolError) throw schoolError;
      
      // Get trip counts
      const { count: tripCount, error: tripError } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true });
      
      if (tripError) throw tripError;
      
      // Get incident counts
      const { count: incidentCount, error: incidentError } = await supabase
        .from('trip_incidents')
        .select('*', { count: 'exact', head: true });
      
      if (incidentError) throw incidentError;
      
      // Get unresolved incidents
      const { count: unresolvedIncidents, error: unresolvedError } = await supabase
        .from('trip_incidents')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', false);
      
      if (unresolvedError) throw unresolvedError;
      
      // Calculate compliance rates
      const vehicleComplianceRate = totalVehicles > 0 
        ? Math.round(((totalVehicles - expiredInspections) / totalVehicles) * 100) 
        : 100;
      
      const driverComplianceRate = totalDrivers > 0 
        ? Math.round((verifiedDrivers / totalDrivers) * 100) 
        : 100;
      
      return {
        vehicles: {
          total: totalVehicles,
          compliant: totalVehicles - expiredInspections,
          complianceRate: vehicleComplianceRate
        },
        drivers: {
          total: totalDrivers,
          verified: verifiedDrivers,
          complianceRate: driverComplianceRate
        },
        schools: schoolCount,
        trips: tripCount,
        incidents: {
          total: incidentCount,
          unresolved: unresolvedIncidents
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to fetch dashboard statistics');
      throw error;
    }
  },
  
  getVehicleCompliance: async (filters = {}) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // Build query
      let query = supabase
        .from('vehicles')
        .select(`
          *,
          driver:driver_id (id, name, phone)
        `);
      
      // Add filters
      if (filters.status === 'non-compliant') {
        const now = new Date().toISOString();
        query = query.lt('next_inspection_due', now);
      } else if (filters.status === 'compliant') {
        const now = new Date().toISOString();
        query = query.gte('next_inspection_due', now);
      }
      
      // Add pagination
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }
      
      // Add ordering
      query = query.order('next_inspection_due', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching vehicle compliance:', error);
      toast.error('Failed to fetch vehicle compliance data');
      throw error;
    }
  },
  
  getDrivers: async (filters = {}) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // Build query
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'driver');
      
      // Add filters
      if (filters.status === 'verified') {
        query = query.eq('is_verified', true);
      } else if (filters.status === 'unverified') {
        query = query.eq('is_verified', false);
      }
      
      // Add pagination
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }
      
      // Add ordering
      query = query.order('name', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Failed to fetch drivers');
      throw error;
    }
  },
  
  getIncidents: async (filters = {}) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // Build query
      let query = supabase
        .from('trip_incidents')
        .select(`
          *,
          trip:trip_id (
            id,
            driver:driver_id (id, name, phone),
            vehicle:vehicle_id (id, registration, make, model),
            school:school_id (id, name)
          )
        `);
      
      // Add filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      
      if (filters.status === 'resolved') {
        query = query.eq('resolved', true);
      } else if (filters.status === 'unresolved') {
        query = query.eq('resolved', false);
      }
      
      // Add pagination
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }
      
      // Add ordering
      query = query.order('timestamp', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast.error('Failed to fetch incidents');
      throw error;
    }
  },
  
  updateDriverVerification: async (driverId, isVerified) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // Update driver verification status
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_verified: isVerified })
        .eq('id', driverId)
        .eq('role', 'driver')
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success(isVerified 
        ? 'Driver has been approved and verified' 
        : 'Driver verification has been revoked');
      
      return data;
    } catch (error) {
      console.error('Error updating driver verification:', error);
      toast.error('Failed to update driver verification');
      throw error;
    }
  },
  
  updateIncidentResolution: async (incidentId, resolved, resolutionDetails = '') => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // Update incident resolution
      const { data, error } = await supabase
        .from('trip_incidents')
        .update({ 
          resolved,
          resolution_details: resolutionDetails
        })
        .eq('id', incidentId)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success(resolved 
        ? 'Incident has been marked as resolved' 
        : 'Incident has been marked as unresolved');
      
      return data;
    } catch (error) {
      console.error('Error updating incident resolution:', error);
      toast.error('Failed to update incident resolution');
      throw error;
    }
  },
  
  getAnalytics: async (timeframe = 'month') => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // Define date range based on timeframe
      const now = new Date();
      let startDate;
      
      switch (timeframe) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
      }
      
      const startDateISO = startDate.toISOString();
      
      // Get trip data
      const { data: trips, error: tripError } = await supabase
        .from('trips')
        .select('start_time, status')
        .gte('start_time', startDateISO);
      
      if (tripError) throw tripError;
      
      // Get incident data
      const { data: incidents, error: incidentError } = await supabase
        .from('trip_incidents')
        .select('type, timestamp, resolved')
        .gte('timestamp', startDateISO);
      
      if (incidentError) throw incidentError;
      
      // Process data for visualization
      // Group trips by date
      const tripsByDate = {};
      trips.forEach(trip => {
        const date = trip.start_time.split('T')[0];
        if (!tripsByDate[date]) {
          tripsByDate[date] = { total: 0, completed: 0, cancelled: 0 };
        }
        tripsByDate[date].total++;
        if (trip.status === 'completed') tripsByDate[date].completed++;
        if (trip.status === 'cancelled') tripsByDate[date].cancelled++;
      });
      
      // Group incidents by type
      const incidentsByType = {};
      incidents.forEach(incident => {
        if (!incidentsByType[incident.type]) {
          incidentsByType[incident.type] = 0;
        }
        incidentsByType[incident.type]++;
      });
      
      return {
        trips: {
          byDate: tripsByDate,
          total: trips.length,
          completed: trips.filter(t => t.status === 'completed').length,
          cancelled: trips.filter(t => t.status === 'cancelled').length
        },
        incidents: {
          byType: incidentsByType,
          total: incidents.length,
          resolved: incidents.filter(i => i.resolved).length,
          unresolved: incidents.filter(i => !i.resolved).length
        },
        timeframe
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
      throw error;
    }
  },
  
  getSchools: async (filters = {}) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // Build query
      let query = supabase
        .from('schools')
        .select(`
          *,
          admin:admin_id (id, name, email, phone)
        `);
      
      // Add pagination
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }
      
      // Add ordering
      query = query.order('name', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error('Failed to fetch schools');
      throw error;
    }
  }
};

export default governmentService;