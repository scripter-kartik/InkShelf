"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Library, Heart, BookOpen, TrendingUp } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import AuthModal from "@/components/AuthModal";

const statVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.9 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.15 + i * 0.08,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState(null);
  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    fetch("/api/shelf")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then(({ items }) => setItems(items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  const stats = {
    total: items.length,
    favorites: items.filter((i) => i.favorite).length,
    want: items.filter((i) => i.status === "want").length,
    reading: items.filter((i) => i.status === "reading").length,
    read: items.filter((i) => i.status === "read").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-ink-950">
      <Navbar />
      {authMode && (
        <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSwitch={setAuthMode} />
      )}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {status === "unauthenticated" ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-ink-700 p-12 text-center"
          >
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gray-100 dark:bg-ink-800 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-700 dark:text-ink-200 font-winky">
              You&apos;re not logged in.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setAuthMode("login")}
              className="mt-5 rounded-full bg-green-500 px-7 py-2.5 font-semibold text-black hover:bg-green-600 shadow-lg"
            >
              Log in
            </motion.button>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center gap-5 mb-10">
              <div className="relative flex-shrink-0">
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-green-400"
                  animate={{ scale: [1, 1.18], opacity: [1, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.img
                  key={status}
                  initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.7, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                  src={session?.user?.image || "/icon.png"}
                  alt=""
                  className="h-20 w-20 rounded-full border-2 border-white dark:border-ink-800 object-cover shadow-lg"
                />
              </div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white font-winky">
                  {session?.user?.name || "Reader"}
                </h1>
                <p className="text-sm text-gray-500 dark:text-ink-400">
                  {session?.user?.email}
                </p>
              </motion.div>
            </div>

            <motion.h2
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.45 }}
              className="mb-4 text-xl font-bold text-gray-900 dark:text-white font-winky flex items-center gap-2"
            >
              <TrendingUp className="w-5 h-5 text-green-500" />
              Reading stats
            </motion.h2>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { label: "On shelf", value: stats.total, color: "text-blue-600 dark:text-blue-400" },
                { label: "Favorites", value: stats.favorites, color: "text-red-500" },
                { label: "Want to Read", value: stats.want, color: "text-amber-500" },
                { label: "Reading", value: stats.reading, color: "text-green-600 dark:text-green-400" },
                { label: "Read", value: stats.read, color: "text-purple-600 dark:text-purple-400" },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  custom={i}
                  variants={statVariants}
                  initial="hidden"
                  animate="show"
                  whileHover={{ y: -4, transition: { type: "spring", stiffness: 300 } }}
                  className="rounded-2xl bg-white dark:bg-ink-800 p-5 text-center shadow-md hover:shadow-xl transition-shadow"
                >
                  <AnimatedNumber
                    value={loading ? 0 : s.value}
                    className={`text-3xl font-extrabold ${s.color}`}
                  />
                  <p className="mt-1 text-xs text-gray-500 font-lato">{s.label}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.45 }}
              className="mt-10 flex gap-4"
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/shelf"
                  className="flex items-center gap-2 rounded-full bg-green-500 px-6 py-2.5 font-semibold text-black hover:bg-green-600 shadow-md"
                >
                  <Library className="w-4 h-4" />
                  My Shelf
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/favorites"
                  className="flex items-center gap-2 rounded-full border-2 border-gray-400 px-6 py-2.5 font-semibold text-gray-700 hover:bg-gray-100 dark:text-ink-200 dark:hover:bg-ink-800"
                >
                  <Heart className="w-4 h-4" />
                  Favorites
                </Link>
              </motion.div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

function AnimatedNumber({ value, className }) {
  const ref = useRef(null);
  const current = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const controls = animate(current.current, value, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (n) => {
        current.current = n;
        el.textContent = Math.round(n);
      },
    });
    return () => controls.stop();
  }, [value]);

  return <p ref={ref} className={className}>0</p>;
}
