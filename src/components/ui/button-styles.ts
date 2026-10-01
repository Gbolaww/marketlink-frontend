import { cn } from '@/lib/utils'

export type Variant = 'default' | 'secondary' | 'outline' | 'ghost'
export type Size = 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-input bg-background hover:bg-secondary',
  ghost: 'hover:bg-secondary',
}
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3',
  md: 'h-10 px-4',
  lg: 'h-12 px-6 text-base',
  icon: 'size-10',
}

export function buttonClass(variant: Variant = 'default', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 cursor-pointer',
    variants[variant],
    sizes[size],
    className,
  )
}
