# Empty States, Loading Skeletons & Error Boundaries Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add consistent loading skeletons, empty states, and error boundaries across every data-fetching page.

**Architecture:** Create two shared primitives (`EmptyState`, `PageError`), then add `loading.tsx`/`error.tsx` per route, and replace the two client-side Loader2 spinners (friends, search) with skeleton content. All skeletons use the existing `.skeleton` CSS class with shimmer.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS, Lucide React. No new deps.

---

## What already exists — DO NOT TOUCH

- `app/diary/loading.tsx` ✅
- `app/lists/loading.tsx` ✅
- `app/watchlist/loading.tsx` ✅
- `app/notifications/loading.tsx` ✅
- `app/films/loading.tsx` ✅
- `app/person/[id]/loading.tsx` ✅
- `app/error.tsx` (global) ✅
- `app/diary/page.tsx` empty state ✅
- `app/lists/page.tsx` empty state ✅
- `app/watchlist/page.tsx` empty state ✅
- `app/notifications/page.tsx` empty state ✅
- `app/user/[username]/reviews/page.tsx` empty state ✅
- `app/user/[username]/diary/page.tsx` empty state ✅
- `app/user/[username]/lists/page.tsx` empty state ✅
- `components/feed/FeedTabs.tsx` skeletons + empty states ✅

---

## Task 1: Create `EmptyState` shared component

**Files:**
- Create: `components/ui/EmptyState.tsx`

**Step 1: Create the file**

```tsx
import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; href: string }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-12 text-center space-y-3">
      <Icon className="h-10 w-10 mx-auto text-muted-foreground/40" />
      <div className="space-y-1.5">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <Link href={action.href}>
          <Button variant="cinema" size="sm">{action.label}</Button>
        </Link>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/ui/EmptyState.tsx
git commit -m "add EmptyState shared component"
```

---

## Task 2: Create `PageError` shared component

**Files:**
- Create: `components/ui/PageError.tsx`

**Step 1: Create the file**

```tsx
'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PageErrorProps {
  message?: string
  reset: () => void
}

export function PageError({ message, reset }: PageErrorProps) {
  return (
    <div className="rounded-xl border bg-card p-12 text-center space-y-4">
      <AlertTriangle className="h-10 w-10 mx-auto text-destructive/60" />
      <div className="space-y-1.5">
        <p className="font-medium">Something went wrong</p>
        <p className="text-sm text-muted-foreground">
          {message ?? 'An unexpected error occurred. Please try again.'}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/ui/PageError.tsx
git commit -m "add PageError shared component"
```

---

## Task 3: Add `error.tsx` for diary, lists, watchlist, friends, search

All five files are identical. The `error` prop must be accepted even if unused (Next.js requirement).

**Files:**
- Create: `app/diary/error.tsx`
- Create: `app/lists/error.tsx`
- Create: `app/watchlist/error.tsx`
- Create: `app/friends/error.tsx`
- Create: `app/search/error.tsx`

**Step 1: Create all five files with this content**

```tsx
'use client'

import { PageError } from '@/components/ui/PageError'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <PageError reset={reset} />
}
```

**Step 2: Commit**

```bash
git add app/diary/error.tsx app/lists/error.tsx app/watchlist/error.tsx app/friends/error.tsx app/search/error.tsx
git commit -m "add error boundaries for diary, lists, watchlist, friends, search"
```

---

## Task 4: Add `error.tsx` for `user/[username]` (covers all sub-routes)

A single `error.tsx` in `app/user/[username]/` is inherited by all sub-pages.

**Files:**
- Create: `app/user/[username]/error.tsx`

**Step 1: Create the file**

```tsx
'use client'

import { PageError } from '@/components/ui/PageError'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <PageError reset={reset} />
}
```

**Step 2: Commit**

```bash
git add "app/user/[username]/error.tsx"
git commit -m "add error boundary for user profile and sub-pages"
```

---

## Task 5: Add `loading.tsx` for `review/[id]`

**Files:**
- Create: `app/review/[id]/loading.tsx`

**Step 1: Create the file**

```tsx
export default function ReviewLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Back + movie header */}
      <div className="flex gap-6">
        <div className="skeleton w-28 h-40 rounded shrink-0" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="skeleton h-6 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/4 rounded" />
          <div className="skeleton h-5 w-32 rounded" />
          <div className="flex items-center gap-2 mt-4">
            <div className="skeleton h-8 w-8 rounded-full shrink-0" />
            <div className="skeleton h-4 w-32 rounded" />
          </div>
        </div>
      </div>
      {/* Review body */}
      <div className="space-y-2">
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
      </div>
      {/* Actions */}
      <div className="flex gap-3">
        <div className="skeleton h-8 w-20 rounded-lg" />
        <div className="skeleton h-8 w-20 rounded-lg" />
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add "app/review/[id]/loading.tsx"
git commit -m "add loading skeleton for review detail page"
```

