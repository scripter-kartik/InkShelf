"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import Skeleton from "../../../components/Skeleton";

export default function GenrePage() {
  const searchParams = useSearchParams();
  const genre = searchParams.get("name");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    if (!genre) return;
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://openlibrary.org/subjects/${genre}.json?limit=1000`
        );
        const data = await res.json();
        setBooks(data.works || []);
      } catch (err) {
        console.error("Failed to fetch books:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [genre]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 20);
  };

  return (
    <div className="bg-gray-100 min-h-screen w-[calc(100vw - 16px)] overflow-x-hidden">
      <Navbar query={query} setQuery={setQuery} />
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4 text-green-600 capitalize">
          {genre?.replace(/_/g, " ")}
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded shadow-md p-3 animate-pulse"
                >
                  <Skeleton height="h-48" rounded="rounded" />
                  <div className="mt-2 space-y-2">
                    <Skeleton width="w-3/4" />
                    <Skeleton width="w-1/2" />
                  </div>
                </div>
              ))
            : books.slice(0, visibleCount).map((book) => (
                <div
                  key={book.key}
                  className="bg-white rounded shadow-md p-3 hover:shadow-xl transition-shadow"
                >
                  {book.cover_id ? (
                    <img
                      src={`https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`}
                      alt={book.title}
                      className="w-full h-48 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-300 flex items-center justify-center rounded">
                      <span className="text-gray-500 text-sm">No Cover</span>
                    </div>
                  )}
                  <h3 className="mt-2 text-base font-medium line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Author:{" "}
                    {book.authors && book.authors.length > 0
                      ? book.authors[0].name
                      : "Unknown"}
                  </p>
                  <a
                    href={`https://openlibrary.org${book.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 hover:underline mt-1 inline-block"
                  >
                    Read Book
                  </a>
                </div>
              ))}
        </div>

        {!loading && visibleCount < books.length && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleLoadMore}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Show More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
