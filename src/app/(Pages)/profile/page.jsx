"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import gsap from "gsap";
import { Library, Heart, BookOpen, TrendingUp } from "lucide-react";
import Navbar from "@/app/components/Navbar";

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
  const avatarRef = useRef(null);
  const ringRef = useRef(null);

  /* GSAP avatar pulse ring */
  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;
    const ctx = gsap.context(() => {
      gsap.to(ring, {
        scale: 1.18,
        opacity: 0,
        duration: 1.4,
        repeat: -1,
        ease: "power2.out",
      });
    });
    return () => ctx.revert();
  }, []);

  /* GSAP avatar pop-in */
  useEffect(() => {
    const el = avatarRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { scale: 0.5, opacity: 0, rotate: -10 },
      { scale: 1, opacity: 1, rotate: 0, duration: 0.7, ease: "back.out(1.7)", delay: 0.1 }
    );
  }, [status]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {status === "unauthenticated" ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center"
          >
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 font-winky">
              You&apos;re not logged in.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => signIn()}
              className="mt-5 rounded-full bg-green-500 px-7 py-2.5 font-semibold text-black hover:bg-green-600 shadow-lg"
            >
              Log in
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Avatar + name */}
            <div className="flex items-center gap-5 mb-10">
              <div className="relative flex-shrink-0">
                <div
                  ref={ringRef}
                  className="absolute inset-0 rounded-full border-4 border-green-400"
                  style={{ transformOrigin: "center" }}
                />
                <motion.img
                  ref={avatarRef}
                  src={session?.user?.image || "/icon.png"}
                  alt=""
                  className="h-20 w-20 rounded-full border-2 border-white dark:border-gray-800 object-cover shadow-lg"
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
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {session?.user?.email}
                </p>
              </motion.div>
            </div>

            {/* Stats header */}
            <motion.h2
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.45 }}
              className="mb-4 text-xl font-bold text-gray-900 dark:text-white font-winky flex items-center gap-2"
            >
              <TrendingUp className="w-5 h-5 text-green-500" />
              Reading stats
            </motion.h2>

            {/* Stat cards */}
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
                  className="rounded-2xl bg-white dark:bg-gray-800 p-5 text-center shadow-md hover:shadow-xl transition-shadow"
                >
                  <AnimatedNumber
                    value={loading ? 0 : s.value}
                    className={`text-3xl font-extrabold ${s.color}`}
                  />
                  <p className="mt-1 text-xs text-gray-500 font-lato">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA buttons */}
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
                  className="flex items-center gap-2 rounded-full border-2 border-gray-400 px-6 py-2.5 font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
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

/* Animated counter using GSAP */
function AnimatedNumber({ value, className }) {
  const ref = useRef(null);
  const obj = useRef({ n: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.to(obj.current, {
        n: value,
        duration: 1.2,
        ease: "power3.out",
        onUpdate: () => {
          el.textContent = Math.round(obj.current.n);
        },
      });
    });
    return () => ctx.revert();
  }, [value]);

  return <p ref={ref} className={className}>0</p>;
}
