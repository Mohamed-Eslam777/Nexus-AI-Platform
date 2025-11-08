const QualificationTest = require('../models/QualificationTest.model.js');
const QualificationSubmission = require('../models/QualificationSubmission.model.js');

/**
 * @desc    Get tests the user has NOT yet submitted
 * @route   GET /api/qualification/available
 * @access  Private
 */
exports.getAvailableTests = async (req, res) => {
  try {
    // 1. Find all tests the user has already submitted
    const submittedTests = await QualificationSubmission.find({ user: req.user.id }).select('test');
    const submittedTestIds = submittedTests.map(s => s.test);

    // 2. Find all 'Active' tests that are NOT in the user's submitted list
    const availableTests = await QualificationTest.find({
      status: 'Active',
      _id: { $nin: submittedTestIds } // $nin = "not in"
    }).select('title projectDomain description'); // Only send necessary info

    res.json(availableTests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available tests', error: error.message });
  }
};

/**
 * @desc    Get a single test's details to take it
 * @route   GET /api/qualification/:id
 * @access  Private
 */
exports.getSingleTest = async (req, res) => {
  try {
    const test = await QualificationTest.findById(req.params.id);
    if (!test || test.status !== 'Active') {
      return res.status(404).json({ message: 'Test not found or not active' });
    }
    res.json(test); // Send full test details including tasks
  } catch (error) {
    res.status(500).json({ message: 'Error fetching test', error: error.message });
  }
};

/**
 * @desc    Submit answers for a test
 * @route   POST /api/qualification/submit
 * @access  Private
 */
exports.submitTest = async (req, res) => {
  try {
    const { testId, submissionContent } = req.body;

    // Validate input
    if (!testId || !submissionContent) {
      return res.status(400).json({ message: 'testId and submissionContent are required' });
    }

    // Check if the test exists and is active
    const test = await QualificationTest.findById(testId);
    if (!test || test.status !== 'Active') {
      return res.status(404).json({ message: 'Test not found or not active' });
    }

    // Check if user already submitted this test (using the unique index)
    const existingSubmission = await QualificationSubmission.findOne({ test: testId, user: req.user.id });
    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this test.' });
    }

    const submission = new QualificationSubmission({
      test: testId,
      user: req.user.id,
      submissionContent: submissionContent
      // status defaults to 'Pending'
    });

    await submission.save();
    res.status(201).json({ message: 'Test submitted successfully. Awaiting review.' });
  } catch (error) {
    // Handle unique index violation (just in case)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already submitted this test.' });
    }
    res.status(500).json({ message: 'Error submitting test', error: error.message });
  }
};

