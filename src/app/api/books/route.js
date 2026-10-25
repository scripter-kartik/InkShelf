import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { cacheGet, cacheSet, clientIp } from "@/lib/store";
import {
  fetchBooksByGenre,
  searchBooks,
  searchFreeBooks,
  fetchFreeBooks,
  fetchTextbooks,
  fetchSuggestions,
  fetchWorkDetail,
} from "@/lib/openlibrary";

const TTL_MS = {
  subject: 12 * 60 * 60 * 1000,
  search: 6 * 60 * 60 * 1000,
  suggest: 6 * 60 * 60 * 1000,
  free: 24 * 60 * 60 * 1000,
  textbooks: 24 * 60 * 60 * 1000,
};
const FALLBACK_TTL_MS = 2 * 60 * 1000;
const inFlight = new Map();

const SOURCES = new Set(["google", "openlibrary", "mock"]);

function isPlaceholder(books = []) {
  return books.some((b) => String(b.key).startsWith("mock_"));
}

function parse(searchParams, quotaUser) {
  const type = searchParams.get("type");
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "12", 10) || 12, 1), 40);

  if (type === "subject") {
    const key = (searchParams.get("key") || "").toLowerCase();
    if (!/^[a-z_]{1,40}$/.test(key)) return null;
    return { type, cacheKey: `subject|${key}|${limit}`, run: async () => {
      const books = await fetchBooksByGenre(key, limit);
      return { data: { books }, placeholder: isPlaceholder(books) };
    } };
  }

  if (type === "detail") {
    const id = searchParams.get("id") || "";
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) return null;
    return { type, cacheKey: null, run: async () => {
      await fetchWorkDetail(id);
      return { data: { ok: true }, placeholder: false };
    } };
  }

  const q = (searchParams.get("q") || "").trim().slice(0, 200);
  const page = Math.min(Math.max(parseInt(searchParams.get("page") || "0", 10) || 0, 0), 200);

  if (type === "free") {
    const topic = (searchParams.get("topic") || "").toLowerCase().trim().slice(0, 40);
    if (topic && !/^[a-z][a-z ]*$/.test(topic)) return null;
    return { type, cacheKey: `free|${topic}|${q.toLowerCase()}|${page}`, run: async () => {
      const data = await fetchFreeBooks({ topic, search: q, page });
      return { data, placeholder: false };
    } };
  }

  if (type === "textbooks") {
    return { type, cacheKey: `textbooks|${q.toLowerCase()}|${page}`, run: async () => {
      const data = await fetchTextbooks({ search: q, page });
      return { data, placeholder: false };
    } };
  }

  if (!q) return null;

  if (type === "search") {
    if (searchParams.get("free") === "1") {
      return { type, cacheKey: `search-free|${q.toLowerCase()}|${page}`, run: async () => {
        const data = await searchFreeBooks(q, { page, quotaUser });
        return { data, placeholder: Boolean(data.partial) };
      } };
    }
    const sourceParam = searchParams.get("source");
    const source = SOURCES.has(sourceParam) ? sourceParam : undefined;
    return { type, cacheKey: `search|${q.toLowerCase()}|${page}|${source || ""}`, run: async () => {
      const data = await searchBooks(q, { page, source, quotaUser });
      return { data, placeholder: data.source === "mock" || Boolean(data.fallback) };
    } };
  }

  if (type === "suggest") {
    return { type, cacheKey: `suggest|${q.toLowerCase()}|${limit}`, run: async () => {
      const titles = await fetchSuggestions(q, limit, undefined, quotaUser);
      return { data: { titles }, placeholder: false };
    } };
  }

  return null;
}

export async function GET(request) {
  const quotaUser = crypto.createHash("sha256").update(clientIp(request.headers)).digest("hex").slice(0, 32);
  const req = parse(new URL(request.url).searchParams, quotaUser);
  if (!req) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (req.type === "detail") {
    try {
      return NextResponse.json((await req.run()).data);
    } catch (err) {
      return NextResponse.json({ ok: false }, { status: err.status === 404 ? 404 : 502 });
    }
  }

  const storeKey = `books:${req.cacheKey}`;
  const hit = await cacheGet(storeKey);
  if (hit) {
    return NextResponse.json(hit, { headers: { "X-Cache": "HIT" } });
  }

  let pending = inFlight.get(req.cacheKey);
  if (!pending) {
    pending = req.run().finally(() => inFlight.delete(req.cacheKey));
    inFlight.set(req.cacheKey, pending);
  }

  try {
    const { data, placeholder } = await pending;
    await cacheSet(storeKey, data, placeholder ? FALLBACK_TTL_MS : TTL_MS[req.type]);
    return NextResponse.json(data, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    console.error("Books API failed:", err.message);
    return NextResponse.json({ error: "Failed to load books." }, { status: 502 });
  }
}
