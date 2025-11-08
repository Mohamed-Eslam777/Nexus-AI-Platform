import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem('token', res.data.token);
      toast.success('Login successful!');

      // Routing logic based on user role
      const role = res.data.userRole;

      if (role === 'Admin') {
        navigate('/admin');
      } else {
        // Regular user (Freelancer/Applicant) goes to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      const errorStatus = err.response?.status;
      const errorMsg = err.response?.data?.msg || 'Invalid credentials.';

      if (errorStatus === 403) {
        toast.error(errorMsg || 'Your account needs application review.');
        navigate('/apply');
      } else {
        // 400 error or any other error (wrong password or email not found)
        toast.error(errorMsg);
      }
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
                {t('auth.welcomeBack')}
              </h2>
            </Link>
            <motion.p
              variants={itemVariants}
              className="mt-4 text-sm text-slate-400"
            >
              {t('auth.signInMessage')}
            </motion.p>
          </motion.div>

          <form className="mt-8 space-y-6" onSubmit={onSubmit}>
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="email">
                {t('auth.email')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={onChange}
                className={inputClasses}
                required
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="password">
                {t('auth.password')}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={onChange}
                className={inputClasses}
                required
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
                    {t('common.login')}...
                  </span>
                ) : (
                  t('common.login')
                )}
              </motion.button>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="mt-6 text-center">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
            >
              {t('auth.forgotPassword')}
            </Link>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="mt-6 text-center text-sm text-slate-400"
          >
            {t('auth.notAMember')}{' '}
            <Link
              to="/register"
              className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
            >
              {t('auth.createAccount')}
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
