const Project = require('../models/Project.model');
const Submission = require('../models/Submission.model');
const User = require('../models/User.model');
const PayoutRequest = require('../models/PayoutRequest.model');
const QualificationTest = require('../models/QualificationTest.model.js');
const QualificationSubmission = require('../models/QualificationSubmission.model.js');
const sendEmail = require('../utils/emailService.js');
const { aiGenerateInstructions } = require('../services/aiService.js');

/**
 * @desc    Generate project description and instructions using AI (Gemini)
 * @route   POST /api/admin/ai/generate-instructions
 * @access  Admin
 */
const generateProjectInstructionsAI = async (req, res) => {
  const { title, taskType } = req.body;
  if (!title || !taskType) {
    return res.status(400).json({ message: 'Project title and task type are required.' });
  }
  try {
    const instructions = await aiGenerateInstructions(title, taskType);
    res.json(instructions);
  } catch (error) {
    res.status(500).json({ message: 'AI failed to generate instructions.', error: error.message });
  }
};

/**
 * @desc    Generate detailed project instructions from a brief title (Simulated AI)
 * @route   POST /api/admin/generate-instructions
 * @access  Admin
 */
const generateProjectInstructions = async (req, res) => {
  try {
    const { projectTitle } = req.body;

    // Validate input
    if (!projectTitle || typeof projectTitle !== 'string' || projectTitle.trim().length === 0) {
      return res.status(400).json({ 
        msg: 'projectTitle is required and must be a non-empty string' 
      });
    }

    // Simulated AI Response: Generate structured instructions based on title
    // In production, this would call an actual LLM API (OpenAI, Anthropic, etc.)
    const detailedInstructions = `# Project Instructions: ${projectTitle}

## **Objective**

The main goal is to accurately tag the sentiment and classify the intent of the provided data points. Accuracy is paramount.

## **Criteria & Quality**

- **Accuracy:** Must maintain an approval rate above 90% (Gold Tier standard).
- **Clarity:** Annotations must be clear, concise, and follow the provided JSON format.
- **Consistency:** Ensure all annotations follow the same classification rules and format.

## **Steps**

1. Read the provided text carefully.
2. Identify the primary sentiment (Positive, Negative, Neutral).
3. Determine the user's core intent (e.g., 'Complaint', 'Inquiry', 'Feedback', 'Request', 'Appreciation').
4. Tag the text with appropriate metadata.
5. Review your work for accuracy and completeness.
6. Save your submission.

## **Quality Standards**

- **Gold Tier Requirement:** Maintain 90%+ accuracy rate.
- **Review Process:** Submissions will be reviewed by AI and human administrators.
- **Feedback:** Use feedback from previous submissions to improve your annotations.

## **Common Pitfalls to Avoid**

- Don't rush through annotations; quality over quantity.
- Ensure sentiment classification is consistent across similar text patterns.
- Double-check intent classification matches the actual user message.
- Avoid vague or ambiguous classifications.

## **Submission Guidelines**

- Submit only completed annotations.
- Ensure all required fields are filled.
- Follow the exact format specified in the project brief.
- Review your submission before submitting.

---

*Note: This is an AI-generated instruction set. For specific questions, contact the project administrator.*`;

    res.status(200).json({ 
      instructions: detailedInstructions,
      projectTitle: projectTitle.trim()
    });
  } catch (err) {
    console.error('Error generating project instructions:', err.message);
    res.status(500).json({ msg: 'Server Error generating instructions.' });
  }
};

/**
 * @desc    Get project performance analytics using aggregation pipeline
 * @route   GET /api/admin/analytics/project-performance
 * @access  Admin
 */