---

## Task 6: Add `loading.tsx` for `user/[username]` (main profile)

**Files:**
- Create: `app/user/[username]/loading.tsx`

**Step 1: Create the file**

```tsx
export default function UserProfileLoading() {
  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="skeleton h-32 w-full" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="skeleton h-20 w-20 rounded-full border-4 border-background" />
            <div className="skeleton h-9 w-24 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="skeleton h-5 w-40 rounded" />
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-4 w-64 rounded" />
          </div>
          <div className="flex gap-6 mt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1">
                <div className="skeleton h-5 w-10 rounded" />
                <div className="skeleton h-3 w-14 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Tab bar */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-8 w-20 rounded-full" />
        ))}
      </div>
      {/* Content rows */}
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 p-4 rounded-xl border bg-card">
          <div className="skeleton h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-2/5 rounded" />
            <div className="skeleton h-3 w-3/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add "app/user/[username]/loading.tsx"
git commit -m "add loading skeleton for user profile page"
```

---

## Task 7: Add `loading.tsx` for user sub-pages (diary, reviews, lists)

**Files:**
- Create: `app/user/[username]/diary/loading.tsx`
- Create: `app/user/[username]/reviews/loading.tsx`
- Create: `app/user/[username]/lists/loading.tsx`

**Step 1: Create diary loading** (same structure as `app/diary/loading.tsx`)

`app/user/[username]/diary/loading.tsx`:
```tsx
export default function UserDiaryLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <div className="skeleton h-5 w-24 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
      {[6, 4, 5].map((count, gi) => (
        <div key={gi} className="space-y-3">
          <div className="skeleton h-4 w-28 rounded" />
          <div className="space-y-1">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="w-16 space-y-1 text-right">
                  <div className="skeleton h-3 w-10 rounded ml-auto" />
                  <div className="skeleton h-6 w-6 rounded ml-auto" />
                </div>
                <div className="skeleton w-10 h-16 rounded" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
                <div className="skeleton h-4 w-16 rounded shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Create reviews loading**

`app/user/[username]/reviews/loading.tsx`:
```tsx
export default function UserReviewsLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <div className="skeleton h-5 w-20 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex gap-3">
              <div className="skeleton h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-4 w-2/5 rounded" />
                <div className="skeleton h-3 w-1/4 rounded" />
              </div>
              <div className="skeleton h-12 w-8 rounded shrink-0" />
            </div>
            <div className="space-y-1.5">
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-4/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 3: Create lists loading**

`app/user/[username]/lists/loading.tsx`:
```tsx
export default function UserListsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <div className="skeleton h-5 w-16 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="skeleton h-5 w-3/4 rounded" />
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="skeleton h-16 flex-1 rounded" />
              ))}
            </div>
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add "app/user/[username]/diary/loading.tsx" "app/user/[username]/reviews/loading.tsx" "app/user/[username]/lists/loading.tsx"
git commit -m "add loading skeletons for user diary, reviews, lists sub-pages"
```

---

## Task 8: Add `loading.tsx` for followers, following, stats, year

**Files:**
- Create: `app/user/[username]/followers/loading.tsx`
- Create: `app/user/[username]/following/loading.tsx`
- Create: `app/user/[username]/stats/loading.tsx`
- Create: `app/user/[username]/year/[year]/loading.tsx`

**Step 1: Create followers loading**

