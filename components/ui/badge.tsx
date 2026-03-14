import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-cinema-500/10 text-cinema-400 border-cinema-500/20',
        secondary: 'bg-secondary text-muted-foreground border-border',
        destructive: 'bg-destructive/10 text-red-400 border-destructive/20',
        outline: 'border border-border text-muted-foreground bg-transparent',
        cinema: 'bg-cinema-500/10 text-cinema-400 border-cinema-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
