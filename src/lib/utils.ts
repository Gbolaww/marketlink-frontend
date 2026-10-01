export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function formatPrice(minor: number | null | undefined, currency = 'NGN'): string {
  const major = (minor ?? 0) / 100
  const symbol = currency === 'NGN' ? '₦' : currency + ' '
  return symbol + major.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function formatDistance(km: number | null | undefined): string | null {
  if (km == null) return null
  if (km < 1) return Math.round(km * 1000) + ' m away'
  if (km < 20) return km.toFixed(1) + ' km away'
  return Math.round(km) + ' km away'
}

export function apiError(err: unknown): string {
  const e = err as { response?: { status?: number; data?: { detail?: unknown; message?: unknown } }; message?: string }
  if (!e?.response) {
    return "Can't reach the server. Make sure the backend is running and allows requests from this site (CORS)."
  }
  const { status, data } = e.response
  const detail = data?.detail ?? data?.message
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((d: { loc?: unknown[]; msg?: string }) => [d.loc?.slice(1).join('.'), d.msg].filter(Boolean).join(': '))
      .join('; ')
  }
  return 'Request failed (HTTP ' + status + '). Check the backend logs.'
}

/** Read the first present key from an API row (the backend field names vary between endpoints). */
export function pick<T = unknown>(row: Record<string, unknown> | null | undefined, ...keys: string[]): T | undefined {
  if (!row) return undefined
  for (const k of keys) if (row[k] != null) return row[k] as T
  return undefined
}

export const ORDER_STATUS: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid',
  accepted: 'Accepted by vendor',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export const VENDOR_STATUS: Record<string, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
}

export function formatDate(value: unknown): string {
  const d = value ? new Date(String(value)) : null
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString() : '—'
}
