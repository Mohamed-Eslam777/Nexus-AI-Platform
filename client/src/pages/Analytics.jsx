import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { fetchProjectPerformanceAnalytics, fetchUserAnalytics, fetchFreelancerPerformanceAnalytics } from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const statCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
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

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const StatCard = ({ title, value, isCurrency, isPercentage, accentBarClass, helper }) => (
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
        {isCurrency ? formatCurrency(value) : isPercentage ? `${value?.toFixed(2) || 0}%` : value ?? '—'}
      </p>
      {helper ? <p className="text-xs text-slate-400">{helper}</p> : null}
    </div>
  </motion.div>
);

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [freelancerData, setFreelancerData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Get user from JWT token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUser(decoded.user);
    } catch (error) {
      console.error('Invalid token');
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      if (user.role === 'admin' || user.role === 'Admin') {
        // Admin logic: Fetch both project and freelancer analytics concurrently
        const [projectResponse, freelancerResponse] = await Promise.all([
          fetchProjectPerformanceAnalytics(),
          fetchFreelancerPerformanceAnalytics()
        ]);
        
        if (projectResponse.data.success) {
          setAnalyticsData(projectResponse.data.data || []);
        } else {
          throw new Error('Failed to fetch project analytics data');
        }
        
        if (freelancerResponse.data.success) {
          setFreelancerData(freelancerResponse.data.data || []);
        } else {
          throw new Error('Failed to fetch freelancer analytics data');
        }
      } else {
        // User (Freelancer) logic: Fetch personal analytics
        const response = await fetchUserAnalytics();
        setUserAnalytics(response.data || {});
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics');
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Unauthorized. Please log in.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error('Failed to load analytics. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Calculate overall KPIs from analyticsData (for admin)
  const overallKPIs = analyticsData.reduce(
    (acc, project) => ({
      totalPayout: acc.totalPayout + (project.totalPaid || 0),
      totalApproved: acc.totalApproved + (project.approvedSubmissions || 0),
      totalRejected: acc.totalRejected + (project.rejectedSubmissions || 0),
      totalPending: acc.totalPending + (project.pendingSubmissions || 0),
      totalSubmissions: acc.totalSubmissions + (project.totalSubmissions || 0),
    }),
    {
      totalPayout: 0,
      totalApproved: 0,
      totalRejected: 0,
      totalPending: 0,
      totalSubmissions: 0,
    }
  );

  const overallApprovalRate =
    overallKPIs.totalSubmissions > 0
      ? (overallKPIs.totalApproved / overallKPIs.totalSubmissions) * 100
      : 0;

  // Prepare chart data for Top 10 Projects by Total Payout (admin)
  const top10Projects = analyticsData.slice(0, 10);
  const adminChartData = {
    labels: top10Projects.map((p) => p.title || 'Untitled Project'),
    datasets: [
      {
        label: 'Total Payout ($)',
        data: top10Projects.map((p) => p.totalPaid || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const adminChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: {
            size: 14,
            weight: 500,
          },
        },
      },
      title: {
        display: true,
        text: 'Top 10 Projects by Total Payout',
        color: '#ffffff',
        font: {
          size: 18,
          weight: 'bold',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(100, 116, 139, 0.5)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context) {
            return `Total Paid: ${formatCurrency(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#94a3b8',
          font: {
            size: 12,
          },
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: 'rgba(100, 116, 139, 0.2)',
        },
      },
      y: {
        ticks: {
          color: '#94a3b8',
          font: {
            size: 12,
          },
          callback: function (value) {
            return formatCurrency(value);
          },
        },
        grid: {
          color: 'rgba(100, 116, 139, 0.2)',
        },
      },
    },
  };

  // Prepare Doughnut chart data for user analytics
  const userDoughnutData = userAnalytics
    ? {
        labels: ['Approved', 'Rejected', 'Pending'],
        datasets: [
          {
            label: 'Submissions',
            data: [
              userAnalytics.approvedSubmissions || 0,
              userAnalytics.rejectedSubmissions || 0,
              userAnalytics.pendingSubmissions || 0,
            ],
            backgroundColor: [
              'rgba(16, 185, 129, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(234, 179, 8, 0.8)',
            ],
            borderColor: [
              'rgba(16, 185, 129, 1)',
              'rgba(239, 68, 68, 1)',
              'rgba(234, 179, 8, 1)',
            ],
            borderWidth: 2,
          },
        ],
      }
    : null;

  const userDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: {
            size: 14,
            weight: 500,
          },
          padding: 15,
        },
      },
      title: {
        display: true,
        text: 'My Submissions Overview',
        color: '#ffffff',
        font: {
          size: 18,
          weight: 'bold',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(100, 116, 139, 0.5)',
        borderWidth: 1,
        padding: 12,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="space-y-4">
              <SkeletonLoader height="h-8" width="w-48" />
              <SkeletonLoader height="h-12" width="w-96" />
            </div>

            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonLoader key={i} height="h-32" className="rounded-3xl" />
              ))}
            </div>

            {/* Chart Skeleton */}
            <SkeletonLoader height="h-96" className="rounded-3xl" />

            {/* Table Skeleton */}
            <SkeletonLoader height="h-64" className="rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Admin Analytics */}
          {user && (user.role === 'admin' || user.role === 'Admin') && analyticsData && (
            <>
              {/* Header Section */}
              <motion.div variants={headerVariants} className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                    Analytics
                  </p>
                  <h1 className="mt-2 text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    Project Performance Analytics
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm text-slate-400 leading-relaxed">
                    Comprehensive performance metrics and insights for all projects
                  </p>
                </div>
              </motion.div>

              {/* KPI Cards */}
              <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
              >
                <StatCard
                  title="Total Payout"
                  value={overallKPIs.totalPayout}
                  isCurrency={true}
                  accentBarClass="bg-gradient-to-r from-emerald-500 to-emerald-400"
                  helper="Across all projects"
                />

                <StatCard
                  title="Total Approved"
                  value={overallKPIs.totalApproved}
                  isCurrency={false}
                  accentBarClass="bg-gradient-to-r from-indigo-500 to-blue-400"
                  helper="Approved submissions"
                />

                <StatCard
                  title="Overall Approval Rate"
                  value={overallApprovalRate}
                  isPercentage={true}
                  accentBarClass="bg-gradient-to-r from-purple-500 to-pink-400"
                  helper="Percentage of approved submissions"
                />

                <StatCard
                  title="Total Projects"
                  value={analyticsData.length}
                  isCurrency={false}
                  accentBarClass="bg-gradient-to-r from-cyan-500 to-blue-400"
                  helper="Projects with analytics"
                />
              </motion.div>

              {/* Bar Chart Section */}
              {top10Projects.length > 0 && (
                <motion.div
                  variants={headerVariants}
                  className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 overflow-hidden"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
                  <div className="relative">
                    <div style={{ height: '400px' }}>
                      <Bar data={adminChartData} options={adminChartOptions} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Detailed Table Section */}
              <motion.div
                variants={headerVariants}
                className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 overflow-hidden"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-transparent to-indigo-500/10 opacity-50 pointer-events-none" />
                <div className="relative">
                  <h2 className="text-xl font-semibold text-white mb-6">Project Performance Details</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="pb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide">
                            Project Title
                          </th>
                          <th className="pb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide text-center">
                            Total Submissions
                          </th>
                          <th className="pb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide text-center">
                            Approved
                          </th>
                          <th className="pb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide text-center">
                            Rejected
                          </th>
                          <th className="pb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide text-center">
                            Pending
                          </th>
                          <th className="pb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide text-center">
                            Approval Rate (%)
                          </th>
                          <th className="pb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide text-right">
                            Total Paid ($)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-8 text-center text-slate-400">
                              No project data available
                            </td>
                          </tr>
                        ) : (
                          analyticsData.map((project, index) => (
                            <tr
                              key={project._id || index}
                              className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                            >
                              <td className="py-4 text-sm font-medium text-white">
                                {project.title || 'Untitled Project'}
                              </td>
                              <td className="py-4 text-sm text-slate-300 text-center">
                                {project.totalSubmissions || 0}
                              </td>
                              <td className="py-4 text-sm text-emerald-400 text-center font-semibold">
                                {project.approvedSubmissions || 0}
                              </td>
                              <td className="py-4 text-sm text-red-400 text-center">
                                {project.rejectedSubmissions || 0}
                              </td>
                              <td className="py-4 text-sm text-yellow-400 text-center">
                                {project.pendingSubmissions || 0}
                              </td>
                              <td className="py-4 text-sm text-slate-300 text-center">
                                {project.approvalRate?.toFixed(2) || '0.00'}%
                              </td>
                              <td className="py-4 text-sm text-emerald-400 text-right font-semibold">
                                {formatCurrency(project.totalPaid || 0)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>

              {/* Top 10 Freelancers Table Section */}
              {freelancerData && freelancerData.length > 0 && (
                <motion.div
                  variants={headerVariants}
                  className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 overflow-hidden"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/10 via-transparent to-purple-500/10 opacity-50 pointer-events-none" />
                  <div className="relative">
                    <h2 className="text-xl font-semibold text-white mb-6">Top 10 Freelancers by Earnings</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="pb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide">
                              Rank
                            </th>
                            <th className="pb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide">
                              Name
                            </th>
                            <th className="pb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide">
                              Email
                            </th>
                            <th className="pb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide text-center">
                              Tier
                            </th>
                            <th className="pb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide text-center">
                              Approved
                            </th>
                            <th className="pb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide text-center">
                              Rejected
                            </th>
                            <th className="pb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide text-center">
                              Approval Rate (%)
                            </th>
                            <th className="pb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide text-right">
                              Total Earnings ($)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {freelancerData.map((freelancer, index) => (
                            <tr
                              key={freelancer.userId}
                              className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                            >
                              <td className="py-4 text-sm font-bold text-slate-400">
                                #{index + 1}
                              </td>
                              <td className="py-4 text-sm font-medium text-white">
                                {freelancer.name || freelancer.email || 'N/A'}
                              </td>
                              <td className="py-4 text-sm text-slate-300">
                                {freelancer.email || 'N/A'}
                              </td>
                              <td className="py-4 text-sm text-center">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  freelancer.tier === 'Elite' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                  freelancer.tier === 'Gold' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                  freelancer.tier === 'Silver' ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                                  'bg-amber-900/20 text-amber-700 border border-amber-900/30'
                                }`}>
                                  {freelancer.tier || 'Bronze'}
                                </span>
                              </td>
                              <td className="py-4 text-sm text-emerald-400 text-center font-semibold">
                                {freelancer.approvedSubmissions || 0}
                              </td>
                              <td className="py-4 text-sm text-red-400 text-center">
                                {freelancer.rejectedSubmissions || 0}
                              </td>
                              <td className="py-4 text-sm text-slate-300 text-center">
                                {freelancer.approvalRate?.toFixed(2) || '0.00'}%
                              </td>
                              <td className="py-4 text-sm text-emerald-400 text-right font-semibold">
                                {formatCurrency(freelancer.totalEarnings || 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* User Analytics (Freelancer) */}
          {user && user.role !== 'admin' && user.role !== 'Admin' && userAnalytics && (
            <>
              {/* Header Section */}
              <motion.div variants={headerVariants} className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                    Analytics
                  </p>
                  <h1 className="mt-2 text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    My Performance
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm text-slate-400 leading-relaxed">
                    Your personal performance metrics and earnings statistics
                  </p>
                </div>
              </motion.div>

              {/* KPI Cards */}
              <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
              >
                <StatCard
                  title="My Tier"
                  value={userAnalytics.tier || 'Bronze'}
                  isCurrency={false}
                  accentBarClass="bg-gradient-to-r from-amber-500 to-yellow-400"
                  helper="Gamification tier"
                />

                <StatCard
                  title="Total Earnings"
                  value={userAnalytics.totalEarnings || 0}
                  isCurrency={true}
                  accentBarClass="bg-gradient-to-r from-emerald-500 to-emerald-400"
                  helper="From approved submissions"
                />

                <StatCard
                  title="Approval Rate"
                  value={userAnalytics.approvalRate || 0}
                  isPercentage={true}
                  accentBarClass="bg-gradient-to-r from-purple-500 to-pink-400"
                  helper="Percentage approved"
                />

                <StatCard
                  title="Pending Earnings"
                  value={userAnalytics.pendingEarnings || 0}
                  isCurrency={true}
                  accentBarClass="bg-gradient-to-r from-cyan-500 to-blue-400"
                  helper="Potential earnings"
                />
              </motion.div>

              {/* Charts and Summary Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Doughnut Chart */}
                {userDoughnutData && (
                  <motion.div
                    variants={headerVariants}
                    className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 overflow-hidden"
                  >
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
                    <div className="relative">
                      <div style={{ height: '400px' }}>
                        <Doughnut data={userDoughnutData} options={userDoughnutOptions} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Summary Table */}
                <motion.div
                  variants={headerVariants}
                  className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 overflow-hidden"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-transparent to-indigo-500/10 opacity-50 pointer-events-none" />
                  <div className="relative">
                    <h2 className="text-xl font-semibold text-white mb-6">Performance Summary</h2>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                        <span className="text-sm font-medium text-slate-300">Total Submissions</span>
                        <span className="text-lg font-bold text-white">
                          {userAnalytics.totalSubmissions || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                        <span className="text-sm font-medium text-slate-300">Approved</span>
                        <span className="text-lg font-bold text-emerald-400">
                          {userAnalytics.approvedSubmissions || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                        <span className="text-sm font-medium text-slate-300">Rejected</span>
                        <span className="text-lg font-bold text-red-400">
                          {userAnalytics.rejectedSubmissions || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                        <span className="text-sm font-medium text-slate-300">Pending</span>
                        <span className="text-lg font-bold text-yellow-400">
                          {userAnalytics.pendingSubmissions || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                        <span className="text-sm font-medium text-slate-300">Total Completed</span>
                        <span className="text-lg font-bold text-white">
                          {userAnalytics.totalCompleted || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-sm font-medium text-slate-300">Approval Rate</span>
                        <span className="text-lg font-bold text-purple-400">
                          {userAnalytics.approvalRate?.toFixed(2) || '0.00'}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
