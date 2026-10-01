import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, Loader2, MapPin, Package, Plus, ShoppingBag, Wallet } from 'lucide-react'
import { DataTable, EmptyState, Field, QueryState, StatCard } from '@/components/dashboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { vendorApi } from '@/lib/api'
import { ORDER_STATUS, VENDOR_STATUS, apiError, formatDate, formatPrice, pick } from '@/lib/utils'

type Row = Record<string, unknown>
const list = (data: unknown, ...keys: string[]): Row[] => {
  if (Array.isArray(data)) return data as Row[]
  for (const k of keys) if (Array.isArray((data as Row)?.[k])) return (data as Row)[k] as Row[]
  return []
}

function RegisterVendor({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ business_name: '', description: '', region_id: '', address: '', latitude: '', longitude: '' })
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const create = useMutation({
    mutationFn: () =>
      vendorApi.createProfile({
        business_name: form.business_name,
        description: form.description || undefined,
        region_id: form.region_id,
        address: form.address || undefined,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      }),
    onSuccess: onDone,
  })
  const locate = () =>
    navigator.geolocation?.getCurrentPosition((p) =>
      setForm((f) => ({ ...f, latitude: p.coords.latitude.toFixed(5), longitude: p.coords.longitude.toFixed(5) })),
    )
  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate()
  }
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-center text-3xl font-extrabold">Open your storefront</h1>
      <p className="mt-3 text-center text-muted-foreground">
        Register your business, then upload your KYC documents. You can start listing once you're approved.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
        <Field label="Business name"><Input value={form.business_name} onChange={set('business_name')} required /></Field>
        <Field label="Description"><Input value={form.description} onChange={set('description')} /></Field>
        <Field label="Region ID"><Input value={form.region_id} onChange={set('region_id')} required /></Field>
        <Field label="Address"><Input value={form.address} onChange={set('address')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude"><Input type="number" step="any" value={form.latitude} onChange={set('latitude')} required /></Field>
          <Field label="Longitude"><Input type="number" step="any" value={form.longitude} onChange={set('longitude')} required /></Field>
        </div>
        <Button variant="secondary" onClick={locate}><MapPin /> Use my location</Button>
        {create.isError && <p role="alert" className="text-sm text-destructive">{apiError(create.error)}</p>}
        <Button type="submit" className="w-full" disabled={create.isPending}>
          {create.isPending && <Loader2 className="animate-spin" />} Register as a vendor
        </Button>
      </form>
    </div>
  )
}

function AddProduct({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('1')
  const create = useMutation({
    mutationFn: () =>
      vendorApi.createProduct({
        name,
        description: description || undefined,
        price_minor_units: Math.round(Number(price) * 100),
        currency_code: 'NGN',
        stock_quantity: Number(stock),
      }),
    onSuccess: onDone,
  })
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); create.mutate() }}
      className="mt-6 grid gap-4 rounded-xl border border-border bg-card p-6 shadow-card sm:grid-cols-2"
    >
      <Field label="Product name"><Input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
      <Field label="Price (₦)"><Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></Field>
      <Field label="Stock"><Input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} /></Field>
      <Field label="Description"><Input value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      {create.isError && <p role="alert" className="text-sm text-destructive sm:col-span-2">{apiError(create.error)}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="animate-spin" />} Save product</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

function BankDetails() {
  const banks = useQuery({ queryKey: ['banks'], queryFn: async () => list((await vendorApi.getBanks()).data, 'banks', 'data') })
  const [bank, setBank] = useState('')
  const [account, setAccount] = useState('')
  const save = useMutation({ mutationFn: () => vendorApi.submitBankDetails({ account_number: account, bank_code: bank }) })
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); save.mutate() }}
      className="max-w-md space-y-4 rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <h3 className="font-semibold">Payout bank account</h3>
      <Field label="Bank">
        <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" value={bank} onChange={(e) => setBank(e.target.value)} required>
          <option value="">Select a bank</option>
          {(banks.data ?? []).map((b) => {
            const code = String(pick(b, 'code', 'bank_code') ?? '')
            return <option key={code} value={code}>{String(pick(b, 'name', 'bank_name') ?? code)}</option>
          })}
        </select>
      </Field>
      <Field label="Account number"><Input inputMode="numeric" maxLength={10} value={account} onChange={(e) => setAccount(e.target.value)} required /></Field>
      {save.isError && <p role="alert" className="text-sm text-destructive">{apiError(save.error)}</p>}
      {save.isSuccess && <p className="text-sm text-accent">Bank details saved.</p>}
      <Button type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" />} Save bank details</Button>
    </form>
  )
}

