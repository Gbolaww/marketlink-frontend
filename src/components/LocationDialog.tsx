import { useEffect, useRef, useState } from 'react'
import { Check, Crosshair, LoaderCircle, MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CITIES,
  chooseCity,
  clearLocation,
  closeLocationDialog,
  dismissPrompt,
  locateDevice,
  openLocationDialog,
  saveLocation,
  useLocationDialogOpen,
  useSavedLocation,
} from '@/lib/location'
import { cn } from '@/lib/utils'

// Closing the question counts as "seen it", so we don't pop it up again on every visit.
const finish = () => {
  dismissPrompt()
  closeLocationDialog()
}

/** The button that shows where we are searching from and lets the shopper change it. */
export function LocationChip({ className }: { className?: string }) {
  const saved = useSavedLocation()
  return (
    <button
      type="button"
      onClick={openLocationDialog}
      aria-label={saved ? 'Location: ' + saved.label + '. Change location' : 'Set your location'}
      className={cn(
        'inline-flex h-9 min-w-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-sm font-medium transition-colors hover:bg-secondary',
        className,
      )}
    >
      <MapPin className="size-4 shrink-0 text-primary" />
      <span className="truncate">{saved ? saved.label : 'Set location'}</span>
    </button>
  )
}

/** "Where are you shopping from?" A bottom sheet on phones, a centred card on larger screens. */
export default function LocationDialog() {
  // The sheet is only mounted while open, so its state (busy, error) starts fresh every time.
  return useLocationDialogOpen() ? <LocationSheet /> : null
}

function LocationSheet() {
  const saved = useSavedLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
    }
    document.addEventListener('keydown', onKey)
    // Stop the page behind the dialog from scrolling while it is open.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [])

  const onUseDevice = async () => {
    setBusy(true)
    setError(null)
    try {
      saveLocation(await locateDevice())
      finish()
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't find your location. Choose your city instead.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <div className="absolute inset-0 bg-foreground/40" onClick={finish} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-title"
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-2xl border border-border bg-background shadow-lift outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div className="min-w-0">
            <h2 id="location-title" className="text-lg font-bold">Where are you shopping from?</h2>
            <p className="mt-1 text-sm text-muted-foreground">We'll show the vendors closest to you first.</p>
          </div>
          <Button variant="ghost" size="icon" className="-mr-2 -mt-1 shrink-0" aria-label="Close" onClick={finish}><X /></Button>
        </div>

        <div className="overflow-y-auto px-5 pb-5">
          <Button size="lg" className="w-full" onClick={onUseDevice} disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" /> : <Crosshair />}
            {busy ? 'Finding you…' : 'Use my current location'}
          </Button>
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}

          <p className="mt-6 text-sm font-semibold">Or choose your city</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {CITIES.map((c) => {
              const selected = saved?.source === 'city' && saved.label === c.name
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => { chooseCity(c); finish() }}
                  aria-pressed={selected}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors',
                    selected ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{c.name}</span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">{c.state}</span>
                  </span>
                  {selected && <Check className="size-4 shrink-0" />}
                </button>
              )
            })}
          </div>

          {saved && (
            <button
              type="button"
              onClick={() => { clearLocation(); finish() }}
              className="mt-5 cursor-pointer text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Clear my location
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
