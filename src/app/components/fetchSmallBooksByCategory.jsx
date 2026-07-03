export async function fetchSmallBooksByCategory(categories) {
    try {
        const result = await Promise.all(categories.map(async ({ label, key }) => {
            const res = await fetch(`https://openlibrary.org/subjects/${key}.json?limit=30`);
            if (!res.ok)
                throw new Error(`Failed to fetch category: ${label}`);
            const data = await res.json();
            return { category: label, books: data.works || [] };
        }));
        return result;
    }
    catch (err) {
        console.error("Error fetching categories:", err);
        throw err;
    }
}
