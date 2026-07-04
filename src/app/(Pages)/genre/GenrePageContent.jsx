"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import Navbar from "../../components/Navbar";
import BookCard from "@/components/BookCard";
import { fetchBooksByGenre } from "@/lib/openlibrary";
import { BookOpen } from "lucide-react";

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.95 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      delay: Math.min(i * 0.04, 0.6),
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function GenrePageContent() {
  const searchParams = useSearchParams();
  const genre = searchParams.get("name");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(24);
  const headerRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    if (!genre) return;
    setLoading(true);
    setBooks([]);
    setVisibleCount(24);

    /* GSAP header entrance */
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -24 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.1 }
      );
    }

    fetchBooksByGenre(genre).then((booksData) => {
      setBooks(booksData);
      setLoading(false);
    });
  }, [genre]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 24);
  };

  const displayName = genre
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 overflow-x-hidden">
      <Navbar />
      <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-green-400 dark:bg-green-900/50 rounded-2xl p-4 md:p-6"
        >
          {/* Header */}
          <div ref={headerRef} className="mb-6 flex items-end justify-between flex-wrap gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold font-winky text-black dark:text-white capitalize">
              {displayName}
            </h1>
            {!loading && books.length > 0 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm font-medium text-black/70 dark:text-white/70"
              >
                {books.length} books found
              </motion.span>
            )}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {loading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md animate-pulse"
                  >
                    <div className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700" />
                    <div className="p-2.5 space-y-1.5">
                      <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-2 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </motion.div>
                ))
              : books.slice(0, visibleCount).map((book, i) => (
                  <motion.div
                    key={book.key}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="show"
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <BookCard book={book} />
                  </motion.div>
                ))}
          </div>

          {/* Empty state */}
          {!loading && books.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-16 text-center"
            >
              <BookOpen className="w-12 h-12 text-black/40 dark:text-white/40 mx-auto mb-3" />
              <p className="text-black/70 dark:text-white/70 font-lato">
                No books found for this genre.
              </p>
            </motion.div>
          )}

          {/* Load more */}
          {!loading && visibleCount < books.length && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center mt-10"
            >
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 380, damping: 18 }}
                onClick={handleLoadMore}
                className="px-10 py-3 bg-black text-white dark:bg-white dark:text-black font-semibold rounded-full hover:opacity-90 transition shadow-lg"
              >
                Load More
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
