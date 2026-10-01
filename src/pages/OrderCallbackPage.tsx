import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buttonClass } from '@/components/ui/button-styles'
import { orderApi } from '@/lib/api'
import { apiError, formatPrice } from '@/lib/utils'

type Row = Record<string, unknown>
type Phase = { kind: 'checking' } | { kind: 'paid'; order: Row } | { kind: 'unpaid'; order: Row } | { kind: 'error'; message: string }

const RETRY_MS = 2500
const MAX_TRIES = 4

const when = (v: unknown) => {
  const d = v ? new Date(String(v)) : null
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleString('en-NG', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—'
}

/**
 * Paystack sends the customer back here after paying. We don't trust the URL: the backend checks the
 * payment with Paystack itself and returns the order, which is then shown as the confirmation.
 */
export default function OrderCallbackPage() {
  const [params] = useSearchParams()
  const reference = params.get('reference') ?? params.get('trxref')
  const qc = useQueryClient()
  const [phase, setPhase] = useState<Phase>(reference ? { kind: 'checking' } : { kind: 'error', message: 'This payment link is missing its reference.' })
  const [attempt, setAttempt] = useState(0)
  const retry = () => {
    setPhase({ kind: 'checking' })
    setAttempt((a) => a + 1)
  }

  useEffect(() => {
    if (!reference) return
    let cancelled = false
    let timer = 0
    let tries = 0

    const check = async () => {
      try {
        const { data } = await orderApi.verifyPayment(reference)
        if (cancelled) return
        const status = String(data?.status ?? '')
        if (status !== 'pending') {
          qc.invalidateQueries({ queryKey: ['my-orders'] })
          setPhase({ kind: 'paid', order: data })
          return
        }
        tries += 1
        if (tries >= MAX_TRIES) setPhase({ kind: 'unpaid', order: data })
        else timer = window.setTimeout(check, RETRY_MS)
      } catch (err) {
        if (!cancelled) setPhase({ kind: 'error', message: apiError(err) })
      }
    }

    check()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [reference, attempt, qc])

  if (phase.kind === 'checking') {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <Loader2 className="mx-auto size-10 animate-spin text-primary" />
        <h1 className="mt-6 text-2xl font-bold">Confirming your payment…</h1>
        <p className="mt-2 text-muted-foreground">This only takes a moment. Please don't close this page.</p>
      </div>
    )
  }

  if (phase.kind === 'error') {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <XCircle className="mx-auto size-12 text-destructive" />
        <h1 className="mt-6 text-2xl font-bold">We couldn't confirm that payment</h1>
        <p className="mt-2 text-muted-foreground">{phase.message}</p>
        <div className="mt-6 flex justify-center gap-3">
          {reference && <Button onClick={retry}>Try again</Button>}
          <Link to="/account" className={buttonClass('outline', 'md')}>My orders</Link>
        </div>
      </div>
    )
  }

  const order = phase.order
  const id = String(order.id)

  if (phase.kind === 'unpaid') {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <XCircle className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-6 text-2xl font-bold">Payment not completed</h1>
        <p className="mt-2 text-muted-foreground">
          Paystack hasn't confirmed a payment for this order yet. If you were charged, check again in a minute. Otherwise you can finish checkout now.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {typeof order.checkout_url === 'string' && <a href={order.checkout_url} className={buttonClass('default', 'md')}>Complete checkout</a>}
          <Button variant="outline" onClick={retry}>Check again</Button>
          <Link to="/account" className={buttonClass('ghost', 'md')}>My orders</Link>
        </div>
      </div>
    )
  }

  const currency = String(order.currency_code ?? 'NGN')
  const items = (Array.isArray(order.items) ? order.items : []) as Row[]
  const ref = id.slice(0, 8).toUpperCase()
  const hasDelivery = !!order.delivery_address

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-14 text-accent" />
        <h1 className="mt-5 text-3xl font-extrabold">Payment complete</h1>
        <p className="mt-2 text-muted-foreground">Thank you. Your order is confirmed and the vendor has been notified.</p>
      </div>

      <section className="mt-10 rounded-xl border border-border bg-card p-6 shadow-card">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="text-muted-foreground">Order number</dt><dd className="mt-0.5 font-mono font-semibold">{ref}</dd></div>
          <div><dt className="text-muted-foreground">Date</dt><dd className="mt-0.5 font-medium">{when(order.created_at)}</dd></div>
          <div><dt className="text-muted-foreground">Amount paid</dt><dd className="mt-0.5 font-semibold">{formatPrice(Number(order.total_minor_units ?? 0), currency)}</dd></div>
        </dl>

        <ul className="mt-6 divide-y divide-border border-y border-border text-sm">
          {items.map((it, i) => (
            <li key={i} className="flex justify-between gap-4 py-3">
              <span>{String(it.quantity)} × {String(it.product_name)}</span>
              <span className="font-medium">{formatPrice(Number(it.unit_price_minor_units ?? 0) * Number(it.quantity ?? 1), currency)}</span>
            </li>
          ))}
        </ul>

        {hasDelivery && (
          <div className="mt-6 text-sm">
            <h2 className="font-semibold">Delivering to</h2>
            <address className="mt-2 not-italic leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">{String(order.delivery_name)}</span><br />
              {String(order.delivery_address)}<br />
              {[order.delivery_city, order.delivery_state].filter(Boolean).join(', ')}<br />
              {String(order.delivery_phone)}
            </address>
            {order.delivery_notes ? <p className="mt-2 text-muted-foreground">Note: {String(order.delivery_notes)}</p> : null}
          </div>
        )}

        <p className="mt-6 break-all text-xs text-muted-foreground">Payment reference: <span className="font-mono">{String(order.processor_reference ?? reference)}</span></p>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">What happens next</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>The vendor prepares your order and may call you to arrange delivery.</li>
          <li>Your payment is held securely by MarketLink until the vendor marks the order fulfilled.</li>
          <li>Follow every step from your order page.</li>
        </ol>
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to={'/orders/' + id} className={buttonClass('default', 'lg')}>View order</Link>
        <Link to="/search" className={buttonClass('outline', 'lg')}>Continue shopping</Link>
      </div>
    </div>
  )
}
