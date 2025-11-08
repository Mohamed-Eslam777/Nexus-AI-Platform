const User = require('../models/User.model');
const Submission = require('../models/Submission.model');
const PayoutRequest = require('../models/PayoutRequest.model');
const Project = require('../models/Project.model');
const mongoose = require('mongoose');

/**
 * @route   DELETE /api/users/admin/clean-db
 * @desc    Delete all non-admin users and their related data (Admin only - for testing/cleanup)
 * @access  Private/Admin
 */
const cleanDatabase = async (req, res) => {
  try {
    // Define the deletion condition: Target users where role is NOT 'Admin'
    // Using $ne (Not Equal) operator to explicitly exclude Admin users
    const deleteCondition = { role: { $ne: 'Admin' } };

    // Step 1: Find all non-admin users to get their IDs for cascading deletes
    const nonAdminUsers = await User.find(deleteCondition).select('_id');
    const nonAdminUserIds = nonAdminUsers.map(user => user._id);

    console.log(`[DATABASE CLEANUP] Found ${nonAdminUserIds.length} non-admin users to delete.`);

    // Step 2: Delete associated data first (submissions and payout requests)
    // This ensures referential integrity and prevents orphaned records
    let submissionsResult = { deletedCount: 0 };
    let payoutsResult = { deletedCount: 0 };
    
    if (nonAdminUserIds.length > 0) {
      // Delete all submissions where user is in the non-admin user list
      submissionsResult = await Submission.deleteMany({ 
        user: { $in: nonAdminUserIds } 
      });
      
      // Delete all payout requests where user is in the non-admin user list
      payoutsResult = await PayoutRequest.deleteMany({ 
        user: { $in: nonAdminUserIds } 
      });

      console.log(`[DATABASE CLEANUP] Deleted ${submissionsResult.deletedCount} related submissions.`);
      console.log(`[DATABASE CLEANUP] Deleted ${payoutsResult.deletedCount} related payout requests.`);
    } else {
      console.log(`[DATABASE CLEANUP] No non-admin users found. Skipping related data deletion.`);
    }

    // Step 3: Delete all non-admin users using the explicit condition
    // This ensures only users with role !== 'Admin' are deleted
    const usersResult = await User.deleteMany(deleteCondition);

    const deletedUsersCount = usersResult.deletedCount;
    const deletedSubmissionsCount = submissionsResult.deletedCount;
    const deletedPayoutsCount = payoutsResult.deletedCount;

    console.log(`[DATABASE CLEANUP] Successfully deleted ${deletedUsersCount} non-admin users.`);
    console.log(`[DATABASE CLEANUP] Total cleanup: ${deletedUsersCount} users, ${deletedSubmissionsCount} submissions, ${deletedPayoutsCount} payouts.`);

    res.json({
      msg: 'Database cleanup completed successfully.',
      deletedUsersCount,
      deletedSubmissionsCount,
      deletedPayoutsCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[DATABASE CLEANUP ERROR]', err.message);
    console.error('Full error:', err);
    res.status(500).json({ 
      msg: 'Server Error during database cleanup.',
      error: err.message 
    });
  }
};

/**
 * @route   POST /api/users/tasks/:taskId/start
 * @desc    Start a task by locking it (prevents multiple users from working on the same task)
 * @access  Private
 */
const startTask = async (req, res) => {
  try {
    const taskId = req.params.taskId || req.params.id || req.body.taskId;
    const userId = req.user.id;

    // Validate taskId format
    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ msg: 'Invalid task ID format.' });
    }

    // Validate user authentication
    if (!userId) {
      return res.status(401).json({ msg: 'User authentication required.' });
    }

    // Atomic Update: Find and Lock
    // Only lock if the task is NOT currently locked (isLocked: false)
    // Use findOneAndUpdate with query conditions to ensure atomicity
    const lockedTask = await Submission.findOneAndUpdate(
      { 
        _id: taskId,
        isLocked: false  // Only match if not already locked
      },
      { 
        $set: { 
          isLocked: true,
          lockedBy: userId
        }
      },
      { 
        new: true,  // Return the updated document
        runValidators: true
      }
    );

    // Check if lock was successful
    if (!lockedTask) {
      // Task was already locked or doesn't exist
      const existingTask = await Submission.findById(taskId);
      
      if (!existingTask) {
        return res.status(404).json({ msg: 'Task not found.' });
      }
      
      if (existingTask.isLocked && existingTask.lockedBy) {
        return res.status(409).json({ 
          msg: 'Task is currently unavailable or locked by another user.' 
        });
      }
      
      // Fallback error
      return res.status(409).json({ 
        msg: 'Task is currently unavailable or locked by another user.' 
      });
    }

    // Lock successful
    res.status(200).json({
      msg: 'Task locked successfully. You can now work on this task.',
      task: lockedTask
    });

  } catch (err) {
    console.error('Error starting task:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ 
      msg: 'Server Error while starting task.',
      error: err.message 
    });
  }
};

/**
 * @route   POST /api/users/tasks/:taskId/submit
 * @desc    Submit a completed task and unlock it
 * @access  Private
 * Note: This is a helper function. The main submit logic is in project.routes.js
 * This function handles the unlocking part specifically.
 */
const submitTask = async (req, res) => {
  try {
    const taskId = req.params.taskId || req.params.id || req.body.taskId;
    const userId = req.user.id;

    // Validate taskId format
    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ msg: 'Invalid task ID format.' });
    }

    // Validate user authentication
    if (!userId) {
      return res.status(401).json({ msg: 'User authentication required.' });
    }

    // Unlock the task: Only unlock if locked by this user
    // Use findOneAndUpdate with query conditions to ensure atomicity
    const unlockedTask = await Submission.findOneAndUpdate(
      {
        _id: taskId,
        lockedBy: userId  // Ensure only the user who locked it can unlock it
      },
      {
        $set: {
          isLocked: false,
          lockedBy: null
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!unlockedTask) {
      // Task was not locked by this user or doesn't exist
      const existingTask = await Submission.findById(taskId);
      
      if (!existingTask) {
        return res.status(404).json({ msg: 'Task not found.' });
      }
      
      if (existingTask.lockedBy && existingTask.lockedBy.toString() !== userId) {
        console.error(`[TASK UNLOCK ERROR] User ${userId} attempted to unlock task ${taskId} locked by ${existingTask.lockedBy}`);
        return res.status(403).json({ 
          msg: 'You are not authorized to unlock this task. Only the user who locked it can unlock it.' 
        });
      }
      
      // Task might already be unlocked
      console.warn(`[TASK UNLOCK WARNING] Task ${taskId} was already unlocked or lock mismatch`);
    }

    // Unlock successful (or already unlocked)
    res.status(200).json({
      msg: 'Task unlocked successfully.',
      task: unlockedTask || await Submission.findById(taskId)
    });

  } catch (err) {
    console.error('Error submitting task:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ 
      msg: 'Server Error while submitting task.',
      error: err.message 
    });
  }
};

module.exports = {
  cleanDatabase,
  startTask,
  submitTask,
};

