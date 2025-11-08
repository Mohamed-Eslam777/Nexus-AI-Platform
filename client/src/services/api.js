import axios from 'axios';

/**
 * Get authentication header with bearer token
 * @returns {Object} Headers object with Authorization
 */
export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// ============================================
// AUTHENTICATION API
// ============================================

/**
 * User login
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} Axios response with token and user data
 */
export const login = async (email, password) => {
  return await axios.post('/api/auth/login', { email, password });
};

/**
 * User registration
 * @param {Object} formData - Registration form data
 * @returns {Promise} Axios response with token
 */
export const register = async (formData) => {
  return await axios.post('/api/auth/register', formData);
};

/**
 * Request password reset (send reset email)
 * @param {string} email - User email
 * @returns {Promise} Axios response
 */
export const requestPasswordReset = async (email) => {
  return await axios.post('/api/auth/forgot-password', { email });
};

/**
 * Reset password using reset token
 * @param {string} token - Reset token from URL
 * @param {string} newPassword - New password
 * @returns {Promise} Axios response
 */
export const resetPassword = async (token, newPassword) => {
  return await axios.put(`/api/auth/reset-password/${token}`, { newPassword });
};

/**
 * Fetch user analytics/performance metrics
 * @returns {Promise} Axios response with analytics data
 */
export const fetchAnalyticsData = async () => {
  const config = getAuthHeader();
  return await axios.get('/api/auth/analytics', config);
};

// ============================================
// PROJECTS API
// ============================================

/**
 * Fetch available projects for the logged-in user
 * @returns {Promise} Axios response with projects array
 */
export const fetchAvailableProjects = async () => {
  const config = getAuthHeader();
  return await axios.get('/api/projects', config);
};

/**
 * Create a new project (Admin only)
 * @param {Object} formData - Project data
 * @returns {Promise} Axios response
 */
export const createProject = async (formData) => {
  const config = getAuthHeader();
  return await axios.post('/api/projects', formData, config);
};

/**
 * Update an existing project (Admin only)
 * @param {string} projectId - Project ID
 * @param {Object} formData - Updated project data
 * @returns {Promise} Axios response
 */
export const updateProject = async (projectId, formData) => {
  const config = getAuthHeader();
  return await axios.put(`/api/projects/${projectId}`, formData, config);
};

/**
 * Delete a project
 * @param {string} projectId - Project ID
 * @returns {Promise} Axios response
 */
export const deleteProject = async (projectId) => {
  const config = getAuthHeader();
  return await axios.delete(`/api/projects/${projectId}`, config);
};

// ============================================
// ADMIN API
// ============================================

/**
 * Fetch all submissions for Global Activity Feed (Admin only)
 * @returns {Promise} Axios response with submissions array
 */
export const getAllSubmissions = async () => {
  const config = getAuthHeader();
  return await axios.get('/api/projects/submissions/all', config);
};

/**
 * Fetch admin dashboard data (stats, submissions, applicants, payouts, projects)
 * @returns {Promise} Object with all admin data
 */
export const fetchAdminDashboardData = async () => {
  const config = getAuthHeader();
  
  try {
    const [statsRes, subsRes, applicantsRes, payoutRes, projectsRes] = await Promise.all([
      axios.get('/api/projects/stats', config),
      axios.get('/api/projects/submissions/pending', config),
      axios.get('/api/users/applicants', config),
      axios.get('/api/wallet/admin/pending-requests', config),
      axios.get('/api/projects/all', config),
    ]);

    return {
      stats: statsRes.data,
      pendingSubmissions: subsRes.data,
      applicants: applicantsRes.data,
      payoutRequests: payoutRes.data,
      projects: projectsRes.data || [],
    };
  } catch (err) {
    throw err;
  }
};

/**
 * Review a submission (Admin only)
 * @param {string} submissionId - Submission ID
 * @param {string} status - Review status ('Approved', 'Rejected', etc.)
 * @returns {Promise} Axios response
 */
export const reviewSubmission = async (submissionId, status, adminFeedback = null) => {
  const config = getAuthHeader();
  const payload = { status };
  if (adminFeedback !== null && adminFeedback.trim() !== '') {
    payload.adminFeedback = adminFeedback.trim();
  }
  return await axios.put(`/api/projects/submissions/${submissionId}/review`, payload, config);
};