export default function VendorDashboard() {
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)

  const profile = useQuery({
    queryKey: ['vendor-profile'],
    retry: false,
    queryFn: async () => {
      try {
        return (await vendorApi.getMyProfile()).data as Row
      } catch (err) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) return null
        throw err
      }
    },
  })
  const enabled = !!profile.data
  const products = useQuery({ queryKey: ['vendor-products'], enabled, queryFn: async () => list((await vendorApi.getMyProducts()).data, 'products', 'items') })
  const orders = useQuery({ queryKey: ['vendor-orders'], enabled, queryFn: async () => list((await vendorApi.getMyOrders()).data, 'orders', 'items') })
  const fulfil = useMutation({
    mutationFn: (id: string) => vendorApi.fulfilOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-orders'] }),
  })

  if (profile.isLoading) return <div className="mx-auto max-w-6xl px-4 py-10"><div className="h-64 animate-pulse rounded-xl bg-muted" /></div>
  if (profile.isError) return <p className="py-24 text-center text-destructive">We couldn't load your store. Please try again.</p>
  if (!profile.data) return <RegisterVendor onDone={() => qc.invalidateQueries({ queryKey: ['vendor-profile'] })} />

  const p = profile.data
  const currency = pick<string>(p, 'currency', 'currency_code') ?? 'NGN'
  const orderRows = orders.data ?? []
  const total = (o: Row) => Number(pick(o, 'total_minor', 'total_minor_units', 'total') ?? 0)
  const revenue = orderRows.filter((o) => !['cancelled', 'pending', 'refunded'].includes(String(o.status))).reduce((s, o) => s + total(o), 0)
  const fulfilled = orderRows.filter((o) => o.status === 'fulfilled' || o.status === 'settled').length
  const status = String(pick(p, 'kyc_status', 'status') ?? 'pending')
  const rating = Number(pick(p, 'rating_avg') ?? 0)
  const locations = (pick<Row[]>(p, 'locations', 'vendor_locations') ?? []) as Row[]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">{String(pick(p, 'business_name') ?? 'Your store')}</h1>
          <p className="mt-2 flex items-center gap-2 text-muted-foreground"><Badge>{VENDOR_STATUS[status] ?? status}</Badge></p>
        </div>
        <Button onClick={() => setAdding(true)}><Plus /> Add product</Button>
      </div>

      {adding && (
        <AddProduct
          onCancel={() => setAdding(false)}
          onDone={() => { setAdding(false); qc.invalidateQueries({ queryKey: ['vendor-products'] }) }}
        />
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatPrice(revenue, currency)} />
        <StatCard label="Orders" value={String(orderRows.length)} />
        <StatCard label="Live listings" value={String((products.data ?? []).length)} />
        <StatCard label="Fulfilled orders" value={String(fulfilled)} />
      </div>

      <div className="mt-10">
        <Tabs
          items={[
            { value: 'catalogue', label: 'Catalogue', icon: <Package /> },
            { value: 'orders', label: 'Orders', icon: <ShoppingBag /> },
            { value: 'payouts', label: 'Payouts', icon: <Wallet /> },
            { value: 'locations', label: 'Locations', icon: <MapPin /> },
            { value: 'analytics', label: 'Analytics', icon: <BarChart3 /> },
          ]}
          render={(tab) => {
            if (tab === 'catalogue')
              return (
                <QueryState loading={products.isLoading} error={products.isError}>
                  <DataTable
                    head={['Product', 'Price', 'Stock', 'Status']}
                    empty="No products listed yet."
                    rows={(products.data ?? []).map((r) => [
                      String(pick(r, 'name') ?? ''),
                      formatPrice(Number(pick(r, 'price_minor_units', 'price_minor') ?? 0), pick<string>(r, 'currency_code', 'currency')),
                      String(pick(r, 'stock_quantity', 'stock') ?? '—'),
                      r.is_active === false ? 'Hidden' : 'Active',
                    ])}
                  />
                </QueryState>
              )
            if (tab === 'orders')
              return (
                <QueryState loading={orders.isLoading} error={orders.isError}>
                  <DataTable
                    head={['Order', 'Date', 'Total', 'Status', '']}
                    empty="No orders yet."
                    rows={orderRows.map((o) => {
                      const st = String(o.status ?? '')
                      return [
                        String(pick(o, 'order_number') ?? String(o.id).slice(0, 8)),
                        formatDate(o.created_at),
                        formatPrice(total(o), pick<string>(o, 'currency', 'currency_code') ?? currency),
                        ORDER_STATUS[st] ?? st,
                        st === 'paid' ? (
                          <Button key="f" size="sm" variant="outline" disabled={fulfil.isPending} onClick={() => fulfil.mutate(String(o.id))}>
                            Mark fulfilled
                          </Button>
                        ) : null,
                      ]
                    })}
                  />
                  {fulfil.isError && <p role="alert" className="mt-3 text-sm text-destructive">{apiError(fulfil.error)}</p>}
                </QueryState>
              )
            if (tab === 'payouts') return <BankDetails />
            if (tab === 'locations')
              return locations.length === 0 ? (
                <EmptyState title="No locations yet" body="Add a location so nearby customers can find you." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {locations.map((l, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-5">
                      <p className="font-semibold">{String(pick(l, 'label') ?? 'Store location')}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{[pick(l, 'address_text', 'address'), pick(l, 'city'), pick(l, 'state')].filter(Boolean).join(', ')}</p>
                    </div>
                  ))}
                </div>
              )
            return (
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Average rating" value={rating.toFixed(1)} hint={(pick(p, 'rating_count') ?? 0) + ' reviews'} />
                <StatCard label="Average order value" value={formatPrice(orderRows.length ? revenue / orderRows.length : 0, currency)} />
                <StatCard label="Fulfilled orders" value={String(fulfilled)} />
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}
