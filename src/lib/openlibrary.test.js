import { describe, it, expect } from "vitest";
import { coverUrl, workId, parseDescription, gutenbergAuthorName, normalizeGutenberg, isGutenbergId } from "@/lib/openlibrary";
describe("coverUrl", () => {
    it("returns a Google Books https URL unchanged (after http→https upgrade)", () => {
        const input = "http://books.google.com/books/content?id=abc&printsec=frontcover";
        const result = coverUrl(input);
        expect(result).toContain("https://");
        expect(result).not.toContain("http://");
    });
    it("upgrades http Google Books URLs to https", () => {
        expect(coverUrl("http://books.google.com/cover.jpg")).toBe("https://books.google.com/cover.jpg");
    });
    it("strips &edge=curl decoration from Google Books URLs", () => {
        const input = "https://books.google.com/cover.jpg&edge=curl";
        expect(coverUrl(input)).not.toContain("edge=curl");
    });
    it("handles a legacy numeric OpenLibrary cover ID", () => {
        expect(coverUrl("123456")).toBe("https://covers.openlibrary.org/b/id/123456-M.jpg");
    });
    it("handles a numeric OpenLibrary cover ID passed as number type", () => {
        expect(coverUrl(99999)).toBe("https://covers.openlibrary.org/b/id/99999-M.jpg");
    });
    it("returns null when no cover is provided", () => {
        expect(coverUrl(null)).toBeNull();
        expect(coverUrl(undefined)).toBeNull();
        expect(coverUrl("")).toBeNull();
    });
});
describe("workId", () => {
    it("strips the /volumes/ prefix (Google Books)", () => {
        expect(workId("/volumes/zyTCAlFPjgYC")).toBe("zyTCAlFPjgYC");
    });
    it("strips the /works/ prefix (legacy OpenLibrary)", () => {
        expect(workId("/works/OL45804W")).toBe("OL45804W");
    });
    it("strips a leading slash", () => {
        expect(workId("/OL45804W")).toBe("OL45804W");
    });
    it("returns a bare id unchanged", () => {
        expect(workId("zyTCAlFPjgYC")).toBe("zyTCAlFPjgYC");
        expect(workId("OL45804W")).toBe("OL45804W");
    });
    it("handles empty input", () => {
        expect(workId()).toBe("");
    });
});
describe("parseDescription", () => {
    it("keeps basic formatting tags and builds readable plain text", () => {
        const { html, text } = parseDescription("<p><b>Bold</b> and <i>italic</i></p><p>Second<br>line</p>");
        expect(html).toBe("<p><b>Bold</b> and <i>italic</i></p><p>Second<br>line</p>");
        expect(text).toBe("Bold and italic\n\nSecond\nline");
    });
    it("decodes entities for text and re-escapes them for html", () => {
        const { html, text } = parseDescription("Tom &amp; Jerry &#39;quoted&#39; &lt;3");
        expect(text).toBe("Tom & Jerry 'quoted' <3");
        expect(html).toBe("Tom &amp; Jerry 'quoted' &lt;3");
    });
    it("drops disallowed tags and all attributes", () => {
        const { html } = parseDescription('<b onclick="alert(1)">Hi</b><img src=x onerror="alert(1)"><a href="javascript:alert(1)">link</a><script>alert(1)</script>');
        expect(html).toBe("<b>Hi</b>linkalert(1)");
        expect(html).not.toMatch(/onclick|onerror|javascript:|<img|<a|<script/i);
    });
    it("escapes stray angle brackets that are not tags", () => {
        expect(parseDescription("1 < 2 and 3 > 2").html).toBe("1 &lt; 2 and 3 &gt; 2");
    });
    it("turns escaped allowlisted tags into real ones, but keeps escaped dangerous tags as text", () => {
        const { html } = parseDescription("<p>One&lt;br&gt;Two &lt;b&gt;bold&lt;/b&gt; &lt;script&gt;x&lt;/script&gt;</p>");
        expect(html).toBe("<p>One<br>Two <b>bold</b> &lt;script&gt;x&lt;/script&gt;</p>");
    });
    it("handles empty input", () => {
        expect(parseDescription()).toEqual({ html: "", text: "" });
    });
});
describe("Project Gutenberg helpers", () => {
    it("turns catalogue names into reading order", () => {
        expect(gutenbergAuthorName("Austen, Jane")).toBe("Jane Austen");
        expect(gutenbergAuthorName("Wells, H. G. (Herbert George)")).toBe("H. G. Wells");
        expect(gutenbergAuthorName("Homer")).toBe("Homer");
    });
    it("normalises Gutendex books into free cards", () => {
        const book = normalizeGutenberg({
            id: 1342,
            title: "Pride and Prejudice",
            authors: [{ name: "Austen, Jane" }],
            formats: { "image/jpeg": "https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg" },
        });
        expect(book).toMatchObject({
            key: "PG1342",
            title: "Pride and Prejudice",
            author_name: ["Jane Austen"],
            access: "public",
        });
        expect(coverUrl(book.cover_id)).toContain("pg1342.cover");
        expect(workId(book.key)).toBe("PG1342");
    });
    it("recognises Gutenberg ids", () => {
        expect(isGutenbergId("PG1342")).toBe(true);
        expect(isGutenbergId("OL27482W")).toBe(false);
        expect(isGutenbergId("zyTCAlFPjgYC")).toBe(false);
    });
});
