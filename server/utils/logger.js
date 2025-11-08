const AuditLog = require('../models/AuditLog.model');

/**
 * Log an administrative action to the AuditLog collection
 * @param {String} adminId - The ID of the admin user who performed the action
 * @param {String} actionType - Type of action (e.g., 'PROJECT_UPDATED', 'SUBMISSION_APPROVED')
 * @param {String} resourceType - Type of resource affected (e.g., 'Project', 'Submission', 'User')
 * @param {String} resourceId - The ID of the affected resource
 * @param {Object} details - Optional additional context/details about the action
 * @returns {Promise<void>}
 */
const logAdminAction = async (adminId, actionType, resourceType, resourceId, details = {}) => {
  try {
    // Validate required parameters
    if (!adminId || !actionType || !resourceType || !resourceId) {
      console.error('[AUDIT LOG ERROR] Missing required parameters:', {
        hasAdminId: !!adminId,
        hasActionType: !!actionType,
        hasResourceType: !!resourceType,
        hasResourceId: !!resourceId
      });
      throw new Error('Missing required parameters for audit log');
    }

    console.log(`[AUDIT LOG] Attempting to log: ${actionType} on ${resourceType} ${resourceId} by admin ${adminId}`);

    const auditLog = await AuditLog.create({
      user: adminId,
      actionType,
      resourceType,
      resourceId,
      details,
    });
    
    console.log(`[AUDIT LOG] Successfully logged ${actionType} on ${resourceType} ${resourceId} by admin ${adminId} (Log ID: ${auditLog._id})`);
    return auditLog;
  } catch (err) {
    // Log the error but don't throw - logging failures shouldn't break the main application flow
    console.error('[AUDIT LOG ERROR] Failed to log admin action:', err.message);
    console.error('[AUDIT LOG ERROR] Error name:', err.name);
    console.error('[AUDIT LOG ERROR] Error stack:', err.stack);
    console.error('[AUDIT LOG ERROR] Action details:', { adminId, actionType, resourceType, resourceId, details });
    
    // Re-throw validation errors so they can be handled upstream
    if (err.message.includes('Missing required parameters')) {
      throw err;
    }
    
    // For other errors, just log and continue
    return null;
  }
};

module.exports = { logAdminAction };

