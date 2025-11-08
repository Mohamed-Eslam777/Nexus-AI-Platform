import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import * as api from '../services/api';
import { SkeletonTable } from '../components/SkeletonLoader';

// --- Dark Theme Design Tokens ---
const secondaryButtonClasses =
  'inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm font-semibold text-slate-200 shadow-sm transition-all duration-300 hover:border-slate-500 hover:bg-slate-700/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500/30';

const pillNeutralClasses =
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 hover:scale-105 active:scale-95 focus:ring-blue-500/30';

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

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch (error) {
    return '—';
  }
};

const getActionBadgeClass = (actionType) => {
  if (actionType?.includes('APPROVED') || actionType?.includes('CREATED')) {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  } else if (actionType?.includes('REJECTED') || actionType?.includes('DELETED')) {
    return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  } else if (actionType?.includes('UPDATED')) {
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  }
  return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [limit] = useState(10); // Logs per page
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Check admin role on mount
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
    } catch (error) {
      console.error('Invalid token');
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  // Fetch audit logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.fetchAuditLogs(currentPage, limit);
      
      // Handle different response structures
      if (response.data.logs) {
        setLogs(response.data.logs);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.totalCount || response.data.logs.length);
      } else if (Array.isArray(response.data)) {
        // If the API returns a simple array
        setLogs(response.data);
        setTotalPages(1);
        setTotalCount(response.data.length);
      } else {
        // Fallback structure
        setLogs(response.data.data || response.data || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.totalCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      toast.error('Failed to fetch audit logs: ' + (err.response?.data?.msg || 'Error'));
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage]);

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl px-4 space-y-10"
      >
        {/* Header */}
        <motion.div variants={sectionVariants} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Admin</p>
            <h1 className="mt-2 text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Audit Logs
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400 leading-relaxed">
              View all administrative actions and system events
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              Total: <span className="font-semibold text-white">{totalCount}</span> logs
            </span>
          </div>
        </motion.div>

        {/* Audit Logs Table */}
        <motion.section variants={sectionVariants} className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
          
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Audit Log Entries</h2>
              <p className="mt-1 text-sm text-slate-400">System activity and administrative actions</p>
            </div>
          </div>

          {loading ? (
            <SkeletonTable columns={4} rows={10} />
          ) : (
            <>
              <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50">
                <div className="max-w-full overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-700/50">
                    <thead className="bg-slate-900/80">
                      <tr>
                        <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Action
                        </th>
                        <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                          User
                        </th>
                        <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Timestamp
                        </th>
                        <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50 bg-slate-800/50">
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                            No audit logs found.
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log._id} className="hover:bg-slate-800/70 transition-colors duration-150">
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getActionBadgeClass(log.actionType)}`}>
                                {log.actionType || 'UNKNOWN'}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                              {log.user?.email || log.user?.firstName || log.user || log.user?._id || 'System'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-400">
                              {formatDate(log.createdAt || log.timestamp)}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right">
                              <motion.button
                                type="button"
                                onClick={() => handleViewDetails(log)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={pillNeutralClasses}
                              >
                                View Details
                              </motion.button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-slate-400">
                    Page <span className="font-semibold text-white">{currentPage}</span> of{' '}
                    <span className="font-semibold text-white">{totalPages}</span>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      whileHover={currentPage !== 1 ? { scale: 1.05 } : {}}
                      whileTap={currentPage !== 1 ? { scale: 0.95 } : {}}
                      className={`${secondaryButtonClasses} ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Previous
                    </motion.button>
                    <motion.button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      whileHover={currentPage !== totalPages ? { scale: 1.05 } : {}}
                      whileTap={currentPage !== totalPages ? { scale: 0.95 } : {}}
                      className={`${secondaryButtonClasses} ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Next
                    </motion.button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.section>
      </motion.div>

      {/* Details Modal */}
      {isModalOpen && selectedLog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleCloseModal}
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
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors duration-200 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-white mb-6 pr-8">
              Audit Log Details
            </h2>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Action Type */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Action Type
                </h3>
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${getActionBadgeClass(selectedLog.actionType)}`}>
                  {selectedLog.actionType || 'UNKNOWN'}
                </span>
              </div>

              {/* User */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  User
                </h3>
                <p className="text-base text-white">
                  {selectedLog.user?.email || selectedLog.user?.firstName || selectedLog.user || selectedLog.user?._id || 'System'}
                </p>
              </div>

              {/* Resource Type & ID */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    Resource Type
                  </h3>
                  <p className="text-base text-white">{selectedLog.resourceType || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    Resource ID
                  </h3>
                  <p className="text-base text-white font-mono text-sm">{selectedLog.resourceId || 'N/A'}</p>
                </div>
              </div>

              {/* Timestamp */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Timestamp
                </h3>
                <p className="text-base text-white">{formatDate(selectedLog.createdAt || selectedLog.timestamp)}</p>
              </div>

              {/* Details (JSON) */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Full Details (JSON)
                </h3>
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
                  <pre className="text-sm text-slate-200 whitespace-pre-wrap break-words font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.details || selectedLog, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Close button at bottom */}
            <div className="mt-6 flex justify-end">
              <motion.button
                type="button"
                onClick={handleCloseModal}
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
    </div>
  );
}

