"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "../../components/Navbar";
import BookCard from "@/components/BookCard";
import { fetchBooksByCategories } from "@/lib/openlibrary";
import { CATEGORIES } from "@/lib/constants";
import { Sparkles, BookOpen } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const PAGE_SIZE = 3;

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.94 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      delay: Math.min(i * 0.05, 0.5),
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function BooksPage() {
  const [booksCollection, setBooksCollection] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const observerRef = useRef();
  const headingRef = useRef(null);
  const bgElementsRef = useRef(null);

  useEffect(() => {
    const el = headingRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.2 }
    );
  }, []);

  useEffect(() => {
    const bgContainer = bgElementsRef.current;
    if (!bgContainer) return;
    const items = bgContainer.querySelectorAll(".bg-floating");
    items.forEach((item, i) => {
      gsap.fromTo(item,
        {
          x: `random(-100, 100)`,
          y: `random(-50, 50)`,
          opacity: 0,
          scale: 0.2,
        },
        {
          opacity: 0.15,
          scale: 1,
          duration: 1.5,
          delay: i * 0.2,
          ease: "back.out(1.5)",
          onComplete: () => {
            gsap.to(item, {
              y: `+=random(80, 150)`,
              x: `+=random(-50, 50)`,
              rotation: `+=random(180, 360)`,
              duration: `random(6, 12)`,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
            });
          }
        }
      );
    });
  }, []);

  const fetchBooks = useCallback(async (pageNumber) => {
    setLoading(true);
    const startIndex = pageNumber * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const nextCategories = CATEGORIES.slice(startIndex, endIndex);
    if (nextCategories.length === 0) {
      setLoading(false);
      return;
    }
    try {
      const result = await fetchBooksByCategories(nextCategories);
      setBooksCollection((prev) => {
        const existingCategories = new Set(prev.map((e) => e.category));
        return [...prev, ...result.filter((e) => !existingCategories.has(e.category))];
      });
    } catch (error) {
      console.error("Error loading books:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks(page);
  }, [page, fetchBooks]);

  const lastElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) setPage((prev) => prev + 1);
      });
      if (node) observerRef.current.observe(node);
    },
    [loading]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 overflow-x-hidden relative">
      <Navbar />

      <div ref={bgElementsRef} className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="bg-floating absolute text-green-400/20 dark:text-green-500/10 font-bold select-none"
            style={{
              top: `${(i * 13) % 100}%`,
              left: `${(i * 19) % 100}%`,
              fontSize: `${(i % 3) * 20 + 24}px`,
            }}
          >
            {i % 3 === 0 ? "📖" : i % 3 === 1 ? "✨" : "📚"}
          </div>
        ))}
      </div>

      <div ref={headingRef} className="max-w-[1600px] mx-auto px-3 md:px-6 pt-6 pb-2 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-400/30 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Your free reading companion</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold font-winky text-gray-900 dark:text-white leading-tight">
          Browse Books
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-lato">
          Discover your next great read by category
        </p>
      </div>

      <div className="px-3 md:px-6 py-4 space-y-10 max-w-[1600px] mx-auto relative z-10">
        {booksCollection.map(({ category, books }, idx) => {
          const isLast = idx === booksCollection.length - 1;
          return (
            <motion.div
              key={`${category}-${idx}`}
              ref={isLast ? lastElementRef : null}
              variants={sectionVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="bg-green-400 dark:bg-green-900/50 rounded-2xl p-4 md:p-6 overflow-hidden border border-black/10 dark:border-green-800/20 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <SectionHeader label={category} idx={idx} />

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {books.map((book, i) => (
                  <motion.div
                    key={book.key}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  >
                    <BookCard book={book} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {loading && (
          <div className="space-y-10">
            {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-green-400/30 dark:bg-green-900/20 rounded-2xl p-4 md:p-6"
              >
                <div className="h-8 w-48 bg-green-300/50 dark:bg-green-800/50 rounded-lg animate-pulse mb-5" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-md animate-pulse">
                      <div className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700" />
                      <div className="p-2.5 space-y-1.5">
                        <div className="h-2.5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-2 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ label, idx }) {
  const lineRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        onEnter: () => {
          gsap.fromTo(
            el,
            { scaleX: 0, transformOrigin: "left" },
            { scaleX: 1, duration: 0.6, ease: "power3.out", delay: 0.1 }
          );
        },
        once: true,
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 92%",
        onEnter: () => {
          gsap.fromTo(
            el,
            { opacity: 0, x: -20 },
            { opacity: 1, x: 0, duration: 0.5, ease: "back.out(1.5)" }
          );
        },
        once: true,
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="mb-5">
      <h2 ref={textRef} className="text-2xl md:text-3xl font-extrabold text-black dark:text-white font-winky opacity-0">
        {label}
      </h2>
      <div
        ref={lineRef}
        className="mt-1 h-0.5 w-16 bg-black/30 dark:bg-white/30 rounded-full"
      />
    </div>
  );
}
