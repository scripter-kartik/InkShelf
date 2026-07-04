"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ExternalLink, ArrowLeft, RefreshCw, AlertCircle,
  X, Maximize2, Minimize2, Eye, EyeOff, Calendar, Hash, Globe, BookMarked
} from "lucide-react";
import gsap from "gsap";
import ShelfControls from "@/components/ShelfControls";
import { coverUrl } from "@/lib/openlibrary";

export default function BookDetailClient({ book, cover }) {
  const [localBook, setLocalBook] = useState(book);
  const [localCover, setLocalCover] = useState(cover);
  const [isFallback, setIsFallback] = useState(false);
  const [showReader, setShowReader] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const coverRef = useRef(null);
  const contentRef = useRef(null);

  const canEmbed = localBook?.embeddable === true;
  const embedUrl = canEmbed
    ? `https://books.google.com/books?id=${localBook.id}&lpg=PP1&pg=PP1&output=embed`
    : null;

  useEffect(() => {
    if (book.title === "Fallback Offline Book") {
      setIsFallback(true);
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(`book_${book.id}`);
          if (cached) {
            const data = JSON.parse(cached);
            setLocalBook((prev) => ({
              ...prev,
              title: data.title,
              author: data.author,
              description: "This book is currently being viewed offline as the Google Books API is rate-limited. Some details may be missing.",
              subjects: ["Offline Cache"],
            }));
            if (data.coverId) {
              setLocalCover(coverUrl(data.coverId, "L") || data.coverId);
            }
            setIsFallback(false);
          }
        } catch (err) {}
      }
    }
  }, [book]);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    if (coverRef.current) {
      tl.fromTo(
        coverRef.current,
        { opacity: 0, x: -50, rotateY: -20 },
        { opacity: 1, x: 0, rotateY: 0, duration: 0.85 }
      );
    }
    if (contentRef.current) {
      const children = Array.from(contentRef.current.children);
      tl.fromTo(
        children,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.07 },
        "-=0.55"
      );
    }
  }, [localBook]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link
          href="/books"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-green-600 hover:underline dark:text-green-400 font-medium"
        >
          <motion.span animate={{ x: 0 }} whileHover={{ x: -3 }} transition={{ type: "spring", stiffness: 400 }}>
            <ArrowLeft className="w-4 h-4" />
          </motion.span>
          Back to browse
        </Link>
      </motion.div>

      {isFallback ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border-2 border-dashed border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 p-8 md:p-12 text-center max-w-2xl mx-auto"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 animate-bounce" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-winky text-gray-900 dark:text-white mb-4">
            API Rate Limit Reached
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-lato leading-relaxed mb-8 max-w-md mx-auto">
            The Google Books API is temporarily rate-limited. Please restart your dev server to reload your API key, or try again in a moment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-lg transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="grid gap-8 md:grid-cols-[260px_1fr]">
            <div ref={coverRef} className="mx-auto w-full max-w-[260px] flex flex-col gap-4" style={{ perspective: "800px" }}>
              {localCover ? (
                <motion.img
                  whileHover={{ scale: 1.04, rotateY: 6 }}
                  transition={{ type: "spring", stiffness: 220, damping: 20 }}
                  src={localCover}
                  alt={`Cover of ${localBook.title}`}
                  className="w-full rounded-2xl shadow-2xl"
                  style={{ transformStyle: "preserve-3d" }}
                />
              ) : (
                <div className="flex aspect-[2/3] w-full items-center justify-center rounded-2xl bg-gray-200 dark:bg-gray-800 shadow-lg">
                  <BookOpen className="w-12 h-12 text-gray-400" />
                </div>
              )}

              <div className="flex flex-col gap-2 text-sm">
                {localBook.pageCount && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Hash className="w-3.5 h-3.5 text-green-500" />
                    <span className="font-lato">{localBook.pageCount} pages</span>
                  </div>
                )}
                {localBook.publisher && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <BookMarked className="w-3.5 h-3.5 text-green-500" />
                    <span className="font-lato">{localBook.publisher}</span>
                  </div>
                )}
                {localBook.language && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Globe className="w-3.5 h-3.5 text-green-500" />
                    <span className="font-lato uppercase">{localBook.language}</span>
                  </div>
                )}
                {localBook.firstPublishYear && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-3.5 h-3.5 text-green-500" />
                    <span className="font-lato">{localBook.firstPublishYear}</span>
                  </div>
                )}
              </div>

              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${canEmbed
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"}`}>
                {canEmbed
                  ? <><Eye className="w-3.5 h-3.5" /> Full preview available</>
                  : <><EyeOff className="w-3.5 h-3.5" /> No inline preview</>}
              </div>
            </div>

            <div ref={contentRef} className="space-y-0">
              <div>
                <h1 className="font-lato text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl leading-tight">
                  {localBook.title}
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                  by <span className="font-semibold text-gray-800 dark:text-gray-100">{localBook.author}</span>
                </p>
              </div>

              <div className="pt-6">
                <ShelfControls book={localBook} />
              </div>

              <div className="flex flex-wrap gap-3 pt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setIframeLoaded(false); setShowReader(true); }}
                  className="inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 font-semibold text-black hover:bg-green-600 shadow-lg shadow-green-500/25 transition-colors"
                >
                  <BookOpen className="h-5 w-5" />
                  Read on InkShelf
                </motion.button>

                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  href={localBook.webReaderLink || localBook.readUrl || `https://books.google.com/books?id=${localBook.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-gray-400 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                >
                  <ExternalLink className="h-5 w-5" />
                  Open on Google Books
                </motion.a>
              </div>

              {localBook.description && (
                <div className="pt-8">
                  <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white font-winky">
                    About this book
                  </h2>
                  <p className="whitespace-pre-line leading-relaxed text-gray-700 dark:text-gray-300">
                    {localBook.description}
                  </p>
                </div>
              )}

              {localBook.subjects?.length > 0 && (
                <div className="pt-8">
                  <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white font-winky">
                    Subjects
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {localBook.subjects.map((s, i) => (
                      <motion.span
                        key={s}
                        initial={{ opacity: 0, scale: 0.75, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.04, type: "spring", stiffness: 300, damping: 20 }}
                        whileHover={{ scale: 1.1, y: -2 }}
                        className="cursor-default rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-900/40 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800/60 transition-colors"
                      >
                        {s}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {showReader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col transition-all duration-300 ${
                isFullscreen ? "w-screen h-screen rounded-none" : "w-full max-w-5xl h-[88vh]"
              }`}
            >
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{localBook.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{localBook.author}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setShowReader(false)}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 relative overflow-hidden">
                {canEmbed ? (
                  <>
                    {!iframeLoaded && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-900 z-10">
                        <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-lato">Loading book preview…</p>
                      </div>
                    )}
                    <iframe
                      key={localBook.id}
                      src={embedUrl}
                      className="w-full h-full border-0"
                      allowFullScreen
                      onLoad={() => setIframeLoaded(true)}
                      title={localBook.title}
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center bg-white dark:bg-gray-900">
                    <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <EyeOff className="w-10 h-10 text-amber-500" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white font-winky">
                      Preview Not Available on InkShelf
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md font-lato leading-relaxed">
                      The publisher has not granted Google Books permission to display an inline preview of <strong>{localBook.title}</strong>.
                      You can still read it on Google Play Books using the button below.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        href={localBook.webReaderLink || `https://books.google.com/books?id=${localBook.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 font-semibold text-black hover:bg-green-600 shadow-lg transition-colors text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Read on Google Play Books
                      </motion.a>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowReader(false)}
                        className="inline-flex items-center gap-2 rounded-full border-2 border-gray-300 dark:border-gray-600 px-5 py-2.5 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                      >
                        <X className="w-4 h-4" />
                        Close
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
