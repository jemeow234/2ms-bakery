import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/logo-mark'

export const metadata = {
  title: 'Page not found',
}

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <LogoMark className="w-16 h-16 mx-auto mb-6" />
        <p className="text-sm font-medium text-primary mb-2">404</p>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-3">We couldn&apos;t find that page</h1>
        <p className="text-muted-foreground mb-8">
          It may have moved, or the link might be mistyped. Our breads are still right where we left them.
        </p>
        <Button asChild>
          <Link href="/">Back to the shop</Link>
        </Button>
      </div>
    </main>
  )
}
