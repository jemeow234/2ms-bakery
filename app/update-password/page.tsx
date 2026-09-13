'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

type LinkStatus = 'verifying' | 'ready' | 'invalid'

export default function UpdatePasswordPage() {
  const [linkStatus, setLinkStatus] = useState<LinkStatus>('verifying')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    if (!supabase) {
      setLinkStatus('invalid')
      return
    }

    // The recovery link's token is exchanged for a session automatically
    // (detectSessionInUrl) as soon as the client initializes, which fires
    // this event. A pre-existing session also confirms the link already
    // resolved before this listener was attached.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setLinkStatus('ready')
      }
    })

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (data.session) {
        setLinkStatus('ready')
      }
    })

    // Give the client a moment to process the URL before giving up.
    const timeout = setTimeout(() => {
      setLinkStatus(current => (current === 'verifying' ? 'invalid' : current))
    }, 3000)

    return () => {
      subscription?.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    const supabase = createClient()
    if (!supabase) {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    setIsLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    toast.success('Password updated successfully!')

    setTimeout(() => {
      router.push('/login')
    }, 2000)
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
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-serif text-2xl font-bold">2</span>
              </div>
              <span className="font-serif text-2xl font-bold text-foreground">2M&apos;s Bakery</span>
            </Link>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
              Reset Your Password
            </h1>
            <p className="text-muted-foreground">
              Choose a new password for your account.
            </p>
          </div>

          {linkStatus === 'verifying' && (
            <div className="flex items-center gap-3 text-muted-foreground py-8 justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              Verifying your reset link...
            </div>
          )}

          {linkStatus === 'invalid' && (
            <div className="rounded-lg border border-border bg-secondary p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">Link expired or invalid</p>
              <p className="text-sm text-muted-foreground mb-4">
                This password reset link is no longer valid. Please request a new one.
              </p>
              <Link href="/forgot-password">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                  Request New Link
                </Button>
              </Link>
            </div>
          )}

          {linkStatus === 'ready' && !success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="new-password" className="text-foreground">
                  New Password
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    required
                    minLength={6}
                    className="bg-secondary border-border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirm-password" className="text-foreground">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  minLength={6}
                  className="mt-2 bg-secondary border-border"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          )}

          {success && (
            <div className="rounded-lg border border-border bg-secondary p-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">Password updated!</p>
              <p className="text-sm text-muted-foreground">
                Redirecting you to sign in...
              </p>
            </div>
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
            <div className="w-24 h-24 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-6">
              <span className="font-serif text-5xl font-bold">2</span>
            </div>
            <h2 className="font-serif text-4xl font-bold mb-4">2M&apos;s Bakery</h2>
            <p className="text-primary-foreground/80 max-w-sm mx-auto text-pretty">
              Almost there — set a new password to get back to your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
