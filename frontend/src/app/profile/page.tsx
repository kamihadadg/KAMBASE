'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth-store';
import { useLanguageStore } from '@/store/language-store';
import api from '@/lib/api';

const createSchemas = (t: (key: string) => string) => {
  const profileSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
  });

  const passwordSchema = z.object({
    currentPassword: z.string().min(1, t('profile.currentPasswordRequired')),
    newPassword: z.string().min(8, t('profile.newPasswordMin')),
    confirmPassword: z.string().min(8, t('profile.confirmPasswordMin')),
    twoFactorCode: z.string().optional(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('profile.passwordsMismatch'),
    path: ['confirmPassword'],
  });

  return { profileSchema, passwordSchema };
};

type Schemas = ReturnType<typeof createSchemas>;
type ProfileForm = z.infer<Schemas['profileSchema']>;
type PasswordForm = z.infer<Schemas['passwordSchema']>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useLanguageStore();
  const { profileSchema, passwordSchema } = useMemo(() => createSchemas(t), [t]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [kyc, setKyc] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'kyc' | 'activity'>('profile');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
    reset: resetProfile,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
    reset: resetPassword,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setProfile(response.data);
      resetProfile({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        phone: response.data.phone || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKYC = async () => {
    try {
      const response = await api.get('/kyc');
      setKyc(response.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Failed to fetch KYC:', error);
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Operators can only change password, no profile access
    if (user?.role === 'operator') {
      setActiveTab('security');
      setLoading(false);
      return;
    }

    fetchProfile();
    fetchKYC();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, router, user]);

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      setError('');
      setSuccess('');
      await api.patch('/users/profile', data);
      setSuccess(t('profile.updateSuccess'));
      await fetchProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('profile.updateFailed'));
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      setError('');
      setSuccess('');
      
      // If 2FA is enabled and code is not provided, show error (not for operators)
      if (user?.role !== 'operator' && profile?.twoFactorEnabled && !data.twoFactorCode) {
        setRequires2FA(true);
        setError(t('profile.2faRequired'));
        return;
      }
      
      const payload: any = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      };
      
      // Add 2FA code if provided
      if (data.twoFactorCode) {
        payload.twoFactorCode = data.twoFactorCode;
      }
      
      await api.post('/users/change-password', payload);
      setSuccess(t('profile.passwordChanged'));
      resetPassword();
      setRequires2FA(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      if (err.response?.status === 400 && (err.response?.data?.message?.includes('2FA') || err.response?.data?.message?.includes('2fa'))) {
        setRequires2FA(true);
        setError(err.response?.data?.message || t('profile.2faRequired'));
      } else {
        setError(err.response?.data?.message || t('profile.passwordChangeFailed'));
      }
    }
  };

  const handleEnable2FA = async () => {
    try {
      router.push('/setup-2fa');
    } catch (error) {
      console.error('Failed to navigate to 2FA setup:', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading && user?.role !== 'operator') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400 dark:text-gray-400 text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {t('profile.title')}
      </h1>

      {/* Tabs - Operators can only see security tab */}
      {user?.role === 'operator' ? (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {t('profile.changePassword')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('profile.operatorPasswordChange')}
          </p>
        </div>
      ) : (
        <div className="flex space-x-4 space-x-reverse mb-6 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'profile'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('profile.personalInfo')}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'security'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('profile.security')}
          </button>
          <button
            onClick={() => setActiveTab('kyc')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'kyc'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('profile.kyc')}
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'activity'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('profile.activity')}
          </button>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 bg-red-900/50 dark:bg-red-900/50 bg-red-50 border border-red-700 dark:border-red-700 border-red-300 text-red-200 dark:text-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-900/50 dark:bg-green-900/50 bg-green-50 border border-green-700 dark:border-green-700 border-green-300 text-green-200 dark:text-green-200 text-green-800 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Profile Tab - Not available for operators */}
      {user?.role !== 'operator' && activeTab === 'profile' && (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {t('profile.personalInfo')}
          </h2>
          <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.firstName')}
                </label>
                <input
                  {...registerProfile('firstName')}
                  type="text"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {profileErrors.firstName && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {profileErrors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.lastName')}
                </label>
                <input
                  {...registerProfile('lastName')}
                  type="text"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {profileErrors.lastName && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {profileErrors.lastName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  {...registerProfile('phone')}
                  type="tel"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {profileErrors.phone && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {profileErrors.phone.message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingProfile}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-50"
              >
                {isSubmittingProfile ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab - Available for all, but operators only see this */}
      {(activeTab === 'security' || user?.role === 'operator') && (
        <div className="space-y-6">
          {/* Change Password */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t('profile.changePassword')}
            </h2>
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.currentPassword')}
                </label>
                <input
                  {...registerPassword('currentPassword')}
                  type="password"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {passwordErrors.currentPassword && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.newPassword')}
                </label>
                <input
                  {...registerPassword('newPassword')}
                  type="password"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {passwordErrors.newPassword && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.confirmPassword')}
                </label>
                <input
                  {...registerPassword('confirmPassword')}
                  type="password"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>
              
              {/* 2FA Code - Show if 2FA is enabled or if error indicates 2FA is required (not for operators) */}
              {user?.role !== 'operator' && (profile?.twoFactorEnabled || requires2FA) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('auth.twoFactorCode')} {profile?.twoFactorEnabled && <span className="text-red-600 dark:text-red-400">*</span>}
                  </label>
                  <input
                    {...registerPassword('twoFactorCode')}
                    type="text"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
                    placeholder="000000"
                  />
                  {passwordErrors.twoFactorCode && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                      {passwordErrors.twoFactorCode.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('profile.2faCodeHint')}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-50"
                >
                  {isSubmittingPassword ? t('common.loading') : t('profile.changePassword')}
                </button>
              </div>
            </form>
          </div>

          {/* 2FA - Not available for operators */}
          {user?.role !== 'operator' && (
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                {t('profile.twoFactor')}
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 dark:text-gray-300">
                    Status: {profile?.twoFactorEnabled ? (
                      <span className="text-green-600 dark:text-green-400">Enabled</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">Disabled</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('profile.twoFactorDesc')}
                  </p>
                </div>
                {!profile?.twoFactorEnabled ? (
                  <button
                    onClick={handleEnable2FA}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                  >
                    Enable 2FA
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
                    disabled
                  >
                    Disable 2FA
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Login History - Not available for operators */}
          {user?.role !== 'operator' && (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t('profile.loginHistory')}
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{t('profile.lastLogin')}:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {profile?.lastLoginAt
                    ? new Date(profile.lastLoginAt).toLocaleString()
                    : 'Never'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{t('profile.lastLoginIp')}:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {profile?.lastLoginIp || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{t('profile.accountCreated')}:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* KYC Tab - Not available for operators */}
      {user?.role !== 'operator' && activeTab === 'kyc' && (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {t('profile.kycStatus')}
          </h2>
          {kyc ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {t('profile.kycLevel')}: {kyc.level}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status: <span className={kyc.status === 'approved' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                      {kyc.status}
                    </span>
                  </p>
                  {kyc.dailyWithdrawLimit && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Daily Withdraw Limit: ${kyc.dailyWithdrawLimit}
                    </p>
                  )}
                </div>
              </div>
              {kyc.status === 'pending' && (
                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                  {t('profile.kycPending')}
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('profile.kycNotSubmitted')}
              </p>
              <button
                onClick={() => router.push('/kyc')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
              >
                {t('profile.startKyc')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Activity Tab - Not available for operators */}
      {user?.role !== 'operator' && activeTab === 'activity' && (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                {t('profile.recentOrders')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                View your order history on the{' '}
                <a href="/trading" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                  Trading page
                </a>
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                {t('profile.walletTransactions')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                View your wallet transactions on the{' '}
                <a href="/wallet" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                  Wallet page
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

