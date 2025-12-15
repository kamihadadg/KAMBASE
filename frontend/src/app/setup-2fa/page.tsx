'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Suspense } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useLanguageStore } from '@/store/language-store';
import Link from 'next/link';

const verify2FASchema = z.object({
  token: z.string().length(6, '2FA code must be 6 digits'),
});

type Verify2FAForm = z.infer<typeof verify2FASchema>;

function Setup2FAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useLanguageStore();
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Verify2FAForm>({
    resolver: zodResolver(verify2FASchema),
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Operators cannot enable 2FA
    if (user?.role === 'operator') {
      router.push('/profile');
      return;
    }

    const generateSecret = async () => {
      try {
        setLoading(true);
        const response = await api.get('/auth/2fa/generate');
        setQrCode(response.data.qrCode);
        setSecret(response.data.secret);
      } catch (err: any) {
        setError(err.response?.data?.message || t('auth.2faGenerateError'));
      } finally {
        setLoading(false);
      }
    };

    generateSecret();
  }, [isAuthenticated, router, user, t]);

  const onSubmit = async (data: Verify2FAForm) => {
    try {
      setVerifying(true);
      setError('');
      
      await api.post('/auth/2fa/enable', { token: data.token });
      
      setSuccess(true);
      reset();
      
      // Redirect to profile after 2 seconds
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.2faEnableError'));
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('auth.setup2FA')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('auth.setup2FADesc')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-8">
          {success ? (
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
                {t('auth.2faEnabledSuccess')}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {t('auth.2faRedirecting')}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  {t('auth.step1')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('auth.installGoogleAuthenticator')}
                </p>
                <div className="flex justify-center mb-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    {qrCode ? (
                      <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
                  {t('auth.scanQRCode')}
                </p>
                
                {secret && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {t('auth.manualEntry')}:
                    </p>
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono text-gray-900 dark:text-white break-all">
                        {secret}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(secret)}
                        className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        {t('common.copy')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  {t('auth.step2')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('auth.enter2FACode')}
                </p>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                      <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('auth.twoFactorCode')}
                    </label>
                    <input
                      {...register('token')}
                      type="text"
                      id="token"
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-2xl tracking-widest"
                      placeholder="000000"
                    />
                    {errors.token && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                        {errors.token.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={verifying}
                      className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {verifying ? t('common.loading') : t('auth.enable2FA')}
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/profile"
                  className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {t('auth.cancel')}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Setup2FAPage() {
  const { t } = useLanguageStore();
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    }>
      <Setup2FAContent />
    </Suspense>
  );
}

