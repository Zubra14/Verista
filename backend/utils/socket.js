// /backend/utils/socket.js
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const { verifyToken } = require('./tokenHelpers');

module.exports = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}, role: ${socket.user.role}`);
    
    // Parents subscribe to their children's trips
    socket.on('subscribe-to-child-trips', async (childId) => {
      try {
        // Verify parent has access to this child
        if (socket.user.role === 'parent') {
          const student = await Student.findOne({ 
            _id: childId,
            parent: socket.user.userId
          });
          
          if (student) {
            socket.join(`child-${childId}`);
            console.log(`Parent subscribed to child: ${childId}`);
          }
        }
      } catch (error) {
        console.error('Error subscribing to child trips:', error);
      }
    });
    
    // Drivers update their location
    socket.on('location-update', async (data) => {
      try {
        if (socket.user.role !== 'driver') {
          return;
        }
        
        const { latitude, longitude, routeId, tripId, speed } = data;
        
        // Update vehicle location in database
        await Vehicle.findOneAndUpdate(
          { driver: socket.user.userId },
          { 
            currentLocation: {
              coordinates: [longitude, latitude],
              speed: speed,
              lastUpdated: new Date()
            }
          }
        );
        
        // Update trip status
        if (tripId) {
          await Trip.findByIdAndUpdate(tripId, {
            'tracking.lastLocation': {
              coordinates: [longitude, latitude],
              timestamp: new Date()
            }
          });
          
          // Get all students on this trip
          const trip = await Trip.findById(tripId).populate('students');
          
          // Emit to all parents of children on this trip
          if (trip && trip.students) {
            trip.students.forEach(student => {
              io.to(`child-${student._id}`).emit('location-updated', {
                tripId,
                latitude,
                longitude,
                speed,
                timestamp: new Date()
              });
            });
          }
          
          // Also emit to school administrators
          io.to(`school-${trip.school}`).emit('vehicle-location-updated', {
            tripId,
            vehicleId: trip.vehicle,
            latitude,
            longitude,
            speed,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Error updating location:', error);
      }
    });
    
    // Additional event handlers
    socket.on('trip-started', handleTripStarted);
    socket.on('student-picked-up', handleStudentPickedUp);
    socket.on('student-dropped-off', handleStudentDroppedOff);
    socket.on('trip-completed', handleTripCompleted);
    socket.on('emergency-alert', handleEmergencyAlert);
    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
  
  // Define all the handler functions
  function handleTripStarted(data) {
    // Implementation
  }
  
  function handleStudentPickedUp(data) {
    // Implementation
  }
  
  function handleStudentDroppedOff(data) {
    // Implementation
  }
  
  function handleTripCompleted(data) {
    // Implementation
  }
  
  function handleEmergencyAlert(data) {
    // Implementation
  }
};