"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function NotFound() {
  const numRef = useRef(null);
  const containerRef = useRef(null);

  /* GSAP glitch / jitter on the 404 */
  useEffect(() => {
    const el = numRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, scale: 0.4, y: 40 },
        { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "back.out(2)", delay: 0.1 }
      );
      /* periodic glitch */
      gsap.to(el, {
        x: "random(-4, 4)",
        skewX: "random(-3, 3)",
        duration: 0.08,
        repeat: -1,
        repeatDelay: 2.5,
        yoyo: true,
        ease: "none",
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex min-h-screen flex-col items-center justify-center gap-5 bg-white px-4 text-center dark:bg-gray-950"
    >
      {/* Animated 404 */}
      <p
        ref={numRef}
        className="font-lato text-8xl md:text-9xl font-extrabold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent select-none"
      >
        404
      </p>

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
        className="max-w-md text-gray-500 dark:text-gray-400 font-lato"
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
