'use client'

import React, { Suspense, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2, Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/ui/FieldError'
import { AuthShell } from '@/components/auth/AuthShell'
import { OtpInput } from '@/components/auth/OtpInput'

type Step = 'initial' | 'email' | 'otp' | 'password'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'

  const [step, setStep] = useState<Step>('initial')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const startResendCooldown = useCallback(() => {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  async function sendOtp() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send code')
        setLoading(false)
        return
      }
      if (data.autoVerify && data.code) {
        // Sandbox mode: skip OTP input, auto-verify immediately
        await handleOtpComplete(data.code)
        return
      }
      setStep('otp')
      startResendCooldown()
    } catch {
      setError('Something went wrong. Try again.')
    }
    setLoading(false)
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email')
      return
    }
    await sendOtp()
  }

  const handleOtpComplete = useCallback(
    async (code: string) => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/auth/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.toLowerCase().trim(), code }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Invalid code')
          setLoading(false)
          return
        }
        if (data.isNewUser) {
          router.push('/register')
        } else {
          router.push(callbackUrl)
          router.refresh()
        }
      } catch {
        setError('Something went wrong. Try again.')
        setLoading(false)
      }
    },
    [email, callbackUrl, router]
  )

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Invalid email or password')
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  return (
    <AuthShell>
      {step === 'initial' && (
        <div className="space-y-4 text-center">
          <h1 className="text-xl font-bold tracking-tight">Welcome to Watch Dat</h1>
          <p className="text-sm text-muted-foreground/70">Sign in or create an account</p>
          <Button
            variant="cinema"
            size="lg"
            className="w-full mt-2"
            onClick={() => setStep('email')}
          >
            <Mail className="h-4 w-4 mr-2" />
            Continue with Email
          </Button>
          <button
            onClick={() => setStep('password')}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Have a password? Sign in here
          </button>
        </div>
      )}

      {step === 'email' && (
        <div className="space-y-4">
          <button
            onClick={() => { setStep('initial'); setError('') }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold tracking-tight">Enter your email</h1>
            <p className="text-sm text-muted-foreground/70">We&apos;ll send you a verification code</p>
          </div>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              required
            />
            <FieldError msg={error} />
            <Button type="submit" variant="cinema" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send code'}
            </Button>
          </form>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-4">
          <button
            onClick={() => { setStep('email'); setError('') }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold tracking-tight">Check your email</h1>
            <p className="text-sm text-muted-foreground/70">
              Enter the 6-digit code sent to <span className="text-foreground">{email}</span>
            </p>
          </div>
          <OtpInput onChange={handleOtpComplete} disabled={loading} />
          <FieldError msg={error} />
          {loading && (
            <div className="flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          <div className="text-center">
            <button
              onClick={sendOtp}
              disabled={resendCooldown > 0 || loading}
              className="text-sm text-cinema-400 hover:underline disabled:text-muted-foreground disabled:no-underline"
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>
        </div>
      )}

      {step === 'password' && (
        <div className="space-y-4">
          <button
            onClick={() => { setStep('initial'); setError('') }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground/70">Sign in with your password</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
            </div>
            <FieldError msg={error} />
            <Button type="submit" variant="cinema" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-cinema-400 hover:underline font-medium">
              Create one free
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-sm pt-12 pb-20 text-center"><Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" /></div>}>
      <LoginContent />
    </Suspense>
  )
}
