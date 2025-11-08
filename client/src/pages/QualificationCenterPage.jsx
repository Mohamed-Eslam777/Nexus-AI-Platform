import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { getAvailableQualificationTests } from '../services/api';
import { SkeletonProjectCard } from '../components/SkeletonLoader';

// --- Dark Theme Design Tokens ---
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

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
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

const emptyStateVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const QualificationCenterPage = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const data = await getAvailableQualificationTests();
        setTests(data || []);
      } catch (error) {
        console.error('Failed to fetch tests', error);
        toast.error(error.response?.data?.message || 'Failed to load qualification tests.');
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-6xl px-4 space-y-10"
      >
        {/* Header */}
        <motion.div variants={headerVariants} className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Qualification</p>
            <h1 className="mt-2 text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Qualification Center
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400 leading-relaxed">
              Pass these tests to unlock projects in new domains and expand your opportunities.
            </p>
          </div>
        </motion.div>

        {/* Tests Grid */}
        {loading ? (
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonProjectCard key={index} />
            ))}
          </motion.div>
        ) : tests.length === 0 ? (
          <motion.div
            variants={emptyStateVariants}
            className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-12 shadow-2xl shadow-black/30 text-center"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
            <div className="relative">
              <svg
                className="mx-auto h-16 w-16 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-xl font-semibold text-white">No Available Tests</h3>
              <p className="mt-2 text-sm text-slate-400">
                No new qualification tests available for you right now. Check back later!
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {tests.map((test) => (
              <motion.div
                key={test._id}
                variants={cardVariants}
                whileHover="hover"
                className="group relative flex h-full flex-col justify-between rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 overflow-hidden"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                <Link to={`/qualification/test/${test._id}`} className="relative flex flex-col h-full">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getProjectDomainBadgeClass(
                          test.projectDomain || 'General'
                        )}`}
                      >
                        {test.projectDomain || 'General'}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-3 group-hover:text-emerald-400 transition-colors duration-200">
                      {test.title}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                      {test.description}
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-slate-700/50">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors duration-200">
                      <span>Take Test</span>
                      <svg
                        className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default QualificationCenterPage;

