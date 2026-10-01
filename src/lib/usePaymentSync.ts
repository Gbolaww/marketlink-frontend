import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { orderApi } from '@/lib/api'

type Row = Record<string, unknown>

/**
 * Orders only become "paid" once the backend hears from Paystack. If the customer paid but never came
 * back through the return page (closed the tab, slow webhook), ask the backend to check each unpaid
 * order with Paystack once, then refresh the list.
 */
export function usePaymentSync(orders: Row[] | undefined) {
  const qc = useQueryClient()
  const checked = useRef(new Set<string>())

  useEffect(() => {
    const pending = (orders ?? []).filter((o) => o.status === 'pending' && !checked.current.has(String(o.id))).slice(0, 5)
    if (pending.length === 0) return
    pending.forEach((o) => checked.current.add(String(o.id)))

    let cancelled = false
    ;(async () => {
      let changed = false
      for (const o of pending) {
        try {
          const { data } = await orderApi.verifyPayment(String(o.processor_reference))
          if (data?.status && data.status !== 'pending') changed = true
        } catch {
          /* Paystack unreachable or not paid: leave the order as it is */
        }
      }
      if (changed && !cancelled) qc.invalidateQueries({ queryKey: ['my-orders'] })
    })()
    return () => {
      cancelled = true
    }
  }, [orders, qc])
}
