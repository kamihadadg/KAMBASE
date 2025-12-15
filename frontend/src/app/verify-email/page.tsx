'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useLanguageStore } from '@/store/language-store';
import Link from 'next/link';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguageStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage(t('verify.tokenMissing'));
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message || t('verify.success'));
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(
          error.response?.data?.message || 
          error.response?.data?.detail || 
          t('verify.invalidToken')
        );
      }
    };

    verifyEmail();
  }, [searchParams, router, t]);

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendStatus('loading');
    setResendMessage('');

    try {
      const response = await api.post('/auth/resend-verification-by-email', {
        email: resendEmail,
      });
      setResendStatus('success');
      setResendMessage(response.data.message || t('verify.resendSuccess'));
      setResendEmail('');
    } catch (error: any) {
      setResendStatus('error');
      // Check if it's a rate limit error (429 status code)
      if (error.response?.status === 429) {
        setResendMessage(t('verify.rateLimitError'));
      } else {
        setResendMessage(
          error.response?.data?.message || 
          t('verify.resendError')
        );
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {status === 'loading' && t('verify.verifying')}
            {status === 'success' && t('verify.verified')}
            {status === 'error' && t('verify.failed')}
          </h2>
        </div>

        <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-8">
          {status === 'loading' && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('verify.loading')}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p className="text-gray-900 dark:text-white text-lg font-medium mb-2">
                {message}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t('verify.redirecting')}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <p className="text-gray-900 dark:text-white text-lg font-medium mb-4">
                {message}
              </p>
              
              {!showResendForm ? (
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    {t('verify.goToLogin')}
                  </Link>
                  <button
                    onClick={() => setShowResendForm(true)}
                    className="block w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    {t('verify.resendEmail')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t('verify.resendEmailTitle')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {t('verify.resendEmailDesc')}
                    </p>
                  </div>
                  
                  <form onSubmit={handleResendEmail} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('verify.enterEmail')}
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        placeholder={t('verify.emailPlaceholder')}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    {resendStatus === 'success' && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                        <p className="text-sm text-green-800 dark:text-green-300">
                          {resendMessage}
                        </p>
                      </div>
                    )}
                    
                    {resendStatus === 'error' && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <p className="text-sm text-red-800 dark:text-red-300">
                          {resendMessage}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={resendStatus === 'loading'}
                        className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {resendStatus === 'loading' ? t('verify.resending') : t('verify.sendResend')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowResendForm(false);
                          setResendEmail('');
                          setResendStatus('idle');
                          setResendMessage('');
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </form>
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      href="/login"
                      className="block w-full text-center py-2 px-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      {t('verify.goToLogin')}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  const { t } = useLanguageStore();
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('verify.loadingPage')}</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
