import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'
import ProductImage from '@/components/ProductImage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { orderApi } from '@/lib/api'
import type { DeliveryDetails } from '@/lib/api'
import { getUser } from '@/lib/auth'
import { cartTotal, clearCart, useCart } from '@/lib/cart'
import { NIGERIAN_STATES, loadDelivery, saveDelivery } from '@/lib/delivery'
import { apiError, formatPrice } from '@/lib/utils'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      {children}
      {hint && <span className="block text-xs font-normal text-muted-foreground">{hint}</span>}
    </label>
  )
}

export default function CheckoutPage() {
  const cart = useCart()
  const navigate = useNavigate()
  const user = getUser()
  const saved = loadDelivery()
  const [form, setForm] = useState<DeliveryDetails>({
    name: saved.name ?? '',
    phone: saved.phone ?? '',
    address: saved.address ?? '',
    city: saved.city ?? '',
    state: saved.state ?? '',
    notes: saved.notes ?? '',
  })
  const set = (k: keyof DeliveryDetails) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const currency = cart.items[0]?.currency ?? 'NGN'

  const pay = useMutation({
    mutationFn: async () =>
      (
        await orderApi.createOrder({
          items: cart.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          delivery: { ...form, notes: form.notes?.trim() || undefined },
        })
      ).data,
    onSuccess: (order) => {
      saveDelivery(form)
      clearCart()
      if (order?.checkout_url) window.location.href = order.checkout_url
      else navigate('/account')
    },
  })

  if (cart.items.length === 0 && !pay.isPending && !pay.isSuccess) return <Navigate to="/cart" replace />

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    pay.mutate()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/cart" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back to cart
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold">Checkout</h1>
      <p className="mt-2 text-muted-foreground">Tell {cart.vendorName ?? 'the vendor'} where to deliver your order.</p>

      <form onSubmit={onSubmit} className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <section className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold">Contact</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input value={form.name} onChange={set('name')} autoComplete="name" required minLength={2} maxLength={120} />
              </Field>
              <Field label="Phone number" hint="The vendor may call to arrange delivery.">
                <Input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="0803 000 0000" required minLength={7} maxLength={20} pattern="[0-9+\-() ]{7,20}" />
              </Field>
            </div>
            {user && <p className="mt-4 text-sm text-muted-foreground">Order updates will be sent to {user.email}.</p>}
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold">Delivery address</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Street address">
                  <Input value={form.address} onChange={set('address')} autoComplete="street-address" placeholder="House number and street" required minLength={5} maxLength={300} />
                </Field>
              </div>
              <Field label="City / area">
                <Input value={form.city} onChange={set('city')} autoComplete="address-level2" required minLength={2} maxLength={100} />
              </Field>
              <Field label="State">
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={form.state}
                  onChange={set('state')}
                  autoComplete="address-level1"
                  required
                >
                  <option value="">Select a state</option>
                  {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Delivery notes (optional)" hint="Landmarks, gate instructions, preferred time.">
                  <Input value={form.notes ?? ''} onChange={set('notes')} maxLength={500} />
                </Field>
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-24">
          <h2 className="font-semibold">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {cart.items.map((i) => (
              <li key={i.product_id} className="flex gap-3 text-sm">
                <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                  <ProductImage src={i.image_url} name={i.name} className="text-base" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-medium leading-snug">{i.name}</p>
                  <p className="text-muted-foreground">Qty {i.quantity}</p>
                </div>
                <p className="font-medium">{formatPrice(i.price_minor * i.quantity, i.currency)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(cartTotal(cart), currency)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="text-muted-foreground">Arranged with the vendor</span></div>
          </div>
          <div className="mt-4 flex justify-between border-t border-border pt-4 text-lg font-bold">
            <span>Total</span><span>{formatPrice(cartTotal(cart), currency)}</span>
          </div>
          <Button type="submit" size="lg" className="mt-5 w-full" disabled={pay.isPending}>
            {pay.isPending && <Loader2 className="animate-spin" />} Continue to payment
          </Button>
          {pay.isError && <p role="alert" className="mt-3 text-sm text-destructive">{apiError(pay.error)}</p>}
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            You'll pay on Paystack's secure page. MarketLink holds your payment until the vendor marks the order fulfilled.
          </p>
        </aside>
      </form>
    </div>
  )
}
