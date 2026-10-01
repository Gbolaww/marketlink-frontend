import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, ImagePlus, Loader2, MapPin, Package, Pencil, Plus, ShoppingBag, Wallet } from 'lucide-react'
import { DataTable, EmptyState, Field, QueryState, StatCard } from '@/components/dashboard'
import ProductImage from '@/components/ProductImage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { assetUrl, vendorApi } from '@/lib/api'
import { ORDER_STATUS, VENDOR_STATUS, apiError, formatDate, formatPrice, pick } from '@/lib/utils'

type Row = Record<string, unknown>
const list = (data: unknown, ...keys: string[]): Row[] => {
  if (Array.isArray(data)) return data as Row[]
  for (const k of keys) if (Array.isArray((data as Row)?.[k])) return (data as Row)[k] as Row[]
  return []
}

function RegisterVendor({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ business_name: '', description: '', region_id: '00000000-0000-4000-8000-000000000001', address: '', latitude: '', longitude: '' })
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
  const [photo, setPhoto] = useState<File | null>(null)
  const preview = photo ? URL.createObjectURL(photo) : null
  const create = useMutation({
    mutationFn: async () => {
      const { data } = await vendorApi.createProduct({
        name,
        description: description || undefined,
        price_minor_units: Math.round(Number(price) * 100),
        currency_code: 'NGN',
        stock_quantity: Number(stock),
      })
      if (photo) await vendorApi.uploadProductImage(String(data.id), photo)
    },
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
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium">Photo</label>
        <div className="mt-2 flex items-center gap-4">
          <div className="size-20 overflow-hidden rounded-lg border border-border bg-muted">
            {preview ? <img src={preview} alt="Preview" className="h-full w-full object-cover" /> : <ProductImage name={name || 'P'} className="text-2xl" />}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm font-semibold hover:bg-secondary">
            <ImagePlus className="size-4" /> {photo ? 'Change photo' : 'Add a photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          </label>
          <span className="text-xs text-muted-foreground">JPEG, PNG or WebP, up to 5 MB</span>
        </div>
      </div>
      {create.isError && <p role="alert" className="text-sm text-destructive sm:col-span-2">{apiError(create.error)}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="animate-spin" />} Save product</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

function EditProduct({ product, onDone, onCancel }: { product: Row; onDone: () => void; onCancel: () => void }) {
  const currency = pick<string>(product, 'currency_code', 'currency') ?? 'NGN'
  const stockNow = pick<number | null>(product, 'stock_quantity', 'stock')
  const [name, setName] = useState(String(pick(product, 'name') ?? ''))
  const [description, setDescription] = useState(String(pick(product, 'description') ?? ''))
  const [price, setPrice] = useState(String(Number(pick(product, 'price_minor_units', 'price_minor') ?? 0) / 100))
  const [stock, setStock] = useState(stockNow == null ? '' : String(stockNow))
  const [visible, setVisible] = useState(product.is_active !== false)

  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const save = useMutation({
    mutationFn: () =>
      vendorApi.updateProduct(String(product.id), {
        name: name.trim(),
        description: description.trim() || null,
        price_minor_units: Math.round(Number(price) * 100),
        // Blank means "don't track stock" (always available).
        stock_quantity: stock.trim() === '' ? null : Math.floor(Number(stock)),
        is_active: visible,
      }),
    onSuccess: onDone,
  })

  return (
    <form
      ref={formRef}
      onSubmit={(e) => { e.preventDefault(); save.mutate() }}
      className="mb-6 grid gap-4 rounded-xl border border-primary/30 bg-card p-6 shadow-card sm:grid-cols-2"
    >
      <h3 className="font-semibold sm:col-span-2">Edit product</h3>
      <Field label="Product name"><Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} /></Field>
      <Field label={'Price (' + (currency === 'NGN' ? '₦' : currency) + ')'}>
        <Input type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
      </Field>
      <Field label="Number available">
        <Input type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Leave blank if you don't track stock" />
      </Field>
      <Field label="Description"><Input value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <label className="flex cursor-pointer items-center gap-3 text-sm font-medium sm:col-span-2">
        <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
        Show in the marketplace
        <span className="font-normal text-muted-foreground">(untick to hide it without deleting)</span>
      </label>
      {Number(stock) === 0 && stock !== '' && (
        <p className="text-sm text-muted-foreground sm:col-span-2">With 0 available, customers can see this product but can't order it.</p>
      )}
      {save.isError && <p role="alert" className="text-sm text-destructive sm:col-span-2">{apiError(save.error)}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" />} Save changes</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

function PhotoButton({ productId, hasPhoto, onDone }: { productId: string; hasPhoto: boolean; onDone: () => void }) {
  const input = useRef<HTMLInputElement>(null)
  const upload = useMutation({ mutationFn: (file: File) => vendorApi.uploadProductImage(productId, file), onSuccess: onDone })
  return (
    <div className="text-right">
      <Button size="sm" variant="outline" disabled={upload.isPending} onClick={() => input.current?.click()}>
        {upload.isPending ? <Loader2 className="animate-spin" /> : <ImagePlus />} {hasPhoto ? 'Change photo' : 'Add photo'}
      </Button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); e.target.value = '' }} />
      {upload.isError && <p role="alert" className="mt-1 text-xs text-destructive">{apiError(upload.error)}</p>}
    </div>
  )
}

/** The vendor's saved payout account, or null when none is set up yet (the API answers 404). */
function useBankDetails(enabled = true) {
  return useQuery({
    queryKey: ['bank-details'],
    enabled,
    retry: false,
    queryFn: async () => {
      try {
        return (await vendorApi.getBankDetails()).data as Row
      } catch (err) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) return null
        throw err
      }
    },
  })
}

