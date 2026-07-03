import Link from "next/link";
import { coverUrl, workId } from "@/lib/openlibrary";
export default function BookCard({ book }) {
    const id = workId(book.key);
    const cover = coverUrl(book.cover_id ?? book.cover_i, "M");
    const author = book.authors?.[0]?.name || book.author_name?.[0] || book.author || "Unknown";
    return (<Link href={`/books/${id}`} className="group block rounded-lg bg-white dark:bg-gray-800 p-3 shadow-md transition-shadow duration-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500">
      {cover ? (<img src={cover} alt={`Cover of ${book.title}`} loading="lazy" className="h-48 w-full rounded object-cover"/>) : (<div className="flex h-48 w-full items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            No Cover
          </span>
        </div>)}
      <h3 className="mt-2 line-clamp-2 text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400">
        {book.title}
      </h3>
      <p className="mt-0.5 line-clamp-1 text-xs text-gray-600 dark:text-gray-400">
        {author}
      </p>
    </Link>);
}
