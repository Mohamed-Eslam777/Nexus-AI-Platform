const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Project',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  paymentAmount: {
    type: Number,
    required: true,
    default: 0
  },
  timeSpentMinutes: {
    type: Number,
    default: null // (هيبقى مطلوب بس لو المشروع HOURLY)
  },
  // ⬅️ الحقل الذي يحتوي على المحتوى المقدم من المستخدم
  content: { 
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Requested', 'Completed'],
    default: 'Pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // This will link to the Admin User model
    default: null
  },
  reviewTimestamp: {
    type: Date, // The exact time the admin clicked 'Approve/Reject'
    default: null
  },
  aiScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  consistencyWarning: {
    type: Boolean,
    default: false,
  },
  aiFeedback: {
    type: String,
  },
  adminFeedback: {
    type: String,
    trim: true,
  },
  scheduledApprovalDate: {
    type: Date,
    default: null, // Should only be set if AI Score is high (e.g., >= 90) but requires manual review
  },
  // Task locking fields for concurrency control
  isLocked: {
    type: Boolean,
    default: false,
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // AI Triage Status - Initial status assigned by AI quality check
  triageStatus: {
    type: String,
    enum: ['APPROVED', 'REJECTED', 'PENDING'],
    default: 'PENDING',
  },
}, {
  timestamps: true,
});

// Indexes for improved query performance
SubmissionSchema.index({ user: 1 }); // Critical for User Analytics & Dashboard filtering
SubmissionSchema.index({ project: 1 }); // Critical for Project Analytics
SubmissionSchema.index({ status: 1 }); // Critical for all Analytics & Filtering
// Compound indexes for common query patterns
SubmissionSchema.index({ user: 1, status: 1 }); // For user analytics with status filtering
SubmissionSchema.index({ project: 1, status: 1 }); // For project analytics with status filtering

module.exports = mongoose.model('Submission', SubmissionSchema);



