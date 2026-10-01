import type { ReactNode } from 'react'

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-14 text-center">
      <p className="font-semibold">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
    </div>
  )
}

export function DataTable({ head, rows, empty }: { head: string[]; rows: ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <EmptyState title={empty} />
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left">
          <tr>{head.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              {r.map((c, j) => <td key={j} className="px-4 py-3 text-muted-foreground">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function QueryState({ loading, error, children }: { loading: boolean; error: boolean; children: ReactNode }) {
  if (loading) return <div className="h-40 animate-pulse rounded-xl bg-muted" />
  if (error) return <p className="rounded-xl border border-dashed border-border py-14 text-center text-destructive">We couldn't load this. Please try again.</p>
  return <>{children}</>
}
