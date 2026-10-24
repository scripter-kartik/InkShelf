"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Search, X, BookOpen, SlidersHorizontal } from "lucide-react";
import Navbar from "../../components/Navbar";
import BookCard from "@/components/BookCard";
import { searchBooks, fetchSuggestions } from "@/lib/openlibrary";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: Math.min(i * 0.04, 0.6), ease: [0.22, 1, 0.36, 1] },
  }),
};

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "title", label: "Title A–Z" },
  { value: "author", label: "Author" },
];

function sortBooks(books, sort) {
  if (sort === "title") {
    return [...books].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  }
  if (sort === "author") {
    const getAuthor = (b) =>
      b.authors?.[0]?.name || b.author_name?.[0] || b.author || "";
    return [...books].sort((a, b) => getAuthor(a).localeCompare(getAuthor(b)));
  }
  return books;
}

export default function SearchedBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sort, setSort] = useState("relevance");
  const [showSort, setShowSort] = useState(false);
  const [page, setPage] = useState(0);
  const [source, setSource] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("q") || "";
  const router = useRouter();
  const inputRef = useRef(null);
  const searchRef = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    if (!searchTerm) return;
    setQuery(searchTerm);
    let cancelled = false;
    const fetchBooks = async () => {
      setLoading(true);
      setBooks([]);
      setPage(0);
      setHasMore(false);
      try {
        const result = await searchBooks(searchTerm);
        if (cancelled) return;
        setBooks(result.books);
        setSource(result.source);
        setHasMore(result.hasMore);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBooks();
    return () => { cancelled = true; };
  }, [searchTerm]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const result = await searchBooks(searchTerm, { page: next, source });
      setBooks((prev) => {
        const seen = new Set(prev.map((b) => b.key));
        return [...prev, ...result.books.filter((b) => !seen.has(b.key))];
      });
      setPage(next);
      setHasMore(result.hasMore && result.books.length > 0);
    } catch (err) {
      console.error(err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const results = await fetchSuggestions(query, 5, controller.signal);
        setSuggestions(results);
        if (results.length > 0) setShowSuggestions(true);
      } catch { }
    }, 300);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSuggestions(false);
      if (sortRef.current && !sortRef.current.contains(e.target))
        setShowSort(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const goToSearch = (term) => {
    const q = (term ?? query).trim();
    if (!q) return;
    setShowSuggestions(false);
    router.push(`/searchedBooks?q=${encodeURIComponent(q)}`);
  };

  const clearQuery = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const sortedBooks = sortBooks(books, sort);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 overflow-x-clip">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <header className="lg:hidden sticky top-0 z-40 bg-green-400 dark:bg-gray-900 border-b-2 border-black dark:border-gray-700">
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-black/10 dark:bg-white/10 active:bg-black/20"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-black dark:text-white" />
          </motion.button>

          <div ref={searchRef} className="relative flex-1">
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) goToSearch();
                  if (e.key === "Escape") {
                    setShowSuggestions(false);
                    inputRef.current?.blur();
                  }
                }}
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
                    className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600"
                    aria-label="Clear"
                  >
                    <X className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl"
                >
                  {suggestions.map((title, idx) => (
                    <li key={idx}>
                      <button
                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-800 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-gray-700 active:bg-green-100 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                        onMouseDown={() => goToSearch(title)}
                      >
                        <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-1 font-lato">{title}</span>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-4 md:py-6">
        <div className="flex items-center justify-between mb-4 md:mb-6 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <h1 className="text-lg md:text-3xl font-extrabold font-winky text-gray-900 dark:text-white leading-tight">
              Results for{" "}
              <span className="text-green-600 dark:text-green-400">
                &ldquo;{searchTerm}&rdquo;
              </span>
            </h1>
            {!loading && books.length > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-lato"
              >
                {books.length}{hasMore ? "+" : ""} book{books.length !== 1 ? "s" : ""} found
              </motion.p>
            )}
          </motion.div>

          {!loading && books.length > 0 && (
            <div ref={sortRef} className="relative flex-shrink-0">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => setShowSort((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 active:bg-gray-50"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Sort
              </motion.button>
              <AnimatePresence>
                {showSort && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-[calc(100%+6px)] z-50 w-36 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSort(opt.value);
                          setShowSort(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm border-b border-gray-100 dark:border-gray-700/50 last:border-0 transition-colors ${
                          sort === opt.value
                            ? "text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-md animate-pulse"
              >
                <div className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700" />
                <div className="p-2.5 space-y-1.5">
                  <div className="h-2.5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-2 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && books.length === 0 && searchTerm && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold font-winky text-gray-900 dark:text-white">
                No books found
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-lato">
                Try a different search term or browse genres
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl bg-green-500 text-white font-semibold font-winky text-sm active:bg-green-600"
            >
              ← Go back
            </button>
          </motion.div>
        )}

        {!loading && sortedBooks.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {sortedBooks.map((book, i) => (
              <motion.div
                key={book.key}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="show"
              >
                <BookCard book={book} />
              </motion.div>
            ))}
          </div>
        )}

        {!loading && hasMore && (
          <div className="flex justify-center mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={loadMore}
              disabled={loadingMore}
              className="px-10 py-3 bg-black text-white dark:bg-white dark:text-black font-semibold rounded-full hover:opacity-90 transition shadow-lg disabled:opacity-60"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
