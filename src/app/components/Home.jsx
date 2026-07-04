"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";
import {
  BookOpen,
  Search,
  Heart,
  Star,
  Zap,
  Library,
  Globe,
  Users,
  ArrowRight,
  Sparkles,
  TrendingUp,
  BookMarked,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, TextPlugin);
}

/* ── Static data ──────────────────────────────────────────────────────────── */
const GENRES = [
  { emoji: "🧙‍♂️", label: "Fantasy", color: "from-purple-500 to-indigo-600" },
  { emoji: "🚀", label: "Sci-Fi", color: "from-blue-500 to-cyan-600" },
  { emoji: "🔍", label: "Mystery", color: "from-slate-600 to-gray-800" },
  { emoji: "💕", label: "Romance", color: "from-pink-500 to-rose-600" },
  { emoji: "👻", label: "Horror", color: "from-gray-800 to-black" },
  { emoji: "⚔️", label: "Adventure", color: "from-amber-500 to-orange-600" },
  { emoji: "🧠", label: "Psychology", color: "from-teal-500 to-emerald-600" },
  { emoji: "🏛️", label: "History", color: "from-yellow-600 to-amber-700" },
];

const FEATURES = [
  {
    icon: Search,
    title: "Discover Instantly",
    desc: "Search millions of books, authors, and series in seconds. Our smart engine finds exactly what you're looking for.",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    icon: Library,
    title: "Build Your Shelf",
    desc: "Track what you've read, what you're reading, and what's up next. Your personal library, always with you.",
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-900/20",
  },
  {
    icon: Heart,
    title: "Curate Favorites",
    desc: "Bookmark the books that moved you. Build a collection of your most treasured reads.",
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-900/20",
  },
  {
    icon: Star,
    title: "Rate & Review",
    desc: "Write personal notes, rate books, and track your reading progress — all in one beautifully designed space.",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    icon: Globe,
    title: "Free, Always",
    desc: "No subscription. No paywall. Access millions of books through Google Books — completely free.",
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/20",
  },
  {
    icon: Zap,
    title: "Blazing Fast",
    desc: "Powered by Next.js 16. Every page loads instantly. Smooth, snappy, zero lag. Reading should feel effortless.",
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-900/20",
  },
];

const STATS = [
  { value: "5M+", label: "Books Available", icon: BookOpen },
  { value: "24", label: "Genre Categories", icon: BookMarked },
  { value: "100%", label: "Free Forever", icon: Sparkles },
  { value: "∞", label: "Reading Lists", icon: Library },
];

const TESTIMONIALS = [
  {
    name: "Aanya Sharma",
    handle: "@aanya.reads",
    text: "InkShelf changed how I read. I finally have one place for everything — tracking, reviews, discovery. The design is just stunning.",
    avatar: "🧕",
    stars: 5,
  },
  {
    name: "Rohan Mehta",
    handle: "@rohanbooksclub",
    text: "I've tried Goodreads, StoryGraph — nothing comes close to InkShelf's speed and aesthetic. My whole reading life is here now.",
    avatar: "👨‍💻",
    stars: 5,
  },
  {
    name: "Priya Nair",
    handle: "@priya.pages",
    text: "The genre browsing alone is worth it. I discovered three new authors last week just from exploring the Fantasy section.",
    avatar: "👩‍🎨",
    stars: 5,
  },
];

const MARQUEE_BOOKS = [
  "Dune", "The Hobbit", "1984", "Harry Potter", "The Alchemist",
  "Atomic Habits", "Sapiens", "Thinking Fast and Slow", "The Name of the Wind",
  "Project Hail Mary", "The Way of Kings", "Neuromancer", "Gone Girl",
  "A Game of Thrones", "The Midnight Library", "Where the Crawdads Sing",
];

