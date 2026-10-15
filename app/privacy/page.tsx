import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LogoMark } from '@/components/logo-mark'
import { BAKERY_ORIGIN } from '@/lib/delivery'

export const metadata: Metadata = {
  title: "Privacy Policy | 2M's Bakery",
  description: "How 2M's Bakery collects, uses and protects your personal information.",
}

const EFFECTIVE_DATE = 'September 26, 2026'
const CONTACT_EMAIL = 'trupazette05@gmail.com'
const CONTACT_PHONE = '+63 917 326 9434'

const sections = [
  {
    title: 'Who we are',
    body: [
      `2M's Bakery ("we", "us") runs this website so customers can browse our breads and pastries and order them for delivery or pick-up. We are located at ${BAKERY_ORIGIN.address}. We handle your personal information in line with the Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules.`,
    ],
  },
  {
    title: 'Information we collect',
    list: [
      'Account details — your name, email address, phone number, delivery address and password when you sign up. Passwords are stored securely by our authentication provider and are never visible to us.',
      'Order details — the items you buy, your delivery or pick-up date and time, delivery address, the distance from our shop, your chosen payment method (cash or GCash) and the order total. We do not collect or store card numbers or GCash account credentials.',
      'Feedback — the rating and comments you leave about an order.',
      'Device and usage information — anonymous page-view statistics (such as the pages you visit and your browser type) collected to help us improve the site.',
    ],
  },
  {
    title: 'How we use your information',
    list: [
      'To create and manage your account.',
      'To prepare, deliver or hand over your orders, and to contact you about them.',
      'To check that your address is within our delivery range.',
      'To email you an order receipt.',
      'To read your feedback and improve our products and service.',
      'To keep the website secure and working properly.',
    ],
    after: [
      'We do not sell your personal information, and we do not use it for advertising.',
    ],
  },
  {
    title: 'Who we share it with',
    body: [
      'We only share what is needed with the service providers that run parts of this website for us:',
    ],
    list: [
      'Supabase — stores our database and handles account sign-in.',
      'Resend — sends order receipt emails.',
      'OpenStreetMap (Nominatim) — converts your delivery address into map coordinates so we can measure the distance from our shop. Only the address text is sent.',
      'Vercel — hosts the website and provides anonymous visit statistics.',
    ],
    after: [
      'Some of these providers may process data outside the Philippines. We may also disclose information when required by law.',
    ],
  },
  {
    title: 'Cookies and browser storage',
    body: [
      'We use cookies to keep you signed in. We also save your shopping cart and which announcements you have already seen in your browser\'s local storage, so they are still there when you come back. You can clear these at any time in your browser settings; doing so will sign you out and empty your cart.',
    ],
  },
  {
    title: 'How long we keep it',
    body: [
      'We keep your account information for as long as your account is open. We keep order records for as long as needed for our business and to meet legal and tax requirements. When information is no longer needed, we delete or anonymize it.',
    ],
  },
  {
    title: 'How we protect it',
    body: [
      'Your information is sent over encrypted connections (HTTPS), and access to customer and order records is limited to authorized bakery staff. No system is perfectly secure, but we take reasonable steps to protect your data from loss, misuse and unauthorized access.',
    ],
  },
  {
    title: 'Your rights',
    body: [
      'Under the Data Privacy Act, you have the right to:',
    ],
    list: [
      'be informed about how your personal information is processed;',
      'access the personal information we hold about you;',
      'correct inaccurate or outdated information;',
      'object to processing, or ask us to delete or block your information;',
      'get a copy of your information in a commonly used format; and',
      'file a complaint with the National Privacy Commission (privacy.gov.ph).',
    ],
    after: [
      'You can update most of your details yourself from your account. For anything else, contact us using the details below.',
    ],
  },
  {
    title: 'Children',
    body: [
      'Our website is meant for customers 18 and older. If you are younger, please ask a parent or guardian to order for you.',
    ],
  },
  {
    title: 'Changes to this policy',
    body: [
      'We may update this policy from time to time. When we do, we will change the effective date at the top of this page.',
    ],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="w-10 h-10" />
            <span className="font-serif text-lg font-bold text-foreground">2M&apos;s Bakery</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to shop
          </Link>
        </div>
      </header>

      <article className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-10">Effective {EFFECTIVE_DATE}</p>

        <div className="space-y-10">
          {sections.map(section => (
            <section key={section.title}>
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">
                {section.title}
              </h2>
              {section.body?.map((p, i) => (
                <p key={i} className="text-muted-foreground leading-relaxed mb-3">
                  {p}
                </p>
              ))}
              {section.list && (
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed mb-3">
                  {section.list.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
              {section.after?.map((p, i) => (
                <p key={i} className="text-muted-foreground leading-relaxed mb-3">
                  {p}
                </p>
              ))}
            </section>
          ))}

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">Contact us</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              For privacy questions or requests, reach us at:
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                Email:{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                Phone:{' '}
                <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`} className="text-primary hover:underline">
                  {CONTACT_PHONE}
                </a>
              </li>
              <li>Address: {BAKERY_ORIGIN.address}</li>
            </ul>
          </section>
        </div>
      </article>

      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-6 text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} 2M&apos;s Bakery. All rights reserved.
        </div>
      </footer>
    </main>
  )
}
