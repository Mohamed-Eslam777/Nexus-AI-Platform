import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import * as api from '../services/api';

// --- Dark Theme Design Tokens ---
const primaryButtonClasses =
  'inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleDateString();
  } catch (error) {
    return '—';
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

const sectionVariants = {
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

const statCardVariants = {
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
    scale: 1.03,
    y: -4,
    transition: {
      duration: 0.2,
    },
  },
};

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ available: 0, pendingReview: 0 });
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ⬅️ دالة جلب الأرصدة (تم تحديثها)
  const fetchWalletStats = useCallback(async () => {
    try {
      setLoading(true);
      const walletData = await api.fetchWalletStats();

      setStats(walletData.stats);
      setPendingPayouts(walletData.pendingPayouts);
      setTransactions(walletData.transactions);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch wallet data', err);
      toast.error('Failed to load wallet data.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchWalletStats();
  }, [navigate, fetchWalletStats]);

  // دالة طلب السحب
  const handlePayoutRequest = async () => {
    if (stats.available <= 0) {
      toast.error(t('wallet.noApprovedEarnings'));
      return;
    }
    if (!window.confirm(`Are you sure you want to request a payout of ${formatCurrency(stats.available)}?`)) {
      return;
    }
    try {
      const res = await api.requestPayout();
      toast.success(res.data.msg);
      fetchWalletStats(); // إعادة تحميل الإحصائيات
    } catch (err) {
      toast.error('Payout request failed: ' + (err.response?.data?.msg || 'Error'));
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
          <p className="text-sm font-medium text-slate-400">{t('wallet.loadingWalletOverview')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-5xl space-y-10 px-4"
      >
        {/* Header */}
        <motion.header variants={sectionVariants} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">{t('wallet.wallet')}</p>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            {t('wallet.earningsPayouts')}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            {t('wallet.walletDescription')}
          </p>
        </motion.header>

        {/* Balance Section */}
        <motion.section variants={sectionVariants} className="space-y-6">
          <motion.div
            variants={statCardVariants}
            whileHover="hover"
            className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/30 overflow-hidden"
          >
            {/* Glowing accent border */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-transparent to-emerald-500/20 opacity-50 pointer-events-none" />
            
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('wallet.availableBalance')}</p>
                <p className="mt-2 text-5xl font-bold text-emerald-400">{formatCurrency(stats.available)}</p>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  {t('wallet.availableBalanceDescription')}
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-3 sm:items-end">
                <motion.button
                  onClick={handlePayoutRequest}
                  disabled={stats.available <= 0}
                  whileHover={stats.available > 0 ? { scale: 1.05 } : {}}
                  whileTap={stats.available > 0 ? { scale: 0.95 } : {}}
                  className={primaryButtonClasses}
                >
                  {t('wallet.requestPayout')}
                </motion.button>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {t('wallet.latestApproved')}: {formatCurrency(stats.available)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <motion.div
              variants={statCardVariants}
              whileHover="hover"
              className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 overflow-hidden"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-transparent to-indigo-500/10 opacity-50 pointer-events-none" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('wallet.pendingReview')}</p>
                <p className="mt-3 text-3xl font-bold text-white">{formatCurrency(stats.pendingReview)}</p>
                <p className="mt-2 text-sm text-slate-400">{t('wallet.pendingReviewDescription')}</p>
              </div>
            </motion.div>
            <motion.div
              variants={statCardVariants}
              whileHover="hover"
              className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 overflow-hidden"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-rose-500/10 via-transparent to-rose-500/10 opacity-50 pointer-events-none" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('wallet.pendingPayouts')}</p>
                <p className="mt-3 text-3xl font-bold text-white">{formatCurrency(pendingPayouts)}</p>
                <p className="mt-2 text-sm text-slate-400">{t('wallet.pendingPayoutsDescription')}</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Transaction History Table */}
        <motion.section
          variants={sectionVariants}
          className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
          
          <div className="relative border-b border-slate-700/50 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">{t('wallet.transactionHistory')}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {t('wallet.transactionHistoryDescription')}
            </p>
          </div>
          
          <div className="relative max-w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-slate-900/80">
                <tr>
                  <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                    {t('wallet.date')}
                  </th>
                  <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                    {t('wallet.description')}
                  </th>
                  <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                    {t('wallet.amount')}
                  </th>
                  <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                    {t('wallet.status')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 bg-slate-800/50">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                      {t('wallet.noTransactions')}
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-800/70 transition-colors duration-150">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">{formatDate(txn.date)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-white">{txn.description}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-emerald-400">{formatCurrency(txn.amount)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                            txn.status === 'Completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : txn.status === 'Rejected'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-slate-700/50 text-slate-300 border-slate-600/50'
                          }`}
                        >
                          {txn.status === 'Completed' ? t('wallet.completed') : txn.status === 'Rejected' ? t('wallet.rejected') : txn.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
