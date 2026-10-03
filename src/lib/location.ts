import { useSyncExternalStore } from 'react'

/** Where the shopper is. Search results are ranked by distance from here. */
export interface UserLocation {
  lat: number
  lon: number
  /** What to show people: a city name, "Near Abuja" for a GPS fix, or "Your location". */
  label: string
  source: 'device' | 'city'
}

export interface City {
  name: string
  state: string
  lat: number
  lon: number
}

/** The biggest trading cities first. Coordinates are the city centre. */
export const CITIES: City[] = [
  { name: 'Lagos', state: 'Lagos', lat: 6.5244, lon: 3.3792 },
  { name: 'Abuja', state: 'FCT', lat: 9.0765, lon: 7.3986 },
  { name: 'Ibadan', state: 'Oyo', lat: 7.3775, lon: 3.947 },
  { name: 'Port Harcourt', state: 'Rivers', lat: 4.8156, lon: 7.0498 },
  { name: 'Kano', state: 'Kano', lat: 12.0022, lon: 8.592 },
  { name: 'Kaduna', state: 'Kaduna', lat: 10.5105, lon: 7.4165 },
  { name: 'Benin City', state: 'Edo', lat: 6.335, lon: 5.6037 },
  { name: 'Onitsha', state: 'Anambra', lat: 6.1498, lon: 6.7857 },
  { name: 'Aba', state: 'Abia', lat: 5.1066, lon: 7.3667 },
  { name: 'Enugu', state: 'Enugu', lat: 6.4584, lon: 7.5464 },
  { name: 'Warri', state: 'Delta', lat: 5.5167, lon: 5.75 },
  { name: 'Abeokuta', state: 'Ogun', lat: 7.1475, lon: 3.3619 },
  { name: 'Ilorin', state: 'Kwara', lat: 8.4966, lon: 4.5421 },
  { name: 'Jos', state: 'Plateau', lat: 9.8965, lon: 8.8583 },
  { name: 'Owerri', state: 'Imo', lat: 5.4836, lon: 7.0333 },
  { name: 'Calabar', state: 'Cross River', lat: 4.9757, lon: 8.3417 },
  { name: 'Uyo', state: 'Akwa Ibom', lat: 5.0377, lon: 7.9128 },
  { name: 'Asaba', state: 'Delta', lat: 6.198, lon: 6.734 },
  { name: 'Akure', state: 'Ondo', lat: 7.2526, lon: 5.1931 },
  { name: 'Osogbo', state: 'Osun', lat: 7.7827, lon: 4.5418 },
  { name: 'Abakaliki', state: 'Ebonyi', lat: 6.3249, lon: 8.1137 },
  { name: 'Makurdi', state: 'Benue', lat: 7.7337, lon: 8.5214 },
  { name: 'Minna', state: 'Niger', lat: 9.6139, lon: 6.5569 },
  { name: 'Maiduguri', state: 'Borno', lat: 11.8333, lon: 13.15 },
  { name: 'Sokoto', state: 'Sokoto', lat: 13.0059, lon: 5.2476 },
]

/**
 * Searches need a starting point. Until the shopper picks one we use Lagos and say so on screen, so results are never
 * measured from a place they cannot see.
 */
export const DEFAULT_LOCATION: UserLocation & { isDefault: true } = {
  lat: 6.5244,
  lon: 3.3792,
  label: 'Lagos',
  source: 'city',
  isDefault: true,
}

const KEY = 'ml_location'
const DISMISSED_KEY = 'ml_location_prompt_dismissed'

function read(): UserLocation | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (
      v &&
      Number.isFinite(v.lat) && Math.abs(v.lat) <= 90 &&
      Number.isFinite(v.lon) && Math.abs(v.lon) <= 180 &&
      typeof v.label === 'string' && v.label
    ) {
      return { lat: v.lat, lon: v.lon, label: v.label, source: v.source === 'device' ? 'device' : 'city' }
    }
  } catch {
    /* corrupt or unavailable storage: treat as "not chosen yet" */
  }
  return null
}

let saved: UserLocation | null = typeof window === 'undefined' ? null : read()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

if (typeof window !== 'undefined') {
  // Keep tabs in sync.
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      saved = read()
      emit()
    }
  })
}

/** The shopper's chosen location, or null if they have not chosen one. */
export const useSavedLocation = (): UserLocation | null => useSyncExternalStore(subscribe, () => saved)

/** The location to search from: the chosen one, or the labelled default. */
export function useSearchLocation(): UserLocation & { isDefault: boolean } {
  const chosen = useSavedLocation()
  return chosen ? { ...chosen, isDefault: false } : DEFAULT_LOCATION
}

export function saveLocation(location: UserLocation) {
  saved = location
  try {
    localStorage.setItem(KEY, JSON.stringify(location))
  } catch {
    /* private mode: the choice just lasts for this visit */
  }
  emit()
}

export function chooseCity(city: City) {
  saveLocation({ lat: city.lat, lon: city.lon, label: city.name, source: 'city' })
}

export function clearLocation() {
  saved = null
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  emit()
}

/** Has the shopper already seen (and closed) the "where are you?" question? */
export function promptWasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissPrompt() {
  try {
    localStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    /* ignore */
  }
}

// --- the "where are you?" dialog, shared by the header, the home page and the search page -------------------------

let dialogOpen = false
const dialogListeners = new Set<() => void>()
const subscribeDialog = (l: () => void) => {
  dialogListeners.add(l)
  return () => dialogListeners.delete(l)
}
const setDialog = (open: boolean) => {
  dialogOpen = open
  dialogListeners.forEach((l) => l())
}

export const openLocationDialog = () => setDialog(true)
export const closeLocationDialog = () => setDialog(false)
export const useLocationDialogOpen = (): boolean => useSyncExternalStore(subscribeDialog, () => dialogOpen)

// --- device location -------------------------------------------------------------------------------------------

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

export function nearestCity(point: { lat: number; lon: number }): { city: City; km: number } {
  let best = { city: CITIES[0], km: Infinity }
  for (const city of CITIES) {
    const km = distanceKm(point, city)
    if (km < best.km) best = { city, km }
  }
  return best
}

export class LocationError extends Error {
  readonly reason: 'unsupported' | 'denied' | 'unavailable' | 'timeout'
  constructor(reason: LocationError['reason'], message: string) {
    super(message)
    this.reason = reason
  }
}

/** Asks the browser for the device's position. Rejects with a LocationError whose message is safe to show. */
export function locateDevice(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new LocationError('unsupported', "This device can't share its location. Choose your city instead."))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = { lat: Number(pos.coords.latitude.toFixed(4)), lon: Number(pos.coords.longitude.toFixed(4)) }
        const { city, km } = nearestCity(point)
        resolve({ ...point, label: km <= 60 ? 'Near ' + city.name : 'Your location', source: 'device' })
      },
      (err) =>
        reject(
          err.code === err.PERMISSION_DENIED
            ? new LocationError('denied', 'Location is blocked for this site. Allow it in your browser settings, or choose your city instead.')
            : err.code === err.TIMEOUT
              ? new LocationError('timeout', 'Finding your location took too long. Try again, or choose your city instead.')
              : new LocationError('unavailable', "We couldn't work out where you are. Choose your city instead."),
        ),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    )
  })
}
