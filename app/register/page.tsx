'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Film, Loader2, Eye, EyeOff, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

function PasswordStrength({ password }: { password: string }) {
  const rules = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains a number', pass: /\d/.test(password) },
    { label: 'Contains a letter', pass: /[a-zA-Z]/.test(password) },
  ]

  if (!password) return null

  return (
    <ul className="mt-1.5 space-y-1">
      {rules.map((r) => (
        <li key={r.label} className={cn('flex items-center gap-1.5 text-xs', r.pass ? 'text-emerald-400' : 'text-muted-foreground')}>
          {r.pass ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {r.label}
        </li>
      ))}
    </ul>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ general: data.error ?? 'Registration failed' })
        setLoading(false)
        return
      }

      // Auto sign in
      const result = await signIn('credentials', {
        email: form.email.toLowerCase(),
        password: form.password,
        redirect: false,
      })

      if (result?.ok) {
        router.push('/')
        router.refresh()
      }
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm pt-12 pb-20">
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cinema-500 mb-3">
          <Film className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Join Watch Dat</h1>
        <p className="text-muted-foreground text-sm">Start your digital film diary</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
            {errors.general}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Username</label>
          <Input
            value={form.username}
            onChange={(e) => update('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="cinephile42"
            required
          />
          <p className="text-xs text-muted-foreground">Letters, numbers, underscores only</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Display name</label>
          <Input
            value={form.displayName}
            onChange={(e) => update('displayName', e.target.value)}
            placeholder="Your Name"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="••••••••"
              required
              className="pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrength password={form.password} />
        </div>

        <Button type="submit" variant="cinema" size="lg" className="w-full mt-2" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-cinema-400 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
