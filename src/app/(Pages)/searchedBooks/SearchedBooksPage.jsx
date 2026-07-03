"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import BookCard from "@/components/BookCard";
import { fetchBooksBySearch } from "../../components/fetchBooksBySearch";
const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    show: (i) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] },
    }),
};
export default function SearchedBooks() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const searchTerm = searchParams.get("q");
    const router = useRouter();
    useEffect(() => {
        if (!searchTerm)
            return;
        const fetchBooks = async () => {
            setLoading(true);
            try {
                const results = await fetchBooksBySearch(searchTerm);
                setBooks(results);
            }
            catch (err) {
                console.error(err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchBooks();
    }, [searchTerm]);
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-950 overflow-x-hidden">
      <Navbar />
      <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-6">
        <motion.h2 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="text-2xl md:text-3xl font-extrabold font-winky mb-6 text-gray-900 dark:text-white">
          Results for &ldquo;{searchTerm}&rdquo;
        </motion.h2>
        {loading ? (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (<div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-3 animate-pulse shadow-md">
                <div className="h-48 w-full rounded-lg bg-gray-200 dark:bg-gray-700"/>
                <div className="mt-2 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700"/>
                  <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700"/>
                </div>
              </div>))}
          </div>) : books.length === 0 ? (<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-500 dark:text-gray-400 text-lg">
            No books found.
          </motion.p>) : (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {books.map((book, i) => (<motion.div key={book.key} custom={i} variants={cardVariants} initial="hidden" animate="show">
                <BookCard book={book} />
              </motion.div>))}
          </div>)}
      </div>
    </div>);
}
