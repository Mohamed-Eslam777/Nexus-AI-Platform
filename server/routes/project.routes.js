const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, admin } = require('../middleware/auth.middleware');

const Project = require('../models/Project.model');
const Submission = require('../models/Submission.model');
const User = require('../models/User.model'); // ⬅️ لازم نتأكد إن ده موجود
const { logAdminAction } = require('../utils/logger');
const { createAuditLogEntry } = require('../utils/auditLog');
const { aiQualityCheck } = require('../services/aiService');
const { getIO } = require('../socket'); // Import Socket.io getter function
const sendEmail = require('../utils/emailService.js');

// @route   GET /api/projects/all
// @desc    Get all projects (Admin only - for editing)
router.get('/all', protect, admin, async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/projects
// @desc    Get all available projects (filtered by isRepeatable and user's skill domain)
router.get('/', protect, async (req, res) => {
  try {
    // Fetch the full user object to get their skillDomain (CRITICAL)
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    const userDomain = user.skillDomain; // This is the user's specialization

    // Convert userId to ObjectId before using in aggregation pipeline
    const userIdObjectId = new mongoose.Types.ObjectId(req.user.id);

    // Build the $match condition for domain filtering
    // CRITICAL: If user has a specific skillDomain (not 'General'), show projects matching that domain OR 'General'
    // If user has no skillDomain (null) or is marked 'General', show only 'General' projects
    const matchCondition = { 
      status: 'Available' 
    };

    // Add Domain Logic based on user's specialization
    if (userDomain && userDomain !== 'General') {
      // User has a specific domain (e.g., Programming, Health, Business, Law)
      matchCondition.$or = [
        { projectDomain: userDomain }, // 1. Match the user's specific skill
        { projectDomain: 'General' }   // 2. Or, it's a general task for everyone
      ];
      console.log(`[DOMAIN FILTER] User ${user._id} has domain '${userDomain}'. Showing projects with domain: ${userDomain} OR General`);
    } else {
      // User has no domain yet (null) or is marked 'General'
      matchCondition.projectDomain = 'General'; // Can only see General projects
      console.log(`[DOMAIN FILTER] User ${user._id} has no specific domain (${userDomain}). Showing only General projects`);
    }

    console.log(`[DOMAIN FILTER] Match condition:`, JSON.stringify(matchCondition, null, 2));

    const projects = await Project.aggregate([
      {
        // Stage 0: Filter by Status AND Domain
        $match: matchCondition
      },
      {
        // Stage 1: Join with the Submissions collection to check user's completed submissions
        $lookup: {
          from: 'submissions',
          let: { projectId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$project', '$$projectId'] },
                    { $eq: ['$user', userIdObjectId] },
                    // Check for completed submissions (exclude 'Rejected' status)
                    // A submission is considered "completed" if it's not rejected
                    { $ne: ['$status', 'Rejected'] }
                  ]
                }
              }
            }
          ],
          as: 'userCompletedSubmissions'
        }
      },
      {
        // Stage 2: Count total completed submissions for this project (excluding Rejected)
        $lookup: {
          from: 'submissions',
          let: { projectId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$project', '$$projectId'] },
                    { $ne: ['$status', 'Rejected'] } // Count only completed submissions (not rejected)
                  ]
                }
              }
            }
          ],
          as: 'allCompletedSubmissions'
        }
      },
      {
        // Stage 3: Add fields to check user submission status, total submissions count, and set defaults
        $addFields: {
          userHasCompletedSubmission: { $gt: [{ $size: '$userCompletedSubmissions' }, 0] },
          totalCompletedSubmissions: { $size: '$allCompletedSubmissions' },
          isRepeatable: {
            $ifNull: ['$isRepeatable', true] // Default to true for legacy projects
          },
          maxTotalSubmissions: {
            $ifNull: ['$maxTotalSubmissions', null] // Default to null (no limit) for legacy projects
          }
        }
      },
      {
        // Stage 4: Filter projects based on:
        // 1. isRepeatable and user submission status
        // 2. maxTotalSubmissions limit (if set)
        $match: {
          $expr: {
            $and: [
              {
                // Filter based on isRepeatable and user submission status
                $or: [
                  { $eq: ['$isRepeatable', true] }, // Repeatable projects are always included
                  { $eq: ['$userHasCompletedSubmission', false] } // Non-repeatable projects only if user hasn't completed a submission
                ]
              },
              {
                // Filter out projects that have reached maxTotalSubmissions limit
                $or: [
                  { $eq: ['$maxTotalSubmissions', null] }, // No limit set
                  { $lt: ['$totalCompletedSubmissions', '$maxTotalSubmissions'] } // Under the limit
                ]
              }
            ]
          }
        }
      },
      {
        // Stage 5: Clean up the output (remove temporary fields)
        $project: {
          userCompletedSubmissions: 0,
          userHasCompletedSubmission: 0,
          allCompletedSubmissions: 0,
          totalCompletedSubmissions: 0
        }
      }
    ]);

    console.log(`[DOMAIN FILTER] Found ${projects.length} projects matching the filter criteria`);
    if (projects.length > 0) {
      const domainCounts = {};
      projects.forEach(p => {
        domainCounts[p.projectDomain] = (domainCounts[p.projectDomain] || 0) + 1;
      });
      console.log(`[DOMAIN FILTER] Project domains in results:`, domainCounts);
    }

    return res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/projects
