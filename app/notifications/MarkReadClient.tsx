'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function MarkReadClient() {
  const router = useRouter()

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' })
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={markAllRead}>
      Mark all read
    </Button>
  )
}
