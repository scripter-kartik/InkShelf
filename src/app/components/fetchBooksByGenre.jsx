export async function fetchBooksByGenre(genre) {
    try {
        const res = await fetch(`https://openlibrary.org/subjects/${genre}.json?limit=1000`);
        if (!res.ok) {
            throw new Error(`Failed to fetch books for genre: ${genre}`);
        }
        const data = await res.json();
        return data.works || [];
    }
    catch (error) {
        console.error("Error fetching books:", error);
        return [];
    }
}
