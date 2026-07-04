"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Search, X, ChevronLeft, Sparkles, TrendingUp, BookOpen } from "lucide-react";
import { CATEGORIES, GENRES } from "@/lib/constants";
import { fetchBooksByCategories, fetchSuggestions, coverUrl, workId } from "@/lib/openlibrary";

const BATCH_SIZE = 3;

// Genre emoji map for visual flair
const GENRE_ICONS = {
  fantasy: "🧙‍♂️",
  science_fiction: "🚀",
  mystery: "🔍",
  historical_fiction: "🏰",
  romance: "💕",
  horror: "👻",
  adventure: "⚔️",
  literary_fiction: "📖",
  young_adult: "✨",
  dystopian: "🌆",
  biography: "👤",
  self_help: "🌱",
  history: "🗺️",
  politics: "🏛️",
  science: "🔬",
  psychology: "🧠",
  philosophy: "💭",
  business: "💼",
  poetry: "🌸",
  graphic_novels: "🎨",
  art: "🎭",
  cooking: "🍳",
  travel: "✈️",
  health: "💪",
  true_crime: "🔦",
  religion: "☀️",
  technology: "💻",
  humor: "😄",
};

const GENRE_COLORS = [
  "from-purple-500/20 to-indigo-500/20 border-purple-400/30",
  "from-blue-500/20 to-cyan-500/20 border-blue-400/30",
  "from-emerald-500/20 to-teal-500/20 border-emerald-400/30",
  "from-amber-500/20 to-orange-500/20 border-amber-400/30",
  "from-rose-500/20 to-pink-500/20 border-rose-400/30",
  "from-violet-500/20 to-purple-500/20 border-violet-400/30",
  "from-cyan-500/20 to-blue-500/20 border-cyan-400/30",
  "from-green-500/20 to-emerald-500/20 border-green-400/30",
];

// ── Framer variants ────────────────────────────────────────────────────────────

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
};

const searchBarVariants = {
  inactive: { scale: 1 },
  active: { scale: 1.01, transition: { type: "spring", stiffness: 400, damping: 25 } },
};

const suggestionVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15 } },
};

const genreCardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 16 },
  show: (i) => ({
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] },
  }),
};

