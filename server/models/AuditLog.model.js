const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  // User who performed the action (Admin's ID)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Action type describing what was performed
  actionType: {
    type: String,
    required: true,
    // Examples: 'SUBMISSION_APPROVED', 'USER_TIER_UPDATED', 'PAYOUT_PROCESSED'
  },
  
  // Type of document that was affected
  resourceType: {
    type: String,
    required: true,
    // Examples: 'Submission', 'User', 'Project'
  },
  
  // ID of the affected document
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  
  // Optional field for extra context (e.g., old status, new status, metadata)
  details: {
    type: Object,
    default: {},
  },
  
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);

