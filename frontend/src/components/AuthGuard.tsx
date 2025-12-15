'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'operator' | 'admin';
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated after first render
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return; // Don't check auth until hydrated

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check role-based access
    if (requiredRole && user?.role !== requiredRole) {
      // Redirect to appropriate dashboard
      if (user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user?.role === 'operator') {
        router.push('/operator/dashboard');
      } else {
        router.push('/dashboard');
      }
      return;
    }
  }, [isAuthenticated, user, requiredRole, router, isHydrated]);

  // Show loading while hydrating or checking auth
  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
