const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const schoolController = require('../controllers/schoolController');

// Apply auth middleware to all routes
router.use(auth);
// Ensure user has school role
router.use(roleCheck('school'));

// Students
router.get('/students', schoolController.getAllStudents);

// Routes
router.get('/routes', schoolController.getAllRoutes);
router.post('/routes', schoolController.createRoute);

// Trips
router.get('/trips', schoolController.getAllTrips);
router.post('/trips', schoolController.createTrip);

module.exports = router;