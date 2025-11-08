import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import * as api from '../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
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

const inputClasses =
  'block w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-emerald-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200';

const selectClasses =
  'block w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200';

const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return '—';
  }
};

const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'Admin':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'Freelancer':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'Applicant':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    default:
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Accepted':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'Pending':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'Rejected':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    case 'New':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    default:
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
};

const getSkillDomainBadgeClass = (domain) => {
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

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const navigate = useNavigate();
  const searchTimeoutRef = useRef(null);

  const fetchUsers = useCallback(async (page = 1, term = '') => {
    try {
      setLoading(true);
      const res = await api.fetchUsers(page, term);
      
      if (res.data) {
        setUsers(res.data.users || []);
        setCurrentPage(res.data.currentPage || page);
        setTotalPages(res.data.totalPages || 1);
        setTotalUsers(res.data.totalUsers || 0);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Unauthorized. Please log in as admin.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error('Failed to fetch users. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUsers(1, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchUsers(1, searchTerm);
    }, 500); // 500ms delay

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, fetchUsers]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchUsers(newPage, searchTerm);
    }
  };

  const handleUpdateUser = async (userId, field, value) => {
    try {
      await api.updateUser(userId, { [field]: value });
      toast.success(`User ${field} updated successfully!`);
      
      // Refresh the current page to get updated data
      fetchUsers(currentPage, searchTerm);
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error(`Failed to update user ${field}. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"
          />
          <p className="text-sm font-medium text-slate-400">Loading users...</p>
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
          {/* Header Section */}
          <motion.div variants={sectionVariants}>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
              User Management
            </h1>
            <p className="text-slate-400 text-sm">إدارة المستخدمين</p>
          </motion.div>

          {/* Main Table Card */}
          <motion.div
            variants={sectionVariants}
            className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 overflow-hidden"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
            
            <div className="relative">
              {/* Search Bar */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search by email, name, role, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={inputClasses}
                />
              </div>

              {/* Users Count Badge */}
              <div className="mb-4 flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-500/30 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  {totalUsers} {totalUsers === 1 ? 'user' : 'users'}
                  {searchTerm && ` matching "${searchTerm}"`}
                </span>
              </div>

              {/* Table */}
              <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50">
                <div className="max-w-full overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-700/50">
                    <thead className="bg-slate-900/80">
                      <tr>
                        <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Email
                        </th>
                        <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Role
                        </th>
                        <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Status
                        </th>
                        <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Skill Domain
                        </th>
                        <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Payment Method
                        </th>
                        <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Payment ID
                        </th>
                        <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Date Joined
                        </th>
                        <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50 bg-slate-800/50">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                            {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user._id} className="hover:bg-slate-800/70 transition-colors duration-150">
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-white">
                              {user.email || '—'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getRoleBadgeClass(user.role)}`}>
                                {user.role || '—'}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(user.status)}`}>
                                {user.status || '—'}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              {user.skillDomain ? (
                                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getSkillDomainBadgeClass(user.skillDomain)}`}>
                                  {user.skillDomain}
                                </span>
                              ) : (
                                <span className="text-sm text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                              {user.paymentMethod || 'Not Set'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                              {user.paymentIdentifier || '—'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-400">
                              {formatDate(user.createdAt)}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right">
                              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <select
                                  value={user.role || ''}
                                  onChange={(e) => handleUpdateUser(user._id, 'role', e.target.value)}
                                  className={`${selectClasses} min-w-[120px]`}
                                >
                                  <option value="Applicant">Applicant</option>
                                  <option value="Freelancer">Freelancer</option>
                                  <option value="Admin">Admin</option>
                                </select>
                                <select
                                  value={user.status || ''}
                                  onChange={(e) => handleUpdateUser(user._id, 'status', e.target.value)}
                                  className={`${selectClasses} min-w-[120px]`}
                                >
                                  <option value="New">New</option>
                                  <option value="Pending">Pending</option>
                                  <option value="Accepted">Accepted</option>
                                  <option value="Rejected">Rejected</option>
                                </select>
                                <select
                                  value={user.skillDomain || 'General'}
                                  onChange={(e) => handleUpdateUser(user._id, 'skillDomain', e.target.value)}
                                  className={`${selectClasses} min-w-[120px]`}
                                >
                                  <option value="General">General (عام)</option>
                                  <option value="Programming">Programming (برمجة)</option>
                                  <option value="Business">Business (أعمال)</option>
                                  <option value="Law">Law (قانون)</option>
                                  <option value="Health">Health (صحة)</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div className="text-sm text-slate-400">
                    Showing page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      whileHover={{ scale: currentPage > 1 ? 1.05 : 1 }}
                      whileTap={{ scale: currentPage > 1 ? 0.95 : 1 }}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-300 hover:border-emerald-500/50 hover:bg-slate-700/50 hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-600 disabled:hover:bg-slate-800/50 disabled:hover:text-slate-300"
                    >
                      Previous
                    </motion.button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <motion.button
                            key={pageNum}
                            type="button"
                            onClick={() => handlePageChange(pageNum)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                              currentPage === pageNum
                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                                : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-700/50'
                            }`}
                          >
                            {pageNum}
                          </motion.button>
                        );
                      })}
                    </div>

                    <motion.button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      whileHover={{ scale: currentPage < totalPages ? 1.05 : 1 }}
                      whileTap={{ scale: currentPage < totalPages ? 0.95 : 1 }}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-300 hover:border-emerald-500/50 hover:bg-slate-700/50 hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-600 disabled:hover:bg-slate-800/50 disabled:hover:text-slate-300"
                    >
                      Next
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
