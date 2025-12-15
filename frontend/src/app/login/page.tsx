'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReCAPTCHA from 'react-google-recaptcha';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useLanguageStore } from '@/store/language-store';
import { useThemeStore } from '@/store/theme-store';
import Link from 'next/link';

const buildLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(8, t('auth.passwordMin')),
    twoFactorCode: z.string().optional(),
    // Optional; enforced only when site key exists
    captchaToken: z.string().optional(),
  });

type LoginForm = z.infer<ReturnType<typeof buildLoginSchema>>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { t } = useLanguageStore();
  const { theme } = useThemeStore();
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState('');
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
  const hasCaptcha = Boolean(RECAPTCHA_SITE_KEY);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(buildLoginSchema(t)),
  });

  const onCaptchaChange = (token: string | null) => {
    if (token) {
      setValue('captchaToken', token);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      
      if (hasCaptcha && !data.captchaToken) {
        setError(t('auth.captchaRequired'));
        return;
      }
      
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
        twoFactorCode: data.twoFactorCode,
        captchaToken: data.captchaToken,
      });

      if (response.data.requires2FA) {
        setRequires2FA(true);
        return;
      }

      const { access_token, refresh_token, user } = response.data;
      setAuth(user, access_token, refresh_token);
      recaptchaRef.current?.reset();
      router.push('/trading');
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.loginFailed'));
      recaptchaRef.current?.reset();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('auth.login')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
              {t('auth.signup')}
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.email')}
              </label>
              <input
                {...register('email')}
                type="email"
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('auth.emailPlaceholder')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('auth.password')}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <input
                {...register('password')}
                type="password"
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('auth.passwordPlaceholder')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>
            {requires2FA && (
              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('auth.twoFactorCode')}
                </label>
                <input
                  {...register('twoFactorCode')}
                  type="text"
                  maxLength={6}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter 2FA code"
                />
              </div>
            )}
          </div>

          {/* reCAPTCHA (only when site key is configured) */}
          {hasCaptcha && (
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={onCaptchaChange}
                theme={theme === 'dark' ? 'dark' : 'light'}
              />
            </div>
          )}
          {errors.captchaToken && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              {errors.captchaToken.message}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? t('common.loading') : t('auth.signin')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

