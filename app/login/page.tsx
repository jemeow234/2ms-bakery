'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type AuthMode = 'login' | 'register'

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  })

  const { login, register } = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await login(loginEmail, loginPassword)

    if (result.success) {
      toast.success('Welcome back!')
      router.push(result.role === 'admin' ? '/admin' : '/')
    } else {
      toast.error(result.error || 'Login failed')
    }

    setIsLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (registerData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    const result = await register({
      name: registerData.name,
      email: registerData.email,
      phone: registerData.phone,
      address: registerData.address,
      password: registerData.password
    })

    if (result.success) {
      if (result.needsEmailConfirmation) {
        toast.success('Account created! Check your email to confirm it before signing in.')
        setAuthMode('login')
      } else {
        toast.success('Account created successfully! Welcome to 2M\'s Bakery!')
        router.push('/')
      }
    } else {
      toast.error(result.error || 'Registration failed')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="mb-8">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-serif text-2xl font-bold">2</span>
              </div>
              <span className="font-serif text-2xl font-bold text-foreground">2M&apos;s Bakery</span>
            </Link>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-muted-foreground">
              {authMode === 'login' 
                ? 'Sign in to your account to continue' 
                : 'Join our bakery family today'}
            </p>
          </div>

          {/* Auth Mode Toggle */}
          <div className="flex rounded-lg bg-secondary p-1 mb-6">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all',
                authMode === 'login'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all',
                authMode === 'register'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Register
            </button>
          </div>

          {authMode === 'login' ? (
            <>
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <Label htmlFor="login-email" className="text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="mt-2 bg-secondary border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="login-password" className="text-foreground">
                    Password
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

            </>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="register-name" className="text-foreground">
                  Full Name
                </Label>
                <Input
                  id="register-name"
                  type="text"
                  value={registerData.name}
                  onChange={e => setRegisterData(s => ({ ...s, name: e.target.value }))}
                  placeholder="John Doe"
                  required
                  className="mt-2 bg-secondary border-border"
                />
              </div>

              <div>
                <Label htmlFor="register-email" className="text-foreground">
                  Email Address
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  value={registerData.email}
                  onChange={e => setRegisterData(s => ({ ...s, email: e.target.value }))}
                  placeholder="you@example.com"
                  required
                  className="mt-2 bg-secondary border-border"
                />
              </div>

              <div>
                <Label htmlFor="register-phone" className="text-foreground">
                  Contact Number
                </Label>
                <Input
                  id="register-phone"
                  type="tel"
                  value={registerData.phone}
                  onChange={e => setRegisterData(s => ({ ...s, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  required
                  className="mt-2 bg-secondary border-border"
                />
              </div>

              <div>
                <Label htmlFor="register-address" className="text-foreground">
                  Delivery Address
                </Label>
                <Input
                  id="register-address"
                  type="text"
                  value={registerData.address}
                  onChange={e => setRegisterData(s => ({ ...s, address: e.target.value }))}
                  placeholder="123 Main St, City, State 12345"
                  required
                  className="mt-2 bg-secondary border-border"
                />
              </div>

              <div>
                <Label htmlFor="register-password" className="text-foreground">
                  Password
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={e => setRegisterData(s => ({ ...s, password: e.target.value }))}
                    placeholder="Create a password (min 6 characters)"
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
                <Label htmlFor="register-confirm-password" className="text-foreground">
                  Confirm Password
                </Label>
                <Input
                  id="register-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={registerData.confirmPassword}
                  onChange={e => setRegisterData(s => ({ ...s, confirmPassword: e.target.value }))}
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                  className="mt-2 bg-secondary border-border"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                By registering, you agree to our Terms of Service and Privacy Policy.
              </p>
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
            <div className="w-24 h-24 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-6">
              <span className="font-serif text-5xl font-bold">2</span>
            </div>
            <h2 className="font-serif text-4xl font-bold mb-4">2M&apos;s Bakery</h2>
            <p className="text-primary-foreground/80 max-w-sm mx-auto text-pretty">
              {authMode === 'login' 
                ? 'Artisan breads and pastries made with love, fresh from our ovens to your table.'
                : 'Join our family and enjoy freshly baked goods, exclusive offers, and easy ordering.'}
            </p>
            
            {authMode === 'register' && (
              <div className="mt-8 grid grid-cols-2 gap-4 text-left max-w-xs mx-auto">
                <div className="bg-primary-foreground/10 p-3 rounded-lg">
                  <p className="font-semibold text-sm">Easy Ordering</p>
                  <p className="text-xs text-primary-foreground/70">Quick checkout process</p>
                </div>
                <div className="bg-primary-foreground/10 p-3 rounded-lg">
                  <p className="font-semibold text-sm">Fresh Daily</p>
                  <p className="text-xs text-primary-foreground/70">Baked every morning</p>
                </div>
                <div className="bg-primary-foreground/10 p-3 rounded-lg">
                  <p className="font-semibold text-sm">Order History</p>
                  <p className="text-xs text-primary-foreground/70">Track all orders</p>
                </div>
                <div className="bg-primary-foreground/10 p-3 rounded-lg">
                  <p className="font-semibold text-sm">Saved Address</p>
                  <p className="text-xs text-primary-foreground/70">Faster delivery</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
