import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Account, checkout and staff pages have nothing for search results.
      disallow: ['/admin', '/api/', '/checkout', '/orders', '/login', '/forgot-password', '/update-password'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
