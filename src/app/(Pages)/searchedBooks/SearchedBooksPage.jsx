"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import { useRouter } from "next/navigation";
import { fetchBooksBySearch } from "../../components/fetchBooksBySearch";

export default function SearchedBooks() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("q");
  const router = useRouter();

  useEffect(() => {
    if (!searchTerm) return;

    setQuery(searchTerm);
    const fetchBooks = async () => {
      const results = await fetchBooksBySearch(searchTerm);
      setBooks(results);
    };

    fetchBooks();
  }, [searchTerm]);

  return (
    <div className="bg-gray-100 min-h-screen w-[calc(100vw - 16px)] overflow-x-hidden">
      <Navbar query={query} setQuery={setQuery} />
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Results for "{searchTerm}"
        </h2>
        {books.length === 0 ? (
          <p>No books found.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {books.map((book) => {
              const workKey = book.key;
              const bookId = workKey.replace("/works/", "");
              return (
                <div
                  key={workKey}
                  className="bg-white rounded shadow-md p-3 hover:shadow-xl transition-shadow"
                >
                  <div
                    onClick={() => router.push(`/readBooks?id=${bookId}`)}
                    className="cursor-pointer"
                  >
                    {book.cover_i ? (
                      <img
                        src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
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
                      {book.author_name ? book.author_name[0] : "Unknown"}
                    </p>
                  </div>

                  <a
                    href={`https://openlibrary.org${workKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 hover:underline mt-2 inline-block"
                  >
                    Read Book
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
