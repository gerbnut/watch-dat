'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2, Check, Eye, EyeOff } from 'lucide-react'
import { isNative, openExternal } from '@/lib/native'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/ui/FieldError'
import { AuthShell } from '@/components/auth/AuthShell'
import { validateUsernameFormat, validateDisplayName } from '@/lib/form-validation'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [appleLoading, setAppleLoading] = useState(false)
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

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          disabled={googleLoading}
          onClick={async () => {
            setGoogleLoading(true)
            if (isNative()) {
              await openExternal(`https://watch-dat-gold.vercel.app/api/auth/signin/google?callbackUrl=${encodeURIComponent('/onboarding')}`)
              setGoogleLoading(false)
            } else {
              signIn('google', { callbackUrl: '/onboarding' })
            }
          }}
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          disabled={appleLoading}
          onClick={async () => {
            setAppleLoading(true)
            if (isNative()) {
              await openExternal(`https://watch-dat-gold.vercel.app/api/auth/signin/apple?callbackUrl=${encodeURIComponent('/onboarding')}`)
              setAppleLoading(false)
            } else {
              signIn('apple', { callbackUrl: '/onboarding' })
            }
          }}
        >
          {appleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.94 4.78c-.09.07-1.78 1.02-1.78 3.13 0 2.44 2.14 3.3 2.2 3.32-.01.05-.34 1.17-1.13 2.31-.69.99-1.41 1.99-2.51 1.99s-1.38-.64-2.65-.64c-1.24 0-1.67.66-2.69.66s-1.71-.92-2.51-2.04C2.72 11.88 2 9.67 2 7.58c0-3.37 2.19-5.16 4.35-5.16 1.15 0 2.1.75 2.82.75.69 0 1.77-.8 3.08-.8.5 0 2.28.04 3.45 1.73l-.76.68zM11.5.44c.52-.61.88-1.46.88-2.31 0-.12-.01-.24-.03-.33-.84.03-1.83.56-2.43 1.25-.48.53-.92 1.38-.92 2.24 0 .13.02.26.03.3.06.01.15.02.24.02.75 0 1.7-.5 2.23-1.17z" transform="translate(0, 2)"/>
              </svg>
              Continue with Apple
            </>
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
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
