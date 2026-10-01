import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { buttonClass } from '@/components/ui/button-styles'
import { orderApi } from '@/lib/api'

type Phase = 'checking' | 'paid' | 'pending' | 'failed'

const POLL_MS = 2500
const MAX_TRIES = 12

/** Paystack sends the customer back here. The payment itself is confirmed by Paystack's webhook, so poll the order. */
export default function OrderCallbackPage() {
  const [params] = useSearchParams()
  const reference = params.get('reference') ?? params.get('trxref')
  const [phase, setPhase] = useState<Phase>('checking')
  const tries = useRef(0)

  useEffect(() => {
    if (!reference) return
    let timer = 0
    let cancelled = false

    const check = async () => {
      try {
        const { data } = await orderApi.getMyOrders()
        const order = (Array.isArray(data) ? data : []).find((o: Record<string, unknown>) => o.processor_reference === reference)
        const status = String(order?.status ?? '')
        if (status && status !== 'pending') {
          if (!cancelled) setPhase(status === 'cancelled' ? 'failed' : 'paid')
          return
        }
      } catch {
        if (!cancelled) setPhase('failed')
        return
      }
      tries.current += 1
      if (tries.current >= MAX_TRIES) {
        if (!cancelled) setPhase('pending')
        return
      }
      timer = window.setTimeout(check, POLL_MS)
    }

    check()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [reference])

  const view = !reference ? 'failed' : phase

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      {view === 'checking' && (
        <>
          <Loader2 className="mx-auto size-10 animate-spin text-primary" />
          <h1 className="mt-6 text-2xl font-bold">Confirming your payment…</h1>
          <p className="mt-2 text-muted-foreground">This usually takes a few seconds. Please don't close this page.</p>
        </>
      )}
      {view === 'paid' && (
        <>
          <CheckCircle2 className="mx-auto size-12 text-accent" />
          <h1 className="mt-6 text-2xl font-bold">Payment received</h1>
          <p className="mt-2 text-muted-foreground">Your order is with the vendor. You can follow its status in your account.</p>
          <Link to="/account" className={buttonClass('default', 'lg', 'mt-6')}>View my orders</Link>
        </>
      )}
      {view === 'pending' && (
        <>
          <Loader2 className="mx-auto size-10 text-primary" />
          <h1 className="mt-6 text-2xl font-bold">Still waiting for confirmation</h1>
          <p className="mt-2 text-muted-foreground">Your bank hasn't confirmed the payment yet. It will show up in your account once it does.</p>
          <Link to="/account" className={buttonClass('default', 'lg', 'mt-6')}>Go to my orders</Link>
        </>
      )}
      {view === 'failed' && (
        <>
          <XCircle className="mx-auto size-12 text-destructive" />
          <h1 className="mt-6 text-2xl font-bold">We couldn't confirm that payment</h1>
          <p className="mt-2 text-muted-foreground">If you were charged, it will appear in your orders shortly. Otherwise you can try again.</p>
          <Link to="/search" className={buttonClass('default', 'lg', 'mt-6')}>Back to browsing</Link>
        </>
      )}
    </div>
  )
}
