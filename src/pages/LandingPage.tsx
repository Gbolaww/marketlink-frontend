import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, CreditCard, MapPin, Search, Truck } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import type { ProductResult } from '@/components/ProductCard'
import RatingStars from '@/components/RatingStars'
import { buttonClass } from '@/components/ui/button-styles'
import { Input } from '@/components/ui/input'
import { searchApi } from '@/lib/api'
import { rememberProducts, toProduct } from '@/lib/products'
import { CATEGORIES, DEFAULT_ORIGIN } from '@/lib/categories'
import { formatDistance } from '@/lib/utils'

const STEPS = [
  { icon: Search, title: 'Search text or photo', body: 'Type what you need, or upload a picture and we match it against vendor catalogues.' },
  { icon: MapPin, title: 'Compare vendors nearby', body: 'Results rank by distance, rating and price so you buy from someone reachable.' },
  { icon: CreditCard, title: 'Pay on MarketLink', body: 'Checkout is handled on-platform. Vendors are paid after the order is confirmed.' },
  { icon: Truck, title: 'Track to delivery', body: 'Follow every status change and chat with the vendor on WhatsApp if needed.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const featured = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data } = await searchApi.search({ ...DEFAULT_ORIGIN, radius_km: 100 })
      const rows = (Array.isArray(data) ? data : (data?.results ?? [])) as Record<string, unknown>[]
      return rememberProducts(rows.map(toProduct)) as ProductResult[]
    },
  })

  const products = [...(featured.data ?? [])]
    .sort((a, b) => Number(b.rating_avg ?? 0) - Number(a.rating_avg ?? 0))
    .slice(0, 8)

  const vendors = Array.from(
    new Map(
      products.filter((p) => p.business_name).map((p) => [p.business_name, p] as const),
    ).values(),
  ).slice(0, 6)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    navigate('/search?q=' + encodeURIComponent(q))
  }

  return (
    <div>
      <section className="border-b border-border bg-secondary/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
            <span className="size-2 rounded-full bg-accent" /> Live in Lagos, Abuja, Ibadan, Port Harcourt & Kano
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            The vendor you need is <span className="text-primary">already close by.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Search Nigeria's local traders by product, category or photo. Compare by distance, rating and price — then pay safely on MarketLink.
          </p>
          <form className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try “ankara two piece”, “power bank”, “palm oil”…"
              className="h-12 bg-card text-base"
              aria-label="Search products"
            />
            <button type="submit" className={buttonClass('default', 'lg')}>
              <Search /> Search
            </button>
          </form>
          <div className="mt-6 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                to={'/search?q=' + encodeURIComponent(c)}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold sm:text-3xl">Products near you</h2>
          <Link to="/search" className="text-sm font-semibold text-primary hover:underline">See all products</Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />)
            : products.map((p) => <ProductCard key={p.product_id} item={p} />)}
        </div>
        {featured.isError && <p className="mt-6 text-sm text-destructive">We couldn't load products right now.</p>}
        {featured.isSuccess && products.length === 0 && (
          <p className="mt-6 text-sm text-muted-foreground">No products listed near you yet.</p>
        )}
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">How MarketLink works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.title} className="rounded-xl border border-border p-5">
                <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
                  <s.icon size={20} />
                </span>
                <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {vendors.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Verified vendors</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((v) => (
              <Link
                key={v.business_name}
                to={'/search?q=' + encodeURIComponent(v.business_name ?? '')}
                className="rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-lift"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{v.business_name}</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">
                    <BadgeCheck size={12} /> Verified
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{formatDistance(v.distance_km) ?? 'Nigeria'}</p>
                {v.rating_avg != null && <div className="mt-3"><RatingStars value={v.rating_avg} count={v.rating_count} /></div>}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="rounded-2xl border border-border bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
          <h2 className="text-3xl font-extrabold">Sell to customers already searching</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
            List your catalogue, get verified, and receive orders with payment already collected.
          </p>
          <Link to="/vendor-dashboard" className={buttonClass('secondary', 'lg', 'mt-6')}>Start selling</Link>
        </div>
      </section>
    </div>
  )
}
