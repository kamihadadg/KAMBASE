'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useLanguageStore } from '@/store/language-store';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { t } = useLanguageStore();

  useEffect(() => {
    // Redirect authenticated users to appropriate dashboard
    if (isAuthenticated) {
      const user = useAuthStore.getState().user;
      if (user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user?.role === 'operator') {
        router.push('/operator/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, router]);

  // Show landing page for non-authenticated users
  if (isAuthenticated) {
    // Show loading while redirecting
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-950">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative container mx-auto px-4 py-32 md:py-40">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 mb-8 bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-full border border-white/20">
              <span className="text-white text-sm font-semibold">{t('landing.badge')}</span>
            </div>

            {/* Main Title */}
            <h1 className="text-6xl md:text-8xl font-extrabold mb-6 text-white leading-tight">
              {t('landing.title')}
            </h1>

            {/* Subtitle */}
            <p className="text-2xl md:text-3xl font-semibold mb-4 text-white/90">
              {t('landing.subtitle')}
            </p>

            {/* Description */}
            <p className="text-lg md:text-xl mb-12 text-white/80 max-w-3xl mx-auto leading-relaxed">
              {t('landing.description')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
              <Link
                href="/register"
                className="group relative px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1 overflow-hidden"
              >
                <span className="relative z-10 block">{t('landing.getStarted')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">{t('landing.getStarted')}</span>
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold text-lg border-2 border-white/30 hover:bg-white/20 transition-all duration-300 hover:scale-105"
              >
                {t('landing.signIn')}
              </Link>
            </div>

          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-16 fill-white dark:fill-gray-950" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C150,80 350,80 600,40 C850,0 1050,0 1200,40 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            {t('landing.features.title')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('landing.features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors"></div>
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('landing.features.auth.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('landing.features.auth.desc')}
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors"></div>
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('landing.features.kyc.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('landing.features.kyc.desc')}
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors"></div>
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('landing.features.profile.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('landing.features.profile.desc')}
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-colors"></div>
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('landing.features.email.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('landing.features.email.desc')}
              </p>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-colors"></div>
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('landing.features.i18n.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('landing.features.i18n.desc')}
              </p>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-colors"></div>
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('landing.features.dark.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('landing.features.dark.desc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-800 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-950 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto">
            {t('landing.cta.subtitle')}
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-5 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-2xl hover:shadow-white/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          >
            {t('landing.cta.button')}
          </Link>
        </div>
      </div>
    </div>
  );
}
