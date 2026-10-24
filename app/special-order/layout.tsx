import type { Metadata } from 'next'

// The page itself is a client component, so its title lives here.
export const metadata: Metadata = {
  title: 'Special Orders',
  description: 'Order pandesal and other breads in bulk — 50 pieces and up — for parties, events and offices.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
