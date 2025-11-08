const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth.middleware');

// الموديلز
const Submission = require('../models/Submission.model');
const PayoutRequest = require('../models/PayoutRequest.model');
const User = require('../models/User.model');
const { getIO } = require('../socket'); // Import Socket.io getter function
const sendEmail = require('../utils/emailService.js');

// ===============================================
// --- (أولاً) راوتات الفريلانسر (سليمة) ---
// ===============================================

// --- 1. راوت جلب "الرصيد المعلق" (Pending Review) ---
router.get('/pending-review-balance', protect, async (req, res) => {
  try {
    const pendingSubmissions = await Submission.find({ 
      user: req.user.id, 
      status: 'Pending' 
    });
    const totalPendingAmount = pendingSubmissions.reduce((acc, sub) => {
        return acc + (Number(sub.paymentAmount) || 0);
    }, 0);
    res.json({ totalPendingAmount });
  } catch (err) {
    console.error('Error fetching pending review balance:', err.message);
    res.status(500).send('Server Error');
  }
});

// --- 2. راوت جلب "الرصيد المتاح للسحب" (Available Balance) ---
router.get('/available-balance', protect, async (req, res) => {
  try {
    const approvedSubmissions = await Submission.find({ 
      user: req.user.id, 
      status: 'Approved' 
    });
    const totalApprovedAmount = approvedSubmissions.reduce((acc, sub) => {
        return acc + (Number(sub.paymentAmount) || 0);
    }, 0);
    res.json({ totalApprovedAmount });
  } catch (err) {
    console.error('Error fetching approved submissions:', err.message);
    res.status(500).send('Server Error');
  }
});

// --- 3. راوت جلب "طلبات السحب المعلقة" (بتاعة الفريلانسر نفسه) ---
router.get('/pending-requests', protect, async (req, res) => {
  try {
    const pendingPayouts = await PayoutRequest.find({
      user: req.user.id,
      status: 'Pending'
    });
    res.json(pendingPayouts); 
  } catch (err) {
    console.error('Error fetching pending payout requests:', err.message);
    res.status(500).send('Server Error');
  }
});

// --- 4. راوت "إنشاء طلب سحب جديد" (بتاع الفريلانسر) ---
router.post('/request-payout', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const availableSubmissions = await Submission.find({
      user: userId,
      status: 'Approved'
    });
    const amountToPayout = availableSubmissions.reduce((acc, sub) => {
      return acc + (Number(sub.paymentAmount) || 0);
    }, 0);
    if (amountToPayout <= 0) {
      return res.status(400).json({ msg: 'You have no available funds to withdraw' });
    }
    const newPayoutRequest = new PayoutRequest({
      user: userId,
      amount: amountToPayout,
      status: 'Pending'
    });
    await newPayoutRequest.save();
    const submissionIds = availableSubmissions.map(sub => sub._id);
    await Submission.updateMany(
      { _id: { $in: submissionIds } },
      { $set: { status: 'Requested' } } 
    );
    res.status(201).json({ msg: 'Payout request submitted successfully!', request: newPayoutRequest });
  } catch (err) {
    console.error('Error creating payout request:', err.message);
    res.status(500).send('Server Error');
  }
});


// ===============================================
// --- (ثانياً) راوتات الأدمن (التعديل هنا) ---
// ===============================================

// --- 5. راوت "جلب كل طلبات السحب" (للأدمن) ---
router.get('/admin/pending-requests', protect, admin, async (req, res) => {
  console.log('--- [ADMIN] (PAYOUT) جاري جلب كل طلبات السحب ---');
  try {
    // ⬇️⬇️ --- (هنا التعديل) --- ⬇️⬇️
    // هنجيب بيانات الدفع مع بيانات اليوزر
    const allPendingPayouts = await PayoutRequest.find({ status: 'Pending' })
      .populate('user', 'username email paymentMethod paymentIdentifier'); // ⬅️ ضفنا الخانتين الجداد

    if (!allPendingPayouts) {
      return res.json([]);
    }
    res.json(allPendingPayouts);
  } catch (err) {
    console.error('ADMIN FETCH PENDING PAYOUTS ERROR:', err.message);
    res.status(500).send('Server Error');
  }
});


