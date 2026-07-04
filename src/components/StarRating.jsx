"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import gsap from "gsap";

const LABELS = {
  0: "Click to rate",
  1: "Hated it",
  2: "Disliked it",
  3: "It was OK",
  4: "Liked it",
  5: "Loved it! ⭐",
};

export default function StarRating({ rating, onChange, disabled }) {
  const [hoverRating, setHoverRating] = useState(0);
  const starRefs = useRef([]);

  const activeRating = hoverRating || rating;

  const handleClick = (star) => {
    const el = starRefs.current[star - 1];
    if (el) {
      gsap.fromTo(
        el,
        { scale: 0.6, rotate: -20 },
        {
          scale: 1,
          rotate: 0,
          duration: 0.35,
          ease: "back.out(2.5)",
        }
      );
    }
    onChange(star);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Your Rating
      </span>
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= activeRating;
            return (
              <motion.button
                key={star}
                ref={(el) => (starRefs.current[star - 1] = el)}
                type="button"
                disabled={disabled}
                onClick={() => handleClick(star)}
                onMouseEnter={() => setHoverRating(star)}
                whileHover={!disabled ? { scale: 1.25, rotate: 5 } : {}}
                whileTap={!disabled ? { scale: 0.85 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Rate ${star} out of 5 stars`}
              >
                <Star
                  className={`h-7 w-7 transition-colors duration-200 ${
                    isFilled
                      ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                      : "text-gray-300 dark:text-gray-600 hover:text-amber-300"
                  }`}
                />
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.span
            key={activeRating}
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-medium text-gray-600 dark:text-gray-300 min-w-[80px]"
          >
            {LABELS[activeRating]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
