import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route.js";

const book = (title, last, extra = {}) => ({
  id: Math.floor(Math.random() * 1e6),
  title,
  language: "English",
  url_librivox: "https://librivox.org/x",
  authors: [{ first_name: "A", last_name: last }],
  sections: [
    { section_number: "2", title: "Chapter 2", listen_url: "http://www.archive.org/download/x/2.mp3", playtime: "600" },
    { section_number: "1", title: "Chapter 1", listen_url: "http://www.archive.org/download/x/1.mp3", playtime: "300" },
  ],
  ...extra,
});

let n = 0;
const lookup = async (title, author) =>
  (await GET(new Request(`http://test/api/audiobook?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&n=${++n}`))).json();

describe("/api/audiobook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.__inkshelfStore?.clear();
  });

  it("matches title and author, orders chapters, and upgrades to https", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, status: 200, json: async () => ({ books: [book("Dracula", "Stoker")] }) });
    const { audiobook } = await lookup("Dracula", "Bram Stoker");
    expect(audiobook.sections.map((s) => s.title)).toEqual(["Chapter 1", "Chapter 2"]);
    expect(audiobook.sections[0].url).toMatch(/^https:/);
    expect(audiobook.totalSeconds).toBe(900);
  });

  it("refuses recordings by a different author", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, status: 200, json: async () => ({ books: [book("Dune", "Somebody")] }) });
    expect((await lookup("Dune", "Frank Herbert")).audiobook).toBeNull();
  });

  it("finds titles filed without a leading article", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => ({
      ok: true,
      status: 200,
      json: async () => ({ books: decodeURIComponent(String(url)).includes("^Adventures") ? [book("Adventures of Sherlock Holmes", "Doyle")] : [] }),
    }));
    const { audiobook } = await lookup("The Adventures of Sherlock Holmes", "Arthur Conan Doyle");
    expect(audiobook?.title).toBe("Adventures of Sherlock Holmes");
  });

  it("prefers English over other languages", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ books: [book("Emma", "Austen", { language: "German" }), book("Emma", "Austen")] }),
    });
    expect((await lookup("Emma", "Jane Austen")).audiobook.language).toBe("English");
  });
});
