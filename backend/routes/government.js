const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const governmentController = require('../controllers/governmentController');

// Apply auth middleware to all routes
router.use(auth);
// Ensure user has government role
router.use(roleCheck(['government', 'admin']));

// Dashboard
router.get('/dashboard/stats', governmentController.getDashboardStats);

// Compliance monitoring
router.get('/compliance/vehicles', governmentController.getVehicleCompliance);
router.get('/compliance/drivers', governmentController.getDriverCompliance);

// Schools
router.get('/schools', governmentController.getSchoolsList);

// Incidents
router.get('/incidents', governmentController.getIncidentReports);
router.put('/incidents/:incidentId', governmentController.updateIncidentResolution);

// Analytics
router.get('/analytics', governmentController.getAnalytics);

// Driver management
router.put('/drivers/:driverId/verification', governmentController.updateDriverVerification);

module.exports = router;