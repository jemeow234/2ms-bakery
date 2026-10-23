import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  // A plain string here would stop the site's "| 2M's Bakery" suffix from
  // reaching the tracking pages below, so carry the template on.
  title: { default: 'My Orders', template: `%s | ${SITE_NAME}` },
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
