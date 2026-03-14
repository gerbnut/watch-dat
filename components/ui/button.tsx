import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold tracking-tight transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/85',
        cinema: 'bg-cinema-500 text-white font-bold hover:bg-cinema-400 hover:shadow-glow-green-sm active:bg-cinema-600',
        'cinema-outline': 'border border-cinema-500/30 text-cinema-400 bg-cinema-500/5 hover:bg-cinema-500/10 hover:border-cinema-500/50',
        glass: 'backdrop-blur-sm bg-white/5 border border-white/10 text-foreground hover:bg-white/10 hover:border-white/[0.15]',
        destructive: 'bg-destructive/15 text-red-400 border border-destructive/20 hover:bg-destructive/25 hover:border-destructive/30',
        outline: 'border border-border bg-transparent text-foreground hover:bg-white/[0.03] hover:border-white/[0.08]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
        ghost: 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]',
        link: 'text-cinema-400 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6 text-sm',
        xl: 'h-12 px-8 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
