import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://kambase.ir'

  // Static pages
  const staticPages = [
    '',
    '/dashboard',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/profile',
    '/kyc',
    '/wallet',
    '/admin/dashboard',
    '/operator/dashboard',
    '/verify-email',
    '/setup-2fa',
  ]

  // Market pages (you can add dynamic markets here)
  const marketPages = [
    '/markets',
    // Add specific market pairs here when available
    // '/markets/BTC-USDT',
    // '/markets/ETH-USDT',
  ]

  // Combine all pages
  const allPages = [...staticPages, ...marketPages]

  return allPages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: page === '' ? 'daily' : 'weekly',
    priority: page === '' ? 1.0 : page.startsWith('/dashboard') ? 0.8 : 0.6,
  }))
}
