import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "gutenberg.org",
  "www.gutenberg.org",
  "standardebooks.org",
]);

function isAllowedUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && ALLOWED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (!isAllowedUrl(targetUrl)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 400 });
  }

  try {
    const res = await fetch(targetUrl);

    if (res.url && !isAllowedUrl(res.url)) {
      return NextResponse.json({ error: "URL not allowed" }, { status: 400 });
    }

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch EPUB" }, { status: res.status });
    }

    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/epub+zip",
        "Cache-Control": "public, max-age=86400"
      },
    });
  } catch (err) {
    console.error("Proxy EPUB error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
