const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const driverController = require('../controllers/driverController');

// Apply auth middleware to all routes
router.use(auth);
// Ensure user has driver role
router.use(roleCheck('driver'));

// Route management
router.get('/routes/current', driverController.getCurrentRoute);
router.post('/routes/:tripId/start', driverController.startTrip);
router.post('/routes/:tripId/end', driverController.endTrip);
router.post('/routes/:tripId/issues', driverController.reportIssue);

// Student management
router.get('/students', driverController.getAssignedStudents);
router.put('/students/:studentId/status', driverController.updateStudentStatus);

// Location updates
router.post('/location', (req, res) => {
  // This would be handled by the Supabase realtime API on the frontend
  res.status(200).json({ success: true });
});

module.exports = router;