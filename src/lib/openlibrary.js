const BASE = "https://www.googleapis.com/books/v1";
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY || "";
const withKey = (url) => (API_KEY ? `${url}&key=${API_KEY}` : url);
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
async function getJson(url) {
    const res = await fetch(withKey(url));
    if (!res.ok) {
        throw new Error(`Books API request failed (${res.status}): ${url}`);
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
    };
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
export async function fetchBooksByCategories(categories, limit = 12) {
    return Promise.all(categories.map(async ({ label, key }) => {
        try {
            const subject = key.replace(/_/g, " ");
            const data = await getJson(`${BASE}/volumes?q=subject:${encodeURIComponent(subject)}&maxResults=${Math.min(limit, 40)}&orderBy=relevance&langRestrict=en`);
            return {
                category: label,
                books: deduplicateBooks((data.items || []).map(normalizeVolume)),
            };
        }
        catch (err) {
            console.warn(`API load failed for category "${label}", falling back to mock library.`);
            const mocks = getMockBooksForCategory(key, limit);
            return {
                category: label,
                books: mocks.map(m => ({
                    key: m.id,
                    title: m.title,
                    authors: [{ name: m.author }],
                    author_name: [m.author],
                    cover_id: m.cover,
                    cover_i: null
                })),
            };
        }
    }));
}
export async function fetchBooksByGenre(genre, limit = 40) {
    try {
        const subject = genre.replace(/_/g, " ");
        const data = await getJson(`${BASE}/volumes?q=subject:${encodeURIComponent(subject)}&maxResults=${Math.min(limit, 40)}&orderBy=relevance&langRestrict=en`);
        return deduplicateBooks((data.items || []).map(normalizeVolume));
    }
    catch (err) {
        console.warn(`API load failed for genre "${genre}", using fallback mock books.`);
        const mocks = getMockBooksForCategory(genre, limit);
        return mocks.map(m => ({
            key: m.id,
            title: m.title,
            authors: [{ name: m.author }],
            author_name: [m.author],
            cover_id: m.cover,
            cover_i: null
        }));
    }
}
export async function fetchBooksBySearch(query, limit = 40) {
    try {
        const data = await getJson(`${BASE}/volumes?q=${encodeURIComponent(query)}&maxResults=${Math.min(limit, 40)}&langRestrict=en`);
        return deduplicateBooks((data.items || []).map(normalizeVolume));
    }
    catch (err) {
        console.warn(`Search failed for "${query}", searching fallback mock library.`);
        const allMocks = [];
        Object.keys(MOCK_LIBRARY).forEach(k => {
            allMocks.push(...MOCK_LIBRARY[k]);
        });
        const filtered = allMocks.filter(m => m.title.toLowerCase().includes(query.toLowerCase()) ||
            m.author.toLowerCase().includes(query.toLowerCase()));
        return filtered.map(m => ({
            key: m.id,
            title: m.title,
            authors: [{ name: m.author }],
            author_name: [m.author],
            cover_id: m.cover,
            cover_i: null
        }));
    }
}
export async function fetchSuggestions(query, limit = 5, signal) {
    try {
        const res = await fetch(withKey(`${BASE}/volumes?q=${encodeURIComponent(query)}&maxResults=${limit}`), { signal });
        if (!res.ok)
            throw new Error();
        const data = await res.json();
        return (data.items || [])
            .slice(0, limit)
            .map((item) => item.volumeInfo?.title || "")
            .filter(Boolean);
    }
    catch (err) {
        const allMocks = [];
        Object.keys(MOCK_LIBRARY).forEach(k => {
            allMocks.push(...MOCK_LIBRARY[k]);
        });
        return allMocks
            .filter(m => m.title.toLowerCase().includes(query.toLowerCase()))
            .slice(0, limit)
            .map(m => m.title);
    }
}
export async function fetchWorkDetail(id) {
    if (String(id).startsWith("mock_")) {
        const allMocks = [];
        Object.keys(MOCK_LIBRARY).forEach(k => {
            allMocks.push(...MOCK_LIBRARY[k]);
        });
        const found = allMocks.find(m => m.id === id);
        if (found) {
            return {
                id: found.id,
                key: `/volumes/${found.id}`,
                title: found.title,
                description: found.desc,
                author: found.author,
                coverId: found.cover,
                subjects: found.subjects,
                firstPublishYear: found.year,
                readUrl: "https://books.google.com"
            };
        }
        const parts = id.split("_");
        if (parts.length >= 3) {
            const cat = parts[1];
            const index = parseInt(parts[2], 10);
            const mocks = getMockBooksForCategory(cat);
            const dynFound = mocks[index - 1] || mocks[0];
            if (dynFound) {
                return {
                    id: dynFound.id,
                    key: `/volumes/${dynFound.id}`,
                    title: dynFound.title,
                    description: dynFound.desc,
                    author: dynFound.author,
                    coverId: dynFound.cover,
                    subjects: dynFound.subjects,
                    firstPublishYear: dynFound.year,
                    readUrl: "https://books.google.com"
                };
            }
        }
    }
    try {
        const item = await getJson(`${BASE}/volumes/${id}`);
        const info = item.volumeInfo || {};
        const author = (info.authors || [])[0] || "Unknown";
        const rawCover = info.imageLinks?.thumbnail ||
            info.imageLinks?.smallThumbnail ||
            null;
        const coverId = rawCover
            ? rawCover.replace("http://", "https://").replace(/&edge=curl/g, "")
            : null;
        const readUrl = info.previewLink || info.infoLink || null;
        return {
            id: item.id,
            key: `/volumes/${item.id}`,
            title: info.title || "Untitled",
            description: info.description || "",
            author,
            coverId,
            subjects: (info.categories || []).slice(0, 12),
            firstPublishYear: info.publishedDate
                ? info.publishedDate.substring(0, 4)
                : null,
            readUrl,
        };
    }
    catch (err) {
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
}
