const mongoose = require('mongoose');

const PayoutRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  amount: { // المبلغ الذي طلبه الفريلانسر للسحب
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Rejected'],
    default: 'Pending',
  },
  adminFeedback: {
    type: String,
    trim: true,
  },
  // (اختياري) يمكن إضافة حقول لبيانات الدفع مثل PayPal email
  paymentDetails: {
    type: String,
    required: false,
  }
}, {
  timestamps: true, // يسجل تاريخ إنشاء الطلب وتاريخ تحديثه
});

// Indexes for improved query performance
PayoutRequestSchema.index({ status: 1 }); // Used for 'pendingPayouts' count
PayoutRequestSchema.index({ user: 1 }); // Useful for querying payouts by user

module.exports = mongoose.model('PayoutRequest', PayoutRequestSchema);