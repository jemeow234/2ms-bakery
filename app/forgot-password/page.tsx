'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { LogoMark } from '@/components/logo-mark'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()

    if (!supabase) {
      toast.error('Something went wrong. Please try again.')
      setIsLoading(false)
      return
    }

    // Errors are intentionally not surfaced here: the confirmation message
    // below is shown regardless of outcome so we never reveal whether an
    // email address is registered.
    await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/update-password`,
})

    setIsLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>

          <div className="mb-8">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <LogoMark className="w-14 h-14" priority />
              <span className="font-serif text-2xl font-bold text-foreground">2M&apos;s Bakery</span>
            </Link>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
              Forgot Password
            </h1>
            <p className="text-muted-foreground">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-lg border border-border bg-secondary p-6 text-center">
              <MailCheck className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">Check your email</p>
              <p className="text-sm text-muted-foreground">
                If an account exists with this email, a password reset link has been sent.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-2 bg-secondary border-border"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <Image
          src="/images/focaccia.jpg"
          alt="Olive focaccia fresh from the oven"
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/70" />
        <div className="relative z-10 flex items-center justify-center w-full p-12">
          <div className="text-center text-primary-foreground">
            <LogoMark className="w-32 h-32 mx-auto mb-6 ring-4 ring-primary-foreground/30 shadow-xl" />
            <h2 className="font-serif text-4xl font-bold mb-4">2M&apos;s Bakery</h2>
            <p className="text-primary-foreground/80 max-w-sm mx-auto text-pretty">
              We&apos;ll help you get back into your account in no time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
