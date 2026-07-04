"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ExternalLink, ArrowLeft, RefreshCw, AlertCircle,
  X, Maximize2, Minimize2, Eye, EyeOff, Calendar, Hash, Globe, BookMarked, Sparkles
} from "lucide-react";
import gsap from "gsap";
import dynamic from "next/dynamic";
import ReactMarkdown from 'react-markdown';
import ShelfControls from "@/components/ShelfControls";
import { coverUrl } from "@/lib/openlibrary";

const EpubReaderComponent = dynamic(() => import("@/components/EpubReaderComponent"), { ssr: false });

export default function BookDetailClient({ book, cover }) {
  const [localBook, setLocalBook] = useState(book);
  const [localCover, setLocalCover] = useState(cover);
  const [isFallback, setIsFallback] = useState(false);
  const [showReader, setShowReader] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const coverRef = useRef(null);
  const contentRef = useRef(null);

  const [aiSummary, setAiSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const [iaId, setIaId] = useState(null);
  const [iaLoading, setIaLoading] = useState(false);
  const [epubUrl, setEpubUrl] = useState(null);
  const [gutenbergUrl, setGutenbergUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleEpubUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (epubUrl && epubUrl.startsWith('blob:')) URL.revokeObjectURL(epubUrl);
      const url = URL.createObjectURL(file);
      setEpubUrl(url);
      setShowReader(true);
      setIframeLoaded(true); // Treat epub as immediately ready
    }
  };

  useEffect(() => {
    if (!book.title) return;
    let cancelled = false;
    setIaLoading(true);

    fetch(`/api/book-sources?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author || "")}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.iaId) setIaId(data.iaId);
        if (data.epubUrl) setGutenbergUrl(data.epubUrl);
      })
      .catch(() => {}) // silently fail — user can still upload EPUB
      .finally(() => {
        if (!cancelled) setIaLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [book.title, book.author]);

  const handleGetSummary = async () => {
    setIsSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: localBook.title, author: localBook.author })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate summary");
      setAiSummary(data.summary);
    } catch (err) {
      setSummaryError(err.message);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const finalEpubUrl = epubUrl || gutenbergUrl;
  const canEmbed = localBook?.embeddable === true || !!iaId || !!gutenbergUrl;
  const embedUrl = iaId 
    ? `https://archive.org/embed/${iaId}?ui=embed` 
    : (localBook?.embeddable === true 
        ? `https://books.google.com/books?id=${localBook.id}&lpg=PP1&pg=PP1&output=embed` 
        : null);

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
                : iaLoading
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"}`}>
                {iaLoading ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking availability...</>
                ) : canEmbed ? (
                  <><Eye className="w-3.5 h-3.5" /> Full preview available</>
                ) : (
                  <><EyeOff className="w-3.5 h-3.5" /> No inline preview</>
                )}
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
                <input
                  type="file"
                  accept=".epub"
                  ref={fileInputRef}
                  onChange={handleEpubUpload}
                  className="hidden"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (finalEpubUrl) {
                      setShowReader(true);
                    } else if (canEmbed) {
                      setIframeLoaded(false);
                      setShowReader(true);
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  disabled={iaLoading}
                  className={`inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-black shadow-lg shadow-green-500/25 transition-colors ${
                    iaLoading ? "bg-gray-400 cursor-not-allowed opacity-70" : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {iaLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <BookOpen className="h-5 w-5" />}
                  {finalEpubUrl ? (epubUrl ? "Continue Reading EPUB" : "Read Full Book for Free") : (canEmbed ? "Read on InkShelf" : "Upload EPUB to Read")}
                </motion.button>
                
                {canEmbed && !epubUrl && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-gray-400 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors text-sm"
                  >
                    Upload Own EPUB
                  </motion.button>
                )}

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

              {/* AI Summary Section */}
              <div className="pt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white font-winky flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    AI Book Summary
                  </h2>
                </div>
                
                {!aiSummary && !isSummaryLoading && (
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-100 dark:border-purple-800/30 flex flex-col items-center text-center shadow-inner"
                  >
                    <Sparkles className="w-8 h-8 text-purple-400 mb-3" />
                    <p className="text-gray-700 dark:text-gray-300 font-medium mb-4 max-w-md">
                      Get a comprehensive, personalized summary of this book generated by Google AI Studio.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGetSummary}
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full shadow-lg shadow-purple-500/30 transition-colors flex items-center gap-2"
                    >
                      Generate Summary
                    </motion.button>
                    {summaryError && (
                      <p className="text-red-500 mt-3 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {summaryError}
                      </p>
                    )}
                  </motion.div>
                )}

                {isSummaryLoading && (
                  <div className="p-8 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center">
                    <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">
                      Analyzing {localBook.title}... Crafting your summary.
                    </p>
                  </div>
                )}

                {aiSummary && !isSummaryLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800/50 shadow-xl shadow-purple-900/5 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="prose prose-purple dark:prose-invert max-w-none font-lato text-gray-700 dark:text-gray-300 leading-relaxed">
                      <ReactMarkdown>{aiSummary}</ReactMarkdown>
                    </div>
                  </motion.div>
                )}
              </div>

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
                {finalEpubUrl ? (
                  <EpubReaderComponent url={finalEpubUrl} title={localBook.title} />
                ) : canEmbed ? (
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
                      This book does not have an open access preview. You can upload an EPUB file to read it directly on InkShelf.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setShowReader(false);
                          setTimeout(() => fileInputRef.current?.click(), 300);
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 font-semibold text-black hover:bg-green-600 shadow-lg transition-colors text-sm"
                      >
                        <BookOpen className="w-4 h-4" />
                        Upload EPUB
                      </motion.button>
                      <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        href={localBook.webReaderLink || `https://books.google.com/books?id=${localBook.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border-2 border-gray-300 dark:border-gray-600 px-5 py-2.5 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Google Books
                      </motion.a>
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
