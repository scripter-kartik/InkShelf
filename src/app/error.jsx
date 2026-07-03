"use client";
import { useEffect } from "react";
export default function Error({ error, reset }) {
    useEffect(() => {
        console.error(error);
    }, [error]);
    return (<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center dark:bg-gray-950">
      <h1 className="font-lato text-4xl font-extrabold text-gray-900 dark:text-white">
        Something went wrong
      </h1>
      <p className="max-w-md text-gray-500">
        An unexpected error occurred while loading this page. You can try again.
      </p>
      <button onClick={reset} className="rounded-full bg-green-500 px-6 py-2.5 font-semibold text-black hover:bg-green-600">
        Try again
      </button>
    </div>);
}
