import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Check, Printer } from 'lucide-react'
import { QueryState } from '@/components/dashboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonClass } from '@/components/ui/button-styles'
import { orderApi } from '@/lib/api'
import { cn, formatPrice, ORDER_STATUS } from '@/lib/utils'

type Row = Record<string, unknown>

const STEPS = [
  { key: 'pending', title: 'Order placed', body: 'We received your order and are waiting for payment.' },
  { key: 'paid', title: 'Payment received', body: 'Your payment is held securely by MarketLink.' },
  { key: 'fulfilled', title: 'Fulfilled by the vendor', body: 'The vendor has marked your order as fulfilled.' },
  { key: 'settled', title: 'Complete', body: 'The vendor has been paid and the order is closed.' },
]

const SIDE_NOTES: Record<string, string> = {
  disputed: 'This order is under review. MarketLink will contact you about next steps.',
  refunded: 'This order was refunded to your original payment method.',
  cancelled: 'This order was cancelled.',
}

function when(value: unknown) {
  const d = value ? new Date(String(value)) : null
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleString('en-NG', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—'
}

export default function OrderPage() {
  const { id = '' } = useParams()
  const orders = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await orderApi.getMyOrders()
      return (Array.isArray(data) ? data : []) as Row[]
    },
  })
  const order = (orders.data ?? []).find((o) => String(o.id) === id)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/account" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground print:hidden">
        <ArrowLeft size={16} /> My orders
      </Link>

      <QueryState loading={orders.isLoading} error={orders.isError}>
        {!order ? (
          <p className="mt-10 text-center text-muted-foreground">We couldn't find that order.</p>
        ) : (
          <OrderView order={order} />
        )}
      </QueryState>
    </div>
  )
}

function OrderView({ order }: { order: Row }) {
  const status = String(order.status ?? '')
  const currency = String(order.currency_code ?? 'NGN')
  const items = (Array.isArray(order.items) ? order.items : []) as Row[]
  const reached = STEPS.findIndex((s) => s.key === status)
  // Disputed/refunded orders were paid; cancelled orders never progressed past placement.
  const progress = reached >= 0 ? reached : status === 'cancelled' ? 0 : 1
  const side = SIDE_NOTES[status]
  const ref = String(order.id).slice(0, 8).toUpperCase()

  return (
    <>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Order {ref}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Placed {when(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Badge>{ORDER_STATUS[status] ?? status}</Badge>
          {status === 'pending' && typeof order.checkout_url === 'string' && (
            <a href={order.checkout_url} className={buttonClass('default', 'sm')}>Pay now</a>
          )}
        </div>
      </div>

      <section className="mt-8 rounded-xl border border-border bg-card p-6 print:hidden">
        <h2 className="font-semibold">Progress</h2>
        <ol className="mt-5 space-y-0">
          {STEPS.map((s, i) => {
            const done = i <= progress && status !== 'cancelled'
            const current = i === progress && status !== 'settled' && status !== 'cancelled'
            return (
              <li key={s.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold',
                      done ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-background text-muted-foreground',
                      current && 'ring-4 ring-accent/20',
                    )}
                  >
                    {done ? <Check size={14} /> : i + 1}
                  </span>
                  {i < STEPS.length - 1 && <span className={cn('my-1 w-px flex-1', i < progress && done ? 'bg-accent' : 'bg-border')} />}
                </div>
                <div className="pb-6">
                  <p className={cn('font-medium', !done && 'text-muted-foreground')}>{s.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {s.key === 'pending' && progress > 0 ? 'We received your order.' : s.body}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
        {side && <p className="mt-2 rounded-lg bg-secondary px-4 py-3 text-sm">{side}</p>}
      </section>

      <section className="mt-8 rounded-xl border border-border bg-card p-6" aria-label="Receipt">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Receipt</h2>
          <Button variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}><Printer /> Print</Button>
        </div>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Order number</dt><dd className="font-mono font-medium">{ref}</dd></div>
          <div><dt className="text-muted-foreground">Date</dt><dd className="font-medium">{when(order.created_at)}</dd></div>
          <div><dt className="text-muted-foreground">Paid with</dt><dd className="font-medium capitalize">{String(order.payment_processor ?? 'paystack')}</dd></div>
          <div><dt className="text-muted-foreground">Payment reference</dt><dd className="break-all font-mono text-xs font-medium">{String(order.processor_reference ?? '—')}</dd></div>
        </dl>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Price</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const qty = Number(it.quantity ?? 1)
              const unit = Number(it.unit_price_minor_units ?? 0)
              return (
                <tr key={i} className="border-b border-border/60">
                  <td className="py-3 pr-3 font-medium">{String(it.product_name ?? 'Item')}</td>
                  <td className="py-3 text-right">{qty}</td>
                  <td className="py-3 text-right">{formatPrice(unit, currency)}</td>
                  <td className="py-3 text-right">{formatPrice(unit * qty, currency)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="pt-4 text-right font-semibold">Total</td>
              <td className="pt-4 text-right text-lg font-bold">{formatPrice(Number(order.total_minor_units ?? 0), currency)}</td>
            </tr>
          </tfoot>
        </table>
      </section>
    </>
  )
}
