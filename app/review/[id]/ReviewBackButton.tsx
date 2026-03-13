'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function ReviewBackButton({ fallback }: { fallback: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      aria-label="Go back"
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  )
}
