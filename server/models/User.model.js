const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // ------------------------------------
  // --- ⬇️⬇️ الحقول الجديدة المطلوبة ⬇️⬇️ ---
  // ------------------------------------
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  linkedInURL: { 
    type: String,
    trim: true,
    default: '',
  },
  // ------------------------------------
  // --- ⬆️⬆️ نهاية الحقول الجديدة ⬆️⬆️ ---
  // ------------------------------------
  
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true, // يفضل إضافتها لـ username
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Applicant', 'Freelancer', 'Admin'],
    default: 'Applicant'
  },
  status: {
    type: String,
    enum: ['New', 'Pending', 'Accepted', 'Rejected'],
    default: 'New'
  },
  
  // --- (Gamification & Performance Metrics) ---
  tier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Elite'],
    default: 'Bronze',
  },
  approvedSubmissionsCount: {
    type: Number,
    default: 0,
  },
  totalSubmissionsCount: {
    type: Number,
    default: 0,
  },
  // Calculated based on (approved / total) * 100, but stored for quick reference
  approvalRate: { 
    type: Number, 
    default: 0, 
  },
  
  // --- (Skill Domain) ---
  skillDomain: {
    type: String,
    enum: ['Programming', 'Business', 'Law', 'Health', 'General'],
    default: null
  },
  
  // --- (Notifications) ---
  notifications: [
    {
      message: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['success', 'error', 'info', 'warning'],
        default: 'info',
      },
      link: {
        type: String,
        default: null,
      },
      isRead: {
        type: Boolean,
        default: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  
  // --- (بيانات التقديم والاختبار) ---
  bio: {
    type: String,
    default: ''
  },
  testAnswer: {
    type: String,
    default: ''
  },
  aiScore: {
    type: Number,
    default: 0
  },
  applicationDate: {
    type: Date
  },
  
  // --- (بيانات الدفع للفريلانسر) ---
  paymentMethod: {
    type: String,
    enum: ['Not Set', 'PayPal', 'Vodafone Cash', 'Bank Transfer'],
    default: 'Not Set'
  },
  paymentIdentifier: {
    type: String,
    trim: true,
    default: ''
  },

  // --- (Password Reset) ---
  resetToken: {
    type: String,
    default: null,
  },
  resetTokenExpiry: {
    type: Date,
    default: null,
  },

}, {
  timestamps: true
});

// Indexes for improved query performance
UserSchema.index({ status: 1 }); // Used for 'totalApplicants' count
UserSchema.index({ role: 1 }); // Used for filtering by role
// Compound index for applicant queries (most common: role: 'Applicant', status: 'Pending')
UserSchema.index({ role: 1, status: 1 }); // Critical for efficient applicant queries

module.exports = mongoose.model('User', UserSchema);