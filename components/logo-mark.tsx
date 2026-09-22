import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * The round 2M's Bakery badge. Size it with `className` (e.g. "w-10 h-10");
 * the image is decorative because every usage sits next to the written name.
 */
export function LogoMark({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <div className={cn('rounded-full overflow-hidden shrink-0 bg-white', className)}>
      <Image
        src="/images/2mslogo-mark.png"
        alt=""
        width={192}
        height={192}
        priority={priority}
        className="w-full h-full object-cover"
      />
    </div>
  )
}
