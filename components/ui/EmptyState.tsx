import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; href: string }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-white/[0.06] bg-white/[0.01] p-12 text-center space-y-3">
      <Icon className="h-10 w-10 mx-auto text-muted-foreground/20" />
      <div className="space-y-1.5">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <Link href={action.href}>
          <Button variant="cinema" size="sm">{action.label}</Button>
        </Link>
      )}
    </div>
  )
}
