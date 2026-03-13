# Image Optimization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize all image loading for speed and resilience — correct TMDB sizes, shared `MoviePoster` component with null fallbacks, blur placeholder on the film hero, and priority loading for above-the-fold images.

**Architecture:** A new `MoviePoster` component (`components/movies/MoviePoster.tsx`) becomes the single place for poster image rendering: it handles null fallback (dark bg + Film icon), TMDB URL construction, and lazy/priority loading. `MovieCard` gets a `priority` prop. The film detail backdrop is downsized from w1280→w780 and gets a blur placeholder. All other raw poster `<Image>` usages are replaced with `<MoviePoster>`.

**Tech Stack:** Next.js 15, React 18, TypeScript, Tailwind CSS, next/image, lucide-react. No new packages.

---

## File Structure

| File | Action | What changes |
|------|--------|--------------|
| `lib/tmdb.ts` | Modify | Add `w92`, `w154` to poster size type; change backdrop default from `w1280` → `w780` |
| `components/movies/MoviePoster.tsx` | **Create** | Shared poster image with null fallback |
| `components/movies/MovieCard.tsx` | Modify | Add `priority` prop, pass to `<Image>` |
| `app/film/[id]/page.tsx` | Modify | Backdrop `w1280`→`w780` + blur placeholder; use `MoviePoster` for poster |
| `app/page.tsx` | Modify | Priority on first 3 trending `MovieCard`s; `MoviePoster` for sidebar tiny posters |
| `components/reviews/LogFilmModal.tsx` | Modify | `MoviePoster` (w154, 44px) |
| `components/movies/MovieSearch.tsx` | Modify | `MoviePoster` (w92, 32px) |
| `components/lists/ListCard.tsx` | Modify | `MoviePoster` (w185, 100px) |
| `components/feed/ActivityFeedItem.tsx` | Modify | `MoviePoster` (w154, ~56px) |
| `app/settings/FavoritesEditorClient.tsx` | Modify | `MoviePoster` (w154, 60px) |
| `app/list/[id]/page.tsx` | Modify | `MoviePoster` (w154, 44px) |
| `app/review/[id]/page.tsx` | Modify | `MoviePoster` (w92, 32px) |
| `app/onboarding/OnboardingClient.tsx` | Modify | `MoviePoster` (w185, ~80px) |
| `app/pick-tonight/PickTonightClient.tsx` | Modify | Remove inline helper; `MoviePoster` for poster usage |
| `app/user/[username]/page.tsx` | Modify | `MoviePoster` |
| `app/diary/page.tsx` | Modify | `MoviePoster` |
| `app/user/[username]/diary/page.tsx` | Modify | `MoviePoster` |
| `app/user/[username]/year/[year]/page.tsx` | Modify | `MoviePoster` |

---

## Chunk 1: Foundation

### Task 1: lib/tmdb.ts + MoviePoster component

**Files:**
- Modify: `lib/tmdb.ts`
- Create: `components/movies/MoviePoster.tsx`

- [ ] **Step 1: Update `lib/tmdb.ts` — expand poster sizes and fix backdrop default**

Read `lib/tmdb.ts` first. Currently line 10-12:
```ts
poster: (path: string | null, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w342') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null,
backdrop: (path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280') =>
```

Replace with:
```ts
poster: (path: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w342') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null,
backdrop: (path: string | null, size: 'w780' | 'w1280' | 'original' = 'w780') =>
```

Two changes: add `'w92' | 'w154'` to the poster union; change backdrop default from `'w1280'` to `'w780'`.

- [ ] **Step 2: Create `components/movies/MoviePoster.tsx`**

