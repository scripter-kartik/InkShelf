import { describe, it, expect, vi, beforeEach } from "vitest";

const generateContent = vi.fn();
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    constructor() {
      this.models = { generateContent };
    }
  },
  Type: { OBJECT: "OBJECT", STRING: "STRING", INTEGER: "INTEGER", ARRAY: "ARRAY" },
}));

process.env.GEMINI_API_KEY = "test-key";
const { POST } = await import("./route.js");

let ip = 0;
const summarize = (body, headers = {}) =>
  POST(
    new Request("http://test/api/ai-summary", {
      method: "POST",
      headers: { "x-forwarded-for": `10.0.0.${++ip}`, ...headers },
      body: JSON.stringify(body),
    })
  );

describe("/api/ai-summary", () => {
  beforeEach(() => {
    generateContent.mockReset();
    globalThis.__inkshelfStore?.clear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("requires a title", async () => {
    const res = await summarize({ author: "Someone" });
    expect(res.status).toBe(400);
  });

  it("falls back to the next model when the first is overloaded", async () => {
    generateContent
      .mockRejectedValueOnce(Object.assign(new Error("busy"), { status: 503 }))
      .mockResolvedValueOnce({ text: "## Overview\nGreat book." });
    const res = await summarize({ title: "Dune", author: "Frank Herbert" });
    expect(res.status).toBe(200);
    expect((await res.json()).summary).toContain("Great book");
    expect(generateContent.mock.calls.map(([args]) => args.model)).toEqual([
      "gemini-flash-latest",
      "gemini-flash-lite-latest",
    ]);
  });

  it("includes the description so lesser-known books can be summarised", async () => {
    generateContent.mockResolvedValue({ text: "summary" });
    await summarize({ title: "Obscure Quiz Book", author: "A. Author", description: "Multiple-choice questions.", subjects: ["Study Aids"] });
    const prompt = generateContent.mock.calls[0][0].contents;
    expect(prompt).toContain("Multiple-choice questions.");
    expect(prompt).toContain("Study Aids");
  });

  it("caches summaries so repeat requests don't call Gemini", async () => {
    generateContent.mockResolvedValue({ text: "cached summary" });
    await summarize({ title: "Emma", author: "Jane Austen" });
    const res = await summarize({ title: "Emma", author: "Jane Austen" });
    expect((await res.json()).summary).toBe("cached summary");
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("reports a busy service when every model fails", async () => {
    generateContent.mockRejectedValue(Object.assign(new Error("busy"), { status: 503 }));
    const res = await summarize({ title: "Persuasion", author: "Jane Austen" });
    expect(res.status).toBe(503);
  });

  it("rate-limits a single client", async () => {
    generateContent.mockResolvedValue({ text: "ok" });
    const headers = { "x-forwarded-for": "203.0.113.7" };
    const statuses = [];
    for (let i = 0; i < 11; i++) {
      const res = await POST(
        new Request("http://test/api/ai-summary", {
          method: "POST",
          headers,
          body: JSON.stringify({ title: `Book ${i}` }),
        })
      );
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(statuses[10]).toBe(429);
  });

  it("returns structured key ideas in JSON mode", async () => {
    generateContent.mockResolvedValue({
      text: JSON.stringify({
        basedOn: "knowledge",
        oneLiner: "Small habits compound.",
        readingMinutes: 12,
        ideas: [
          { title: "Compound growth", explanation: "Tiny gains add up.", takeaway: "Improve 1% a day." },
          { title: "Identity", explanation: "Habits shape who you are.", takeaway: "Decide who to be." },
        ],
        whoShouldRead: "Anyone building habits.",
      }),
    });
    const res = await summarize({ mode: "ideas", title: "Atomic Habits", author: "James Clear" });
    expect(res.status).toBe(200);
    const { ideas } = await res.json();
    expect(ideas.ideas).toHaveLength(2);
    expect(ideas.oneLiner).toBe("Small habits compound.");
    const config = generateContent.mock.calls[0][0].config;
    expect(config.responseMimeType).toBe("application/json");
    expect(generateContent.mock.calls[0][0].contents).toMatch(/never quote or reproduce/i);
  });

  it("caches key ideas separately from the summary", async () => {
    generateContent.mockResolvedValueOnce({ text: "plain summary" });
    await summarize({ title: "Walden", author: "Henry David Thoreau" });
    generateContent.mockResolvedValueOnce({
      text: JSON.stringify({ basedOn: "knowledge", oneLiner: "Live deliberately.", ideas: [], whoShouldRead: "" }),
    });
    const res = await summarize({ mode: "ideas", title: "Walden", author: "Henry David Thoreau" });
    expect((await res.json()).ideas.oneLiner).toBe("Live deliberately.");
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("rejects malformed key-ideas output", async () => {
    generateContent.mockResolvedValue({ text: "not json" });
    const res = await summarize({ mode: "ideas", title: "Emma 2", author: "Jane Austen" });
    expect(res.status).toBe(502);
  });
});
