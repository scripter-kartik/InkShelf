"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Search, ChevronDown, Menu, Heart, Library, User, LogOut } from "lucide-react";
import { GENRES } from "@/lib/constants";
import { fetchSuggestions } from "@/lib/openlibrary";
import ThemeToggle from "@/components/ThemeToggle";
import AuthModal from "@/components/AuthModal";
export default function Navbar() {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [browseOpen, setBrowseOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [authMode, setAuthMode] = useState(null);
    const router = useRouter();
    const browseRef = useRef(null);
    const searchRef = useRef(null);
    const accountRef = useRef(null);
    const { data: session } = useSession();
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
    useEffect(() => {
        if (query.trim().length < 2)
            return setSuggestions([]);
        const controller = new AbortController();
        const t = setTimeout(async () => {
            try {
                setSuggestions(await fetchSuggestions(query, 5, controller.signal));
            }
            catch (err) {
                if (err.name !== "AbortError")
                    console.error(err);
            }
        }, 300);
        return () => {
            clearTimeout(t);
            controller.abort();
        };
    }, [query]);
    const goToSearch = (term) => {
        const q = (term ?? query).trim();
        if (!q)
            return;
        setShowSuggestions(false);
        setMenuOpen(false);
        router.push(`/searchedBooks?q=${encodeURIComponent(q)}`);
    };
    const goToGenre = (slug) => {
        setBrowseOpen(false);
        setMenuOpen(false);
        router.push(`/genre?name=${encodeURIComponent(slug)}`);
    };
    return (<header className="sticky top-0 z-40 border-b-2 border-black bg-green-400 dark:border-gray-700 dark:bg-gray-900">
      <nav className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <img className="h-8 w-8" src="/icon.png" alt=""/>
            <span className="font-playwrite text-xl font-bold text-black dark:text-white">
              InkShelf
            </span>
          </Link>

          <div className="relative hidden lg:block" ref={browseRef}>
            <button onClick={() => setBrowseOpen((v) => !v)} className="flex items-center gap-1 font-winky text-lg font-semibold text-black dark:text-white" aria-expanded={browseOpen}>
              Browse <ChevronDown className="h-4 w-4"/>
            </button>
            {browseOpen && (<div className="absolute mt-2 max-h-96 w-56 overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {GENRES.map((g) => (<button key={g.slug} onClick={() => goToGenre(g.slug)} className="block w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-green-100 dark:text-gray-200 dark:hover:bg-gray-700">
                    {g.label}
                  </button>))}
              </div>)}
          </div>

          <div className="relative hidden lg:block" ref={searchRef}>
            <div className="flex h-11 w-72 items-center gap-2 rounded-lg border-2 border-gray-400 bg-white px-3 dark:border-gray-600 dark:bg-gray-800 xl:w-80">
              <Search className="h-4 w-4 text-gray-500"/>
              <input className="h-full w-full bg-transparent font-lato text-sm outline-none dark:text-white" type="text" placeholder="Search books, authors…" value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setShowSuggestions(true)} onKeyDown={(e) => e.key === "Enter" && goToSearch()}/>
            </div>
            {showSuggestions && suggestions.length > 0 && (<ul className="absolute left-0 top-12 z-50 w-full overflow-hidden rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {suggestions.map((title, idx) => (<li key={idx}>
                    <button className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700" onMouseDown={() => goToSearch(title)}>
                      {title}
                    </button>
                  </li>))}
              </ul>)}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />

          <Link href="/smallSearchedBooks" className="lg:hidden" aria-label="Search">
            <Search className="h-6 w-6 text-black dark:text-white"/>
          </Link>

          {session?.user ? (<div className="relative hidden sm:block" ref={accountRef}>
              <button onClick={() => setAccountOpen((v) => !v)} className="flex items-center gap-2" aria-label="Account menu">
                <img src={session.user.image || "/icon.png"} alt="" className="h-9 w-9 rounded-full border object-cover"/>
                <ChevronDown className="h-4 w-4 text-black dark:text-white"/>
              </button>
              {accountOpen && (<div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <p className="truncate text-sm font-semibold dark:text-white">
                      {session.user.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {session.user.email}
                    </p>
                  </div>
                  <AccountLink href="/profile" icon={User} label="Profile"/>
                  <AccountLink href="/favorites" icon={Heart} label="Favorites"/>
                  <AccountLink href="/shelf" icon={Library} label="My Shelf"/>
                  <button onClick={() => signOut()} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <LogOut className="h-4 w-4"/> Log out
                  </button>
                </div>)}
            </div>) : (<div className="hidden items-center gap-3 sm:flex">
              <button onClick={() => setAuthMode("signup")} className="font-winky text-lg font-semibold text-black dark:text-white">
                Sign Up
              </button>
              <button onClick={() => setAuthMode("login")} className="rounded-md bg-black px-4 py-2 font-winky text-sm font-semibold text-white dark:bg-white dark:text-black">
                Log In
              </button>
            </div>)}

          <div className="flex items-center gap-2 sm:hidden">
            {session?.user && (<img src={session.user.image || "/icon.png"} alt="" className="h-8 w-8 rounded-full border-2 border-black object-cover dark:border-white" aria-hidden="true"/>)}
            <button onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
              <Menu className="h-6 w-6 text-black dark:text-white"/>
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (<div className="border-t border-black/10 bg-green-400 px-4 py-4 sm:hidden dark:border-gray-700 dark:bg-gray-900">
          {session?.user ? (<div className="flex flex-col gap-2">
              <MobileLink href="/profile" label="Profile" onClick={() => setMenuOpen(false)}/>
              <MobileLink href="/favorites" label="Favorites" onClick={() => setMenuOpen(false)}/>
              <MobileLink href="/shelf" label="My Shelf" onClick={() => setMenuOpen(false)}/>
              <button onClick={() => signOut()} className="rounded px-3 py-2 text-left font-winky text-red-700">
                Log out
              </button>
            </div>) : (<div className="flex gap-3">
              <button onClick={() => {
                    setAuthMode("login");
                    setMenuOpen(false);
                }} className="rounded-md bg-black px-4 py-2 font-winky text-sm font-semibold text-white">
                Log In
              </button>
              <button onClick={() => {
                    setAuthMode("signup");
                    setMenuOpen(false);
                }} className="rounded-md border-2 border-black px-4 py-2 font-winky text-sm font-semibold dark:text-white">
                Sign Up
              </button>
            </div>)}
        </div>)}

      {authMode && (<AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSwitch={(m) => setAuthMode(m)}/>)}
    </header>);
}
function AccountLink({ href, icon: Icon, label }) {
    return (<Link href={href} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
      <Icon className="h-4 w-4"/> {label}
    </Link>);
}
function MobileLink({ href, label, onClick }) {
    return (<Link href={href} onClick={onClick} className="rounded px-3 py-2 font-winky text-black dark:text-white">
      {label}
    </Link>);
}
