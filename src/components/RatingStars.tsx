import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RatingStars({ value, count }: { value?: number | null; count?: number | null }) {
  const rating = Number(value ?? 0)
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={14}
            className={cn(n <= Math.round(rating) ? 'fill-warning text-warning' : 'text-muted-foreground/40')}
          />
        ))}
      </span>
      <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
      {count == null ? null : <span>({count})</span>}
    </span>
  )
}
