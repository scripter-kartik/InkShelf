import { GENRES } from "@/lib/constants";
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
export default function sitemap() {
    const staticRoutes = ["", "/books", "/favorites", "/shelf", "/profile"].map((path) => ({
        url: `${BASE_URL}${path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: path === "" ? 1 : 0.7,
    }));
    const genreRoutes = GENRES.map((g) => ({
        url: `${BASE_URL}/genre?name=${g.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.5,
    }));
    return [...staticRoutes, ...genreRoutes];
}
