'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/theme-store';

export default function ThemeInitializer() {
  const { theme, applyTheme } = useThemeStore();

  useEffect(() => {
    // Apply theme on mount and when theme changes
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Apply theme immediately on mount (before hydration)
  useEffect(() => {
    applyTheme(theme);
  }, []);

  return null;
}

