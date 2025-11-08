const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth.middleware');
const { 
  generateProjectInstructions,
  generateProjectInstructionsAI, 
  getProjectPerformanceAnalytics, 
  getFreelancerPerformanceAnalytics, 
  getDashboardStats,
  createQualificationTest,
  getAllQualificationTests,
  updateQualificationTest,
  deleteQualificationTest,
  getPendingQualificationSubmissions,
  reviewQualificationSubmission
} = require('../controllers/admin.controller');

// @route   POST /api/admin/generate-instructions
// @desc    Generate detailed project instructions from a brief title (Admin only)
// @access  Admin
router.post('/generate-instructions', protect, admin, generateProjectInstructions);

// @route   POST /api/admin/ai/generate-instructions
// @desc    Generate project description and instructions using AI
// @access  Admin
router.post('/ai/generate-instructions', protect, admin, generateProjectInstructionsAI);

// @route   GET /api/admin/analytics/project-performance
// @desc    Get project performance analytics using aggregation pipeline (Admin only)
// @access  Admin
router.get('/analytics/project-performance', protect, admin, getProjectPerformanceAnalytics);

// @route   GET /api/admin/analytics/freelancer-performance
// @desc    Get top 10 freelancer performance analytics using aggregation pipeline (Admin only)
// @access  Admin
router.get('/analytics/freelancer-performance', protect, admin, getFreelancerPerformanceAnalytics);

// @route   GET /api/admin/analytics/dashboard-stats
// @desc    Get dashboard KPI stats (total projects, pending submissions, applicants, payouts) (Admin only)
// @access  Admin
router.get('/analytics/dashboard-stats', protect, admin, getDashboardStats);

// @route   POST /api/admin/qualification-tests
// @desc    Create a new qualification test (Admin only)
// @access  Admin
// @route   GET /api/admin/qualification-tests
// @desc    Get all qualification tests (Admin only)
// @access  Admin
router.route('/qualification-tests')
  .post(protect, admin, createQualificationTest) // Create new test
  .get(protect, admin, getAllQualificationTests); // Get all tests

// @route   PUT /api/admin/qualification-tests/:id
// @desc    Update a qualification test (Admin only)
// @access  Admin
// @route   DELETE /api/admin/qualification-tests/:id
// @desc    Delete a qualification test (Admin only)
// @access  Admin
router.route('/qualification-tests/:id')
  .put(protect, admin, updateQualificationTest) // Update a test
  .delete(protect, admin, deleteQualificationTest); // Delete a test

// @route   GET /api/admin/qualification-submissions/pending
// @desc    Get all pending qualification submissions (Admin only)
// @access  Admin
router.get('/qualification-submissions/pending', protect, admin, getPendingQualificationSubmissions);

// @route   PUT /api/admin/qualification-submissions/review/:submissionId
// @desc    Review (Approve/Reject) a qualification submission (Admin only)
// @access  Admin
router.put('/qualification-submissions/review/:submissionId', protect, admin, reviewQualificationSubmission);

module.exports = router;

