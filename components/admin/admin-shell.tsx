'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { AdminMobileBar, AdminSidebar } from '@/components/admin/admin-sidebar'

// The server layout has already checked the role on page load; this catches
// signing out (or losing admin) while a page is open.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  // The store comes from the root layout; mounting a second one here would
  // fetch everything twice and split admin data from the storefront's.
  return (
    <div className="min-h-screen bg-background md:flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0 md:ml-64">
        <AdminMobileBar />
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
