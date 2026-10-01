import type { ProductResult } from '@/components/ProductCard'

type Row = Record<string, unknown>

/** Map a /search result row from the API onto the shape the product cards use. */
export function toProduct(r: Row): ProductResult {
  return {
    product_id: String(r.product_id),
    name: String(r.product_name ?? r.name ?? ''),
    price_minor: Number(r.price_minor_units ?? r.price_minor ?? 0),
    currency: String(r.currency_code ?? r.currency ?? 'NGN'),
    business_name: (r.vendor_name ?? r.business_name) as string | undefined,
    distance_km: r.distance_km as number | undefined,
    image_url: (r.image_url ?? null) as string | null,
    rating_avg: (r.rating_avg ?? null) as number | null,
    rating_count: (r.rating_count ?? null) as number | null,
    city: (r.city ?? null) as string | null,
  }
}
