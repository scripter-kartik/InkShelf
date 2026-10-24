# 📚 InkShelf

> A modern reading companion — discover millions of books, build reading shelves, track favorites, and manage your reading life in one clean, fast, dark-mode-ready app.

InkShelf is a full-stack **Next.js 16 (App Router)** application built on top of the
[Google Books](https://developers.google.com/books) API, with authentication, a MongoDB
persistence layer, and a polished, responsive UI.

---

## ✨ Features

- **Discover** — infinite-scrolling shelves across 30+ curated categories.
- **Search** — debounced full-text search with live autocomplete suggestions.
- **Browse by genre** — 24 genres, deep-linkable (`/genre?name=fantasy`).
- **Book detail pages** — descriptions, subjects, covers, and first-publish year.
- **Read in the app** — Internet Archive / Google Books previews, free Project Gutenberg
  EPUBs, or upload your own EPUB.
- **AI summaries** — on-demand book summaries generated with Google Gemini.
- **Reading shelf** — save books as *Want to Read*, *Currently Reading*, or *Read*.
- **Favorites** — one-tap favoriting, with a dedicated favorites view.
- **Profile & stats** — reading counts derived from your shelf.
- **Authentication** — email/password (bcrypt-hashed) **and** Google OAuth via NextAuth.
- **Dark mode** — system-aware, persisted, zero-flash.
- **Production polish** — SEO metadata + Open Graph, `sitemap.xml`, `robots.txt`,
  error / loading / 404 boundaries, accessibility, and toasts.
- **Graceful degradation** — runs in browse-only mode with no database configured;
  persistence features return clear, actionable states instead of crashing.

## 🛠 Tech Stack

| Area | Tech |
|------|------|
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS (class-based dark mode) |
| Auth | NextAuth (Credentials + Google), JWT sessions |
| Database | MongoDB + Mongoose |
| Security | bcryptjs password hashing |
| Icons | lucide-react |
| Data | Google Books API (+ Open Library / Gutenberg for reading sources) |
| AI | Google Gemini (`@google/genai`) |
| Animation | Framer Motion, GSAP |
| Testing | Vitest + React Testing Library |
| CI | GitHub Actions (lint · test · build) |

## 🏗 Architecture

```
src/
├── app/
│   ├── layout.tsx            # Root layout, metadata, providers
│   ├── page.jsx              # Home
│   ├── loading / error / not-found
│   ├── sitemap.js · robots.js
│   ├── components/           # Navbar, Home, AuthProvider (providers)
│   ├── api/
│   │   ├── auth/[...nextauth] # NextAuth handler
│   │   ├── register          # Credential sign-up
│   │   ├── shelf             # GET/POST/DELETE shelf items
│   │   ├── ai-summary        # Gemini book summaries
│   │   ├── book-sources      # Finds Internet Archive / Gutenberg copies
│   │   └── proxy-epub        # Same-origin proxy for Gutenberg EPUBs
│   └── (Pages)/
│       ├── books · books/[id]        # Discovery + detail
│       ├── genre · searchedBooks · smallSearchedBooks
│       └── favorites · shelf · profile
├── components/               # BookCard, AuthModal, ShelfControls, MyBooks,
│                             # ThemeProvider, ThemeToggle, ToastProvider
├── lib/                      # openlibrary, constants, mongodb, auth
└── models/                   # User, ShelfItem (Mongoose)
```

Key design decisions:
- **One `ShelfItem` collection** backs both favorites (`favorite: true`) and the reading
  shelf (`status`), with a unique `(userId, bookKey)` index and denormalized book metadata
  so lists render without extra Books API round-trips.
- **`isDbConfigured()` guard** lets every DB-backed route return `503` cleanly when no
  `MONGODB_URI` is set — the app is always runnable.
- **Centralized books client** (`src/lib/openlibrary.js` — name kept from the original
  OpenLibrary version; it now talks to Google Books) is the single network layer, with
  mock fallbacks when the API is rate-limited.

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env      # then fill in the values

# 3. Run the dev server
npm run dev               # http://localhost:3000
```

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGODB_URI` | optional* | Enables accounts, favorites, shelves |
| `NEXTAUTH_SECRET` | yes | Session encryption (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | yes | App base URL |
| `GOOGLE_ID` / `GOOGLE_SECRET` | optional | Google OAuth login |
| `GEMINI_API_KEY` | optional | AI book summaries |
| `NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY` | optional | Higher Google Books rate limit |

\* Without `MONGODB_URI` the app runs in browse-only mode.

## 🧪 Testing & Quality

```bash
npm test        # run unit tests (Vitest)
npm run lint    # ESLint
npm run build   # production build
```

CI runs lint → test → build on every push and pull request (`.github/workflows/ci.yml`).

## ☁️ Deployment

Deploy to [Vercel](https://vercel.com/new): import the repo, add the environment variables
above, and ship. Set `NEXTAUTH_URL` to your production domain.

## 📄 License

MIT — built by Kartik Agarwal. Book data courtesy of Google Books, Open Library and Project Gutenberg.
