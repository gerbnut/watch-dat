# Form Validation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add inline client-side form validation to all 5 forms in Watch Dat with no new dependencies and no API changes.

**Architecture:** Two shared primitives (`lib/form-validation.ts` + `components/ui/FieldError.tsx`) used across 5 modified components. Validation runs on blur and is re-checked on submit before any fetch fires. All errors are inline red text below the field; toasts remain for success only.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Next.js 16. No new packages.

**Spec:** `docs/superpowers/specs/2026-03-12-form-validation-design.md`

---

## Chunk 1: Foundation

### Task 1: Validation utilities

**Files:**
- Create: `lib/form-validation.ts`
- Create: `components/ui/FieldError.tsx`

- [ ] **Step 1: Create `lib/form-validation.ts`**

```ts
/** Returns an error string or null if valid. */

export function validateEmail(s: string): string | null {
  if (!s.trim()) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return 'Enter a valid email'
  return null
}

export function validateUsernameFormat(s: string): string | null {
  if (s.length < 3) return 'Username must be at least 3 characters'
  if (s.length > 20) return 'Username must be 20 characters or less'
  if (!/^[a-z0-9_]+$/.test(s)) return 'Letters, numbers, underscores only'
  return null
}

export function validateDisplayName(s: string): string | null {
  if (!s.trim()) return 'Display name is required'
  if (s.trim().length > 50) return 'Max 50 characters'
  return null
}

export function validatePassword(s: string): string | null {
  if (s.length < 8) return 'Password must be at least 8 characters'
  if (!/[a-zA-Z]/.test(s)) return 'Password must contain a letter'
  if (!/\d/.test(s)) return 'Password must contain a number'
  return null
}

export function validateBio(s: string): string | null {
  if (s.length > 300) return 'Bio must be 300 characters or less'
  return null
}

export function validateListName(s: string): string | null {
  if (!s.trim()) return 'Name is required'
  if (s.trim().length > 100) return 'Max 100 characters'
  return null
}

export function validateListDescription(s: string): string | null {
  if (s.length > 500) return 'Max 500 characters'
  return null
}
```

- [ ] **Step 2: Create `components/ui/FieldError.tsx`**

```tsx
export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-xs text-destructive mt-1">{msg}</p>
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/form-validation.ts components/ui/FieldError.tsx
git commit -m "add form validation utilities and FieldError component"
```

---

## Chunk 2: Register form

### Task 2: Register form validation

**Files:**
- Modify: `app/register/page.tsx`

Current state: single `errors.general` banner, no field-level errors, no username availability check.

- [ ] **Step 1: Update imports**

Replace the existing React import, remove the unused `toast` import, and add the new utility imports:

```ts
// Replace:
import React, { useState } from 'react'
// With:
import React, { useState, useRef } from 'react'

// Remove this line entirely (toast is no longer used after this change):
import { toast } from '@/hooks/use-toast'

// Add these two lines:
import { validateEmail, validateUsernameFormat, validateDisplayName, validatePassword } from '@/lib/form-validation'
import { FieldError } from '@/components/ui/FieldError'
```

- [ ] **Step 2: Add new state and refs inside `RegisterPage`**

Add these after the existing `useState` declarations:

```ts
const [checkingUsername, setCheckingUsername] = useState(false)
const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
const usernameAbortRef = useRef<AbortController | null>(null)
const usernameCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
```

- [ ] **Step 3: Add blur handlers and availability check**

Add these functions before `handleSubmit`:

```ts
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
```

- [ ] **Step 4: Replace `handleSubmit` with validated version**

Replace the entire `handleSubmit` function:

```ts
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
```

- [ ] **Step 5: Replace the `<form>` JSX**

Replace the entire `<form>...</form>` block:

```tsx
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
```

Note: `required` attributes removed — JS validation handles all required checks now.

- [ ] **Step 6: Commit**

```bash
git add app/register/page.tsx
git commit -m "add inline validation and username availability check to register form"
```

---

## Chunk 3: Login and Settings forms

### Task 3: Login form

**Files:**
- Modify: `app/login/page.tsx`

Current state: failed sign-in shows a destructive toast. No client-side validation.

- [ ] **Step 1: Update imports in `login/page.tsx`**

Remove the `toast` import (it will no longer be used after this change) and add `FieldError`:

```ts
// Remove this line entirely:
import { toast } from '@/hooks/use-toast'

// Add this line:
import { FieldError } from '@/components/ui/FieldError'
```

