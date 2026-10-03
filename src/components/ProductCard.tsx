import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductImage from '@/components/ProductImage'
import RatingStars from '@/components/RatingStars'
import { formatDistance, formatPrice } from '@/lib/utils'

export interface ProductResult {
  product_id: string
  name: string
  price_minor: number
  currency?: string
  image_url?: string | null
  business_name?: string
  description?: string | null
  vendor_id?: string
  rating_avg?: number | null
  rating_count?: number | null
  city?: string | null
  distance_km?: number | null
}

export default function ProductCard({ item }: { item: ProductResult }) {
  const location = [item.city, formatDistance(item.distance_km)].filter(Boolean).join(' · ')
  return (
    <Link
      to={'/product/' + item.product_id}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow hover:shadow-lift"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
        <ProductImage src={item.image_url} name={item.name} className="transition-transform duration-300 group-hover:scale-[1.03]" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-semibold sm:text-base leading-snug">{item.name}</h3>
        <p className="text-base font-bold text-primary sm:text-lg">{formatPrice(item.price_minor, item.currency)}</p>
        <div className="mt-auto space-y-1 text-xs text-muted-foreground">
          {item.business_name && <p className="truncate font-medium text-foreground">{item.business_name}</p>}
          {item.rating_avg != null && <RatingStars value={item.rating_avg} count={item.rating_count} />}
          <p className="flex items-center gap-1">
            <MapPin size={12} />
            {location || 'Location on request'}
          </p>
        </div>
      </div>
    </Link>
  )
}
