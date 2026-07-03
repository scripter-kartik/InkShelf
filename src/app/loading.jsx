export default function Loading() {
    return (<div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-400 border-t-transparent"/>
        <p className="font-lato text-gray-500">Loading InkShelf…</p>
      </div>
    </div>);
}
