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
