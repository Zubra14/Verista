// /backend/routes/parent.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const parentController = require('../controllers/parentController');

// Apply auth middleware to all routes
router.use(auth);
// Ensure user has parent role
router.use(roleCheck('parent'));

// Child management routes
router.get('/children', parentController.getChildren);
router.get('/children/:childId', parentController.getChildById);
router.put('/children/:childId', parentController.updateChild);
router.post('/children', parentController.addChild);

// Trip tracking routes
router.get('/children/:childId/trips', parentController.getChildTrips);
router.get('/children/:childId/trips/current', parentController.getCurrentTrip);
router.get('/children/:childId/trips/history', parentController.getTripHistory);

// Notification routes
router.get('/notifications', parentController.getNotifications);
router.put('/notifications/:notificationId/read', parentController.markNotificationAsRead);
router.put('/notification-preferences', parentController.updateNotificationPreferences);

// Driver information routes
router.get('/drivers', parentController.getAssignedDrivers);
router.get('/drivers/:driverId', parentController.getDriverDetails);

// Feedback routes
router.post('/trips/:tripId/feedback', parentController.submitTripFeedback);

module.exports = router;