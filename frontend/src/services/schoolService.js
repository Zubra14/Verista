import supabase from '../lib/supabase';
import { toast } from 'react-toastify';

const schoolService = {
  getStudents: async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // Get school ID
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('admin_id', user.user.id)
        .single();
      
      if (schoolError) throw schoolError;
      
      // Get all students for this school
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          parent:parent_id (id, name, phone)
        `)
        .eq('school_id', schoolData.id);
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
      throw error;
    }
  },
  
  getRoutes: async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // Get school ID
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('admin_id', user.user.id)
        .single();
      
      if (schoolError) throw schoolError;
      
      // Get all routes for this school
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('school_id', schoolData.id);
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to fetch routes');
      throw error;
    }
  },
  
  getTrips: async (filters = {}) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // Get school ID
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('admin_id', user.user.id)
        .single();
      
      if (schoolError) throw schoolError;
      
      // Build query
      let query = supabase
        .from('trips')
        .select(`
          *,
          route:route_id (*),
          vehicle:vehicle_id (*),
          driver:driver_id (id, name, phone)
        `)
        .eq('school_id', schoolData.id);
      
      // Add filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.date) {
        const startDate = new Date(filters.date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(filters.date);
        endDate.setHours(23, 59, 59, 999);
        
        query = query.gte('start_time', startDate.toISOString())
                    .lte('start_time', endDate.toISOString());
      }
      
      // Add pagination
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }
      
      // Add ordering
      query = query.order('start_time', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Failed to fetch trips');
      throw error;
    }
  },
  
  createRoute: async (routeData) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // Get school ID
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('admin_id', user.user.id)
        .single();
      
      if (schoolError) throw schoolError;
      
      const { 
        name, description, start_latitude, start_longitude,
        end_latitude, end_longitude, waypoints, estimated_duration 
      } = routeData;
      
      // Create start and end points
      let startPoint = null;
      let endPoint = null;
      
      if (start_latitude && start_longitude) {
        startPoint = `POINT(${start_longitude} ${start_latitude})`;
      }
      
      if (end_latitude && end_longitude) {
        endPoint = `POINT(${end_longitude} ${end_latitude})`;
      }
      
      // Insert new route
      const { data, error } = await supabase
        .from('routes')
        .insert({
          name,
          description,
          school_id: schoolData.id,
          start_point: startPoint,
          end_point: endPoint,
          waypoints: waypoints || [],
          estimated_duration
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Route created successfully');
      return data;
    } catch (error) {
      console.error('Error creating route:', error);
      toast.error('Failed to create route');
      throw error;
    }
  },
  
  createTrip: async (tripData) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) throw new Error('Not authenticated');
      
      // Get school ID
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('admin_id', user.user.id)
        .single();
      
      if (schoolError) throw schoolError;
      
      const { 
        route_id, vehicle_id, driver_id, type, 
        scheduled_start_time, estimated_arrival, student_ids 
      } = tripData;
      
      // Insert new trip
      const { data, error } = await supabase
        .from('trips')
        .insert({
          route_id,
          vehicle_id,
          driver_id,
          school_id: schoolData.id,
          type,
          status: 'scheduled',
          start_time: scheduled_start_time,
          estimated_arrival
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add students to trip
      if (student_ids && student_ids.length > 0) {
        const tripStudents = student_ids.map(student_id => ({
          trip_id: data.id,
          student_id,
          status: 'waiting'
        }));
        
        const { error: studentError } = await supabase
          .from('trip_students')
          .insert(tripStudents);
        
        if (studentError) throw studentError;
      }
      
      toast.success('Trip created successfully');
      return data;
    } catch (error) {
      console.error('Error creating trip:', error);
      toast.error('Failed to create trip');
      throw error;
    }
  }
};

export default schoolService;