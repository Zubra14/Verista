const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const parentRoutes = require('./parent');
const driverRoutes = require('./driver');
const schoolRoutes = require('./school');
const governmentRoutes = require('./government');

// Mount routes
router.use('/auth', authRoutes);
router.use('/parent', parentRoutes);
router.use('/driver', driverRoutes);
router.use('/school', schoolRoutes);
router.use('/government', governmentRoutes);

module.exports = router;