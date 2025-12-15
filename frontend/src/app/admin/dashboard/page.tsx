'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useLanguageStore } from '@/store/language-store';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { t } = useLanguageStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setLoading(false);
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('dashboard.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {t('adminPage.title')}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          {t('adminPage.subtitle')}
        </p>
      </div>

      {/* Role Display */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">{t('adminPage.roleTitle')}</h2>
            <p className="text-blue-700 dark:text-blue-300">{t('adminPage.roleDesc')}</p>
          </div>
        </div>
      </div>

      {/* Admin Info */}
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('adminPage.accountInfo')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('adminPage.email')}</p>
            <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('adminPage.role')}</p>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{user?.role}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('adminPage.status')}</p>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{user?.status || 'active'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('adminPage.emailVerified')}</p>
            <p className={`font-medium ${user?.emailVerified ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {user?.emailVerified ? t('adminPage.emailVerifiedYes') : t('adminPage.emailVerifiedNo')}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/admin/kyc"
          className="p-6 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-center font-semibold transition-colors"
        >
          {t('adminPage.quickActions.manageKyc')}
        </Link>
        <Link
          href="/operator/dashboard"
          className="p-6 bg-green-600 hover:bg-green-700 rounded-lg text-white text-center font-semibold transition-colors"
        >
          {t('adminPage.quickActions.operatorPanel')}
        </Link>
        <Link
          href="/profile"
          className="p-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-white text-center font-semibold transition-colors"
        >
          {t('adminPage.quickActions.profile')}
        </Link>
        <Link
          href="/dashboard"
          className="p-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-white text-center font-semibold transition-colors"
        >
          {t('adminPage.quickActions.userDashboard')}
        </Link>
      </div>
    </div>
  );
}
