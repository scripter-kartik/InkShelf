"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Navbar from "../../../components/Navbar";
import Skeleton from "../../../components/Skeleton";
import { fetchBooksByCategories } from "../../../components/fetchBooksByCategories";

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

export default function Page() {
  const [booksCollection, setBooksCollection] = useState([]);
  const [query, setQuery] = useState("");
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
        const filteredResult = result.filter(
          (entry) => !existingCategories.has(entry.category)
        );
        return [...prev, ...filteredResult];
      });
    } catch (error) {
      console.error("Error loading books:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(page);
  }, [page]);

  const lastElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading]
  );

  return (
    <div className="bg-gray-100 min-h-screen w-[calc(100vw - 16px)] overflow-x-hidden">
      <Navbar query={query} setQuery={setQuery} />
      <div className="p-2 md:p-6 space-y-12">
        {booksCollection.map(({ category, books }, idx) => {
          const isLast = idx === booksCollection.length - 1;
          return (
            <div
              key={`${category}-${idx}`}
              ref={isLast ? lastElementRef : null}
              className="bg-green-400 rounded-lg p-4"
            >
              <h2 className="text-3xl font-extrabold text-black font-winky mb-4">
                {category}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {books.map((book) => (
                  <div
                    key={book.key}
                    className="bg-white rounded shadow-md hover:shadow-xl transition-shadow duration-300 p-3"
                  >
                    {book.cover_id ? (
                      <img
                        src={`https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`}
                        alt={book.title}
                        className="w-full h-48 object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-300 flex items-center justify-center rounded">
                        <span className="text-gray-500">No Cover</span>
                      </div>
                    )}
                    <h3 className="mt-2 font-medium text-sm line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-xs text-gray-600">
                      Author: {book.authors?.[0]?.name || "Unknown"}
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
            </div>
          );
        })}

        {loading && (
          <div className="space-y-12">
            {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
              <div key={idx}>
                <h2 className="text-3xl font-semibold text-green-600 mb-4">
                  Loading...
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
