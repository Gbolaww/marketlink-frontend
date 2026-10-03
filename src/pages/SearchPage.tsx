import { useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Search } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import type { ProductResult } from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { searchApi } from '@/lib/api'
import { rememberProducts, toProduct } from '@/lib/products'
import { CATEGORIES } from '@/lib/categories'
import { openLocationDialog, useSearchLocation } from '@/lib/location'

const SORTS = [
  { value: 'relevance', label: 'Best match' },
  { value: 'distance', label: 'Closest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
]
// The API searches up to 100 km from a point.
const RADII = [5, 15, 25, 50, 100]
const MAX_RESULTS = 60

const selectClass = 'h-10 rounded-lg border border-input bg-background px-3 text-sm'

function sortResults(rows: ProductResult[], sort: string): ProductResult[] {
  const out = [...rows]
  const num = (v: number | null | undefined, fallback: number) => (v == null ? fallback : Number(v))
  switch (sort) {
    case 'distance': return out.sort((a, b) => num(a.distance_km, Infinity) - num(b.distance_km, Infinity))
    case 'price_asc': return out.sort((a, b) => a.price_minor - b.price_minor)
    case 'price_desc': return out.sort((a, b) => b.price_minor - a.price_minor)
    case 'rating': return out.sort((a, b) => num(b.rating_avg, 0) - num(a.rating_avg, 0))
    default: return out
  }
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const sort = params.get('sort') ?? 'relevance'
  const requestedRadius = Number(params.get('radius') ?? 100)
  const radius = RADII.includes(requestedRadius) ? requestedRadius : 100
  const loc = useSearchLocation()

  const [text, setText] = useState(q)

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next)
  }

  const results = useQuery({
    queryKey: ['search', q, radius, loc.lat, loc.lon],
    queryFn: async () => {
      const { data } = await searchApi.search({
        lat: loc.lat,
        lon: loc.lon,
        q: q || undefined,
        radius_km: radius,
        limit: MAX_RESULTS,
      })
      const rows = (Array.isArray(data) ? data : (data?.results ?? [])) as Record<string, unknown>[]
      return rememberProducts(rows.map(toProduct)) as ProductResult[]
    },
  })

  const rows = sortResults(results.data ?? [], sort)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    update({ q: text.trim() || null })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Search MarketLink</h1>
      <p className="mt-2 text-muted-foreground">Text, category or distance — whichever gets you to the right vendor faster.</p>

      <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="What are you looking for?" className="h-11" aria-label="Search products" />
        <Button type="submit" className="h-11"><Search /> Search</Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <MapPin className="size-4 shrink-0 text-primary" />
          <span className="min-w-0">
            Showing vendors near <strong className="font-semibold text-foreground">{loc.label}</strong>
            {loc.isDefault && ' (default)'}
          </span>
        </span>
        <Button variant="outline" size="sm" onClick={openLocationDialog}>{loc.isDefault ? 'Set my location' : 'Change'}</Button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
        <select
          className={selectClass + ' w-full sm:w-48'}
          aria-label="Category"
          value={CATEGORIES.includes(q) ? q : ''}
          onChange={(e) => { setText(e.target.value); update({ q: e.target.value || null }) }}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className={selectClass + ' w-full sm:w-48'} aria-label="Sort" value={sort} onChange={(e) => update({ sort: e.target.value })}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className={selectClass + ' w-full sm:w-44'} aria-label="Distance" value={radius} onChange={(e) => update({ radius: e.target.value === '100' ? null : e.target.value })}>
          {RADII.map((r) => <option key={r} value={r}>{'Within ' + r + ' km'}</option>)}
        </select>
      </div>

      <div className="mt-8">
        {results.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : results.isError ? (
          <p className="rounded-xl border border-dashed border-border py-16 text-center text-destructive">We couldn't load results. Please try again.</p>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <p className="font-semibold">No products matched that search</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a broader term, widen the distance, clear the category filter, or choose a different location.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={openLocationDialog}>Change location</Button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {rows.length >= MAX_RESULTS ? 'The closest ' + MAX_RESULTS + ' results' : rows.length + (rows.length === 1 ? ' result' : ' results')} near {loc.label}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {rows.map((r) => <ProductCard key={r.product_id} item={r} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
