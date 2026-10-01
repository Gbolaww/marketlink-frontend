import type { ProductResult } from '@/components/ProductCard'
import { assetUrl } from '@/lib/api'

type Row = Record<string, unknown>

/** Map a /search result row from the API onto the shape the product cards use. */
export function toProduct(r: Row): ProductResult {
  return {
    product_id: String(r.product_id),
    name: String(r.product_name ?? r.name ?? ''),
    description: (r.description ?? null) as string | null,
    price_minor: Number(r.price_minor_units ?? r.price_minor ?? 0),
    currency: String(r.currency_code ?? r.currency ?? 'NGN'),
    vendor_id: r.vendor_id as string | undefined,
    business_name: (r.vendor_name ?? r.business_name) as string | undefined,
    distance_km: r.distance_km as number | undefined,
    image_url: assetUrl(r.image_url as string | null),
    rating_avg: (r.rating_avg ?? null) as number | null,
    rating_count: (r.rating_count ?? null) as number | null,
    city: (r.city ?? null) as string | null,
  }
}

// The API has no "get one product" endpoint yet, so product pages read from the
// results the user has already seen (kept per browser tab so a refresh still works).
const KEY = 'ml_seen_products'

function readCache(): Record<string, ProductResult> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function rememberProducts(list: ProductResult[]): ProductResult[] {
  const cache = readCache()
  for (const p of list) cache[p.product_id] = p
  try {
    sessionStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    /* storage full or unavailable: product pages just fall back to search */
  }
  return list
}

export function getRememberedProduct(id: string): ProductResult | undefined {
  return readCache()[id]
}
