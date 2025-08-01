"use client";

import { Suspense } from "react";
import GenrePageContent from "./GenrePageContent";

export default function GenrePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <GenrePageContent />
    </Suspense>
  );
}
