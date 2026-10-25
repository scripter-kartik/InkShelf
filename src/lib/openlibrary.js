const BASE = "https://www.googleapis.com/books/v1";
const OL_BASE = "https://openlibrary.org";
const OL_TIMEOUT_MS = 30000;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY || "";
const withKey = (url) => (API_KEY ? `${url}${url.includes("?") ? "&" : "?"}key=${API_KEY}` : url);
const IS_BROWSER = typeof window !== "undefined";
const SERVER_CACHE = { next: { revalidate: 12 * 60 * 60 } };
async function viaApi(params, signal) {
    const res = await fetch(`/api/books?${new URLSearchParams(params)}`, signal ? { signal } : undefined);
    if (!res.ok) {
        throw new Error(`/api/books request failed (${res.status})`);
    }
    return res.json();
}
const MOCK_LIBRARY = {
    fantasy: [
        { id: "mock_fantasy_1", title: "The Way of Kings", author: "Brandon Sanderson", cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80", year: "2010", desc: "An epic masterpiece detailing a world torn apart by storms and warring factions, where magical armor and weapons determine fates.", subjects: ["Fantasy", "Epic Fantasy", "Magic"] },
        { id: "mock_fantasy_2", title: "The Hobbit", author: "J.R.R. Tolkien", cover: "https://images.unsplash.com/photo-1618666012174-83b441c0bc76?auto=format&fit=crop&w=400&q=80", year: "1937", desc: "Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, until the wizard Gandalf and a company of dwarves whisk him away on an adventure.", subjects: ["Fantasy", "Adventure", "Classics"] },
        { id: "mock_fantasy_3", title: "A Game of Thrones", author: "George R.R. Martin", cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80", year: "1996", desc: "The first book in A Song of Ice and Fire, a series depicting the power struggle for the Iron Throne in the continent of Westeros.", subjects: ["Fantasy", "Political", "Intrigue"] },
        { id: "mock_fantasy_4", title: "The Name of the Wind", author: "Patrick Rothfuss", cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80", year: "2007", desc: "The riveting first-person narrative of Kvothe, a legendary wizard, musician, and adventurer.", subjects: ["Fantasy", "Magic", "Music"] },
    ],
    science_fiction: [
        { id: "mock_scifi_1", title: "Dune", author: "Frank Herbert", cover: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80", year: "1965", desc: "Set in the far future amidst a sprawling feudal interstellar society, Dune tells the story of Paul Atreides as his family accepts control of the desert planet Arrakis.", subjects: ["Sci-Fi", "Space Opera", "Classics"] },
        { id: "mock_scifi_2", title: "Neuromancer", author: "William Gibson", cover: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bb1d?auto=format&fit=crop&w=400&q=80", year: "1984", desc: "The matrix is a world within a world, a consensus hallucination, and Case is the best data-thief in the business.", subjects: ["Sci-Fi", "Cyberpunk", "Dystopian"] },
        { id: "mock_scifi_3", title: "Project Hail Mary", author: "Andy Weir", cover: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80", year: "2021", desc: "Ryland Grace is the sole survivor on a desperate, last-chance mission to save humanity from an extinction-level event.", subjects: ["Sci-Fi", "Space", "Science"] },
    ],
    mystery: [
        { id: "mock_mystery_1", title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80", year: "2005", desc: "A psychological thriller involving disgraced journalist Mikael Blomkvist and tattooed hacker Lisbeth Salander.", subjects: ["Mystery", "Thriller", "Crime"] },
        { id: "mock_mystery_2", title: "And Then There Were None", author: "Agatha Christie", cover: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=400&q=80", year: "1939", desc: "Ten strangers are invited to an isolated island off the Devon coast by a mysterious host who fails to appear.", subjects: ["Mystery", "Classics", "Whodunit"] },
    ]
};
function getMockBooksForCategory(categoryKey, limit = 12) {
    const normKey = categoryKey.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const baseList = MOCK_LIBRARY[normKey] || MOCK_LIBRARY[categoryKey] || [];
    if (baseList.length > 0) {
        return baseList.slice(0, limit);
    }
    const displayCategory = categoryKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const list = [];
    const covers = [
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80"
    ];
    for (let i = 1; i <= Math.min(limit, 8); i++) {
        list.push({
            id: `mock_${normKey}_${i}`,
            title: `${displayCategory} Masterpiece Vol. ${i}`,
            author: `Author of ${displayCategory} ${i}`,
            cover: covers[(i - 1) % covers.length],
            year: `${2020 - i}`,
            desc: `An essential reading selection in the ${displayCategory} genre, exploring core themes, characters, and beautiful prose.`,
            subjects: [displayCategory, "Literature"]
        });
    }
    return list;
}
export function coverUrl(coverId, _size = "M") {
    if (!coverId)
        return null;
    const s = String(coverId);
    if (s.startsWith("http")) {
        return s.replace("http://", "https://").replace(/&edge=curl/g, "");
    }
    if (/^\d+$/.test(s)) {
        return `https://covers.openlibrary.org/b/id/${s}-M.jpg`;
    }
    return null;
}
export function workId(key = "") {
    return String(key)
        .replace("/volumes/", "")
        .replace("/works/", "")
        .replace(/^\//, "");
}
const RETRYABLE = new Set([429, 500, 503]);
async function getJson(url, signal, quotaUser) {
    const target = withKey(url) + (quotaUser ? `&quotaUser=${encodeURIComponent(quotaUser)}` : "");
    for (let attempt = 0; ; attempt++) {
        const res = await fetch(target, { ...SERVER_CACHE, ...(signal ? { signal } : {}) });
        if (res.ok)
            return res.json();
        if (attempt === 0 && RETRYABLE.has(res.status) && !IS_BROWSER) {
            await new Promise((r) => setTimeout(r, 700));
            continue;
        }
        const err = new Error(`Books API request failed (${res.status})`);
        err.status = res.status;
        throw err;
    }
}
async function getOlJson(path, signal) {
    const res = await fetch(`${OL_BASE}${path}`, {
        ...SERVER_CACHE,
        signal: signal ?? AbortSignal.timeout(OL_TIMEOUT_MS),
    });
    if (!res.ok) {
        const err = new Error(`Open Library request failed (${res.status}): ${path}`);
        err.status = res.status;
        throw err;
    }
    return res.json();
}
function normalizeVolume(item) {
    const info = item.volumeInfo || {};
    const rawAuthors = info.authors || [];
    const thumbnail = info.imageLinks?.thumbnail ||
        info.imageLinks?.smallThumbnail ||
        null;
    return {
        key: item.id,
        title: info.title || "Untitled",
        authors: rawAuthors.map((name) => ({ name })),
        author_name: rawAuthors,
        cover_id: thumbnail,
        cover_i: null,
        access: item.accessInfo?.viewability === "ALL_PAGES" ? "public" : null,
    };
}
function olAccess(doc) {
    if (doc.ebook_access === "public" || doc.ebook_access === "borrowable")
        return doc.ebook_access;
    if (doc.public_scan === true)
        return "public";
    if (doc.availability?.available_to_borrow || doc.availability?.status === "borrow_available")
        return "borrowable";
    return null;
}
function normalizeOlDoc(doc) {
    const authors = doc.author_name || doc.authors?.map((a) => a.name).filter(Boolean) || [];
    return {
        key: doc.key,
        title: doc.title || "Untitled",
        authors: authors.map((name) => ({ name })),
        author_name: authors,
        cover_id: doc.cover_i ?? doc.cover_id ?? null,
        cover_i: null,
        access: olAccess(doc),
    };
}
export function gutenbergAuthorName(name = "") {
    const clean = name.replace(/\s*\(.*?\)\s*/g, " ").trim();
    const parts = clean.split(/,\s*/);
    return parts.length === 2 ? `${parts[1]} ${parts[0]}`.trim() : clean;
}
export function normalizeGutenberg(b) {
    const authors = (b.authors || []).map((a) => gutenbergAuthorName(a.name)).filter(Boolean);
    return {
        key: `PG${b.id}`,
        title: b.title || "Untitled",
        authors: authors.map((name) => ({ name })),
        author_name: authors,
        cover_id: b.formats?.["image/jpeg"] || null,
        cover_i: null,
        access: "public",
    };
}
function mockToBook(m) {
    return {
        key: m.id,
        title: m.title,
        authors: [{ name: m.author }],
        author_name: [m.author],
        cover_id: m.cover,
        cover_i: null,
    };
}
function allMocks() {
    return Object.values(MOCK_LIBRARY).flat();
}
function deduplicateBooks(books) {
    const seen = new Set();
    return books.filter((book) => {
        if (!book.key)
            return true;
        if (seen.has(book.key))
            return false;
        seen.add(book.key);
        return true;
    });
}
async function booksForSubject(subjectKey, limit) {
    if (IS_BROWSER) {
        try {
            return (await viaApi({ type: "subject", key: subjectKey.toLowerCase(), limit })).books;
        }
        catch (err) {
            console.warn(`Loading subject "${subjectKey}" failed, falling back to mock library.`);
            return getMockBooksForCategory(subjectKey, limit).map(mockToBook);
        }
    }
    try {
        const data = await getOlJson(`/subjects/${encodeURIComponent(subjectKey.toLowerCase())}.json?limit=${limit}`);
        const books = deduplicateBooks((data.works || []).map(normalizeOlDoc));
        if (books.length > 0)
            return books;
    }
    catch (err) {
        console.warn(`Open Library failed for subject "${subjectKey}", trying Google Books.`);
    }
    try {
        const subject = subjectKey.replace(/_/g, " ");
        const data = await getJson(`${BASE}/volumes?q=${encodeURIComponent(subject)}&maxResults=${Math.min(limit, 40)}&orderBy=relevance&langRestrict=en`);
        const books = deduplicateBooks((data.items || []).map(normalizeVolume));
        if (books.length > 0)
            return books;
    }
    catch (err) {
        console.warn(`Google Books failed for subject "${subjectKey}", falling back to mock library.`);
    }
    return getMockBooksForCategory(subjectKey, limit).map(mockToBook);
}
export async function fetchBooksByCategories(categories, limit = 12) {
    return Promise.all(categories.map(async ({ label, key }) => ({
        category: label,
        books: await booksForSubject(key, limit),
    })));
}
export async function fetchBooksByGenre(genre, limit = 40) {
    return booksForSubject(genre, limit);
}
const SEARCH_PAGE_SIZE = 40;
const OL_SEARCH_FIELDS = "key,title,author_name,cover_i,ebook_access";
async function searchGoogle(query, page, quotaUser) {
    const startIndex = page * SEARCH_PAGE_SIZE;
    const data = await getJson(`${BASE}/volumes?q=${encodeURIComponent(query)}&maxResults=${SEARCH_PAGE_SIZE}&startIndex=${startIndex}&langRestrict=en`, undefined, quotaUser);
    const items = data.items || [];
    return {
        books: deduplicateBooks(items.map(normalizeVolume)),
        hasMore: items.length > 0 && startIndex + items.length < (data.totalItems || 0),
    };
}
async function searchOpenLibrary(query, page) {
    const data = await getOlJson(`/search.json?q=${encodeURIComponent(query)}&limit=${SEARCH_PAGE_SIZE}&page=${page + 1}&fields=${OL_SEARCH_FIELDS}`);
    const docs = data.docs || [];
    const total = data.numFound ?? data.num_found ?? 0;
    return {
        books: deduplicateBooks(docs.map(normalizeOlDoc)),
        hasMore: docs.length > 0 && (page + 1) * SEARCH_PAGE_SIZE < total,
    };
}
export async function searchBooks(query, { page = 0, source, quotaUser } = {}) {
    if (IS_BROWSER) {
        return viaApi({ type: "search", q: query, page, ...(source ? { source } : {}) });
    }
    let googleFailed = false;
    if (!source || source === "google") {
        try {
            const result = await searchGoogle(query, page, quotaUser);
            if (result.books.length > 0 || source === "google")
                return { ...result, source: "google" };
        }
        catch (err) {
            if (source === "google")
                throw err;
            googleFailed = true;
            console.warn(`Google Books search failed for "${query}" (${err.status || err.message}), trying Open Library.`);
        }
    }
    if (!source || source === "openlibrary") {
        try {
            const result = await searchOpenLibrary(query, page);
            if (result.books.length > 0 || source === "openlibrary")
                return { ...result, source: "openlibrary", fallback: googleFailed };
        }
        catch (err) {
            if (source === "openlibrary")
                throw err;
            console.warn(`Open Library search failed for "${query}", searching fallback mock library.`);
        }
    }
    const q = query.toLowerCase();
    const books = allMocks()
        .filter((m) => m.title.toLowerCase().includes(q) || m.author.toLowerCase().includes(q))
        .map(mockToBook);
    return { books, hasMore: false, source: "mock" };
}
export async function fetchBooksBySearch(query) {
    return (await searchBooks(query)).books;
}
const GUTENDEX = "https://gutendex.com/books/";
const GUTENDEX_TIMEOUT_MS = 150000;
const FREE_SEARCH_WAIT_MS = 20000;
async function getGutendex(params) {
    const qs = new URLSearchParams({ languages: "en", ...params });
    const res = await fetch(`${GUTENDEX}?${qs}`, {
        ...SERVER_CACHE,
        signal: AbortSignal.timeout(GUTENDEX_TIMEOUT_MS),
    });
    if (!res.ok) {
        const err = new Error(`Gutendex request failed (${res.status})`);
        err.status = res.status;
        throw err;
    }
    return res.json();
}
function readableGutenberg(b) {
    return b.media_type === "Text" && Boolean(b.formats?.["application/epub+zip"]);
}
/**
 * Free, fully readable classics from Project Gutenberg (via Gutendex), most popular first.
 * Returns { books, hasMore, total }. `page` is 0-based.
 */
export async function fetchFreeBooks({ topic = "", search = "", page = 0 } = {}) {
    if (IS_BROWSER) {
        return viaApi({ type: "free", ...(topic ? { topic } : {}), ...(search ? { q: search } : {}), page });
    }
    const data = await getGutendex({
        ...(topic ? { topic } : {}),
        ...(search ? { search } : {}),
        page: String(page + 1),
    });
    return {
        books: deduplicateBooks((data.results || []).filter(readableGutenberg).map(normalizeGutenberg)),
        hasMore: Boolean(data.next),
        total: data.count || 0,
    };
}
/**
 * Search restricted to books that can be read in full for free: Project Gutenberg
 * (opens in the InkShelf reader) plus Google Books' free public-domain editions.
 * Gutendex can be slow, so the two run in parallel and either may be missing.
 */
export async function searchFreeBooks(query, { page = 0, quotaUser } = {}) {
    if (IS_BROWSER) {
        return viaApi({ type: "search", q: query, page, free: "1" });
    }
    const gutendex = fetchFreeBooks({ search: query, page });
    gutendex.catch(() => {});
    const [gut, google] = await Promise.allSettled([
        Promise.race([
            gutendex,
            new Promise((_, reject) => setTimeout(() => reject(new Error("Gutendex still loading")), FREE_SEARCH_WAIT_MS)),
        ]),
        getJson(`${BASE}/volumes?q=${encodeURIComponent(query)}&filter=free-ebooks&maxResults=${SEARCH_PAGE_SIZE}&startIndex=${page * SEARCH_PAGE_SIZE}&langRestrict=en`, undefined, quotaUser),
    ]);
    const gutBooks = gut.status === "fulfilled" ? gut.value.books : [];
    const googleItems = google.status === "fulfilled" ? google.value.items || [] : [];
    const googleBooks = googleItems.map(normalizeVolume).filter((b) => b.access === "public");
    if (gut.status === "rejected" && google.status === "rejected") {
        throw gut.reason;
    }
    return {
        books: deduplicateBooks([...gutBooks, ...googleBooks]),
        hasMore:
            (gut.status === "fulfilled" && gut.value.hasMore) ||
            (google.status === "fulfilled" && googleItems.length === SEARCH_PAGE_SIZE),
        source: "free",
        partial: gut.status === "rejected",
    };
}
export async function fetchSuggestions(query, limit = 5, signal, quotaUser) {
    if (IS_BROWSER) {
        return (await viaApi({ type: "suggest", q: query, limit }, signal)).titles;
    }
    try {
        const data = await getJson(`${BASE}/volumes?q=${encodeURIComponent(query)}&maxResults=${limit}`, signal, quotaUser);
        const titles = (data.items || [])
            .slice(0, limit)
            .map((item) => item.volumeInfo?.title || "")
            .filter(Boolean);
        if (titles.length > 0)
            return titles;
    }
    catch (err) {
        if (err.name === "AbortError")
            throw err;
    }
    try {
        const data = await getOlJson(`/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=title`, signal);
        const titles = [...new Set((data.docs || []).map((d) => d.title).filter(Boolean))];
        if (titles.length > 0)
            return titles.slice(0, limit);
    }
    catch (err) {
        if (err.name === "AbortError")
            throw err;
    }
    return allMocks()
        .filter(m => m.title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit)
        .map(m => m.title);
}
const ALLOWED_DESCRIPTION_TAGS = new Set(["p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li"]);
const NAMED_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " " };
function decodeEntities(str) {
    return str.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
        const e = entity.toLowerCase();
        if (e.startsWith("#")) {
            const code = e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
            return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
        }
        return NAMED_ENTITIES[e] ?? match;
    });
}
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
export function parseDescription(raw = "") {
    let html = "";
    let text = "";
    const normalized = String(raw).replace(
        /&lt;(\/?)(p|br|b|strong|i|em|u|ul|ol|li)\s*\/?&gt;/gi,
        "<$1$2>"
    );
    for (const token of normalized.split(/(<[^<>]*>)/)) {
        if (!token)
            continue;
        const tag = token.match(/^<(\/?)([a-z][a-z0-9]*)\b[^>]*>$/i);
        if (!tag) {
            const decoded = decodeEntities(token);
            html += escapeHtml(decoded);
            text += decoded;
            continue;
        }
        const closing = tag[1] === "/";
        const name = tag[2].toLowerCase();
        if (name === "br")
            text += "\n";
        else if ((name === "p" || name === "div") && closing)
            text += "\n\n";
        else if (name === "li" && !closing)
            text += "\n• ";
        if (!ALLOWED_DESCRIPTION_TAGS.has(name))
            continue;
        html += name === "br" ? "<br>" : `<${closing ? "/" : ""}${name}>`;
    }
    return {
        html: html.trim(),
        text: text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(),
    };
}
function mockDetail(m) {
    return {
        id: m.id,
        key: `/volumes/${m.id}`,
        title: m.title,
        description: m.desc,
        author: m.author,
        coverId: m.cover,
        subjects: m.subjects,
        firstPublishYear: m.year,
        readUrl: "https://books.google.com",
        source: "mock",
    };
}
function offlineFallback(id) {
    return {
        id: id,
        key: `/volumes/${id}`,
        title: "Fallback Offline Book",
        description: "This book metadata was loaded from offline cached values as the remote Books API is rate-limited or unreachable.",
        author: "Unknown Author",
        coverId: null,
        subjects: ["Offline"],
        firstPublishYear: "N/A",
        readUrl: null
    };
}
export function isGutenbergId(id) {
    return /^PG\d+$/i.test(String(id));
}
export function isOpenLibraryId(id) {
    return /^OL\d+W$/i.test(String(id));
}
async function fetchOpenLibraryWorkDetail(id) {
    const work = await getOlJson(`/works/${id}.json`);
    const description = typeof work.description === "string"
        ? work.description
        : work.description?.value || "";
    let author = "Unknown";
    const authorKey = work.authors?.[0]?.author?.key;
    if (authorKey) {
        try {
            author = (await getOlJson(`${authorKey}.json`)).name || author;
        }
        catch { }
    }
    const coverId = (work.covers || []).find((c) => c > 0);
    return {
        id,
        key: `/works/${id}`,
        title: work.title || "Untitled",
        description,
        author,
        coverId: coverId ? String(coverId) : null,
        subjects: (work.subjects || []).slice(0, 12),
        firstPublishYear: work.first_publish_date?.match(/\d{4}/)?.[0] ?? null,
        readUrl: `${OL_BASE}/works/${id}`,
        embeddable: false,
        viewability: "NO_PAGES",
        webReaderLink: null,
        pageCount: null,
        publisher: null,
        language: null,
        source: "openlibrary",
    };
}
const DETAIL_TTL_MS = 12 * 60 * 60 * 1000;
const DETAIL_FALLBACK_TTL_MS = 60 * 1000;
const DETAIL_CACHE_MAX = 1000;
const DETAIL_CACHE_VERSION = 4;
const detailCache = IS_BROWSER ? null : (() => {
    const existing = globalThis.__inkshelfDetailCache;
    if (existing?.version === DETAIL_CACHE_VERSION)
        return existing.map;
    const map = new Map();
    globalThis.__inkshelfDetailCache = { version: DETAIL_CACHE_VERSION, map };
    return map;
})();
export async function fetchWorkDetail(id) {
    if (!detailCache)
        return fetchWorkDetailUncached(id);
    const key = String(id);
    const hit = detailCache.get(key);
    if (hit && hit.expires > Date.now())
        return hit.promise;
    const promise = fetchWorkDetailUncached(key);
    if (detailCache.size >= DETAIL_CACHE_MAX)
        detailCache.delete(detailCache.keys().next().value);
    detailCache.set(key, { promise, expires: Date.now() + DETAIL_TTL_MS });
    promise.then((book) => {
        if (book?.title === "Fallback Offline Book")
            detailCache.set(key, { promise, expires: Date.now() + DETAIL_FALLBACK_TTL_MS });
    }, () => detailCache.delete(key));
    return promise;
}
function cleanGutenbergSubjects(subjects = []) {
    const out = [];
    for (const raw of subjects) {
        const label = raw.split(" -- ")[0].replace(/\s*\(.*?\)\s*$/, "").trim();
        if (label && !out.includes(label)) out.push(label);
    }
    return out.slice(0, 12);
}
async function fetchGutenbergDetail(id) {
    const n = String(id).replace(/^PG/i, "");
    const res = await fetch(`${GUTENDEX}${n}/`, {
        ...SERVER_CACHE,
        signal: AbortSignal.timeout(GUTENDEX_TIMEOUT_MS),
    });
    if (!res.ok) {
        const err = new Error(`Gutendex request failed (${res.status})`);
        err.status = res.status;
        throw err;
    }
    const b = await res.json();
    const epub = b.formats?.["application/epub+zip"];
    if (!epub) {
        const err = new Error("No EPUB for this Gutenberg book");
        err.status = 404;
        throw err;
    }
    const author = (b.authors || []).map((a) => gutenbergAuthorName(a.name)).filter(Boolean)[0] || "Unknown";
    return {
        id: `PG${n}`,
        key: `/gutenberg/${n}`,
        title: b.title || "Untitled",
        description: (b.summaries || [])[0]?.replace(/\s*\(This is an automatically generated summary\.\)\s*$/i, "") || "",
        author,
        coverId: b.formats?.["image/jpeg"] || null,
        subjects: cleanGutenbergSubjects([...(b.subjects || []), ...(b.bookshelves || []).map((x) => x.replace(/^Category:\s*/, ""))]),
        firstPublishYear: null,
        readUrl: `https://www.gutenberg.org/ebooks/${n}`,
        freeEpubUrl: `/api/proxy-epub?url=${encodeURIComponent(epub)}`,
        embeddable: false,
        viewability: "ALL_PAGES",
        webReaderLink: null,
        pageCount: null,
        publisher: "Project Gutenberg",
        language: (b.languages || [])[0] || null,
        source: "gutenberg",
    };
}
async function fetchWorkDetailUncached(id) {
    if (String(id).startsWith("mock_")) {
        const found = allMocks().find(m => m.id === id);
        if (found)
            return mockDetail(found);
        const match = String(id).match(/^mock_(.+)_(\d+)$/);
        if (match) {
            const mocks = getMockBooksForCategory(match[1]);
            const dynFound = mocks[parseInt(match[2], 10) - 1] || mocks[0];
            if (dynFound)
                return mockDetail(dynFound);
        }
    }
    if (isGutenbergId(id)) {
        try {
            return await fetchGutenbergDetail(id);
        }
        catch (err) {
            if (err.status === 404)
                throw err;
            return offlineFallback(id);
        }
    }
    if (isOpenLibraryId(id)) {
        try {
            return await fetchOpenLibraryWorkDetail(id);
        }
        catch (err) {
            if (err.status === 404)
                throw err;
            return offlineFallback(id);
        }
    }
    try {
        const item = await getJson(`${BASE}/volumes/${id}`);
        const info = item.volumeInfo || {};
        const access = item.accessInfo || {};
        const author = (info.authors || [])[0] || "Unknown";
        const rawCover = info.imageLinks?.thumbnail ||
            info.imageLinks?.smallThumbnail ||
            null;
        const coverId = rawCover
            ? rawCover.replace("http://", "https://").replace(/&edge=curl/g, "")
            : null;
        const readUrl = info.previewLink || info.infoLink || null;
        const embeddable = access.embeddable === true;
        const viewability = access.viewability || "NO_PAGES";
        const webReaderLink = access.webReaderLink
            ? access.webReaderLink.replace("http://", "https://")
            : null;
        return {
            id: item.id,
            key: `/volumes/${item.id}`,
            title: info.title || "Untitled",
            ...(() => {
                const { html, text } = parseDescription(info.description || "");
                return { description: text, descriptionHtml: html };
            })(),
            author,
            coverId,
            subjects: (info.categories || []).slice(0, 12),
            firstPublishYear: info.publishedDate
                ? info.publishedDate.substring(0, 4)
                : null,
            readUrl,
            embeddable,
            viewability,
            webReaderLink,
            pageCount: info.pageCount || null,
            publisher: info.publisher || null,
            language: info.language || null,
            source: "google",
        };
    }
    catch (err) {
        if (err.status === 404) {
            throw err;
        }
        return offlineFallback(id);
    }
}
