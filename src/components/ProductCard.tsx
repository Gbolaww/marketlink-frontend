import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import RatingStars from '@/components/RatingStars'
import { formatDistance, formatPrice } from '@/lib/utils'

export interface ProductResult {
  product_id: string
  name: string
  price_minor: number
  currency?: string
  image_url?: string | null
  business_name?: string
  rating_avg?: number | null
  rating_count?: number | null
  city?: string | null
  distance_km?: number | null
}

export default function ProductCard({ item }: { item: ProductResult }) {
  const location = [item.city, formatDistance(item.distance_km)].filter(Boolean).join(' · ')
  return (
    <Link
      to={'/search?q=' + encodeURIComponent(item.name)}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow hover:shadow-lift"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No photo</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug">{item.name}</h3>
        <p className="text-lg font-bold text-primary">{formatPrice(item.price_minor, item.currency)}</p>
        <div className="mt-auto space-y-1 text-xs text-muted-foreground">
          {item.business_name && <p className="truncate font-medium text-foreground">{item.business_name}</p>}
          <RatingStars value={item.rating_avg} count={item.rating_count} />
          <p className="flex items-center gap-1">
            <MapPin size={12} />
            {location || 'Location on request'}
          </p>
        </div>
      </div>
    </Link>
  )
}
