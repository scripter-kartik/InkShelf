import { NextResponse } from "next/server";

const OL_TIMEOUT_MS = 40000;
const GUTENDEX_TIMEOUT_MS = 15000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 1000;
const cache = new Map();
const inFlight = new Map();
const PARTIAL_TTL_MS = 10 * 60 * 1000;

const ACCESS_RANK = { public: 3, borrowable: 2, printdisabled: 1, no_ebook: 0 };

function normalizeTitle(s = "") {
  return s
    .toLowerCase()
    .split(/[:(;]/)[0]
    .replace(/&/g, "and")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/^\s*(the|a|an)\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titlesMatch(a, b) {
  const x = normalizeTitle(a);
  const y = normalizeTitle(b);
  if (!x || !y) return false;
  return x === y || x.startsWith(`${y} `) || y.startsWith(`${x} `);
}

function surname(author = "") {
  const parts = author.toLowerCase().replace(/[^a-z ]/g, " ").trim().split(/\s+/);
  return parts[parts.length - 1] || "";
}

function authorMatches(names = [], author) {
  const last = surname(author);
  if (!last || last === "unknown") return true;
  return names.some((n) => n.toLowerCase().includes(last));
}

async function getJson(url, timeoutMs) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

const proxied = (url) => `/api/proxy-epub?url=${encodeURIComponent(url)}`;

function standardEbooksUrl(slug) {
  return `https://standardebooks.org/ebooks/${slug}/downloads/${slug.replaceAll("/", "_")}.epub?source=download`;
}

function gutenbergUrl(id) {
  return `https://www.gutenberg.org/ebooks/${id}.epub3.images`;
}

async function findSources(title, author, olid) {
  const olFields = "key,title,author_name,ebook_access,lending_identifier_s,id_project_gutenberg,id_standard_ebooks";
  const olQuery = `title=${encodeURIComponent(title)}${author ? `&author=${encodeURIComponent(author)}` : ""}`;

  const [olResult, gutResult] = await Promise.allSettled([
    getJson(`https://openlibrary.org/search.json?${olQuery}&limit=10&fields=${olFields}`, OL_TIMEOUT_MS),
    getJson(`https://gutendex.com/books/?search=${encodeURIComponent(`${title} ${author}`.trim())}`, GUTENDEX_TIMEOUT_MS),
  ]);

  const docs = olResult.status === "fulfilled" ? olResult.value.docs || [] : [];
  const matches = docs.filter(
    (d) =>
      (olid && d.key === `/works/${olid}`) ||
      (titlesMatch(d.title, title) && authorMatches(d.author_name, author))
  );

  const result = {
    complete: olResult.status === "fulfilled" && gutResult.status === "fulfilled",
    epubUrl: null,
    epubSource: null,
    iaId: null,
    access: null,
    borrowUrl: null,
    openLibraryUrl: matches[0] ? `https://openlibrary.org${matches[0].key}` : null,
  };

  const se = matches.find((d) => d.id_standard_ebooks?.length);
  const pg = matches.find((d) => d.id_project_gutenberg?.length);
  if (se) {
    result.epubUrl = proxied(standardEbooksUrl(se.id_standard_ebooks[0]));
    result.epubSource = "standardebooks";
  } else if (pg) {
    result.epubUrl = proxied(gutenbergUrl(pg.id_project_gutenberg[0]));
    result.epubSource = "gutenberg";
  }

  if (!result.epubUrl && gutResult.status === "fulfilled") {
    const hit = (gutResult.value.results || []).find(
      (r) =>
        r.media_type === "Text" &&
        r.formats?.["application/epub+zip"] &&
        titlesMatch(r.title, title) &&
        authorMatches((r.authors || []).map((a) => a.name), author)
    );
    if (hit) {
      result.epubUrl = proxied(hit.formats["application/epub+zip"]);
      result.epubSource = "gutenberg";
    }
  }

  const best = [...matches].sort(
    (a, b) => (ACCESS_RANK[b.ebook_access] ?? 0) - (ACCESS_RANK[a.ebook_access] ?? 0)
  )[0];
  if (best) {
    result.access = best.ebook_access || null;
    if (best.ebook_access === "public" && best.lending_identifier_s) {
      result.iaId = best.lending_identifier_s;
    }
    if (best.ebook_access === "borrowable") {
      result.borrowUrl = `https://openlibrary.org${best.key}`;
    }
  }

  return result;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") || "").trim().slice(0, 300);
  const rawAuthor = (searchParams.get("author") || "").trim().slice(0, 200);
  const author = /^unknown( author)?$/i.test(rawAuthor) ? "" : rawAuthor;
  const olidParam = searchParams.get("olid") || "";
  const olid = /^OL\d+W$/i.test(olidParam) ? olidParam.toUpperCase() : null;

  if (!title) {
    return NextResponse.json({ epubUrl: null, iaId: null, access: null, borrowUrl: null });
  }

  const cacheKey = `${title.toLowerCase()}|${author.toLowerCase()}|${olid || ""}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() < hit.expires) {
    return NextResponse.json(hit.data);
  }

  let pending = inFlight.get(cacheKey);
  if (!pending) {
    pending = findSources(title, author, olid).finally(() => inFlight.delete(cacheKey));
    inFlight.set(cacheKey, pending);
  }
  const { complete, ...data } = await pending;

  const ttl = complete || data.epubUrl ? CACHE_TTL_MS : PARTIAL_TTL_MS;
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(cacheKey, { expires: Date.now() + ttl, data });

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": ttl === CACHE_TTL_MS
        ? "public, s-maxage=86400, stale-while-revalidate=604800"
        : "no-store",
    },
  });
}
