import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import * as api from '../services/api';

// --- Dark Theme Design Tokens ---
const primaryButtonClasses =
  'inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 active:scale-95';
const inputClasses =
  'block w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-emerald-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200';

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

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

const statusCardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

export default function ApplicationPage() {
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState(null);
  const [formData, setFormData] = useState({
    bio: '',
    testAnswer: '',
  });
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await api.fetchUserProfile();
        const status = res.data.user.status;

        setUserStatus(status);
        setLoading(false);

        if (status === 'Accepted') {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Error checking status:', err);
        setLoading(false);
      }
    };
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.testAnswer.trim()) {
        toast.error(t('application.pleaseEnterTestAnswer'));
        return;
      }
      await api.submitApplication(formData);

      toast.success('Application submitted successfully! Please wait for admin review.');
      setUserStatus('Pending');
    } catch (err) {
      console.error('Failed to submit application:', err.response?.data?.msg || 'Server Error');
      toast.error('Submission failed: ' + (err.response?.data?.msg || 'Server Error'));
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
          <p className="text-sm font-medium text-slate-400">{t('application.loadingApplicationStatus')}</p>
        </div>
      </div>
    );
  }

  if (userStatus === 'Pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4">
        <motion.div
          variants={statusCardVariants}
          initial="hidden"
          animate="visible"
          className="relative max-w-md w-full rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-amber-800/10 backdrop-blur-xl p-8 shadow-2xl shadow-amber-500/20"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 opacity-50 pointer-events-none" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="relative"
          >
            <h2 className="text-2xl font-bold text-amber-300 mb-3 flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              >
                ⏳
              </motion.span>
              {t('application.applicationUnderReview')}
            </h2>
            <p className="text-slate-300 leading-relaxed">
              {t('application.applicationUnderReviewMessage')}
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (userStatus === 'Rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4">
        <motion.div
          variants={statusCardVariants}
          initial="hidden"
          animate="visible"
          className="relative max-w-md w-full rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-900/20 to-rose-800/10 backdrop-blur-xl p-8 shadow-2xl shadow-rose-500/20"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-rose-500/10 via-transparent to-rose-500/10 opacity-50 pointer-events-none" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="relative"
          >
            <h2 className="text-2xl font-bold text-rose-300 mb-3 flex items-center gap-2">
              <span>❌</span>
              {t('application.applicationRejected')}
            </h2>
            <p className="text-slate-300 leading-relaxed">
              {t('application.applicationRejectedMessage')}
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto"
      >
        <motion.div
          variants={cardVariants}
          className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/50"
        >
          {/* Glowing accent border */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-transparent to-emerald-500/20 opacity-50 pointer-events-none" />

          <motion.div variants={itemVariants} className="relative mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-4">
              {t('application.applicationTechnicalAssessment')}
            </h1>
            <p className="text-slate-400 leading-relaxed">
              {t('application.applicationDescription')}
            </p>
          </motion.div>

          <form onSubmit={onSubmit} className="space-y-8">
            {/* Bio Section */}
            <motion.div variants={itemVariants} className="space-y-3">
              <label className="block text-lg font-semibold text-slate-200">
                {t('application.professionalBio')}
              </label>
              <p className="text-sm text-slate-400">
                {t('application.bioDescription')}
              </p>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={onChange}
                rows="5"
                className={`${inputClasses} min-h-[140px] resize-y`}
                placeholder={t('application.bioPlaceholder')}
                required
              />
            </motion.div>

            {/* Technical Test Section */}
            <motion.div
              variants={itemVariants}
              className="space-y-4 p-6 rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm"
            >
              <h3 className="text-xl font-bold text-emerald-400">{t('application.technicalAssessment')}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t('application.technicalTask')}
              </p>

              <motion.blockquote
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="border-l-4 border-emerald-500 pl-4 py-3 my-4 bg-slate-900/50 shadow-lg rounded-r-lg"
              >
                <p className="text-slate-200 italic leading-relaxed">
                  "Yes, your loan application has been approved, but the requested amount is higher than the maximum
                  allowed at this time. Would you like to accept the lower amount?"
                </p>
              </motion.blockquote>

              <div>
                <label className="block text-md font-medium text-slate-300 pt-2 mb-2">
                  {t('application.finalClassification')}
                </label>
                <input
                  type="text"
                  name="testAnswer"
                  value={formData.testAnswer}
                  onChange={onChange}
                  className={inputClasses}
                  placeholder={t('application.classificationPlaceholder')}
                  required
                />
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              variants={itemVariants}
              className="pt-6 border-t border-slate-700/50"
            >
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={primaryButtonClasses}
              >
                {t('application.submitApplication')}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
