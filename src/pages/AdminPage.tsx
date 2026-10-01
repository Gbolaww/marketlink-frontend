import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Globe, ShieldCheck } from 'lucide-react'
import { EmptyState, QueryState } from '@/components/dashboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonClass } from '@/components/ui/button-styles'
import { Input } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { adminApi } from '@/lib/api'
import { apiError, formatDate, pick } from '@/lib/utils'

type Row = Record<string, unknown>

const REGIONS = [
  { region: 'Nigeria', currency: 'NGN', state: 'Live' },
  { region: 'Ghana', currency: 'GHS', state: 'Phase 2' },
  { region: 'Kenya', currency: 'KES', state: 'Phase 2' },
]

const needsMfa = (err: unknown) =>
  (err as { response?: { status?: number; data?: { detail?: unknown } } })?.response?.status === 403 &&
  String((err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail ?? '').includes('MFA')

function VendorRow({ vendor }: { vendor: Row }) {
  const qc = useQueryClient()
  const id = String(vendor.id)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const done = () => qc.invalidateQueries({ queryKey: ['pending-vendors'] })
  const approve = useMutation({ mutationFn: () => adminApi.approveVendor(id), onSuccess: done })
  const reject = useMutation({ mutationFn: () => adminApi.rejectVendor(id, reason), onSuccess: done })
  const error = approve.error ?? reject.error

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold">{String(pick(vendor, 'business_name') ?? 'Vendor')}</p>
          <p className="text-sm text-muted-foreground">
            {[pick(vendor, 'address'), formatDate(pick(vendor, 'created_at'))].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>Pending review</Badge>
          <Button size="sm" disabled={approve.isPending || reject.isPending} onClick={() => approve.mutate()}>Approve</Button>
          <Button size="sm" variant="outline" onClick={() => setRejecting((r) => !r)}>Reject</Button>
        </div>
      </div>
      {rejecting && (
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => { e.preventDefault(); reject.mutate() }}
        >
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection" required />
          <Button type="submit" variant="outline" disabled={reject.isPending}>Confirm reject</Button>
        </form>
      )}
      {error != null && <p role="alert" className="mt-3 text-sm text-destructive">{apiError(error)}</p>}
    </div>
  )
}

export default function AdminPage() {
  const pending = useQuery({
    queryKey: ['pending-vendors'],
    queryFn: async () => {
      const { data } = await adminApi.getPendingVendors()
      return (Array.isArray(data) ? data : (data?.vendors ?? data?.items ?? [])) as Row[]
    },
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Admin console</h1>
      <p className="mt-2 text-muted-foreground">Vendor approvals and regional configuration.</p>
      <div className="mt-8">
        <Tabs
          items={[
            { value: 'kyc', label: 'Vendor approvals', icon: <ShieldCheck />, count: pending.data?.length },
            { value: 'regions', label: 'Regions', icon: <Globe /> },
          ]}
          render={(tab) =>
            tab === 'regions' ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {REGIONS.map((r) => (
                  <div key={r.region} className="rounded-xl border border-border bg-card p-5">
                    <p className="font-semibold">{r.region}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Currency {r.currency}</p>
                    <Badge className="mt-3">{r.state}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              pending.isError && needsMfa(pending.error) ? (
                <div className="rounded-xl border border-warning/40 bg-warning/10 p-6">
                  <h2 className="text-lg font-semibold">Turn on two-factor authentication first</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Admin accounts must use two-factor authentication before they can approve vendors or take other admin actions.
                  </p>
                  <Link to="/security" className={buttonClass('default', 'md', 'mt-4')}>Set up two-factor authentication</Link>
                </div>
              ) : (
              <QueryState loading={pending.isLoading} error={pending.isError} message={pending.isError ? apiError(pending.error) : undefined}>
                {(pending.data ?? []).length === 0 ? (
                  <EmptyState title="No vendors waiting" body="New vendor applications will appear here for approval." />
                ) : (
                  <div className="space-y-4">{(pending.data ?? []).map((v) => <VendorRow key={String(v.id)} vendor={v} />)}</div>
                )}
              </QueryState>
              )
            )
          }
        />
      </div>
    </div>
  )
}