// @desc    Create a new project (Admin)
router.post('/', protect, admin, async (req, res) => {
  try {
    // Guard clause for req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'User authentication required.' });
    }
    
    const { title, description, detailedInstructions, payRate, paymentType, taskContent, taskPoolData, taskType, isRepeatable, maxTotalSubmissions, projectDomain } = req.body; 
    
    // Process Task Pool JSON data
    let taskPool = [];
    if (taskPoolData && taskPoolData.trim()) {
      try {
        const parsed = JSON.parse(taskPoolData);
        if (!Array.isArray(parsed)) {
          return res.status(400).json({ msg: 'Invalid JSON format for Task Pool: must be an array.' });
        }
        // Validate each task object has required fields
        for (const task of parsed) {
          if (!task.content || typeof task.content !== 'string') {
            return res.status(400).json({ msg: 'Invalid task object: each task must have a "content" field (string).' });
          }
        }
        taskPool = parsed;
      } catch (parseError) {
        return res.status(400).json({ msg: 'Invalid JSON format for Task Pool: ' + parseError.message });
      }
    }
    
    const newProject = new Project({
      title, 
      description,
      detailedInstructions, 
      payRate, 
      paymentType, 
      taskContent, // Keep for backward compatibility (optional now)
      taskPool, // Save the parsed array
      taskType, 
      isRepeatable: isRepeatable !== undefined ? isRepeatable : true, // Default to true if not provided
      maxTotalSubmissions: maxTotalSubmissions !== undefined && maxTotalSubmissions !== '' ? parseInt(maxTotalSubmissions, 10) : null, // Convert to number or null
      projectDomain: projectDomain || 'General', // Default to 'General' if not provided
      status: 'Available', // Set to 'Available' by default so projects appear on freelancer dashboard immediately
      createdBy: req.user.id 
    });
    const project = await newProject.save();
    res.status(201).json(project); 
  } catch (err) {
    console.error('SERVER ERROR DURING PROJECT SAVE:', err.message);
    res.status(500).send({ msg: 'Server Error during project save.' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update a project by ID (Admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // CRITICAL: Validate projectId format FIRST (before any database operations)
    // This ensures we return 404 for invalid IDs, not 403 from middleware
    // Priority: 404 (Not Found) > 403 (Forbidden) when ID format is invalid
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // CRITICAL FIX: Ensure the project exists before proceeding with update
    // This check happens before the update to ensure 404 priority over 403
    const existingProject = await Project.findById(projectId);
    if (!existingProject) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Store old project data for audit logging
    const oldProjectData = {
      title: existingProject.title,
      description: existingProject.description,
      payRate: existingProject.payRate,
      taskType: existingProject.taskType,
      status: existingProject.status,
      isRepeatable: existingProject.isRepeatable,
      maxTotalSubmissions: existingProject.maxTotalSubmissions,
    };

    const updates = { ...req.body };
    
    // Process maxTotalSubmissions: Convert to number or null
    if (updates.maxTotalSubmissions !== undefined) {
      if (updates.maxTotalSubmissions === '' || updates.maxTotalSubmissions === null) {
        updates.maxTotalSubmissions = null; // No limit
      } else {
        const parsedValue = parseInt(updates.maxTotalSubmissions, 10);
        if (isNaN(parsedValue) || parsedValue < 1) {
          return res.status(400).json({ msg: 'maxTotalSubmissions must be a positive number or empty for no limit.' });
        }
        updates.maxTotalSubmissions = parsedValue;
      }
    }
    
    // Process Task Pool JSON data if provided
    if (updates.taskPoolData !== undefined) {
      if (updates.taskPoolData && updates.taskPoolData.trim()) {
        try {
          const parsed = JSON.parse(updates.taskPoolData);
          if (!Array.isArray(parsed)) {
            return res.status(400).json({ msg: 'Invalid JSON format for Task Pool: must be an array.' });
          }
          // Validate each task object has required fields
          for (const task of parsed) {
            if (!task.content || typeof task.content !== 'string') {
              return res.status(400).json({ msg: 'Invalid task object: each task must have a "content" field (string).' });
            }
          }
          updates.taskPool = parsed;
        } catch (parseError) {
          return res.status(400).json({ msg: 'Invalid JSON format for Task Pool: ' + parseError.message });
        }
      } else {
        // Empty string means empty array
        updates.taskPool = [];
      }
      // Remove taskPoolData from updates (we've converted it to taskPool)
      delete updates.taskPoolData;
    }

    // Perform database update (now we know the project exists)
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $set: updates },
      { new: true, runValidators: true } // Return the updated document and run Mongoose validation
    );

    // Double-check after update (shouldn't be necessary, but safety check)
    if (!updatedProject) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Log admin action to audit log using the new utility function
    await createAuditLogEntry(
      req.user.id,
      'PROJECT_UPDATED',
      {
        resourceType: 'Project',
        resourceId: updatedProject._id,
        projectId: updatedProject._id,
        oldData: oldProjectData,
        newData: updates,
        updatedFields: Object.keys(updates),
        projectTitle: updatedProject.title,
      }
    );

    res.json({
      msg: 'Project updated successfully',
      project: updatedProject
    });
  } catch (err) {
    console.error('Project update error:', err.message);
    console.error('Full error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project (Admin only)
// @access  Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Optional: Delete associated submissions first if needed
    // await Submission.deleteMany({ project: req.params.id });

    await project.deleteOne();

    res.json({ msg: 'Project deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ... (في بداية الملف، تأكد من وجود const User = require('../models/User.model');) ...

// @route   POST /api/projects/:id/submit (إرسال التاسك)
// ⬇️⬇️ ده الكود النهائي بعد إصلاح نوع البيانات ⬇️⬇️
router.post('/:id/submit', protect, async (req, res) => {
  console.log('--- [1] (SUBMIT) الراوت اشتغل ---');
  try {
    const projectId = req.params.id;
    
    // CRITICAL FIX: Immediate check for user authentication at the beginning
    // Quick check to force 401 if token is bad or missing user data
    if (!req.user || !req.user.id) {
      console.error('[AUTH ERROR] (SUBMIT) User data missing from token or authentication failed');
      return res.status(401).json({ 
        msg: 'Authentication failed: User data missing from token.' 
      });
    }
    
    const userId = req.user.id;
    const { content, timeSpentMinutes, taskIndex } = req.body;
    
    // Validate projectId format FIRST (after authentication, before database operations)
    // Priority: 404 (Not Found) should come early to avoid unnecessary processing
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(404).json({ msg: 'Invalid project ID format.' });
    }
    
    // Validate required fields
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ msg: 'Submission content is required and cannot be empty.' });
    } 

    console.log(`[2] (SUBMIT) ProjectID: ${projectId}, UserID: ${userId}`);
    console.log(`[3] (SUBMIT) U.O-OU^U% OU,OOO3U (Body):`, req.body);
    
    // 1. U+OUSO" OU,U.O'OU^O1 (O1O'OU+ U+O1OU? O3O1OU)
    const project = await Project.findById(projectId);
    if (!project) { 
      console.log('[4] (SUBMIT) خطأ: المشروع غير موجود');
      return res.status(404).json({ msg: 'Project not found' }); 
    }
    
    console.log(`[4] (SUBMIT) المشروع موجود. السعر (الخام): ${project.payRate}, نوعه: ${typeof project.payRate}`);
    
    // ----------------------------------------------------
    // ⬇️⬇️ --- Duplicate Submission Check (with exceptions) --- ⬇️⬇️
    // ----------------------------------------------------
    // List of task types allowed to be repeated
    const repeatableTasks = ['Model_Comparison', 'Image_Annotation']; // Use the correct ENUM values
    
    // CHECK FOR DUPLICATE SUBMISSION:
    if (!repeatableTasks.includes(project.taskType)) {
      const existingSubmission = await Submission.findOne({ 
        user: userId, 
        project: projectId,
        // Only check for Approved, Pending, or Scheduled submissions
        status: { $in: ['Approved', 'Pending', 'Scheduled'] } 
      });

      if (existingSubmission) {
        return res.status(400).json({ 
          msg: `You have already submitted this task (Type: ${project.taskType}). Only tasks of type Model Comparison or Image Annotation can be repeated.` 
        });
      }
    }
    
    // ----------------------------------------------------
    // ⬇️⬇️ --- هنا الحل --- ⬇️⬇️
    // ----------------------------------------------------
    // Flexible Payment Calculation Logic
    // Calculate paymentAmount based on paymentType (PER_TASK vs HOURLY)
    let paymentAmount = 0; // Initialize payment amount
    
    if (project.paymentType === 'HOURLY') {
      // Validation: Ensure timeSpentMinutes was provided for hourly tasks
      if (!timeSpentMinutes || parseInt(timeSpentMinutes, 10) <= 0) {
        return res.status(400).json({ msg: 'Invalid time. Time spent (in minutes) is required for hourly projects.' });
      }
      
      // Calculate payment: (Pay Rate per Hour / 60) * Minutes Worked
      const payRatePerHour = Number(project.payRate || 0);
      const minutesWorked = parseInt(timeSpentMinutes, 10);
      paymentAmount = (payRatePerHour / 60) * minutesWorked;
      
      // Optional: Round to 2 decimal places
      paymentAmount = Math.round(paymentAmount * 100) / 100;
      
    } else {
      // This is a 'PER_TASK' project (or legacy project without paymentType)
      paymentAmount = Number(project.payRate || 0);
    }
    
    if (paymentAmount <= 0) {
      console.log('[5] (SUBMIT) خطأ فادح: سعر المشروع غير معرف أو صفر.');
      return res.status(400).json({ msg: 'Project pay rate is not set or is zero.' });
    }
    // ----------------------------------------------------
    // ⬆️⬆️ --- نهاية الحل --- ⬆️⬆️
    // ----------------------------------------------------

    // ============================================
    // Check maxTotalSubmissions Limit (Aggregate Cap)
    // ============================================
    if (project.maxTotalSubmissions !== null && project.maxTotalSubmissions !== undefined) {
      // Count existing completed submissions (excluding Rejected)
      const currentCompletedSubmissions = await Submission.countDocuments({
        project: projectId,
        status: { $ne: 'Rejected' }
      });

      // Check if project has reached its limit
      if (currentCompletedSubmissions >= project.maxTotalSubmissions) {
        console.log(`[SUBMISSION LIMIT] Project ${projectId} has reached its maximum submission limit (${currentCompletedSubmissions}/${project.maxTotalSubmissions})`);
        return res.status(403).json({ 
          msg: 'This project has reached its maximum submission limit.' 
        });
      }
    }

    // ============================================
    // AI Quality Check & Auto-Triage Logic
    // ============================================
    
    // Prepare trimmed content for AI quality check
    const trimmedContent = typeof content === 'string' ? content.trim() : JSON.stringify(content);

    // Prepare project criteria for AI quality check
    const projectCriteria = {
      title: project.title,
      description: project.description,
      detailedInstructions: project.detailedInstructions,
      taskType: project.taskType,
      projectDomain: project.projectDomain,
    };

    // Execute AI Quality Check to get triage status and reason
    let aiResult;
    try {
      aiResult = await aiQualityCheck(trimmedContent, projectCriteria);
      console.log(`[AI QUALITY CHECK] Triage status determined: ${aiResult.status}, Reason: ${aiResult.reason}`);
    } catch (aiError) {
      console.error('[AI QUALITY CHECK ERROR] Failed to get AI triage status:', aiError);
      // Default to PENDING if AI check fails
      aiResult = { status: 'PENDING', reason: 'AI Quality Check failed.' };
    }
    
    const triageStatus = aiResult.status;
    const aiFeedbackFromAI = aiResult.reason; // Save the AI's actual reason from Gemini

    // Simulate AI Score: Generate random score between 50 and 100 (wider range for testing)
    // Note: This score is kept for backward compatibility but AI feedback now comes from Gemini
    const aiScore = Math.floor(Math.random() * 51) + 50; // 50-100 inclusive

    // Auto-Triage Logic - Use Gemini's triage status when available
    const AUTO_APPROVE_THRESHOLD = 98;
    const HUMAN_REVIEW_THRESHOLD = 70;
    
    let submissionStatus;
    // Prioritize Gemini's triage status if available, otherwise fall back to score-based logic
    if (triageStatus === 'APPROVED') {
      submissionStatus = 'Approved';
      console.log(`[AI-TRIAGE] Auto-Approved submission based on Gemini triage: ${triageStatus}`);
    } else if (triageStatus === 'REJECTED') {
      submissionStatus = 'Rejected';
      console.log(`[AI-TRIAGE] Auto-Rejected submission based on Gemini triage: ${triageStatus}`);
    } else if (triageStatus === 'PENDING') {
      // For PENDING, check if score-based logic suggests approval/rejection as fallback
      if (aiScore >= AUTO_APPROVE_THRESHOLD) {
        submissionStatus = 'Approved';
        console.log(`[AI-TRIAGE] Auto-Approved submission with score ${aiScore}% (Gemini suggested PENDING)`);
      } else if (aiScore < HUMAN_REVIEW_THRESHOLD) {
        submissionStatus = 'Rejected';
        console.log(`[AI-TRIAGE] Auto-Rejected submission with score ${aiScore}% (Gemini suggested PENDING)`);
      } else {
        submissionStatus = 'Pending';
        console.log(`[AI-TRIAGE] Submission requires human review (Gemini: ${triageStatus}, Score: ${aiScore}%)`);
      }
    } else {
      // Fallback to score-based logic if triageStatus is invalid
      if (aiScore >= AUTO_APPROVE_THRESHOLD) {
        submissionStatus = 'Approved';
        console.log(`[AI-TRIAGE] Auto-Approved submission with score ${aiScore}%`);
      } else if (aiScore < HUMAN_REVIEW_THRESHOLD) {
        submissionStatus = 'Rejected';
        console.log(`[AI-TRIAGE] Auto-Rejected submission with score ${aiScore}%`);
      } else {
        submissionStatus = 'Pending';
        console.log(`[AI-TRIAGE] Submission requires human review (score: ${aiScore}%)`);
      }
    }

    // ============================================
    // Auto-Approval Scheduling Logic
    // ============================================
    // Schedule auto-approval for high-quality pending submissions (>= 90%) after 3 days
    let scheduledApprovalDate = null;
    
    if (aiScore >= 90 && submissionStatus === 'Pending') {
      // Schedule approval 3 days from now
      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      scheduledApprovalDate = threeDaysLater;
      
      console.log(`[AUTO-APPROVAL SCHEDULE] High-quality submission (${aiScore}%) scheduled for auto-approval on ${scheduledApprovalDate.toISOString()}`);
    }

    // ============================================
    // Consistency Check: Detect Contradictions
    // ============================================
    // Check for contradiction: High AI score but suspiciously short user input
    // This simulates detecting low-effort responses that might have high scores
    let consistencyWarning = false;
    const contentLength = trimmedContent.length;

    // Contradiction Logic: High score from AI but low-effort user input
    if (aiScore > 80 && contentLength < 50) {
      consistencyWarning = true;
      console.log(`[CONSISTENCY WARNING] High AI score (${aiScore}%) but short content (${contentLength} chars) - possible contradiction detected`);
    }

    // 4. تجميع بيانات التاسك - Ensure all required fields are present
    const submissionData = {
      project: projectId,
      user: userId,
      content: trimmedContent, // Use trimmed content
      paymentAmount: paymentAmount, // The newly calculated amount
      timeSpentMinutes: project.paymentType === 'HOURLY' ? parseInt(timeSpentMinutes, 10) : null, // Save the minutes for hourly projects
      status: submissionStatus,
      aiScore: aiScore,
      aiFeedback: aiFeedbackFromAI, // Save the AI's actual reason from Gemini
      triageStatus: triageStatus, // AI-determined triage status (APPROVED, REJECTED, PENDING)
      consistencyWarning: consistencyWarning, // Add consistency warning flag
      scheduledApprovalDate: scheduledApprovalDate, // Auto-approval scheduling for high-quality pending submissions
    };

    // Validate all required fields before creating submission
    if (!submissionData.project || !submissionData.user || !submissionData.content || submissionData.paymentAmount === undefined || submissionData.paymentAmount === null) {
      console.error('[5.5] (SUBMIT) خطأ: بعض الحقول المطلوبة مفقودة:', submissionData);
      return res.status(400).json({ msg: 'Missing required submission fields.' });
    }

    console.log('[5] (SUBMIT) جاري إنشاء تاسك جديد بالبيانات دي:', submissionData);
    
    const submission = new Submission(submissionData);
    await submission.save(); // الحفظ في الداتابيز

    console.log('[6] (SUBMIT) نجاح! التاسك اتسجل في الداتابيز.');
    
    // ============================================
    // Unlock Task Upon Submission
    // ============================================
    // Unlock any locked submissions for this user and project after successful submission
    // This ensures that when a user submits work, any locked tasks they had are unlocked
    try {
      // Unlock all locked submissions for this user and project
      const unlockResult = await Submission.updateMany(
        {
          project: projectId,
          user: userId,
          isLocked: true,
          lockedBy: userId
        },
        {
          $set: {
            isLocked: false,
            lockedBy: null
          }
        }
      );
      
      if (unlockResult.modifiedCount > 0) {
        console.log(`[TASK UNLOCK] Successfully unlocked ${unlockResult.modifiedCount} task(s) upon submission for user ${userId} and project ${projectId}`);
      }
      
      // Also ensure the current submission is unlocked (in case it was created with lock)
      if (submission.isLocked) {
        submission.isLocked = false;
        submission.lockedBy = null;
        await submission.save();
        console.log(`[TASK UNLOCK] Successfully unlocked current submission ${submission._id} upon submission`);
      }
    } catch (unlockErr) {
      // Log error but don't fail the submission
      console.error(`[TASK UNLOCK ERROR] Error unlocking task upon submission:`, unlockErr);
      console.warn(`[TASK UNLOCK WARNING] Submission saved but task unlock failed`);
    }
    
    // ============================================
    // Task repetition is now controlled by isRepeatable field
    // Projects are filtered at query time based on user's submission history
    // No need to decrement any count - the backend query handles filtering
    // ============================================
    
    // ============================================
    // Lock Task in Task Pool (if taskIndex is provided)
    // ============================================
    // Mark the specific task instance as assigned/completed in the taskPool
    if (taskIndex !== null && taskIndex !== undefined) {
      try {
        // Convert taskIndex to number if it's a string
        const index = parseInt(taskIndex, 10);
        
        if (isNaN(index) || index < 0) {
          console.warn(`[TASK LOCK] Invalid taskIndex value: ${taskIndex}`);
        } else {
          const projectToUpdate = await Project.findById(projectId);
          
          if (projectToUpdate && projectToUpdate.taskPool && projectToUpdate.taskPool[index]) {
            // Mark this specific task instance as assigned/completed
            projectToUpdate.taskPool[index].isAssigned = true;
            await projectToUpdate.save();
            console.log(`[TASK LOCK] Successfully locked task at index ${index} in project ${projectId}`);
          } else {
            console.warn(`[TASK LOCK] Warning: Task at index ${index} not found in project ${projectId}'s taskPool`);
          }
        }
      } catch (lockErr) {
        console.error(`[TASK LOCK] Error locking task in pool:`, lockErr);
        // Don't fail the submission, but log the error
        console.warn(`[TASK LOCK] Submission saved but task was not locked in pool`);
      }
    }
    
    // ============================================
    // Update User Performance Metrics & Tier (AI Auto-Triage)
    // ============================================
    // Only update metrics if AI auto-triage set status to 'Approved' or 'Rejected'
    if (submissionStatus === 'Approved' || submissionStatus === 'Rejected') {
      // Retrieve the user associated with this submission
      const user = await User.findById(userId);
      
      if (user) {
        // Increment total submissions count
        user.totalSubmissionsCount = (user.totalSubmissionsCount || 0) + 1;
        
        // If approved, increment approved submissions count
        if (submissionStatus === 'Approved') {
          user.approvedSubmissionsCount = (user.approvedSubmissionsCount || 0) + 1;
        }
        
        // Calculate approval rate (handle division by zero)
        if (user.totalSubmissionsCount > 0) {
          user.approvalRate = (user.approvedSubmissionsCount / user.totalSubmissionsCount) * 100;
        } else {
          user.approvalRate = 0;
        }
        
        // Update tier based on approval rate
        const updateTier = (rate) => {
          if (rate >= 95) return 'Elite';
          if (rate >= 85) return 'Gold';
          if (rate >= 70) return 'Silver';
          return 'Bronze';
        };
        
        user.tier = updateTier(user.approvalRate);
        
        // Save the updated user
        await user.save();
        
        console.log(`[PERFORMANCE] [AI-TRIAGE] Updated user ${user._id} metrics: Tier=${user.tier}, ApprovalRate=${user.approvalRate.toFixed(2)}%, Approved=${user.approvedSubmissionsCount}, Total=${user.totalSubmissionsCount}`);
        
        // ============================================
        // Save Notification to User's Notifications Array (AI Auto-Triage)
        // ============================================
        try {
          // Get project title for the notification message (project is already fetched)
          const projectTitle = project ? project.title : 'task';
          
          // Create notification data matching the User schema
          const notificationData = {
            message: submissionStatus === 'Approved' 
              ? `Your submission for '${projectTitle}' was approved. You've earned $${paymentAmount.toFixed(2)}.`
              : `Your submission for '${projectTitle}' was rejected. Please review the feedback and resubmit.`,
            type: submissionStatus === 'Approved' ? 'success' : 'error',
            link: `/task/${submission._id}`,
            isRead: false,
            createdAt: new Date()
          };

          // Push notification to user's notifications array
          user.notifications.push(notificationData);

          // Limit array to last 20 notifications (optional but recommended)
          if (user.notifications.length > 20) {
            user.notifications = user.notifications.slice(-20);
          }

          // Save the user with the new notification
          await user.save();
          console.log(`[NOTIFICATION] [AI-TRIAGE] Saved notification to user ${user._id.toString()}: ${notificationData.message}`);
        } catch (notifSaveErr) {
          console.error(`[AI-TRIAGE] Error saving notification to user:`, notifSaveErr);
          console.warn(`[AI-TRIAGE] Notification save failed, but submission and user updates were saved`);
        }

        // ============================================
        // Send Real-Time Notification to User (AI Auto-Triage)
        // ============================================
        try {
          const io = getIO();
          if (!io) {
            console.warn(`[AI-TRIAGE] Socket.io not initialized, skipping notification`);
          } else {
            const notificationType = submissionStatus === 'Approved' ? 'SUBMISSION_APPROVED' : 'SUBMISSION_REJECTED';
            const notificationMessage = submissionStatus === 'Approved' 
              ? `🎉 Great news! Your submission has been approved. You've earned $${paymentAmount.toFixed(2)}. Your tier: ${user.tier}.`
              : `Your submission has been reviewed and requires revision. Please review the feedback and resubmit.`;

            io.to(`user-${user._id.toString()}`).emit('notification', {
              type: notificationType,
              message: notificationMessage,
              submissionId: submission._id.toString(),
              status: submissionStatus,
              tier: user.tier,
              approvalRate: user.approvalRate.toFixed(2),
              timestamp: new Date().toISOString(),
            });

            console.log(`[SOCKET.IO] [AI-TRIAGE] Sent ${notificationType} notification to user ${user._id.toString()}`);
          }
        } catch (notifErr) {
          console.error(`[AI-TRIAGE] Error sending notification:`, notifErr);
          console.warn(`[AI-TRIAGE] Notification failed, but submission and user updates were saved`);
        }
      }
    }
    
    // Enhanced response message based on AI triage result
    let responseMessage = 'Work submitted successfully!';
    if (submissionStatus === 'Approved') {
      responseMessage = 'Work submitted and auto-approved by AI quality check!';
    } else if (submissionStatus === 'Rejected') {
      responseMessage = 'Work submitted, but did not meet quality standards.';
    } else {
      responseMessage = 'Work submitted successfully! Awaiting admin review.';
    }
    
    res.status(201).json({ 
      msg: responseMessage, 
      submission,
      aiScore: aiScore,
      aiFeedback: aiFeedback,
      status: submissionStatus,
    });

  } catch (err) {
    console.error('--- [CRITICAL SUBMIT ERROR] ---');
    console.error('Submission processing failed:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Error name:', err.name);
    
    // Provide more detailed error response
    const errorMessage = err.message || 'Unknown error occurred';
    const errorResponse = { 
      msg: 'Server Error during submission.',
      error: errorMessage
    };
    
    // Include validation errors if present
    if (err.name === 'ValidationError') {
      errorResponse.validationErrors = err.errors;
      return res.status(400).json(errorResponse);
    }
    
    res.status(500).json(errorResponse);
  }
});
// @route   PUT /api/projects/submissions/:id/review (موافقة الأدمن)
router.put('/submissions/:id/review', protect, admin, async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { status, adminFeedback } = req.body; 

    console.log(`[SUBMISSION REVIEW] Starting review for submission ${submissionId} with status ${status}`);

    // Validate submission exists
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      console.error(`[SUBMISSION REVIEW] Submission ${submissionId} not found`);
      return res.status(404).json({ msg: 'Submission not found' });
    }

    // Validate status value
    if (status !== 'Approved' && status !== 'Rejected' && status !== 'Paid') {
      console.error(`[SUBMISSION REVIEW] Invalid status value: ${status}`);
      return res.status(400).json({ msg: 'Invalid status value' });
    }

    // Store original status before update for audit logging
    const originalSubmissionStatus = submission.status;
    console.log(`[SUBMISSION REVIEW] Original status: ${originalSubmissionStatus}, New status: ${status}`);

    // Update submission status
    try {
      submission.status = status;
      
      // Save admin feedback if provided
      if (adminFeedback !== undefined) {
        submission.adminFeedback = adminFeedback;
      }
      
      // Log who reviewed it and when (only for manual reviews: Approved/Rejected)
      if (status === 'Approved' || status === 'Rejected') {
        submission.reviewedBy = req.user.id;
        submission.reviewTimestamp = new Date();
      }
      
      await submission.save();
      console.log(`[SUBMISSION REVIEW] Successfully saved submission ${submissionId} with status ${status}`);
    } catch (saveErr) {
      console.error(`[SUBMISSION REVIEW] Error saving submission:`, saveErr);
      console.error(`[SUBMISSION REVIEW] Error details:`, {
        message: saveErr.message,
        name: saveErr.name,
        errors: saveErr.errors,
        stack: saveErr.stack
      });
      return res.status(500).json({ 
        msg: 'Error saving submission status.',
        error: saveErr.message,
        details: saveErr.name === 'ValidationError' ? saveErr.errors : undefined
      });
    }

    // ============================================
    // Update User Performance Metrics & Tier
    // ============================================
    // Only update metrics if status is 'Approved' or 'Rejected'
    if (status === 'Approved' || status === 'Rejected') {
      try {
        // Retrieve the user associated with this submission
        const user = await User.findById(submission.user);
        
        if (!user) {
          console.error(`[SUBMISSION REVIEW] User ${submission.user} not found for submission ${submissionId}`);
          // Don't fail the request, just log the warning
          console.warn(`[SUBMISSION REVIEW] Continuing without user metrics update`);
        } else {
          console.log(`[SUBMISSION REVIEW] Found user ${user._id}, updating metrics...`);
          
          // Store previous values for logging
          const previousTier = user.tier;
          const previousApprovalRate = user.approvalRate;
          const previousTotalCount = user.totalSubmissionsCount || 0;
          const previousApprovedCount = user.approvedSubmissionsCount || 0;

          // Increment total submissions count
          user.totalSubmissionsCount = (user.totalSubmissionsCount || 0) + 1;
          console.log(`[SUBMISSION REVIEW] Updated totalSubmissionsCount: ${previousTotalCount} -> ${user.totalSubmissionsCount}`);
          
          // If approved, increment approved submissions count
          if (status === 'Approved') {
            user.approvedSubmissionsCount = (user.approvedSubmissionsCount || 0) + 1;
            console.log(`[SUBMISSION REVIEW] Updated approvedSubmissionsCount: ${previousApprovedCount} -> ${user.approvedSubmissionsCount}`);
          }
          
          // Calculate approval rate (handle division by zero)
          if (user.totalSubmissionsCount > 0) {
            user.approvalRate = (user.approvedSubmissionsCount / user.totalSubmissionsCount) * 100;
          } else {
            user.approvalRate = 0;
          }
          console.log(`[SUBMISSION REVIEW] Calculated approvalRate: ${user.approvalRate.toFixed(2)}%`);
          
          // Update tier based on approval rate
          const updateTier = (rate) => {
            if (typeof rate !== 'number' || isNaN(rate)) {
              console.error(`[SUBMISSION REVIEW] Invalid approval rate for tier calculation: ${rate}`);
              return 'Bronze'; // Default fallback
            }
            if (rate >= 95) return 'Elite';
            if (rate >= 85) return 'Gold';
            if (rate >= 70) return 'Silver';
            return 'Bronze';
          };
          
          user.tier = updateTier(user.approvalRate);
          console.log(`[SUBMISSION REVIEW] Updated tier: ${previousTier} -> ${user.tier}`);
          
          // Save the updated user with detailed error handling
          try {
            await user.save();
            console.log(`[PERFORMANCE] Successfully updated user ${user._id} metrics: Tier=${user.tier}, ApprovalRate=${user.approvalRate.toFixed(2)}%, Approved=${user.approvedSubmissionsCount}, Total=${user.totalSubmissionsCount}`);
          } catch (userSaveErr) {
            console.error(`[SUBMISSION REVIEW] Error saving user metrics:`, userSaveErr);
            console.error(`[SUBMISSION REVIEW] User save error details:`, {
              message: userSaveErr.message,
              name: userSaveErr.name,
              errors: userSaveErr.errors,
              stack: userSaveErr.stack
            });
            // Don't fail the entire request, but log the error
            console.warn(`[SUBMISSION REVIEW] User metrics update failed, but submission status was saved`);
          }
          
          // ============================================
          // Audit Log: Log Admin Action
          // ============================================
          // Log the admin decision after both submission and user are saved
          try {
            const actionType = status === 'Approved' ? 'SUBMISSION_APPROVED' : 'SUBMISSION_REJECTED';
            
            console.log(`[SUBMISSION REVIEW] Attempting to log admin action: ${actionType}`);
            
            await logAdminAction(
              req.user.id,
              actionType,
              'Submission',
              submission._id,
              {
                oldStatus: originalSubmissionStatus,
                newStatus: status,
                userTierUpdatedTo: user.tier,
                userApprovalRate: user.approvalRate.toFixed(2),
                userId: user._id.toString(),
              }
            );

            console.log(`[SUBMISSION REVIEW] Successfully logged admin action: ${actionType}`);
          } catch (auditErr) {
            console.error(`[SUBMISSION REVIEW] Error logging admin action:`, auditErr);
            console.error(`[SUBMISSION REVIEW] Audit log error details:`, {
              message: auditErr.message,
              name: auditErr.name,
              stack: auditErr.stack
            });
            // Don't fail the entire request, but log the error
            console.warn(`[SUBMISSION REVIEW] Audit log failed, but submission and user updates were saved`);
          }

          // ============================================
          // Save Notification to User's Notifications Array
          // ============================================
          try {
            // Get project title for the notification message
            const project = await Project.findById(submission.project);
            const projectTitle = project ? project.title : 'task';
            
            // Create notification data matching the User schema
            const notificationData = {
              message: status === 'Approved' 
                ? `Your submission for '${projectTitle}' was approved. You've earned $${submission.paymentAmount.toFixed(2)}.`
                : `Your submission for '${projectTitle}' was rejected. Please review the feedback and resubmit.`,
              type: status === 'Approved' ? 'success' : 'error',
              link: `/task/${submission._id}`,
              isRead: false,
              createdAt: new Date()
            };

            // Push notification to user's notifications array
            user.notifications.push(notificationData);

            // Limit array to last 20 notifications (optional but recommended)
            if (user.notifications.length > 20) {
              user.notifications = user.notifications.slice(-20);
            }

            // Save the user with the new notification
            await user.save();
            console.log(`[NOTIFICATION] Saved notification to user ${user._id.toString()}: ${notificationData.message}`);
          } catch (notifSaveErr) {
            console.error(`[SUBMISSION REVIEW] Error saving notification to user:`, notifSaveErr);
            // Don't fail the entire request, but log the error
            console.warn(`[SUBMISSION REVIEW] Notification save failed, but submission and user updates were saved`);
          }

          // ============================================
          // Send Real-Time Notification to User
          // ============================================
          // Send notification only to the affected user (not the admin)
          try {
            const io = getIO();
            if (!io) {
              console.warn(`[SUBMISSION REVIEW] Socket.io not initialized, skipping notification`);
            } else {
              const notificationType = status === 'Approved' ? 'SUBMISSION_APPROVED' : 'SUBMISSION_REJECTED';
              const notificationMessage = status === 'Approved' 
                ? `🎉 Great news! Your submission has been approved. You've earned $${submission.paymentAmount.toFixed(2)}. Your tier: ${user.tier}.`
                : `Your submission has been reviewed and requires revision. Please review the feedback and resubmit.`;

              io.to(`user-${user._id.toString()}`).emit('notification', {
                type: notificationType,
                message: notificationMessage,
                submissionId: submission._id.toString(),
                status: status,
                tier: user.tier,
                approvalRate: user.approvalRate.toFixed(2),
                timestamp: new Date().toISOString(),
              });

              console.log(`[SOCKET.IO] Sent ${notificationType} notification to user ${user._id.toString()}`);
            }
          } catch (notifErr) {
            console.error(`[SUBMISSION REVIEW] Error sending notification:`, notifErr);
            // Don't fail the entire request, but log the error
            console.warn(`[SUBMISSION REVIEW] Notification failed, but submission and user updates were saved`);
          }

          // ============================================
          // Send Email Notification to User
          // ============================================
          try {
            // Get project title for the email
            const project = await Project.findById(submission.project);
            const projectTitle = project ? project.title : 'the project';
            const userName = user.firstName || user.lastName || 'Freelancer';

            if (user && user.email) {
              let subject = '';
              let html = '';

              if (status === 'Approved') {
                subject = `Submission Approved: You've earned $${submission.paymentAmount.toFixed(2)}!`;
                html = `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h3>Hi ${userName},</h3>
                    <p>Great news! Your submission for the project <strong>"${projectTitle}"</strong> has been <strong>Approved</strong>.</p>
                    <p>You have earned <strong>$${submission.paymentAmount.toFixed(2)}</strong> for this task.</p>
                    <p>Your tier has been updated to <strong>${user.tier}</strong> with an approval rate of <strong>${user.approvalRate.toFixed(2)}%</strong>.</p>
                    <p>Keep up the great work!</p>
                    <br />
                    <p>- The Nexus AI Team</p>
                  </div>
                `;
              } else if (status === 'Rejected') {
                subject = `Submission Rejected for project: ${projectTitle}`;
                // Prioritize admin feedback, then AI feedback, then default message
                const feedbackMessage = submission.adminFeedback || submission.aiFeedback || 'No specific feedback provided. Please review the project guidelines and your submission.';
                html = `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h3>Hi ${userName},</h3>
                    <p>Your submission for the project <strong>"${projectTitle}"</strong> has been <strong>Rejected</strong>.</p>
                    <p><strong>Feedback:</strong> ${feedbackMessage}</p>
                    <p>Please review the project guidelines and your submission. If the project is repeatable, you can try again.</p>
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
                  console.error('Failed to send submission review email:', emailError);
                });
              }
            }
          } catch (emailError) {
            // Log the email error, but don't fail the main API request
            console.error('Failed to send submission review email:', emailError);
          }
        }
      } catch (metricsErr) {
        console.error(`[SUBMISSION REVIEW] Error in user metrics update block:`, metricsErr);
        console.error(`[SUBMISSION REVIEW] Metrics error details:`, {
          message: metricsErr.message,
          name: metricsErr.name,
          stack: metricsErr.stack
        });
        // Don't fail the entire request, but log the error
        console.warn(`[SUBMISSION REVIEW] User metrics update failed, but submission status was saved`);
      }
    }

    // Reload submission to get latest data
    const updatedSubmission = await Submission.findById(submissionId);
    
    res.json({ 
      msg: `Submission marked as ${status}`, 
      submission: updatedSubmission 
    });
    
    console.log(`[SUBMISSION REVIEW] Successfully completed review for submission ${submissionId}`);
  } catch (err) {
    console.error('[SUBMISSION REVIEW] CRITICAL ERROR:', err.message);
    console.error('[SUBMISSION REVIEW] Error name:', err.name);
    console.error('[SUBMISSION REVIEW] Error stack:', err.stack);
    console.error('[SUBMISSION REVIEW] Full error object:', err);
    
    // Return detailed error information to help with debugging
    res.status(500).json({ 
      msg: 'Server Error updating submission.',
      error: err.message,
      errorType: err.name,
      // Only include stack in development
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
});

// @route   PUT /api/projects/submissions/bulk-review
// @desc    Bulk update submission statuses (Admin only)
// @access  Admin
router.put('/submissions/bulk-review', protect, admin, async (req, res) => {
  try {
    const { submissionIds, status, adminFeedback } = req.body; // Add adminFeedback

    // Validate input
    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return res.status(400).json({ msg: 'submissionIds must be a non-empty array' });
    }

    if (!status || (status !== 'Approved' && status !== 'Rejected')) {
      return res.status(400).json({ msg: 'status must be either "Approved" or "Rejected"' });
    }

    // Validate all IDs are valid ObjectIds
    const validIds = submissionIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== submissionIds.length) {
      return res.status(400).json({ msg: 'One or more submission IDs are invalid' });
    }

    let processedCount = 0;
    let failedCount = 0;
    const errors = [];

    // Process each submission
    for (const submissionId of validIds) {
      try {
        // Find submission
        const submission = await Submission.findById(submissionId);
        if (!submission) {
          failedCount++;
          errors.push({ submissionId, error: 'Submission not found' });
          continue;
        }

        // Skip if already in the target status
        if (submission.status === status) {
          processedCount++;
          continue;
        }

        // Store original status for audit logging
        const originalSubmissionStatus = submission.status;

        // Update submission status
        submission.status = status;
        
        // Save admin feedback if provided
        if (adminFeedback !== undefined) {
          submission.adminFeedback = adminFeedback;
        }
        
        // Log who reviewed it and when (for manual reviews: Approved/Rejected)
        submission.reviewedBy = req.user.id;
        submission.reviewTimestamp = new Date();
        
        await submission.save();

        // Update user metrics and tier (only for Approved/Rejected)
        const user = await User.findById(submission.user);
        if (user) {
          // Increment total submissions count
          user.totalSubmissionsCount = (user.totalSubmissionsCount || 0) + 1;

          // If approved, increment approved submissions count
          if (status === 'Approved') {
            user.approvedSubmissionsCount = (user.approvedSubmissionsCount || 0) + 1;
          }

          // Calculate approval rate (handle division by zero)
          if (user.totalSubmissionsCount > 0) {
            user.approvalRate = (user.approvedSubmissionsCount / user.totalSubmissionsCount) * 100;
          } else {
            user.approvalRate = 0;
          }

          // Update tier based on approval rate
          const updateTier = (rate) => {
            if (rate >= 95) return 'Elite';
            if (rate >= 85) return 'Gold';
            if (rate >= 70) return 'Silver';
            return 'Bronze';
          };

          user.tier = updateTier(user.approvalRate);

          // Save the updated user
          await user.save();

          // Log admin action to audit log
          const actionType = status === 'Approved' ? 'SUBMISSION_APPROVED' : 'SUBMISSION_REJECTED';

          await logAdminAction(
            req.user.id,
            actionType,
            'Submission',
            submission._id,
            {
              oldStatus: originalSubmissionStatus,
              newStatus: status,
              userTierUpdatedTo: user.tier,
              userApprovalRate: user.approvalRate.toFixed(2),
              userId: user._id.toString(),
              bulkOperation: true,
            }
          );

          // ============================================
          // Send Real-Time Notification to User (Bulk Review)
          // ============================================
          try {
            const io = getIO();
            if (!io) {
              console.warn(`[BULK REVIEW] Socket.io not initialized, skipping notification for user ${user._id}`);
            } else {
              const notificationType = status === 'Approved' ? 'SUBMISSION_APPROVED' : 'SUBMISSION_REJECTED';
              const notificationMessage = status === 'Approved' 
                ? `🎉 Great news! Your submission has been approved. You've earned $${submission.paymentAmount.toFixed(2)}. Your tier: ${user.tier}.`
                : `Your submission has been reviewed and requires revision. Please review the feedback and resubmit.`;

              io.to(`user-${user._id.toString()}`).emit('notification', {
                type: notificationType,
                message: notificationMessage,
                submissionId: submission._id.toString(),
                status: status,
                tier: user.tier,
                approvalRate: user.approvalRate.toFixed(2),
                timestamp: new Date().toISOString(),
              });

              console.log(`[SOCKET.IO] [BULK] Sent ${notificationType} notification to user ${user._id.toString()}`);
            }
          } catch (notifErr) {
            console.error(`[BULK REVIEW] Error sending notification:`, notifErr);
            // Don't fail the entire request, but log the error
            console.warn(`[BULK REVIEW] Notification failed, but submission and user updates were saved`);
          }

          // ============================================
          // Send Email Notification to User (Bulk Review)
          // ============================================
          try {
            // Get project title for the email
            const project = await Project.findById(submission.project);
            const projectTitle = project ? project.title : 'the project';
            const userName = user.firstName || user.lastName || 'Freelancer';

            if (user && user.email) {
              let subject = '';
              let html = '';

              if (status === 'Approved') {
                subject = `Submission Approved: You've earned $${submission.paymentAmount.toFixed(2)}!`;
                html = `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h3>Hi ${userName},</h3>
                    <p>Great news! Your submission for the project <strong>"${projectTitle}"</strong> has been <strong>Approved</strong>.</p>
                    <p>You have earned <strong>$${submission.paymentAmount.toFixed(2)}</strong> for this task.</p>
                    <p>Your tier has been updated to <strong>${user.tier}</strong> with an approval rate of <strong>${user.approvalRate.toFixed(2)}%</strong>.</p>
                    <p>Keep up the great work!</p>
                    <br />
                    <p>- The Nexus AI Team</p>
                  </div>
                `;
              } else if (status === 'Rejected') {
                subject = `Submission Rejected for project: ${projectTitle}`;
                // Prioritize admin feedback, then AI feedback, then default message
                const feedbackMessage = submission.adminFeedback || submission.aiFeedback || 'No specific feedback provided. Please review the project guidelines and your submission.';
                html = `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h3>Hi ${userName},</h3>
                    <p>Your submission for the project <strong>"${projectTitle}"</strong> has been <strong>Rejected</strong>.</p>
                    <p><strong>Feedback:</strong> ${feedbackMessage}</p>
                    <p>Please review the project guidelines and your submission. If the project is repeatable, you can try again.</p>
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
                  console.error(`[BULK REVIEW] Failed to send submission review email to ${user.email}:`, emailError);
                });
              }
            }
          } catch (emailError) {
            // Log the email error, but don't fail the main API request
            console.error(`[BULK REVIEW] Failed to send submission review email:`, emailError);
          }
        }

        processedCount++;
      } catch (err) {
        failedCount++;
        errors.push({
          submissionId,
          error: err.message || 'Unknown error processing submission'
        });
        console.error(`[BULK REVIEW ERROR] Failed to process submission ${submissionId}:`, err.message);
      }
    }

    // Return response with processing results
    res.json({
      msg: `Bulk review completed: ${processedCount} processed, ${failedCount} failed`,
      processedCount,
      failedCount,
      totalRequested: submissionIds.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('SERVER ERROR IN BULK SUBMISSION REVIEW:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ msg: 'Server Error during bulk submission review.' });
  }
});


// @route   GET /api/projects/stats (Admin Stats)
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const availableCount = await Project.countDocuments({ status: 'Available' });
    const inProgressCount = await Project.countDocuments({ status: 'In Progress' });
    const completedCount = await Project.countDocuments({ status: 'Completed' });
    const pendingSubmissionsCount = await Submission.countDocuments({ status: 'Pending' }); 
    const approvedSubmissions = await Submission.find({ status: 'Approved' }).populate('project', 'payRate');

    const totalEarnings = approvedSubmissions.reduce((acc, sub) => {
        return acc + (sub.project ? (sub.project.payRate || 0) : 0);
    }, 0); 

    res.json({
      available: availableCount,
      inProgress: inProgressCount,
      completed: completedCount,
      totalSubmissions: pendingSubmissionsCount,
      totalEarnings: totalEarnings.toFixed(2)
    });
  } catch (err) {
    console.error('SERVER ERROR DURING STATS FETCH:', err.message);
    res.status(500).send({ msg: 'Server Error during stats fetch.' });
  }
});

// @route   GET /api/projects/submissions/approved
// @desc    Get all 'Approved' submissions (for WalletPage)
router.get('/submissions/approved', protect, async (req, res) => {
  try {
    // Guard clause for req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'User authentication required.' });
    }
    
    const approvedSubmissions = await Submission.find({ 
      user: req.user.id, 
      status: 'Approved' 
    });
    res.json(approvedSubmissions);
  } catch (err) {
    console.error('Error fetching approved submissions:', err.message);
    res.status(500).send('Server Error');
  }
});
// --- ⬇️⬇️ الكود الجديد اللي ناقصك (لصفحة الأدمن) ⬇️⬇️ ---

// @route   GET /api/projects/submissions/pending
// @desc    Get all 'Pending' submissions (For Admin Review)
// @access  Admin
router.get('/submissions/pending', protect, admin, async (req, res) => {
  try {
    // هنجيب كل التاسكات اللي حالتها "Pending"
    // وهنعمل .populate() عشان نجيب بيانات اليوزر والمشروع معاها
    const pendingSubmissions = await Submission.find({ status: 'Pending' })
      .populate('user', 'username email') // 'username email' (من موديل اليوزر)
      .populate('project', 'title payRate'); // 'title payRate' (من موديل المشروع)

    if (!pendingSubmissions || pendingSubmissions.length === 0) {
      return res.json([]); // رجع أراي فاضية لو مفيش
    }

    res.json(pendingSubmissions);

  } catch (err) {
    console.error('ADMIN FETCH PENDING SUBMISSIONS ERROR:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/projects/submissions/all
// @desc    Get all submissions (for admin global feed)
// @access  Admin
router.get('/submissions/all', protect, admin, async (req, res) => {
  try {
    const submissions = await Submission.find({})
      .sort({ createdAt: -1 }) // Show newest submissions first
      .limit(50) // Limit to the last 50 activities to keep it fast
      .populate('user', 'email firstName lastName') // Get the freelancer's email and name
      .populate('reviewedBy', 'email firstName lastName') // Get the admin's email and name
      .populate('project', 'title'); // Get the project title

    res.json(submissions);
  } catch (err) {
    console.error('ADMIN FETCH ALL SUBMISSIONS ERROR:', err.message);
    res.status(500).send('Server Error');
  }
});

// --- ⬆️⬆️ نهاية الكود الجديد ⬆️⬆️ ---

// @route   GET /api/projects/admin/review-score/:submissionId
// @desc    Get AI quality check score and feedback for a submission (Admin only)
// @access  Private/Admin
router.get('/admin/review-score/:submissionId', protect, admin, async (req, res) => {
  try {
    const submissionId = req.params.submissionId;

    // Find the submission
    const submission = await Submission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ msg: 'Submission not found' });
    }

    // Simulate AI Score: Generate random score between 70 and 100
    const aiScore = Math.floor(Math.random() * 31) + 70; // 70-100 inclusive

    // Simulate AI Feedback based on score
    let aiFeedback;
    if (aiScore >= 95) {
      aiFeedback = 'Exceptional quality. Outstanding clarity, precision, and attention to detail.';
    } else if (aiScore >= 90) {
      aiFeedback = 'Excellent clarity and accuracy. Minor enhancements could elevate this further.';
    } else if (aiScore >= 85) {
      aiFeedback = 'Strong submission with good structure. Some areas could benefit from additional detail.';
    } else if (aiScore >= 80) {
      aiFeedback = 'Good overall quality. Requires minor linguistic review and refinement.';
    } else {
      aiFeedback = 'Acceptable quality. Needs improvement in clarity and completeness.';
    }

    res.json({
      aiScore,
      aiFeedback,
    });
  } catch (err) {
    console.error('Error generating AI review score:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;