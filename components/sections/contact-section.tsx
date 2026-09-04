'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const contactInfo = [
  {
    icon: <MapPin className="h-5 w-5" />,
    title: 'Visit Us',
    details: ['123 Baker Street', 'Breadville, BK 12345'],
  },
  {
    icon: <Phone className="h-5 w-5" />,
    title: 'Call Us',
    details: ['(555) 123-4567', '(555) 987-6543'],
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: 'Email Us',
    details: ['hello@goldencrust.com', 'orders@goldencrust.com'],
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: 'Opening Hours',
    details: ['Mon-Sat: 6AM - 8PM', 'Sunday: 7AM - 6PM'],
  },
]

export function ContactSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: '',
  })
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Thank you for your message! We\'ll get back to you soon.')
    setFormState({ name: '', email: '', message: '' })
  }

  return (
    <section id="contact" ref={sectionRef} className="py-24 bg-card relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full -translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <span
            className={cn(
              'inline-block text-primary font-medium mb-4 transition-all duration-700',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Get in Touch
          </span>
          <h2
            className={cn(
              'font-serif text-4xl md:text-5xl font-bold text-foreground mb-6 transition-all duration-700 delay-100 text-balance',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            We&apos;d Love to <span className="text-primary">Hear From You</span>
          </h2>
          <p
            className={cn(
              'text-muted-foreground text-lg max-w-2xl mx-auto transition-all duration-700 delay-200 text-pretty',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Have a question, special request, or just want to say hello? 
            Drop us a line and we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div
            className={cn(
              'space-y-6 transition-all duration-700 delay-300',
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            )}
          >
            <div className="grid sm:grid-cols-2 gap-6">
              {contactInfo.map((info, index) => (
                <div
                  key={info.title}
                  className="p-6 bg-background rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                  style={{ transitionDelay: `${400 + index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                    {info.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {info.title}
                  </h3>
                  {info.details.map((detail, i) => (
                    <p key={i} className="text-muted-foreground text-sm">
                      {detail}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            {/* Visit Us panel */}
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image
                src="/images/whole-wheat.jpg"
                alt="Inside 2M's Bakery"
                fill
                sizes="(min-width: 1024px) 45vw, 90vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Find Us In-Store</p>
                  <p className="text-white/80 text-sm">123 Baker Street, Breadville</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div
            className={cn(
              'transition-all duration-700 delay-400',
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            )}
          >
            <form onSubmit={handleSubmit} className="p-8 bg-background rounded-2xl border border-border">
              <h3 className="font-serif text-2xl font-semibold text-foreground mb-6">
                Send us a Message
              </h3>

              <div className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Your Name
                  </label>
                  <Input
                    id="name"
                    value={formState.name}
                    onChange={e => setFormState(s => ({ ...s, name: e.target.value }))}
                    placeholder="John Doe"
                    required
                    className="bg-secondary border-border focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formState.email}
                    onChange={e => setFormState(s => ({ ...s, email: e.target.value }))}
                    placeholder="john@example.com"
                    required
                    className="bg-secondary border-border focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Your Message
                  </label>
                  <Textarea
                    id="message"
                    value={formState.message}
                    onChange={e => setFormState(s => ({ ...s, message: e.target.value }))}
                    placeholder="Tell us how we can help..."
                    rows={5}
                    required
                    className="bg-secondary border-border focus:border-primary resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-300 hover:shadow-lg"
                >
                  Send Message
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
