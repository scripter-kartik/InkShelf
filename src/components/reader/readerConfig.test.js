import { describe, it, expect } from "vitest";
import {
  READER_THEMES,
  buildContentCss,
  flattenToc,
  formatDuration,
  hrefPath,
  resolveTheme,
  DEFAULT_SETTINGS,
} from "./readerConfig";

describe("reader config", () => {
  it("formats reading time", () => {
    expect(formatDuration(30)).toBe("1 min");
    expect(formatDuration(600)).toBe("10 min");
    expect(formatDuration(3600)).toBe("1 h");
    expect(formatDuration(3600 + 25 * 60)).toBe("1 h 25 min");
    expect(formatDuration(0)).toBeNull();
    expect(formatDuration(NaN)).toBeNull();
  });

  it("flattens nested tables of contents with depth", () => {
    const flat = flattenToc([
      { id: "a", label: " Part One ", href: "p1.xhtml", subitems: [{ id: "b", label: "Chapter 1", href: "c1.xhtml#x" }] },
      { id: "c", label: "Part Two", href: "p2.xhtml" },
    ]);
    expect(flat).toEqual([
      { id: "a", label: "Part One", href: "p1.xhtml", depth: 0 },
      { id: "b", label: "Chapter 1", href: "c1.xhtml#x", depth: 1 },
      { id: "c", label: "Part Two", href: "p2.xhtml", depth: 0 },
    ]);
  });

  it("normalises hrefs for chapter matching", () => {
    expect(hrefPath("./text/chapter-1.xhtml#start")).toBe("text/chapter-1.xhtml");
    expect(hrefPath("/text/chapter-1.xhtml")).toBe("text/chapter-1.xhtml");
    expect(hrefPath()).toBe("");
  });

  it("resolves the auto theme from the site theme", () => {
    expect(resolveTheme("auto", "dark")).toBe(READER_THEMES.dark);
    expect(resolveTheme("auto", "light")).toBe(READER_THEMES.light);
    expect(resolveTheme("sepia", "dark")).toBe(READER_THEMES.sepia);
    expect(resolveTheme("nonsense", "dark")).toBe(READER_THEMES.light);
  });

  it("builds book CSS from settings", () => {
    const css = buildContentCss({ ...DEFAULT_SETTINGS, fontSize: 130, lineHeight: 1.7, font: "serif" }, READER_THEMES.sepia);
    expect(css).toContain("font-size: 130%");
    expect(css).toContain("line-height: 1.7");
    expect(css).toContain("Georgia");
    expect(css).toContain(READER_THEMES.sepia.bg);
    const original = buildContentCss(DEFAULT_SETTINGS, READER_THEMES.light);
    expect(original).not.toContain("font-family");
  });
});
