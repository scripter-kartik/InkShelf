"use client";
import { Suspense } from "react";
import SearchedBooksPage from "./SearchedBooksPage";
export default function Page() {
    return (<Suspense fallback={<div className="p-6 text-center">Loading search results...</div>}>
      <SearchedBooksPage />
    </Suspense>);
}
