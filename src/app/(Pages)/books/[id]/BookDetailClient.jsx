"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ExternalLink, ArrowLeft } from "lucide-react";
import gsap from "gsap";
import ShelfControls from "@/components/ShelfControls";

export default function BookDetailClient({ book, cover }) {
  const coverRef = useRef(null);
  const contentRef = useRef(null);

  /* GSAP timeline: cover slides in, content staggers up */
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
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link
          href="/books"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-green-600 hover:underline dark:text-green-400 font-medium group"
        >
          <motion.span
            animate={{ x: 0 }}
            whileHover={{ x: -3 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.span>
          Back to browse
        </Link>
      </motion.div>

      <div className="grid gap-8 md:grid-cols-[240px_1fr]">
        {/* ── Cover ─────────────────────────────────────────────────────── */}
        <div
          ref={coverRef}
          className="mx-auto w-full max-w-[240px]"
          style={{ perspective: "800px" }}
        >
          {cover ? (
            <motion.img
              whileHover={{ scale: 1.04, rotateY: 6 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              src={cover}
              alt={`Cover of ${book.title}`}
              className="w-full rounded-2xl shadow-2xl"
              style={{ transformStyle: "preserve-3d" }}
            />
          ) : (
            <div className="flex aspect-[2/3] w-full items-center justify-center rounded-2xl bg-gray-200 dark:bg-gray-800 shadow-lg">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div ref={contentRef} className="space-y-0">
          {/* Title & author */}
          <div>
            <h1 className="font-lato text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl leading-tight">
              {book.title}
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
              by{" "}
              <span className="font-semibold text-gray-800 dark:text-gray-100">
                {book.author}
              </span>
            </p>
            {book.firstPublishYear && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                First published {book.firstPublishYear}
              </p>
            )}
          </div>

          {/* Shelf controls */}
          <div className="pt-6">
            <ShelfControls book={book} />
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3 pt-6">
            {book.readUrl && (
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                href={book.readUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-2.5 font-semibold text-black hover:bg-green-600 shadow-lg shadow-green-500/25 transition-colors"
              >
                <BookOpen className="h-5 w-5" />
                Read / Borrow
              </motion.a>
            )}
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              href={
                book.readUrl ||
                `https://books.google.com/books?id=${book.id}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-2 border-gray-400 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              <ExternalLink className="h-5 w-5" />
              View on Google Books
            </motion.a>
          </div>

          {/* Description */}
          {book.description && (
            <div className="pt-8">
              <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white font-winky">
                About this book
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-gray-700 dark:text-gray-300">
                {book.description}
              </p>
            </div>
          )}

          {/* Subject tags */}
          {book.subjects?.length > 0 && (
            <div className="pt-8">
              <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white font-winky">
                Subjects
              </h2>
              <div className="flex flex-wrap gap-2">
                {book.subjects.map((s, i) => (
                  <motion.span
                    key={s}
                    initial={{ opacity: 0, scale: 0.75, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      delay: 0.4 + i * 0.04,
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="cursor-default rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-900/40 dark:text-green-200 transition-colors hover:bg-green-200 dark:hover:bg-green-800/60"
                  >
                    {s}
                  </motion.span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
