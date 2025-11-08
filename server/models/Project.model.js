const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  detailedInstructions: {
    type: String,
    default: null,
  },
  payRate: {
    type: Number,
    required: true,
  },
  paymentType: {
    type: String,
    enum: ['PER_TASK', 'HOURLY'],
    required: true,
    default: 'PER_TASK', // (هنعتبر إن كل المشاريع القديمة كانت بالتاسك)
  },
  projectDomain: {
    type: String,
    enum: ['Programming', 'Business', 'Law', 'Health', 'General'],
    required: true,
    default: 'General' // (هنعتبر إن أي مشروع مش متحدد مجاله هو "عام")
  },
  // ⬅️ الحقل الذي يحتوي على التصنيف (Enum)
  taskType: { 
    type: String, 
    required: true,
    default: 'Chat_Sentiment',
    enum: ['Chat_Sentiment', 'Code_Evaluation', 'Text_Classification', 'Image_Annotation', 'Model_Comparison'] 
  },
  taskContent: { 
    type: String, 
    required: false,
    default: "User: This is a test chat. AI: I understand."
  },
  status: {
    type: String,
    required: true,
    default: 'Available',
    enum: ['Available', 'In Progress', 'Completed'],
  },

  // Boolean field to control if a task can be submitted multiple times by the same user
  isRepeatable: {
    type: Boolean,
    default: true, // Default to true (repeatable) unless specified otherwise
    required: true
  },
  // Total maximum submissions allowed for this project (aggregate cap across all users)
  maxTotalSubmissions: {
    type: Number,
    required: false, // Optional: Admin can leave it blank for no limit
    default: null, // No limit by default
    min: 1
  },
// Task Pool: Array of distinct tasks (Image URL + Prompt) for dynamic assignment
taskPool: [
  {
    content: { // The prompt text or primary data
      type: String,
      required: true,
    },
    imageUrl: { // For Image Annotation/Model Comparison tasks
      type: String,
      default: null,
    },
    isAssigned: { // Flag to prevent multiple users from doing the same task simultaneously
      type: Boolean,
      default: false,
    },
  },
],
// ... باقي الحقول
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true,
});

// Indexes for improved query performance
ProjectSchema.index({ status: 1 }); // Used in Dashboard filter
ProjectSchema.index({ projectDomain: 1 }); // Used in Dashboard domain filter
// Compound index for common query pattern (domain + status filtering)
ProjectSchema.index({ projectDomain: 1, status: 1 });

module.exports = mongoose.model('Project', ProjectSchema);


