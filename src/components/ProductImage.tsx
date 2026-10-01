import { cn } from '@/lib/utils'

// Quiet, earthy tints: the tile should read as "no photo yet", not as artwork.
const TINTS = [
  'from-stone-100 to-stone-200 text-stone-500',
  'from-amber-50 to-stone-200 text-stone-500',
  'from-stone-50 to-neutral-200 text-neutral-500',
  'from-orange-50 to-stone-200 text-stone-500',
]

/** A product photo, or a quiet monogram tile when the vendor hasn't added one yet. */
export default function ProductImage({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  if (src) {
    return <img src={src} alt={name} loading="lazy" className={cn('h-full w-full object-cover', className)} />
  }
  const tint = TINTS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % TINTS.length]
  return (
    <div
      aria-hidden
      className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br font-display text-4xl font-semibold', tint, className)}
    >
      {name.trim().charAt(0).toUpperCase() || 'M'}
    </div>
  )
}
