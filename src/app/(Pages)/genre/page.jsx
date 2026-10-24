import { Suspense } from "react";
import GenrePageContent from "./GenrePageContent";
import { GENRES } from "@/lib/constants";

export async function generateMetadata({ searchParams }) {
  const { name } = await searchParams;
  const slug = typeof name === "string" ? name : "";
  const label =
    GENRES.find((g) => g.slug === slug)?.label ||
    slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: label ? `${label} books` : "Browse by genre",
    description: label
      ? `Discover ${label.toLowerCase()} books on InkShelf — browse, shelve, and read free classics.`
      : "Browse books by genre on InkShelf.",
  };
}

export default function GenrePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <GenrePageContent />
    </Suspense>
  );
}
