'use client'

import React, { Suspense, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/ui/FieldError'
import { AuthShell } from '@/components/auth/AuthShell'
import { validateUsernameFormat, validateDisplayName } from '@/lib/form-validation'

function PickUsernameContent() {
  const router = useRouter()
  const { data: session } = useSession()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState((session?.user as any)?.name ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const usernameAbortRef = useRef<AbortController | null>(null)
  const usernameCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleUsernameBlur() {
    const formatErr = validateUsernameFormat(username)
    if (formatErr) {
      setErrors((e) => ({ ...e, username: formatErr }))
      setUsernameAvailable(null)
      return
    }
    if (usernameCheckTimerRef.current) clearTimeout(usernameCheckTimerRef.current)
    usernameCheckTimerRef.current = setTimeout(() => checkUsernameAvailability(username), 400)
  }

  async function checkUsernameAvailability(uname: string) {
    usernameAbortRef.current?.abort()
    const controller = new AbortController()
    usernameAbortRef.current = controller

    setCheckingUsername(true)
    setUsernameAvailable(null)
    setErrors((e) => ({ ...e, username: '' }))

    try {
      const res = await fetch(`/api/users/${uname}`, { signal: controller.signal })
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

    const usernameErr = validateUsernameFormat(username)
    const displayNameErr = validateDisplayName(displayName)

    const newErrors: Record<string, string> = {}
    if (usernameErr) newErrors.username = usernameErr
    if (displayNameErr) newErrors.displayName = displayNameErr

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (checkingUsername || (usernameAvailable !== true && username.length >= 3)) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/set-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName }),
      })

      const data = await res.json()

      if (!res.ok) {
        const msg = data.error ?? 'Something went wrong'
        if (msg.toLowerCase().includes('username')) {
          setErrors({ username: msg })
        } else {
          setErrors({ general: msg })
        }
        setLoading(false)
        return
      }

      router.push('/onboarding')
      router.refresh()
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' })
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold tracking-tight">Create your identity</h1>
          <p className="text-sm text-muted-foreground/70">Choose a username and display name</p>
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
                value={username}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                  setUsername(val)
                  if (errors.username) setErrors((prev) => ({ ...prev, username: '' }))
                  setUsernameAvailable(null)
                }}
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
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value)
                if (errors.displayName) setErrors((prev) => ({ ...prev, displayName: '' }))
              }}
              placeholder="Your Name"
            />
            <FieldError msg={errors.displayName} />
          </div>

          <Button
            type="submit"
            variant="cinema"
            size="lg"
            className="w-full mt-2"
            disabled={loading || checkingUsername || (usernameAvailable !== true && username.length >= 3)}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
          </Button>
        </form>
      </div>
    </AuthShell>
  )
}

export default function PickUsernamePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-sm pt-12 pb-20 text-center"><Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" /></div>}>
      <PickUsernameContent />
    </Suspense>
  )
}
