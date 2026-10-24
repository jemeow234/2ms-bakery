import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { LogoMark } from '@/components/logo-mark'
import { BAKERY_ORIGIN } from '@/lib/delivery'
import { SHOP_EMAIL, SHOP_PHONE } from '@/lib/shop'

export const metadata: Metadata = {
  title: 'FAQs',
  description: "Answers to common questions about ordering, pick-up, delivery and payment at 2M's Bakery.",
}

const faqs = [
  {
    question: 'What products does the bakery offer?',
    answer: 'We offer a variety of freshly baked breads, pastries, and other bakery products for our customers to enjoy.',
  },
  {
    question: 'How can I place an order?',
    answer: 'You can place an order through our website by selecting your desired products, adding them to your cart, and completing the checkout process.',
  },
  {
    question: 'Can I order bread in bulk?',
    answer: 'Yes! We accept bulk orders. We recommend placing your order in advance to help us prepare the quantity you need.',
  },
  {
    question: 'Can I pick up my order at the bakery?',
    answer: 'Yes, you can choose the pickup option during checkout and collect your order at our bakery.',
  },
  {
    question: 'Do you offer delivery services?',
    answer: 'Yes, we offer delivery within our designated service areas. Delivery availability may depend on your location.',
  },
  {
    question: 'How can I track my order?',
    answer: "You can check your order status through our website to see updates on your order's progress.",
  },
  {
    question: 'How will I know if my order is confirmed?',
    answer: 'You will receive an order status update through our website once your order has been reviewed and confirmed.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'Available payment methods will be displayed during checkout. Please check the payment options provided before completing your order.',
  },
  {
    question: 'Can I cancel or change my order?',
    answer: 'You may contact the bakery as soon as possible to request changes or cancellation. Approval depends on the current status of your order.',
  },
  {
    question: 'What should I do if I receive the wrong or damaged product?',
    answer: 'Please contact us and provide details about the issue so we can review your concern and assist you.',
  },
  {
    question: 'How can I check the price of a product?',
    answer: 'You can view the price of each available product on its product page before adding it to your cart.',
  },
  {
    question: 'Are all products available every day?',
    answer: 'Product availability may vary depending on daily production and stock levels. You can check the website for current availability.',
  },
  {
    question: 'Can I order products for a special occasion?',
    answer: 'Yes, you may order available bakery products for special occasions. For large orders, we recommend contacting us in advance.',
  },
  {
    question: 'How far in advance should I place a bulk order?',
    answer: 'We recommend placing bulk orders as early as possible so we have enough time to prepare them.',
  },
  {
    question: 'How can I contact the bakery?',
    answer: 'You can contact us through the contact information provided on our website for questions, concerns, or order inquiries.',
  },
]

export default function FaqsPage() {
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
          Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground mb-10">
          Can&apos;t find what you&apos;re looking for? Get in touch using the details at the bottom of this page.
        </p>

        <div className="space-y-3">
          {faqs.map(faq => (
            <details
              key={faq.question}
              className="group bg-card rounded-xl border border-border open:border-primary/30 transition-colors"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-4 sm:p-5 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-4 sm:px-5 pb-4 sm:pb-5 -mt-1 text-muted-foreground leading-relaxed">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>

        <section className="mt-12">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">Contact us</h2>
          <ul className="space-y-1 text-muted-foreground">
            <li>
              Email:{' '}
              <a href={`mailto:${SHOP_EMAIL}`} className="text-primary hover:underline">
                {SHOP_EMAIL}
              </a>
            </li>
            <li>
              Phone:{' '}
              <a href={`tel:${SHOP_PHONE.replace(/\s/g, '')}`} className="text-primary hover:underline">
                {SHOP_PHONE}
              </a>
            </li>
            <li>Address: {BAKERY_ORIGIN.address}</li>
          </ul>
        </section>
      </article>

      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-6 text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} 2M&apos;s Bakery. All rights reserved.
        </div>
      </footer>
    </main>
  )
}
