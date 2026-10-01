import type { ButtonHTMLAttributes } from 'react'
import { buttonClass } from '@/components/ui/button-styles'
import type { Size, Variant } from '@/components/ui/button-styles'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export function Button({ variant, size, className, type = 'button', ...rest }: Props) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />
}