function BankDetails() {
  const qc = useQueryClient()
  const saved = useBankDetails()
  const banks = useQuery({ queryKey: ['banks'], queryFn: async () => list((await vendorApi.getBanks()).data, 'banks', 'data') })
  const [changing, setChanging] = useState(false)
  const [bank, setBank] = useState('')
  const [account, setAccount] = useState('')
  const save = useMutation({
    mutationFn: async () => (await vendorApi.submitBankDetails({ account_number: account, bank_code: bank })).data as Row,
    onSuccess: () => {
      setAccount('')
      setChanging(false)
      qc.invalidateQueries({ queryKey: ['bank-details'] })
    },
  })
  const bankName = (code: unknown) => String(pick((banks.data ?? []).find((b) => String(pick(b, 'code', 'bank_code')) === String(code)), 'name', 'bank_name') ?? code ?? '')

  if (saved.isLoading) return <div className="h-40 max-w-md animate-pulse rounded-xl bg-muted" />

  if (saved.data && !changing) {
    return (
      <div className="max-w-md rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold">Payout bank account</h3>
          <Badge className={saved.data.payouts_enabled ? 'bg-accent/10 text-accent' : ''}>{saved.data.payouts_enabled ? 'Payouts enabled' : 'Setting up'}</Badge>
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <div><dt className="text-muted-foreground">Account name</dt><dd className="font-medium">{String(saved.data.account_name)}</dd></div>
          <div><dt className="text-muted-foreground">Bank</dt><dd className="font-medium">{bankName(saved.data.bank_code)}</dd></div>
          <div><dt className="text-muted-foreground">Account number</dt><dd className="font-mono font-medium">{String(saved.data.account_number_masked)}</dd></div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">Your earnings are sent here when you mark an order fulfilled.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setChanging(true)}>Change account</Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); save.mutate() }}
      className="max-w-md space-y-4 rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <h3 className="font-semibold">{saved.data ? 'Change payout account' : 'Add your payout bank account'}</h3>
      {!saved.data && <p className="text-sm text-muted-foreground">We check the account with the bank so your money goes to the right place.</p>}
      <Field label="Bank">
        <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" value={bank} onChange={(e) => setBank(e.target.value)} required>
          <option value="">{banks.isLoading ? 'Loading banks…' : 'Select a bank'}</option>
          {(banks.data ?? []).map((b) => {
            const code = String(pick(b, 'code', 'bank_code') ?? '')
            return <option key={code} value={code}>{String(pick(b, 'name', 'bank_name') ?? code)}</option>
          })}
        </select>
      </Field>
      <Field label="Account number (10 digits)">
        <Input inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={account} onChange={(e) => setAccount(e.target.value.replace(/\D/g, ''))} required />
      </Field>
      {banks.isError && <p role="alert" className="text-sm text-destructive">We couldn't load the list of banks. Please try again.</p>}
      {save.isError && <p role="alert" className="text-sm text-destructive">{apiError(save.error)}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={save.isPending || account.length !== 10}>{save.isPending && <Loader2 className="animate-spin" />} Verify and save</Button>
        {saved.data && <Button variant="ghost" onClick={() => setChanging(false)}>Cancel</Button>}
      </div>
    </form>
  )
}

export default function VendorDashboard() {
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [savedName, setSavedName] = useState<string | null>(null)

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
  const bank = useBankDetails(enabled)
  const fulfil = useMutation({
    mutationFn: async (id: string) => (await vendorApi.fulfilOrder(id)).data as { payout_status?: string },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-orders'] }),
  })
  const payoutNote: Record<string, string> = {
    processing: 'Order marked as fulfilled. Your payout is on its way to your bank account.',
    awaiting_bank_details: 'Order marked as fulfilled. Add your bank account in the Payouts tab to receive this payment.',
    failed: "Order marked as fulfilled, but we couldn't send the payout yet. It will need a retry.",
  }

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

      {status !== 'approved' && (
        <div role="status" className="mt-6 rounded-xl border border-warning/40 bg-warning/10 px-5 py-4 text-sm">
          <p className="font-semibold">
            {status === 'rejected' ? 'Your store application was rejected.' : 'Your store is waiting for approval.'}
          </p>
          <p className="mt-1 text-muted-foreground">
            Products you add are saved, but they won't appear in the marketplace until MarketLink approves your store.
          </p>
        </div>
      )}

      {status === 'approved' && bank.isSuccess && !bank.data && (
        <div role="status" className="mt-6 rounded-xl border border-warning/40 bg-warning/10 px-5 py-4 text-sm">
          <p className="font-semibold">Add your bank account to get paid</p>
          <p className="mt-1 text-muted-foreground">Open the Payouts tab and add the account where your earnings should go. Orders you fulfil before then can't be paid out.</p>
        </div>
      )}

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
                  {savedName && <p role="status" className="mb-4 rounded-lg bg-accent/10 px-4 py-2 text-sm font-medium text-accent">Saved changes to {savedName}.</p>}
                  {editing && (
                    <EditProduct
                      key={String(editing.id)}
                      product={editing}
                      onCancel={() => setEditing(null)}
                      onDone={() => {
                        setSavedName(String(pick(editing, 'name') ?? 'product'))
                        setEditing(null)
                        qc.invalidateQueries({ queryKey: ['vendor-products'] })
                      }}
                    />
                  )}
                  <DataTable
                    head={['Product', 'Price', 'Available', 'Status', '']}
                    empty="No products listed yet."
                    rows={(products.data ?? []).map((r) => {
                      const stockQty = pick<number | null>(r, 'stock_quantity', 'stock')
                      return [
                        <div key="n" className="flex items-center gap-3">
                          <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                            <ProductImage src={assetUrl(pick<string>(r, 'image_url'))} name={String(pick(r, 'name') ?? '')} className="text-base" />
                          </div>
                          <span className="font-medium text-foreground">{String(pick(r, 'name') ?? '')}</span>
                        </div>,
                        formatPrice(Number(pick(r, 'price_minor_units', 'price_minor') ?? 0), pick<string>(r, 'currency_code', 'currency')),
                        stockQty == null ? 'Not tracked' : stockQty === 0 ? <span key="s" className="font-medium text-destructive">Out of stock</span> : stockQty <= 5 ? <span key="s" className="font-medium text-primary">{stockQty} left</span> : String(stockQty),
                        r.is_active === false ? 'Hidden' : 'Active',
                        <div key="a" className="flex flex-wrap items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setSavedName(null); setEditing(r); }}><Pencil /> Edit</Button>
                          <PhotoButton productId={String(r.id)} hasPhoto={!!pick(r, 'image_url')} onDone={() => qc.invalidateQueries({ queryKey: ['vendor-products'] })} />
                        </div>,
                      ]
                    })}
                  />
                </QueryState>
              )
            if (tab === 'orders')
              return (
                <QueryState loading={orders.isLoading} error={orders.isError}>
                  <DataTable
                    head={['Order', 'Date', 'Total', 'Deliver to', 'Status', '']}
                    empty="No orders yet."
                    rows={orderRows.map((o) => {
                      const st = String(o.status ?? '')
                      return [
                        String(pick(o, 'order_number') ?? String(o.id).slice(0, 8)),
                        formatDate(o.created_at),
                        formatPrice(total(o), pick<string>(o, 'currency', 'currency_code') ?? currency),
                        o.delivery_address ? (
                          <span key="d" className="block max-w-56 text-xs leading-snug">
                            <span className="font-medium text-foreground">{String(o.delivery_name)}</span>, {String(o.delivery_phone)}<br />
                            {String(o.delivery_address)}, {String(o.delivery_city)}, {String(o.delivery_state)}
                            {o.delivery_notes ? <><br /><em>{String(o.delivery_notes)}</em></> : null}
                          </span>
                        ) : '—',
                        ORDER_STATUS[st] ?? st,
                        st === 'paid' ? (
                          <Button key="f" size="sm" variant="outline" disabled={fulfil.isPending} onClick={() => fulfil.mutate(String(o.id))}>
                            Mark fulfilled
                          </Button>
                        ) : null,
                      ]
                    })}
                  />
                  {fulfil.isSuccess && fulfil.data?.payout_status && (
                    <p role="status" className="mt-3 rounded-lg bg-secondary px-4 py-2 text-sm">{payoutNote[fulfil.data.payout_status] ?? 'Order marked as fulfilled.'}</p>
                  )}
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
