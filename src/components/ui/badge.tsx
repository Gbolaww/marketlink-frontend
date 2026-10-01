import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Badge({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground', className)}
      {...rest}
    />
  )
}