/**
 * Bulk review multiple submissions (Admin only)
 * @param {Array<string>} submissionIds - Array of submission IDs
 * @param {string} status - Review status ('Approved' or 'Rejected')
 * @param {string|null} adminFeedback - Optional admin feedback (typically for rejections)
 * @returns {Promise} Axios response with processing results
 */
export const bulkReviewSubmissions = async (submissionIds, status, adminFeedback = null) => {
  const config = getAuthHeader();
  const payload = { submissionIds, status };
  if (adminFeedback !== null && adminFeedback.trim() !== '') {
    payload.adminFeedback = adminFeedback.trim();
  }
  return await axios.put('/api/projects/submissions/bulk-review', payload, config);
};

/**
 * Generate project instructions from title using AI (Admin only)
 * @param {string} projectTitle - Project title
 * @returns {Promise} Axios response with generated instructions
 */
export const generateProjectInstructions = async (projectTitle) => {
  const config = getAuthHeader();
  return await axios.post('/api/admin/generate-instructions', { projectTitle }, config);
};

// === AI Instruction Generation ===

/**
 * Generate project description and instructions using AI (Gemini)
 * @param {string} title - Project title
 * @param {string} taskType - Task type
 * @returns {Promise} Returns { description, detailedInstructions }
 */
export const generateInstructionsAI = async (title, taskType) => {
  try {
    const config = getAuthHeader();
    const { data } = await axios.post('/api/admin/ai/generate-instructions', { title, taskType }, config);
    return data; // Returns { description, detailedInstructions }
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch project performance analytics (Admin only)
 * @returns {Promise} Axios response with project performance data
 */
export const fetchProjectPerformanceAnalytics = async () => {
  const config = getAuthHeader();
  return await axios.get('/api/admin/analytics/project-performance', config);
};

/**
 * Fetch user's personal analytics (Freelancer/User)
 * @returns {Promise} Axios response with user performance data
 */
export const fetchUserAnalytics = async () => {
  const config = getAuthHeader();
  return await axios.get('/api/auth/analytics', config);
};

/**
 * Fetch top 10 freelancer performance analytics (Admin only)
 * @returns {Promise} Axios response with freelancer performance data
 */
export const fetchFreelancerPerformanceAnalytics = async () => {
  const config = getAuthHeader();
  return await axios.get('/api/admin/analytics/freelancer-performance', config);
};

/**
 * Fetch admin dashboard KPI stats (total projects, pending submissions, applicants, payouts)
 * @returns {Promise} Object with dashboard stats
 */
export const fetchAdminDashboardStats = async () => {
  const config = getAuthHeader();
  try {
    const { data } = await axios.get('/api/admin/analytics/dashboard-stats', config);
    return data.data; // Return the nested data object
  } catch (error) {
    throw error;
  }
};

/**
 * Get AI quality check score and feedback for a submission (Admin only)
 * @param {string} submissionId - Submission ID
 * @returns {Promise} Axios response with { aiScore, aiFeedback }
 */
export const getAIReviewScore = async (submissionId) => {
  const config = getAuthHeader();
  return await axios.get(`/api/projects/admin/review-score/${submissionId}`, config);
};

/**
 * Review an applicant (Admin only)
 * @param {string} applicantId - Applicant user ID
 * @param {string} status - Review status ('Accepted', 'Rejected')
 * @param {string} skillDomain - Skill domain to assign (optional, only for 'Accepted' status)
 * @returns {Promise} Axios response
 */
export const reviewApplicant = async (applicantId, status, skillDomain = null) => {
  const config = getAuthHeader();
  const body = { status };
  if (skillDomain && status === 'Accepted') {
    body.skillDomain = skillDomain;
  }
  return await axios.put(`/api/users/review/${applicantId}`, body, config);
};

/**
 * Review a payout request (Admin only)
 * @param {string} requestId - Payout request ID
 * @param {string} status - Review status ('Completed', 'Rejected')
 * @returns {Promise} Axios response
 */
export const reviewPayoutRequest = async (requestId, status) => {
  const config = getAuthHeader();
  return await axios.put(`/api/wallet/admin/review/${requestId}`, { status }, config);
};

/**
 * Fetch audit logs with pagination (Admin only)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of logs per page (default: 10)
 * @returns {Promise} Axios response with logs array and pagination metadata
 */
export const fetchAuditLogs = async (page = 1, limit = 10) => {
  const config = getAuthHeader();
  return await axios.get(`/api/admin/audit-logs?page=${page}&limit=${limit}`, config);
};

// ============================================
// USER MANAGEMENT API (Admin only)
// ============================================

/**
 * Fetch paginated users with optional search term
 * @param {number} page - Page number (default: 1)
 * @param {string} term - Search term (default: '')
 * @returns {Promise} Axios response with users array and pagination metadata
 */
export const fetchUsers = async (page = 1, term = '') => {
  const config = getAuthHeader();
  const encodedTerm = encodeURIComponent(term);
  return await axios.get(
    `/api/users/admin/all?page=${page}&limit=10&searchTerm=${encodedTerm}`,
    config
  );
};

/**
 * Update user details (Admin only)
 * @param {string} userId - User ID
 * @param {Object} data - Updated user data (e.g., { role: 'Freelancer', status: 'Accepted' })
 * @returns {Promise} Axios response
 */
export const updateUser = async (userId, data) => {
  const config = getAuthHeader();
  return await axios.put(`/api/users/admin/update/${userId}`, data, config);
};

// ============================================
// USER PROFILE API
// ============================================

/**
 * Fetch user profile data
 * @returns {Promise} Axios response with user data and approved submissions count
 */
export const fetchUserProfile = async () => {
  const config = getAuthHeader();
  return await axios.get('/api/auth/profile', config);
};

/**
 * Update user profile (personal info, bio, payment settings)
 * @param {Object} data - Updated profile data
 * @returns {Promise} Axios response
 */
export const updateUserProfile = async (data) => {
  const config = getAuthHeader();
  return await axios.put('/api/users/update-profile', data, config);
};

/**
 * Change user password
 * @param {Object} data - { currentPassword, newPassword }
 * @returns {Promise} Axios response
 */
export const changeUserPassword = async (data) => {
  const config = getAuthHeader();
  return await axios.put('/api/auth/change-password', data, config);
};

/**
 * Delete user account
 * @returns {Promise} Axios response
 */
export const deleteAccount = async () => {
  const config = getAuthHeader();
  return await axios.delete('/api/users/delete-account', config);
};

/**
 * Submit application form
 * @param {Object} data - { bio, testAnswer }
 * @returns {Promise} Axios response
 */
export const submitApplication = async (data) => {
  const config = getAuthHeader();
  return await axios.put('/api/users/application', data, config);
};

/**
 * Fetch all notifications for the logged-in user
 * @returns {Promise} Axios response with notifications array
 */
export const fetchNotifications = async () => {
  const config = getAuthHeader();
  const res = await axios.get('/api/users/notifications', config);
  return res.data;
};

// ============================================
// WALLET API
// ============================================

/**
 * Fetch wallet statistics (balance, pending review, pending payouts, transactions)
 * @returns {Promise} Object with wallet stats and transaction history
 */
export const fetchWalletStats = async () => {
  const config = getAuthHeader();
  
  try {
    const [availableRes, pendingReviewRes, pendingPayoutRes] = await Promise.all([
      axios.get('/api/wallet/available-balance', config),
      axios.get('/api/wallet/pending-review-balance', config),
      axios.get('/api/wallet/pending-requests', config),
    ]);

    const pendingRequests = Array.isArray(pendingPayoutRes.data) ? pendingPayoutRes.data : [];
    const totalPendingPayout = pendingRequests.reduce((acc, req) => acc + (Number(req.amount) || 0), 0);

    const transactions = pendingRequests
      .map((req) => ({
        id: req._id,
        date: req.createdAt,
        description: 'Payout Requested',
        amount: Number(req.amount) || 0,
        status: req.status || 'Pending',
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      stats: {
        available: Number(availableRes.data.totalApprovedAmount) || 0,
        pendingReview: Number(pendingReviewRes.data.totalPendingAmount) || 0,
      },
      pendingPayouts: totalPendingPayout,
      transactions,
    };
  } catch (err) {
    throw err;
  }
};

/**
 * Request a payout
 * @returns {Promise} Axios response
 */
export const requestPayout = async () => {
  const config = getAuthHeader();
  return await axios.post('/api/wallet/request-payout', {}, config);
};

// ============================================
// TASK/SUBMISSION API
// ============================================

/**
 * Fetch project details by ID
 * @param {string} projectId - Project ID
 * @returns {Promise} Axios response with project data
 */
export const fetchProjectDetails = async (projectId) => {
  const config = getAuthHeader();
  const res = await axios.get('/api/projects', config);
  const selectedProject = res.data.find((p) => p._id === projectId);
  
  if (!selectedProject) {
    throw new Error('Project not found or not available.');
  }
  
  return { data: selectedProject };
};

/**
 * Submit a completed task
 * @param {string} projectId - Project ID
 * @param {Object} data - Submission data (e.g., { content: 'annotation text' })
 * @returns {Promise} Axios response
 */
export const submitTask = async (projectId, data) => {
  const config = getAuthHeader();
  return await axios.post(`/api/projects/${projectId}/submit`, data, config);
};

// ============================================
// QUALIFICATION TESTS API (Admin only)
// ============================================

/**
 * Create a new qualification test (Admin only)
 * @param {Object} testData - Test data (title, projectDomain, description, tasks, status)
 * @returns {Promise} Axios response with created test
 */
export const createQualificationTest = async (testData) => {
  const config = getAuthHeader();
  try {
    const { data } = await axios.post('/api/admin/qualification-tests', testData, config);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all qualification tests (Admin only)
 * @returns {Promise} Axios response with tests array
 */
export const getAllQualificationTests = async () => {
  const config = getAuthHeader();
  try {
    const { data } = await axios.get('/api/admin/qualification-tests', config);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update a qualification test (Admin only)
 * @param {string} id - Test ID
 * @param {Object} testData - Updated test data
 * @returns {Promise} Axios response with updated test
 */
export const updateQualificationTest = async (id, testData) => {
  const config = getAuthHeader();
  try {
    const { data } = await axios.put(`/api/admin/qualification-tests/${id}`, testData, config);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a qualification test (Admin only)
 * @param {string} id - Test ID
 * @returns {Promise} Axios response
 */
export const deleteQualificationTest = async (id) => {
  const config = getAuthHeader();
  try {
    const { data } = await axios.delete(`/api/admin/qualification-tests/${id}`, config);
    return data;
  } catch (error) {
    throw error;
  }
};

// ============================================
// QUALIFICATION TESTS API (Freelancer)
// ============================================

/**
 * Get available qualification tests for the logged-in user
 * @returns {Promise} Axios response with available tests array
 */
export const getAvailableQualificationTests = async () => {
  const config = getAuthHeader();
  try {
    const { data } = await axios.get('/api/qualification/available', config);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single qualification test by ID
 * @param {string} id - Test ID
 * @returns {Promise} Axios response with test details
 */
export const getSingleQualificationTest = async (id) => {
  const config = getAuthHeader();
  try {
    const { data } = await axios.get(`/api/qualification/${id}`, config);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Submit a qualification test
 * @param {Object} submissionData - { testId: string, submissionContent: string }
 * @returns {Promise} Axios response
 */
export const submitQualificationTest = async (submissionData) => {
  const config = getAuthHeader();
  try {
    const { data } = await axios.post('/api/qualification/submit', submissionData, config);
    return data;
  } catch (error) {
    throw error;
  }
};

// ============================================
// QUALIFICATION REVIEW API (Admin)
// ============================================

/**
 * Get all pending qualification submissions (Admin only)
 * @returns {Promise} Axios response with pending submissions array
 */
export const getPendingQualificationSubmissions = async () => {
  const config = getAuthHeader();
  try {
    const { data } = await axios.get('/api/admin/qualification-submissions/pending', config);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Review a qualification submission (Admin only)
 * @param {string} submissionId - Submission ID
 * @param {Object} reviewData - { newStatus: 'Approved' | 'Rejected', adminFeedback?: string }
 * @returns {Promise} Axios response with updated submission
 */
export const reviewQualificationSubmission = async (submissionId, reviewData) => {
  const config = getAuthHeader();
  try {
    const { data } = await axios.put(`/api/admin/qualification-submissions/review/${submissionId}`, reviewData, config);
    return data;
  } catch (error) {
    throw error;
  }
};