const getProjectPerformanceAnalytics = async (req, res) => {
  try {
    const analytics = await Project.aggregate([
      {
        // Stage 1: Join with submissions collection
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'project',
          as: 'submissions'
        }
      },
      {
        // Stage 2: Unwind submissions array (preserve projects with no submissions)
        $unwind: {
          path: '$submissions',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        // Stage 3: Group by project and calculate KPIs
        $group: {
          _id: '$_id',
          title: { $first: '$title' },
          payRate: { $first: '$payRate' },
          paymentType: { $first: '$paymentType' },
          projectDomain: { $first: '$projectDomain' },
          status: { $first: '$status' },
          totalSubmissions: {
            $sum: {
              $cond: [{ $ifNull: ['$submissions._id', false] }, 1, 0]
            }
          },
          approvedSubmissions: {
            $sum: {
              $cond: [
                { $in: ['$submissions.status', ['Approved', 'Requested', 'Completed']] },
                1,
                0
              ]
            }
          },
          rejectedSubmissions: {
            $sum: {
              $cond: [{ $eq: ['$submissions.status', 'Rejected'] }, 1, 0]
            }
          },
          pendingSubmissions: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$submissions.status', 'Pending'] },
                    { $eq: ['$submissions.triageStatus', 'PENDING'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          // Sum of paymentAmount from approved submissions
          totalPaid: {
            $sum: {
              $cond: [
                { $in: ['$submissions.status', ['Approved', 'Requested', 'Completed']] },
                { $ifNull: ['$submissions.paymentAmount', 0] },
                0
              ]
            }
          }
        }
      },
      {
        // Stage 4: Calculate approval rate and format output
        $project: {
          _id: 1,
          title: 1,
          payRate: 1,
          paymentType: 1,
          projectDomain: 1,
          status: 1,
          totalSubmissions: 1,
          approvedSubmissions: 1,
          rejectedSubmissions: 1,
          pendingSubmissions: 1,
          totalPaid: {
            $round: ['$totalPaid', 2] // Round to 2 decimal places
          },
          approvalRate: {
            $cond: [
              { $eq: ['$totalSubmissions', 0] },
              0, // Default to 0 if no submissions (division by zero)
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: ['$approvedSubmissions', '$totalSubmissions']
                      },
                      100
                    ]
                  },
                  2
                ]
              }
            ]
          }
        }
      },
      {
        // Stage 5: Sort by totalPaid descending
        $sort: { totalPaid: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      count: analytics.length,
      data: analytics
    });
  } catch (err) {
    console.error('Error fetching project performance analytics:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server Error fetching project performance analytics.' 
    });
  }
};

/**
 * @desc    Get top 10 freelancer performance analytics using aggregation pipeline
 * @route   GET /api/admin/analytics/freelancer-performance
 * @access  Admin
 */
const getFreelancerPerformanceAnalytics = async (req, res) => {
  try {
    const analytics = await Submission.aggregate([
      {
        // Stage 1: $match - Filter only completed submissions
        $match: {
          status: { $in: ['Approved', 'Requested', 'Completed', 'Rejected'] }
        }
      },
      {
        // Stage 2: $group - Group submissions by user ID
        $group: {
          _id: '$user',
          approvedSubmissions: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Approved', 'Requested', 'Completed']] },
                1,
                0
              ]
            }
          },
          rejectedSubmissions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0]
            }
          },
          totalEarnings: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Approved', 'Requested', 'Completed']] },
                { $ifNull: ['$paymentAmount', 0] },
                0
              ]
            }
          }
        }
      },
      {
        // Stage 3: $project - Calculate approval rate
        $project: {
          _id: 1,
          approvedSubmissions: 1,
          rejectedSubmissions: 1,
          totalEarnings: {
            $round: ['$totalEarnings', 2]
          },
          totalCompleted: {
            $add: ['$approvedSubmissions', '$rejectedSubmissions']
          },
          approvalRate: {
            $cond: [
              { $eq: [{ $add: ['$approvedSubmissions', '$rejectedSubmissions'] }, 0] },
              0, // Default to 0 if no completed submissions (division by zero)
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          '$approvedSubmissions',
                          { $add: ['$approvedSubmissions', '$rejectedSubmissions'] }
                        ]
                      },
                      100
                    ]
                  },
                  2
                ]
              }
            ]
          }
        }
      },
      {
        // Stage 4: $sort - Sort by totalEarnings descending
        $sort: { totalEarnings: -1 }
      },
      {
        // Stage 5: $limit - Limit to Top 10 freelancers
        $limit: 10
      },
      {
        // Stage 6: $lookup - Join with users collection to get freelancer details
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        // Stage 7: $unwind - Unwind the userDetails array
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: false // Only include freelancers that exist in users collection
        }
      },
      {
        // Stage 8: $project - Final shape with required fields
        $project: {
          _id: 0,
          userId: '$_id',
          name: {
            $concat: [
              { $ifNull: ['$userDetails.firstName', ''] },
              ' ',
              { $ifNull: ['$userDetails.lastName', ''] }
            ]
          },
          email: { $ifNull: ['$userDetails.email', ''] },
          tier: { $ifNull: ['$userDetails.tier', 'Bronze'] },
          approvedSubmissions: 1,
          rejectedSubmissions: 1,
          totalCompleted: 1,
          approvalRate: 1,
          totalEarnings: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: analytics.length,
      data: analytics
    });
  } catch (err) {
    console.error('Error fetching freelancer performance analytics:', err.message);
    res.status(500).json({
      success: false,
      msg: 'Server Error fetching freelancer performance analytics.'
    });
  }
};

