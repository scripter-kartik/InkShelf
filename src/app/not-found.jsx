import Link from "next/link";
export default function NotFound() {
    return (<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center dark:bg-gray-950">
      <p className="font-lato text-7xl font-extrabold text-green-500">404</p>
      <h1 className="font-lato text-3xl font-extrabold text-gray-900 dark:text-white">
        Page not found
      </h1>
      <p className="max-w-md text-gray-500">
        We couldn&apos;t find the page or book you were looking for.
      </p>
      <Link href="/" className="rounded-full bg-green-500 px-6 py-2.5 font-semibold text-black hover:bg-green-600">
        Back home
      </Link>
    </div>);
}
