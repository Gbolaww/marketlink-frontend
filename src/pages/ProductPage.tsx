import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BadgeCheck, Check, MapPin, Minus, Plus, ShieldCheck } from 'lucide-react'
import ProductImage from '@/components/ProductImage'
import type { ProductResult } from '@/components/ProductCard'
import RatingStars from '@/components/RatingStars'
import { Button } from '@/components/ui/button'
import { buttonClass } from '@/components/ui/button-styles'
import { assetUrl, productApi } from '@/lib/api'
import { getUser, isLoggedIn } from '@/lib/auth'
import { addToCart, wouldMixVendors } from '@/lib/cart'
import { getRememberedProduct } from '@/lib/products'
import { formatDistance, formatPrice } from '@/lib/utils'

type Row = Record<string, unknown>

export default function ProductPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const user = isLoggedIn() ? getUser() : null

  // Distance only exists on search results, so keep what the user already saw and layer the fresh details on top.
  const seen = getRememberedProduct(id)
  const fresh = useQuery({
    queryKey: ['product', id],
    retry: false,
    queryFn: async () => (await productApi.get(id)).data as Row,
  })

  const product: ProductResult | undefined = fresh.data
    ? {
        product_id: String(fresh.data.id),
        name: String(fresh.data.name),
        description: (fresh.data.description ?? null) as string | null,
        price_minor: Number(fresh.data.price_minor_units),
        currency: String(fresh.data.currency_code),
        vendor_id: String(fresh.data.vendor_id),
        business_name: String(fresh.data.vendor_name),
        image_url: assetUrl(fresh.data.image_url as string | null),
        rating_avg: Number(fresh.data.vendor_rating_count) > 0 ? Number(fresh.data.vendor_rating_avg) : null,
        rating_count: Number(fresh.data.vendor_rating_count),
        distance_km: seen?.distance_km,
      }
    : seen

  if (!product && fresh.isLoading) {
    return <div className="mx-auto max-w-5xl px-4 py-10"><div className="h-96 animate-pulse rounded-xl bg-muted" /></div>
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">This product isn't available</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed, or the vendor is no longer taking orders.</p>
        <Link to="/search" className={buttonClass('default', 'md', 'mt-6')}>Browse products</Link>
      </div>
    )
  }

  const total = product.price_minor * quantity
  const distance = formatDistance(product.distance_km)
  const stock = fresh.data?.stock_quantity as number | null | undefined
  const soldOut = stock != null && stock <= 0
  const maxQty = stock != null ? Math.max(1, Math.min(99, stock)) : 99

  /** Returns false if the shopper declined to start a new cart. */
  const put = () => {
    const vendor = { id: product.vendor_id, name: product.business_name }
    const mixing = wouldMixVendors(product.vendor_id)
    if (mixing && !window.confirm('Your cart has items from another vendor. Start a new cart with this item?')) return false
    addToCart(
      { product_id: product.product_id, name: product.name, price_minor: product.price_minor, currency: product.currency ?? 'NGN', image_url: product.image_url ?? null },
      vendor,
      quantity,
      mixing,
    )
    return true
  }

  const onAdd = () => {
    if (!put()) return
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2500)
  }

  const onBuy = () => {
    if (!user) return navigate('/auth')
    if (put()) navigate('/checkout')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/search" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back to results
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
          <ProductImage src={product.image_url} name={product.name} className="text-7xl" />
        </div>

        <div>
          <h1 className="text-3xl font-extrabold">{product.name}</h1>
          <p className="mt-3 text-3xl font-bold text-primary">{formatPrice(product.price_minor, product.currency)}</p>

          {product.business_name && (
            <p className="mt-4 flex items-center gap-2 text-sm">
              <span className="font-semibold">{product.business_name}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                <BadgeCheck size={12} /> Verified
              </span>
            </p>
          )}
          {product.rating_avg != null && <div className="mt-2"><RatingStars value={product.rating_avg} count={product.rating_count} /></div>}
          {distance && (
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin size={14} /> {distance}</p>
          )}
          {product.description && <p className="mt-5 leading-relaxed text-muted-foreground">{product.description}</p>}
          {stock != null && !soldOut && stock <= 5 && <p className="mt-3 text-sm font-medium text-primary">Only {stock} left</p>}

          <div className="mt-8 rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((q) => q - 1)}><Minus /></Button>
                <span className="w-6 text-center font-semibold">{quantity}</span>
                <Button variant="outline" size="icon" aria-label="Increase quantity" disabled={quantity >= maxQty} onClick={() => setQuantity((q) => q + 1)}><Plus /></Button>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-bold">{formatPrice(total, product.currency)}</span>
            </div>

            {soldOut ? (
              <p className="mt-4 text-sm font-medium text-destructive">This item is out of stock.</p>
            ) : user && user.role !== 'customer' ? (
              <p className="mt-4 text-sm text-muted-foreground">Sign in with a customer account to buy this product.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button size="lg" variant="outline" onClick={onAdd}>
                  {added ? <><Check /> Added</> : 'Add to cart'}
                </Button>
                <Button size="lg" onClick={onBuy}>
                  {user ? 'Buy now' : 'Sign in to buy'}
                </Button>
              </div>
            )}
            {added && (
              <Link to="/cart" className="mt-3 block text-center text-sm font-semibold text-primary hover:underline">View cart</Link>
            )}
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck size={14} className="mt-0.5 shrink-0" />
              Your payment is held by MarketLink until the vendor marks the order fulfilled.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
