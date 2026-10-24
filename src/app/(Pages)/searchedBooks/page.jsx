import { Suspense } from "react";
import SearchedBooksPage from "./SearchedBooksPage";

export async function generateMetadata({ searchParams }) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 80) : "";
  return {
    title: query ? `“${query}” — Search` : "Search",
    robots: { index: false },
  };
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading search results...</div>}>
      <SearchedBooksPage />
    </Suspense>
  );
}
