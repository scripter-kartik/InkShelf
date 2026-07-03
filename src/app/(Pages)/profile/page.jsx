"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import Navbar from "@/app/components/Navbar";
export default function ProfilePage() {
    const { data: session, status } = useSession();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (status !== "authenticated") {
            setLoading(false);
            return;
        }
        fetch("/api/shelf")
            .then((r) => (r.ok ? r.json() : { items: [] }))
            .then(({ items }) => setItems(items || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [status]);
    const stats = {
        total: items.length,
        favorites: items.filter((i) => i.favorite).length,
        want: items.filter((i) => i.status === "want").length,
        reading: items.filter((i) => i.status === "reading").length,
        read: items.filter((i) => i.status === "read").length,
    };
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {status === "unauthenticated" ? (<div className="rounded-xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
              You&apos;re not logged in.
            </p>
            <button onClick={() => signIn()} className="mt-4 rounded-full bg-green-500 px-6 py-2 font-semibold text-black hover:bg-green-600">
              Log in
            </button>
          </div>) : (<>
            <div className="flex items-center gap-4">
              
              <img src={session?.user?.image || "/icon.png"} alt="" className="h-20 w-20 rounded-full border object-cover"/>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {session?.user?.name || "Reader"}
                </h1>
                <p className="text-gray-500">{session?.user?.email}</p>
              </div>
            </div>

            <h2 className="mb-4 mt-10 text-xl font-bold text-gray-900 dark:text-white">
              Reading stats
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard label="On shelf" value={loading ? "…" : stats.total}/>
              <StatCard label="Favorites" value={loading ? "…" : stats.favorites}/>
              <StatCard label="Want to Read" value={loading ? "…" : stats.want}/>
              <StatCard label="Reading" value={loading ? "…" : stats.reading}/>
              <StatCard label="Read" value={loading ? "…" : stats.read}/>
            </div>

            <div className="mt-10 flex gap-4">
              <Link href="/shelf" className="rounded-full bg-green-500 px-6 py-2 font-semibold text-black hover:bg-green-600">
                My Shelf
              </Link>
              <Link href="/favorites" className="rounded-full border-2 border-gray-400 px-6 py-2 font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                Favorites
              </Link>
            </div>
          </>)}
      </div>
    </div>);
}
function StatCard({ label, value }) {
    return (<div className="rounded-xl bg-white p-5 text-center shadow-sm dark:bg-gray-800">
      <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">
        {value}
      </p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>);
}
