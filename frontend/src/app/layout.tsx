import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Header from '@/components/layout/Header'
import ThemeInitializer from '@/components/layout/ThemeInitializer'
import LanguageInitializer from '@/components/layout/LanguageInitializer'
import { getLanguageFromCookie, getThemeFromCookie, getLanguageAttributes } from '@/lib/server-utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KAMEXCHANGE Exchange - Digital Asset Trading Platform',
  description: 'Trade cryptocurrencies with advanced trading tools',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get language and theme from cookie for SSR consistency
  const language = await getLanguageFromCookie();
  const theme = await getThemeFromCookie();
  const langAttrs = getLanguageAttributes(language);
  const themeClass = theme === 'dark' ? 'dark' : '';

  return (
    <html {...langAttrs} className={themeClass}>
      <body className="font-vazir bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Providers>
          <ThemeInitializer />
          <LanguageInitializer />
          <Header />
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
