import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ExternalLink } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import ShelfControls from "@/components/ShelfControls";
import { fetchWorkDetail, coverUrl } from "@/lib/openlibrary";
export async function generateMetadata({ params }) {
    const { id } = await params;
    try {
        const book = await fetchWorkDetail(id);
        return {
            title: book.title,
            description: book.description?.slice(0, 155) ||
                `${book.title} by ${book.author} on InkShelf.`,
            openGraph: {
                title: book.title,
                images: coverUrl(book.coverId, "L") ? [coverUrl(book.coverId, "L")] : [],
            },
        };
    }
    catch {
        return { title: "Book" };
    }
}
export default async function BookDetailPage({ params }) {
    const { id } = await params;
    let book;
    try {
        book = await fetchWorkDetail(id);
    }
    catch {
        notFound();
    }
    const cover = coverUrl(book.coverId, "L");
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link href="/books" className="mb-6 inline-block text-sm text-green-600 hover:underline dark:text-green-400">
          ← Back to browse
        </Link>

        <div className="grid gap-8 md:grid-cols-[240px_1fr]">
          
          <div className="mx-auto w-full max-w-[240px]">
            {cover ? (<img src={cover} alt={`Cover of ${book.title}`} className="w-full rounded-lg shadow-lg"/>) : (<div className="flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-800">
                <span className="text-gray-500">No Cover</span>
              </div>)}
          </div>

          
          <div>
            <h1 className="font-lato text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              {book.title}
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
              by {book.author}
            </p>
            {book.firstPublishYear && (<p className="mt-1 text-sm text-gray-500">
                First published {book.firstPublishYear}
              </p>)}

            <div className="mt-6">
              <ShelfControls book={book}/>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {book.readUrl && (<a href={book.readUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-2.5 font-semibold text-black hover:bg-green-600">
                  <BookOpen className="h-5 w-5"/> Read / Borrow
                </a>)}
              <a href={book.readUrl || `https://books.google.com/books?id=${book.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border-2 border-gray-400 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                <ExternalLink className="h-5 w-5"/> View on Google Books
              </a>
            </div>

            {book.description && (<div className="mt-8">
                <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                  About this book
                </h2>
                <p className="whitespace-pre-line leading-relaxed text-gray-700 dark:text-gray-300">
                  {book.description}
                </p>
              </div>)}

            {book.subjects?.length > 0 && (<div className="mt-8">
                <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                  Subjects
                </h2>
                <div className="flex flex-wrap gap-2">
                  {book.subjects.map((s) => (<span key={s} className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-900/40 dark:text-green-200">
                      {s}
                    </span>))}
                </div>
              </div>)}
          </div>
        </div>
      </div>
    </div>);
}
