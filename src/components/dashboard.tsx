import { Fragment } from 'react'
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
    <>
      {/* Phones: one card per row, so no column is hidden behind a sideways scroll. The first column is the title. */}
      <ul className="space-y-3 md:hidden">
        {rows.map((r, i) => (
          <li key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="min-w-0 break-words font-semibold">{r[0]}</div>
            <dl className="mt-3 grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] items-start gap-x-3 gap-y-2 text-sm">
              {r.slice(1).map((c, j) =>
                head[j + 1] ? (
                  <Fragment key={j}>
                    <dt className="text-muted-foreground">{head[j + 1]}</dt>
                    <dd className="min-w-0 break-words">{c}</dd>
                  </Fragment>
                ) : (
                  <dd key={j} className="col-span-2 min-w-0">{c}</dd>
                ),
              )}
            </dl>
          </li>
        ))}
      </ul>

      {/* Tablets and larger: the full table. */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left">
            <tr>{head.map((h, k) => <th key={h + k} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
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
    </>
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

export function QueryState({ loading, error, message, children }: { loading: boolean; error: boolean; message?: string; children: ReactNode }) {
  if (loading) return <div className="h-40 animate-pulse rounded-xl bg-muted" />
  if (error) return <p className="rounded-xl border border-dashed border-border px-4 py-14 text-center text-destructive">{message ?? "We couldn't load this. Please try again."}</p>
  return <>{children}</>
}