const sectionVariants = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const bookCardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function BookCard({ book, index }) {
  const id = workId(book.key);
  const cover = coverUrl(book.cover_id ?? book.cover_i, "M");
  const author =
    book.authors?.[0]?.name ||
    book.author_name?.[0] ||
    book.author ||
    "Unknown";

  return (
    <motion.div
      custom={index}
      variants={bookCardVariants}
      initial="hidden"
      animate="show"
      whileTap={{ scale: 0.96 }}
    >
      <Link
        href={`/books/${id}`}
        className="group flex flex-col h-full rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-md active:shadow-lg transition-shadow"
      >
        <div className="relative w-full aspect-[2/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
          {cover ? (
            <img
              src={cover}
              alt={`Cover of ${book.title}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-active:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <BookOpen className="w-8 h-8 text-gray-400" />
              <span className="text-xs text-gray-400 text-center px-2">No Cover</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-active:opacity-100 transition-opacity" />
        </div>
        <div className="p-2.5 flex flex-col gap-0.5 flex-1">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            {book.title}
          </h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
            {author}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-md animate-pulse">
      <div className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700" />
      <div className="p-2.5 space-y-1.5">
        <div className="h-2.5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-2 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

function SectionSkeleton({ label }) {
  return (
    <motion.div variants={sectionVariants} initial="hidden" animate="show" className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SmallSearchedBooks() {
  const [query, setQuery] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [booksCollection, setBooksCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [view, setView] = useState("discover"); // "discover" | "genres"

  const loadRef = useRef(null);
  const inputRef = useRef(null);
  const searchRef = useRef(null);
  const router = useRouter();

  // ── Suggestions ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const results = await fetchSuggestions(query, 6, controller.signal);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (err) {
        if (err.name !== "AbortError") setSuggestions([]);
      }
    }, 280);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  // ── Click outside to close suggestions ──────────────────────────────────────
  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // ── Load book categories ─────────────────────────────────────────────────────
  const loadBooks = useCallback(async () => {
    if (currentIndex >= CATEGORIES.length || isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      const batch = CATEGORIES.slice(currentIndex, currentIndex + BATCH_SIZE);
      const result = await fetchBooksByCategories(batch, 30);
      setBooksCollection((prev) => [...prev, ...result]);
      setCurrentIndex((prev) => prev + BATCH_SIZE);
    } catch {
      setFetchError("Failed to load books. Please try again.");
    } finally {
      setIsFetchingMore(false);
      setLoading(false);
    }
  }, [currentIndex, isFetchingMore]);

  useEffect(() => {
    loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Infinite scroll observer ─────────────────────────────────────────────────
  useEffect(() => {
    const el = loadRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingMore) loadBooks();
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadRef.current, isFetchingMore, loadBooks]);

  // ── Navigation helpers ───────────────────────────────────────────────────────
  const goToSearch = (term) => {
    const q = (term ?? query).trim();
    if (!q) return;
    setShowSuggestions(false);
    setQuery("");
    router.push(`/searchedBooks?q=${encodeURIComponent(q)}`);
  };

  const goToGenre = (slug) => {
    router.push(`/genre?name=${encodeURIComponent(slug)}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) goToSearch();
    if (e.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const clearQuery = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
    >
      {/* ── Sticky Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-green-400 dark:bg-gray-900 border-b-2 border-black dark:border-gray-700">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Back button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-black/10 dark:bg-white/10 active:bg-black/20"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-black dark:text-white" />
          </motion.button>

          {/* Search bar */}
          <motion.div
            ref={searchRef}
            variants={searchBarVariants}
            animate={inputFocused ? "active" : "inactive"}
            className="relative flex-1"
          >
            <div
              className={`flex items-center gap-2 h-10 rounded-xl px-3 border-2 transition-colors duration-200 ${
                inputFocused
                  ? "bg-white border-black dark:bg-gray-800 dark:border-green-400"
                  : "bg-white/80 border-transparent dark:bg-gray-800/80"
              }`}
            >
              <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  setInputFocused(true);
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => setInputFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Search books, authors…"
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none font-lato"
                autoComplete="off"
              />
              <AnimatePresence>
                {query.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                    onClick={clearQuery}
                    className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600 active:bg-gray-400"
                    aria-label="Clear search"
                  >
                    <X className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Suggestions dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.ul
                  variants={suggestionVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl"
                >
                  {suggestions.map((title, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <button
                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-800 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-gray-700 active:bg-green-100 dark:active:bg-gray-600 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                        onMouseDown={() => goToSearch(title)}
                      >
                        <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-1 font-lato">{title}</span>
                      </button>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── Tab strip ────────────────────────────────────────────────────────── */}
        <div className="flex px-4 pb-0 gap-1">
          {[
            { id: "discover", label: "Discover", icon: Sparkles },
            { id: "genres", label: "Browse Genres", icon: TrendingUp },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-semibold font-winky transition-colors relative ${
                view === id
                  ? "bg-gray-50 dark:bg-gray-950 text-black dark:text-white"
                  : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {view === id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white rounded-t"
                />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <main className="px-4 py-5 space-y-8 pb-24">
        {fetchError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-800"
          >
            {fetchError}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* ── Genres view ──────────────────────────────────────────────────── */}
          {view === "genres" && (
            <motion.div
              key="genres"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-4">
                <h1 className="text-xl font-extrabold font-winky text-gray-900 dark:text-white">
                  Browse by Genre
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Find your next favourite read
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {GENRES.map((genre, i) => {
                  const colorClass = GENRE_COLORS[i % GENRE_COLORS.length];
                  const emoji = GENRE_ICONS[genre.slug] || "📚";
                  return (
                    <motion.button
                      key={genre.slug}
                      custom={i}
                      variants={genreCardVariants}
                      initial="hidden"
                      animate="show"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => goToGenre(genre.slug)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border bg-gradient-to-br ${colorClass} text-left transition-colors active:brightness-95`}
                    >
                      <span className="text-2xl leading-none">{emoji}</span>
                      <span className="font-semibold font-winky text-sm text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
                        {genre.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── Discover view ─────────────────────────────────────────────────── */}
          {view === "discover" && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8"
            >
              {/* Initial loading skeletons */}
              {loading && booksCollection.length === 0 &&
                Array.from({ length: BATCH_SIZE }).map((_, idx) => (
                  <SectionSkeleton key={idx} />
                ))}

              {/* Loaded categories */}
              {booksCollection.map(({ category, books }, idx) => (
                <motion.section
                  key={`${category}-${idx}`}
                  variants={sectionVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-extrabold font-winky text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-lg">{GENRE_ICONS[
                        CATEGORIES.find(c => c.label === category)?.key
                      ] || "📚"}</span>
                      {category}
                    </h2>
                    <button
                      onClick={() =>
                        goToGenre(
                          CATEGORIES.find((c) => c.label === category)?.key ||
                            category.toLowerCase().replace(/\s+/g, "_")
                        )
                      }
                      className="text-xs font-semibold text-green-600 dark:text-green-400 active:opacity-70"
                    >
                      See all →
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {books.slice(0, 9).map((book, i) => (
                      <BookCard key={`${book.key}-${i}`} book={book} index={i} />
                    ))}
                  </div>
                </motion.section>
              ))}

              {/* Load more trigger + skeleton row */}
              <div ref={loadRef} className="h-4" />
              {isFetchingMore && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* End of content */}
              {!isFetchingMore && currentIndex >= CATEGORIES.length && booksCollection.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="text-3xl mb-2">📚</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-lato">
                    You&apos;ve seen it all!
                  </p>
                  <button
                    onClick={() => setView("genres")}
                    className="mt-3 text-sm font-semibold text-green-600 dark:text-green-400"
                  >
                    Browse by genre →
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
