import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import * as api from '../services/api';
import { SkeletonProjectCard } from '../components/SkeletonLoader';

// --- Dark Theme Design Tokens ---
const primaryButtonClasses =
  'inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 active:scale-95';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

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

const projectCardVariants = {
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
  tap: {
    scale: 0.98,
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

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]); // Store all fetched projects for filtering
  const [loading, setLoading] = useState(true);
  const [userTier, setUserTier] = useState(null);
  const [userSkillDomain, setUserSkillDomain] = useState(null); // Store user's skillDomain
  const [activeFilter, setActiveFilter] = useState('All Available'); // Filter state: 'My Domain', 'General', 'All Available'
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Filter function to apply filtering logic
  const applyFilter = (projectsList, filter, skillDomain) => {
    let filtered = [];
    
    if (filter === 'All Available') {
      filtered = projectsList;
    } else if (filter === 'My Domain') {
      // Filter tasks matching user's specific skillDomain only (exclude 'General' projects)
      if (skillDomain && skillDomain !== 'General') {
        filtered = projectsList.filter(
          project => project.projectDomain === skillDomain
        );
      } else {
        // If user has no domain or General domain, show empty (no matches)
        filtered = [];
      }
    } else if (filter === 'General') {
      // Filter tasks tagged as 'General' or with no domain
      filtered = projectsList.filter(
        project => !project.projectDomain || project.projectDomain === 'General'
      );
    } else {
      filtered = projectsList;
    }
    
    setProjects(filtered);
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilter(allProjects, filter, userSkillDomain);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [projectsRes, profileRes] = await Promise.all([
          api.fetchAvailableProjects(),
          api.fetchUserProfile().catch(() => null) // Fetch user profile for tier, but don't fail if it errors
        ]);
        
        // Store all projects for filtering
        setAllProjects(projectsRes.data);
        
        // Extract tier and skillDomain from profile if available
        const skillDomain = profileRes?.data?.user?.skillDomain || null;
        if (profileRes?.data?.user) {
          if (profileRes.data.user.tier) {
            setUserTier(profileRes.data.user.tier);
          }
          if (skillDomain) {
            setUserSkillDomain(skillDomain);
          }
        }
        
        // Apply initial filter
        applyFilter(projectsRes.data, activeFilter, skillDomain);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err.response?.data?.msg);
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Re-apply filter when allProjects or userSkillDomain changes
  useEffect(() => {
    if (allProjects.length > 0) {
      applyFilter(allProjects, activeFilter, userSkillDomain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProjects, userSkillDomain, activeFilter]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Header Section */}
          <motion.div variants={headerVariants} className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">{t('dashboard.projects')}</p>
                  {/* Tier Badge */}
                  {userTier && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide border backdrop-blur-sm ${
                        userTier === 'Elite'
                          ? 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30'
                          : userTier === 'Gold'
                          ? 'bg-amber-900/40 text-amber-400 border-amber-500/30'
                          : userTier === 'Silver'
                          ? 'bg-slate-600/40 text-slate-300 border-slate-500/30'
                          : 'bg-orange-900/40 text-orange-400 border-orange-500/30'
                      }`}
                    >
                      {userTier}
                    </motion.span>
                  )}
                  {/* Skill Domain Badge */}
                  {userSkillDomain && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide border border-blue-500/30 bg-blue-500/20 text-blue-300 backdrop-blur-sm"
                    >
                      {userSkillDomain}
                    </motion.span>
                  )}
                </div>
                <h1 className="mt-2 text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  {t('dashboard.availableBriefs')}
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-400 leading-relaxed">
                  {t('dashboard.dashboardDescription')}
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm px-6 py-4 shadow-lg"
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('dashboard.openBriefs')}</p>
                  <p className="text-3xl font-bold text-emerald-400">{projects.length}</p>
                </div>
              </motion.div>
            </div>

            {/* Filter Controls */}
            <div className="flex gap-2 flex-wrap">
              {userSkillDomain && userSkillDomain !== 'General' && (
                <motion.button
                  onClick={() => handleFilterChange('My Domain')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    activeFilter === 'My Domain'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  My Domain ({userSkillDomain})
                </motion.button>
              )}
              <motion.button
                onClick={() => handleFilterChange('General')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeFilter === 'General'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                }`}
              >
                General
              </motion.button>
              <motion.button
                onClick={() => handleFilterChange('All Available')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeFilter === 'All Available'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                }`}
              >
                All Available
              </motion.button>
            </div>
          </motion.div>

          {/* Projects Grid or Empty State */}
          {loading ? (
            <motion.div
              variants={containerVariants}
              className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonProjectCard key={index} />
              ))}
            </motion.div>
          ) : projects.length === 0 ? (
            <motion.div variants={emptyStateVariants} className="mt-16">
              <div className="relative rounded-3xl border border-dashed border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-12 text-center shadow-xl">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 opacity-50 pointer-events-none" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  className="relative"
                >
                  <h2 className="text-2xl font-bold text-slate-200">{t('project.noProjectsAvailable')}</h2>
                  <p className="mt-3 text-sm text-slate-400">
                    {t('project.noProjectsMessage')}
                  </p>
                  <motion.button
                    type="button"
                    onClick={() => navigate('/profile')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`${primaryButtonClasses} mt-6`}
                  >
                    {t('project.reviewProfile')}
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {projects.map((project, index) => {
                const payRate =
                  typeof project.payRate === 'number' && !Number.isNaN(project.payRate)
                    ? `${formatCurrency(project.payRate)}/Task`
                    : t('dashboard.rateToBeDetermined');
                const description = project.description?.trim() || t('dashboard.noDescriptionProvided');
                const taskType = project.taskType?.replace(/_/g, ' ');

                return (
                  <motion.div
                    key={project._id}
                    variants={projectCardVariants}
                    whileHover="hover"
                    whileTap="tap"
                    className="group relative flex h-full flex-col justify-between rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 transition-all duration-300"
                  >
                    {/* Glowing accent border */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    <div className="relative flex-1">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <h2 className="text-lg font-semibold text-white leading-tight">{project.title}</h2>
                        {taskType && (
                          <span className="flex-shrink-0 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-300">
                            {taskType}
                          </span>
                        )}
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-300 line-clamp-4">{description}</p>
                      
                      {/* Project Domain Badge */}
                      {project.projectDomain && (
                        <div className="mt-3">
                          <span className="inline-flex items-center rounded-full border border-slate-600 bg-slate-700/50 px-3 py-1 text-xs font-medium text-slate-300">
                            Domain: {project.projectDomain}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="relative mt-8 flex items-center justify-between gap-4 pt-6 border-t border-slate-700/50">
                      <div className="flex flex-col gap-3 flex-1">
                        <div>
                          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('project.payRateLabel')}</span>
                          <span className="mt-1 block text-lg font-bold text-emerald-400">{payRate}</span>
                        </div>
                      </div>
                      <motion.button
                        type="button"
                        onClick={() => navigate(`/task/${project._id}`)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`${primaryButtonClasses} whitespace-nowrap`}
                      >
                        {t('project.viewBrief')}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
