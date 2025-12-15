import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { Providers } from './providers'
import Header from '@/components/layout/Header'
import ThemeInitializer from '@/components/layout/ThemeInitializer'
import LanguageInitializer from '@/components/layout/LanguageInitializer'
import CookieConsentBanner from '@/components/layout/CookieConsent'
import StructuredData from '@/components/seo/StructuredData'
import { getLanguageFromCookie, getThemeFromCookie, getLanguageAttributes } from '@/lib/server-utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://kambase.ir'),
  title: {
    default: 'KAMEXCHANGE - پلتفرم معاملاتی ارز دیجیتال',
    template: '%s | KAMEXCHANGE'
  },
  description: 'پلتفرم معاملاتی پیشرفته ارزهای دیجیتال با ابزارهای حرفه‌ای. خرید و فروش بیت‌کوین، اتریوم و سایر ارزهای دیجیتال با امنیت بالا.',
  keywords: [
    'صرافی ارز دیجیتال',
    'خرید بیت کوین',
    'فروش ارز دیجیتال',
    'معامله ارز دیجیتال',
    'کیف پول دیجیتال',
    'بیت کوین',
    'اتریوم',
    'کریپتوکارنسی',
    'معامله رمزارز',
    'KAMEXCHANGE'
  ],
  authors: [{ name: 'KAMEXCHANGE Team' }],
  creator: 'KAMEXCHANGE',
  publisher: 'KAMEXCHANGE',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'fa-IR': '/',
      'en-US': '/en',
    },
  },
  openGraph: {
    title: 'KAMEXCHANGE - پلتفرم معاملاتی ارز دیجیتال',
    description: 'پلتفرم معاملاتی پیشرفته ارزهای دیجیتال با ابزارهای حرفه‌ای. خرید و فروش بیت‌کوین، اتریوم و سایر ارزهای دیجیتال با امنیت بالا.',
    url: 'https://kambase.ir',
    siteName: 'KAMEXCHANGE',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'KAMEXCHANGE - پلتفرم معاملاتی ارز دیجیتال',
      },
    ],
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KAMEXCHANGE - پلتفرم معاملاتی ارز دیجیتال',
    description: 'پلتفرم معاملاتی پیشرفته ارزهای دیجیتال با ابزارهای حرفه‌ای.',
    images: ['/og-image.jpg'],
    creator: '@kambase',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get headers to check if this is a critical page
  const headersList = await headers();
  const isCriticalPage = headersList.get('x-is-critical-page') === 'true';

  // Get language and theme from cookie for SSR consistency
  const language = await getLanguageFromCookie(isCriticalPage);
  const theme = await getThemeFromCookie(isCriticalPage);
  const langAttrs = getLanguageAttributes(language);
  const themeClass = theme === 'dark' ? 'dark' : '';

  return (
    <html {...langAttrs} className={themeClass}>
      <body className="font-vazir bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <StructuredData type="website" />
        <StructuredData type="organization" />
        <Providers>
          <ThemeInitializer />
          <LanguageInitializer />
          <Header />
          <main className="min-h-screen">{children}</main>
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  )
}