- [ ] **Step 2: Add `authError` state inside `LoginContent`**

```ts
const [authError, setAuthError] = useState('')
```

- [ ] **Step 3: Replace the `if (result?.error)` block in `handleSubmit`**

```ts
if (result?.error) {
  setAuthError('Invalid email or password')
} else {
  router.push(callbackUrl)
  router.refresh()
}
```

- [ ] **Step 4: Clear `authError` on both input `onChange` handlers**

```tsx
// email input — replace existing onChange:
onChange={(e) => { setEmail(e.target.value); setAuthError('') }}

// password input — replace existing onChange:
onChange={(e) => { setPassword(e.target.value); setAuthError('') }}
```

- [ ] **Step 5: Add `<FieldError>` below the password wrapper `</div>`, before the Submit button**

```tsx
<FieldError msg={authError} />
```

- [ ] **Step 6: Commit**

```bash
git add app/login/page.tsx
git commit -m "replace login toast error with inline field error"
```

---

### Task 4: Settings form

**Files:**
- Modify: `app/settings/SettingsFormClient.tsx`

Current state: no validation, bio has no character counter, displayName accepts anything.

- [ ] **Step 1: Update imports**

`cn` is NOT currently imported in this file. Change the `@/lib/utils` import line from:

```ts
import { getInitials } from '@/lib/utils'
```

to:

```ts
import { cn, getInitials } from '@/lib/utils'
```

Then add:

```ts
import { validateDisplayName } from '@/lib/form-validation'
import { FieldError } from '@/components/ui/FieldError'
```

- [ ] **Step 2: Add `displayNameError` state**

```ts
const [displayNameError, setDisplayNameError] = useState('')
```

- [ ] **Step 3: Add validation guard to `handleSave`**

At the top of `handleSave`, before `setSaving(true)`:

```ts
const dnErr = validateDisplayName(displayName)
if (dnErr) {
  setDisplayNameError(dnErr)
  return
}
if (bio.length > 300) {
  toast({ title: 'Bio must be 300 characters or less', variant: 'destructive' })
  return
}
```

- [ ] **Step 4: Update displayName input to clear error on change and show `<FieldError>`**

```tsx
<div className="space-y-1.5">
  <label className="text-sm font-medium">Display name</label>
  <Input
    value={displayName}
    onChange={(e) => { setDisplayName(e.target.value); setDisplayNameError('') }}
    placeholder="Your display name"
  />
  <FieldError msg={displayNameError} />
</div>
```

- [ ] **Step 5: Replace the bio `TextareaAutosize` block to add the character counter**

```tsx
<div className="space-y-1.5">
  <label className="text-sm font-medium">Bio</label>
  <TextareaAutosize
    value={bio}
    onChange={(e) => setBio(e.target.value)}
    placeholder="Tell people a bit about yourself..."
    minRows={2}
    maxRows={6}
    className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
  />
  <p className={cn('text-xs', bio.length > 300 ? 'text-destructive' : 'text-muted-foreground')}>
    {bio.length}/300
  </p>
</div>
```

- [ ] **Step 6: Commit**

```bash
git add app/settings/SettingsFormClient.tsx
git commit -m "add displayName validation and bio character counter to settings"
```

---

## Chunk 4: Review modal and Create list

### Task 5: Log film modal

**Files:**
- Modify: `components/reviews/LogFilmModal.tsx`

Current state: `max` attribute on date input blocks future dates in browser UI only; no text counter; no submit-time JS date check.

- [ ] **Step 1: Add import**

```ts
import { FieldError } from '@/components/ui/FieldError'
```

- [ ] **Step 2: Add `dateError` state**

```ts
const [dateError, setDateError] = useState('')
```

- [ ] **Step 3: Add validation at the top of `handleSubmit`, before `setSubmitting(true)`**

```ts
const today = formatDate(new Date(), 'yyyy-MM-dd')
if (watchedDate && watchedDate > today) {
  setDateError("Watched date can't be in the future")
  return
}
if (text.length > 10000) {
  return // text counter already shows the error state visually
}
```

- [ ] **Step 4: Replace the date `<Input>` to clear `dateError` on change and show `<FieldError>`**

```tsx
<div className="space-y-2">
  <label className="text-sm font-medium">Date watched</label>
  <Input
    type="date"
    value={watchedDate}
    onChange={(e) => { setWatchedDate(e.target.value); setDateError('') }}
    max={formatDate(new Date(), 'yyyy-MM-dd')}
  />
  <FieldError msg={dateError} />
</div>
```

