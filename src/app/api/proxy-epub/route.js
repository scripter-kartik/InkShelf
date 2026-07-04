import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const res = await fetch(targetUrl);
    
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch EPUB" }, { status: res.status });
    }

    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/epub+zip",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400"
      },
    });
  } catch (err) {
    console.error("Proxy EPUB error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
