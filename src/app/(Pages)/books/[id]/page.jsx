import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import BookDetailClient from "./BookDetailClient";
import { fetchWorkDetail, coverUrl } from "@/lib/openlibrary";

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const book = await fetchWorkDetail(id);
    return {
      title: book.title,
      description:
        book.description?.slice(0, 155) ||
        `${book.title} by ${book.author} on InkShelf.`,
      openGraph: {
        title: book.title,
        images: coverUrl(book.coverId, "L") ? [coverUrl(book.coverId, "L")] : [],
      },
    };
  } catch {
    return { title: "Book" };
  }
}

export default async function BookDetailPage({ params }) {
  const { id } = await params;
  let book;
  try {
    book = await fetchWorkDetail(id);
  } catch {
    notFound();
  }

  const cover = coverUrl(book.coverId, "L");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <BookDetailClient book={book} cover={cover} />
    </div>
  );
}
