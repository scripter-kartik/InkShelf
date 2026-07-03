import { describe, it, expect } from "vitest";
import { coverUrl, workId } from "@/lib/openlibrary";
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
