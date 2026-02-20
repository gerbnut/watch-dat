# Watch Dat 🎬

A full-stack social media app for film lovers — your digital film diary + cinephile social network.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5 (credentials)
- **Movie Data**: TMDB API

## Quick Start

### 1. Clone & install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — Generate with: `openssl rand -base64 32`
- `TMDB_API_KEY` — Get free key at [themoviedb.org](https://www.themoviedb.org/settings/api)
- `TMDB_ACCESS_TOKEN` — Your TMDB read access token

### 3. Database setup

```bash
npm run db:push       # Create tables
npm run db:seed       # Add demo data (optional)
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

### P0 — MVP (Done)
- ✅ Auth — sign up, log in, JWT sessions
- ✅ Movie Search & Detail Pages — TMDB integration with local caching
- ✅ Log & Rate — half-star increments (1–10 scale), watched date, rewatch flag
- ✅ Film Diary — chronological log with grouping by month
- ✅ Reviews — rich text (Markdown), spoiler tags, like/comment
- ✅ Custom Lists — create, add films, set public/private
- ✅ Follow System — asymmetric follows + activity feed
- ✅ Watchlist — dedicated want-to-watch list

### P1 — Social & Discovery (Done)
- ✅ Trending/Popular — from TMDB
- ✅ Like reviews
- ✅ User profiles with stats
- ✅ Notifications

### P2 — Polish (Done)
- ✅ Dark theme
- ✅ Search — films and users
- ✅ Responsive/mobile layout

## Database Schema

Key models: `User`, `Movie`, `Review`, `DiaryEntry`, `Follow`, `Like`, `Comment`, `List`, `ListItem`, `WatchlistItem`, `Activity`, `Notification`

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register user |
| GET | `/api/movies/search?q=` | Search TMDB |
| GET | `/api/movies/[id]` | Movie detail + stats |
| POST | `/api/reviews` | Log/rate a film |
| POST | `/api/reviews/[id]/like` | Toggle like |
| GET | `/api/feed` | Home activity feed |
| POST | `/api/users/[username]/follow` | Toggle follow |
| POST | `/api/watchlist` | Toggle watchlist |
| GET/POST | `/api/lists` | Lists |
| POST | `/api/lists/[id]/items` | Add to list |
| GET | `/api/notifications` | Notifications |
| GET | `/api/stats` | User stats |
