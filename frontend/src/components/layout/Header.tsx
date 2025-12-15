'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useLanguageStore } from '@/store/language-store';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { t } = useLanguageStore();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    router.push('/login');
    setIsProfileOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8 space-x-reverse">
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              KAMEXCHANGE
            </Link>
            <nav className="hidden md:flex items-center space-x-8 space-x-reverse">
              {isAuthenticated && (
                <>
                  <Link
                    href={
                      user?.role === 'admin' ? '/admin/dashboard' :
                      user?.role === 'operator' ? '/operator/dashboard' :
                      '/dashboard'
                    }
                    className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition px-2 py-1"
                  >
                    {t('nav.dashboard') || 'Dashboard'}
                  </Link>

                  {user?.role !== 'operator' && (
                    <Link
                      href="/kyc"
                      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition px-2 py-1"
                    >
                      KYC Verification
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            <ThemeToggle />
            <LanguageToggle />
            {isAuthenticated ? (
              <div className="relative z-40" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 space-x-reverse px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-gray-900 dark:text-gray-300 hidden md:block">{user?.email}</span>
                  <svg
                    className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isProfileOpen && (
                  <div className="absolute top-full mt-2 left-auto right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[60] min-w-[200px]">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-sm text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span>{t('nav.profile') || 'Profile'}</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 space-x-reverse px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        <span>{t('nav.logout') || 'Logout'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                >
                  {t('nav.signup')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

