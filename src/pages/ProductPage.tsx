import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, BadgeCheck, Loader2, MapPin, Minus, Plus, ShieldCheck } from 'lucide-react'
import RatingStars from '@/components/RatingStars'
import { Button } from '@/components/ui/button'
import { buttonClass } from '@/components/ui/button-styles'
import { orderApi } from '@/lib/api'
import { getUser, isLoggedIn } from '@/lib/auth'
import { getRememberedProduct } from '@/lib/products'
import { apiError, formatDistance, formatPrice } from '@/lib/utils'

export default function ProductPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const product = getRememberedProduct(id)
  const [quantity, setQuantity] = useState(1)
  const user = isLoggedIn() ? getUser() : null

  const buy = useMutation({
    mutationFn: async () => (await orderApi.createOrder({ items: [{ product_id: id, quantity }] })).data,
    onSuccess: (order) => {
      if (order?.checkout_url) window.location.href = order.checkout_url
      else navigate('/account')
    },
  })

  if (!product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">We couldn't find that product</h1>
        <p className="mt-2 text-muted-foreground">Open it from the search results and it will appear here.</p>
        <Link to="/search" className={buttonClass('default', 'md', 'mt-6')}>Browse products</Link>
      </div>
    )
  }

  const total = product.price_minor * quantity
  const distance = formatDistance(product.distance_km)

  const onBuy = () => {
    if (!user) return navigate('/auth')
    buy.mutate()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/search" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back to results
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No photo</div>
          )}
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
          {product.description && <p className="mt-5 text-muted-foreground">{product.description}</p>}

          <div className="mt-8 rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((q) => q - 1)}><Minus /></Button>
                <span className="w-6 text-center font-semibold">{quantity}</span>
                <Button variant="outline" size="icon" aria-label="Increase quantity" disabled={quantity >= 99} onClick={() => setQuantity((q) => q + 1)}><Plus /></Button>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-bold">{formatPrice(total, product.currency)}</span>
            </div>

            {user && user.role !== 'customer' ? (
              <p className="mt-4 text-sm text-muted-foreground">Sign in with a customer account to buy this product.</p>
            ) : (
              <Button size="lg" className="mt-4 w-full" disabled={buy.isPending} onClick={onBuy}>
                {buy.isPending && <Loader2 className="animate-spin" />}
                {user ? 'Buy now' : 'Sign in to buy'}
              </Button>
            )}
            {buy.isError && <p role="alert" className="mt-3 text-sm text-destructive">{apiError(buy.error)}</p>}
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck size={14} className="mt-0.5 shrink-0" />
              Pay safely on MarketLink. The vendor is paid only after the order is confirmed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
