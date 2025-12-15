'use client'

import { useEffect } from 'react'
import { useLanguageStore } from '@/store/language-store'

export function Providers({ children }: { children: React.ReactNode }) {
  const { language } = useLanguageStore()

  useEffect(() => {
    // Initialize language
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language
      document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr'
    }
  }, [language])

  return <>{children}</>
}
