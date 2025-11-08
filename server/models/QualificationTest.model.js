const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const QualificationTestSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  projectDomain: { // Must match the domains in Project.model.js (e.g., 'Programming', 'Health', 'General')
    type: String,
    required: true,
    enum: ['Programming', 'Business', 'Law', 'Health', 'General'],
    index: true
  },
  description: {
    type: String,
    required: true
  },
  tasks: [{ // The array of tasks/questions for this test
    content: { type: String, required: true },
    imageUrl: { type: String, required: false }
  }],
  status: { // 'Active' tests are shown to users, 'Draft' are hidden
    type: String,
    enum: ['Active', 'Draft'],
    default: 'Active',
    index: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const QualificationTest = mongoose.model('QualificationTest', QualificationTestSchema);
module.exports = QualificationTest;

