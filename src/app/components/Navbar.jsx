import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react"

const genres = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Historical Fiction",
  "Romance",
  "Horror",
  "Adventure",
  "Literary Fiction",
  "Young Adult",
  "Dystopian",
  "Biography",
  "Self-Help",
  "History",
  "Politics",
  "Science",
  "Psychology",
  "Philosophy",
  "Business",
  "Health",
  "True Crime",
  "Cookbooks",
  "Art",
  "Travel",
  "Religion",
];

export default function Navbar({
  onLoginClick,
  onSignUpClick,
  query,
  setQuery,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const router = useRouter();
  const browseRef = useRef(null);
  const { data: session } = useSession();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (browseRef.current && !browseRef.current.contains(event.target)) {
        setBrowseOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchSuggestions = async () => {
      if (!query) return setSuggestions([]);
      try {
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(
            query
          )}&limit=5`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setSuggestions(data.docs.slice(0, 5).map((doc) => doc.title));
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      }
    };
    const debounce = setTimeout(fetchSuggestions, 300);
    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="flex items-center w-screen h-16 bg-green-400 px-8 py-2 border-b-2 border-black justify-between relative z-50">
      <div className="flex items-center lg:gap-8 xl:gap-12 2xl:gap-20">
        <Link href="/">
          <div className="flex items-center gap-4">
            <img className="w-8 h-8" src="/icon.png" alt="InkShelf Logo" />
            <h1 className="font-bold text-xl font-playwrite">InkShelf</h1>
          </div>
        </Link>

        <div className="relative" ref={browseRef}>
          <button
            className="font-winky text-xl font-semibold hidden lg:flex items-center gap-2"
            onClick={() => setBrowseOpen((prev) => !prev)}
          >
            Browse <img className="w-4 h-4" src="/downArrow.png" alt="▼" />
          </button>

          {browseOpen && (
            <div className="absolute mt-2 w-56 max-h-96 overflow-y-auto bg-white rounded shadow-md border border-gray-300 z-50">
              {genres.map((genre, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2 hover:bg-green-100 cursor-pointer text-sm"
                  onClick={() => {
                    setBrowseOpen(false);
                    router.push(
                      `/genre?name=${encodeURIComponent(
                        genre.toLowerCase().replace(/\s+/g, "_")
                      )}`
                    );
                  }}
                >
                  {genre}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative lg:flex rounded-[10px] text-black px-3 bg-white gap-1 w-80 h-12 items-center sm:hidden lg:mr-5 hidden border-2 border-gray-400">
          <img className="w-5 h-5" src="/search.png" alt="Search" />
          <input
            className="rounded-2xl text-md px-2 w-80 h-8 border-none outline-none font-light font-lato"
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute top-14 left-0 w-full bg-white border border-gray-300 rounded shadow z-50">
              {suggestions.map((title, idx) => (
                <li
                  key={idx}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onMouseDown={() => {
                    setQuery(title);
                    setShowSuggestions(false);
                    router.push(
                      `/searchedBooks?q=${encodeURIComponent(title)}`
                    );
                  }}
                >
                  {title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex gap-10">
        <div className="sm:flex items-center gap-2 hidden">
          <h1 className="font-winky text-xl font-semibold">write</h1>
          <img className="w-4 h-4" src="/downArrow.png" alt="" />
        </div>
        <div className="sm:flex items-center gap-10 hidden">
          {session?.user ? (
            <div className="flex items-center gap-3">
              <img
                src={session?.user?.image || "/default-avatar.png"}
                alt="User"
                className="w-10 h-10 rounded-full border cursor-pointer object-cover"
                onClick={() => signOut()}
              />
              <span className="font-winky text-xl font-semibold cursor-pointer" onClick={() => signOut()}>
                Logout
              </span>
            </div>
          ) : (
            <>
              <button
                onClick={onSignUpClick}
                className="font-winky text-xl font-semibold"
              >
                SignUp
              </button>
              <button
                onClick={onLoginClick}
                className="font-winky text-xl font-semibold"
              >
                Login
              </button>
            </>
          )}
        </div>

        <Link href="/smallSearchedBooks">
          <button>
            <img className="w-8 h-8 lg:hidden" src="/search.png" alt="" />
          </button>
        </Link>
      </div>
    </div>
  );
}
