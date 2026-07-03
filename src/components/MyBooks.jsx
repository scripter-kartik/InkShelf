"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Heart, Trash2, Star } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import { coverUrl } from "@/lib/openlibrary";
import { SHELF_STATUSES } from "@/lib/constants";
import { useToast } from "@/components/ToastProvider";
export default function MyBooks({ mode }) {
    const isFavorites = mode === "favorites";
    const { status } = useSession();
    const { toast } = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dbMissing, setDbMissing] = useState(false);
    const [tab, setTab] = useState("all");
    useEffect(() => {
        if (status !== "authenticated") {
            setLoading(false);
            return;
        }
        const url = isFavorites ? "/api/shelf?favorite=true" : "/api/shelf";
        fetch(url)
            .then(async (r) => {
            if (r.status === 503) {
                setDbMissing(true);
                return { items: [] };
            }
            return r.ok ? r.json() : { items: [] };
        })
            .then(({ items }) => setItems(items || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [status, isFavorites]);
    const remove = async (bookKey) => {
        setItems((prev) => prev.filter((i) => i.bookKey !== bookKey));
        try {
            await fetch(`/api/shelf?bookKey=${encodeURIComponent(bookKey)}`, {
                method: "DELETE",
            });
            toast("Removed", "success");
        }
        catch {
            toast("Couldn't remove", "error");
        }
    };
    const visible = isFavorites
        ? items
        : tab === "all"
            ? items
            : tab === "notes"
                ? items.filter((i) => i.rating > 0 || i.notes)
                : items.filter((i) => i.status === tab);
    const title = isFavorites ? "Your Favorites" : "My Shelf";
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 font-lato text-3xl font-extrabold text-gray-900 dark:text-white">
          {title}
        </h1>

        {status === "unauthenticated" ? (<EmptyState message="Log in to see your saved books." hint="Use the Log In button in the navigation bar."/>) : dbMissing ? (<EmptyState message="Connect a database to enable saved books." hint="Set MONGODB_URI in your environment, then restart the app."/>) : loading ? (<p className="text-gray-500">Loading…</p>) : items.length === 0 ? (<EmptyState message={isFavorites
                ? "You haven't favorited any books yet."
                : "Your shelf is empty."} hint="Browse books and tap the heart or “Add to shelf”." cta/>) : (<>
            {!isFavorites && (<div className="mb-6 flex flex-wrap gap-2">
                <Tab label="All" value="all" tab={tab} setTab={setTab}/>
                {SHELF_STATUSES.map((s) => (<Tab key={s.value} label={s.label} value={s.value} tab={tab} setTab={setTab}/>))}
                <Tab label="Notes & Reviews" value="notes" tab={tab} setTab={setTab}/>
              </div>)}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((item, i) => (<motion.div key={item.bookKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }} whileHover={{ y: -4 }} className="group relative rounded-xl bg-white p-3 shadow-md dark:bg-gray-800 hover:shadow-xl transition-shadow duration-300">
                  <Link href={`/books/${item.bookKey}`}>
                    {coverUrl(item.coverId) ? (<img src={coverUrl(item.coverId)} alt={`Cover of ${item.title}`} className="h-48 w-full rounded object-cover"/>) : (<div className="flex h-48 w-full items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
                        <span className="text-sm text-gray-500">No Cover</span>
                      </div>)}
                    <h3 className="mt-2 line-clamp-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.title}
                    </h3>
                    <p className="line-clamp-1 text-xs text-gray-500">
                      {item.author}
                    </p>
                  </Link>

                  <div className="mt-1 flex items-center justify-between">
                    {item.favorite && (<Heart className="h-4 w-4 text-red-500" fill="currentColor"/>)}
                    {!isFavorites && item.status && (<span className="text-xs text-green-600 dark:text-green-400">
                        {SHELF_STATUSES.find((s) => s.value === item.status)?.label}
                      </span>)}
                    <button onClick={() => remove(item.bookKey)} aria-label="Remove" className="ml-auto text-gray-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4"/>
                    </button>
                  </div>

                  
                  {item.rating > 0 && (<div className="mt-2 flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (<Star key={star} className={`h-3.5 w-3.5 ${star <= item.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300 dark:text-gray-600"}`}/>))}
                    </div>)}

                  
                  {!isFavorites && item.status === "reading" && item.progress > 0 && (<div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Progress</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${item.progress}%` }}/>
                      </div>
                    </div>)}

                  
                  {item.notes && (<div className="mt-2 border-t border-gray-100 pt-2 dark:border-gray-700">
                      <p className="line-clamp-2 text-xs italic text-gray-600 dark:text-gray-400">
                        &ldquo;{item.notes}&rdquo;
                      </p>
                    </div>)}
                </motion.div>))}
            </div>
          </>)}
      </div>
    </div>);
}
function Tab({ label, value, tab, setTab }) {
    const active = tab === value;
    return (<button onClick={() => setTab(value)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${active
            ? "bg-green-500 text-black"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300"}`}>
      {label}
    </button>);
}
function EmptyState({ message, hint, cta }) {
    return (<div className="rounded-xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
      <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
        {message}
      </p>
      {hint && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
      {cta && (<Link href="/books" className="mt-4 inline-block rounded-full bg-green-500 px-6 py-2 font-semibold text-black hover:bg-green-600">
          Browse books
        </Link>)}
    </div>);
}
