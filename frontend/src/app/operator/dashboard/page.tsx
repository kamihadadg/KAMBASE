'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useLanguageStore } from '@/store/language-store';

export default function OperatorDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { t } = useLanguageStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'operator') {
      router.push('/dashboard');
      return;
    }

    setLoading(false);
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
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
          Operator Dashboard
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Welcome to the Operator Control Panel
        </p>
      </div>

      {/* Role Display */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">Operator</h2>
            <p className="text-green-700 dark:text-green-300">You have operator privileges</p>
          </div>
        </div>
      </div>

      {/* Operator Info */}
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
            <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Role</p>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{user?.role}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{user?.status || 'active'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email Verified</p>
            <p className={`font-medium ${user?.emailVerified ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {user?.emailVerified ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
