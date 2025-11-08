const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Submission = require('../models/Submission.model');
const { sendPasswordResetEmail } = require('../utils/emailSender');
const rateLimit = require('express-rate-limit');

// JWT Secret Key is now read from process.env.JWT_SECRET.

// ============================================
// Rate Limiting Configuration
// ============================================

// Limiter for Login & Password Reset (stricter: 10 requests per 15 minutes)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 requests per IP per 15 minutes
    message: { msg: 'Too many login attempts from this IP, please try again after 15 minutes.' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Limiter for Registration (less strict: 20 requests per hour)
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Max 20 accounts created per IP per 1 hour
    message: { msg: 'Too many accounts created from this IP, please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// @route   POST /api/auth/register
// @desc    Register user
router.post('/register', /* registerLimiter, */ async (req, res) => {
  try {
      // 1. جلب كل الحقول الجديدة والقديمة من الـ Body
      const { 
          firstName, lastName, email, password, 
          phoneNumber, address, dateOfBirth, 
          linkedInURL // هذا الحقل اختياري
      } = req.body;

      // 2. التحقق الأساسي من وجود كل الحقول الإجبارية
      if (!email || !password || !firstName || !lastName || !phoneNumber || !address || !dateOfBirth) {
          return res.status(400).json({ msg: 'Please enter all required fields.' });
      }

      // 3. التحقق من وجود المستخدم
      let user = await User.findOne({ email });
      if (user) {
          return res.status(400).json({ msg: 'User already exists.' });
      }

      // 4. تشفير كلمة المرور
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // 5. إنشاء المستخدم بالحقول الجديدة
      user = new User({
          firstName,
          lastName,
          phoneNumber,
          address,
          dateOfBirth,
          linkedInURL: linkedInURL || '', // إذا لم يتم إرساله، القيمة الافتراضية تكون فارغة
          
          // تعيين الـ username من الإيميل
          username: email.split('@')[0],
          
          email,
          password: hashedPassword,
          role: 'Applicant', 
          status: 'New', 
      });

      await user.save();

      // 6. إنشاء الـ Token وإرساله
      const payload = { user: { id: user.id, role: user.role } };
      jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: '1h' },
          (err, token) => {
              if (err) throw err;
              
              // --- ⭐️ التعديل الثاني (الأخير) ⭐️ ---
              // هنرجع نفس البيانات اللي بيرجعها اللوجن
              res.json({
                  token,
                  userStatus: user.status, // هيرجع 'New'
                  userRole: user.role,   // هيرجع 'Applicant'
              });
              // ---------------------------------
          }
      );

  } catch (err) {
      console.error('Registration Error:', err.message);
      res.status(500).send('Server Error');
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', /* authLimiter, */ async (req, res) => {
  try {
      const { email, password } = req.body;

      // 1. التحقق من وجود الحقول المطلوبة
      if (!email || !password) {
          return res.status(400).json({ msg: 'Please enter all required fields.' });
      }

      // 2. البحث عن المستخدم وإحضار كلمة المرور
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(400).json({ msg: 'Invalid credentials.' });
      }

      // 3. مطابقة كلمة المرور
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(400).json({ msg: 'Invalid credentials.' });
      }
      
      // 4. (التوجيه لصفحة Application Page)
      // إذا كان المستخدم جديداً ولم يكمل الطلب (New) أو تم رفضه (Rejected)، نمنعه من الدخول ونوجهه لصفحة التقديم.
      if (user.status === 'New' || user.status === 'Rejected') {
          // نستخدم 403 Forbidden لتمييز الخطأ في الفرونت إند عن خطأ البيانات (400)
          return res.status(403).json({ msg: 'Your profile requires action. Please complete your application.' });
      }


      // 5. إنشاء الـ Token
      const payload = { user: { id: user.id, role: user.role } };
      jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: '1h' },
          (err, token) => {
              if (err) throw err;
              
              // ⬇️⬇️ نرسل الـ Token مع حالة المستخدم والدور (Role) ⬇️⬇️
              res.json({
                  token,
                  userStatus: user.status, 
                  userRole: user.role, 
              });
          }
      );

  } catch (err) {
      console.error('Login/Auth Error:', err.message);
      res.status(500).send('Server Error');
  }
});      

// @route   GET /api/auth/profile
// @desc    Get user profile data + their stats
// @access  Private
router.get('/profile', protect, async (req, res) => {
  console.log('--- [1] (PROFILE) جاري جلب بيانات البروفايل ---');
  try {
    const userId = req.user.id;
    console.log(`[2] (PROFILE) جاري البحث عن اليوزر: ${userId}`);
    
    // 1. هنجيب بيانات اليوزر (من غير الباسورد)
    const user = await User.findById(userId).select('-password');
    if (!user) {
      console.log('[!!!] (PROFILE) خطأ: اليوزر ده مش موجود');
      return res.status(404).json({ msg: 'User not found' });
    }
    
    console.log(`[3] (PROFILE) اليوزر موجود. جاري عد التاسكات المقبولة (Approved)...`);

    // 2. هنعد التاسكات اللي الأدمن وافق عليها (Approved) لليوزر ده
    const approvedCount = await Submission.countDocuments({
      user: userId,
      status: { $in: ['Approved', 'Requested', 'Completed'] }
    });

    console.log(`[4] (PROFILE) تم العثور على ${approvedCount} تاسكات مقبولة.`);

    // 3. هنبعت الاتنين مع بعض للفرونت إند
    res.json({
      user: user,
      approvedSubmissions: approvedCount 
    });

  } catch (err) {
    console.error('--- [CRITICAL PROFILE ERROR] ---');
    console.error('--- الخطأ الكامل ---', err); 
    console.error('--- رسالة الخطأ ---', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user's password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
          return res.status(400).json({ msg: 'Please provide current and new passwords.' });
      }

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ msg: 'User not found.' });
      }

      // 1. التحقق من كلمة المرور الحالية
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
          return res.status(401).json({ msg: 'Incorrect current password.' });
      }

     // 2. تشفير كلمة المرور الجديدة
     const salt = await bcrypt.genSalt(10);
     const hashedPassword = await bcrypt.hash(newPassword, salt);
     
     // 3. تحديث كلمة المرور مباشرة في الداتابيز (لتجاوز مشكلة الـ username)
     await User.updateOne(
         { _id: userId },
         { $set: { password: hashedPassword } }
     );
     // 4. (تم تجاوز user.save() بنجاح)

      res.json({ msg: 'Password updated successfully.' });

  } catch (err) {
      console.error('Change password error:', err.message);
      res.status(500).send('Server Error');
  }
});

