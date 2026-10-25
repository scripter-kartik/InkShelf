import { Suspense } from "react";
import FreeLibrary from "./FreeLibrary";

export const metadata = {
  title: "Free Library",
  description:
    "Read 75,000+ classic books in full, free forever — Pride and Prejudice, Sherlock Holmes, Frankenstein and more, right in your browser.",
};

export default function FreeLibraryPage() {
  return (
    <Suspense fallback={null}>
      <FreeLibrary />
    </Suspense>
  );
}
