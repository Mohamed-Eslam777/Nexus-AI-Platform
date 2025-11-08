const express = require('express');
const router = express.Router();
const { getAvailableTests, getSingleTest, submitTest } = require('../controllers/qualification.controller.js');
const { protect } = require('../middleware/auth.middleware.js');

// @route   POST /api/qualification/submit
// @desc    Submit answers for a test
// @access  Private
// Note: Must be before /:id route to avoid route conflicts
router.post('/submit', protect, submitTest);

// @route   GET /api/qualification/available
// @desc    Get all active tests the user hasn't submitted yet
// @access  Private
// Note: Must be before /:id route to avoid route conflicts
router.get('/available', protect, getAvailableTests);

// @route   GET /api/qualification/:id
// @desc    Get a single test's details to take it
// @access  Private
router.get('/:id', protect, getSingleTest);

module.exports = router;

