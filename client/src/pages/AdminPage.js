import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import * as api from '../services/api';
import { SkeletonCard, SkeletonTable } from '../components/SkeletonLoader';

// --- Dark Theme Design Tokens ---
const primaryButtonClasses =
  'inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 active:scale-95';

const secondaryButtonClasses =
  'inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm font-semibold text-slate-200 shadow-sm transition-all duration-300 hover:border-slate-500 hover:bg-slate-700/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500/30';

const pillButtonBaseClasses =
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';

const pillPrimaryClasses = `${pillButtonBaseClasses} bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 hover:scale-105 active:scale-95 focus:ring-emerald-500/30`;
const pillPositiveClasses = `${pillButtonBaseClasses} bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 hover:scale-105 active:scale-95 focus:ring-emerald-500/30`;
const pillNegativeClasses = `${pillButtonBaseClasses} bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 hover:scale-105 active:scale-95 focus:ring-rose-500/30`;
const pillNeutralClasses = `${pillButtonBaseClasses} bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 hover:scale-105 active:scale-95 focus:ring-blue-500/30`;

const inputClasses =
  'block w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-emerald-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200';

const formatCurrency = (value, config = {}) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...config,
  }).format(value ?? 0);

const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    return '—';
  }
};

const getProjectDomainBadgeClass = (domain) => {
  switch (domain) {
    case 'Programming':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'Business':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'Law':
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    case 'Health':
      return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
    case 'General':
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    default:
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const statCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  hover: {
    scale: 1.03,
    y: -4,
    transition: {
      duration: 0.2,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const StatCard = ({ title, count, isCurrency, accentBarClass, delay, helper }) => (
  <motion.div
    variants={statCardVariants}
    initial="hidden"
    animate="visible"
    whileHover="hover"
    className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 overflow-hidden"
  >
    {/* Glowing accent bar */}
    <div className={`absolute inset-x-0 top-0 h-1 ${accentBarClass}`} />
    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    
    <div className="relative space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <p className="text-3xl font-bold text-white">
        {isCurrency ? formatCurrency(count) : count ?? '—'}
      </p>
      {helper ? <p className="text-xs text-slate-400">{helper}</p> : null}
    </div>
  </motion.div>
);

export default function AdminPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    detailedInstructions: '',
    payRate: 20,
    paymentType: 'PER_TASK',
    projectDomain: 'General',
    taskContent: "User: This is a test chat. AI: I understand.",
    taskPoolData: '', // JSON string for Task Pool array
    taskType: 'Chat_Sentiment',
    isRepeatable: true, // Default to true (repeatable)
    maxTotalSubmissions: '', // Optional: Total submissions limit (blank for no limit)
  });
  const [stats, setStats] = useState({
    totalProjects: 0,
    pendingSubmissions: 0,
    totalApplicants: 0,
    pendingPayouts: 0
  });
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]); // Global Activity Feed data
  const [editingProject, setEditingProject] = useState(null); // Holds the full project object being edited
  const [editMode, setEditMode] = useState(false); // Boolean flag
  const [selectedSubmissions, setSelectedSubmissions] = useState([]); // Track selected submissions for bulk review
  const [isProcessingBulk, setIsProcessingBulk] = useState(false); // Track bulk processing status
  const [adminFeedback, setAdminFeedback] = useState(''); // Admin feedback for rejections
  const editFormRef = useRef(null); // Ref for scrolling to the edit form
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility for domain assignment
  const [selectedUser, setSelectedUser] = useState(null); // User being approved
  const [assignedDomain, setAssignedDomain] = useState('General'); // Domain to assign to user
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // Modal visibility for viewing full submission
  const [selectedSubmissionContent, setSelectedSubmissionContent] = useState(''); // Full submission content to display
  const [isViewApplicantModalOpen, setIsViewApplicantModalOpen] = useState(false); // Modal visibility for viewing full applicant data
  const [selectedApplicantData, setSelectedApplicantData] = useState(null); // Full applicant object to display
  const [generatedInstructions, setGeneratedInstructions] = useState(''); // Store AI-generated instructions
  const [isGeneratingInstructions, setIsGeneratingInstructions] = useState(false); // Track instruction generation status
  const [loading, setLoading] = useState(true); // Track main data loading state
  const [triageStatusFilter, setTriageStatusFilter] = useState('PENDING'); // Filter by triageStatus: 'PENDING', 'REJECTED', 'ALL'
  const [allSubmissions, setAllSubmissions] = useState([]); // Store all fetched submissions for filtering
  const [qualTests, setQualTests] = useState([]); // Qualification tests list
  const [newTestData, setNewTestData] = useState({ title: '', projectDomain: 'General', description: '', tasks: '[]', status: 'Active' }); // Form data for creating tests
  const [editingTest, setEditingTest] = useState(null); // Test being edited
  const [testEditMode, setTestEditMode] = useState(false); // Edit mode flag for tests
  const testEditFormRef = useRef(null); // Ref for scrolling to the test edit form
  const [pendingApplicants, setPendingApplicants] = useState([]); // Pending qualification submissions
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false); // Modal visibility for reviewing submissions
  const [selectedSubmission, setSelectedSubmission] = useState(null); // Selected submission for review
  const [isReviewing, setIsReviewing] = useState(false); // Track review submission status
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch Qualification Tests
  const fetchQualificationTests = async () => {
    try {
      const tests = await api.getAllQualificationTests();
      setQualTests(tests || []);
    } catch (err) {
      console.error('Failed to fetch qualification tests:', err);
      toast.error('Failed to fetch qualification tests: ' + (err.response?.data?.message || 'Error'));
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard stats using the new efficient endpoint
      const statsData = await api.fetchAdminDashboardStats();
      setStats(statsData);
      
      // Fetch other data (submissions, applicants, payouts, projects) separately
      const data = await api.fetchAdminDashboardData();
      
      // Filter to only show submissions with 'Pending' status (manual review required)
      const submissionsAwaitingReview = (data.pendingSubmissions || []).filter(sub => sub.status === 'Pending');
      
      // Fetch AI scores for each pending submission
      // Note: consistencyWarning is already included in the submission data from the backend
      const submissionsWithAI = await Promise.all(
        submissionsAwaitingReview.map(async (sub) => {
          try {
            const aiData = await api.getAIReviewScore(sub._id);
            return {
              ...sub,
              aiScore: aiData.data.aiScore,
              aiFeedback: aiData.data.aiFeedback,
              // Preserve consistencyWarning if it exists (it should be in the original sub object)
              consistencyWarning: sub.consistencyWarning || false,
            };
          } catch (err) {
            // If AI score fetch fails, include submission without AI data
            console.error(`Failed to fetch AI score for submission ${sub._id}:`, err);
            return {
              ...sub,
              aiScore: null,
              aiFeedback: null,
              consistencyWarning: sub.consistencyWarning || false,
            };
          }
        })
      );
      
      // Store all submissions for filtering
      setAllSubmissions(submissionsWithAI);
      
      // Apply triageStatus filter
      applyTriageStatusFilter(submissionsWithAI, triageStatusFilter);
      
      setApplicants(data.applicants);
      setPayoutRequests(data.payoutRequests);
      setProjects(data.projects);
      
      // Fetch Global Activity Feed
      try {
        const activityRes = await api.getAllSubmissions();
        setActivityFeed(activityRes.data || []);
      } catch (err) {
        console.error('Failed to fetch activity feed:', err);
        setActivityFeed([]); // Set empty array on error
      }
      
      // Fetch Qualification Tests
      fetchQualificationTests();
      
      // Fetch Pending Qualification Submissions
      fetchPendingApplicants();
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch admin data.', err);
      setLoading(false);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  // Apply triageStatus filter to submissions
  const applyTriageStatusFilter = (submissions, filter) => {
    let filtered = [];
    
    if (filter === 'ALL') {
      filtered = submissions;
    } else if (filter === 'PENDING') {
      filtered = submissions.filter(sub => sub.triageStatus === 'PENDING' || !sub.triageStatus);
    } else if (filter === 'REJECTED') {
      filtered = submissions.filter(sub => sub.triageStatus === 'REJECTED');
    } else {
      filtered = submissions;
    }
    
    setPendingSubmissions(filtered);
  };

  // Handle triageStatus filter change
  const handleTriageStatusFilterChange = (filter) => {
    setTriageStatusFilter(filter);
    setSelectedSubmissions([]); // Clear selection when filter changes
    applyTriageStatusFilter(allSubmissions, filter);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded.user.role !== 'Admin') {
        navigate('/dashboard');
      }
      fetchData();
    } catch (error) {
      console.error('Invalid token');
      localStorage.removeItem('token');
      navigate('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const { title, description, detailedInstructions, payRate, paymentType, projectDomain, taskContent, taskPoolData, taskType, isRepeatable, maxTotalSubmissions } = formData;
  const onChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const onLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleEditClick = (project) => {
    // Set form data with current project values
    setFormData({
      title: project.title,
      description: project.description,
      detailedInstructions: project.detailedInstructions || '',
      payRate: project.payRate,
      paymentType: project.paymentType || 'PER_TASK', // Default to PER_TASK for old projects
      projectDomain: project.projectDomain || 'General', // Default to 'General' for old projects
      taskContent: project.taskContent,
      taskPoolData: project.taskPool && project.taskPool.length > 0 ? JSON.stringify(project.taskPool, null, 2) : '',
      taskType: project.taskType,
      isRepeatable: project.isRepeatable !== undefined ? project.isRepeatable : true, // Default to true for old projects
      maxTotalSubmissions: project.maxTotalSubmissions || '', // Default to empty string (no limit) for old projects
    });
    setEditingProject(project); // Store the project object
    setEditMode(true); // Set the edit flag
    
    // Scroll to the edit form section
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100); // Small delay to ensure form is rendered
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteProject(projectId);
      toast.success('Project deleted successfully');
      fetchData(); // Refresh the project list
    } catch (err) {
      console.error('Delete project failed:', err.response?.data?.msg);
      toast.error('Failed to delete project: ' + (err.response?.data?.msg || 'Error'));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;

      if (editingProject) {
        // UPDATE MODE
        res = await api.updateProject(editingProject._id, formData);
      } else {
        // CREATE MODE
        res = await api.createProject(formData);
      }

      // Success Handling
      toast.success(res.data.msg || 'Project saved successfully!');

      // Reset state after successful save
      setFormData({
        title: '', description: '', detailedInstructions: '', payRate: 20, paymentType: 'PER_TASK', projectDomain: 'General', taskContent: '', taskPoolData: '',
        taskType: 'Chat_Sentiment', isRepeatable: true, maxTotalSubmissions: ''
      });
      setEditingProject(null); // Exit edit mode
      setEditMode(false); // Reset flag
      fetchData(); // Refresh the list of projects

      // Scroll to top to show updated stats and project list
      window.scrollTo(0, 0);

    } catch (err) {
      console.error('Failed to save project:', err.response?.data?.msg);
      toast.error('Error: ' + (err.response?.data?.msg || 'Failed to save project'));
    }
  };

  const handleReview = async (submissionId, status) => {
    if (!window.confirm(`Are you sure you want to mark this submission as ${status}?`)) return;
    
    let feedback = null;
    // If rejecting, prompt for optional feedback
    if (status === 'Rejected') {
      feedback = window.prompt('(Optional) Provide feedback for the rejection:', '');
      // If user cancels, feedback will be null; if they enter empty string, it will be empty string
      if (feedback === null) {
        return; // User cancelled
      }
    }
    
    try {
      await api.reviewSubmission(submissionId, status, feedback);
      toast.success(`Submission marked as ${status}.`);
      fetchData();
    } catch (err) {
      console.error('Review failed:', err.response?.data?.msg);
      toast.error('Review failed: ' + (err.response?.data?.msg || 'Error'));
    }
  };

  // Handle bulk review (approve or reject multiple submissions)
  const handleBulkReview = async (status) => {
    if (selectedSubmissions.length === 0) {
      toast.warning('Please select at least one submission to review.');
      return;
    }

    const action = status === 'Approved' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${action} ${selectedSubmissions.length} submission(s)?`)) {
      return;
    }

    setIsProcessingBulk(true);
    try {
      // Include adminFeedback only if rejecting and feedback is provided
      const feedback = (status === 'Rejected' && adminFeedback.trim() !== '') ? adminFeedback.trim() : null;
      const response = await api.bulkReviewSubmissions(selectedSubmissions, status, feedback);
      const { processedCount, failedCount } = response.data;
      
      if (failedCount === 0) {
        toast.success(`Successfully ${action}d ${processedCount} submission(s).`);
      } else {
        toast.warning(`${action}d ${processedCount} submission(s), but ${failedCount} failed.`);
      }
      
      // Clear selection and feedback, then refresh data
      setSelectedSubmissions([]);
      setAdminFeedback(''); // Clear feedback field after submission
      // Refresh data and maintain current filter
      await fetchData();
    } catch (err) {
      console.error('Bulk review failed:', err.response?.data?.msg);
      toast.error('Bulk review failed: ' + (err.response?.data?.msg || 'Error'));
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Handle individual checkbox toggle
  const handleToggleSelection = (submissionId) => {
    setSelectedSubmissions(prev => {
      if (prev.includes(submissionId)) {
        return prev.filter(id => id !== submissionId);
      } else {
        return [...prev, submissionId];
      }
    });
  };

  // Handle select/deselect all
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedSubmissions(pendingSubmissions.map(sub => sub._id));
    } else {
      setSelectedSubmissions([]);
    }
  };

  // Check if all visible submissions are selected
  const allSelected = pendingSubmissions.length > 0 && selectedSubmissions.length === pendingSubmissions.length;
  const someSelected = selectedSubmissions.length > 0 && selectedSubmissions.length < pendingSubmissions.length;

  // Handle AI instruction generation
  const handleGenerateInstructions = async () => {
    const { title, taskType } = formData; // Get current title and task type from form state

    if (!title || !taskType) {
      toast.error('Please enter a Project Title and select a Task Type first.');
      return;
    }

    setIsGeneratingInstructions(true);
    try {
      const aiData = await api.generateInstructionsAI(title.trim(), taskType);

      // Update the form state with the AI-generated content
      setFormData(prevData => ({
        ...prevData,
        description: aiData.description,
        detailedInstructions: aiData.detailedInstructions
      }));

      toast.success('AI generated content successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'AI generation failed.');
    } finally {
      setIsGeneratingInstructions(false);
    }
  };

  // Handle test form input change
  const onTestDataChange = (e) => {
    const value = e.target.value;
    setNewTestData({ ...newTestData, [e.target.name]: value });
  };

  // Handle create/update qualification test
  const onSubmitTest = async (e) => {
    e.preventDefault();
    try {
      // Parse tasks JSON
      let parsedTasks = [];
      try {
        parsedTasks = JSON.parse(newTestData.tasks || '[]');
      } catch (parseErr) {
        toast.error('Invalid JSON format for tasks. Please check your input.');
        return;
      }

      const testPayload = {
        title: newTestData.title,
        projectDomain: newTestData.projectDomain,
        description: newTestData.description,
        tasks: parsedTasks,
        status: newTestData.status,
      };

      if (editingTest) {
        // UPDATE MODE
        await api.updateQualificationTest(editingTest._id, testPayload);
        toast.success('Qualification test updated successfully!');
      } else {
        // CREATE MODE
        await api.createQualificationTest(testPayload);
        toast.success('Qualification test created successfully!');
      }

      // Reset form
      setNewTestData({ title: '', projectDomain: 'General', description: '', tasks: '[]', status: 'Active' });
      setEditingTest(null);
      setTestEditMode(false);
      fetchQualificationTests();
    } catch (err) {
      console.error('Failed to save qualification test:', err.response?.data?.message);
      toast.error('Error: ' + (err.response?.data?.message || 'Failed to save qualification test'));
    }
  };

  // Handle edit test click
  const handleEditTestClick = (test) => {
    setNewTestData({
      title: test.title,
      projectDomain: test.projectDomain,
      description: test.description,
      tasks: JSON.stringify(test.tasks || [], null, 2),
      status: test.status,
    });
    setEditingTest(test);
    setTestEditMode(true);
    
    // Scroll to the edit form section
    setTimeout(() => {
      testEditFormRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  // Handle delete test
  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this qualification test? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteQualificationTest(testId);
      toast.success('Qualification test deleted successfully');
      fetchQualificationTests();
    } catch (err) {
      console.error('Delete test failed:', err.response?.data?.message);
      toast.error('Failed to delete test: ' + (err.response?.data?.message || 'Error'));
    }
  };

  // Fetch Pending Qualification Submissions
  const fetchPendingApplicants = async () => {
    try {
      const submissions = await api.getPendingQualificationSubmissions();
      setPendingApplicants(submissions || []);
    } catch (err) {
      console.error('Failed to fetch pending qualification submissions:', err);
      toast.error('Failed to fetch qualification submissions: ' + (err.response?.data?.message || 'Error'));
    }
  };

  // Handle opening review modal
  const handleReviewClick = (submission) => {
    setSelectedSubmission(submission);
    setAdminFeedback('');
    setIsReviewModalOpen(true);
  };

  // Handle approve submission
  const handleApproveSubmission = async () => {
    if (!selectedSubmission) return;

    setIsReviewing(true);
    try {
      const reviewData = {
        newStatus: 'Approved',
        adminFeedback: adminFeedback.trim() || undefined,
      };
      await api.reviewQualificationSubmission(selectedSubmission._id, reviewData);
      toast.success('Qualification submission approved successfully!');
      setIsReviewModalOpen(false);
      setSelectedSubmission(null);
      setAdminFeedback('');
      fetchPendingApplicants(); // Refresh the list
    } catch (err) {
      console.error('Approve submission failed:', err.response?.data?.message);
      toast.error('Failed to approve submission: ' + (err.response?.data?.message || 'Error'));
    } finally {
      setIsReviewing(false);
    }
  };

  // Handle reject submission
  const handleRejectSubmission = async () => {
    if (!selectedSubmission) return;

    setIsReviewing(true);
    try {
      const reviewData = {
        newStatus: 'Rejected',
        adminFeedback: adminFeedback.trim() || undefined,
      };
      await api.reviewQualificationSubmission(selectedSubmission._id, reviewData);
      toast.success('Qualification submission rejected.');
      setIsReviewModalOpen(false);
      setSelectedSubmission(null);
      setAdminFeedback('');
      fetchPendingApplicants(); // Refresh the list
    } catch (err) {
      console.error('Reject submission failed:', err.response?.data?.message);
      toast.error('Failed to reject submission: ' + (err.response?.data?.message || 'Error'));
    } finally {
      setIsReviewing(false);
    }
  };

  const handleApplicantReview = async (applicantId, status, skillDomain = null) => {
    try {
      await api.reviewApplicant(applicantId, status, skillDomain);
      toast.success(`Applicant successfully ${status}.`);
      fetchData();
    } catch (err) {
      console.error('Applicant review failed:', err.response?.data?.msg);
      toast.error('Review failed: ' + (err.response?.data?.msg || 'Error'));
    }
  };

  // Handle opening the approval modal
  const handleApproveClick = (applicant) => {
    setSelectedUser(applicant);
    setAssignedDomain('General'); // Reset to default
    setIsModalOpen(true);
  };

  // Handle confirming approval with domain assignment
  const handleConfirmApproval = async () => {
    if (!selectedUser) return;
    
    try {
      await handleApplicantReview(selectedUser._id, 'Accepted', assignedDomain);
      setIsModalOpen(false);
      setSelectedUser(null);
      setAssignedDomain('General'); // Reset
    } catch (err) {
      // Error handling is done in handleApplicantReview
    }
  };

  const handlePayoutReview = async (requestId, status) => {
    const action = status === 'Completed' ? 'complete' : 'reject';
    if (!window.confirm(`Are you sure you want to ${action} this payout request?`)) return;
    try {
      await api.reviewPayoutRequest(requestId, status);
      toast.success(`Payout request marked as ${status}.`);
      fetchData();
    } catch (err) {
      console.error('Payout review failed:', err.response?.data?.msg);
      toast.error('Payout review failed: ' + (err.response?.data?.msg || 'Error'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-6xl px-4 space-y-10"
      >
        {/* Header */}
        <motion.div variants={sectionVariants} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Admin</p>
            <h1 className="mt-2 text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {t('admin.adminDashboard')}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400 leading-relaxed">
              {t('admin.reviewSubmissions')}
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        {loading ? (
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </motion.div>
        ) : stats && (
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <StatCard
              title={t('admin.totalProjects')}
              count={loading ? '...' : stats.totalProjects || 0}
              accentBarClass="bg-violet-500"
              helper={t('admin.pendingSubmissions')}
              delay={0.1}
            />
            <StatCard
              title={t('admin.pendingSubmissions')}
              count={loading ? '...' : stats.pendingSubmissions || 0}
              accentBarClass="bg-emerald-500"
              helper={t('admin.reviewSubmissions')}
              delay={0.15}
            />
            <StatCard
              title={t('admin.totalApplicants')}
              count={loading ? '...' : stats.totalApplicants || 0}
              accentBarClass="bg-indigo-500"
              helper={t('admin.applicantManagement')}
              delay={0.2}
            />
            <StatCard
              title={t('admin.pendingPayouts')}
              count={loading ? '...' : stats.pendingPayouts || 0}
              accentBarClass="bg-rose-500"
              helper={t('admin.payoutManagement')}
              delay={0.25}
            />
          </motion.div>
        )}

        {/* Applicants Section - Qualification Submissions */}
        <motion.section variants={sectionVariants} className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
          
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">{t('admin.applicantManagement')}</h2>
              <p className="mt-1 text-sm text-slate-400">Review qualification test submissions</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-500/30 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              {pendingApplicants.length} pending
            </span>
          </div>

          <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50">
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700/50">
                <thead className="bg-slate-900/80">
                  <tr>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      User Email
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Test Name
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Domain
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-300">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 bg-slate-800/50">
                  {pendingApplicants.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                        No pending qualification submissions found.
                      </td>
                    </tr>
                  ) : (
                    pendingApplicants.map((applicant) => (
                      <tr key={applicant._id} className="hover:bg-slate-800/70 transition-colors duration-150">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-white">
                          {applicant.user?.email || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                          {applicant.test?.title || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getProjectDomainBadgeClass(applicant.test?.projectDomain || 'General')}`}>
                            {applicant.test?.projectDomain || 'General'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <motion.button
                              type="button"
                              onClick={() => handleReviewClick(applicant)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={pillPrimaryClasses}
                            >
                              Review
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* Payout Requests Section */}
        <motion.section variants={sectionVariants} className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
          
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">{t('admin.payoutManagement')}</h2>
              <p className="mt-1 text-sm text-slate-400">{t('admin.reviewSubmissions')}</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-500/30 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              {payoutRequests.length} queued
            </span>
          </div>

          <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50">
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700/50">
                <thead className="bg-slate-900/80">
                  <tr>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      {t('admin.user')}
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      {t('admin.amount')}
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      {t('profile.paymentMethod')}
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      {t('profile.paymentDetails')}
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      {t('admin.requestedAt')}
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-300">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 bg-slate-800/50">
                  {payoutRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                        {t('admin.noPayouts')}
                      </td>
                    </tr>
                  ) : (
                    payoutRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-slate-800/70 transition-colors duration-150">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-white">{req.user?.email || 'Unknown'}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-emerald-400">
                          {typeof req.amount === 'number'
                            ? formatCurrency(req.amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '—'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">{req.user?.paymentMethod || 'Not provided'}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">{req.user?.paymentIdentifier || 'Not provided'}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-400">{formatDate(req.createdAt)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <motion.button
                              type="button"
                              onClick={() => handlePayoutReview(req._id, 'Completed')}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={pillPrimaryClasses}
                            >
                              {t('wallet.completed')}
                            </motion.button>
                            <motion.button
                              type="button"
                              onClick={() => handlePayoutReview(req._id, 'Rejected')}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={pillNegativeClasses}
                            >
                              {t('admin.reject')}
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* Submissions Section */}
        <motion.section variants={sectionVariants} className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
          
          <div className="relative flex flex-col gap-4 mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{t('admin.submissionsAwaitingReview')}</h2>
                <p className="mt-1 text-sm text-slate-400">{t('admin.reviewSubmissions')}</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-500/30 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                {pendingSubmissions.length} {triageStatusFilter === 'ALL' ? 'total' : triageStatusFilter === 'PENDING' ? 'pending' : 'rejected'}
              </span>
            </div>

            {/* Triage Status Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
              <motion.button
                onClick={() => handleTriageStatusFilterChange('PENDING')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  triageStatusFilter === 'PENDING'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                }`}
              >
                PENDING
              </motion.button>
              <motion.button
                onClick={() => handleTriageStatusFilterChange('REJECTED')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  triageStatusFilter === 'REJECTED'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                }`}
              >
                REJECTED
              </motion.button>
              <motion.button
                onClick={() => handleTriageStatusFilterChange('ALL')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  triageStatusFilter === 'ALL'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                }`}
              >
                ALL
              </motion.button>
            </div>
          </div>

          {/* Bulk Action Buttons */}
          {selectedSubmissions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm p-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-emerald-300">
                    {selectedSubmissions.length} submission{selectedSubmissions.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    type="button"
                    onClick={() => handleBulkReview('Approved')}
                    disabled={isProcessingBulk}
                    whileHover={isProcessingBulk ? {} : { scale: 1.05 }}
                    whileTap={isProcessingBulk ? {} : { scale: 0.95 }}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingBulk ? (
                      <span className="flex items-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        {t('admin.processing')}
                      </span>
                    ) : (
                      `${t('admin.bulkApprove')} (${selectedSubmissions.length})`
                    )}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => handleBulkReview('Rejected')}
                    disabled={isProcessingBulk}
                    whileHover={isProcessingBulk ? {} : { scale: 1.05 }}
                    whileTap={isProcessingBulk ? {} : { scale: 0.95 }}
                    className="inline-flex items-center justify-center rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition-all duration-300 hover:bg-rose-400 hover:shadow-xl hover:shadow-rose-500/40 focus:outline-none focus:ring-2 focus:ring-rose-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingBulk ? (
                      <span className="flex items-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        {t('admin.processing')}
                      </span>
                    ) : (
                      `${t('admin.bulkReject')} (${selectedSubmissions.length})`
                    )}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setSelectedSubmissions([]);
                      setAdminFeedback(''); // Clear feedback when clearing selection
                    }}
                    disabled={isProcessingBulk}
                    whileHover={isProcessingBulk ? {} : { scale: 1.05 }}
                    whileTap={isProcessingBulk ? {} : { scale: 0.95 }}
                    className="inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-800/50 px-4 py-2.5 text-sm font-semibold text-slate-200 shadow-sm transition-all duration-300 hover:border-slate-500 hover:bg-slate-700/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('admin.clearSelection')}
                  </motion.button>
                </div>
              </div>
              {/* Admin Feedback Textarea - Show when submissions are selected */}
              {selectedSubmissions.length > 0 && (
                <div className="mt-4">
                  <label htmlFor="bulkAdminFeedback" className="block text-sm font-medium text-slate-300 mb-2">
                    Rejection Feedback (Optional)
                  </label>
                  <textarea
                    id="bulkAdminFeedback"
                    className={`${inputClasses} min-h-[100px] resize-y`}
                    placeholder="(Optional) Provide feedback for all selected submissions when rejecting..."
                    value={adminFeedback}
                    onChange={(e) => setAdminFeedback(e.target.value)}
                    disabled={isProcessingBulk}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    This feedback will be applied to all selected submissions when rejecting.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {loading ? (
            <SkeletonTable columns={6} rows={10} />
          ) : (
            <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50">
              <div className="max-w-full overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700/50">
                  <thead className="bg-slate-900/80">
                    <tr>
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(input) => {
                              if (input) input.indeterminate = someSelected;
                            }}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-0 cursor-pointer"
                          />
                          <span>{t('admin.selectAll')}</span>
                        </div>
                      </th>
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                        {t('project.title')}
                      </th>
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                        {t('admin.user')}
                      </th>
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                        {t('admin.submission')}
                      </th>
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                        {t('admin.aiQuality')}
                      </th>
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                        Triage Status
                      </th>
                      <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-300">
                        {t('admin.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50 bg-slate-800/50">
                    {pendingSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                        {t('admin.noSubmissions')}
                      </td>
                    </tr>
                  ) : (
                    pendingSubmissions.map((sub) => {
                      const preview = sub.content ? `${sub.content.slice(0, 140)}${sub.content.length > 140 ? '…' : ''}` : '—';
                      const isSelected = selectedSubmissions.includes(sub._id);
                      
                      // Determine badge color based on AI score
                      const getAIBadgeClasses = (score) => {
                        if (score === null || score === undefined) {
                          return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
                        }
                        if (score >= 90) {
                          return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                        } else if (score >= 80) {
                          return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                        } else {
                          return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                        }
                      };

                      // Determine badge color based on triage status
                      const getTriageBadgeClasses = (triageStatus) => {
                        if (!triageStatus || triageStatus === 'PENDING') {
                          return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                        } else if (triageStatus === 'APPROVED') {
                          return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                        } else if (triageStatus === 'REJECTED') {
                          return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                        }
                        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
                      };

                      return (
                        <tr 
                          key={sub._id} 
                          className={`hover:bg-slate-800/70 transition-colors duration-150 ${isSelected ? 'bg-emerald-500/10' : ''}`}
                        >
                          <td className="whitespace-nowrap px-6 py-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelection(sub._id)}
                              disabled={isProcessingBulk}
                              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-white">{sub.project.title}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">{sub.user.email}</td>
                          <td className="px-6 py-4 align-top text-sm text-slate-400 max-w-md">
                            <div className="space-y-2">
                              <p className="line-clamp-2">{preview}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top">
                            {sub.aiScore !== null && sub.aiScore !== undefined ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-sm ${getAIBadgeClasses(sub.aiScore)}`}
                                  >
                                    {sub.aiScore}%
                                  </motion.span>
                                  {/* Consistency Warning Badge */}
                                  {sub.consistencyWarning && (
                                    <motion.span
                                      initial={{ scale: 0, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                                      className="inline-flex items-center gap-1 rounded-full border border-rose-500/50 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 shadow-lg backdrop-blur-sm"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                      {t('admin.lowEffortDetected')}
                                    </motion.span>
                                  )}
                                </div>
                                {sub.aiFeedback && (
                                  <p className="text-xs text-slate-400 max-w-xs line-clamp-2 mt-2">
                                    {sub.aiFeedback}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 italic">Loading AI score...</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getTriageBadgeClasses(sub.triageStatus)}`}>
                              {sub.triageStatus || 'PENDING'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <motion.button
                                type="button"
                                onClick={() => {
                                  setSelectedSubmissionContent(sub.content || '');
                                  setIsViewModalOpen(true);
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={pillNeutralClasses}
                              >
                                View
                              </motion.button>
                              <motion.button
                                type="button"
                                onClick={() => handleReview(sub._id, 'Approved')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={pillPositiveClasses}
                              >
                                {t('admin.approve')}
                              </motion.button>
                              <motion.button
                                type="button"
                                onClick={() => handleReview(sub._id, 'Rejected')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={pillNegativeClasses}
                              >
                                {t('admin.reject')}
                              </motion.button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </motion.section>

        {/* Projects List Section */}
        <motion.section variants={sectionVariants} className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
          
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">{t('admin.projectManagement')}</h2>
              <p className="mt-1 text-sm text-slate-400">{t('admin.reviewSubmissions')}</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-500/30 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              {projects.length} total
            </span>
          </div>

          <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50">
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700/50">
                <thead className="bg-slate-900/80">
                  <tr>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      {t('project.title')}
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      {t('project.taskType')}
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      {t('project.payRate')}
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Repeatable
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      {t('project.status')}
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      SKILL DOMAIN
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-300">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 bg-slate-800/50">
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                        {t('admin.noProjects')}
                      </td>
                    </tr>
                  ) : (
                    projects.map((project) => (
                      <tr key={project._id} className="hover:bg-slate-800/70 transition-colors duration-150">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-white">{project.title}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">{project.taskType?.replace(/_/g, ' ') || 'N/A'}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-emerald-400">
                          {typeof project.payRate === 'number' ? formatCurrency(project.payRate) : 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                            project.isRepeatable !== false
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}>
                            {project.isRepeatable !== false ? 'Repeatable' : 'One-time'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                              project.status === 'Available'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : project.status === 'Completed'
                                ? 'bg-slate-700/50 text-slate-300 border-slate-600/50'
                                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            }`}
                          >
                            {project.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getProjectDomainBadgeClass(project.projectDomain || 'General')}`}>
                            {project.projectDomain || 'General'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <motion.button
                              type="button"
                              onClick={() => handleEditClick(project)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={pillPrimaryClasses}
                            >
                              {t('admin.edit')}
                            </motion.button>
                            <motion.button
                              type="button"
                              onClick={() => handleDeleteProject(project._id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={pillNegativeClasses}
                            >
                              Delete
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* Create Project Form Section */}
        <motion.section variants={sectionVariants} className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
          
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">{editMode ? t('project.editProject') : t('admin.createNewProject')}</h2>
              <p className="mt-1 text-sm text-slate-400">{t('admin.reviewSubmissions')}</p>
            </div>
            {editMode && (
              <motion.button
                onClick={() => {
                  setEditMode(false);
                  setEditingProject(null);
                  setFormData({ title: '', description: '', detailedInstructions: '', payRate: 20, paymentType: 'PER_TASK', projectDomain: 'General', taskContent: '', taskType: 'Chat_Sentiment', isRepeatable: true, maxTotalSubmissions: '' });
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={secondaryButtonClasses}
              >
                {t('common.cancel')}
              </motion.button>
            )}
          </div>

          <form ref={editFormRef} onSubmit={onSubmit} className="relative mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
                  {t('project.title')}
                </label>
                <div className="flex items-end gap-2">
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={title}
                    onChange={onChange}
                    className={inputClasses}
                    placeholder="e.g., Sentiment Analysis for Customer Support"
                    required
                  />
                  <motion.button
                    type="button"
                    onClick={handleGenerateInstructions}
                    disabled={isGeneratingInstructions || !title.trim() || !taskType}
                    whileHover={isGeneratingInstructions || !title.trim() || !taskType ? {} : { scale: 1.05 }}
                    whileTap={isGeneratingInstructions || !title.trim() || !taskType ? {} : { scale: 0.95 }}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isGeneratingInstructions ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        ✨ AI Generate
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                  {t('project.description')}
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={onChange}
                  rows="4"
                  className={`${inputClasses} min-h-[120px] resize-y`}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="detailedInstructions" className="block text-sm font-medium text-slate-300 mb-2">
                  Detailed Instructions / التعليمات التفصيلية (Sidebar Content)
                </label>
                <textarea
                  id="detailedInstructions"
                  name="detailedInstructions"
                  value={detailedInstructions}
                  onChange={onChange}
                  rows="6"
                  className={`${inputClasses} min-h-[180px] resize-y`}
                  placeholder="Enter detailed instructions for the sidebar..."
                />
              </div>

              <div>
                <label htmlFor="taskType" className="block text-sm font-medium text-slate-300 mb-2">
                  {t('project.taskType')}
                </label>
                <select
                  id="taskType"
                  name="taskType"
                  value={taskType}
                  onChange={onChange}
                  className={inputClasses}
                  required
                >
                  <option value="Chat_Sentiment">Chat Sentiment Analysis</option>
                  <option value="Text_Classification">Text Classification</option>
                  <option value="Code_Evaluation">Code Evaluation</option>
                  <option value="Image_Annotation">Image Annotation</option>
                  <option value="Model_Comparison">AI Model Comparison</option>
                </select>
              </div>

              <div>
                <label htmlFor="paymentType" className="block text-sm font-medium text-slate-300 mb-2">
                  Payment Type
                </label>
                <select
                  id="paymentType"
                  name="paymentType"
                  value={paymentType}
                  onChange={onChange}
                  className={inputClasses}
                  required
                >
                  <option value="PER_TASK">Per Task</option>
                  <option value="HOURLY">Hourly</option>
                </select>
              </div>

              <div>
                <label htmlFor="projectDomain" className="block text-sm font-medium text-slate-300 mb-2">
                  Project Domain (مجال المشروع)
                </label>
                <select
                  id="projectDomain"
                  name="projectDomain"
                  value={projectDomain}
                  onChange={onChange}
                  className={inputClasses}
                  required
                >
                  <option value="General">General (عام)</option>
                  <option value="Programming">Programming (برمجة)</option>
                  <option value="Business">Business (أعمال)</option>
                  <option value="Law">Law (قانون)</option>
                  <option value="Health">Health (صحة)</option>
                </select>
              </div>

              <div>
                <label htmlFor="payRate" className="block text-sm font-medium text-slate-300 mb-2">
                  {paymentType === 'HOURLY' ? 'Pay Rate ($/Hour)' : 'Pay Rate ($/Task)'}
                </label>
                <input
                  type="number"
                  id="payRate"
                  name="payRate"
                  value={payRate}
                  onChange={onChange}
                  className={inputClasses}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="isRepeatable"
                    name="isRepeatable"
                    checked={isRepeatable}
                    onChange={onChange}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-slate-300">
                    Allow user to submit multiple times (Infinitely repeatable)
                  </span>
                </label>
                <p className="mt-2 text-xs text-slate-400 ml-8">
                  If unchecked, this task will be hidden from the user's dashboard after their first completed submission (one-time submission only).
                </p>
              </div>

              <div>
                <label htmlFor="maxTotalSubmissions" className="block text-sm font-medium text-slate-300 mb-2">
                  Total Submissions Limit (Optional)
                </label>
                <input
                  type="number"
                  id="maxTotalSubmissions"
                  name="maxTotalSubmissions"
                  value={maxTotalSubmissions}
                  onChange={onChange}
                  className={inputClasses}
                  min="1"
                  placeholder="Leave blank for no limit"
                />
                <p className="mt-2 text-xs text-slate-400">
                  The total number of submissions this project will accept from all users. Leave blank for no limit.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="taskPoolData" className="block text-sm font-medium text-slate-300 mb-2">
                  Task Pool Data (JSON Array)
                </label>
                <textarea
                  id="taskPoolData"
                  name="taskPoolData"
                  value={taskPoolData}
                  onChange={onChange}
                  rows="8"
                  className={`${inputClasses} min-h-[200px] resize-y font-mono text-xs`}
                  placeholder={JSON.stringify([
                    { "content": "Describe this image in detail.", "imageUrl": "https://example.com/img1.jpg" },
                    { "content": "What is the primary action shown?", "imageUrl": "https://example.com/img2.jpg" }
                  ], null, 2)}
                />
                <p className="mt-2 text-xs text-slate-400">
                  Enter a JSON array of task objects. Each object should have: <code className="text-emerald-400">content</code> (required), <code className="text-emerald-400">imageUrl</code> (optional), and <code className="text-emerald-400">isAssigned</code> (optional, defaults to false).
                </p>
              </div>
            </div>

            <div className="flex flex-col items-stretch justify-end gap-3 sm:flex-row pt-4">
              {editMode && (
                <motion.button
                  type="button"
                  onClick={() => {
                    setFormData({
                      title: '', description: '', detailedInstructions: '', payRate: 20, paymentType: 'PER_TASK', projectDomain: 'General', taskContent: '',
                      taskType: 'Chat_Sentiment', isRepeatable: true
                    });
                    setEditingProject(null);
                    setEditMode(false);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${secondaryButtonClasses} w-full sm:w-auto`}
                >
                  {t('common.cancel')}
                </motion.button>
              )}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`${primaryButtonClasses} w-full sm:w-auto`}
              >
                {editMode ? t('project.editProject') : t('project.createProject')}
              </motion.button>
            </div>
          </form>
        </motion.section>

        {/* Qualification Tests List Section */}
        <motion.section variants={sectionVariants} className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
          
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Qualification Test Management</h2>
              <p className="mt-1 text-sm text-slate-400">Manage qualification tests for applicants</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-500/30 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              {qualTests.length} total
            </span>
          </div>

          <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50">
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700/50">
                <thead className="bg-slate-900/80">
                  <tr>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Title
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Project Domain
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Status
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Tasks Count
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Created By
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-300">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 bg-slate-800/50">
                  {qualTests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                        No qualification tests found.
                      </td>
                    </tr>
                  ) : (
                    qualTests.map((test) => (
                      <tr key={test._id} className="hover:bg-slate-800/70 transition-colors duration-150">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-white">{test.title}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getProjectDomainBadgeClass(test.projectDomain || 'General')}`}>
                            {test.projectDomain || 'General'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                              test.status === 'Active'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                            }`}
                          >
                            {test.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                          {test.tasks ? test.tasks.length : 0}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                          {test.createdBy ? (
                            typeof test.createdBy === 'object' 
                              ? `${test.createdBy.firstName || ''} ${test.createdBy.lastName || ''}`.trim() || test.createdBy.email
                              : 'N/A'
                          ) : 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <motion.button
                              type="button"
                              onClick={() => handleEditTestClick(test)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={pillPrimaryClasses}
                            >
                              {t('admin.edit')}
                            </motion.button>
                            <motion.button
                              type="button"
                              onClick={() => handleDeleteTest(test._id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={pillNegativeClasses}
                            >
                              Delete
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* Create Qualification Test Form Section */}
        <motion.section variants={sectionVariants} className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
          
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">{testEditMode ? 'Edit Qualification Test' : 'Create New Qualification Test'}</h2>
              <p className="mt-1 text-sm text-slate-400">Create or edit qualification tests for applicants</p>
            </div>
            {testEditMode && (
              <motion.button
                onClick={() => {
                  setTestEditMode(false);
                  setEditingTest(null);
                  setNewTestData({ title: '', projectDomain: 'General', description: '', tasks: '[]', status: 'Active' });
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={secondaryButtonClasses}
              >
                {t('common.cancel')}
              </motion.button>
            )}
          </div>

          <form ref={testEditFormRef} onSubmit={onSubmitTest} className="relative mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="testTitle" className="block text-sm font-medium text-slate-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="testTitle"
                  name="title"
                  value={newTestData.title}
                  onChange={onTestDataChange}
                  className={inputClasses}
                  placeholder="e.g., Programming Qualification Test"
                  required
                />
              </div>

              <div>
                <label htmlFor="testProjectDomain" className="block text-sm font-medium text-slate-300 mb-2">
                  Project Domain
                </label>
                <select
                  id="testProjectDomain"
                  name="projectDomain"
                  value={newTestData.projectDomain}
                  onChange={onTestDataChange}
                  className={inputClasses}
                  required
                >
                  <option value="General">General (عام)</option>
                  <option value="Programming">Programming (برمجة)</option>
                  <option value="Business">Business (أعمال)</option>
                  <option value="Law">Law (قانون)</option>
                  <option value="Health">Health (صحة)</option>
                </select>
              </div>

              <div>
                <label htmlFor="testStatus" className="block text-sm font-medium text-slate-300 mb-2">
                  Status
                </label>
                <select
                  id="testStatus"
                  name="status"
                  value={newTestData.status}
                  onChange={onTestDataChange}
                  className={inputClasses}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="testDescription" className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  id="testDescription"
                  name="description"
                  value={newTestData.description}
                  onChange={onTestDataChange}
                  rows="4"
                  className={`${inputClasses} min-h-[120px] resize-y`}
                  placeholder="Enter test description..."
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="testTasks" className="block text-sm font-medium text-slate-300 mb-2">
                  Tasks (JSON Array)
                </label>
                <textarea
                  id="testTasks"
                  name="tasks"
                  value={newTestData.tasks}
                  onChange={onTestDataChange}
                  rows="8"
                  className={`${inputClasses} min-h-[200px] resize-y font-mono text-xs`}
                  placeholder={JSON.stringify([
                    { "content": "What is React?", "imageUrl": "" },
                    { "content": "Explain the concept of state management.", "imageUrl": "" }
                  ], null, 2)}
                  required
                />
                <p className="mt-2 text-xs text-slate-400">
                  Enter a JSON array of task objects. Each object should have: <code className="text-emerald-400">content</code> (required), <code className="text-emerald-400">imageUrl</code> (optional).
                </p>
              </div>
            </div>

            <div className="flex flex-col items-stretch justify-end gap-3 sm:flex-row pt-4">
              {testEditMode && (
                <motion.button
                  type="button"
                  onClick={() => {
                    setNewTestData({ title: '', projectDomain: 'General', description: '', tasks: '[]', status: 'Active' });
                    setEditingTest(null);
                    setTestEditMode(false);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${secondaryButtonClasses} w-full sm:w-auto`}
                >
                  {t('common.cancel')}
                </motion.button>
              )}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`${primaryButtonClasses} w-full sm:w-auto`}
              >
                {testEditMode ? 'Update Test' : 'Create Test'}
              </motion.button>
            </div>
          </form>
        </motion.section>

        {/* Global Activity Feed Section */}
        <motion.section variants={sectionVariants} className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
          
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Global Activity Feed</h2>
              <p className="mt-1 text-sm text-slate-400">Complete history of all submissions</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-blue-500/20 border border-blue-500/30 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-300">
              {activityFeed.length} activities
            </span>
          </div>

          <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50">
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700/50">
                <thead className="bg-slate-800/80">
                  <tr>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Project Title
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      User
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Status
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      AI Score
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Reviewed By
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 bg-slate-800/50">
                  {activityFeed.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                        No submissions found.
                      </td>
                    </tr>
                  ) : (
                    activityFeed.map((sub) => {
                      // Determine badge color based on status
                      const getStatusBadgeClasses = (status) => {
                        switch (status) {
                          case 'Approved':
                            return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                          case 'Rejected':
                            return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                          case 'Pending':
                            return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                          default:
                            return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
                        }
                      };

                      return (
                        <tr key={sub._id} className="hover:bg-slate-800/70 transition-colors duration-150">
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-white">
                            {sub.project?.title || '—'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                            {sub.user?.email || '—'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${getStatusBadgeClasses(sub.status)}`}>
                              {sub.status || '—'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                            {sub.aiScore !== null && sub.aiScore !== undefined ? `${sub.aiScore}%` : '—'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                            {sub.reviewedBy?.email || 'N/A'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                            {formatDate(sub.createdAt)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>
      </motion.div>

      {/* Assign Domain Modal */}
      {isModalOpen && selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative rounded-3xl border border-slate-700/50 bg-slate-800/95 backdrop-blur-xl p-8 shadow-2xl shadow-black/50 max-w-md w-full mx-4"
          >
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-white mb-2">
              Assign Skill Domain
            </h2>
            <p className="text-slate-400 mb-6">
              Please assign a skill domain for <span className="text-emerald-400 font-semibold">{selectedUser.email}</span>
            </p>

            <div className="space-y-6">
              <div>
                <label htmlFor="domainSelect" className="block text-sm font-medium text-slate-300 mb-2">
                  Assign Domain
                </label>
                <select
                  id="domainSelect"
                  value={assignedDomain}
                  onChange={(e) => setAssignedDomain(e.target.value)}
                  className={inputClasses}
                >
                  <option value="General">General (عام)</option>
                  <option value="Programming">Programming (برمجة)</option>
                  <option value="Business">Business (أعمال)</option>
                  <option value="Law">Law (قانون)</option>
                  <option value="Health">Health (صحة)</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <motion.button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${secondaryButtonClasses} w-full sm:w-auto`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleConfirmApproval}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${primaryButtonClasses} w-full sm:w-auto`}
                >
                  Confirm Approval
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* View Full Submission Modal */}
      {isViewModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsViewModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative rounded-3xl border border-slate-700/50 bg-slate-800/95 backdrop-blur-xl p-8 shadow-2xl shadow-black/50 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
          >
            {/* Close button */}
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors duration-200 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-white mb-4 pr-8">
              Full Submission Content
            </h2>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
              <pre className="text-sm text-slate-200 whitespace-pre-wrap break-words font-mono">
                {selectedSubmissionContent || 'No content available.'}
              </pre>
            </div>

            {/* Close button at bottom */}
            <div className="mt-6 flex justify-end">
              <motion.button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={secondaryButtonClasses}
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* View Full Application Modal */}
      {isViewApplicantModalOpen && selectedApplicantData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsViewApplicantModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative rounded-3xl border border-slate-700/50 bg-slate-800/95 backdrop-blur-xl p-8 shadow-2xl shadow-black/50 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
          >
            {/* Close button */}
            <button
              onClick={() => setIsViewApplicantModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors duration-200 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-white mb-6 pr-8">
              Full Application Details
            </h2>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Applicant Email */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Email
                </h3>
                <p className="text-base text-white">{selectedApplicantData.email || 'N/A'}</p>
              </div>

              {/* AI Score */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  AI Score
                </h3>
                <span className="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-sm font-semibold text-emerald-300">
                  {selectedApplicantData.aiScore ?? 'N/A'}%
                </span>
              </div>

              {/* Professional Bio */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Professional Bio
                </h3>
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
                  {selectedApplicantData.bio ? (
                    <pre className="text-sm text-slate-200 whitespace-pre-wrap break-words font-sans">
                      {selectedApplicantData.bio}
                    </pre>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No bio provided.</p>
                  )}
                </div>
              </div>

              {/* Test Answer */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Test Answer
                </h3>
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
                  {selectedApplicantData.testAnswer ? (
                    <pre className="text-sm text-slate-200 whitespace-pre-wrap break-words font-sans">
                      {selectedApplicantData.testAnswer}
                    </pre>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No answer provided.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Close button at bottom */}
            <div className="mt-6 flex justify-end">
              <motion.button
                type="button"
                onClick={() => setIsViewApplicantModalOpen(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={secondaryButtonClasses}
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Review Qualification Submission Modal */}
      {isReviewModalOpen && selectedSubmission && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !isReviewing && setIsReviewModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative rounded-3xl border border-slate-700/50 bg-slate-800/95 backdrop-blur-xl p-8 shadow-2xl shadow-black/50 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
          >
            {/* Close button */}
            <button
              onClick={() => !isReviewing && setIsReviewModalOpen(false)}
              disabled={isReviewing}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors duration-200 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-white mb-2 pr-8">
              Review Qualification Submission
            </h2>
            <p className="text-slate-400 mb-6">
              Reviewing submission from <span className="text-emerald-400 font-semibold">{selectedSubmission.user?.email || 'N/A'}</span>
            </p>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Test Information */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Test Information
                </h3>
                <div className="space-y-2">
                  <p className="text-base text-white">
                    <span className="text-slate-400">Test:</span> {selectedSubmission.test?.title || 'N/A'}
                  </p>
                  <p className="text-base text-white">
                    <span className="text-slate-400">Domain:</span>{' '}
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getProjectDomainBadgeClass(selectedSubmission.test?.projectDomain || 'General')}`}>
                      {selectedSubmission.test?.projectDomain || 'General'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Submission Content */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Submission Content
                </h3>
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
                  {selectedSubmission.submissionContent ? (
                    <pre className="text-sm text-slate-200 whitespace-pre-wrap break-words font-mono max-h-96 overflow-y-auto">
                      {selectedSubmission.submissionContent}
                    </pre>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No content provided.</p>
                  )}
                </div>
              </div>

              {/* Admin Feedback */}
              <div>
                <label htmlFor="adminFeedback" className="block text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Admin Feedback (Optional)
                </label>
                <textarea
                  id="adminFeedback"
                  className={`${inputClasses} min-h-[120px] resize-y`}
                  placeholder="Enter feedback for the applicant (optional)..."
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  disabled={isReviewing}
                />
                <p className="mt-2 text-xs text-slate-400">
                  This feedback will be visible to the applicant if provided.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-700/50">
              <motion.button
                type="button"
                onClick={() => !isReviewing && setIsReviewModalOpen(false)}
                disabled={isReviewing}
                whileHover={isReviewing ? {} : { scale: 1.05 }}
                whileTap={isReviewing ? {} : { scale: 0.95 }}
                className={`${secondaryButtonClasses} w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                onClick={handleRejectSubmission}
                disabled={isReviewing}
                whileHover={isReviewing ? {} : { scale: 1.05 }}
                whileTap={isReviewing ? {} : { scale: 0.95 }}
                className={`${pillNegativeClasses} w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isReviewing ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                    />
                    Processing...
                  </span>
                ) : (
                  'Reject'
                )}
              </motion.button>
              <motion.button
                type="button"
                onClick={handleApproveSubmission}
                disabled={isReviewing}
                whileHover={isReviewing ? {} : { scale: 1.05 }}
                whileTap={isReviewing ? {} : { scale: 0.95 }}
                className={`${primaryButtonClasses} w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isReviewing ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Processing...
                  </span>
                ) : (
                  'Approve'
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
