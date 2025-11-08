import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import * as api from '../services/api';
import { SkeletonCard } from '../components/SkeletonLoader';
import { toast } from 'react-toastify';

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

const notificationVariants = {
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
    scale: 1.02,
    y: -2,
    transition: {
      duration: 0.2,
    },
  },
};

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (error) {
    return '—';
  }
};

const getTypeStyles = (type) => {
  switch (type) {
    case 'success':
      return {
        border: 'border-emerald-500/30',
        bg: 'bg-emerald-500/10',
        dot: 'bg-emerald-500',
        text: 'text-emerald-300',
      };
    case 'error':
      return {
        border: 'border-rose-500/30',
        bg: 'bg-rose-500/10',
        dot: 'bg-rose-500',
        text: 'text-rose-300',
      };
    case 'warning':
      return {
        border: 'border-yellow-500/30',
        bg: 'bg-yellow-500/10',
        dot: 'bg-yellow-500',
        text: 'text-yellow-300',
      };
    default: // info
      return {
        border: 'border-blue-500/30',
        bg: 'bg-blue-500/10',
        dot: 'bg-blue-500',
        text: 'text-blue-300',
      };
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const { dir } = useLanguage();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const data = await api.fetchNotifications();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        toast.error('Failed to load notifications');
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8" dir={dir}>
      <div className="mx-auto max-w-4xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={headerVariants} className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              {t('notifications.title') || 'Notifications'}
            </h1>
            <p className="text-slate-400">
              {t('notifications.subtitle') || 'View your notification history'}
            </p>
          </motion.div>

          {/* Notifications List Card */}
          <motion.div
            variants={notificationVariants}
            className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500" />

            <div className="p-6">
              {isLoading ? (
                // Skeleton Loading State
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <SkeletonCard key={i} className="mb-4" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                // Empty State
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-700/50 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-10 h-10 text-slate-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">
                    {t('notifications.empty.title') || 'No notifications yet'}
                  </h3>
                  <p className="text-slate-400">
                    {t('notifications.empty.message') || 'You\'ll see notifications here when there\'s activity on your account.'}
                  </p>
                </motion.div>
              ) : (
                // Notifications List
                <div className="space-y-3">
                  {notifications.map((notification, index) => {
                    const styles = getTypeStyles(notification.type);
                    const NotificationContent = (
                      <div
                        className={`
                          relative rounded-2xl border ${styles.border} ${styles.bg} p-4
                          transition-all duration-200
                          ${notification.isRead ? 'opacity-60' : 'opacity-100'}
                          ${notification.link ? 'cursor-pointer hover:shadow-lg hover:shadow-emerald-500/20' : ''}
                        `}
                      >
                        {/* Unread Indicator */}
                        {!notification.isRead && (
                          <div className={`absolute ${dir === 'rtl' ? 'left-4' : 'right-4'} top-4 w-2 h-2 rounded-full ${styles.dot} animate-pulse`} />
                        )}

                        <div className="flex items-start gap-4">
                          {/* Type Icon */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${styles.bg} border ${styles.border} flex items-center justify-center`}>
                            {notification.type === 'success' && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${styles.text}`}>
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                              </svg>
                            )}
                            {notification.type === 'error' && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${styles.text}`}>
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                              </svg>
                            )}
                            {notification.type === 'warning' && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${styles.text}`}>
                                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                              </svg>
                            )}
                            {(notification.type === 'info' || !notification.type) && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${styles.text}`}>
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>

                          {/* Notification Content */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${notification.isRead ? 'text-slate-400' : 'text-white'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>

                          {/* Arrow Icon for Clickable Notifications */}
                          {notification.link && (
                            <div className="flex-shrink-0">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5 text-slate-400"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d={dir === 'rtl' ? "M15.75 19.5L8.25 12l7.5-7.5" : "M8.25 4.5l7.5 7.5-7.5 7.5"} />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    );

                    return (
                      <motion.div
                        key={notification._id || index}
                        variants={notificationVariants}
                        whileHover="hover"
                      >
                        {notification.link ? (
                          <Link to={notification.link}>
                            {NotificationContent}
                          </Link>
                        ) : (
                          NotificationContent
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
