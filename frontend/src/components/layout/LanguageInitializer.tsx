'use client';

import { useEffect } from 'react';
import { useLanguageStore } from '@/store/language-store';

export default function LanguageInitializer() {
  const { language } = useLanguageStore();

  useEffect(() => {
    // Apply language on mount
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    }
  }, [language]);

  return null;
}

