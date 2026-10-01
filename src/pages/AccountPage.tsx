import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Package, Star } from 'lucide-react'
import { EmptyState, QueryState } from '@/components/dashboard'
import { Badge } from '@/components/ui/badge'
import { buttonClass } from '@/components/ui/button-styles'
import { Tabs } from '@/components/ui/tabs'
import { orderApi } from '@/lib/api'
import { getUser } from '@/lib/auth'
import { usePaymentSync } from '@/lib/usePaymentSync'
import { ORDER_STATUS, formatDate, formatPrice, pick } from '@/lib/utils'

type Row = Record<string, unknown>

export default function AccountPage() {
  const user = getUser()
  const orders = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await orderApi.getMyOrders()
      return (Array.isArray(data) ? data : (data?.orders ?? data?.items ?? [])) as Row[]
    },
  })

  usePaymentSync(orders.data)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Hello{user ? ', ' + user.email.split('@')[0] : ''}</h1>
      <p className="mt-2 text-muted-foreground">Track orders, addresses and your reviews.</p>

      <div className="mt-8">
        <Tabs
          items={[
            { value: 'orders', label: 'Orders', icon: <Package /> },
            { value: 'addresses', label: 'Addresses', icon: <MapPin /> },
            { value: 'reviews', label: 'Reviews', icon: <Star /> },
          ]}
          render={(tab) => {
            if (tab === 'addresses')
              return <EmptyState title="No saved addresses" body="Save a delivery address at checkout and it will show up here for distance-based search." />
            if (tab === 'reviews')
              return <EmptyState title="No reviews yet" body="After a delivery is confirmed you can rate the vendor and the product." />
            return (
              <QueryState loading={orders.isLoading} error={orders.isError}>
                {(orders.data ?? []).length === 0 ? (
                  <EmptyState title="No orders yet" body="When you buy from a vendor, your order and its delivery status appear here." />
                ) : (
                  <div className="space-y-4">
                    {(orders.data ?? []).map((o) => {
                      const currency = pick<string>(o, 'currency', 'currency_code')
                      const items = (pick<Row[]>(o, 'items', 'order_items') ?? []) as Row[]
                      const status = String(pick(o, 'status') ?? '')
                      return (
                        <div key={String(o.id)} className="rounded-xl border border-border bg-card p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <Link to={'/orders/' + String(o.id)} className="font-semibold hover:underline">
                                Order {String(pick(o, 'order_number') ?? String(o.id).slice(0, 8).toUpperCase())}
                              </Link>
                              <p className="text-sm text-muted-foreground">{formatDate(o.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge>{ORDER_STATUS[status] ?? status}</Badge>
                              {status === 'pending' && typeof o.checkout_url === 'string' && (
                                <a href={o.checkout_url} className={buttonClass('default', 'sm')}>Complete checkout</a>
                              )}
                            </div>
                          </div>
                          {items.length > 0 && (
                            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                              {items.map((it, i) => {
                                const qty = Number(pick(it, 'quantity') ?? 1)
                                const unit = Number(pick(it, 'unit_price_minor', 'unit_price_minor_units', 'price_minor') ?? 0)
                                return (
                                  <li key={i} className="flex justify-between gap-4">
                                    <span>{qty} × {String(pick(it, 'name_snapshot', 'name', 'product_name') ?? 'Item')}</span>
                                    <span>{formatPrice(unit * qty, currency)}</span>
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                          <p className="mt-4 text-right font-bold">
                            {formatPrice(Number(pick(o, 'total_minor', 'total_minor_units', 'total') ?? 0), currency)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </QueryState>
            )
          }}
        />
      </div>
    </div>
  )
}
