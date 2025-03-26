const supabase = require('../utils/supabase');

exports.getCurrentRoute = async (req, res) => {
  try {
    // Get current active trip for driver
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
      .eq('driver_id', req.user.id)
      .eq('status', 'in_progress')
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    // If no in_progress trip, check for scheduled trips
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
        .eq('driver_id', req.user.id)
        .eq('status', 'scheduled')
        .order('start_time', { ascending: true })
        .limit(1)
        .single();
      
      if (scheduledError && scheduledError.code !== 'PGRST116') {
        throw scheduledError;
      }
      
      return res.status(200).json({
        success: true,
        data: scheduledTrip || null
      });
    }
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching current route:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving current route',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.startTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Verify trip belongs to driver and is in 'scheduled' status
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select('id, status')
      .eq('id', tripId)
      .eq('driver_id', req.user.id)
      .eq('status', 'scheduled')
      .single();
    
    if (tripError || !tripData) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found, not assigned to you, or already in progress'
      });
    }
    
    // Update trip status to in_progress
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('trips')
      .update({
        status: 'in_progress',
        start_time: now
      })
      .eq('id', tripId)
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error starting trip:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while starting trip',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.endTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Verify trip belongs to driver and is in 'in_progress' status
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select('id, status')
      .eq('id', tripId)
      .eq('driver_id', req.user.id)
      .eq('status', 'in_progress')
      .single();
    
    if (tripError || !tripData) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found, not assigned to you, or not in progress'
      });
    }
    
    // Update trip status to completed
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('trips')
      .update({
        status: 'completed',
        end_time: now,
        actual_arrival: now
      })
      .eq('id', tripId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Clear current_trip_id from students who were on this trip
    const { error: studentError } = await supabase
      .from('students')
      .update({ current_trip_id: null })
      .eq('current_trip_id', tripId);
    
    if (studentError) throw studentError;
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error ending trip:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while ending trip',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateStudentStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status, tripId } = req.body;
    
    if (!['waiting', 'picked_up', 'dropped_off', 'absent'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be waiting, picked_up, dropped_off, or absent'
      });
    }
    
    // Verify student is on active trip for this driver
    const { data: tripStudentData, error: tripStudentError } = await supabase
      .from('trip_students')
      .select(`
        id,
        trip:trip_id (
          driver_id,
          status
        )
      `)
      .eq('student_id', studentId)
      .eq('trip_id', tripId)
      .single();
    
    if (tripStudentError || !tripStudentData) {
      return res.status(404).json({
        success: false,
        message: 'Student not found on this trip'
      });
    }
    
    if (tripStudentData.trip.driver_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'This trip is not assigned to you'
      });
    }
    
    if (tripStudentData.trip.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update student status on a trip that is not in progress'
      });
    }
    
    // Update trip_students status
    const now = new Date().toISOString();
    const { data: updatedTripStudent, error: updateError } = await supabase
      .from('trip_students')
      .update({
        status,
        timestamp: now
      })
      .eq('student_id', studentId)
      .eq('trip_id', tripId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Update student current_status
    const { error: studentError } = await supabase
      .from('students')
      .update({
        current_status: status,
        // Update current_trip_id only if picked up
        ...(status === 'picked_up' ? { current_trip_id: tripId } : {})
      })
      .eq('id', studentId);
    
    if (studentError) throw studentError;
    
    return res.status(200).json({
      success: true,
      data: updatedTripStudent
    });
  } catch (error) {
    console.error('Error updating student status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating student status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.reportIssue = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { type, description, latitude, longitude } = req.body;
    
    if (!['delay', 'breakdown', 'accident', 'other'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue type. Must be delay, breakdown, accident, or other'
      });
    }
    
    // Verify trip belongs to driver
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select('id')
      .eq('id', tripId)
      .eq('driver_id', req.user.id)
      .single();
    
    if (tripError || !tripData) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found or not assigned to you'
      });
    }
    
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
    
    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error reporting issue:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while reporting issue',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getAssignedStudents = async (req, res) => {
  try {
    const { tripId } = req.query;
    
    // If tripId is provided, get students for that specific trip
    if (tripId) {
      // Verify trip belongs to driver
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('id')
        .eq('id', tripId)
        .eq('driver_id', req.user.id)
        .single();
      
      if (tripError || !tripData) {
        return res.status(404).json({
          success: false,
          message: 'Trip not found or not assigned to you'
        });
      }
      
      // Get students for this trip
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
      const students = data.map(item => ({
        ...item.student,
        trip_status: item.status,
        timestamp: item.timestamp
      }));
      
      return res.status(200).json({
        success: true,
        data: students
      });
    } else {
      // Get current active trip for driver
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('id')
        .eq('driver_id', req.user.id)
        .eq('status', 'in_progress')
        .single();
      
      if (tripError && tripError.code !== 'PGRST116') {
        throw tripError;
      }
      
      // If no active trip, return empty array
      if (!tripData) {
        return res.status(200).json({
          success: true,
          data: []
        });
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
      const students = data.map(item => ({
        ...item.student,
        trip_status: item.status,
        timestamp: item.timestamp
      }));
      
      return res.status(200).json({
        success: true,
        data: students
      });
    }
  } catch (error) {
    console.error('Error fetching assigned students:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving assigned students',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};