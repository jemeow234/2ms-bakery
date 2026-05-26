'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { migrateLocalStorageToSupabase } from '@/lib/supabase/migrate'

interface RegisterData {
  name: string
  email: string
  phone: string
  address: string
  password: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isLoading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Skip if Supabase is not initialized (build time)
        if (!supabase) {
          setIsLoading(false)
          return
        }

        // Check if user is already logged in via Supabase
        const { data: { user: supabaseUser } } = await supabase.auth.getUser()
        
        if (supabaseUser) {
          // Fetch user profile from database
          const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', supabaseUser.id)
            .single()
          
          if (userProfile) {
            setUser({
              id: userProfile.id,
              email: userProfile.email,
              name: userProfile.name,
              phone: userProfile.phone,
              address: userProfile.address,
              role: userProfile.role
            })

            // Try migration if first time
            const migrationDone = localStorage.getItem('bakery-migration-done')
            if (!migrationDone) {
              console.log('[v0] Running first-time migration...')
              await migrateLocalStorageToSupabase()
              localStorage.setItem('bakery-migration-done', 'true')
            }
          }
        }
      } catch (error) {
        console.error('[v0] Auth init error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Subscribe to auth changes
    if (!supabase) {
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (userProfile) {
          setUser({
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.name,
            phone: userProfile.phone,
            address: userProfile.address,
            role: userProfile.role
          })
        }
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not initialized' }
      }

      // First check if user exists in users table (for backwards compatibility)
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single()

      if (existingUser) {
        // Sign them up with auth if they don't have an auth account
        const { data: authUser, error: authError } = await supabase.auth.signUp({
          email,
          password: Math.random().toString(36).slice(2) // Random password
        })

        if (authError && !authError.message.includes('already registered')) {
          return { success: false, error: authError.message }
        }

        // Update user in database to have this auth id
        if (authUser?.user) {
          await supabase
            .from('users')
            .update({ id: authUser.user.id })
            .eq('email', email)
        }

        setUser({
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          phone: existingUser.phone,
          address: existingUser.address,
          role: existingUser.role
        })

        return { success: true }
      }

      return { success: false, error: 'Invalid email or password' }
    } catch (error) {
      console.error('[v0] Login error:', error)
      return { success: false, error: 'Login failed' }
    }
  }

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not initialized' }
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email)
        .single()

      if (existingUser) {
        return { success: false, error: 'An account with this email already exists' }
      }

      // Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password
      })

      if (authError) {
        return { success: false, error: authError.message }
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create account' }
      }

      // Create user profile in database
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: data.name,
          phone: data.phone || null,
          address: data.address || null,
          password: data.password, // Still storing for backwards compatibility
          role: 'user'
        })

      if (dbError) {
        return { success: false, error: dbError.message }
      }

      // Set the user
      setUser({
        id: authData.user.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        address: data.address,
        role: 'user'
      })

      return { success: true }
    } catch (error) {
      console.error('[v0] Register error:', error)
      return { success: false, error: 'Registration failed' }
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('[v0] Logout error:', error)
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      if (supabaseUser) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single()
        
        if (userProfile) {
          setUser({
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.name,
            phone: userProfile.phone,
            address: userProfile.address,
            role: userProfile.role
          })
        }
      }
    } catch (error) {
      console.error('[v0] Refresh user error:', error)
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
