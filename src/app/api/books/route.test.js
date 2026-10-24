import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/openlibrary", () => ({
  fetchBooksByGenre: vi.fn(async () => [{ key: "/works/OL1W", title: "A" }]),
  searchBooks: vi.fn(async () => ({ books: [{ key: "g1", title: "B" }], hasMore: true, source: "google" })),
  fetchSuggestions: vi.fn(async () => ["Dune"]),
  fetchWorkDetail: vi.fn(async () => ({ title: "X" })),
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
    expect(lib.searchBooks).toHaveBeenCalledWith("dune", { page: 2, source: "openlibrary" });
  });

  it("preloads book details", async () => {
    const res = await get("type=detail&id=OL27482W");
    expect(res.status).toBe(200);
    expect(lib.fetchWorkDetail).toHaveBeenCalledWith("OL27482W");
  });
});
