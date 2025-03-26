// Additional parent controller functions

exports.addChild = async (req, res) => {
  try {
    const { name, school_id, grade, pickup_address, dropoff_address, 
            pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude,
            special_needs, emergency_contacts } = req.body;
    
    // Create pickup and dropoff points
    const pickupPoint = `POINT(${pickup_longitude} ${pickup_latitude})`;
    const dropoffPoint = `POINT(${dropoff_longitude} ${dropoff_latitude})`;
    
    // Insert new student
    const { data, error } = await supabase
      .from('students')
      .insert({
        name,
        parent_id: req.user.id,
        school_id,
        grade,
        pickup_address,
        dropoff_address,
        pickup_location: pickupPoint,
        dropoff_location: dropoffPoint,
        special_needs: special_needs || '',
        emergency_contacts: emergency_contacts || []
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error adding child:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while adding child',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateChild = async (req, res) => {
  try {
    const childId = req.params.childId;
    const { 
      name, grade, pickup_address, dropoff_address, special_needs, 
      emergency_contacts, pickup_latitude, pickup_longitude, 
      dropoff_latitude, dropoff_longitude
    } = req.body;
    
    // Verify child belongs to parent
    const { data: childData, error: childError } = await supabase
      .from('students')
      .select('id')
      .eq('id', childId)
      .eq('parent_id', req.user.id)
      .single();
    
    if (childError) {
      return res.status(404).json({
        success: false,
        message: 'Child not found or not associated with this parent'
      });
    }
    
    // Create update object
    const updateData = {};
    if (name) updateData.name = name;
    if (grade) updateData.grade = grade;
    if (pickup_address) updateData.pickup_address = pickup_address;
    if (dropoff_address) updateData.dropoff_address = dropoff_address;
    if (special_needs !== undefined) updateData.special_needs = special_needs;
    if (emergency_contacts) updateData.emergency_contacts = emergency_contacts;
    
    // Update location if provided
    if (pickup_latitude && pickup_longitude) {
      updateData.pickup_location = `POINT(${pickup_longitude} ${pickup_latitude})`;
    }
    
    if (dropoff_latitude && dropoff_longitude) {
      updateData.dropoff_location = `POINT(${dropoff_longitude} ${dropoff_latitude})`;
    }
    
    // Update the student
    const { data, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', childId)
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error updating child:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating child',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.submitTripFeedback = async (req, res) => {
  try {
    const tripId = req.params.tripId;
    const { rating, comment } = req.body;
    
    // Verify rating is valid
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // Verify trip exists and involves this parent's child
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select(`
        id,
        trip_students!inner (
          student:student_id (
            parent_id
          )
        )
      `)
      .eq('id', tripId)
      .filter('trip_students.student.parent_id', 'eq', req.user.id)
      .single();
    
    if (tripError) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found or not associated with your children'
      });
    }
    
    // Insert feedback
    const { data, error } = await supabase
      .from('trip_feedback')
      .insert({
        trip_id: tripId,
        parent_id: req.user.id,
        rating,
        comment
      })
      .select()
      .single();
    
    if (error) {
      // Check for uniqueness violation
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted feedback for this trip'
        });
      }
      throw error;
    }
    
    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while submitting feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};