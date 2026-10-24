"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-white px-4 text-center dark:bg-ink-950">
      <motion.div
        animate={{ x: [0, -3, 4, -2, 0], skewX: [0, 2, -3, 1, 0] }}
        transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2.5, delay: 1, ease: "linear" }}
      >
        <motion.p
          initial={{ opacity: 0, scale: 0.4, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
          className="font-lato text-8xl md:text-9xl font-extrabold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent select-none"
        >
          404
        </motion.p>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="font-winky text-3xl font-extrabold text-gray-900 dark:text-white"
      >
        Page not found
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="max-w-md text-gray-500 dark:text-ink-400 font-lato"
      >
        We couldn&apos;t find the page or book you were looking for.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.97 }}
      >
        <Link
          href="/"
          className="inline-block rounded-full bg-green-500 px-7 py-3 font-semibold text-black hover:bg-green-600 shadow-lg shadow-green-500/30 transition-colors"
        >
          ← Back home
        </Link>
      </motion.div>
    </div>
  );
}
