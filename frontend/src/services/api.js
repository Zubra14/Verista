// /frontend/src/services/api.js
import supabase from '../lib/supabase';
import { toast } from 'react-toastify';

// Custom API wrapper with error handling
const api = {
  // Authentication
  auth: {
    signUp: async (email, password, userData) => {
      try {
        // Register with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: userData.name,
              phone: userData.phone,
              role: userData.role || 'parent'
            }
          }
        });
        
        if (error) throw error;
        
        // Create profile entry
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            name: userData.name,
            phone: userData.phone,
            role: userData.role || 'parent'
          });
        
        if (profileError) throw profileError;
        
        return data;
      } catch (error) {
        console.error('Sign up error:', error);
        toast.error(error.message || 'Failed to sign up');
        throw error;
      }
    },
    
    signIn: async (email, password) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('Sign in error:', error);
        toast.error(error.message || 'Failed to sign in');
        throw error;
      }
    },
    
    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        toast.success('Logged out successfully');
        return true;
      } catch (error) {
        console.error('Sign out error:', error);
        toast.error(error.message || 'Failed to sign out');
        throw error;
      }
    },
    
    getUser: async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        return data.user;
      } catch (error) {
        console.error('Get user error:', error);
        return null;
      }
    },
    
    getProfile: async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) return null;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.user.id)
          .single();
        
        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('Get profile error:', error);
        return null;
      }
    },
    
    getSession: async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
      } catch (error) {
        console.error('Get session error:', error);
        return null;
      }
    },
    
    resetPassword: async (email) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        
        toast.success('Password reset email sent');
        return true;
      } catch (error) {
        console.error('Reset password error:', error);
        toast.error(error.message || 'Failed to send reset email');
        throw error;
      }
    },
    
    updatePassword: async (newPassword) => {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (error) throw error;
        
        toast.success('Password updated successfully');
        return true;
      } catch (error) {
        console.error('Update password error:', error);
        toast.error(error.message || 'Failed to update password');
        throw error;
      }
    },
    
    updateProfile: async (profileData) => {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) throw new Error('Not authenticated');
        
        // Update auth metadata
        const { error: userError } = await supabase.auth.updateUser({
          data: {
            name: profileData.name,
            phone: profileData.phone
          }
        });
        
        if (userError) throw userError;
        
        // Update profile table
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: profileData.name,
            phone: profileData.phone,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.user.id);
        
        if (profileError) throw profileError;
        
        toast.success('Profile updated successfully');
        return true;
      } catch (error) {
        console.error('Update profile error:', error);
        toast.error(error.message || 'Failed to update profile');
        throw error;
      }
    }
  },
  
  // Parent services
  parent: {
    getChildren: async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) throw new Error('Not authenticated');
        
        const { data, error } = await supabase
          .from('students')
          .select(`
            *,
            school:school_id (
              id,
              name,
              address,
              phone
            )
          `)
          .eq('parent_id', user.user.id);
        
        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('Get children error:', error);
        toast.error(error.message || 'Failed to fetch children');
        throw error;
      }
    },
    
    getChildTrips: async (childId) => {
      try {
        const { data, error } = await supabase
          .from('trips')
          .select(`
            *,
            vehicle:vehicle_id (*),
            driver:driver_id (id, name, phone),
            route:route_id (*),
            trip_students!inner (*)
          `)
          .eq('trip_students.student_id', childId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('Get child trips error:', error);
        toast.error(error.message || 'Failed to fetch trips');
        throw error;
      }
    },
    
    getCurrentTrip: async (childId) => {
      try {
        const { data, error } = await supabase
          .from('trips')
          .select(`
            *,
            vehicle:vehicle_id (*),
            driver:driver_id (id, name, phone),
            route:route_id (*),
            trip_students!inner (*)
          `)
          .eq('trip_students.student_id', childId)
          .eq('status', 'in_progress')
          .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows returned"
        
        return data || null;
      } catch (error) {
        console.error('Get current trip error:', error);
        toast.error(error.message || 'Failed to fetch current trip');
        throw error;
      }
    },
    
    getNotifications: async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) throw new Error('Not authenticated');
        
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('Get notifications error:', error);
        toast.error(error.message || 'Failed to fetch notifications');
        throw error;
      }
    },
    
    markNotificationAsRead: async (notificationId) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId);
        
        if (error) throw error;
        
        return true;
      } catch (error) {
        console.error('Mark notification error:', error);
        toast.error(error.message || 'Failed to update notification');
        throw error;
      }
    },
    
    addChild: async (childData) => {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) throw new Error('Not authenticated');
        
        const { data, error } = await supabase
          .from('students')
          .insert({
            ...childData,
            parent_id: user.user.id
          })
          .select();
        
        if (error) throw error;
        
        toast.success('Child added successfully');
        return data[0];
      } catch (error) {
        console.error('Add child error:', error);
        toast.error(error.message || 'Failed to add child');
        throw error;
      }
    }
  },
  
  // Driver services
  driver: {
    getCurrentRoute: async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) throw new Error('Not authenticated');
        
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
        
        return data || null;
      } catch (error) {
        console.error('Get current route error:', error);
        toast.error(error.message || 'Failed to fetch current route');
        throw error;
      }
    },
    
    updateLocation: async (locationData) => {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) throw new Error('Not authenticated');
        
        // Update vehicle location
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update({
            current_location: `POINT(${locationData.longitude} ${locationData.latitude})`,
            location_updated_at: new Date().toISOString(),
            speed: locationData.speed || 0
          })
          .eq('driver_id', user.user.id);
        
        if (vehicleError) throw vehicleError;
        
        // Update trip tracking data if tripId is provided
        if (locationData.tripId) {
          // Get current tracking data
          const { data: tripData, error: tripError } = await supabase
            .from('trips')
            .select('tracking_data')
            .eq('id', locationData.tripId)
            .single();
          
          if (tripError) throw tripError;
          
          // Add new location to path
          const trackingData = tripData.tracking_data || { path: [], last_location: null };
          if (!trackingData.path) trackingData.path = [];
          
          trackingData.path.push({
            coordinates: [locationData.longitude, locationData.latitude],
            timestamp: new Date().toISOString(),
            speed: locationData.speed || 0
          });
          
          // Update last location
          trackingData.last_location = {
            coordinates: [locationData.longitude, locationData.latitude],
            timestamp: new Date().toISOString()
          };
          
          // Update trip tracking data
          const { error: updateError } = await supabase
            .from('trips')
            .update({
              tracking_data: trackingData
            })
            .eq('id', locationData.tripId);
          
          if (updateError) throw updateError;
        }
        
        return true;
      } catch (error) {
        console.error('Update location error:', error);
        toast.error(error.message || 'Failed to update location');
        throw error;
      }
    },
    
    startTrip: async (tripData) => {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) throw new Error('Not authenticated');
        
        // Create new trip
        const { data, error } = await supabase
          .from('trips')
          .insert({
            driver_id: user.user.id,
            vehicle_id: tripData.vehicle_id,
            route_id: tripData.route_id,
            school_id: tripData.school_id,
            status: 'in_progress',
            start_time: new Date().toISOString(),
            estimated_arrival: tripData.estimated_arrival,
            tracking_data: {
              path: [],
              last_location: null
            }
          })
          .select();
        
        if (error) throw error;
        
        // Associate students with the trip
        if (tripData.students && tripData.students.length > 0) {
          const tripStudents = tripData.students.map(studentId => ({
            trip_id: data[0].id,
            student_id: studentId,
            status: 'pending'
          }));
          
          const { error: studentError } = await supabase
            .from('trip_students')
            .insert(tripStudents);
          
          if (studentError) throw studentError;
        }
        
        toast.success('Trip started successfully');
        return data[0];
      } catch (error) {
        console.error('Start trip error:', error);
        toast.error(error.message || 'Failed to start trip');
        throw error;
      }
    },
    
    completeTrip: async (tripId) => {
      try {
        const { error } = await supabase
          .from('trips')
          .update({
            status: 'completed',
            end_time: new Date().toISOString()
          })
          .eq('id', tripId);
        
        if (error) throw error;
        
        toast.success('Trip completed successfully');
        return true;
      } catch (error) {
        console.error('Complete trip error:', error);
        toast.error(error.message || 'Failed to complete trip');
        throw error;
      }
    },
    
    updateStudentStatus: async (tripId, studentId, status) => {
      try {
        const { error } = await supabase
          .from('trip_students')
          .update({ status })
          .eq('trip_id', tripId)
          .eq('student_id', studentId);
        
        if (error) throw error;
        
        return true;
      } catch (error) {
        console.error('Update student status error:', error);
        toast.error(error.message || 'Failed to update student status');
        throw error;
      }
    },
    
    getRoutes: async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) throw new Error('Not authenticated');
        
        const { data, error } = await supabase
          .from('routes')
          .select(`
            *,
            school:school_id (id, name, address, phone)
          `)
          .eq('driver_id', user.user.id);
        
        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('Get routes error:', error);
        toast.error(error.message || 'Failed to fetch routes');
        throw error;
      }
    },
    
    getVehicle: async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) throw new Error('Not authenticated');
        
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('driver_id', user.user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        return data || null;
      } catch (error) {
        console.error('Get vehicle error:', error);
        toast.error(error.message || 'Failed to fetch vehicle information');
        throw error;
      }
    }
  },
  
  // School services
  school: {
    getStudents: async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) throw new Error('Not authenticated');
        
        const { data: schoolData, error: schoolError } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.user.id)
          .single();
        
        if (schoolError) throw schoolError;
        
        const { data, error } = await supabase
          .from('students')
          .select(`
            *,
            parent:parent_id (id, name, phone, email)
          `)
          .eq('school_id', schoolData.school_id);
        
        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('Get school students error:', error);
        toast.error(error.message || 'Failed to fetch students');
        throw error;
      }
    },
    
    getRoutes: async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) throw new Error('Not authenticated');
        
        const { data: schoolData, error: schoolError } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.user.id)
          .single();
        
        if (schoolError) throw schoolError;
        
        const { data, error } = await supabase
          .from('routes')
          .select(`
            *,
            driver:driver_id (id, name, phone, email),
            vehicle:vehicle_id (*)
          `)
          .eq('school_id', schoolData.school_id);
        
        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('Get school routes error:', error);
        toast.error(error.message || 'Failed to fetch routes');
        throw error;
      }
    },
    
    getActiveTrips: async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) throw new Error('Not authenticated');
        
        const { data: schoolData, error: schoolError } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.user.id)
          .single();
        
        if (schoolError) throw schoolError;
        
        const { data, error } = await supabase
          .from('trips')
          .select(`
            *,
            driver:driver_id (id, name, phone),
            vehicle:vehicle_id (*),
            route:route_id (*),
            trip_students (
              student:student_id (*)
            )
          `)
          .eq('school_id', schoolData.school_id)
          .eq('status', 'in_progress');
        
        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('Get active trips error:', error);
        toast.error(error.message || 'Failed to fetch active trips');
        throw error;
      }
    }
  },
  
  // Government services
  government: {
    getComplianceData: async () => {
      try {
        const { data, error } = await supabase
          .from('compliance_data')
          .select(`
            *,
            school:school_id (id, name, address, phone),
            vehicle:vehicle_id (*),
            driver:driver_id (id, name, license_number, license_expiry)
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('Get compliance data error:', error);
        toast.error(error.message || 'Failed to fetch compliance data');
        throw error;
      }
    },
    
    getIncidents: async () => {
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select(`
            *,
            school:school_id (id, name, address, phone),
            vehicle:vehicle_id (*),
            driver:driver_id (id, name, phone, email),
            trip:trip_id (*)
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('Get incidents error:', error);
        toast.error(error.message || 'Failed to fetch incidents');
        throw error;
      }
    },
    
    getAnalytics: async () => {
      try {
        const { data, error } = await supabase
          .from('analytics')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        return data || {
          total_schools: 0,
          total_drivers: 0,
          total_vehicles: 0,
          total_students: 0,
          total_trips: 0,
          compliance_rate: 0,
          regional_data: []
        };
      } catch (error) {
        console.error('Get analytics error:', error);
        toast.error(error.message || 'Failed to fetch analytics');
        throw error;
      }
    }
  }
};

export default api;