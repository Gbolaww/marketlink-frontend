import { useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TabItem {
  value: string
  label: string
  icon?: ReactNode
  count?: number
}

export function Tabs({ items, render }: { items: TabItem[]; render: (value: string) => ReactNode }) {
  const [value, setValue] = useState(items[0].value)
  return (
    <div>
      <div role="tablist" className="inline-flex max-w-full flex-wrap gap-1 rounded-lg bg-muted p-1">
        {items.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={value === t.value}
            onClick={() => setValue(t.value)}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors [&_svg]:size-4',
              value === t.value ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.icon}
            {t.label}
            {t.count ? <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{t.count}</span> : null}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="mt-6">{render(value)}</div>
    </div>
  )
}
