import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import * as api from '../services/api';

// --- Dark Theme Design Tokens ---
const primaryButtonClasses =
  'inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

const inputClasses =
  'block w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-emerald-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200';

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

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: 0.3,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.95,
  },
};

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { newPassword, confirmPassword } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toast.error(t('auth.passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (!token) {
      toast.error(t('auth.invalidResetToken'));
      navigate('/forgot-password');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token, newPassword);
      toast.success('Password has been reset successfully! You can now login with your new password.');
      navigate('/login');
    } catch (err) {
      console.error('Password reset failed:', err.response?.data?.msg);
      toast.error(err.response?.data?.msg || 'Failed to reset password. The token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <motion.div
          variants={cardVariants}
          className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/50"
        >
          {/* Glowing accent border */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-transparent to-emerald-500/20 opacity-50 pointer-events-none" />

          <motion.div variants={itemVariants} className="relative text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <motion.span
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="text-6xl text-emerald-400 font-extrabold"
              >
                〽️
              </motion.span>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                {t('auth.resetPassword')}
              </h2>
            </Link>
            <motion.p
              variants={itemVariants}
              className="mt-4 text-sm text-slate-400"
            >
              {t('auth.resetPasswordMessage')}
            </motion.p>
          </motion.div>

          <form className="mt-8 space-y-6" onSubmit={onSubmit}>
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="newPassword">
                {t('auth.newPassword')}
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={newPassword}
                onChange={onChange}
                className={inputClasses}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="confirmPassword">
                {t('auth.confirmPassword')}
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={onChange}
                className={inputClasses}
                placeholder="Re-enter your password"
                required
                minLength={6}
              />
            </motion.div>

            <motion.div variants={buttonVariants} className="pt-4">
              <motion.button
                type="submit"
                disabled={loading}
                variants={buttonVariants}
                whileHover={loading ? {} : 'hover'}
                whileTap={loading ? {} : 'tap'}
                className={`${primaryButtonClasses} w-full ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Resetting...
                  </span>
                                  ) : (
                  t('auth.resetPassword')
                )}
              </motion.button>
            </motion.div>
          </form>

          <motion.p
            variants={itemVariants}
            className="mt-8 text-center text-sm text-slate-400"
          >
            {t('auth.rememberPassword')}{' '}
            <Link
              to="/login"
              className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
            >
              {t('auth.backToLogin')}
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}

