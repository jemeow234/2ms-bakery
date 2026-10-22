import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Karla } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/context/cart-context'
import { AuthProvider } from '@/context/auth-context'
import { StoreProvider } from '@/context/store-context'
import { Toaster } from '@/components/ui/sonner'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: '--font-heading',
  display: 'swap'
});

const karla = Karla({
  subsets: ["latin"],
  variable: '--font-body',
  display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Fresh Filipino Breads in Lipa City`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ['bakery', 'Lipa City', 'Batangas', 'pandesal', 'ensaymada', 'Spanish bread', 'ube', 'Filipino bread', 'bread delivery'],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: '/',
    locale: 'en_PH',
    images: [{ url: '/images/bicho.jpg', alt: 'Freshly fried bicho rolled in sugar' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ['/images/bicho.jpg'],
  },
}

export const viewport: Viewport = {
  themeColor: '#c4956a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${playfair.variable} ${karla.variable} font-sans antialiased`}>
        <AuthProvider>
          <StoreProvider>
            <CartProvider>
              {children}
              <Toaster position="top-right" />
            </CartProvider>
          </StoreProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
