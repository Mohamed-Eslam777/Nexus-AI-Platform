const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const QualificationSubmissionSchema = new Schema({
  test: { // The test being submitted
    type: Schema.Types.ObjectId,
    ref: 'QualificationTest',
    required: true,
    index: true
  },
  user: { // The user who submitted
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  submissionContent: { // The user's answer/work for the test
    type: String, // Or could be an array if multiple parts
    required: true
  },
  status: { // The admin's review status
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
    index: true
  },
  adminFeedback: { // Optional feedback from the admin on rejection
    type: String,
    trim: true
  }
}, { timestamps: true });

// Compound index to prevent a user from submitting the same test twice (if needed, remove if re-takes are allowed)
QualificationSubmissionSchema.index({ test: 1, user: 1 }, { unique: true });

const QualificationSubmission = mongoose.model('QualificationSubmission', QualificationSubmissionSchema);
module.exports = QualificationSubmission;

