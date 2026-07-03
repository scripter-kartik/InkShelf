export async function fetchBooksByCategories(categories) {
    const result = await Promise.all(categories.map(async ({ label, key }) => {
        const res = await fetch(`https://openlibrary.org/subjects/${key}.json?limit=12`, {
            cache: "no-store",
        });
        const data = await res.json();
        return {
            category: label,
            books: data.works || [],
        };
    }));
    return result;
}
