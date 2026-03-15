'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/ui/FieldError'
import { AuthShell } from '@/components/auth/AuthShell'
import { validateUsernameFormat, validateDisplayName } from '@/lib/form-validation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', displayName: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const usernameAbortRef = useRef<AbortController | null>(null)
  const usernameCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [hasToken, setHasToken] = useState(true)

  // Check for registration_token cookie on mount
  useEffect(() => {
    // Cookie is httpOnly so we can't read it client-side.
    // The server will reject if missing, but let's optimistically show the form.
    // If someone navigates here without verifying, the submit will fail gracefully.
  }, [])

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }))
  }

  function handleUsernameBlur() {
    const formatErr = validateUsernameFormat(form.username)
    if (formatErr) {
      setErrors((e) => ({ ...e, username: formatErr }))
      setUsernameAvailable(null)
      return
    }
    if (usernameCheckTimerRef.current) clearTimeout(usernameCheckTimerRef.current)
    usernameCheckTimerRef.current = setTimeout(() => checkUsernameAvailability(form.username), 400)
  }

  async function checkUsernameAvailability(username: string) {
    usernameAbortRef.current?.abort()
    const controller = new AbortController()
    usernameAbortRef.current = controller

    setCheckingUsername(true)
    setUsernameAvailable(null)
    setErrors((e) => ({ ...e, username: '' }))

    try {
      const res = await fetch(`/api/users/${username}`, { signal: controller.signal })
      if (res.status === 404) {
        setUsernameAvailable(true)
      } else if (res.ok) {
        setUsernameAvailable(false)
        setErrors((e) => ({ ...e, username: 'Username taken' }))
      } else {
        setUsernameAvailable(null)
        setErrors((e) => ({ ...e, username: "Couldn't check availability, try again" }))
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setUsernameAvailable(null)
      setErrors((e) => ({ ...e, username: "Couldn't check availability, try again" }))
    } finally {
      setCheckingUsername(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const usernameErr = validateUsernameFormat(form.username)
    const displayNameErr = validateDisplayName(form.displayName)

    const newErrors: Record<string, string> = {}
    if (usernameErr) newErrors.username = usernameErr
    if (displayNameErr) newErrors.displayName = displayNameErr

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (checkingUsername || (usernameAvailable !== true && form.username.length >= 3)) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        const msg = (data.error ?? 'Registration failed') as string
        if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('verify')) {
          setHasToken(false)
          setErrors({ general: msg })
        } else if (msg.toLowerCase().includes('username')) {
          setErrors({ username: msg })
        } else if (msg.toLowerCase().includes('display')) {
          setErrors({ displayName: msg })
        } else {
          setErrors({ general: msg })
        }
        setLoading(false)
        return
      }

      router.push(data.redirect || '/onboarding')
      router.refresh()
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' })
      setLoading(false)
    }
  }

  if (!hasToken) {
    return (
      <AuthShell>
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold tracking-tight">Verify your email first</h1>
          <p className="text-sm text-muted-foreground/70">
            You need to verify your email before creating an account.
          </p>
          <Button variant="cinema" size="lg" className="w-full" onClick={() => router.push('/login')}>
            Go to sign in
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold tracking-tight">Create your profile</h1>
          <p className="text-sm text-muted-foreground/70">Just a couple more details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {errors.general}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Username</label>
            <div className="relative">
              <Input
                value={form.username}
                onChange={(e) => update('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                onBlur={handleUsernameBlur}
                placeholder="cinephile42"
                autoFocus
              />
              {checkingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            {!checkingUsername && usernameAvailable === true && !errors.username && (
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <Check className="h-3 w-3" /> Username available
              </p>
            )}
            <FieldError msg={errors.username} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Display name</label>
            <Input
              value={form.displayName}
              onChange={(e) => update('displayName', e.target.value)}
              placeholder="Your Name"
            />
            <FieldError msg={errors.displayName} />
          </div>

          <Button
            type="submit"
            variant="cinema"
            size="lg"
            className="w-full mt-2"
            disabled={loading || checkingUsername || (usernameAvailable !== true && form.username.length >= 3)}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
          </Button>
        </form>
      </div>
    </AuthShell>
  )
}