/**
 * @desc    Get dashboard stats (KPIs) for admin dashboard
 * @route   GET /api/admin/analytics/dashboard-stats
 * @access  Admin
 */
const getDashboardStats = async (req, res) => {
  try {
    const [totalProjects, pendingSubmissions, totalApplicants, pendingPayouts] = await Promise.all([
      // 1. Total Projects (Count ALL projects)
      Project.countDocuments(),
      
      // 2. Pending Submissions (Count submissions needing human review)
      Submission.countDocuments({ status: 'Pending' }),
      
      // 3. Total Applicants (Users with role 'Applicant' and status 'Pending')
      User.countDocuments({ role: 'Applicant', status: 'Pending' }),
      
      // 4. Pending Payouts (Based on 'Wallet System')
      PayoutRequest.countDocuments({ status: 'Pending' })
    ]);

    res.json({
      success: true,
      data: {
        totalProjects,
        pendingSubmissions,
        totalApplicants,
        pendingPayouts
      }
    });

  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
};

/**
 * @desc    Create a new qualification test
 * @route   POST /api/admin/qualification-tests
 * @access  Admin
 */
const createQualificationTest = async (req, res) => {
  try {
    const { title, projectDomain, description, tasks, status } = req.body;
    const test = new QualificationTest({
      title,
      projectDomain,
      description,
      tasks,
      status,
      createdBy: req.user.id // Link to the admin who created it
    });
    const createdTest = await test.save();
    res.status(201).json(createdTest);
  } catch (error) {
    res.status(400).json({ message: 'Error creating qualification test', error: error.message });
  }
};

/**
 * @desc    Get all qualification tests
 * @route   GET /api/admin/qualification-tests
 * @access  Admin
 */
const getAllQualificationTests = async (req, res) => {
  try {
    const tests = await QualificationTest.find({}).populate('createdBy', 'firstName lastName email');
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching qualification tests', error: error.message });
  }
};

/**
 * @desc    Update a qualification test
 * @route   PUT /api/admin/qualification-tests/:id
 * @access  Admin
 */
const updateQualificationTest = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTest = await QualificationTest.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedTest) {
      return res.status(404).json({ message: 'Test not found' });
    }
    res.json(updatedTest);
  } catch (error) {
    res.status(400).json({ message: 'Error updating qualification test', error: error.message });
  }
};

/**
 * @desc    Delete a qualification test
 * @route   DELETE /api/admin/qualification-tests/:id
 * @access  Admin
 */
const deleteQualificationTest = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTest = await QualificationTest.findByIdAndDelete(id);
    if (!deletedTest) {
      return res.status(404).json({ message: 'Test not found' });
    }
    // Optional: Also delete all submissions for this test
    // await QualificationSubmission.deleteMany({ test: id });
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting qualification test', error: error.message });
  }
};

/**
 * @desc    Get all pending qualification submissions
 * @route   GET /api/admin/qualification-submissions/pending
 * @access  Admin
 */
