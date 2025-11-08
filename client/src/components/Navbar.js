import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';

const primaryButtonClasses =
  'inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 active:scale-95';

const ghostButtonClasses =
  'inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm font-semibold text-slate-200 shadow-sm transition-all duration-300 hover:border-slate-500 hover:bg-slate-700/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500/30';

const navLinkClasses = 'relative text-sm font-medium text-slate-300 transition-all duration-300 hover:text-emerald-400';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentLang, changeLanguage, dir } = useLanguage();

  const getAuthHeader = (token) => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setNotificationCount(0);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUser(decoded.user);
      let isMounted = true;

      (async () => {
        try {
          const res = await axios.get('/api/auth/notifications', getAuthHeader(token));
          if (isMounted) {
            setNotificationCount(res.data.count);
          }
        } catch (err) {
          if (isMounted) {
            setNotificationCount(0);
          }
        }
      })();

      return () => {
        isMounted = false;
      };
    } catch (error) {
      console.error('Invalid token');
      localStorage.removeItem('token');
      setUser(null);
      setNotificationCount(0);
    }
  }, [navigate]);

  const onLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setNotificationCount(0);
    setIsMenuOpen(false);
    navigate('/login');
  };

  const handleLinkClick = () => setIsMenuOpen(false);

  const navItems = [];

  if (user) {
    navItems.push({ to: '/dashboard', label: 'Dashboard', withBadge: true });
    navItems.push({ to: '/analytics', label: 'Analytics' });

    if (user.role === 'Freelancer') {
      navItems.push(
        { to: '/profile', label: 'Profile' },
        { to: '/wallet', label: 'Wallet' }
      );
    }

    if (user.role === 'Admin') {
      navItems.push(
        { to: '/admin', label: 'Admin' },
        { to: '/admin/users', label: 'User Management' }
      );
    }
  }

  return (
    <nav dir={dir} className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/70 backdrop-blur-xl shadow-lg shadow-black/20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/" className="flex items-center gap-3" onClick={handleLinkClick}>
              <motion.span
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="text-4xl text-emerald-400 font-extrabold"
              >
                〽️
              </motion.span>
              <span className="text-base font-semibold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Nexus AI
              </span>
            </Link>
          </motion.div>

          <div className="hidden items-center gap-8 md:flex">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Link to="/about" onClick={handleLinkClick} className={navLinkClasses}>
                {t('common.about')}
              </Link>
            </motion.div>
            
            {navItems.map(({ to, label, withBadge }) => (
              <motion.div
                key={to}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to={to} onClick={handleLinkClick} className={navLinkClasses}>
                  {t(`common.${label.toLowerCase()}`) || label}
                  {withBadge && notificationCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-3 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/50"
                    >
                      {notificationCount}
                    </motion.span>
                  )}
                </Link>
              </motion.div>
            ))}

            {/* Notifications Bell Icon */}
            {user && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Link
                  to="/notifications"
                  onClick={handleLinkClick}
                  className="relative inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-800/50 p-2.5 text-slate-300 transition-all duration-300 hover:border-emerald-500/50 hover:bg-slate-700/50 hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  aria-label="Notifications"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                    />
                  </svg>
                  {notificationCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/50"
                    >
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </motion.span>
                  )}
                </Link>
              </motion.div>
            )}

            {/* Language Switcher */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button
                type="button"
                onClick={() => changeLanguage(currentLang === 'en' ? 'ar' : 'en')}
                className="inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-800/50 px-3 py-1.5 text-xs font-semibold text-slate-300 shadow-sm transition-all duration-300 hover:border-emerald-500/50 hover:bg-emerald-500/20 hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                title={currentLang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
              >
                {currentLang === 'en' ? 'EN' : 'AR'}
              </button>
            </motion.div>

            {user ? (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button type="button" onClick={onLogout} className={ghostButtonClasses}>
                  {t('common.logout')}
                </button>
              </motion.div>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/login" onClick={handleLinkClick} className={navLinkClasses}>
                    {t('common.login')}
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/register" onClick={handleLinkClick} className={primaryButtonClasses}>
                    {t('common.register')}
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 bg-slate-800/50 text-slate-300 transition-all duration-300 hover:border-emerald-500/50 hover:bg-slate-700/50 hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 md:hidden"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path
                  fillRule="evenodd"
                  d="M4.22 4.22a.75.75 0 011.06 0L10 8.94l4.72-4.72a.75.75 0 111.06 1.06L11.06 10l4.72 4.72a.75.75 0 11-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 11-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </motion.button>
        </div>

        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden"
          >
            <div className="space-y-1 border-t border-slate-700/50 pb-6 pt-4">
              <div className="flex flex-col gap-1">
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to="/about"
                    onClick={handleLinkClick}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-slate-800/50 hover:text-emerald-400"
                  >
                    <span>{t('common.about')}</span>
                  </Link>
                </motion.div>
                
                {navItems.map(({ to, label, withBadge }) => (
                  <motion.div
                    key={to}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to={to}
                      onClick={handleLinkClick}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-slate-800/50 hover:text-emerald-400"
                    >
                      <span>{t(`common.${label.toLowerCase()}`) || label}</span>
                      {withBadge && notificationCount > 0 && (
                        <span className="ml-3 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/50">
                          {notificationCount}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                ))}

                {/* Notifications Bell Icon (Mobile) */}
                {user && (
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to="/notifications"
                      onClick={handleLinkClick}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-slate-800/50 hover:text-emerald-400"
                    >
                      <span>{t('common.notifications') || 'Notifications'}</span>
                      {notificationCount > 0 && (
                        <span className="ml-3 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/50">
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-2 px-3">
                {/* Language Switcher for Mobile */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <button
                    type="button"
                    onClick={() => changeLanguage(currentLang === 'en' ? 'ar' : 'en')}
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-2 text-center text-sm font-semibold text-slate-300 transition-all duration-300 hover:border-emerald-500/50 hover:bg-emerald-500/20 hover:text-emerald-400"
                  >
                    {currentLang === 'en' ? 'العربية' : 'English'}
                  </button>
                </motion.div>

                {user ? (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <button
                      type="button"
                      onClick={onLogout}
                      className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm font-semibold text-slate-200 shadow-sm transition-all duration-300 hover:border-slate-500 hover:bg-slate-700/50 hover:text-white"
                    >
                      {t('common.logout')}
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link
                        to="/login"
                        onClick={handleLinkClick}
                        className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-2 text-center text-sm font-semibold text-slate-300 transition-all duration-300 hover:border-slate-500 hover:bg-slate-700/50 hover:text-white"
                      >
                        {t('common.login')}
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link
                        to="/register"
                        onClick={handleLinkClick}
                        className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/40"
                      >
                        {t('common.register')}
                      </Link>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
