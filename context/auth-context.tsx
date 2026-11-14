'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { User } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js'

interface RegisterData {
  name: string
  email: string
  phone: string
  address: string
  password: string
  captchaToken?: string
}

interface AuthResult {
  success: boolean
  error?: string
  needsEmailConfirmation?: boolean
  // The password was right; the emailed sign-in code must be entered next.
  needsVerification?: boolean
  role?: User['role']
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, captchaToken?: string) => Promise<AuthResult>
  register: (data: RegisterData) => Promise<AuthResult>
  logout: () => Promise<void>
  // Set while signed in with a password but before this session's emailed
  // code has been entered. `user` stays null until then.
  pendingVerificationEmail: string | null
  verifyLoginCode: (code: string) => Promise<AuthResult>
  resendLoginCode: () => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Every new sign-in session must enter a code emailed to the account owner
// before it counts (supabase/migrations/0026_login_verification.sql).
async function isSessionVerified(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc('session_verified')
  if (error) console.error('Session verification check failed:', error)
  return data === true
}

async function requestLoginCode(): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/login-code', { method: 'POST' })
    const body = await res.json().catch(() => ({}))
    return res.ok ? { success: true } : { success: false, error: body.error ?? "Couldn't send your code" }
  } catch {
    return { success: false, error: "Couldn't send your code" }
  }
}

// Fetches the user's profile row, creating it from auth metadata if this is
// their first session after confirming their email (the profile can't be
// created at signup time when email confirmation is required, since there's
// no session yet to satisfy the insert's RLS policy).
async function loadUserProfile(
  supabase: SupabaseClient,
  authUser: SupabaseUser,
  fallback?: { name?: string; phone?: string; address?: string }
): Promise<User | null> {
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (existing) return existing as User

  const metadata = authUser.user_metadata || {}
  const { data: created, error } = await supabase
    .from('users')
    .insert({
      id: authUser.id,
      email: authUser.email,
      name: fallback?.name ?? metadata.name ?? '',
      phone: fallback?.phone ?? metadata.phone ?? null,
      address: fallback?.address ?? metadata.address ?? null,
      role: 'user',
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create user profile:', error)
    return null
  }

  return created as User
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  // Starts true on both server and client (createClient() only returns a
  // client in the browser, so seeding this from `supabase` would mismatch
  // during hydration). The effect below resolves it in every code path.
  const [isLoading, setIsLoading] = useState(true)
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null)
  // Whose profile is loaded, so token refreshes don't reload it.
  const loadedUserId = useRef<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false)
      return
    }

    // Subscribing replays the current session as INITIAL_SESSION, so this one
    // listener covers page load, sign-in, sign-out and account changes.
    let cancelled = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      const authUser = session?.user ?? null

      if (!authUser) {
        loadedUserId.current = null
        setUser(null)
        setPendingVerificationEmail(null)
        setIsLoading(false)
        return
      }

      // Tokens refresh about hourly and whenever the tab regains focus; the
      // profile only needs reloading for a different person or an edit.
      if (authUser.id === loadedUserId.current && event !== 'USER_UPDATED') return

      // Supabase calls this while holding its auth lock, and a query from
      // inside it can wait on that same lock. Load the profile just after.
      setTimeout(async () => {
        try {
          if (!(await isSessionVerified(supabase))) {
            // Signed in with a password, but the emailed code isn't in yet.
            if (!cancelled) {
              loadedUserId.current = null
              setUser(null)
              setPendingVerificationEmail(authUser.email ?? '')
            }
            return
          }
          const profile = await loadUserProfile(supabase, authUser)
          if (cancelled) return
          loadedUserId.current = profile ? authUser.id : null
          setPendingVerificationEmail(null)
          setUser(profile)
        } catch (error) {
          console.error('Auth profile load error:', error)
        } finally {
          if (!cancelled) setIsLoading(false)
        }
      }, 0)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [supabase])

  const login = async (email: string, password: string, captchaToken?: string): Promise<AuthResult> => {
    if (!supabase) {
      return { success: false, error: 'Supabase not initialized' }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } })

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data.user) {
        return { success: false, error: 'Login failed' }
      }

      // Password is right; now the emailed code. This is a new session, so
      // it always needs one.
      setPendingVerificationEmail(data.user.email ?? email)
      const sent = await requestLoginCode()
      return { success: true, needsVerification: true, error: sent.error }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed' }
    }
  }

  const verifyLoginCode = async (code: string): Promise<AuthResult> => {
    if (!supabase) {
      return { success: false, error: 'Supabase not initialized' }
    }

    try {
      const res = await fetch('/api/auth/login-code/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        return { success: false, error: body.error ?? 'Verification failed' }
      }

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        return { success: false, error: 'Please sign in again.' }
      }

      const profile = await loadUserProfile(supabase, authUser)
      if (!profile) {
        return { success: false, error: 'Failed to load your profile. Please try again.' }
      }

      loadedUserId.current = authUser.id
      setPendingVerificationEmail(null)
      setUser(profile)
      return { success: true, role: profile.role }
    } catch (error) {
      console.error('Verify code error:', error)
      return { success: false, error: 'Verification failed' }
    }
  }

  const register = async (data: RegisterData): Promise<AuthResult> => {
    if (!supabase) {
      return { success: false, error: 'Supabase not initialized' }
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          // Without this, the confirmation link points at the project's
          // dashboard Site URL instead of the site the user signed up on.
          emailRedirectTo: `${window.location.origin}/`,
          captchaToken: data.captchaToken,
          data: {
            name: data.name,
            phone: data.phone,
            address: data.address,
          },
        },
      })

      if (authError) {
        return { success: false, error: authError.message }
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create account' }
      }

      // Supabase returns a user with no identities (instead of an error) when
      // the email is already registered, to avoid leaking which emails exist.
      if (authData.user.identities?.length === 0) {
        return { success: false, error: 'An account with this email already exists' }
      }

      // No session means email confirmation is required before the account
      // is usable. The profile row gets created on their first real login.
      if (!authData.session) {
        return { success: true, needsEmailConfirmation: true }
      }

      // Signed straight in (email confirmation is off): this session needs
      // the emailed code like any other. The profile row is created from the
      // signup metadata once it's verified.
      setPendingVerificationEmail(authData.user.email ?? data.email)
      const sent = await requestLoginCode()
      return { success: true, needsVerification: true, error: sent.error }
    } catch (error) {
      console.error('Register error:', error)
      return { success: false, error: 'Registration failed' }
    }
  }

  const logout = async () => {
    try {
      if (!supabase) return
      await supabase.auth.signOut()
      loadedUserId.current = null
      setUser(null)
      setPendingVerificationEmail(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const refreshUser = async () => {
    try {
      if (!supabase) return
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      if (supabaseUser && (await isSessionVerified(supabase))) {
        const profile = await loadUserProfile(supabase, supabaseUser)
        setUser(profile)
      }
    } catch (error) {
      console.error('Refresh user error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{
      user, login, register, logout, isLoading, refreshUser,
      pendingVerificationEmail, verifyLoginCode, resendLoginCode: requestLoginCode,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
