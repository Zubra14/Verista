const supabase = require('../utils/supabase');

exports.getAllStudents = async (req, res) => {
  try {
    // Get school ID for the logged-in school admin
    const { data: profileData, error: profileError } = await supabase
      .from('schools')
      .select('id')
      .eq('admin_id', req.user.id)
      .single();
    
    if (profileError) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found for this admin'
      });
    }
    
    const schoolId = profileData.id;
    
    // Get all students for this school
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        parent:parent_id (id, name, email, phone)
      `)
      .eq('school_id', schoolId);
    
    if (error) throw error;
    
    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving students',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getAllRoutes = async (req, res) => {
  try {
    // Get school ID for the logged-in school admin
    const { data: profileData, error: profileError } = await supabase
      .from('schools')
      .select('id')
      .eq('admin_id', req.user.id)
      .single();
    
    if (profileError) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found for this admin'
      });
    }
    
    const schoolId = profileData.id;
    
    // Get all routes for this school
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('school_id', schoolId);
    
    if (error) throw error;
    
    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving routes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getAllTrips = async (req, res) => {
  try {
    // Get school ID for the logged-in school admin
    const { data: profileData, error: profileError } = await supabase
      .from('schools')
      .select('id')
      .eq('admin_id', req.user.id)
      .single();
    
    if (profileError) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found for this admin'
      });
    }
    
    const schoolId = profileData.id;
    
    // Query parameters
    const { status, date, limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('trips')
      .select(`
        *,
        route:route_id (*),
        vehicle:vehicle_id (*),
        driver:driver_id (id, name, phone),
        _count: count()
      `, { count: 'exact' })
      .eq('school_id', schoolId);
    
    // Add filters if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query = query.gte('start_time', startDate.toISOString())
                  .lte('start_time', endDate.toISOString());
    }
    
    // Add pagination
    query = query.range(offset, offset + limit - 1)
                .order('start_time', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving trips',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.createRoute = async (req, res) => {
  try {
    // Get school ID for the logged-in school admin
    const { data: profileData, error: profileError } = await supabase
      .from('schools')
      .select('id')
      .eq('admin_id', req.user.id)
      .single();
    
    if (profileError) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found for this admin'
      });
    }
    
    const schoolId = profileData.id;
    
    const { 
      name, description, start_latitude, start_longitude,
      end_latitude, end_longitude, waypoints, estimated_duration 
    } = req.body;
    
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
        school_id: schoolId,
        start_point: startPoint,
        end_point: endPoint,
        waypoints: waypoints || [],
        estimated_duration
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error creating route:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating route',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.createTrip = async (req, res) => {
  try {
    // Get school ID for the logged-in school admin
    const { data: profileData, error: profileError } = await supabase
      .from('schools')
      .select('id')
      .eq('admin_id', req.user.id)
      .single();
    
    if (profileError) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found for this admin'
      });
    }
    
    const schoolId = profileData.id;
    
    const { 
      route_id, vehicle_id, driver_id, type, 
      scheduled_start_time, estimated_arrival, student_ids 
    } = req.body;
    
    // Verify route belongs to school
    const { data: routeData, error: routeError } = await supabase
      .from('routes')
      .select('id')
      .eq('id', route_id)
      .eq('school_id', schoolId)
      .single();
    
    if (routeError) {
      return res.status(404).json({
        success: false,
        message: 'Route not found or not associated with this school'
      });
    }
    
    // Insert new trip
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .insert({
        route_id,
        vehicle_id,
        driver_id,
        school_id: schoolId,
        type,
        status: 'scheduled',
        start_time: scheduled_start_time,
        estimated_arrival
      })
      .select()
      .single();
    
    if (tripError) throw tripError;
    
    // Add students to trip
    if (student_ids && student_ids.length > 0) {
      const tripStudents = student_ids.map(student_id => ({
        trip_id: tripData.id,
        student_id,
        status: 'waiting'
      }));
      
      const { error: studentError } = await supabase
        .from('trip_students')
        .insert(tripStudents);
      
      if (studentError) throw studentError;
    }
    
    return res.status(201).json({
      success: true,
      data: tripData
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating trip',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};