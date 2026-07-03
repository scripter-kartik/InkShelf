"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Skeleton from "../../../components/Skeleton";
import Login from "../../../components/LogIn";
import SignUp from "../../../components/SignUp";
import { fetchSmallBooksByCategory } from "../../../components/fetchSmallBooksByCategory";
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
const categories = [
    { label: "Fantasy", key: "fantasy" },
    { label: "Science Fiction", key: "science_fiction" },
    { label: "Mystery & Thriller", key: "mystery" },
    { label: "Historical Fiction", key: "historical_fiction" },
    { label: "Romance", key: "romance" },
    { label: "Horror", key: "horror" },
    { label: "Adventure", key: "adventure" },
    { label: "Literary Fiction", key: "literary_fiction" },
    { label: "Young Adult (YA) Fiction", key: "young_adult" },
    { label: "Dystopian", key: "dystopian" },
    { label: "Biography & Memoir", key: "biography" },
    { label: "Self-Help", key: "self_help" },
    { label: "History", key: "history" },
    { label: "Politics & Current Affairs", key: "politics" },
    { label: "Science & Nature", key: "science" },
    { label: "Psychology", key: "psychology" },
    { label: "Philosophy", key: "philosophy" },
    { label: "Business & Economics", key: "business" },
];
const BATCH_SIZE = 3;
export default function SmallSearchedBooks() {
    const [query, setQuery] = useState("");
    const [isActive, setIsActive] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [browseOpen, setBrowseOpen] = useState(false);
    const [booksCollection, setBooksCollection] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNavbar, setShowNavbar] = useState(true);
    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const loadRef = useRef(null);
    const lastScrollY = useRef(0);
    const browseRef = useRef();
    const suggestionRef = useRef();
    const buttonRef = useRef();
    const router = useRouter();
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!suggestionRef.current?.contains(event.target))
                setShowSuggestions(false);
            if (!browseRef.current?.contains(event.target))
                setBrowseOpen(false);
            if (!buttonRef.current?.contains(event.target))
                setIsActive(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    useEffect(() => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }
        const controller = new AbortController();
        const fetchSuggestions = async () => {
            try {
                const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`, { signal: controller.signal });
                const data = await res.json();
                setSuggestions(data.docs.slice(0, 5).map((doc) => doc.title));
            }
            catch { }
        };
        const debounce = setTimeout(fetchSuggestions, 300);
        return () => {
            clearTimeout(debounce);
            controller.abort();
        };
    }, [query]);
    useEffect(() => {
        const handleScroll = () => {
            const currentY = window.scrollY;
            setShowNavbar(!(currentY > lastScrollY.current && currentY > 200));
            lastScrollY.current = currentY;
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);
    const loadBooks = async () => {
        if (currentIndex >= categories.length)
            return;
        setIsFetchingMore(true);
        try {
            const batch = categories.slice(currentIndex, currentIndex + BATCH_SIZE);
            const result = await fetchSmallBooksByCategory(batch);
            setBooksCollection((prev) => [...prev, ...result]);
            setCurrentIndex((prev) => prev + BATCH_SIZE);
        }
        catch {
            setFetchError("Failed to load books. Please try again.");
        }
        finally {
            setIsFetchingMore(false);
            setLoading(false);
        }
    };
    useEffect(() => {
        loadBooks();
    }, []);
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isFetchingMore) {
                loadBooks();
            }
        }, { rootMargin: "200px" });
        if (loadRef.current)
            observer.observe(loadRef.current);
        return () => {
            if (loadRef.current)
                observer.unobserve(loadRef.current);
        };
    }, [loadRef.current, isFetchingMore]);
    useEffect(() => {
        if (showLogin || showSignup)
            setIsActive(false);
    }, [showLogin, showSignup]);
    const closeAll = () => {
        setShowLogin(false);
        setShowSignup(false);
    };
    return (<div>
      
      <div className={`flex items-center justify-between gap-5 p-3 fixed top-0 left-0 right-0 z-50 bg-white transition-transform duration-300 ${showNavbar ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="relative" ref={suggestionRef}>
          <input className="border-2 font-lato text-md rounded px-3 sm:w-96 h-10 outline-none text-gray-500" type="text" placeholder="search" onChange={(e) => setQuery(e.target.value)} value={query} onFocus={() => setShowSuggestions(true)} onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
                router.push(`/searchedBooks?q=${encodeURIComponent(query.trim())}`);
                setShowSuggestions(false);
            }
        }}/>
          {showSuggestions && suggestions.length > 0 && (<ul className="absolute top-14 left-0 w-full bg-white border border-gray-300 rounded shadow z-50">
              {suggestions.map((title, idx) => (<li key={idx} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm" onMouseDown={() => {
                    setQuery(title);
                    setShowSuggestions(false);
                    router.push(`/searchedBooks?q=${encodeURIComponent(title)}`);
                }}>
                  {title}
                </li>))}
            </ul>)}
        </div>

        <div className="flex items-center sm:gap-7 gap-4">
          <div className="relative" ref={browseRef}>
            <div onClick={() => setBrowseOpen((prev) => !prev)} className="flex gap-1 font-winky items-center cursor-pointer">
              <button>browse</button>
              <img className="w-2 h-2" src="/downArrow.png" alt="Dropdown"/>
            </div>
            {browseOpen && (<div className="absolute top-8 left-[-170px] mt-2 w-56 max-h-96 overflow-y-auto bg-white rounded shadow-md border border-gray-300 z-50">
                {genres.map((genre, idx) => (<div key={idx} className="px-4 py-2 hover:bg-green-100 cursor-pointer text-sm" onClick={() => {
                    setBrowseOpen(false);
                    router.push(`/genre?name=${encodeURIComponent(genre.toLowerCase().replace(/\s+/g, "_"))}`);
                }}>
                    {genre}
                  </div>))}
              </div>)}
          </div>
          <img className="w-7 h-7 mr-3 sm:hidden cursor-pointer" onClick={() => setIsActive((prev) => !prev)} src="/burger-bar.png" alt="Menu"/>
        </div>
      </div>

      <hr className="text-gray-600 mt-[64px]"/>

      
      {isActive && (<div ref={buttonRef} className="flex flex-col gap-5 items-center w-32 h-48 p-3 rounded border-2 bg-white border-gray-300 absolute right-0 top-16 text-xl font-lato z-40">
          <button onClick={() => setShowLogin(true)}>login</button>
          <button onClick={() => setShowSignup(true)}>signup</button>
          <div className="flex items-center">
            write{" "}
            <img className="w-2 h-2" src="/downArrow.png" alt="Write dropdown"/>
          </div>
        </div>)}

      
      <div className="p-6 space-y-12 mt-10">
        {fetchError && <p className="text-center text-red-500">{fetchError}</p>}
        {loading && booksCollection.length === 0
            ? Array.from({ length: BATCH_SIZE }).map((_, idx) => (<div key={idx}>
                <h2 className="text-3xl font-semibold text-green-600 mb-4">
                  Loading...
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="bg-white rounded shadow-md p-3 animate-pulse">
                      <Skeleton height="h-48" rounded="rounded"/>
                      <div className="mt-2 space-y-2">
                        <Skeleton width="w-3/4"/>
                        <Skeleton width="w-1/2"/>
                      </div>
                    </div>))}
                </div>
              </div>))
            : booksCollection.map(({ category, books }, idx) => (<div key={idx}>
                <h2 className="text-3xl font-semibold text-green-600 mb-4">
                  {category}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {books.map((book) => (<div key={`${book.key}-${book.cover_id}`} className="bg-white rounded shadow-md hover:shadow-xl transition-shadow duration-300 p-3">
                      {book.cover_id ? (<img src={`https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`} alt={book.title} className="w-full h-48 object-cover rounded"/>) : (<div className="w-full h-48 bg-gray-300 flex items-center justify-center rounded">
                          <span className="text-gray-500 text-sm">
                            No Cover
                          </span>
                        </div>)}
                      <h3 className="mt-2 font-medium text-sm line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-xs text-gray-600">
                        Author: {book.authors?.[0]?.name || "Unknown"}
                      </p>
                      <a href={`https://openlibrary.org${book.key}`} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline mt-1 inline-block">
                        Read Book
                      </a>
                    </div>))}
                </div>
              </div>))}
        
        <div ref={loadRef} className="h-10"/>
        {isFetchingMore && (<p className="text-center text-gray-400 text-sm">Loading more...</p>)}
      </div>

      
      {(showLogin || showSignup) && (<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          {showLogin && <Login onClose={closeAll}/>}
          {showSignup && <SignUp onClose={closeAll}/>}
        </div>)}
    </div>);
}