**Important:** Do NOT import from `lib/tmdb.ts` — that module imports Prisma at the top level, which causes bundling problems when MoviePoster is used inside `'use client'` components. Build the URL inline instead (it's two lines).

```tsx
import Image from 'next/image'
import { Film } from 'lucide-react'
import { cn } from '@/lib/utils'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

type PosterSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500'

interface MoviePosterProps {
  /** Raw TMDB poster path, e.g. "/abc123.jpg". Null shows Film icon placeholder. */
  poster: string | null
  /** Used as alt text on the Image */
  title: string
  /** TMDB image size to fetch — match to the actual rendered size */
  tmdbSize?: PosterSize
  /** CSS sizes hint for the browser, e.g. "44px" or "(max-width: 768px) 30vw, 200px" */
  sizes?: string
  /** true = above-the-fold hero image; skips lazy loading */
  priority?: boolean
  /** Applied to the <Image> element (e.g. "object-cover object-top") */
  className?: string
}

/**
 * Renders a TMDB movie poster with fill layout.
 * Parent must be `position: relative` with explicit dimensions.
 * When poster is null, shows a dark placeholder with a Film icon.
 */
export function MoviePoster({
  poster,
  title,
  tmdbSize = 'w342',
  sizes = '100vw',
  priority = false,
  className,
}: MoviePosterProps) {
  const src = poster ? `${TMDB_IMAGE_BASE}/${tmdbSize}${poster}` : null

  if (!src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted">
        <Film className="h-1/3 w-1/3 text-muted-foreground opacity-40" />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={title}
      fill
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
    />
  )
}
```

Note: No `'use client'` — this component has no state or event handlers and works in both server and client components.

- [ ] **Step 3: Verify the build compiles**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: No TypeScript errors for these two files.

- [ ] **Step 4: Commit**

```bash
git add lib/tmdb.ts components/movies/MoviePoster.tsx
git commit -m "add MoviePoster component and expand TMDB size options"
```

---

## Chunk 2: MovieCard + film detail page

### Task 2: Add priority prop to MovieCard

**Files:**
- Modify: `components/movies/MovieCard.tsx`

Current `MovieCardProps` interface does not have a `priority` prop. The `<Image>` inside also doesn't have priority.

- [ ] **Step 1: Read `components/movies/MovieCard.tsx`**

Confirm current interface and Image usage.

- [ ] **Step 2: Add `priority` to the interface**

In the `MovieCardProps` interface, add after `onClick?`:
```ts
priority?: boolean
```

- [ ] **Step 3: Add `priority` to the destructured props**

Add `priority = false` to the destructuring in the function signature.

- [ ] **Step 4: Pass `priority` to the `<Image>` component**

Find the `<Image>` element inside the `posterUrl ?` branch and add `priority={priority}`:
```tsx
<Image
  src={posterUrl}
  alt={title}
  fill
  className={cn('object-cover transition-opacity duration-300', imgLoaded ? 'opacity-100' : 'opacity-0')}
  sizes="(max-width: 768px) 30vw, 200px"
  onLoad={() => setImgLoaded(true)}
  priority={priority}
/>
```

- [ ] **Step 5: Commit**

```bash
git add components/movies/MovieCard.tsx
git commit -m "add priority prop to MovieCard"
```

---

### Task 3: Fix film detail page

**Files:**
- Modify: `app/film/[id]/page.tsx`

Three changes: (1) backdrop URL from `w1280` → `w780`, (2) blur placeholder on the backdrop `<Image>`, (3) replace the poster `<Image>` + null-check with `<MoviePoster>`.

- [ ] **Step 1: Read `app/film/[id]/page.tsx`**

Locate:
- Line ~112: `const backdropUrl = TMDB_IMAGE.backdrop(movie.backdrop, 'w1280')`
- Line ~129: The backdrop `<Image>` element
- Lines ~147-153: The poster conditional render

- [ ] **Step 2: Add `MoviePoster` import and blur constant**

Add to the imports section:
```ts
import { MoviePoster } from '@/components/movies/MoviePoster'
```

Add this constant just above the `return (` statement of `FilmPage`:
```ts
const HERO_BLUR_URL = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#111827"/></svg>'
).toString('base64')}`
```

- [ ] **Step 3: Change backdrop URL from w1280 to w780**

```ts
// Before:
const backdropUrl = TMDB_IMAGE.backdrop(movie.backdrop, 'w1280')
// After:
const backdropUrl = TMDB_IMAGE.backdrop(movie.backdrop, 'w780')
```

- [ ] **Step 4: Add blur placeholder to the backdrop `<Image>`**

Find:
```tsx
<Image src={backdropUrl} alt={movie.title} fill className="object-cover object-top" priority sizes="100vw" />
```

Replace with:
```tsx
<Image
  src={backdropUrl}
  alt={movie.title}
  fill
  className="object-cover object-top"
  priority
  sizes="100vw"
  placeholder="blur"
  blurDataURL={HERO_BLUR_URL}
/>
```

- [ ] **Step 5: Replace the poster conditional with `<MoviePoster>`**

Find (lines ~147-153):
```tsx
{posterUrl ? (
  <Image src={posterUrl} alt={movie.title} fill className="object-cover" priority sizes="(max-width: 640px) 112px, 176px" />
) : (
  <div className="flex h-full w-full items-center justify-center bg-muted rounded-lg">
    <Eye className="h-10 w-10 text-muted-foreground/30" />
  </div>
)}
```

Replace with:
```tsx
<MoviePoster
  poster={movie.poster}
  title={movie.title}
  tmdbSize="w500"
  sizes="(max-width: 640px) 112px, 176px"
  priority
/>
```

Note: Remove `posterUrl` variable (line ~113) if it becomes unused after this change. Also remove the `Eye` import from lucide-react if it's no longer used elsewhere in the file.

- [ ] **Step 6: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 7: Commit**

```bash
git add app/film/[id]/page.tsx
git commit -m "fix film detail: backdrop w1280->w780, blur placeholder, use MoviePoster"
```

---

## Chunk 3: Home page

### Task 4: Fix home page

**Files:**
- Modify: `app/page.tsx`

Two changes: (1) add `priority={i < 3}` to the landing-page trending carousel MovieCards, (2) replace the authenticated sidebar's raw `<Image>` poster with `<MoviePoster>`.

- [ ] **Step 1: Read `app/page.tsx`**

Confirm:
- The logged-out trending carousel (lines ~103-114): `trending.map((movie: any) => <MovieCard .../>)` — no index
- The authenticated sidebar trending list (lines ~197-223): contains `<Image src={TMDB_IMAGE.poster(...)} sizes="24px" />` inside a `div className="relative h-9 w-6 shrink-0 overflow-hidden rounded"`

- [ ] **Step 2: Add `MoviePoster` import**

```ts
import { MoviePoster } from '@/components/movies/MoviePoster'
```

- [ ] **Step 3: Add priority to landing-page trending carousel**

Find the `trending.map((movie: any) => (` in the logged-out section. Add index and `priority`:

```tsx
{trending.map((movie: any, i: number) => (
  <MovieCard
    key={movie.id}
    tmdbId={movie.id}
    title={movie.title}
    poster={movie.poster_path}
    releaseDate={movie.release_date}
    rating={movie.vote_average}
    size="md"
    priority={i < 3}
    className="shrink-0 snap-start"
  />
))}
```

- [ ] **Step 4: Replace sidebar tiny poster `<Image>` with `<MoviePoster>`**

Find (in the authenticated sidebar trending list):
```tsx
<div className="relative h-9 w-6 shrink-0 overflow-hidden rounded">
  {movie.poster_path && (
    <Image
      src={TMDB_IMAGE.poster(movie.poster_path, 'w185')!}
      alt={movie.title}
      fill
      className="object-cover"
      sizes="24px"
    />
  )}
</div>
```

Replace with:
```tsx
<div className="relative h-9 w-6 shrink-0 overflow-hidden rounded">
  <MoviePoster
    poster={movie.poster_path}
    title={movie.title}
    tmdbSize="w92"
    sizes="24px"
  />
</div>
```

- [ ] **Step 5: Remove now-unused imports**

If `TMDB_IMAGE` is no longer used anywhere in `app/page.tsx` after this change, remove it from the import. If `Image` from `next/image` is no longer used, remove that too. Check carefully — the backdrop strip in the logged-out hero still uses `TMDB_IMAGE.backdrop`.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "home page: priority on first 3 trending cards, MoviePoster for sidebar"
```

---

## Chunk 4: Shared component files

### Task 5: Update LogFilmModal, MovieSearch, ListCard, ActivityFeedItem

**Files:**
- Modify: `components/reviews/LogFilmModal.tsx`
- Modify: `components/movies/MovieSearch.tsx`
- Modify: `components/lists/ListCard.tsx`
- Modify: `components/feed/ActivityFeedItem.tsx`

**Pattern for each file:** Read the file → find the `<Image src={TMDB_IMAGE.poster(...)} fill .../>` (and its null-check wrapper) → replace with `<MoviePoster>` → remove now-unused `Image` import and any now-unused `TMDB_IMAGE` usage.

- [ ] **Step 1: Update `components/reviews/LogFilmModal.tsx`**

Read the file. Find the poster image (a small thumbnail of the selected movie). Rendered at ~44px.

Add import:
```ts
import { MoviePoster } from '@/components/movies/MoviePoster'
```

Replace the poster `<Image>` (and any null check) with:
```tsx
<MoviePoster
  poster={movie.poster_path}
  title={movie.title}
  tmdbSize="w154"
  sizes="44px"
/>
```

The wrapping `div` with `relative` + explicit dimensions stays — only the image/null-check inside changes.

Remove unused `Image` import from `next/image` if it's no longer used in this file. Check if `TMDB_IMAGE.poster` is still referenced anywhere else in the file before removing that import.

- [ ] **Step 2: Update `components/movies/MovieSearch.tsx`**

Read the file. Find the search result poster (displayed at ~32px wide).

Add import:
```ts
import { MoviePoster } from '@/components/movies/MoviePoster'
```

Replace the poster image + null check with:
```tsx
<MoviePoster
  poster={movie.poster_path}
  title={movie.title}
  tmdbSize="w92"
  sizes="32px"
/>
```

Remove unused imports.

- [ ] **Step 3: Update `components/lists/ListCard.tsx`**

Read the file. Find the poster strip preview images (displayed at ~100px wide each).

Add import:
```ts
import { MoviePoster } from '@/components/movies/MoviePoster'
```

Replace each poster image + null check with:
```tsx
<MoviePoster
  poster={item.movie.poster}
  title={item.movie.title ?? ''}
  tmdbSize="w185"
  sizes="100px"
/>
```

(Check the actual prop names — `item.movie.poster` vs `item.movie.poster_path` — by reading the file.)

- [ ] **Step 4: Update `components/feed/ActivityFeedItem.tsx`**

Read the file. There are two poster usages (review card: ~52px; activity item: ~56px).

Add import:
```ts
import { MoviePoster } from '@/components/movies/MoviePoster'
```

Replace both poster images + null checks with `<MoviePoster>`. Use `tmdbSize="w154" sizes="56px"` for both (same order of magnitude).

- [ ] **Step 5: Build check**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 6: Commit**

```bash
git add components/reviews/LogFilmModal.tsx components/movies/MovieSearch.tsx components/lists/ListCard.tsx components/feed/ActivityFeedItem.tsx
git commit -m "use MoviePoster in LogFilmModal, MovieSearch, ListCard, ActivityFeedItem"
```

---

## Chunk 5: App pages (part 1)

### Task 6: FavoritesEditorClient, list/[id], review/[id]

**Files:**
- Modify: `app/settings/FavoritesEditorClient.tsx`
- Modify: `app/list/[id]/page.tsx`
- Modify: `app/review/[id]/page.tsx`

**Same pattern as Task 5.** Read each file, find the poster image + null check, replace with `<MoviePoster>`.

- [ ] **Step 1: Update `app/settings/FavoritesEditorClient.tsx`**

Read the file. Poster is displayed at ~60px (favorite film slots in settings).

```tsx
import { MoviePoster } from '@/components/movies/MoviePoster'
// ...
<MoviePoster
  poster={film.poster}
  title={film.title}
  tmdbSize="w154"
  sizes="60px"
/>
```

- [ ] **Step 2: Update `app/list/[id]/page.tsx`**

Read the file. Poster is displayed at ~44px (list item rows).

```tsx
import { MoviePoster } from '@/components/movies/MoviePoster'
// ...
<MoviePoster
  poster={item.movie.poster}
  title={item.movie.title}
  tmdbSize="w154"
  sizes="44px"
/>
```

- [ ] **Step 3: Update `app/review/[id]/page.tsx`**

Read the file. Poster is displayed at ~32px (small thumbnail in review header).

```tsx
import { MoviePoster } from '@/components/movies/MoviePoster'
// ...
<MoviePoster
  poster={review.movie.poster}
  title={review.movie.title}
  tmdbSize="w92"
  sizes="32px"
/>
```

- [ ] **Step 4: Build check**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add app/settings/FavoritesEditorClient.tsx app/list/[id]/page.tsx app/review/[id]/page.tsx
git commit -m "use MoviePoster in FavoritesEditor, list detail, review detail"
```

---

## Chunk 6: App pages (part 2)

### Task 7: Onboarding, pick-tonight, user profile, diary, year stats

**Files:**
- Modify: `app/onboarding/OnboardingClient.tsx`
- Modify: `app/pick-tonight/PickTonightClient.tsx`
- Modify: `app/user/[username]/page.tsx`
- Modify: `app/diary/page.tsx`
- Modify: `app/user/[username]/diary/page.tsx`
- Modify: `app/user/[username]/year/[year]/page.tsx`

**Same pattern.** For `pick-tonight`, there is an inline `tmdbPoster()` helper function — remove it and use `MoviePoster` instead (the helper was added to avoid importing from `lib/tmdb` which bundles Prisma, but `MoviePoster` only imports from `lib/tmdb`'s `TMDB_IMAGE` export which is safe).

- [ ] **Step 1: Update `app/onboarding/OnboardingClient.tsx`**

Read the file. Find poster image(s). Replace with `<MoviePoster>`. Use `tmdbSize="w185"` and `sizes` matching the actual rendered width (read the layout to determine — typically ~80-100px for an onboarding grid).

```tsx
import { MoviePoster } from '@/components/movies/MoviePoster'
```

- [ ] **Step 2: Update `app/pick-tonight/PickTonightClient.tsx`**

Read the file. Find:
1. The inline `tmdbPoster()` helper function (lines ~18-22) — **delete it entirely**
2. All poster `<Image>` usages that used `tmdbPoster()`

Replace poster usages with `<MoviePoster>`. Use `tmdbSize="w342"` (these are swipe cards, displayed large) and `sizes="(max-width: 640px) 100vw, 500px"` or similar based on the actual layout.

Note: Keep any backdrop `<Image>` usages as-is (those use backdrop, not poster path) — only replace poster usages.

Also note: `lib/tmdb.ts` imports Prisma at the top level. The inline `tmdbPoster()` helper was added to this file for that reason. Since `MoviePoster` does NOT import from `lib/tmdb.ts` (it inlines its own URL construction), this replacement is safe.

```tsx
import { MoviePoster } from '@/components/movies/MoviePoster'
```

- [ ] **Step 3: Update `app/user/[username]/page.tsx`**

Read the file. Find poster image(s). Replace with `<MoviePoster>`.

- [ ] **Step 4: Update `app/diary/page.tsx`**

Read the file. Find poster image(s) (diary entry rows). Replace with `<MoviePoster>`. Diary posters are typically small (~44-56px).

```tsx
<MoviePoster poster={entry.movie.poster} title={entry.movie.title} tmdbSize="w154" sizes="44px" />
```

- [ ] **Step 5: Update `app/user/[username]/diary/page.tsx`**

Same as Step 4.

- [ ] **Step 6: Update `app/user/[username]/year/[year]/page.tsx`**

Read the file. Find poster image(s). Replace with `<MoviePoster>`.

- [ ] **Step 7: Final build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: Clean build with no errors.

- [ ] **Step 8: Commit**

```bash
git add app/onboarding/OnboardingClient.tsx app/pick-tonight/PickTonightClient.tsx app/user/[username]/page.tsx app/diary/page.tsx app/user/[username]/diary/page.tsx app/user/[username]/year/[year]/page.tsx
git commit -m "use MoviePoster across onboarding, pick-tonight, user, diary, year pages"
```

---

## Final step

- [ ] **Push**

```bash
git push origin main
```

---

## Testing checklist

After implementation:

1. **Fallback test:** Open DevTools → Network → block `image.tmdb.org`. Reload any page. Every movie poster slot should show a dark placeholder with a Film icon — no broken image icons anywhere.

2. **Lighthouse:** Run on the home page (logged-out view). Images section should not flag oversized images or unoptimized formats.

3. **Film detail speed:** Compare load time on a film detail page before/after — the hero backdrop (w1280→w780) should be ~40% smaller.

4. **Inspect trending carousel:** On the landing page, open DevTools → Elements → check the first 3 `MovieCard` images have no `loading="lazy"` attribute (priority images skip lazy loading). Cards 4+ should have `loading="lazy"`.
