'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react'
import { WatchDatLogoMark } from '@/components/layout/WatchDatLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { validateEmail, validateUsernameFormat, validateDisplayName, validatePassword } from '@/lib/form-validation'
import { FieldError } from '@/components/ui/FieldError'

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
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const usernameAbortRef = useRef<AbortController | null>(null)
  const usernameCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }))
  }

  function handleEmailBlur() {
    const err = validateEmail(form.email)
    if (err) setErrors((e) => ({ ...e, email: err }))
  }

  function handleDisplayNameBlur() {
    const err = validateDisplayName(form.displayName)
    if (err) setErrors((e) => ({ ...e, displayName: err }))
  }

  function handleUsernameBlur() {
    const formatErr = validateUsernameFormat(form.username)
    if (formatErr) {
      setErrors((e) => ({ ...e, username: formatErr }))
      setUsernameAvailable(null)
      return
    }
    // Debounce 400ms before firing the availability check
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

    const emailErr = validateEmail(form.email)
    const usernameErr = validateUsernameFormat(form.username)
    const displayNameErr = validateDisplayName(form.displayName)
    const passwordErr = validatePassword(form.password)

    const newErrors: Record<string, string> = {}
    if (emailErr) newErrors.email = emailErr
    if (usernameErr) newErrors.username = usernameErr
    if (displayNameErr) newErrors.displayName = displayNameErr
    // Password errors: PasswordStrength component shows rules visually, but
    // block submit and surface a general note so user knows why it failed
    if (passwordErr) newErrors.general = 'Please complete the password requirements above'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // Focus the first invalid field
      const firstId = emailErr
        ? 'reg-email'
        : usernameErr
        ? 'reg-username'
        : displayNameErr
        ? 'reg-displayName'
        : 'reg-password'
      document.getElementById(firstId)?.focus()
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
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        const msg = (data.error ?? 'Registration failed') as string
        const lower = msg.toLowerCase()
        if (lower.includes('email')) {
          setErrors((e) => ({ ...e, email: msg }))
          document.getElementById('reg-email')?.focus()
        } else if (lower.includes('username')) {
          setErrors((e) => ({ ...e, username: msg }))
          document.getElementById('reg-username')?.focus()
        } else if (lower.includes('display')) {
          setErrors((e) => ({ ...e, displayName: msg }))
          document.getElementById('reg-displayName')?.focus()
        } else if (lower.includes('password')) {
          setErrors((e) => ({ ...e, password: msg }))
          document.getElementById('reg-password')?.focus()
        } else if (lower.includes('attempts')) {
          setErrors((e) => ({ ...e, general: 'Too many attempts. Please try again later.' }))
        } else {
          setErrors((e) => ({ ...e, general: msg }))
        }
        setLoading(false)
        return
      }

      const result = await signIn('credentials', {
        email: form.email.toLowerCase(),
        password: form.password,
        redirect: false,
      })

      if (result?.ok) {
        router.push('/onboarding')
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
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cinema-950 border border-cinema-800/60 mb-3">
          <WatchDatLogoMark className="text-cinema-400" size={30} />
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
            id="reg-email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            onBlur={handleEmailBlur}
            placeholder="you@example.com"
          />
          <FieldError msg={errors.email} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Username</label>
          <div className="relative">
            <Input
              id="reg-username"
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
            <p className="text-xs text-emerald-400 mt-1">Username available</p>
          )}
          <FieldError msg={errors.username} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Display name</label>
          <Input
            id="reg-displayName"
            value={form.displayName}
            onChange={(e) => update('displayName', e.target.value)}
            onBlur={handleDisplayNameBlur}
            placeholder="Your Name"
          />
          <FieldError msg={errors.displayName} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Password</label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="••••••••"
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

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-cinema-400 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
