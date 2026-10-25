import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/store";

const FOUND_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MISSING_TTL_MS = 24 * 60 * 60 * 1000;
const UA = "InkShelf/1.0 (+https://ink-shelf.vercel.app)";

function normalize(s = "") {
  return s
    .toLowerCase()
    .split(/[:;(]/)[0]
    .replace(/&/g, "and")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/^\s*(the|a|an)\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function surname(author = "") {
  const parts = author.toLowerCase().replace(/[^a-z ]/g, " ").trim().split(/\s+/);
  return parts[parts.length - 1] || "";
}

function toSeconds(playtime) {
  const n = Number(playtime);
  if (Number.isFinite(n)) return n;
  const parts = String(playtime || "").split(":").map(Number);
  return parts.reduce((acc, p) => acc * 60 + (Number.isFinite(p) ? p : 0), 0);
}

async function findAudiobook(title, author) {
  const searchTitle = title.split(/[:;(]/)[0].trim();
  const variants = [...new Set([searchTitle, searchTitle.replace(/^(the|a|an)\s+/i, "")])];
  const results = await Promise.all(
    variants.map(async (v) => {
      const url = `https://librivox.org/api/feed/audiobooks/?title=${encodeURIComponent(`^${v}`)}&format=json&extended=1&limit=15`;
      const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
      if (res.status === 404) return [];
      if (!res.ok) throw new Error(`LibriVox request failed (${res.status})`);
      return (await res.json()).books || [];
    })
  );
  const data = { books: results.flat() };
  const wantTitle = normalize(title);
  const wantAuthor = surname(author);

  const candidates = (data.books || []).filter((b) => {
    const t = normalize(b.title);
    const titleOk = t === wantTitle || t.startsWith(`${wantTitle} `) || wantTitle.startsWith(`${t} `);
    const authors = (b.authors || []).map((a) => `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase());
    const authorOk = !wantAuthor || wantAuthor === "unknown" || authors.some((a) => a.includes(wantAuthor));
    return titleOk && authorOk && (b.sections || []).length > 0;
  });
  if (!candidates.length) return null;

  const book =
    candidates.find((b) => b.language === "English" && !/dramatic reading/i.test(b.title)) ||
    candidates.find((b) => b.language === "English") ||
    candidates[0];

  const sections = (book.sections || [])
    .filter((s) => s.listen_url)
    .sort((a, b) => Number(a.section_number) - Number(b.section_number))
    .map((s) => ({
      title: (s.title || `Section ${s.section_number}`).trim(),
      url: s.listen_url.replace(/^http:/, "https:"),
      seconds: toSeconds(s.playtime),
      reader: (s.readers || [])[0]?.display_name || null,
    }));
  if (!sections.length) return null;

  return {
    id: book.id,
    title: book.title,
    language: book.language,
    totalSeconds: sections.reduce((sum, s) => sum + s.seconds, 0),
    librivoxUrl: book.url_librivox || null,
    sections,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") || "").trim().slice(0, 200);
  const author = (searchParams.get("author") || "").trim().slice(0, 120);
  if (!title) {
    return NextResponse.json({ audiobook: null }, { status: 400 });
  }

  const key = `audiobook:v2:${normalize(title)}|${surname(author)}`;
  const cached = await cacheGet(key);
  if (cached) return NextResponse.json(cached);

  try {
    const audiobook = await findAudiobook(title, author);
    const data = { audiobook };
    await cacheSet(key, data, audiobook ? FOUND_TTL_MS : MISSING_TTL_MS);
    return NextResponse.json(data);
  } catch (err) {
    console.warn("Audiobook lookup failed:", err.message);
    return NextResponse.json({ audiobook: null });
  }
}
