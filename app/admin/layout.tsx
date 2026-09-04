'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { StoreProvider } from '@/context/store-context'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  return (
    <StoreProvider>
      <div className="min-h-screen bg-background flex">
        <AdminSidebar />
        <main className="flex-1 min-w-0 ml-64 p-8">
          {children}
        </main>
      </div>
    </StoreProvider>
  )
}
