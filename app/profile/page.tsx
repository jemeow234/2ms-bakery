'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight, ClipboardList, KeyRound, Loader2, LogIn, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LogoMark } from '@/components/logo-mark'
import { useAuth } from '@/context/auth-context'
import type { User } from '@/lib/types'

export default function ProfilePage() {
  const { user, isLoading } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to the shop</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="w-9 h-9" priority />
            <span className="text-lg font-bold tracking-tight text-foreground">2M&apos;s Bakery</span>
          </Link>
          <span className="w-24" aria-hidden="true" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-6">My Profile</h1>

        {isLoading ? (
          <div className="flex justify-center py-20" role="status">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="sr-only">Loading…</span>
          </div>
        ) : !user ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border px-6">
            <LogIn className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-1">Sign in to see your profile</p>
            <p className="text-sm text-muted-foreground mb-6">
              Your details are saved to your account and filled in at checkout.
            </p>
            <Button asChild>
              <Link href="/login?next=/profile">Sign In</Link>
            </Button>
          </div>
        ) : (
          // Keyed so the form starts over from the saved values if the account changes.
          <ProfileDetails key={user.id} user={user} />
        )}
      </main>
    </div>
  )
}

function ProfileDetails({ user }: { user: User }) {
  const { refreshUser, logout } = useAuth()
  const router = useRouter()
  const [name, setName] = useState(user.name ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [address, setAddress] = useState(user.address ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const isDirty =
    name.trim() !== (user.name ?? '') ||
    phone.trim() !== (user.phone ?? '') ||
    address.trim() !== (user.address ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving) return

    if (!name.trim()) {
      toast.error('Please enter your name')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(data?.error ?? "Couldn't save your profile.")
        return
      }
      await refreshUser()
      toast.success('Profile saved')
    } catch {
      toast.error("Couldn't save your profile. Check your connection and try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
        <div
          aria-hidden="true"
          className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-2xl font-bold shrink-0"
        >
          {(user.name || user.email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{user.name || 'Your account'}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          {user.role === 'admin' && (
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              Admin
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-5 space-y-5">
        <h2 className="font-semibold text-foreground">Personal details</h2>

        <div>
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" value={user.email} disabled className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">Your sign-in email can&apos;t be changed here.</p>
        </div>

        <div>
          <Label htmlFor="profile-name">Full name</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            required
            autoComplete="name"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="profile-phone">Phone number</Label>
          <Input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            maxLength={30}
            autoComplete="tel"
            placeholder="09XX XXX XXXX"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="profile-address">Delivery address</Label>
          <Textarea
            id="profile-address"
            value={address}
            onChange={e => setAddress(e.target.value)}
            maxLength={500}
            autoComplete="street-address"
            placeholder="House no., street, barangay, city"
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">Filled in for you at checkout.</p>
        </div>

        <Button
          type="submit"
          disabled={isSaving || !isDirty}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save changes'
          )}
        </Button>
      </form>

      <div className="bg-card rounded-xl border border-border divide-y divide-border">
        <Link
          href="/orders"
          className="flex items-center gap-3 p-4 text-foreground hover:bg-primary/5 transition-colors rounded-t-xl"
        >
          <ClipboardList className="h-5 w-5 text-primary" />
          <span className="flex-1 font-medium">My Orders</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link
          href="/update-password"
          className="flex items-center gap-3 p-4 text-foreground hover:bg-primary/5 transition-colors"
        >
          <KeyRound className="h-5 w-5 text-primary" />
          <span className="flex-1 font-medium">Change password</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 text-destructive hover:bg-destructive/5 transition-colors rounded-b-xl text-left"
        >
          <LogOut className="h-5 w-5" />
          <span className="flex-1 font-medium">Log out</span>
        </button>
      </div>
    </div>
  )
}