const getPendingQualificationSubmissions = async (req, res) => {
  try {
    const submissions = await QualificationSubmission.find({ status: 'Pending' })
      .populate('user', 'firstName lastName email')
      .populate('test', 'title projectDomain description');
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};

/**
 * @desc    Review (Approve/Reject) a qualification submission
 * @route   PUT /api/admin/qualification-submissions/review/:submissionId
 * @access  Admin
 */
const reviewQualificationSubmission = async (req, res) => {
  const { submissionId } = req.params;
  const { newStatus, adminFeedback } = req.body; // newStatus must be 'Approved' or 'Rejected'

  if (!['Approved', 'Rejected'].includes(newStatus)) {
    return res.status(400).json({ message: 'Invalid status. Must be "Approved" or "Rejected".' });
  }

  try {
    // 1. Find the submission first (without populate to get the ObjectId)
    const submission = await QualificationSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Store user ID and test ID before populating
    const userId = submission.user;
    const testId = submission.test;

    // 2. Update the submission
    submission.status = newStatus;
    if (adminFeedback !== undefined) {
      submission.adminFeedback = adminFeedback;
    }
    await submission.save();

    // 3. CRITICAL: If Approved, update the User's model
    if (newStatus === 'Approved') {
      // Get the test to access projectDomain
      const test = await QualificationTest.findById(testId);
      if (!test) {
        return res.status(404).json({ message: 'Test not found' });
      }

      // Get the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get the domain from the test
      const domainToUnlock = test.projectDomain;

      // Update user status to 'Accepted' if they are still 'Pending' or 'New'
      if (user.status === 'Pending' || user.status === 'New') {
        user.status = 'Accepted';
      }

      // Update their skillDomain (it's a single string field, not an array)
      // Only update if they don't already have this domain
      if (!user.skillDomain || user.skillDomain !== domainToUnlock) {
        user.skillDomain = domainToUnlock;
      }

      // If user is still an Applicant, promote them to Freelancer
      if (user.role === 'Applicant') {
        user.role = 'Freelancer';
      }

      await user.save();
    }

    // Populate the updated submission before sending response
    const updatedSubmission = await QualificationSubmission.findById(submissionId)
      .populate('user', 'firstName lastName email')
      .populate('test', 'title projectDomain description');

    // ============================================
    // Send Email Notification to User
    // ============================================
    try {
      // Get the user (already fetched if approved, but need it for email)
      const user = await User.findById(userId).select('email firstName lastName');
      
      if (user && user.email) {
        let subject = '';
        let html = '';
        const testTitle = updatedSubmission.test?.title || 'the qualification test';
        const userName = user.firstName || user.lastName || 'Freelancer';

        if (newStatus === 'Approved') {
          subject = `Qualification Test Approved: Welcome to ${updatedSubmission.test?.projectDomain || 'New Domain'}!`;
          html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h3>Hi ${userName},</h3>
              <p>Great news! Your qualification test submission for <strong>"${testTitle}"</strong> has been <strong>Approved</strong>.</p>
              <p>You have successfully unlocked access to <strong>${updatedSubmission.test?.projectDomain || 'new domain'}</strong> projects.</p>
              <p>Your account status has been updated, and you can now access and work on projects in this domain.</p>
              <p>Keep up the great work!</p>
              <br />
              <p>- The Nexus AI Team</p>
            </div>
          `;
        } else if (newStatus === 'Rejected') {
          subject = `Qualification Test Rejected: ${testTitle}`;
          html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h3>Hi ${userName},</h3>
              <p>Your qualification test submission for <strong>"${testTitle}"</strong> has been <strong>Rejected</strong>.</p>
              <p><strong>Admin Feedback:</strong> ${updatedSubmission.adminFeedback || 'No feedback provided.'}</p>
              <p>Please review the test requirements and guidelines. You may be able to retake the test or try a different qualification test.</p>
              <br />
              <p>- The Nexus AI Team</p>
            </div>
          `;
        }

        // Send the email (don't block the main response, run it async)
        if (subject) {
          sendEmail({
            email: user.email,
            subject: subject,
            html: html
          }).catch(emailError => {
            // Log the email error, but don't fail the main API request
            console.error('Failed to send qualification submission review email:', emailError);
          });
        }
      }
    } catch (emailError) {
      // Log the email error, but don't fail the main API request
      console.error('Failed to send qualification submission review email:', emailError);
    }

    res.json(updatedSubmission);
  } catch (error) {
    res.status(500).json({ message: 'Error reviewing submission', error: error.message });
  }
};

module.exports = {
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
  reviewQualificationSubmission,
};

