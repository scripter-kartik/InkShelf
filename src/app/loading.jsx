"use client";
import { motion } from "framer-motion";

const DOTS = ["bg-green-400", "bg-green-500", "bg-green-600"];

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white dark:bg-ink-950">
      <motion.div
        className="text-6xl select-none"
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        📚
      </motion.div>

      <div className="flex items-center gap-2">
        {DOTS.map((color, i) => (
          <motion.div
            key={color}
            className={`w-3 h-3 rounded-full ${color}`}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
          />
        ))}
      </div>

      <p className="font-lato text-sm text-gray-500 dark:text-ink-400">Loading InkShelf…</p>
    </div>
  );
}
