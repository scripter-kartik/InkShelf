"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { coverUrl } from "@/lib/openlibrary";
import { SHELF_STATUSES } from "@/lib/constants";
import { useToast } from "@/components/ToastProvider";
import { Heart, Trash2, Star, BookOpen, Library } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Navbar from "@/app/components/Navbar";
import gsap from "gsap";

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.95 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      delay: i * 0.06,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.88,
    y: -16,
    transition: { duration: 0.25 },
  },
};

const tabVariants = {
  inactive: { scale: 1 },
  active: { scale: 1.05 },
};

export default function MyBooks({ mode }) {
  const isFavorites = mode === "favorites";
  const { status } = useSession();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbMissing, setDbMissing] = useState(false);
  const [tab, setTab] = useState("all");
  const headerRef = useRef(null);

  /* GSAP header entrance */
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.1 }
    );
  }, []);

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
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, isFavorites]);

  const remove = async (bookKey) => {
    setItems((prev) => prev.filter((i) => i.bookKey !== bookKey));
    try {
      await fetch(`/api/shelf?bookKey=${encodeURIComponent(bookKey)}`, {
        method: "DELETE",
      });
      toast("Removed from shelf", "success");
    } catch {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div ref={headerRef}>
          <h1 className="mb-2 font-winky text-3xl font-extrabold text-gray-900 dark:text-white">
            {title}
          </h1>
          {!loading && items.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 font-lato mb-6">
              {items.length} book{items.length !== 1 ? "s" : ""} on your {isFavorites ? "favorites" : "shelf"}
            </p>
          )}
        </div>

        {status === "unauthenticated" ? (
          <EmptyState
            icon={<Library className="w-12 h-12 text-gray-400" />}
            message="Log in to see your saved books."
            hint="Use the Log In button in the navigation bar."
          />
        ) : dbMissing ? (
          <EmptyState
            icon={<BookOpen className="w-12 h-12 text-gray-400" />}
            message="Connect a database to enable saved books."
            hint="Set MONGODB_URI in your environment, then restart."
          />
        ) : loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white dark:bg-gray-800 p-3 shadow-md animate-pulse">
                <div className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-2 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-12 h-12 text-gray-400" />}
            message={isFavorites ? "You haven't favorited any books yet." : "Your shelf is empty."}
            hint='Browse books and tap the heart or "Add to shelf".'
            cta
          />
        ) : (
          <>
            {/* Tab strip */}
            {!isFavorites && (
              <div className="mb-6 flex flex-wrap gap-2">
                {[
                  { label: "All", value: "all" },
                  ...SHELF_STATUSES,
                  { label: "Notes & Reviews", value: "notes" },
                ].map((s) => (
                  <Tab
                    key={s.value}
                    label={s.label}
                    value={s.value}
                    tab={tab}
                    setTab={setTab}
                  />
                ))}
              </div>
            )}

            <AnimatePresence mode="popLayout">
              <motion.div
                layout
                className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
              >
                <AnimatePresence mode="popLayout">
                  {visible.map((item, i) => (
                    <motion.div
                      key={item.bookKey}
                      layout
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      whileHover={{ y: -5, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                      className="group relative rounded-xl bg-white p-3 shadow-md dark:bg-gray-800 hover:shadow-xl transition-shadow duration-300"
                    >
                      <Link href={`/books/${item.bookKey}`}>
                        {coverUrl(item.coverId) ? (
                          <div className="overflow-hidden rounded-lg">
                            <motion.img
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.4 }}
                              src={coverUrl(item.coverId)}
                              alt={`Cover of ${item.title}`}
                              className="h-48 w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-48 w-full items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <h3 className="mt-2 line-clamp-2 text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="line-clamp-1 text-xs text-gray-500">{item.author}</p>
                      </Link>

                      <div className="mt-1 flex items-center justify-between">
                        {item.favorite && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                          >
                            <Heart className="h-4 w-4 text-red-500" fill="currentColor" />
                          </motion.div>
                        )}
                        {!isFavorites && item.status && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            {SHELF_STATUSES.find((s) => s.value === item.status)?.label}
                          </span>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => remove(item.bookKey)}
                          aria-label="Remove"
                          className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </div>

                      {item.rating > 0 && (
                        <div className="mt-2 flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <motion.div
                              key={star}
                              initial={{ scale: 0, rotate: -30 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: star * 0.05, type: "spring", stiffness: 300 }}
                            >
                              <Star
                                className={`h-3.5 w-3.5 ${
                                  star <= item.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300 dark:text-gray-600"
                                }`}
                              />
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {!isFavorites && item.status === "reading" && item.progress > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Progress</span>
                            <span>{item.progress}%</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.progress}%` }}
                              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                              className="h-full rounded-full bg-green-500"
                            />
                          </div>
                        </div>
                      )}

                      {item.notes && (
                        <div className="mt-2 border-t border-gray-100 pt-2 dark:border-gray-700">
                          <p className="line-clamp-2 text-xs italic text-gray-600 dark:text-gray-400">
                            &ldquo;{item.notes}&rdquo;
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

function Tab({ label, value, tab, setTab }) {
  const active = tab === value;
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => setTab(value)}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors relative ${
        active
          ? "bg-green-500 text-black shadow-md"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      }`}
    >
      {active && (
        <motion.div
          layoutId="tab-bg"
          className="absolute inset-0 rounded-full bg-green-500"
          style={{ zIndex: -1 }}
        />
      )}
      {label}
    </motion.button>
  );
}

function EmptyState({ icon, message, hint, cta }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        className="mx-auto mb-4 w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
      >
        {icon}
      </motion.div>
      <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 font-winky">{message}</p>
      {hint && <p className="mt-2 text-sm text-gray-500">{hint}</p>}
      {cta && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/books"
            className="mt-5 inline-block rounded-full bg-green-500 px-7 py-2.5 font-semibold text-black hover:bg-green-600 shadow-lg"
          >
            Browse books
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
