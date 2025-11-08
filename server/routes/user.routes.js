const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth.middleware');

// اتأكد إن الموديلز دي كلها موجودة
const User = require('../models/User.model');
const Submission = require('../models/Submission.model');
const PayoutRequest = require('../models/PayoutRequest.model');
const Project = require('../models/Project.model');

// Import controller functions
const { cleanDatabase, startTask, submitTask } = require('../controllers/user.controller');
const { sendWelcomeEmail } = require('../utils/emailSender');


// @route   PUT /api/users/application
// (ده بتاع تقديم الفريلانسر - سليم زي ما هو)
router.put('/application', protect, async (req, res) => {
    try {
        const { bio, testAnswer } = req.body;
        const userId = req.user.id;
        
        const CORRECT_ANSWER = 'سلبي'; 
        const isCorrect = testAnswer.trim().toLowerCase() === CORRECT_ANSWER.toLowerCase();
        let score = isCorrect ? 95 : 30; 
        
        if (testAnswer.length > 20) {
            score = 10;
        }

        if (!bio || !testAnswer) {
            return res.status(400).json({ msg: 'السيرة الذاتية وإجابة الاختبار مطلوبة.' });
        }

        const user = await User.findById(userId);
        if (!user) { return res.status(404).json({ msg: 'المستخدم غير موجود.' }); }
        
        user.bio = bio; 
        user.testAnswer = testAnswer;
        user.aiScore = score; 
        user.applicationDate = new Date(); 
        user.status = 'Pending'; 

        await user.save();
        res.json({ msg: 'تم إرسال الطلب للمراجعة بنجاح.', user });
        
    } catch (err) {
        console.error('Application submission error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users/applicants
// (ده بتاع جلب المتقدمين للأدمن - سليم زي ما هو)
router.get('/applicants', protect, admin, async (req, res) => {
    try {
        const applicants = await User.find({ role: 'Applicant', status: 'Pending' })
            .select('-password'); 

        res.json(applicants);
    } catch (err) {
        console.error('Error fetching applicants:', err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/users/review/:id
// (ده بتاع موافقة الأدمن - بعد ما لغينا سعر الساعة - سليم زي ما هو)
router.put('/review/:id', protect, admin, async (req, res) => {
    try {
        const { status, skillDomain } = req.body;
        const userId = req.params.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'Applicant not found.' });
        }
        
        if (!['Accepted', 'Rejected'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid status provided.' });
        }

        user.status = status;
        
        if (status === 'Accepted') {
            user.role = 'Freelancer';
            // Assign the domain selected by the admin
            if (skillDomain) {
                user.skillDomain = skillDomain;
            } else {
                // Default to 'General' if modal fails to send one
                user.skillDomain = 'General';
            }
        } else {
            user.role = 'Applicant';
        }
        
        await user.save();
        
        // Send welcome email when applicant is approved
        if (status === 'Accepted') {
            await sendWelcomeEmail(user.email, user.firstName);
        }
        
        res.json({ msg: `Applicant successfully set to ${status}`, user });

    } catch (err) {
        console.error('Review process error:', err);
        res.status(500).send('Server Error');
    }
});


// @route   PUT /api/users/update-payment
// @desc    Update user's payment settings
// @access  Private
// ⬇️⬇️ ده الكود المعدل اللي بيستخدم "updateOne" ⬇️⬇️
router.put('/update-payment', protect, async (req, res) => {
    console.log('--- [1] (PAYMENT) الراوت اشتغل ---');
    try {
      const { paymentMethod, paymentIdentifier } = req.body;
      const userId = req.user.id;
  
      console.log(`[2] (PAYMENT) اليوزر: ${userId} بيحاول يحفظ:`, req.body);
  
      if (!paymentMethod || !paymentIdentifier) {
        console.log('[!!!] (PAYMENT) خطأ: البيانات ناقصة');
        return res.status(400).json({ msg: 'Please provide both method and details.' });
      }
      
      console.log('[3] (PAYMENT) جاري تحديث البيانات (باستخدام updateOne)...');
  
      // ---------------------------------------------
      // --- ⬇️⬇️ (هنا الحل) ⬇️⬇️ ---
      // هنستخدم "updateOne" عشان نتجنب مشاكل الـ validation القديمة
      await User.updateOne(
        { _id: userId }, // (دور على اليوزر ده)
        { 
          $set: { // (وحدّث الخانات دي بس)
            paymentMethod: paymentMethod,
            paymentIdentifier: paymentIdentifier.trim()
          } 
        }
      );
      // --- ⬆️⬆️ (نهاية الحل) ⬆️⬆️ ---
  
      console.log('[4] (PAYMENT) نجاح! تم الحفظ.');
      res.json({ msg: 'Payment details updated successfully!' });
  
    } catch (err) {
      // (ده كود تتبع الأخطاء زي ما هو)
      console.error('--- [CRITICAL PAYMENT ERROR] ---');
      console.error('--- الخطأ الكامل ---', err); 
      console.error('--- رسالة الخطأ ---', err.message);
      res.status(500).send('Server Error');
    }
  });
// @route   PUT /api/users/profile/update
// @desc    Update user's basic profile information (Self-update only)
// @access  Private
router.put('/profile/update', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Define allowed basic profile fields only
        const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'address', 'linkedInURL'];
        const updateObject = {};

        // Filter and sanitize input - only allow safe fields
        for (const key in req.body) {
            if (allowedFields.includes(key)) {
                // Trim string values to remove whitespace
                if (typeof req.body[key] === 'string') {
                    updateObject[key] = req.body[key].trim();
                } else {
                    updateObject[key] = req.body[key];
                }
            }
        }

        // Check if any valid fields were provided
        if (Object.keys(updateObject).length === 0) {
            return res.status(400).json({ msg: 'No valid profile fields provided for update.' });
        }

        // Update user using findByIdAndUpdate
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateObject },
            { new: true, runValidators: true, select: '-password' }
        );

        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        res.json({ msg: 'Profile updated successfully!', user });

    } catch (err) {
        // Handle validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        console.error('Profile update error:', err.message);
        res.status(500).send('Server Error');
    }
});

  // @route   PUT /api/users/update-profile
// @desc    Update all editable user profile fields (Personal Info, Bio, Payment)
// @access  Private
router.put('/update-profile', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body; // نستقبل كل البيانات المرسلة من الفورم

        // 1. إنشاء قائمة بالحقول المسموح بتعديلها
        const allowedUpdates = [
            'firstName', 'lastName', 'phoneNumber', 'address', 'dateOfBirth', 'linkedInURL',
            'paymentMethod', 'paymentIdentifier', 'bio'
        ];
        
        const updateObject = {};
        
        // 2. فلترة الحقول لضمان عدم تعديل حقول حساسة (مثل role أو password)
        for (const key in updates) {
            if (allowedUpdates.includes(key)) {
                // التعامل مع حقل التاريخ (dateOfBirth) لضمان حفظه كـ Date
                if (key === 'dateOfBirth' && updates[key]) {
                    updateObject[key] = new Date(updates[key]);
                } else if (typeof updates[key] === 'string') {
                    updateObject[key] = updates[key].trim();
                } else {
                    updateObject[key] = updates[key];
                }
            }
        }

        if (Object.keys(updateObject).length === 0) {
            return res.status(400).json({ msg: 'No valid fields provided for update.' });
        }

        // 3. تحديث المستخدم باستخدام findByIdAndUpdate
        // (useFindAndModify: false is recommended by Mongoose)
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateObject },
            { new: true, runValidators: true, select: '-password' } // runValidators للتأكد من قواعد الـ Schema
        );

        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        res.json({ msg: 'Profile updated successfully!', user });

    } catch (err) {
        // إذا فشلت عملية الـ validation (مثل إرسال نص في حقل تاريخ)
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        console.error('Profile update error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/users/delete-account
// @desc    Delete user's account and data
// @access  Private
router.delete('/delete-account', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. حذف المستخدم
        const user = await User.findByIdAndDelete(userId);
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }
        
        // 2. (اختياري لكن مهم جداً): حذف كل البيانات المتعلقة به
        //    (مثل طلبات الدفع والتسليمات القديمة لضمان نظافة الداتابيز)
        await Submission.deleteMany({ user: userId });
        await PayoutRequest.deleteMany({ user: userId });

        console.log(`User ${userId} and associated data deleted.`);
        
        // 3. إرسال استجابة نجاح
        res.json({ msg: 'Account deleted successfully. Goodbye!' });

    } catch (err) {
        console.error('Delete account error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users/notifications
// @desc    Get user's notification history (last 20)
// @access  Private
router.get('/notifications', protect, async (req, res) => {
    try {
        // Find the user by the ID from the token
        const user = await User.findById(req.user.id).select('notifications');
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Sort notifications: newest first (descending order)
        const sortedNotifications = user.notifications.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.json(sortedNotifications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users/admin/all
// @desc    Get all users with pagination and filtering (Admin only)
// @access  Private/Admin
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    // Extract pagination and search parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.searchTerm || '';

    // Build filter object for search
    let filter = {};
    if (searchTerm.trim()) {
      // Case-insensitive regex search across email, firstName, and lastName
      const searchRegex = new RegExp(searchTerm.trim(), 'i');
      filter = {
        $or: [
          { email: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex },
        ],
      };
    }

    // Calculate pagination skip value
    const skip = (page - 1) * limit;

    // Fetch paginated users
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count of users matching the filter
    const totalUsers = await User.countDocuments(filter);

    // Calculate total pages
    const totalPages = Math.ceil(totalUsers / limit);

    // Return structured response
    res.json({
      users,
      totalPages,
      currentPage: page,
      totalUsers,
    });
  } catch (err) {
    console.error('Error fetching all users:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/users/admin/update/:id
// @desc    Update user details by ID (Admin only)
// @access  Private/Admin
router.put('/admin/update/:id', protect, admin, async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    // Optional: Define allowed fields that can be updated by admin
    // You can customize this list based on what fields should be admin-editable
    const allowedFields = ['role', 'status', 'firstName', 'lastName', 'email', 'phoneNumber', 'skillDomain'];
    const updateObject = {};

    // Filter updates to only include allowed fields
    for (const key in updates) {
      if (allowedFields.includes(key)) {
        updateObject[key] = updates[key];
      }
    }

    if (Object.keys(updateObject).length === 0) {
      return res.status(400).json({ msg: 'No valid fields provided for update.' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateObject },
      { new: true, runValidators: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    res.json({ msg: 'User updated successfully', user });

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: err.message });
    }
    console.error('Error updating user:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/users/admin/clean-db
// @desc    Delete all non-admin users (Admin only - for testing/cleanup)
// @access  Private/Admin
router.delete('/admin/clean-db', protect, admin, cleanDatabase);

// @route   POST /api/users/tasks/:taskId/start
// @desc    Start a task by locking it (prevents multiple users from working on the same task)
// @access  Private
router.post('/tasks/:taskId/start', protect, startTask);

// @route   POST /api/users/tasks/:taskId/submit
// @desc    Submit a completed task and unlock it
// @access  Private
router.post('/tasks/:taskId/submit', protect, submitTask);

module.exports = router;