"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import Skeleton from "../../components/Skeleton";
import BookCard from "@/components/BookCard";
import { fetchBooksByGenre } from "../../components/fetchBooksByGenre";
const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    show: (i) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] },
    }),
};
export default function GenrePageContent() {
    const searchParams = useSearchParams();
    const genre = searchParams.get("name");
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(24);
    useEffect(() => {
        if (!genre)
            return;
        const fetchBooks = async () => {
            setLoading(true);
            const booksData = await fetchBooksByGenre(genre);
            setBooks(booksData);
            setLoading(false);
        };
        fetchBooks();
    }, [genre]);
    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 24);
    };
    const displayName = genre?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-950 overflow-x-hidden">
      <Navbar />
      <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-green-400 dark:bg-green-900/50 rounded-2xl p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-extrabold font-winky mb-6 text-black dark:text-white capitalize">
            {displayName}
          </h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {loading
                ? Array.from({ length: 12 }).map((_, i) => (<div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-3 animate-pulse">
                    <Skeleton height="h-48" rounded="rounded-lg"/>
                    <div className="mt-2 space-y-2">
                      <Skeleton width="w-3/4"/>
                      <Skeleton width="w-1/2"/>
                    </div>
                  </div>))
                : books.slice(0, visibleCount).map((book, i) => (<motion.div key={book.key} custom={i} variants={cardVariants} initial="hidden" animate="show">
                    <BookCard book={book} />
                  </motion.div>))}
          </div>
          {!loading && visibleCount < books.length && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex justify-center mt-8">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={handleLoadMore} className="px-8 py-3 bg-black text-white dark:bg-white dark:text-black font-semibold rounded-full hover:opacity-90 transition shadow-lg">
                Load More
              </motion.button>
            </motion.div>)}
        </motion.div>
      </div>
    </div>);
}
