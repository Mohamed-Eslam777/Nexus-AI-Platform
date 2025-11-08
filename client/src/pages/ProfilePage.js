import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import * as api from '../services/api';

// --- Dark Theme Design Tokens ---
const primaryButtonClasses =
  'inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';

const secondaryButtonClasses =
  'inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-800/50 px-6 py-2.5 text-sm font-semibold text-slate-200 shadow-sm transition-all duration-300 hover:border-slate-500 hover:bg-slate-700/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500/30';

const inputClasses =
  'block w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-emerald-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200 disabled:bg-slate-800/30 disabled:text-slate-500';

// دالة بسيطة لتحويل التاريخ إلى صيغة صالحة للإدخال في حقل date
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    return date.toISOString().split('T')[0];
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

export default function ProfilePage() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // Controls the view/edit state
    const navigate = useNavigate();
    const { t } = useTranslation();

    // 🚨 تجميع كل الحقول في حالة واحدة (รวม كل البيانات الشخصية والدفع)
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', phoneNumber: '', address: '', dateOfBirth: '', linkedInURL: '',
        paymentMethod: 'Not Set', paymentIdentifier: '', bio: '',
    });

    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });

    const fetchProfile = useCallback(async () => {
        try {
            const res = await api.fetchUserProfile();
            const user = res.data.user;
            
            // ملء الفورم ببيانات المستخدم الحالية من كل الحقول
            setFormData({
                firstName: user.firstName || '', lastName: user.lastName || '',
                phoneNumber: user.phoneNumber || '', address: user.address || '',
                dateOfBirth: user.dateOfBirth ? formatDateForInput(user.dateOfBirth) : '',
                linkedInURL: user.linkedInURL || '',
                paymentMethod: user.paymentMethod || 'Not Set',
                paymentIdentifier: user.paymentIdentifier || '',
                bio: user.bio || '',
            });
            setProfile(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching profile:', err.response?.data?.msg);
            localStorage.removeItem('token');
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchProfile();
    }, [navigate, fetchProfile]);

    // دمج دوال التعديل
    const onChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
    const onPasswordChange = (e) => { setPasswordData({ ...passwordData, [e.target.name]: e.target.value }); };

    // 🚨 دالة تحديث البيانات الشخصية والدفع (ترسل كل حقول formData)
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        
        // If not in edit mode, toggle to edit mode
        if (!isEditing) {
            setIsEditing(true);
            return;
        }
        
        // If in edit mode, save changes
        setIsSaving(true);
        try {
            await api.updateUserProfile(formData);
            toast.success('Profile updated successfully!');
            fetchProfile(); // إعادة تحميل البيانات
            setIsEditing(false); // Return to view mode after successful save
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };
    
    // Cancel edit mode
    const handleCancelEdit = () => {
        // Reset formData to original profile values
        if (profile && profile.user) {
            const user = profile.user;
            setFormData({
                firstName: user.firstName || '', lastName: user.lastName || '',
                phoneNumber: user.phoneNumber || '', address: user.address || '',
                dateOfBirth: user.dateOfBirth ? formatDateForInput(user.dateOfBirth) : '',
                linkedInURL: user.linkedInURL || '',
                paymentMethod: user.paymentMethod || 'Not Set',
                paymentIdentifier: user.paymentIdentifier || '',
                bio: user.bio || '',
            });
        }
        setIsEditing(false);
    };

    // 🚨 دالة تغيير كلمة المرور (تحتاج إلى راوت خاص في الباك إند)
    const handleChangePassword = async (e) => {
      e.preventDefault();
      const { currentPassword, newPassword, confirmNewPassword } = passwordData;

      if (newPassword !== confirmNewPassword) {
          toast.error("New passwords do not match.");
          return;
      }

      if (newPassword.length < 6) {
          toast.error("New password must be at least 6 characters.");
          return;
      }

      try {
          await api.changeUserPassword({ currentPassword, newPassword });
          toast.success("Password updated successfully!");
          setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' }); // تفريغ الحقول
      } catch (error) {
          const msg = error.response?.data?.msg || "Failed to change password.";
          toast.error(msg);
      }
    };

    // 🚨 دالة حذف الحساب
    const handleDeleteAccount = async () => {
      // رسالة تحذيرية قبل الحذف
      if (!window.confirm("WARNING: Are you ABSOLUTELY sure you want to delete your account? This action cannot be undone.")) {
          return;
      }

      try {
          await api.deleteAccount();
          toast.success("Account deleted successfully! Redirecting...");
          localStorage.removeItem('token'); // إزالة التوكن
          navigate('/login'); // التوجه لصفحة الدخول
          
      } catch (error) {
          const msg = error.response?.data?.msg || "Failed to delete account.";
          toast.error(msg);
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
              <p className="text-sm font-medium text-slate-400">{t('profile.loadingProfile')}</p>
            </div>
          </div>
        );
    }

    const { user, approvedSubmissions } = profile;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mx-auto max-w-4xl px-4 space-y-8"
            >
                {/* Header */}
                <motion.div variants={sectionVariants}>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    {t('profile.userProfileSettings')}
                  </h1>
                </motion.div>

                {/* --- 0. بطاقة معلومات أساسية (غير قابلة للتعديل) --- */}
                <motion.section
                  variants={sectionVariants}
                  className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
                  
                  <div className="relative flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className='flex items-center space-x-4'>
                      <motion.span
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-xl font-bold text-white shadow-lg shadow-emerald-500/30"
                      >
                        {user.email.slice(0, 1).toUpperCase()}
                      </motion.span>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-lg font-semibold text-white">{user.email}</p>
                          {/* Tier Badge */}
                          {user.tier && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide border backdrop-blur-sm ${
                                user.tier === 'Elite'
                                  ? 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30'
                                  : user.tier === 'Gold'
                                  ? 'bg-amber-900/40 text-amber-400 border-amber-500/30'
                                  : user.tier === 'Silver'
                                  ? 'bg-slate-600/40 text-slate-300 border-slate-500/30'
                                  : 'bg-orange-900/40 text-orange-400 border-orange-500/30'
                              }`}
                            >
                              {user.tier} Annotator
                            </motion.span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">{t('profile.role')}: {user.role}</p>
                        {user.approvalRate !== undefined && user.approvalRate !== null && (
                          <p className="text-xs text-slate-500 mt-1">
                            {t('profile.approvalRate')}: <span className="text-emerald-400 font-semibold">{user.approvalRate.toFixed(1)}%</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-center backdrop-blur-sm"
                    >
                      <p className="text-3xl font-bold text-emerald-400">{approvedSubmissions}</p>
                      <p className="text-xs text-emerald-300 uppercase tracking-wide font-semibold">{t('profile.tasksApproved')}</p>
                    </motion.div>
                  </div>
                </motion.section>
                
                {/* ---------------------------------------------------------------------------------- */}
                {/* --- 1. معلومات الملف الشخصي والدفع (القسم الرئيسي القابل للتعديل) --- */}
                {/* ---------------------------------------------------------------------------------- */}
                <motion.form
                  variants={sectionVariants}
                  onSubmit={handleProfileUpdate}
                  className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 space-y-6"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-2xl font-semibold text-white">{t('profile.personalContactInfo')}</h2>
                    </div>
                    <div className="border-b border-slate-700/50 pb-3"></div>
                    
                    {/* الاسم الأول والأخير */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="firstName">{t('auth.firstName')}</label>
                            {isEditing ? (
                                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={onChange} className={inputClasses} required />
                            ) : (
                                <p className="text-white py-2.5 px-4 rounded-xl bg-slate-800/50 border border-slate-700/50 min-h-[42px] flex items-center">
                                    {formData.firstName || <span className="text-slate-500 italic">{t('profile.notSet')}</span>}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="lastName">{t('auth.lastName')}</label>
                            {isEditing ? (
                                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={onChange} className={inputClasses} required />
                            ) : (
                                <p className="text-white py-2.5 px-4 rounded-xl bg-slate-800/50 border border-slate-700/50 min-h-[42px] flex items-center">
                                    {formData.lastName || <span className="text-slate-500 italic">{t('profile.notSet')}</span>}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* الهاتف وتاريخ الميلاد */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="phoneNumber">{t('auth.phoneNumber')}</label>
                            {isEditing ? (
                                <input type="text" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={onChange} className={inputClasses} required />
                            ) : (
                                <p className="text-white py-2.5 px-4 rounded-xl bg-slate-800/50 border border-slate-700/50 min-h-[42px] flex items-center">
                                    {formData.phoneNumber || <span className="text-slate-500 italic">{t('profile.notSet')}</span>}
                                </p>
                            )}
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="dateOfBirth">{t('auth.dateOfBirth')}</label>
                            {isEditing ? (
                                <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={onChange} className={inputClasses} required />
                            ) : (
                                <p className="text-white py-2.5 px-4 rounded-xl bg-slate-800/50 border border-slate-700/50 min-h-[42px] flex items-center">
                                    {formData.dateOfBirth || <span className="text-slate-500 italic">{t('profile.notSet')}</span>}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* العنوان واللينكدإن */}
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="address">{t('auth.address')}</label>
                            {isEditing ? (
                                <input type="text" id="address" name="address" value={formData.address} onChange={onChange} className={inputClasses} required />
                            ) : (
                                <p className="text-white py-2.5 px-4 rounded-xl bg-slate-800/50 border border-slate-700/50 min-h-[42px] flex items-center">
                                    {formData.address || <span className="text-slate-500 italic">{t('profile.notSet')}</span>}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="linkedInURL">{t('auth.linkedInURL')}</label>
                            {isEditing ? (
                                <input type="text" id="linkedInURL" name="linkedInURL" value={formData.linkedInURL} onChange={onChange} className={inputClasses} placeholder="https://linkedin.com/in/..." />
                            ) : (
                                <p className="text-white py-2.5 px-4 rounded-xl bg-slate-800/50 border border-slate-700/50 min-h-[42px] flex items-center">
                                    {formData.linkedInURL ? (
                                        <a href={formData.linkedInURL} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                                            {formData.linkedInURL}
                                        </a>
                                    ) : (
                                        <span className="text-slate-500 italic">{t('profile.notSet')}</span>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* الـ Bio */}
                    <div className='pt-4 mt-4'>
                        <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="bio">{t('profile.skillsBackground')}</label>
                        <textarea id="bio" name="bio" value={formData.bio} onChange={onChange} rows="4" className={`${inputClasses} min-h-[120px] resize-y`} placeholder={t('profile.bioPlaceholder')}></textarea>
                    </div>

                    {/* إعدادات الدفع */}
                    <div className="pt-6 mt-6 border-t border-slate-700/50">
                        <h3 className="text-lg font-semibold text-white mb-4">{t('profile.paymentSettings')}</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="paymentMethod">{t('profile.paymentMethod')}</label>
                                <select id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={onChange} className={inputClasses}>
                                    <option value="Not Set">{t('profile.pleaseSelect')}</option>
                                    <option value="PayPal">PayPal</option>
                                    <option value="Vodafone Cash">Vodafone Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="paymentIdentifier">{t('profile.paymentDetails')}</label>
                                <input type="text" id="paymentIdentifier" name="paymentIdentifier" value={formData.paymentIdentifier} onChange={onChange} className={inputClasses} placeholder={t('profile.paymentPlaceholder')} required={formData.paymentMethod !== 'Not Set'} />
                            </div>
                        </div>
                    </div>
                    
                    {/* زر الحفظ */}
                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-700/50">
                        {isEditing && (
                            <motion.button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              whileHover={isSaving ? {} : { scale: 1.05 }}
                              whileTap={isSaving ? {} : { scale: 0.95 }}
                              className="inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-800/50 px-6 py-2.5 text-sm font-semibold text-slate-200 shadow-sm transition-all duration-300 hover:border-slate-500 hover:bg-slate-700/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {t('common.cancel')}
                            </motion.button>
                        )}
                        <motion.button
                          type="submit"
                          disabled={isSaving}
                          whileHover={isSaving ? {} : { scale: 1.05 }}
                          whileTap={isSaving ? {} : { scale: 0.95 }}
                          className={primaryButtonClasses}
                        >
                          {isSaving ? (
                            <span className="flex items-center gap-2">
                              <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                              />
                              {t('profile.savingChanges')}
                            </span>
                          ) : isEditing ? (
                            t('profile.saveChanges')
                          ) : (
                            t('profile.editProfile')
                          )}
                        </motion.button>
                    </div>
                  </div>
                </motion.form>

                {/* ---------------------------------------------------------------------------------- */}
                {/* --- 2. إجراءات الحساب (كلمة المرور وحذف الحساب) --- */}
                {/* ---------------------------------------------------------------------------------- */}
                <motion.section
                  variants={sectionVariants}
                  className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 space-y-6"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
                  
                  <div className="relative">
                    <h2 className="text-2xl font-semibold text-white border-b border-slate-700/50 pb-3">{t('profile.accountActions')}</h2>

                    <form onSubmit={handleChangePassword} className="space-y-4 mt-6">
                        <h3 className="text-lg font-semibold text-white">{t('profile.changePassword')}</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="currentPassword">{t('profile.currentPassword')}</label>
                                <input type="password" id="currentPassword" name="currentPassword" value={passwordData.currentPassword} onChange={onPasswordChange} className={inputClasses} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="newPassword">{t('auth.newPassword')}</label>
                                <input type="password" id="newPassword" name="newPassword" value={passwordData.newPassword} onChange={onPasswordChange} className={inputClasses} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="confirmNewPassword">{t('auth.confirmPassword')}</label>
                                <input type="password" id="confirmNewPassword" name="confirmNewPassword" value={passwordData.confirmNewPassword} onChange={onPasswordChange} className={inputClasses} required />
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <motion.button
                              type="submit"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={primaryButtonClasses}
                            >
                              {t('profile.updatePassword')}
                            </motion.button>
                        </div>
                    </form>

                    <div className="pt-6 mt-6 border-t border-slate-700/50">
                        <h3 className="text-lg font-semibold text-rose-400">{t('profile.dangerZone')}</h3>
                        <p className="text-sm text-slate-400 mt-2">{t('profile.deleteAccountWarning')}</p>
                        <motion.button
                          onClick={handleDeleteAccount}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="mt-4 bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold py-2.5 px-6 rounded-full text-sm hover:bg-rose-500/30 transition-all duration-300 shadow-lg shadow-rose-500/20"
                        >
                          {t('profile.deleteMyAccount')}
                        </motion.button>
                    </div>
                  </div>
                </motion.section>
                {/* ---------------------------------------------------------------------------------- */}

            </motion.div>
        </div>
    );
}