// --- 6. راوت "مراجعة طلب السحب" (للأدمن) ---
router.put('/admin/review/:id', protect, admin, async (req, res) => {
  console.log(`--- [ADMIN] (PAYOUT) مراجعة طلب ${req.params.id} ---`);
  try {
    const { status, adminFeedback } = req.body; 
    const requestId = req.params.id;
    if (status !== 'Completed' && status !== 'Rejected') {
      return res.status(400).json({ msg: 'Invalid status.' });
    }
    const payout = await PayoutRequest.findById(requestId).populate('user', 'email firstName lastName');
    if (!payout) {
      return res.status(404).json({ msg: 'Payout request not found.' });
    }
    
    const originalStatus = payout.status;
    payout.status = status;
    // Save adminFeedback if provided
    if (adminFeedback !== undefined) {
      payout.adminFeedback = adminFeedback;
    }
    await payout.save();

    // ============================================
    // Send Real-Time Notification to User (Payout Review)
    // ============================================
    // Only send notification if status is 'Completed' and only to the affected user (not the admin)
    try {
      const io = getIO();
      if (io) {
        if (status === 'Completed' && payout.user && payout.user._id) {
          const userId = payout.user._id.toString();
          const notificationMessage = `🎊 Congratulations! Your payout request of $${payout.amount.toFixed(2)} has been processed and completed. The funds should arrive in your account shortly.`;

          io.to(`user-${userId}`).emit('notification', {
            type: 'PAYOUT_COMPLETED',
            message: notificationMessage,
            payoutId: payout._id.toString(),
            amount: payout.amount,
            timestamp: new Date().toISOString(),
          });

          console.log(`[SOCKET.IO] Sent PAYOUT_COMPLETED notification to user ${userId}`);
        } else if (status === 'Rejected' && payout.user && payout.user._id) {
          // Optional: Send notification for rejected payouts as well
          const userId = payout.user._id.toString();
          const notificationMessage = `Your payout request of $${payout.amount.toFixed(2)} has been rejected. Please review your payment details and contact support if needed.`;

          io.to(`user-${userId}`).emit('notification', {
            type: 'PAYOUT_REJECTED',
            message: notificationMessage,
            payoutId: payout._id.toString(),
            amount: payout.amount,
            timestamp: new Date().toISOString(),
          });

          console.log(`[SOCKET.IO] Sent PAYOUT_REJECTED notification to user ${userId}`);
        }
      } else {
        console.warn(`[PAYOUT REVIEW] Socket.io not initialized, skipping notification`);
      }
    } catch (notifErr) {
      console.error(`[PAYOUT REVIEW] Error sending notification:`, notifErr);
      // Don't fail the entire request, but log the error
      console.warn(`[PAYOUT REVIEW] Notification failed, but payout status was updated`);
    }

    // ============================================
    // Send Email Notification to User (Payout Review)
    // ============================================
    try {
      // Use the already-fetched and updated payout (already populated with user data)
      if (payout && payout.user && payout.user.email) {
        let subject = '';
        let html = '';
        const amount = payout.amount.toFixed(2);
        const userName = payout.user.firstName || payout.user.lastName || 'Freelancer';

        if (payout.status === 'Completed') {
          subject = `Payout Processed: Your request for $${amount} has been approved!`;
          html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h3>Hi ${userName},</h3>
              <p>Great news! Your payout request for <strong>$${amount}</strong> has been <strong>Approved and Processed</strong>.</p>
              <p>The funds should arrive in your account shortly, depending on your payment method.</p>
              <p>Thank you for your hard work!</p>
              <br />
              <p>- The Nexus AI Team</p>
            </div>
          `;
        } else if (payout.status === 'Rejected') {
          subject = `Payout Request Rejected for $${amount}`;
          // Check if adminFeedback exists (may not be in the model yet, but handle gracefully)
          const adminReason = payout.adminFeedback || 'No reason provided.';
          html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h3>Hi ${userName},</h3>
              <p>Your payout request for <strong>$${amount}</strong> has been <strong>Rejected</strong>.</p>
              <p><strong>Admin Reason:</strong> ${adminReason}</p>
              <p>If you have questions, please contact support.</p>
              <br />
              <p>- The Nexus AI Team</p>
            </div>
          `;
        }

        // Send the email (non-blocking)
        if (subject) {
          sendEmail({
            email: payout.user.email,
            subject: subject,
            html: html
          }).catch(emailError => {
            // Log the email error, but don't fail the main API request
            console.error('Failed to send payout review email:', emailError);
          });
        }
      }
    } catch (emailError) {
      // Log the email error, but don't fail the main API request
      console.error('Failed to send payout review email:', emailError);
    }

    res.json({ msg: 'Payout status updated.', payout });
  } catch (err) {
    console.error('ADMIN REVIEW PAYOUT ERROR:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;