`app/user/[username]/followers/loading.tsx`:
```tsx
export default function FollowersLoading() {
  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <div className="skeleton h-5 w-24 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
      <div className="space-y-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-3">
              <div className="skeleton h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <div className="skeleton h-4 w-28 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            </div>
            <div className="skeleton h-8 w-20 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Create following loading** (identical structure)

`app/user/[username]/following/loading.tsx`:
```tsx
export default function FollowingLoading() {
  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <div className="skeleton h-5 w-24 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
      <div className="space-y-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-3">
              <div className="skeleton h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <div className="skeleton h-4 w-28 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            </div>
            <div className="skeleton h-8 w-20 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 3: Create stats loading**

`app/user/[username]/stats/loading.tsx`:
```tsx
export default function StatsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <div className="skeleton h-5 w-16 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
            <div className="skeleton h-8 w-12 rounded" />
            <div className="skeleton h-3 w-16 rounded" />
          </div>
        ))}
      </div>
      <div className="skeleton h-48 w-full rounded-xl" />
      <div className="skeleton h-48 w-full rounded-xl" />
    </div>
  )
}
```

**Step 4: Create year loading**

`app/user/[username]/year/[year]/loading.tsx`:
```tsx
export default function YearLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <div className="skeleton h-5 w-28 rounded" />
          <div className="skeleton h-3 w-32 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[2/3] w-full rounded" />
        ))}
      </div>
    </div>
  )
}
```

**Step 5: Commit**

```bash
git add "app/user/[username]/followers/loading.tsx" "app/user/[username]/following/loading.tsx" "app/user/[username]/stats/loading.tsx" "app/user/[username]/year/[year]/loading.tsx"
git commit -m "add loading skeletons for followers, following, stats, year sub-pages"
```

---

## Task 9: Upgrade followers + following empty states

Current: plain `<p>` text. Replace with a styled card consistent with the rest of the app.

**Files:**
- Modify: `app/user/[username]/followers/page.tsx`
- Modify: `app/user/[username]/following/page.tsx`

**Step 1: In `followers/page.tsx`, replace the empty state**

Find:
```tsx
{follows.length === 0 ? (
  <p className="text-center text-muted-foreground py-12 text-sm">No followers yet.</p>
) : (
```

Replace with:
```tsx
{follows.length === 0 ? (
  <div className="rounded-xl border border-dashed bg-card p-12 text-center space-y-3">
    <Users className="h-10 w-10 mx-auto text-muted-foreground/40" />
    <p className="font-medium">No followers yet</p>
  </div>
) : (
```

Also add `Users` to the import from `lucide-react` at the top:
```tsx
import { ArrowLeft, Users } from 'lucide-react'
```

**Step 2: In `following/page.tsx`, make the same change**

Find:
```tsx
{follows.length === 0 ? (
  <p className="text-center text-muted-foreground py-12 text-sm">Not following anyone yet.</p>
) : (
```

Replace with:
```tsx
{follows.length === 0 ? (
  <div className="rounded-xl border border-dashed bg-card p-12 text-center space-y-3">
    <Users className="h-10 w-10 mx-auto text-muted-foreground/40" />
    <p className="font-medium">Not following anyone yet</p>
  </div>
) : (
```

Add `Users` to the `lucide-react` import.

**Step 3: Commit**

```bash
git add "app/user/[username]/followers/page.tsx" "app/user/[username]/following/page.tsx"
git commit -m "upgrade followers/following empty states to styled card"
```

---

## Task 10: Replace friends page loading spinner with skeleton

**File:**
- Modify: `app/friends/page.tsx`

**Step 1: Replace the `loadingFollowing` spinner**

Find this block (around line 244):
```tsx
{loadingFollowing ? (
  <div className="flex justify-center py-8">
    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  </div>
) : following.length === 0 ? (
```

Replace with:
```tsx
{loadingFollowing ? (
  <div className="space-y-1">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="flex items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-3">
          <div className="skeleton h-10 w-10 rounded-full shrink-0" />
          <div className="space-y-1.5">
            <div className="skeleton h-4 w-28 rounded" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
        </div>
        <div className="skeleton h-8 w-20 rounded-lg shrink-0" />
      </div>
    ))}
  </div>
) : following.length === 0 ? (
```

**Step 2: Also replace the session-loading spinner** (around line 167)

Find:
```tsx
if (status === 'loading') {
  return (
    <div className="flex justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}
```

Replace with:
```tsx
if (status === 'loading') {
  return (
    <div className="max-w-lg space-y-8">
      <div className="space-y-1.5">
        <div className="skeleton h-7 w-24 rounded" />
        <div className="skeleton h-4 w-48 rounded" />
      </div>
      <div className="skeleton h-11 w-full rounded-lg" />
      <div className="space-y-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-3">
              <div className="skeleton h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <div className="skeleton h-4 w-28 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            </div>
            <div className="skeleton h-8 w-20 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 3: Remove `Loader2` from the import** (it's no longer used — the small search-input corner spinner uses it but that's in this same file... check first before removing)

Actually `Loader2` IS still used on line 208 for the search input corner spinner. Keep the import.

**Step 4: Commit**

```bash
git add app/friends/page.tsx
git commit -m "replace friends page loading spinners with skeleton rows"
```

---

## Task 11: Replace search page loading with per-tab skeletons

**File:**
- Modify: `app/search/page.tsx`

**Step 1: Replace the Suspense fallback**

Find:
```tsx
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-muted-foreground"><Loader2 className="h-6 w-6 mx-auto animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  )
}
```

Replace with:
```tsx
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="skeleton h-7 w-20 rounded" />
            <div className="skeleton h-11 w-full rounded-lg" />
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-8 w-24 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
```

**Step 2: Add per-tab loading skeletons inside `SearchContent`**

The current results area logic (starting around line 107) is:
```tsx
{!debouncedQuery.trim() ? (
  // prompt
) : tab === 'films' ? (
  films.length > 0 ? (grid) : (<p>No films found</p>)
) : tab === 'cast' ? (
  cast.length > 0 ? (grid) : (<p>No cast found</p>)
) : (
  members.length > 0 ? (list) : (<p>No members found</p>)
)}
```

Replace the entire results block with this (inserting a `loading` check before the empty/results split):

```tsx
{!debouncedQuery.trim() ? (
  <div className="text-center py-12 text-muted-foreground">
    <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
    <p>Start typing to search</p>
  </div>
) : loading ? (
  tab === 'films' ? (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="skeleton aspect-[2/3] w-full rounded" />
          <div className="skeleton h-3 w-4/5 rounded" />
        </div>
      ))}
    </div>
  ) : tab === 'cast' ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2 p-3">
          <div className="skeleton h-20 w-20 rounded-full" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
      ))}
    </div>
  ) : (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div className="skeleton h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-3 w-24 rounded" />
          </div>
          <div className="skeleton h-8 w-20 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  )
) : tab === 'films' ? (
  films.length > 0 ? (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
      {films.map((movie) => (
        <MovieCard
          key={movie.id}
          tmdbId={movie.id}
          title={movie.title}
          poster={movie.poster_path}
          releaseDate={movie.release_date}
          size="sm"
        />
      ))}
    </div>
  ) : (
    <p className="text-center text-muted-foreground py-8">No films found for &quot;{debouncedQuery}&quot;</p>
  )
) : tab === 'cast' ? (
  cast.length > 0 ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {cast.map((person: any) => (
        <Link
          key={person.id}
          href={`/person/${person.id}`}
          className="group flex flex-col items-center gap-2 rounded-xl p-3 hover:bg-accent transition-colors"
        >
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted shrink-0">
            {person.profile_path ? (
              <Image
                src={TMDB_IMAGE.profile(person.profile_path, 'w185')!}
                alt={person.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/40 text-2xl font-bold">
                {person.name[0]}
              </div>
            )}
          </div>
          <div className="text-center min-w-0 w-full">
            <p className="text-sm font-medium truncate group-hover:text-foreground">{person.name}</p>
            {person.known_for_department && (
              <p className="text-xs text-muted-foreground">{person.known_for_department}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  ) : (
    <p className="text-center text-muted-foreground py-8">No cast or crew found for &quot;{debouncedQuery}&quot;</p>
  )
) : (
  members.length > 0 ? (
    <div className="space-y-2">
      {members.map((user: any) => (
        <div key={user.id} className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <Link href={`/user/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={user.avatar ?? undefined} />
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{user.displayName}</p>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </Link>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:block text-xs text-muted-foreground">
              {user._count.followers} followers
            </span>
            {session?.user && session.user.id !== user.id && (
              <Button
                variant={user.isFollowing ? 'outline' : 'cinema'}
                size="sm"
                onClick={() => toggleFollow(user.username, user.id)}
              >
                {user.isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-center text-muted-foreground py-8">No members found for &quot;{debouncedQuery}&quot;</p>
  )
)}
```

**Step 3: Commit**

```bash
git add app/search/page.tsx
git commit -m "replace search loading spinner with per-tab skeleton states"
```

---

## Task 12: Final push

```bash
git push
```

---

## Verification checklist

After all tasks are done:

1. Visit `/diary` as a new user (no entries) → styled empty state with CTA
2. Visit `/friends` → skeleton rows while loading, not a spinner
3. Visit `/search`, type something → per-tab skeleton, not a spinner
4. Visit any `/user/[username]` → profile skeleton while loading
5. Temporarily set `DATABASE_URL` to a bad value → per-route error boundaries catch it with "Try again" button
6. Throttle network to Slow 3G in Chrome DevTools → shimmer skeletons visible on all routes
