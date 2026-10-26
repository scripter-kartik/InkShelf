"use client";
import Link from "next/link";
import { useRef } from "react";
import { motion, animate } from "framer-motion";
import { BookOpen } from "lucide-react";
import { coverUrl, workId, isOpenLibraryId } from "@/lib/openlibrary";

const preloaded = new Set();

export default function BookCard({ book }) {
  const id = workId(book.key);
  const cover = coverUrl(book.cover_id ?? book.cover_i, "M");
  const author =
    book.authors?.[0]?.name ||
    book.author_name?.[0] ||
    book.author ||
    "Unknown";

  const imgRef = useRef(null);
  const cardRef = useRef(null);
  const preloadTimer = useRef(null);

  const preload = (delay) => {
    if (preloaded.has(id) || String(id).startsWith("mock_")) return;
    clearTimeout(preloadTimer.current);
    preloadTimer.current = setTimeout(() => {
      preloaded.add(id);
      fetch(`/api/books?type=detail&id=${encodeURIComponent(id)}`).catch(() => {});
    }, delay);
  };

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);

    animate(
      el,
      { rotateY: x * 8, rotateX: -y * 6, transformPerspective: 600 },
      { duration: 0.4, ease: "easeOut" }
    );
  };

  const handleMouseLeave = () => {
    clearTimeout(preloadTimer.current);
    if (cardRef.current) {
      animate(cardRef.current, { rotateY: 0, rotateX: 0 }, { duration: 0.5, ease: [0.22, 1, 0.36, 1] });
    }
  };

  const handleSaveMeta = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `book_${id}`,
          JSON.stringify({
            title: book.title,
            author: author,
            coverId: book.cover_id ?? book.cover_i,
          })
        );
      } catch (err) {}
      const olid = isOpenLibraryId(id) ? `&olid=${encodeURIComponent(id)}` : "";
      fetch(
        `/api/book-sources?title=${encodeURIComponent(book.title || "")}&author=${encodeURIComponent(author)}${olid}`
      ).catch(() => {});
    }
  };

  return (
    <motion.div
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 320, damping: 22 } }}
      whileTap={{ scale: 0.97 }}
      className="h-full"
    >
      <Link
        href={`/books/${id}`}
        ref={cardRef}
        onMouseEnter={() => preload(150)}
        onFocus={() => preload(150)}
        onTouchStart={() => preload(0)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleSaveMeta}
        className="group flex flex-col h-full rounded-2xl bg-white dark:bg-ink-800 shadow-md hover:shadow-xl transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 overflow-hidden"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="relative w-full aspect-[2/3] overflow-hidden bg-gray-100 dark:bg-ink-700">
          {cover ? (
            <motion.img
              ref={imgRef}
              src={cover}
              alt={`Cover of ${book.title}`}
              loading="lazy"
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.07 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <BookOpen className="w-8 h-8 text-gray-400" />
              <span className="text-xs text-gray-400 text-center px-2">No Cover</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <AccessBadge access={book.access} />
        </div>

        <div className="p-2.5 flex flex-col gap-0.5 flex-1">
          <h3 className="line-clamp-2 text-xs font-semibold text-gray-900 dark:text-ink-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors leading-snug">
            {book.title}
          </h3>
          <p className="line-clamp-1 text-[10px] text-gray-500 dark:text-ink-400">
            {author}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export function AccessBadge({ access, className = "" }) {
  if (access !== "public" && access !== "borrowable") return null;
  const free = access === "public";
  return (
    <span
      className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-md ${
        free ? "bg-green-500 text-black" : "bg-sky-500 text-white"
      } ${className}`}
      title={free ? "Free to read in full" : "Free to borrow from Open Library"}
    >
      {free ? "Free" : "Borrow"}
    </span>
  );
}
