"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Search, Sparkles, X, RefreshCw } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import BookCard from "@/components/BookCard";
import { fetchFreeBooks } from "@/lib/openlibrary";
import { FREE_TOPICS } from "@/lib/freeTopics";

const TOPICS = FREE_TOPICS;

export default function FreeLibrary() {
  const params = useSearchParams();
  const router = useRouter();
  const topic = params.get("topic") || "";
  const search = params.get("q") || "";

  const [query, setQuery] = useState(search);
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const requestRef = useRef(0);

  useEffect(() => {
    setQuery(search);
  }, [search]);

  useEffect(() => {
    const id = ++requestRef.current;
    setLoading(true);
    setError(false);
    setBooks([]);
    setPage(0);
    fetchFreeBooks({ topic, search, page: 0 })
      .then((data) => {
        if (id !== requestRef.current) return;
        setBooks(data.books || []);
        setHasMore(Boolean(data.hasMore));
        setTotal(data.total || 0);
      })
      .catch(() => {
        if (id === requestRef.current) setError(true);
      })
      .finally(() => {
        if (id === requestRef.current) setLoading(false);
      });
  }, [topic, search, attempt]);

  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, [loading]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    try {
      const data = await fetchFreeBooks({ topic, search, page: next });
      setBooks((prev) => {
        const seen = new Set(prev.map((b) => b.key));
        return [...prev, ...(data.books || []).filter((b) => !seen.has(b.key))];
      });
      setPage(next);
      setHasMore(Boolean(data.hasMore));
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, topic, search]);

  const go = (next) => {
    const qs = new URLSearchParams();
    if (next.topic) qs.set("topic", next.topic);
    if (next.q) qs.set("q", next.q);
    router.push(`/free${qs.toString() ? `?${qs}` : ""}`);
  };

  const heading = search
    ? `Free books matching “${search}”`
    : TOPICS.find((t) => t.value === topic)?.label || "Free classics";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-ink-950">
      <Navbar />

      <section className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-br from-green-400 to-emerald-500 dark:border-ink-800 dark:from-ink-900 dark:to-ink-950">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl dark:bg-green-500/10" />
        <div className="relative mx-auto max-w-[1600px] px-4 py-10 md:px-6 md:py-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-1 text-xs font-semibold text-black dark:bg-green-500/15 dark:text-green-300">
            <Sparkles className="h-3.5 w-3.5" /> Free forever · No sign-up needed
          </span>
          <h1 className="mt-3 font-winky text-3xl font-extrabold text-black dark:text-white md:text-5xl">
            The Free Library
          </h1>
          <p className="mt-2 max-w-2xl font-lato text-black/75 dark:text-ink-300 md:text-lg">
            75,000+ classics you can read in full, right here — with page numbers, bookmarks, highlights and notes.
            Every book on this page opens instantly.
          </p>

          <form
            className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl border-2 border-black/80 bg-white px-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:border-ink-700 dark:bg-ink-900 dark:shadow-none"
            onSubmit={(e) => {
              e.preventDefault();
              go({ topic: "", q: query.trim() });
            }}
          >
            <Search className="h-5 w-5 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search free books by title or author…"
              className="h-12 flex-1 bg-transparent font-lato text-sm outline-none dark:text-white"
              aria-label="Search the free library"
            />
            {search && (
              <button type="button" onClick={() => go({ topic: "", q: "" })} aria-label="Clear search" className="rounded-full p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
            <button type="submit" className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white dark:bg-green-500 dark:text-black">
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-3 py-6 md:px-6">
        {!search && (
          <div className="no-scrollbar -mx-3 mb-6 flex gap-2 overflow-x-auto px-3 pb-1">
            {TOPICS.map((t) => (
              <button
                key={t.value || "popular"}
                onClick={() => go({ topic: t.value, q: "" })}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  topic === t.value
                    ? "bg-green-500 text-black shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-winky text-2xl font-extrabold text-gray-900 dark:text-white">{heading}</h2>
          {!loading && total > 0 && (
            <span className="text-sm text-gray-500 dark:text-ink-400">{total.toLocaleString()} free books</span>
          )}
        </div>

        {error ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center dark:border-ink-700">
            <p className="font-winky text-lg font-semibold text-gray-700 dark:text-ink-200">The free library is taking a while to answer.</p>
            <p className="mt-1 text-sm text-gray-500">Project Gutenberg&apos;s catalogue can be slow on the first visit.</p>
            <button
              onClick={() => setAttempt((a) => a + 1)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-2 font-semibold text-black hover:bg-green-400"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          </div>
        ) : loading ? (
          <>
          {slow && (
            <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-300">
              Opening this shelf for the first time — Project Gutenberg can take up to a minute. It&apos;ll be instant next time.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-md dark:bg-ink-800">
                <div className="aspect-[2/3] w-full bg-gray-200 dark:bg-ink-700" />
                <div className="space-y-1.5 p-2.5">
                  <div className="h-2.5 w-3/4 rounded bg-gray-200 dark:bg-ink-700" />
                  <div className="h-2 w-1/2 rounded bg-gray-200 dark:bg-ink-700" />
                </div>
              </div>
            ))}
          </div>
          </>
        ) : books.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center dark:border-ink-700">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <p className="font-winky text-lg font-semibold text-gray-700 dark:text-ink-200">No free books found.</p>
            <p className="mt-1 text-sm text-gray-500">Free books are classics whose copyright has expired — try an older title or author.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6">
              {books.map((book, i) => (
                <motion.div
                  key={book.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min((i % 32) * 0.03, 0.5) }}
                >
                  <BookCard book={book} readNow />
                </motion.div>
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-full bg-black px-10 py-3 font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
