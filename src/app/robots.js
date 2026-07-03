const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
export default function robots() {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/", "/profile", "/favorites", "/shelf"],
        },
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
