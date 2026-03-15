'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2, Check, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/ui/FieldError'
import { AuthShell } from '@/components/auth/AuthShell'
import { validateUsernameFormat, validateDisplayName } from '@/lib/form-validation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const usernameAbortRef = useRef<AbortController | null>(null)
  const usernameCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  function validatePassword(pw: string): string | null {
    if (pw.length < 8) return 'Password must be at least 8 characters'
    if (!/[a-zA-Z]/.test(pw)) return 'Password must contain a letter'
    if (!/[0-9]/.test(pw)) return 'Password must contain a number'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const usernameErr = validateUsernameFormat(form.username)
    const displayNameErr = validateDisplayName(form.displayName)
    const passwordErr = validatePassword(form.password)
    const emailErr = !form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? 'Enter a valid email'
      : null

    const newErrors: Record<string, string> = {}
    if (emailErr) newErrors.email = emailErr
    if (usernameErr) newErrors.username = usernameErr
    if (displayNameErr) newErrors.displayName = displayNameErr
    if (passwordErr) newErrors.password = passwordErr

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (checkingUsername || (usernameAvailable !== true && form.username.length >= 3)) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.toLowerCase().trim(),
          username: form.username,
          displayName: form.displayName,
          password: form.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const msg = (data.error ?? 'Registration failed') as string
        if (msg.toLowerCase().includes('email')) {
          setErrors({ email: msg })
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

      // Auto sign-in after successful registration
      const signInResult = await signIn('credentials', {
        email: form.email.toLowerCase().trim(),
        password: form.password,
        redirect: false,
      })

      if (signInResult?.error) {
        // Registration succeeded but auto sign-in failed — redirect to login
        router.push('/login')
      } else {
        router.push('/onboarding')
        router.refresh()
      }
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' })
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground/70">Start tracking what you watch</p>
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
              autoComplete="email"
              autoFocus
            />
            <FieldError msg={errors.email} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Username</label>
            <div className="relative">
              <Input
                value={form.username}
                onChange={(e) => update('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                onBlur={handleUsernameBlur}
                placeholder="cinephile42"
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

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
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
            <p className="text-xs text-muted-foreground/60">Min 8 characters, must include a letter and a number</p>
            <FieldError msg={errors.password} />
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

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-cinema-400 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