/* ══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  /* ── Refs ─────────────────────────────────────────────────────────────── */
  const pageRef       = useRef(null);
  const particlesRef  = useRef(null);
  const heroRef       = useRef(null);
  const titleRef      = useRef(null);
  const subtitleRef   = useRef(null);
  const heroImgRef    = useRef(null);
  const scrollLineRef = useRef(null);
  const statsRef      = useRef(null);
  const featuresRef   = useRef(null);
  const genresRef     = useRef(null);
  const marqueeRef    = useRef(null);
  const ctaRef        = useRef(null);
  const testimonialRef= useRef(null);
  const horizRef      = useRef(null);

  /* Framer parallax */
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const parallaxScale = useTransform(scrollYProgress, [0, 0.4], [1, 1.12]);

  /* ── GSAP master setup ────────────────────────────────────────────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {

      /* ── 1. FLOATING PARTICLES ─────────────────────────────────────────── */
      const dots = particlesRef.current?.querySelectorAll(".particle") || [];
      dots.forEach((dot) => {
        gsap.to(dot, {
          y: `random(-60, 60)`,
          x: `random(-50, 50)`,
          rotate: `random(-180, 180)`,
          opacity: `random(0.1, 0.6)`,
          scale: `random(0.5, 1.8)`,
          duration: `random(4, 9)`,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: `random(0, 3)`,
        });
      });

      /* ── 2. HERO TITLE CHARACTER SPLIT ────────────────────────────────── */
      if (titleRef.current) {
        const chars = titleRef.current.querySelectorAll(".char");
        gsap.fromTo(
          chars,
          { opacity: 0, y: 80, rotateX: -90, transformOrigin: "50% 50% -30px" },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.7,
            stagger: 0.03,
            ease: "back.out(2)",
            delay: 0.2,
          }
        );
      }

      /* ── 3. SUBTITLE TYPEWRITER ────────────────────────────────────────── */
      if (subtitleRef.current) {
        gsap.fromTo(
          subtitleRef.current,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.01,
            delay: 0.8,
            onComplete: () => {
              gsap.to(subtitleRef.current, {
                text: {
                  value: "Discover · Track · Love Your Books",
                  delimiter: "",
                },
                duration: 1.8,
                ease: "none",
                delay: 0.1,
              });
            },
          }
        );
      }

      /* ── 4. HERO IMAGE PARALLAX (GSAP) ──────────────────────────────────── */
      if (heroImgRef.current) {
        gsap.to(heroImgRef.current, {
          yPercent: 20,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
          },
        });
      }

      /* ── 5. SCROLL PROGRESS LINE ─────────────────────────────────────── */
      if (scrollLineRef.current) {
        gsap.to(scrollLineRef.current, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: pageRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        });
      }

      /* ── 6. STATS COUNT-UP ───────────────────────────────────────────── */
      if (statsRef.current) {
        const cards = statsRef.current.querySelectorAll(".stat-card");
        gsap.fromTo(
          cards,
          { opacity: 0, y: 60, scale: 0.85 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.12,
            ease: "back.out(1.6)",
            scrollTrigger: {
              trigger: statsRef.current,
              start: "top 80%",
            },
          }
        );
        /* Animated numbers */
        statsRef.current.querySelectorAll(".stat-num").forEach((el) => {
          const raw = el.dataset.val;
          if (/^\d+/.test(raw)) {
            const num = parseInt(raw);
            const suffix = raw.replace(/[\d]/g, "");
            const obj = { n: 0 };
            gsap.to(obj, {
              n: num,
              duration: 1.8,
              ease: "power3.out",
              delay: 0.3,
              onUpdate: () => {
                el.textContent = Math.round(obj.n).toLocaleString() + suffix;
              },
              scrollTrigger: {
                trigger: statsRef.current,
                start: "top 80%",
                once: true,
              },
            });
          }
        });
      }

      /* ── 7. FEATURES CARDS STAGGER ───────────────────────────────────── */
      if (featuresRef.current) {
        const cards = featuresRef.current.querySelectorAll(".feature-card");
        gsap.fromTo(
          cards,
          { opacity: 0, y: 80, rotateY: 20 },
          {
            opacity: 1,
            y: 0,
            rotateY: 0,
            duration: 0.65,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: featuresRef.current,
              start: "top 75%",
            },
          }
        );
        /* Floating icon on each card */
        cards.forEach((card) => {
          const icon = card.querySelector(".feature-icon");
          if (icon) {
            gsap.to(icon, {
              y: -8,
              duration: 2,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              delay: Math.random() * 1,
            });
          }
        });
      }

      /* ── 8. GENRE CARDS — SCATTER THEN GRID ─────────────────────────── */
      if (genresRef.current) {
        const cards = genresRef.current.querySelectorAll(".genre-card");
        gsap.fromTo(
          cards,
          {
            opacity: 0,
            scale: 0.3,
            rotation: () => `random(-45, 45)`,
            x: () => `random(-200, 200)`,
            y: () => `random(-100, 100)`,
          },
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            x: 0,
            y: 0,
            duration: 0.8,
            stagger: { amount: 0.8, from: "center" },
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: genresRef.current,
              start: "top 80%",
            },
          }
        );
      }

      /* ── 9. MARQUEE (infinite scroll) ────────────────────────────────── */
      if (marqueeRef.current) {
        const inner = marqueeRef.current.querySelector(".marquee-inner");
        if (inner) {
          gsap.to(inner, {
            xPercent: -50,
            duration: 28,
            repeat: -1,
            ease: "none",
          });
        }
      }

      /* ── 10. TESTIMONIALS SLIDE IN ───────────────────────────────────── */
      if (testimonialRef.current) {
        const cards = testimonialRef.current.querySelectorAll(".testimonial-card");
        gsap.fromTo(
          cards,
          { opacity: 0, x: -80, skewX: -6 },
          {
            opacity: 1,
            x: 0,
            skewX: 0,
            duration: 0.75,
            stagger: 0.18,
            ease: "power3.out",
            scrollTrigger: {
              trigger: testimonialRef.current,
              start: "top 78%",
            },
          }
        );
      }

      /* ── 11. CTA SECTION — EXPLOSIVE ENTRANCE ────────────────────────── */
      if (ctaRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 75%",
          },
        });
        tl.fromTo(
          ctaRef.current.querySelector(".cta-bg"),
          { scaleX: 0, transformOrigin: "left" },
          { scaleX: 1, duration: 0.7, ease: "power4.out" }
        )
          .fromTo(
            ctaRef.current.querySelectorAll(".cta-text"),
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: "power3.out" },
            "-=0.3"
          )
          .fromTo(
            ctaRef.current.querySelectorAll(".cta-btn"),
            { opacity: 0, scale: 0.8 },
            { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: "back.out(2)" },
            "-=0.2"
          );
      }

      /* ── 12. SECTION HEADINGS — UNDERLINE DRAW ───────────────────────── */
      document.querySelectorAll(".section-line").forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0, transformOrigin: "left" },
          {
            scaleX: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              once: true,
            },
          }
        );
      });

      /* ── 13. HORIZONTAL FEATURE ROW SCRUB ────────────────────────────── */
      if (horizRef.current) {
        const items = horizRef.current.querySelectorAll(".horiz-item");
        gsap.fromTo(
          items,
          { opacity: 0, x: 120 },
          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: horizRef.current,
              start: "top 80%",
            },
          }
        );
      }

    }, pageRef);

    return () => ctx.revert();
  }, []);

  /* Character split for hero title */
  const heroTitle = "Hi, we're InkShelf.";
  const chars = heroTitle.split("").map((char, i) => (
    <span
      key={i}
      className="char inline-block"
      style={{ display: char === " " ? "inline" : "inline-block" }}
    >
      {char === " " ? "\u00A0" : char}
    </span>
  ));

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div ref={pageRef} className="relative bg-white dark:bg-gray-950 overflow-x-hidden">

      {/* ── SCROLL PROGRESS BAR ─────────────────────────────────────────── */}
      <div
        ref={scrollLineRef}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 z-[60] origin-left"
        style={{ transform: "scaleX(0)" }}
      />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1 — HERO                                                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Particles */}
        <div ref={particlesRef} className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="particle absolute rounded-full"
              style={{
                width: `${Math.random() * 20 + 4}px`,
                height: `${Math.random() * 20 + 4}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                background: i % 3 === 0
                  ? "rgba(74,222,128,0.15)"
                  : i % 3 === 1
                  ? "rgba(52,211,153,0.12)"
                  : "rgba(16,185,129,0.08)",
              }}
            />
          ))}
        </div>

        {/* Decorative BG image */}
        <motion.img
          ref={heroImgRef}
          src="/Subtract.png"
          alt=""
          className="absolute top-0 right-0 h-full w-auto object-cover z-0 pointer-events-none opacity-60"
          style={{ y: parallaxY }}
        />
        <motion.img
          src="/Bird.png"
          alt=""
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-0 left-0 h-full w-auto object-contain z-0 hidden 2xl:block pointer-events-none opacity-70"
        />

        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(74,222,128,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(74,222,128,0.07),transparent)] pointer-events-none" />

        {/* Hero text */}
        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto flex flex-col items-center gap-7">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "backOut" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-400/40 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm font-medium mb-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Your free reading companion
          </motion.div>

          <h1
            ref={titleRef}
            className="bg-gradient-to-r from-green-400 via-green-500 to-black dark:to-white bg-clip-text text-transparent font-lato font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-tight tracking-tight select-none"
            style={{ perspective: "500px" }}
          >
            {chars}
          </h1>

          <p
            ref={subtitleRef}
            className="text-xl sm:text-2xl font-lato text-gray-600 dark:text-gray-300 font-medium min-h-[2rem]"
          />

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.6 }}
            className="max-w-xl text-base sm:text-lg text-gray-500 dark:text-gray-400 font-light leading-relaxed"
          >
            InkShelf is home to people who love reading. Millions of books,
            zero cost. Everything you need — search, shelve, review — in one
            beautiful place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.55 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/books">
              <motion.button
                whileHover={{ scale: 1.08, boxShadow: "0 16px 48px rgba(74,222,128,0.5)" }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 380, damping: 18 }}
                className="w-52 h-14 bg-green-400 font-lato text-lg font-bold rounded-2xl hover:bg-green-500 transition-colors shadow-xl dark:bg-green-600 dark:text-white flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Start Reading
              </motion.button>
            </Link>
            <Link href="/shelf">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 380, damping: 18 }}
                className="w-52 h-14 border-2 border-gray-900 dark:border-white font-lato text-lg font-bold rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors dark:text-white flex items-center justify-center gap-2"
              >
                <Library className="w-5 h-5" />
                My Shelf
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-gray-400 dark:border-gray-500 flex justify-center pt-1.5"
          >
            <div className="w-1 h-2.5 rounded-full bg-gray-400 dark:bg-gray-500" />
          </motion.div>
          <span className="text-xs text-gray-400 font-lato tracking-widest uppercase">scroll</span>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MARQUEE TICKER                                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="py-5 bg-green-400 dark:bg-green-900/60 overflow-hidden border-y-2 border-black dark:border-green-700">
        <div ref={marqueeRef} className="overflow-hidden">
          <div className="marquee-inner flex gap-12 whitespace-nowrap will-change-transform"
            style={{ width: "200%" }}
          >
            {[...MARQUEE_BOOKS, ...MARQUEE_BOOKS].map((title, i) => (
              <span key={i} className="text-black dark:text-white font-winky text-lg font-semibold flex-shrink-0 flex items-center gap-3">
                <BookOpen className="w-4 h-4 inline-block opacity-60" />
                {title}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2 — STATS                                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold font-winky text-gray-900 dark:text-white">
              InkShelf by the numbers
            </h2>
            <div className="section-line mt-3 h-1 w-24 mx-auto bg-green-400 rounded-full" />
          </div>
          <div
            ref={statsRef}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {STATS.map((s, i) => (
              <div
                key={i}
                className="stat-card rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 p-8 text-center shadow-lg border border-green-100 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-300"
              >
                <s.icon className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <p
                  className="stat-num text-4xl md:text-5xl font-extrabold font-winky text-gray-900 dark:text-white"
                  data-val={s.value}
                >
                  {s.value}
                </p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-lato">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3 — HERO IMAGE FEATURE                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-4 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_50%,rgba(74,222,128,0.1),transparent)] pointer-events-none" />
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div ref={horizRef}>
            <div className="horiz-item mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                Why InkShelf?
              </span>
            </div>
            <h2 className="horiz-item text-3xl md:text-5xl font-extrabold font-winky text-gray-900 dark:text-white leading-tight mb-5">
              Your entire reading life,<br />
              <span className="text-green-500">beautifully organized.</span>
            </h2>
            <p className="horiz-item text-lg text-gray-600 dark:text-gray-300 font-lato leading-relaxed mb-8">
              From the moment you discover a book to the day you finish it — InkShelf is with you. Rate, review, build wishlists, track progress, and explore millions of titles across every genre.
            </p>
            <div className="horiz-item flex flex-col gap-4">
              {[
                { icon: Search, text: "Search millions of books instantly" },
                { icon: BookMarked, text: "Track reading progress to the page" },
                { icon: Heart, text: "Build your perfect favorites list" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-lato">{text}</span>
                </div>
              ))}
            </div>
            <div className="horiz-item mt-10">
              <Link href="/books">
                <motion.button
                  whileHover={{ scale: 1.05, x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-7 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full shadow-lg hover:opacity-90 transition-opacity"
                >
                  Explore books <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 60, rotate: 3 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            whileHover={{ rotate: -1, scale: 1.02 }}
            className="relative rounded-3xl overflow-hidden shadow-2xl"
          >
            <img
              src="/homeImage.jpg"
              alt="Reading"
              className="w-full h-80 md:h-[500px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Currently reading</p>
                  <p className="text-white/70 text-xs">Dune — Frank Herbert</p>
                </div>
                <div className="ml-auto text-white font-bold text-sm">68%</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4 — FEATURES GRID                                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold font-winky text-gray-900 dark:text-white">
              Everything a reader needs
            </h2>
            <div className="section-line mt-3 h-1 w-24 mx-auto bg-green-400 rounded-full" />
            <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto font-lato">
              Built for book lovers, by book lovers.
            </p>
          </div>

          <div
            ref={featuresRef}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -8, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}
                transition={{ type: "spring", stiffness: 280, damping: 20 }}
                className={`feature-card rounded-3xl p-7 border border-gray-100 dark:border-gray-800 ${f.bg} cursor-default`}
              >
                <div className={`feature-icon w-12 h-12 rounded-2xl ${f.bg} border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-5`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold font-winky text-gray-900 dark:text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-lato leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5 — GENRES GRID                                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold font-winky text-gray-900 dark:text-white">
              Explore by genre
            </h2>
            <div className="section-line mt-3 h-1 w-24 mx-auto bg-green-400 rounded-full" />
            <p className="mt-4 text-gray-500 dark:text-gray-400 font-lato text-lg max-w-md mx-auto">
              Twenty-four categories, millions of stories. Find your next obsession.
            </p>
          </div>

          <div
            ref={genresRef}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {GENRES.map((g, i) => (
              <Link key={i} href={`/genre?name=${g.label.toLowerCase().replace(/\s/g, "_")}`}>
                <motion.div
                  className={`genre-card relative rounded-3xl p-6 bg-gradient-to-br ${g.color} text-white text-center overflow-hidden cursor-pointer`}
                  whileHover={{ scale: 1.06, rotate: 1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                  <div className="text-4xl mb-3">{g.emoji}</div>
                  <p className="font-bold font-winky text-sm">{g.label}</p>
                </motion.div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/genre?name=fantasy">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full border-2 border-gray-900 dark:border-white font-semibold font-winky dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                Browse all genres <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 6 — TESTIMONIALS                                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold font-winky text-gray-900 dark:text-white">
              Readers love it
            </h2>
            <div className="section-line mt-3 h-1 w-24 mx-auto bg-green-400 rounded-full" />
          </div>

          <div
            ref={testimonialRef}
            className="grid md:grid-cols-3 gap-6"
          >
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="testimonial-card rounded-3xl bg-gray-50 dark:bg-gray-800 p-7 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-lato leading-relaxed italic mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.handle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 7 — CTA BANNER                                             */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section ref={ctaRef} className="py-24 px-4 relative overflow-hidden">
        <div className="cta-bg absolute inset-0 bg-green-400 dark:bg-green-800" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="cta-text text-4xl md:text-6xl font-extrabold font-winky text-black leading-tight">
            Ready to find your next<br />
            <span className="underline decoration-black/30 decoration-4">favourite book?</span>
          </div>
          <p className="cta-text mt-6 text-lg text-black/70 font-lato max-w-lg mx-auto">
            Millions of books waiting. Zero cost. Join InkShelf and start your reading journey today.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/books">
              <motion.button
                whileHover={{ scale: 1.07, boxShadow: "0 12px 40px rgba(0,0,0,0.2)" }}
                whileTap={{ scale: 0.97 }}
                className="cta-btn w-52 h-14 bg-black text-white font-lato font-bold text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 mx-auto"
              >
                <Zap className="w-5 h-5" />
                Get Started Free
              </motion.button>
            </Link>
            <Link href="/shelf">
              <motion.button
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.97 }}
                className="cta-btn w-52 h-14 border-2 border-black text-black font-lato font-bold text-lg rounded-2xl flex items-center justify-center gap-2 mx-auto hover:bg-black/10 transition-colors"
              >
                <Users className="w-5 h-5" />
                My Shelf
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* FOOTER                                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <footer className="py-12 px-4 bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="" className="w-8 h-8" />
            <span className="font-playwrite text-xl font-bold">InkShelf</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <Link href="/books" className="hover:text-white transition-colors">Browse</Link>
            <Link href="/shelf" className="hover:text-white transition-colors">My Shelf</Link>
            <Link href="/favorites" className="hover:text-white transition-colors">Favorites</Link>
            <Link href="/profile" className="hover:text-white transition-colors">Profile</Link>
          </div>
          <p className="text-sm text-gray-500">© 2026 InkShelf. Free forever.</p>
        </div>
      </footer>

    </div>
  );
}
