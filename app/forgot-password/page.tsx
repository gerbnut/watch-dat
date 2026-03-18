'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthShell } from '@/components/auth/AuthShell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim() }),
    })

    setLoading(false)
    setSent(true)
  }

  return (
    <AuthShell>
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold tracking-tight">Forgot your password?</h1>
          <p className="text-sm text-muted-foreground/70">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              If an account with that email exists, we&apos;ve sent a reset link. Check your inbox.
            </p>
            <Link href="/login" className="block text-center text-sm text-cinema-400 hover:underline font-medium">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                required
              />
            </div>
            <Button type="submit" variant="cinema" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-cinema-400 hover:underline font-medium">
                Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </AuthShell>
  )
}
