import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import ProductImage from '@/components/ProductImage'
import { Button } from '@/components/ui/button'
import { buttonClass } from '@/components/ui/button-styles'
import { orderApi } from '@/lib/api'
import { getUser, isLoggedIn } from '@/lib/auth'
import { cartTotal, clearCart, removeFromCart, setQuantity, useCart } from '@/lib/cart'
import { apiError, formatPrice } from '@/lib/utils'

export default function CartPage() {
  const cart = useCart()
  const navigate = useNavigate()
  const user = isLoggedIn() ? getUser() : null
  const currency = cart.items[0]?.currency ?? 'NGN'

  const checkout = useMutation({
    mutationFn: async () =>
      (await orderApi.createOrder({ items: cart.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })) })).data,
    onSuccess: (order) => {
      clearCart()
      if (order?.checkout_url) window.location.href = order.checkout_url
      else navigate('/account')
    },
  })

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <ShoppingBag className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Find something from a vendor near you.</p>
        <Link to="/search" className={buttonClass('default', 'md', 'mt-6')}>Browse products</Link>
      </div>
    )
  }

  const onCheckout = () => {
    if (!user) return navigate('/auth')
    checkout.mutate()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Your cart</h1>
      {cart.vendorName && <p className="mt-2 text-muted-foreground">Items from {cart.vendorName}</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {cart.items.map((i) => (
            <li key={i.product_id} className="flex gap-4 p-4">
              <Link to={'/product/' + i.product_id} className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                <ProductImage src={i.image_url} name={i.name} className="text-2xl" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link to={'/product/' + i.product_id} className="line-clamp-2 font-semibold leading-snug hover:underline">{i.name}</Link>
                <p className="mt-1 text-sm text-muted-foreground">{formatPrice(i.price_minor, i.currency)} each</p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="size-8" aria-label="Decrease quantity" disabled={i.quantity <= 1} onClick={() => setQuantity(i.product_id, i.quantity - 1)}><Minus /></Button>
                    <span className="w-6 text-center text-sm font-semibold">{i.quantity}</span>
                    <Button variant="outline" size="icon" className="size-8" aria-label="Increase quantity" onClick={() => setQuantity(i.product_id, i.quantity + 1)}><Plus /></Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{formatPrice(i.price_minor * i.quantity, i.currency)}</span>
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label={'Remove ' + i.name} onClick={() => removeFromCart(i.product_id)}><Trash2 /></Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-semibold">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatPrice(cartTotal(cart), currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="text-muted-foreground">Arranged with the vendor</dd></div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-border pt-4 text-lg font-bold">
            <span>Total</span><span>{formatPrice(cartTotal(cart), currency)}</span>
          </div>
          {user && user.role !== 'customer' ? (
            <p className="mt-4 text-sm text-muted-foreground">Sign in with a customer account to check out.</p>
          ) : (
            <Button size="lg" className="mt-4 w-full" disabled={checkout.isPending} onClick={onCheckout}>
              {checkout.isPending && <Loader2 className="animate-spin" />}
              {user ? 'Pay securely' : 'Sign in to check out'}
            </Button>
          )}
          {checkout.isError && <p role="alert" className="mt-3 text-sm text-destructive">{apiError(checkout.error)}</p>}
          <p className="mt-4 text-xs text-muted-foreground">Your payment is held by MarketLink until the vendor marks the order fulfilled.</p>
        </aside>
      </div>
    </div>
  )
}
