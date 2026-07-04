"use client";
import Link from "next/link";
import { useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { BookOpen } from "lucide-react";
import { coverUrl, workId } from "@/lib/openlibrary";

export default function BookCard({ book }) {
  const id = workId(book.key);
  const cover = coverUrl(book.cover_id ?? book.cover_i, "M");
  const author =
    book.authors?.[0]?.name ||
    book.author_name?.[0] ||
    book.author ||
    "Unknown";

  const imgRef = useRef(null);
  const cardRef = useRef(null);

  /* GSAP 3D tilt on mouse move */
  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);

    gsap.to(el, {
      rotateY: x * 8,
      rotateX: -y * 6,
      duration: 0.4,
      ease: "power2.out",
      transformPerspective: 600,
    });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.5,
      ease: "power3.out",
    });
  };

  return (
    <motion.div
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 320, damping: 22 } }}
      whileTap={{ scale: 0.97 }}
      className="h-full"
    >
      <Link
        href={`/books/${id}`}
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group flex flex-col h-full rounded-2xl bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 overflow-hidden"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Cover */}
        <div className="relative w-full aspect-[2/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
          {cover ? (
            <motion.img
              ref={imgRef}
              src={cover}
              alt={`Cover of ${book.title}`}
              loading="lazy"
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.07 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <BookOpen className="w-8 h-8 text-gray-400" />
              <span className="text-xs text-gray-400 text-center px-2">No Cover</span>
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Text */}
        <div className="p-2.5 flex flex-col gap-0.5 flex-1">
          <h3 className="line-clamp-2 text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors leading-snug">
            {book.title}
          </h3>
          <p className="line-clamp-1 text-[10px] text-gray-500 dark:text-gray-400">
            {author}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
