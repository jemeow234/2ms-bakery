'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, RegisteredUser } from '@/lib/types'
import { users as defaultUsers } from '@/lib/data'

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
  logout: () => void
  isLoading: boolean
  registeredUsers: RegisteredUser[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load saved user session
    const savedUser = localStorage.getItem('bakery-user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }

    // Load registered users from localStorage or use defaults
    const savedRegisteredUsers = localStorage.getItem('bakery-registered-users')
    if (savedRegisteredUsers) {
      setRegisteredUsers(JSON.parse(savedRegisteredUsers))
    } else {
      // Initialize with default users
      const initialUsers: RegisteredUser[] = defaultUsers.map(u => ({
        ...u,
        phone: '',
        address: ''
      }))
      setRegisteredUsers(initialUsers)
      localStorage.setItem('bakery-registered-users', JSON.stringify(initialUsers))
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Check registered users in localStorage
    const savedUsers = localStorage.getItem('bakery-registered-users')
    const allUsers: RegisteredUser[] = savedUsers ? JSON.parse(savedUsers) : []
    
    const foundUser = allUsers.find(u => u.email === email && u.password === password)
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      localStorage.setItem('bakery-user', JSON.stringify(userWithoutPassword))
      return { success: true }
    }
    
    return { success: false, error: 'Invalid email or password' }
  }

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    // Check if email already exists
    const savedUsers = localStorage.getItem('bakery-registered-users')
    const allUsers: RegisteredUser[] = savedUsers ? JSON.parse(savedUsers) : []
    
    if (allUsers.some(u => u.email === data.email)) {
      return { success: false, error: 'An account with this email already exists' }
    }

    // Create new user
    const newUser: RegisteredUser = {
      id: `user-${Date.now()}`,
      email: data.email,
      name: data.name,
      phone: data.phone,
      address: data.address,
      password: data.password,
      role: 'user'
    }

    const updatedUsers = [...allUsers, newUser]
    setRegisteredUsers(updatedUsers)
    localStorage.setItem('bakery-registered-users', JSON.stringify(updatedUsers))

    // Auto-login after registration
    const { password: _, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    localStorage.setItem('bakery-user', JSON.stringify(userWithoutPassword))

    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('bakery-user')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, registeredUsers }}>
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