- [ ] **Step 5: Replace the review `TextareaAutosize` block to add the counter**

```tsx
<div className="space-y-2">
  <label className="text-sm font-medium">Review (optional)</label>
  <TextareaAutosize
    value={text}
    onChange={(e) => setText(e.target.value)}
    placeholder="What did you think? Markdown supported..."
    minRows={3}
    maxRows={10}
    className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
  />
  {text.length > 8000 && (
    <p className={cn('text-xs', text.length > 10000 ? 'text-destructive' : 'text-muted-foreground')}>
      {text.length.toLocaleString()}/10,000
    </p>
  )}
  {text.length > 10000 && (
    <FieldError msg="Review must be 10,000 characters or less" />
  )}
</div>
```

`cn` and `formatDate` are already imported in this file (`import { cn, formatDate } from '@/lib/utils'`).

- [ ] **Step 6: Update the Save button disabled condition**

```tsx
<Button
  variant="cinema"
  onClick={handleSubmit}
  disabled={(!movie && !editMode) || submitting || text.length > 10000}
>
  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
</Button>
```

- [ ] **Step 7: Add `setDateError('')` inside `handleClose`**

Replace the existing `handleClose` function:

```ts
function handleClose() {
  setMovie(preselectedMovie ?? null)
  setRating(null)
  setText('')
  setLiked(false)
  setHasSpoiler(false)
  setRewatch(false)
  setWatchedDate(formatDate(new Date(), 'yyyy-MM-dd'))
  setDateError('')
  onClose()
}
```

- [ ] **Step 8: Commit**

```bash
git add components/reviews/LogFilmModal.tsx
git commit -m "add date validation and review text counter to log film modal"
```

---

### Task 6: Create list modal

**Files:**
- Modify: `app/lists/CreateListButtonClient.tsx`

Current state: silently returns if `!name.trim()`. No character counters. No inline errors.

- [ ] **Step 1: Update imports**

`cn` is not currently imported. Add:

```ts
import { cn } from '@/lib/utils'
import { validateListName, validateListDescription } from '@/lib/form-validation'
import { FieldError } from '@/components/ui/FieldError'
```

- [ ] **Step 2: Add `nameError` state**

```ts
const [nameError, setNameError] = useState('')
```

- [ ] **Step 3: Add validation gate at the top of `handleCreate`, before `setLoading(true)`**

```ts
const nameErr = validateListName(name)
if (nameErr) {
  setNameError(nameErr)
  return
}
if (validateListDescription(description)) {
  return // description counter already shows the error; just block submit
}
```

- [ ] **Step 4: Replace the name `<Input>` to clear `nameError` on change and show `<FieldError>`**

```tsx
<div className="space-y-1.5">
  <label className="text-sm font-medium">Name</label>
  <Input
    value={name}
    onChange={(e) => { setName(e.target.value); setNameError('') }}
    placeholder="e.g. Films that changed my life"
    autoFocus
  />
  <FieldError msg={nameError} />
</div>
```

- [ ] **Step 5: Replace the description `TextareaAutosize` block to add the counter**

```tsx
<div className="space-y-1.5">
  <label className="text-sm font-medium">Description (optional)</label>
  <TextareaAutosize
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    placeholder="What's this list about?"
    minRows={2}
    maxRows={5}
    className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
  />
  <p className={cn('text-xs', description.length > 500 ? 'text-destructive' : 'text-muted-foreground')}>
    {description.length}/500
  </p>
</div>
```

- [ ] **Step 6: Update Create button disabled condition**

```tsx
<Button variant="cinema" onClick={handleCreate} disabled={!name.trim() || loading || description.length > 500}>
  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create list'}
</Button>
```

- [ ] **Step 7: Reset `nameError` when dialog closes**

The existing `<Dialog onOpenChange={setOpen}>` only calls `setOpen`. Replace it so the error and fields are cleared when the user dismisses the dialog via the X button or clicking outside (the success path already resets via explicit `setName('')` etc.):

```tsx
<Dialog
  open={open}
  onOpenChange={(o) => {
    setOpen(o)
    if (!o) {
      setName('')
      setDescription('')
      setNameError('')
    }
  }}
>
```

- [ ] **Step 8: Commit**

```bash
git add app/lists/CreateListButtonClient.tsx
git commit -m "add name validation and description counter to create list modal"
```

---

## Final step

- [ ] **Push**

```bash
git push origin main
```
