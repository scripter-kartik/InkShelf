"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Loading() {
  const bookRef = useRef(null);
  const dot1 = useRef(null);
  const dot2 = useRef(null);
  const dot3 = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* Pulsing book icon */
      if (bookRef.current) {
        gsap.to(bookRef.current, {
          scale: 1.12,
          duration: 0.7,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
      /* Staggered dots */
      const dots = [dot1.current, dot2.current, dot3.current].filter(Boolean);
      gsap.to(dots, {
        y: -10,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        stagger: 0.15,
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white dark:bg-gray-950">
      {/* Book icon */}
      <div ref={bookRef} className="text-6xl select-none">📚</div>

      {/* Bouncing dots */}
      <div className="flex items-center gap-2">
        <div ref={dot1} className="w-3 h-3 rounded-full bg-green-400" />
        <div ref={dot2} className="w-3 h-3 rounded-full bg-green-500" />
        <div ref={dot3} className="w-3 h-3 rounded-full bg-green-600" />
      </div>

      <p className="font-lato text-sm text-gray-500 dark:text-gray-400">
        Loading InkShelf…
      </p>
    </div>
  );
}
