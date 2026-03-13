# Form Validation Design

**Date:** 2026-03-12
**Status:** Approved

## Overview

Add comprehensive client-side form validation with inline error messages to all 5 forms in Watch Dat. No new dependencies. No API route changes.

## Architecture

### New files

**`lib/form-validation.ts`**
Pure functions, each returns `string | null` (error message or null if valid):
- `validateEmail(s)` — valid format check (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- `validateUsernameFormat(s)` — 3–20 chars, `[a-z0-9_]` only (consistent with existing input auto-lowercase behavior)
- `validateDisplayName(s)` — required (non-empty after trim), max 50 chars
- `validatePassword(s)` — min 8 chars, contains at least one letter, contains at least one number
- `validateBio(s)` — max 300 chars
- `validateListName(s)` — required (non-empty after trim), max 100 chars
- `validateListDescription(s)` — max 500 chars

**`components/ui/FieldError.tsx`**
```tsx
export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-xs text-destructive mt-1">{msg}</p>
}
```
Used by all forms for consistent inline error styling.

### Unchanged

- All API routes — no changes
- Prisma schema — no changes
- `auth.ts`, `middleware.ts` — no changes
- Existing component styling and layout

## Per-Form Changes

### 1. Register (`app/register/page.tsx`)

**State additions:**
- Existing `errors: Record<string, string>` — add field keys: `email`, `username`, `displayName`, `password`, `general`
- `checkingUsername: boolean` — true while the availability fetch is in-flight
- `usernameAvailable: boolean | null` — null = unchecked, true = available, false = taken

**On blur (each field):**
- Email: run `validateEmail` — show error inline below field if invalid
- Username: run `validateUsernameFormat` first — show format error if invalid, else fire availability check (see below)
- Display name: run `validateDisplayName`
- Password: `validatePassword` result is **not** shown as a `FieldError` — the existing `PasswordStrength` component already shows all three rules inline. No second error surface for password. The submit guard (below) handles blocking.

**Username availability check:**
- Fires on blur, debounced 400ms
- Store the AbortController in a `useRef<AbortController | null>` named `usernameAbortRef`. On each new check, call `usernameAbortRef.current?.abort()` before creating a new controller and assigning it to the ref. This ensures any previous in-flight fetch is cancelled when the field blurs again.
- `GET /api/users/{username}` (the existing profile endpoint)
  - 200 → username taken → `errors.username = "Username taken"`, `usernameAvailable = false`
  - 404 → username free → clear `errors.username`, `usernameAvailable = true`, show green hint "Username available" below field
  - 500 or network error → `errors.username = "Couldn't check availability, try again"`, `usernameAvailable = null`, **block submit** until user re-triggers the check by blurring the field again
- Set `checkingUsername = true` while fetch is pending; show a spinner inline

**On submit (pre-fetch validation gate):**
1. Run all validators: `validateEmail`, `validateUsernameFormat`, `validateDisplayName`
2. Check `validatePassword` — block if any rule fails (min 8 chars, letter, number)
3. Check `checkingUsername === true` or `usernameAvailable !== true` — block submit
4. If any error set, focus first invalid field and return without fetching

**Server error mapping (after fetch):**
Parse `data.error` string with case-insensitive checks:
- Contains "email" (e.g. "Email already in use", "Invalid email address") → `errors.email`
- Contains "username" (e.g. "Username already taken", "Username must be at least") → `errors.username`
- Contains "display" (e.g. "Display name required") → `errors.displayName`
- Contains "password" → `errors.password` (shown as a `FieldError` below the field)
- 429 status or contains "attempts" → `errors.general = "Too many attempts. Please try again later."`
- Everything else → `errors.general`

**Error clearing:** existing `update()` function already clears `errors[field]` on input change — no change needed.

**Submit button:** `usernameAvailable` starts as `null` (unchecked). The button is disabled when `loading || checkingUsername || (usernameAvailable !== true && form.username.length >= 3)`. This means: the button is enabled on first render (before the user has typed a username), but once they've entered 3+ characters the availability check must pass before submitting. If the username field is empty or < 3 chars, the pre-submit validator catches it before the fetch fires anyway.

---

### 2. Login (`app/login/page.tsx`)

**State addition:** `const [authError, setAuthError] = useState('')` — a single string, not a full errors record.

**On failed sign-in:** replace the toast with `setAuthError('Invalid email or password')` rendered as a `<FieldError msg={authError} />` below the password field.

**Error clearing:** call `setAuthError('')` in both the email and password `onChange` handlers.

**Submit:** disabled during `loading` (already implemented). No other changes.

---

### 3. Settings (`app/settings/SettingsFormClient.tsx`)

**Username:** stays read-only — no changes.

**State additions:**
- `displayNameError: string` — inline error for display name
- No new state needed for bio — counter is derived from `bio.length`

**Display name:**
- Validate in `handleSave` using `validateDisplayName` before firing fetch
- If invalid, set `displayNameError`, block save
- Clear `displayNameError` in the display name `onChange` handler (inside `setDisplayName` call)

**Bio:**
- Character counter `{bio.length}/300` rendered below the textarea, always visible
- Counter text is `text-destructive` when `bio.length > 300`, otherwise `text-muted-foreground`
- Block save in `handleSave` if `bio.length > 300` (show toast: "Bio must be 300 characters or less" — consistent with existing toast-for-save pattern in this component)

---

### 4. Log film modal (`components/reviews/LogFilmModal.tsx`)

**Review text:**
- Limit is **10,000 characters**
- Character counter shown only when `text.length > 8000`, rendered below the textarea: `{text.length}/10,000`
- Counter is `text-destructive` when `text.length >= 10000`
- Block submit in `handleSubmit` if `text.length > 10000`; show inline error below textarea: "Review must be 10,000 characters or less"

**Watched date:**
- The `max` attribute already prevents future date selection via browser UI
- Add JS fallback in `handleSubmit`: if `watchedDate > today` (compare `yyyy-MM-dd` strings), set `dateError` and block submit
- State addition: `const [dateError, setDateError] = useState('')`
- Render `<FieldError msg={dateError} />` below the date input
- Clear `dateError` in the date `onChange` handler

**Submit:** already disabled while `submitting` — add `text.length > 10000` to the disabled condition on the Save button as well

---

### 5. Create list (`app/lists/CreateListButtonClient.tsx`)

**State addition:** `const [nameError, setNameError] = useState('')`

**Name:**
- Validate with `validateListName` at the top of `handleCreate` before any fetch
- If invalid, set `nameError`, block submit
- Render `<FieldError msg={nameError} />` below the name input
- Clear `nameError` in the name `onChange` handler

**Description:**
- Limit is **500 characters**
- Character counter `{description.length}/500` rendered below the textarea, always visible
- Counter is `text-destructive` when `description.length > 500`, otherwise `text-muted-foreground`
- Block submit in `handleCreate` if `description.length > 500`
- Update existing disabled condition on Create button: `!name.trim() || loading || description.length > 500`

**No reset on close needed** — the dialog already conditionally resets on open (name/description start empty each time).

---

## Error Display Rules

| Surface | Component | When |
|---------|-----------|------|
| Field-level errors | `<FieldError>` (red, `text-destructive`) | On blur or failed submit |
| Username available hint | plain `<p>` (green, `text-emerald-400`) | After successful availability check |
| Auth error (login) | `<FieldError>` below password field | After failed sign-in |
| General errors (register) | existing red banner | Server errors not mapped to a field |
| Bio/description over-limit | toast (settings) / block + counter color (modal, list) | On save attempt |

Toasts are reserved for **success messages** only (existing pattern).

## Files Modified

| File | Change |
|------|--------|
| `lib/form-validation.ts` | **New** — 7 validation utility functions |
| `components/ui/FieldError.tsx` | **New** — inline error component |
| `app/register/page.tsx` | Blur validation, username availability check, server error mapping |
| `app/login/page.tsx` | Replace toast with inline `authError` state |
| `app/settings/SettingsFormClient.tsx` | Display name error, bio counter |
| `components/reviews/LogFilmModal.tsx` | Date JS validation, text counter + block |
| `app/lists/CreateListButtonClient.tsx` | Name error, description counter + block |
