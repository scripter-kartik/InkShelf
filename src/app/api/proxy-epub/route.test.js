import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route.js";

const call = (target) =>
  GET(new Request(`http://test/api/proxy-epub?url=${encodeURIComponent(target)}`));

describe("/api/proxy-epub", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects hosts that are not on the allowlist without fetching them", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    for (const url of ["http://169.254.169.254/latest", "https://evil.example.com/a.epub", "file:///etc/passwd", "not a url"]) {
      const res = await call(url);
      expect(res.status).toBe(400);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("requires a url", async () => {
    const res = await GET(new Request("http://test/api/proxy-epub"));
    expect(res.status).toBe(400);
  });

  it("proxies allowed EPUBs as application/epub+zip", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      url: "https://www.gutenberg.org/cache/epub/84/pg84-images-3.epub",
      arrayBuffer: async () => new Uint8Array([80, 75, 3, 4]).buffer,
    });
    const res = await call("https://www.gutenberg.org/ebooks/84.epub3.images");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/epub+zip");
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("blocks redirects that leave the allowlist", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      url: "http://internal.service/secret",
      arrayBuffer: async () => new ArrayBuffer(0),
    });
    const res = await call("https://www.gutenberg.org/ebooks/84.epub3.images");
    expect(res.status).toBe(400);
  });
});
