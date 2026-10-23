'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/logo-mark'

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <LogoMark className="w-16 h-16 mx-auto mb-6" />
        <h1 className="font-serif text-3xl font-bold text-foreground mb-3">Something went wrong</h1>
        <p className="text-muted-foreground mb-8">
          Sorry — this page didn&apos;t load properly. Please try again, or head back to the shop.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => retry()}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/">Back to the shop</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
