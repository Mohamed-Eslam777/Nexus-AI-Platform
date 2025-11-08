// server/utils/auditLog.js
const AuditLog = require('../models/AuditLog.model');

/**
 * Create an audit log entry for administrative actions
 * @param {String} userId - The ID of the admin user who performed the action
 * @param {String} actionType - Type of action (e.g., 'PROJECT_UPDATED', 'SUBMISSION_APPROVED')
 * @param {Object} details - Object containing additional details. Should include:
 *   - resourceType: Type of resource affected (e.g., 'Project', 'Submission', 'User')
 *   - resourceId: The ID of the affected resource
 *   - Any other relevant details about the change
 */
const createAuditLogEntry = async (userId, actionType, details) => {
  try {
    // Extract resourceType and resourceId from details, with defaults for project updates
    const resourceType = details.resourceType || 'Project';
    const resourceId = details.resourceId || details.projectId || null;
    
    // Validate required fields
    if (!resourceId) {
      console.error('Audit Log failed: resourceId is required but not provided in details');
      return;
    }

    await AuditLog.create({ 
      user: userId, 
      actionType: actionType, 
      resourceType: resourceType,
      resourceId: resourceId,
      details: details, 
      // timestamp is automatically added by the model's timestamps: true option
    });
    
    console.log(`[AUDIT LOG] Successfully logged ${actionType} on ${resourceType} ${resourceId} by user ${userId}`);
  } catch (error) {
    console.error('Audit Log failed to save:', error);
    // Do not block the main operation, but log the failure.
  }
};

module.exports = { createAuditLogEntry };

