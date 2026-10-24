const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const MEMORY_MAX = 5000;

export const hasSharedStore = Boolean(REDIS_URL && REDIS_TOKEN);

const memory = (globalThis.__inkshelfStore ??= new Map());

function memorySet(key, value, ttlMs) {
  if (memory.size >= MEMORY_MAX) memory.delete(memory.keys().next().value);
  memory.set(key, { value, expires: Date.now() + ttlMs });
}

function memoryGet(key) {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expires <= Date.now()) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

async function redis(path, body) {
  const res = await fetch(`${REDIS_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`Redis request failed (${res.status})`);
  return res.json();
}

export async function cacheGet(key) {
  if (hasSharedStore) {
    try {
      const { result } = await redis("", ["GET", key]);
      return result == null ? null : JSON.parse(result);
    } catch (err) {
      console.warn("Shared cache read failed, using memory:", err.message);
    }
  }
  return memoryGet(key);
}

export async function cacheSet(key, value, ttlMs) {
  memorySet(key, value, ttlMs);
  if (!hasSharedStore) return;
  try {
    await redis("", ["SET", key, JSON.stringify(value), "PX", String(Math.max(1, Math.round(ttlMs)))]);
  } catch (err) {
    console.warn("Shared cache write failed:", err.message);
  }
}

export async function rateLimit(key, limit, windowMs) {
  const bucket = `ratelimit:${key}`;
  if (hasSharedStore) {
    try {
      const [incr] = await redis("/pipeline", [
        ["INCR", bucket],
        ["PEXPIRE", bucket, String(windowMs), "NX"],
      ]);
      const count = Number(incr.result);
      return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
    } catch (err) {
      console.warn("Shared rate limit failed, using memory:", err.message);
    }
  }
  const entry = memory.get(bucket);
  const now = Date.now();
  if (!entry || entry.expires <= now) {
    memorySet(bucket, 1, windowMs);
    return { allowed: true, remaining: limit - 1 };
  }
  entry.value += 1;
  return { allowed: entry.value <= limit, remaining: Math.max(0, limit - entry.value) };
}

export function clientIp(headers) {
  const get = (name) =>
    typeof headers?.get === "function" ? headers.get(name) : headers?.[name] ?? headers?.[name.toLowerCase()];
  const forwarded = get("x-forwarded-for");
  return (forwarded ? String(forwarded).split(",")[0].trim() : get("x-real-ip")) || "unknown";
}
