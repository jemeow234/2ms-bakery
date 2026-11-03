import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LogoMark } from '@/components/logo-mark'
import {
  BAKERY_ORIGIN,
  DELIVERY_RANGE_KM,
  MINIMUM_DELIVERY_QUANTITY,
  MINIMUM_DELIVERY_TOTAL,
} from '@/lib/delivery'
import { SHOP_EMAIL, SHOP_PHONE } from '@/lib/shop'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: "The terms for using the 2M's Bakery website and ordering for delivery or pick-up.",
}

const EFFECTIVE_DATE = 'November 3, 2026'
const CONTACT_EMAIL = SHOP_EMAIL
const CONTACT_PHONE = SHOP_PHONE

const sections = [
  {
    title: 'About these terms',
    body: [
      `These terms apply when you use the 2M's Bakery ("we", "us") website or order from us through it. We are located at ${BAKERY_ORIGIN.address}. By creating an account or placing an order, you agree to these terms. Our Privacy Policy explains how we handle your personal information.`,
    ],
  },
  {
    title: 'Your account',
    list: [
      'You need an account to place an order, and you must be 18 or older to create one. If you are younger, please ask a parent or guardian to order for you.',
      'Please give accurate details, especially your name, phone number, email and delivery address, so we can fulfill your order and reach you about it.',
      'Keep your password private. You are responsible for orders placed through your account.',
      'We may refuse orders from, or close, an account that is used for false orders, abuse or fraud.',
    ],
  },
  {
    title: 'Orders',
    body: [
      'Placing an order sends us a request to prepare it. We review each order and show its status on your order page. We may decline or cancel an order, for example if an item becomes unavailable, we cannot verify your payment, or we cannot deliver to your address. If that happens after you have paid, we will contact you about your refund.',
    ],
  },
  {
    title: 'Prices and availability',
    body: [
      'Prices are in Philippine pesos and are shown on the website and at checkout. If a price changes while you are shopping, we will ask you to review the new total before ordering. Our products are baked in limited quantities, so availability depends on daily production and stock.',
    ],
  },
  {
    title: 'Payment',
    list: [
      'GCash / InstaPay: pay using the QR code shown at checkout, then upload a screenshot of your successful payment with your order. The payment must match your order total, and we may check it before preparing your order.',
      'Cash: pay in full when you receive or pick up your order.',
    ],
    after: [
      'We do not collect or store card numbers or GCash account credentials. Please do not send payment before the checkout page shows you the QR code.',
    ],
  },
  {
    title: 'Delivery and pick-up',
    list: [
      `Delivery is free within ${DELIVERY_RANGE_KM}km of our shop, measured from the address you enter. Delivery orders need at least ${MINIMUM_DELIVERY_QUANTITY} items and a total of at least ₱${MINIMUM_DELIVERY_TOTAL}.`,
      'You choose a date and time slot at checkout. We do our best to meet it, but traffic, weather or other events outside our control may cause delays. We will contact you if we expect a significant delay.',
      'Please make sure someone is available to receive the order at the chosen time, or collect your pick-up order during your chosen slot.',
    ],
  },
  {
    title: 'Cancellations, changes and refunds',
    list: [
      'You can cancel an order yourself from My Orders while it is still pending.',
      'Once we have started preparing your order, it can no longer be cancelled on the website. Please contact us as soon as possible. Because our products are freshly baked, we may not be able to accept changes or cancellations at this stage.',
      'If you paid by GCash or InstaPay and your order is cancelled, we will contact you about your refund.',
    ],
  },
  {
    title: 'Wrong or damaged items',
    body: [
      'Please check your order when you receive it. If something is wrong, missing or damaged, contact us as soon as possible with your order number and details of the problem, and a photo if you can. We will review it and work with you on a fair solution, such as a replacement or refund.',
    ],
  },
  {
    title: 'Allergies and ingredients',
    body: [
      'We list ingredients in our product descriptions. Please check them carefully, and contact us before ordering if you have a food allergy or dietary concern. We cannot promise that any product is completely free from a particular allergen. Product photos are for illustration, and handmade items may vary slightly in appearance.',
    ],
  },
  {
    title: 'Using this website',
    body: [
      'Please do not misuse this website, including by submitting false orders or payment proofs, interfering with how it works, or trying to access accounts or data that are not yours. The website content, including our name, logo, photos and text, belongs to us or is used with permission, and may not be copied for commercial use without our written consent.',
    ],
  },
  {
    title: 'Limits on our responsibility',
    body: [
      'We work to keep the website accurate and available, but it may sometimes contain errors or be temporarily unavailable. To the extent the law allows, we are not liable for indirect losses from using the website. Nothing in these terms removes rights you have under Philippine law, including the Consumer Act of the Philippines (Republic Act No. 7394).',
    ],
  },
  {
    title: 'Governing law',
    body: [
      'These terms are governed by the laws of the Republic of the Philippines.',
    ],
  },
  {
    title: 'Changes to these terms',
    body: [
      'We may update these terms from time to time. When we do, we will change the effective date at the top of this page. The terms in effect when you place an order apply to that order.',
    ],
  },
]

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="w-10 h-10" />
            <span className="text-lg font-bold tracking-tight text-foreground">2M&apos;s Bakery</span>
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
          Terms of Service
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
              For questions about these terms or your order, reach us at:
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
