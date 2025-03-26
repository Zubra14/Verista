const supabase = require('../utils/supabase');

// Dashboard overview statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts for various entities
    const [
      { count: vehicleCount, error: vehicleError },
      { count: driverCount, error: driverError },
      { count: schoolCount, error: schoolError },
      { count: tripCount, error: tripError },
      { count: incidentCount, error: incidentError }
    ] = await Promise.all([
      supabase.from('vehicles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'driver'),
      supabase.from('schools').select('*', { count: 'exact', head: true }),
      supabase.from('trips').select('*', { count: 'exact', head: true }),
      supabase.from('trip_incidents').select('*', { count: 'exact', head: true })
    ]);
    
    if (vehicleError || driverError || schoolError || tripError || incidentError) {
      throw new Error('Error fetching statistics');
    }
    
    // Get compliance metrics
    const now = new Date().toISOString();
    const { count: expiredInspections, error: inspectionError } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .lt('next_inspection_due', now);
    
    if (inspectionError) throw inspectionError;
    
    // Calculate compliance rate
    const complianceRate = vehicleCount > 0 
      ? Math.round(((vehicleCount - expiredInspections) / vehicleCount) * 100) 
      : 100;
    
    return res.status(200).json({
      success: true,
      data: {
        vehicles: {
          total: vehicleCount,
          compliant: vehicleCount - expiredInspections,
          complianceRate: complianceRate
        },
        drivers: driverCount,
        schools: schoolCount,
        trips: tripCount,
        incidents: incidentCount
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Vehicle compliance monitoring
exports.getVehicleCompliance = async (req, res) => {
  try {
    // Query parameters
    const { status, limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('vehicles')
      .select(`
        *,
        driver:driver_id (id, name, phone),
        _count: count()
      `, { count: 'exact' });
    
    // Add filters if provided
    if (status === 'non-compliant') {
      const now = new Date().toISOString();
      query = query.lt('next_inspection_due', now);
    } else if (status === 'compliant') {
      const now = new Date().toISOString();
      query = query.gte('next_inspection_due', now);
    }
    
    // Add pagination
    query = query.range(offset, offset + limit - 1)
                .order('next_inspection_due', { ascending: true });
    
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
    console.error('Error fetching vehicle compliance:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving vehicle compliance data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Driver compliance monitoring
exports.getDriverCompliance = async (req, res) => {
  try {
    // Query parameters
    const { status, limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    // Build query for drivers
    let query = supabase
      .from('profiles')
      .select(`
        id, name, phone, email, is_verified,
        _count: count()
      `, { count: 'exact' })
      .eq('role', 'driver');
    
    // Add filters if provided
    if (status === 'verified') {
      query = query.eq('is_verified', true);
    } else if (status === 'unverified') {
      query = query.eq('is_verified', false);
    }
    
    // Add pagination
    query = query.range(offset, offset + limit - 1)
                .order('name', { ascending: true });
    
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
    console.error('Error fetching driver compliance:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving driver compliance data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// School monitoring
exports.getSchoolsList = async (req, res) => {
  try {
    // Query parameters
    const { limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('schools')
      .select(`
        *,
        admin:admin_id (id, name, email, phone),
        _count: count()
      `, { count: 'exact' });
    
    // Add pagination
    query = query.range(offset, offset + limit - 1)
                .order('name', { ascending: true });
    
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
    console.error('Error fetching schools list:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving schools data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Incident reports
exports.getIncidentReports = async (req, res) => {
  try {
    // Query parameters
    const { type, status, limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
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
        ),
        _count: count()
      `, { count: 'exact' });
    
    // Add filters if provided
    if (type) {
      query = query.eq('type', type);
    }
    
    if (status === 'resolved') {
      query = query.eq('resolved', true);
    } else if (status === 'unresolved') {
      query = query.eq('resolved', false);
    }
    
    // Add pagination
    query = query.range(offset, offset + limit - 1)
                .order('timestamp', { ascending: false });
    
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
    console.error('Error fetching incident reports:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving incident reports',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;
    
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
    const nowISO = now.toISOString();
    
    // Get trip counts by date
    // In a full implementation, you would calculate this directly in the database
    // This is a simplified approach
    const { data: trips, error: tripError } = await supabase
      .from('trips')
      .select('start_time, status')
      .gte('start_time', startDateISO)
      .lte('start_time', nowISO);
    
    if (tripError) throw tripError;
    
    // Get incident counts by type
    const { data: incidents, error: incidentError } = await supabase
      .from('trip_incidents')
      .select('type, timestamp')
      .gte('timestamp', startDateISO)
      .lte('timestamp', nowISO);
    
    if (incidentError) throw incidentError;
    
    // Process the data for the frontend
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
    
    return res.status(200).json({
      success: true,
      data: {
        trips: {
          byDate: tripsByDate,
          total: trips.length,
          completed: trips.filter(t => t.status === 'completed').length,
          cancelled: trips.filter(t => t.status === 'cancelled').length
        },
        incidents: {
          byType: incidentsByType,
          total: incidents.length
        },
        timeframe
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Approve or reject driver
exports.updateDriverVerification = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { isVerified } = req.body;
    
    if (isVerified === undefined) {
      return res.status(400).json({
        success: false,
        message: 'isVerified field is required'
      });
    }
    
    // Update driver verification status
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_verified: isVerified })
      .eq('id', driverId)
      .eq('role', 'driver')
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(200).json({
      success: true,
      data,
      message: isVerified 
        ? 'Driver has been approved and verified.' 
        : 'Driver verification has been revoked.'
    });
  } catch (error) {
    console.error('Error updating driver verification:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating driver verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update incident resolution
exports.updateIncidentResolution = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const { resolved, resolutionDetails } = req.body;
    
    if (resolved === undefined) {
      return res.status(400).json({
        success: false,
        message: 'resolved field is required'
      });
    }
    
    // Update incident resolution
    const { data, error } = await supabase
      .from('trip_incidents')
      .update({ 
        resolved,
        resolution_details: resolutionDetails || null
      })
      .eq('id', incidentId)
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(200).json({
      success: true,
      data,
      message: resolved 
        ? 'Incident has been marked as resolved.' 
        : 'Incident has been marked as unresolved.'
    });
  } catch (error) {
    console.error('Error updating incident resolution:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating incident resolution',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};