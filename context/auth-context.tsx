'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import type { Session, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js'
import { migrateLocalStorageToSupabase } from '@/lib/supabase/migrate'

interface RegisterData {
  name: string
  email: string
  phone: string
  address: string
  password: string
}

interface AuthResult {
  success: boolean
  error?: string
  needsEmailConfirmation?: boolean
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<AuthResult>
  register: (data: RegisterData) => Promise<AuthResult>
  logout: () => Promise<void>
  isLoading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

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
  // No Supabase client (e.g. missing env vars) means there's nothing to load.
  const [isLoading, setIsLoading] = useState(() => !!supabase)

  useEffect(() => {
    if (!supabase) {
      return
    }

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          const profile = await loadUserProfile(supabase, session.user)
          if (profile) {
            setUser(profile)

            const migrationDone = localStorage.getItem('bakery-migration-done')
            if (!migrationDone) {
              await migrateLocalStorageToSupabase()
              localStorage.setItem('bakery-migration-done', 'true')
            }
          }
        }
      } catch (error) {
        console.error('Auth init error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      if (session?.user) {
        const profile = await loadUserProfile(supabase, session.user)
        setUser(profile)
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      return { success: false, error: 'Supabase not initialized' }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data.user) {
        return { success: false, error: 'Login failed' }
      }

      const profile = await loadUserProfile(supabase, data.user)
      if (!profile) {
        return { success: false, error: 'Failed to load your profile. Please try again.' }
      }

      setUser(profile)
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed' }
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

      const profile = await loadUserProfile(supabase, authData.user, {
        name: data.name,
        phone: data.phone,
        address: data.address,
      })

      if (!profile) {
        return { success: false, error: 'Account created, but failed to set up your profile' }
      }

      setUser(profile)
      return { success: true }
    } catch (error) {
      console.error('Register error:', error)
      return { success: false, error: 'Registration failed' }
    }
  }

  const logout = async () => {
    try {
      if (!supabase) return
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const refreshUser = async () => {
    try {
      if (!supabase) return
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      if (supabaseUser) {
        const profile = await loadUserProfile(supabase, supabaseUser)
        setUser(profile)
      }
    } catch (error) {
      console.error('Refresh user error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, refreshUser }}>
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
