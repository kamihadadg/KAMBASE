'use client';

import { useAuthStore } from '@/store/auth-store';
import { useLanguageStore } from '@/store/language-store';
import AuthGuard from '@/components/AuthGuard';

function UserDashboardContent() {
  const { user } = useAuthStore();
  const { t } = useLanguageStore();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {t('userPage.title')}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          {t('userPage.subtitle')}
        </p>
      </div>

      {/* Role Display */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">{t('userPage.roleTitle')}</h2>
            <p className="text-purple-700 dark:text-purple-300">{t('userPage.roleDesc')}</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('userPage.accountInfo')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('userPage.email')}</p>
            <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('userPage.role')}</p>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{user?.role}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('userPage.status')}</p>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{user?.status || 'active'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('userPage.emailVerified')}</p>
            <p className={`font-medium ${user?.emailVerified ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {user?.emailVerified ? t('userPage.emailVerifiedYes') : t('userPage.emailVerifiedNo')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserDashboardPage() {
  return (
    <AuthGuard>
      <UserDashboardContent />
    </AuthGuard>
  );
}

