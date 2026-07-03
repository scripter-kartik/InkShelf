"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { coverUrl, workId } from "@/lib/openlibrary";
export default function BookCard({ book }) {
    const id = workId(book.key);
    const cover = coverUrl(book.cover_id ?? book.cover_i, "M");
    const author = book.authors?.[0]?.name || book.author_name?.[0] || book.author || "Unknown";
    return (<motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 320, damping: 22 }} className="h-full">
      <Link href={`/books/${id}`} className="group flex flex-col h-full rounded-xl bg-white dark:bg-gray-800 p-3 shadow-md hover:shadow-xl transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-green-500">
        {cover ? (<img src={cover} alt={`Cover of ${book.title}`} loading="lazy" className="h-48 w-full rounded-lg object-cover"/>) : (<div className="flex h-48 w-full items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">No Cover</span>
          </div>)}
        <h3 className="mt-2 line-clamp-2 text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
          {book.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
          {author}
        </p>
      </Link>
    </motion.div>);
}
