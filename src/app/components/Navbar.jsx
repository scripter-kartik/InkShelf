"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Menu, Heart, Library, User, LogOut, X } from "lucide-react";
import gsap from "gsap";
import { GENRES } from "@/lib/constants";
import { fetchSuggestions } from "@/lib/openlibrary";
import ThemeToggle from "@/components/ThemeToggle";
import AuthModal from "@/components/AuthModal";

const dropdownVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.97,
    transition: { duration: 0.14 },
  },
};

const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0 },
  show: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.22 },
  },
};

const suggestionItemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04 },
  }),
};

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const browseRef = useRef(null);
  const searchRef = useRef(null);
  const accountRef = useRef(null);
  const navRef = useRef(null);
  const logoRef = useRef(null);
  const { data: session } = useSession();

  /* GSAP navbar entrance */
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.05 }
    );
  }, []);

  /* GSAP logo hover wiggle */
  const handleLogoHover = () => {
    if (!logoRef.current) return;
    gsap.to(logoRef.current, {
      rotate: 15,
      scale: 1.15,
      duration: 0.2,
      ease: "power2.out",
      yoyo: true,
      repeat: 1,
    });
  };

  /* Scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Click outside */
  useEffect(() => {
    const onClick = (e) => {
      if (browseRef.current && !browseRef.current.contains(e.target))
        setBrowseOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSuggestions(false);
      if (accountRef.current && !accountRef.current.contains(e.target))
        setAccountOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  /* Suggestions */
  useEffect(() => {
    if (query.trim().length < 2) return setSuggestions([]);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        setSuggestions(await fetchSuggestions(query, 5, controller.signal));
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      }
    }, 300);
    return () => { clearTimeout(t); controller.abort(); };
  }, [query]);

  const goToSearch = (term) => {
    const q = (term ?? query).trim();
    if (!q) return;
    setShowSuggestions(false);
    setMenuOpen(false);
    router.push(`/searchedBooks?q=${encodeURIComponent(q)}`);
  };

  const goToGenre = (slug) => {
    setBrowseOpen(false);
    setMenuOpen(false);
    router.push(`/genre?name=${encodeURIComponent(slug)}`);
  };

  return (
    <>
      <header
        ref={navRef}
        className={`sticky top-0 z-40 border-b-2 border-black bg-green-400 dark:border-gray-700 dark:bg-gray-900 transition-shadow duration-300 ${
          scrolled ? "shadow-lg" : ""
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          {/* ── Logo ────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-4 lg:gap-8">
            <Link href="/" className="flex shrink-0 items-center gap-2" onMouseEnter={handleLogoHover}>
              <motion.img
                ref={logoRef}
                className="h-8 w-8"
                src="/icon.png"
                alt=""
                whileTap={{ rotate: 360, transition: { duration: 0.4 } }}
              />
              <span className="font-playwrite text-xl font-bold text-black dark:text-white">
                InkShelf
              </span>
            </Link>

            {/* ── Browse dropdown ────────────────────────────────────────── */}
            <div className="relative hidden lg:block" ref={browseRef}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setBrowseOpen((v) => !v)}
                className="flex items-center gap-1 font-winky text-lg font-semibold text-black dark:text-white"
                aria-expanded={browseOpen}
              >
                Browse
                <motion.span
                  animate={{ rotate: browseOpen ? 180 : 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
              </motion.button>

              <AnimatePresence>
                {browseOpen && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="absolute mt-2 max-h-96 w-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
                  >
                    {GENRES.map((g, i) => (
                      <motion.button
                        key={g.slug}
                        custom={i}
                        variants={suggestionItemVariants}
                        initial="hidden"
                        animate="show"
                        onClick={() => goToGenre(g.slug)}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-green-100 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        {g.label}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Desktop search ─────────────────────────────────────────── */}
            <div className="relative hidden lg:block" ref={searchRef}>
              <motion.div
                animate={showSuggestions ? { scale: 1.01 } : { scale: 1 }}
                className="flex h-11 w-72 items-center gap-2 rounded-xl border-2 border-gray-400 bg-white px-3 transition-colors focus-within:border-green-500 dark:border-gray-600 dark:bg-gray-800 xl:w-80"
              >
                <Search className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <input
                  className="h-full w-full bg-transparent font-lato text-sm outline-none dark:text-white"
                  type="text"
                  placeholder="Search books, authors…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => e.key === "Enter" && goToSearch()}
                />
                <AnimatePresence>
                  {query && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      onClick={() => { setQuery(""); setSuggestions([]); }}
                      className="text-gray-400 hover:text-black dark:hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>

              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.ul
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="absolute left-0 top-12 z-50 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
                  >
                    {suggestions.map((title, idx) => (
                      <motion.li
                        key={idx}
                        custom={idx}
                        variants={suggestionItemVariants}
                        initial="hidden"
                        animate="show"
                      >
                        <button
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                          onMouseDown={() => goToSearch(title)}
                        >
                          <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {title}
                        </button>
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right side ──────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />

            {/* Mobile search icon */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Link
                href="/smallSearchedBooks"
                className="lg:hidden"
                aria-label="Search"
              >
                <Search className="h-6 w-6 text-black dark:text-white" />
              </Link>
            </motion.div>

            {/* Account (desktop) */}
            {session?.user ? (
              <div className="relative hidden sm:block" ref={accountRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex items-center gap-2"
                  aria-label="Account menu"
                >
                  <img
                    src={session.user.image || "/icon.png"}
                    alt=""
                    className="h-9 w-9 rounded-full border-2 border-black dark:border-white object-cover shadow-md"
                  />
                  <motion.span
                    animate={{ rotate: accountOpen ? 180 : 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <ChevronDown className="h-4 w-4 text-black dark:text-white" />
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {accountOpen && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                        <p className="truncate text-sm font-semibold dark:text-white">
                          {session.user.name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {session.user.email}
                        </p>
                      </div>
                      <AccountLink href="/profile" icon={User} label="Profile" onClick={() => setAccountOpen(false)} />
                      <AccountLink href="/favorites" icon={Heart} label="Favorites" onClick={() => setAccountOpen(false)} />
                      <AccountLink href="/shelf" icon={Library} label="My Shelf" onClick={() => setAccountOpen(false)} />
                      <button
                        onClick={() => signOut()}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden items-center gap-3 sm:flex">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setAuthMode("signup")}
                  className="font-winky text-lg font-semibold text-black dark:text-white"
                >
                  Sign Up
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setAuthMode("login")}
                  className="rounded-xl bg-black px-4 py-2 font-winky text-sm font-semibold text-white dark:bg-white dark:text-black shadow-md"
                >
                  Log In
                </motion.button>
              </div>
            )}

            {/* Mobile avatar + hamburger */}
            <div className="flex items-center gap-2 sm:hidden">
              {session?.user && (
                <motion.img
                  whileHover={{ scale: 1.08 }}
                  src={session.user.image || "/icon.png"}
                  alt=""
                  className="h-8 w-8 rounded-full border-2 border-black object-cover dark:border-white"
                  aria-hidden="true"
                />
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menu"
              >
                <AnimatePresence mode="wait">
                  {menuOpen ? (
                    <motion.span
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-6 w-6 text-black dark:text-white" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="open"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-6 w-6 text-black dark:text-white" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </nav>

        {/* ── Mobile menu ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="overflow-hidden border-t border-black/10 bg-green-400 px-4 py-4 sm:hidden dark:border-gray-700 dark:bg-gray-900"
            >
              {session?.user ? (
                <div className="flex flex-col gap-2">
                  <MobileLink href="/profile" label="Profile" onClick={() => setMenuOpen(false)} />
                  <MobileLink href="/favorites" label="Favorites" onClick={() => setMenuOpen(false)} />
                  <MobileLink href="/shelf" label="My Shelf" onClick={() => setMenuOpen(false)} />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => signOut()}
                    className="rounded-xl px-3 py-2 text-left font-winky text-red-700"
                  >
                    Log out
                  </motion.button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setAuthMode("login"); setMenuOpen(false); }}
                    className="rounded-xl bg-black px-4 py-2 font-winky text-sm font-semibold text-white shadow-md"
                  >
                    Log In
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setAuthMode("signup"); setMenuOpen(false); }}
                    className="rounded-xl border-2 border-black px-4 py-2 font-winky text-sm font-semibold dark:text-white"
                  >
                    Sign Up
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSwitch={(m) => setAuthMode(m)}
        />
      )}
    </>
  );
}

function AccountLink({ href, icon: Icon, label, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
    >
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}

function MobileLink({ href, label, onClick }) {
  return (
    <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
      <Link
        href={href}
        onClick={onClick}
        className="block rounded-xl px-3 py-2 font-winky text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        {label}
      </Link>
    </motion.div>
  );
}
