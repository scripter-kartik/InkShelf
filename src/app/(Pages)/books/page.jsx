"use client";

import { useEffect, useState } from "react";
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
];

export default function Page() {
  const [booksCollection, setBooksCollection] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchBooksByCategories(categories);
        setBooksCollection(result);
      } catch (error) {
        console.log(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen w-[calc(100vw - 16px)] overflow-x-hidden">
      <Navbar query={query} setQuery={setQuery} />
      <div className="p-2 md:p-6 space-y-12">
        {loading
          ? categories.map((cat, idx) => (
              <div key={idx}>
                <h2 className="text-3xl font-semibold text-green-600 mb-4">
                  {cat.label}
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
            ))
          : booksCollection.map(({ category, books }, idx) => (
              <div key={idx} className=" bg-green-400 rounded-lg p-4">
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
            ))}
      </div>
    </div>
  );
}