// @route   GET /api/auth/analytics
// @desc    Get user's performance metrics (total approved, earnings, tier, etc.)
// @access  Private
router.get('/analytics', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // A. Fetch User Data (especially tier from Gamification system)
    const user = await User.findById(userId).select('tier');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // B. Run Aggregation Pipeline on Submissions
    const results = await Submission.aggregate([
      {
        // Stage 1: $match - Filter submissions for the logged-in user
        $match: {
          user: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        // Stage 2: $group - Group all submissions into one document
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          approvedSubmissions: {
            $sum: { 
              $cond: [ 
                { $in: ['$status', ['Approved', 'Requested', 'Completed']] }, 
                1, 
                0 
              ] 
            }
          },
          rejectedSubmissions: {
            $sum: { 
              $cond: [ 
                { $eq: ['$status', 'Rejected'] }, 
                1, 
                0 
              ] 
            }
          },
          pendingSubmissions: {
            $sum: { 
              $cond: [ 
                { $eq: ['$status', 'Pending'] }, 
                1, 
                0 
              ] 
            }
          },
          totalEarnings: {
            $sum: { 
              $cond: [ 
                { $in: ['$status', ['Approved', 'Requested', 'Completed']] }, 
                '$paymentAmount', 
                0 
              ] 
            }
          },
          pendingEarnings: {
            $sum: { 
              $cond: [ 
                { $eq: ['$status', 'Pending'] }, 
                '$paymentAmount', 
                0 
              ] 
            }
          }
        }
      },
      {
        // Stage 3: $project - Calculate approvalRate and format output
        $project: {
          _id: 0,
          totalSubmissions: 1,
          approvedSubmissions: 1,
          rejectedSubmissions: 1,
          pendingSubmissions: 1,
          totalEarnings: {
            $round: ['$totalEarnings', 2]
          },
          pendingEarnings: {
            $round: ['$pendingEarnings', 2]
          },
          totalCompleted: {
            $add: ['$approvedSubmissions', '$rejectedSubmissions']
          },
          approvalRate: {
            $cond: [
              { $eq: [{ $add: ['$approvedSubmissions', '$rejectedSubmissions'] }, 0] },
              0, // Default to 0 if no completed submissions (division by zero)
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          '$approvedSubmissions',
                          { $add: ['$approvedSubmissions', '$rejectedSubmissions'] }
                        ]
                      },
                      100
                    ]
                  },
                  2
                ]
              }
            ]
          }
        }
      }
    ]);

    // C. Combine and Return Response
    const stats = results.length > 0 ? results[0] : {
      totalSubmissions: 0,
      approvedSubmissions: 0,
      rejectedSubmissions: 0,
      pendingSubmissions: 0,
      totalEarnings: 0,
      pendingEarnings: 0,
      totalCompleted: 0,
      approvalRate: 0
    };

    res.json({
      tier: user.tier || 'Bronze',
      totalSubmissions: stats.totalSubmissions || 0,
      approvedSubmissions: stats.approvedSubmissions || 0,
      rejectedSubmissions: stats.rejectedSubmissions || 0,
      pendingSubmissions: stats.pendingSubmissions || 0,
      totalEarnings: stats.totalEarnings || 0,
      pendingEarnings: stats.pendingEarnings || 0,
      totalCompleted: stats.totalCompleted || 0,
      approvalRate: stats.approvalRate || 0
    });

  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ msg: 'Server Error fetching analytics.' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset (generate reset token)
// @access  Public
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return res.status(400).json({ msg: 'Email is required.' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Security: Always return success message (don't reveal if email exists)
    // This prevents email enumeration attacks
    if (!user) {
      // Simulate email sending delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(200).json({ 
        msg: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token using crypto
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token and expiry to user
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Send password reset email
    await sendPasswordResetEmail(user.email, resetToken);

    // Return success message (don't reveal if email exists)
    res.status(200).json({ 
      msg: 'If an account with that email exists, a password reset link has been sent.' 
    });

  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ msg: 'Server Error processing password reset request.' });
  }
});

// @route   PUT /api/auth/reset-password/:token
// @desc    Reset password using reset token
// @access  Public
router.put('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Validate input
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({ msg: 'Reset token is required.' });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ msg: 'New password is required and must be at least 6 characters.' });
    }

    // Find user by reset token
    const user = await User.findOne({ 
      resetToken: token.trim(),
      resetTokenExpiry: { $gt: new Date() } // Token must not be expired
    });

    if (!user) {
      return res.status(400).json({ 
        msg: 'Invalid or expired reset token. Please request a new password reset.' 
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password and clear reset token fields
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    console.log(`[PASSWORD RESET] Password successfully reset for user: ${user.email}`);

    res.status(200).json({ 
      msg: 'Password has been reset successfully. You can now login with your new password.' 
    });

  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ msg: 'Server Error resetting password.' });
  }
});

module.exports = router;