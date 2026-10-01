import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground disabled:opacity-50',
        className,
      )}
      {...rest}
    />
  )
}
