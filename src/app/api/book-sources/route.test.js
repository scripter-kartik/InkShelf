import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route.js";

let olDocs = [];
let gutResults = [];

function mockUpstreams() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    const u = String(url);
    if (u.startsWith("https://openlibrary.org/search.json")) {
      return { ok: true, json: async () => ({ docs: olDocs }) };
    }
    if (u.startsWith("https://gutendex.com/")) {
      return { ok: true, json: async () => ({ results: gutResults }) };
    }
    throw new Error(`unexpected fetch ${u}`);
  });
}

let n = 0;
const lookup = async (title, author, extra = "") => {
  n += 1;
  const res = await GET(
    new Request(
      `http://test/api/book-sources?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}${extra}&n=${n}`
    )
  );
  return res.json();
};

describe("/api/book-sources", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.__inkshelfStore?.clear();
    olDocs = [];
    gutResults = [];
    mockUpstreams();
  });

  it("prefers a Standard Ebooks EPUB when Open Library links one", async () => {
    olDocs = [{
      key: "/works/OL1W", title: "Pride and Prejudice", author_name: ["Jane Austen"],
      ebook_access: "public", lending_identifier_s: "pp00",
      id_standard_ebooks: ["jane-austen/pride-and-prejudice"], id_project_gutenberg: ["1342"],
    }];
    const data = await lookup("Pride and Prejudice", "Jane Austen");
    expect(data.epubSource).toBe("standardebooks");
    expect(decodeURIComponent(data.epubUrl)).toContain(
      "standardebooks.org/ebooks/jane-austen/pride-and-prejudice/downloads/jane-austen_pride-and-prejudice.epub?source=download"
    );
    expect(data.iaId).toBe("pp00");
  });

  it("falls back to Project Gutenberg ids", async () => {
    olDocs = [{ key: "/works/OL2W", title: "Frankenstein", author_name: ["Mary Shelley"], ebook_access: "public", id_project_gutenberg: ["84"] }];
    const data = await lookup("Frankenstein", "Mary Shelley");
    expect(data.epubSource).toBe("gutenberg");
    expect(decodeURIComponent(data.epubUrl)).toContain("gutenberg.org/ebooks/84.epub3.images");
  });

  it("marks modern lendable books as borrowable without a free copy", async () => {
    olDocs = [{ key: "/works/OL27482W", title: "The Hobbit", author_name: ["J.R.R. Tolkien"], ebook_access: "borrowable", lending_identifier_s: "hobbit00" }];
    const data = await lookup("The Hobbit", "J.R.R. Tolkien");
    expect(data.epubUrl).toBeNull();
    expect(data.iaId).toBeNull();
    expect(data.access).toBe("borrowable");
    expect(data.borrowUrl).toBe("https://openlibrary.org/works/OL27482W");
  });

  it("ignores results whose title or author don't match", async () => {
    olDocs = [{ key: "/works/OL9W", title: "A Completely Different Book", author_name: ["Someone Else"], id_project_gutenberg: ["1"] }];
    gutResults = [{ title: "Unrelated", authors: [{ name: "Nobody" }], media_type: "Text", formats: { "application/epub+zip": "https://www.gutenberg.org/ebooks/1.epub3.images" } }];
    const data = await lookup("Dune", "Frank Herbert");
    expect(data.epubUrl).toBeNull();
    expect(data.access).toBeNull();
  });

  it("uses a Gutendex match when Open Library has no ebook link", async () => {
    gutResults = [{ title: "The Time Machine", authors: [{ name: "Wells, H. G. (Herbert George)" }], media_type: "Text", formats: { "application/epub+zip": "https://www.gutenberg.org/ebooks/35.epub3.images" } }];
    const data = await lookup("The Time Machine", "H. G. Wells");
    expect(data.epubSource).toBe("gutenberg");
  });

  it("does not search Open Library by placeholder author names", async () => {
    await lookup("Some Title", "Unknown");
    const olCall = fetch.mock.calls.map(([u]) => String(u)).find((u) => u.includes("openlibrary.org"));
    expect(olCall).not.toContain("author=");
  });
});
