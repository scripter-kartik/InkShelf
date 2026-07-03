export async function fetchBooksBySearch(query) {
    try {
        const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=50`);
        if (!res.ok) {
            throw new Error(`Failed to fetch books for search query: ${query}`);
        }
        const data = await res.json();
        return data.docs || [];
    }
    catch (err) {
        console.error("Error fetching searched books:", err);
        return [];
    }
}
