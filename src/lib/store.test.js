import { describe, it, expect, beforeEach } from "vitest";
import { cacheGet, cacheSet, rateLimit, clientIp, hasSharedStore } from "./store.js";

describe("store (memory fallback)", () => {
  beforeEach(() => globalThis.__inkshelfStore?.clear());

  it("uses memory when Upstash isn't configured", () => {
    expect(hasSharedStore).toBe(false);
  });

  it("stores and expires values", async () => {
    await cacheSet("k", { a: 1 }, 50);
    expect(await cacheGet("k")).toEqual({ a: 1 });
    await new Promise((r) => setTimeout(r, 60));
    expect(await cacheGet("k")).toBeNull();
  });

  it("allows up to the limit within a window", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push((await rateLimit("test", 3, 1000)).allowed);
    expect(results).toEqual([true, true, true, false]);
  });

  it("reads the client IP from Headers or plain objects", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp({ "x-real-ip": "5.6.7.8" })).toBe("5.6.7.8");
    expect(clientIp(undefined)).toBe("unknown");
  });
});
