import { NextResponse } from "next/server";

// Fetches both OpenLibrary IA id and Gutenberg EPUB url in parallel on the server
// so the client only makes one fast request to its own backend.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "";
  const author = searchParams.get("author") || "";

  if (!title) {
    return NextResponse.json({ iaId: null, epubUrl: null });
  }

  const fetchWithTimeout = (url, ms = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal })
      .finally(() => clearTimeout(id));
  };

  const [olResult, gutResult] = await Promise.allSettled([
    fetchWithTimeout(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1`
    ).then((r) => r.json()),

    fetchWithTimeout(
      `https://gutendex.com/books/?search=${encodeURIComponent(title + " " + author)}`
    ).then((r) => r.json()),
  ]);

  let iaId = null;
  let epubUrl = null;

  if (olResult.status === "fulfilled") {
    const data = olResult.value;
    if (data.docs?.[0]?.ia?.length > 0) {
      iaId = data.docs[0].ia[0];
    }
  }

  if (gutResult.status === "fulfilled") {
    const data = gutResult.value;
    const hit = data.results?.find(
      (r) => r.media_type === "Text" && r.formats?.["application/epub+zip"]
    );
    if (hit) {
      epubUrl = `/api/proxy-epub?url=${encodeURIComponent(hit.formats["application/epub+zip"])}`;
    }
  }

  return NextResponse.json({ iaId, epubUrl });
}
