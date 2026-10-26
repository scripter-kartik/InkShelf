import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/openlibrary", () => ({
  fetchBooksByGenre: vi.fn(async () => [{ key: "/works/OL1W", title: "A" }]),
  searchBooks: vi.fn(async () => ({ books: [{ key: "g1", title: "B" }], hasMore: true, source: "google" })),
  fetchSuggestions: vi.fn(async () => ["Dune"]),
  fetchWorkDetail: vi.fn(async () => ({ title: "X" })),
  searchFreeBooks: vi.fn(async () => ({ books: [{ key: "PG1661", title: "Sherlock", access: "public" }], hasMore: false, source: "free" })),
}));

const lib = await import("@/lib/openlibrary");
const { GET } = await import("./route.js");
const get = (qs) => GET(new Request(`http://test/api/books?${qs}`));

describe("/api/books", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.__inkshelfStore?.clear();
  });

  it("rejects invalid input", async () => {
    for (const qs of ["", "type=nope", "type=subject&key=../../etc", "type=search", "type=detail&id=a/b"]) {
      expect((await get(qs)).status).toBe(400);
    }
  });

  it("caches subject lists", async () => {
    const first = await get("type=subject&key=fantasy&limit=12");
    expect(first.headers.get("x-cache")).toBe("MISS");
    const second = await get("type=subject&key=fantasy&limit=12");
    expect(second.headers.get("x-cache")).toBe("HIT");
    expect(await second.json()).toEqual({ books: [{ key: "/works/OL1W", title: "A" }] });
    expect(lib.fetchBooksByGenre).toHaveBeenCalledTimes(1);
  });

  it("shares one lookup between identical concurrent requests", async () => {
    await Promise.all([get("type=search&q=dune"), get("type=search&q=dune"), get("type=search&q=dune")]);
    expect(lib.searchBooks).toHaveBeenCalledTimes(1);
  });

  it("passes search paging and source through", async () => {
    await get("type=search&q=dune&page=2&source=openlibrary");
    expect(lib.searchBooks).toHaveBeenCalledWith("dune", expect.objectContaining({ page: 2, source: "openlibrary" }));
  });

  it("preloads book details", async () => {
    const res = await get("type=detail&id=OL27482W");
    expect(res.status).toBe(200);
    expect(lib.fetchWorkDetail).toHaveBeenCalledWith("OL27482W");
  });

  it("routes free-only searches to the free search", async () => {
    const res = await get("type=search&q=sherlock&free=1");
    expect((await res.json()).source).toBe("free");
    expect(lib.searchFreeBooks).toHaveBeenCalledWith("sherlock", expect.objectContaining({ page: 0 }));
    expect(lib.searchBooks).not.toHaveBeenCalled();
  });

  it("identifies visitors to Google with an anonymous per-IP quota id", async () => {
    await GET(new Request("http://test/api/books?type=search&q=quota", { headers: { "x-forwarded-for": "198.51.100.9" } }));
    const { quotaUser } = lib.searchBooks.mock.calls[0][1];
    expect(quotaUser).toMatch(/^[a-f0-9]{32}$/);
    expect(quotaUser).not.toContain("198.51.100.9");
  });

  it("does not cache fallback results for long", async () => {
    lib.searchBooks.mockResolvedValueOnce({ books: [{ key: "/works/OL1W", title: "A" }], hasMore: false, source: "openlibrary", fallback: true });
    await get("type=search&q=flaky");
    const entry = [...globalThis.__inkshelfStore.entries()].find(([k]) => k.includes("flaky"));
    expect(entry[1].expires - Date.now()).toBeLessThanOrEqual(2 * 60 * 1000);
  });
});
