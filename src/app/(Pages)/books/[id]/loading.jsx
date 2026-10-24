import Navbar from "@/app/components/Navbar";

export default function BookDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-ink-950">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6" aria-busy="true" aria-label="Loading book">
        <div className="mb-6 h-4 w-28 rounded bg-gray-200 dark:bg-ink-800 animate-pulse" />

        <div className="grid gap-8 md:grid-cols-[260px_1fr]">
          <div className="mx-auto w-full max-w-[260px] flex flex-col gap-4">
            <div className="aspect-[2/3] w-full rounded-2xl bg-gray-200 dark:bg-ink-800 animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-gray-200 dark:bg-ink-800 animate-pulse" />
              <div className="h-3 w-32 rounded bg-gray-200 dark:bg-ink-800 animate-pulse" />
              <div className="h-3 w-16 rounded bg-gray-200 dark:bg-ink-800 animate-pulse" />
            </div>
            <div className="h-8 w-full rounded-xl bg-gray-200 dark:bg-ink-800 animate-pulse" />
          </div>

          <div>
            <div className="h-10 w-3/4 rounded-lg bg-gray-200 dark:bg-ink-800 animate-pulse" />
            <div className="mt-3 h-5 w-1/3 rounded bg-gray-200 dark:bg-ink-800 animate-pulse" />

            <div className="mt-6 flex gap-3">
              <div className="h-11 w-32 rounded-full bg-gray-200 dark:bg-ink-800 animate-pulse" />
              <div className="h-11 w-40 rounded-full bg-gray-200 dark:bg-ink-800 animate-pulse" />
            </div>
            <div className="mt-6 flex gap-3">
              <div className="h-12 w-48 rounded-full bg-green-200 dark:bg-green-900/40 animate-pulse" />
              <div className="h-12 w-44 rounded-full bg-gray-200 dark:bg-ink-800 animate-pulse" />
            </div>

            <div className="mt-8 h-6 w-40 rounded bg-gray-200 dark:bg-ink-800 animate-pulse" />
            <div className="mt-4 space-y-2">
              {[100, 95, 98, 90, 70].map((w, i) => (
                <div
                  key={i}
                  className="h-3 rounded bg-gray-200 dark:bg-ink-800 animate-pulse"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
