"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/Navbar";
import Skeleton from "../../components/Skeleton";
import BookCard from "@/components/BookCard";
import { fetchBooksByCategories } from "@/lib/openlibrary";
const categories = [
    { label: "Fantasy", key: "fantasy" },
    { label: "Science Fiction", key: "science_fiction" },
    { label: "Mystery & Thriller", key: "mystery" },
    { label: "Historical Fiction", key: "historical_fiction" },
    { label: "Romance", key: "romance" },
    { label: "Horror", key: "horror" },
    { label: "Adventure", key: "adventure" },
    { label: "Literary Fiction", key: "literary_fiction" },
    { label: "Young Adult (YA) Fiction", key: "young_adult" },
    { label: "Dystopian", key: "dystopian" },
    { label: "Biography & Memoir", key: "biography" },
    { label: "Self-Help", key: "self_help" },
    { label: "History", key: "history" },
    { label: "Politics & Current Affairs", key: "politics" },
    { label: "Science & Nature", key: "science" },
    { label: "Psychology", key: "psychology" },
    { label: "Philosophy", key: "philosophy" },
    { label: "Business & Economics", key: "business" },
    { label: "Poetry", key: "poetry" },
    { label: "Comics & Graphic Novels", key: "graphic_novels" },
    { label: "Art & Photography", key: "art" },
    { label: "Cooking & Food", key: "cooking" },
    { label: "Crafts & Hobbies", key: "crafts_and_hobbies" },
    { label: "Travel", key: "travel" },
    { label: "Parenting & Families", key: "parenting" },
    { label: "Education", key: "education" },
    { label: "Health & Fitness", key: "health" },
    { label: "Spirituality & Religion", key: "religion" },
    { label: "True Crime", key: "true_crime" },
    { label: "Humor", key: "humor" },
    { label: "Technology", key: "technology" },
    { label: "Engineering", key: "engineering" },
];
const PAGE_SIZE = 3;
const sectionVariants = {
    hidden: { opacity: 0, y: 32 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    show: (i) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
    }),
};
export default function Page() {
    const [booksCollection, setBooksCollection] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const observerRef = useRef();
    const fetchBooks = async (pageNumber) => {
        setLoading(true);
        const startIndex = pageNumber * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const nextCategories = categories.slice(startIndex, endIndex);
        if (nextCategories.length === 0) {
            setLoading(false);
            return;
        }
        try {
            const result = await fetchBooksByCategories(nextCategories);
            setBooksCollection((prev) => {
                const existingCategories = new Set(prev.map((entry) => entry.category));
                const filteredResult = result.filter((entry) => !existingCategories.has(entry.category));
                return [...prev, ...filteredResult];
            });
        }
        catch (error) {
            console.error("Error loading books:", error.message);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchBooks(page);
    }, [page]);
    const lastElementRef = useCallback((node) => {
        if (loading)
            return;
        if (observerRef.current)
            observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setPage((prev) => prev + 1);
            }
        });
        if (node)
            observerRef.current.observe(node);
    }, [loading]);
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-950 overflow-x-hidden">
      <Navbar />
      <div className="px-3 md:px-6 py-6 space-y-10 max-w-[1600px] mx-auto">
        {booksCollection.map(({ category, books }, idx) => {
            const isLast = idx === booksCollection.length - 1;
            return (<motion.div key={`${category}-${idx}`} ref={isLast ? lastElementRef : null} variants={sectionVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="bg-green-400 dark:bg-green-900/50 rounded-2xl p-4 md:p-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-black dark:text-white font-winky mb-5">
                {category}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {books.map((book, i) => (<motion.div key={book.key} custom={i} variants={cardVariants} initial="hidden" whileInView="show" viewport={{ once: true }}>
                    <BookCard book={book} />
                  </motion.div>))}
              </div>
            </motion.div>);
        })}
        {loading && (<div className="space-y-10">
            {Array.from({ length: PAGE_SIZE }).map((_, idx) => (<div key={idx} className="bg-green-400/30 dark:bg-green-900/20 rounded-2xl p-4 md:p-6">
                <div className="h-8 w-48 bg-green-300/50 dark:bg-green-800/50 rounded animate-pulse mb-5"/>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-3 animate-pulse">
                      <Skeleton height="h-48" rounded="rounded-lg"/>
                      <div className="mt-2 space-y-2">
                        <Skeleton width="w-3/4"/>
                        <Skeleton width="w-1/2"/>
                      </div>
                    </div>))}
                </div>
              </div>))}
          </div>)}
      </div>
    </div>);
}
