"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Search, Sparkles, X, RefreshCw, GraduationCap, Library, ExternalLink } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import BookCard from "@/components/BookCard";
import { fetchFreeBooks, fetchTextbooks } from "@/lib/openlibrary";
import { FREE_TOPICS } from "@/lib/freeTopics";

const TOPICS = FREE_TOPICS;

const TEXTBOOK_SUBJECTS = [
  { value: "", label: "All textbooks" },
  { value: "psychology", label: "Psychology" },
  { value: "business", label: "Business" },
  { value: "economics", label: "Economics" },
  { value: "computer science", label: "Computer Science" },
  { value: "programming", label: "Programming" },
  { value: "mathematics", label: "Mathematics" },
  { value: "statistics", label: "Statistics" },
  { value: "biology", label: "Biology" },
  { value: "chemistry", label: "Chemistry" },
  { value: "physics", label: "Physics" },
  { value: "history", label: "History" },
  { value: "philosophy", label: "Philosophy" },
  { value: "sociology", label: "Sociology" },
  { value: "writing", label: "Writing" },
  { value: "law", label: "Law" },
  { value: "health", label: "Health" },
];

const COVER_GRADIENTS = [
  "from-emerald-500 to-teal-700",
  "from-sky-500 to-indigo-700",
  "from-amber-500 to-orange-700",
  "from-rose-500 to-pink-700",
  "from-violet-500 to-purple-800",
  "from-lime-500 to-green-700",
  "from-cyan-500 to-blue-700",
];

function gradientFor(title = "") {
  let h = 0;
  for (const ch of title) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COVER_GRADIENTS[h % COVER_GRADIENTS.length];
}

export default function FreeLibrary() {
  const params = useSearchParams();
  const router = useRouter();
  const collection = params.get("collection") === "textbooks" ? "textbooks" : "classics";
  const isTextbooks = collection === "textbooks";
  const topic = params.get("topic") || "";
  const search = params.get("q") || "";
  const load = useCallback(
    (page) =>
      isTextbooks
        ? fetchTextbooks({ search: search || topic, page })
        : fetchFreeBooks({ topic, search, page }),
    [isTextbooks, topic, search]
  );

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
    load(0)
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
  }, [load, attempt]);

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
      const data = await load(next);
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
  }, [loadingMore, hasMore, page, load]);

  const go = (next) => {
    const qs = new URLSearchParams();
    const nextCollection = next.collection ?? collection;
    if (nextCollection === "textbooks") qs.set("collection", "textbooks");
    if (next.topic) qs.set("topic", next.topic);
    if (next.q) qs.set("q", next.q);
    router.push(`/free${qs.toString() ? `?${qs}` : ""}`);
  };

  const chips = isTextbooks ? TEXTBOOK_SUBJECTS : TOPICS;
  const heading = search
    ? `Free ${isTextbooks ? "textbooks" : "books"} matching “${search}”`
    : chips.find((t) => t.value === topic)?.label || (isTextbooks ? "Free textbooks" : "Free classics");

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
            {isTextbooks
              ? "2,000+ modern, openly licensed textbooks — psychology, business, coding, science and more — free to read in full online."
              : "75,000+ classics you can read in full, right here — with page numbers, bookmarks, highlights and notes. Every book on this page opens instantly."}
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
              placeholder={isTextbooks ? "Search free textbooks by subject or title…" : "Search free books by title or author…"}
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

          <div className="mt-5 inline-flex rounded-2xl bg-black/10 p-1 dark:bg-white/5" role="tablist" aria-label="Collection">
            {[
              { value: "classics", label: "Classics", hint: "Read here", icon: Library },
              { value: "textbooks", label: "Textbooks", hint: "Modern & open", icon: GraduationCap },
            ].map((c) => (
              <button
                key={c.value}
                role="tab"
                aria-selected={collection === c.value}
                onClick={() => go({ collection: c.value, topic: "", q: "" })}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  collection === c.value
                    ? "bg-white text-black shadow dark:bg-green-500"
                    : "text-black/70 hover:text-black dark:text-ink-300 dark:hover:text-white"
                }`}
              >
                <c.icon className="h-4 w-4" />
                {c.label}
                <span className="hidden text-xs font-normal opacity-70 sm:inline">· {c.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-3 py-6 md:px-6">
        {!search && (
          <div className="no-scrollbar -mx-3 mb-6 flex gap-2 overflow-x-auto px-3 pb-1">
            {chips.map((t) => (
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
                  {isTextbooks ? <TextbookCard book={book} /> : <BookCard book={book} readNow />}
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

function TextbookCard({ book }) {
  return (
    <a
      href={book.readUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-shadow hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-ink-800"
      title={`Read “${book.title}” free online`}
    >
      <div className={`relative flex aspect-[2/3] w-full flex-col justify-between bg-gradient-to-br p-3 text-white ${gradientFor(book.title)}`}>
        <span className="self-start rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">Free</span>
        <span className="line-clamp-5 font-winky text-base font-bold leading-snug drop-shadow-sm">{book.title}</span>
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide opacity-80">
          <GraduationCap className="h-3.5 w-3.5" /> Open textbook
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="line-clamp-1 text-[10px] text-gray-500 dark:text-ink-400">
          {book.author_name[0] || book.publisher || "Open Textbook Library"}
          {book.year ? ` · ${book.year}` : ""}
        </p>
        {book.subjects.length > 0 && (
          <p className="line-clamp-1 text-[10px] text-gray-400 dark:text-ink-500">{book.subjects.join(" · ")}</p>
        )}
        <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-semibold text-green-600 group-hover:underline dark:text-green-400">
          Read free online <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </a>
  );
}
