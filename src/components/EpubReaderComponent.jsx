"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ePub, { EpubCFI } from "epubjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  List,
  Search,
  Bookmark,
  Type,
  StickyNote,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { ReaderSidebar, ReaderSettings, SelectionMenu, NoteEditor } from "@/components/reader/ReaderPanels";
import {
  CHARS_PER_PAGE,
  HIGHLIGHT_COLORS,
  READER_THEMES,
  WIDTH_OPTIONS,
  buildContentCss,
  flattenToc,
  formatDuration,
  hrefPath,
  resolveTheme,
} from "@/components/reader/readerConfig";
import {
  keys,
  sourceIdFor,
  loadSettings,
  saveSettings,
  loadList,
  saveList,
  loadPosition,
  savePosition,
  loadLocations,
  saveLocations,
  loadSpeed,
  saveSpeed,
} from "@/components/reader/readerStorage";

const cfiTool = new EpubCFI();

function compareCfi(a, b) {
  try {
    return cfiTool.compare(a, b);
  } catch {
    return 0;
  }
}

function sortByCfi(list, field) {
  return [...list].sort((a, b) => compareCfi(a[field], b[field]));
}

const VISUALLY_HIDDEN = {
  left: "0",
  top: "0",
  right: "auto",
  bottom: "auto",
  width: "1px",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
};

function containOffscreenText(contents) {
  const doc = contents.document;
  const win = doc?.defaultView;
  if (!doc?.body || !win) return;
  for (const el of doc.body.querySelectorAll("*")) {
    const cs = win.getComputedStyle(el);
    if (cs.position !== "absolute" && cs.position !== "fixed") continue;
    const far = [cs.left, cs.top, cs.right].some((v) => parseFloat(v) < -500);
    if (far) Object.assign(el.style, VISUALLY_HIDDEN);
  }
}

const STYLE_KEY = "inkshelf-reader";

function applyReaderCss(contents, css) {
  try {
    contents.addStylesheetCss(css, STYLE_KEY);
  } catch {}
}

function pageForCfi(book, cfi) {
  const locations = book?.locations;
  if (!cfi || !locations || locations.length() === 0) return null;
  const index = locations.locationFromCfi(cfi);
  return index >= 0 ? Math.min(index + 1, locations.length()) : null;
}

function sectionTitlesFor(book, toc) {
  const items = book?.spine?.spineItems || [];
  let previous = "";
  return items.map((item) => {
    const path = hrefPath(item.href);
    const match = toc.find((t) => {
      const tp = hrefPath(t.href);
      return tp && (path === tp || path.endsWith(`/${tp}`) || tp.endsWith(`/${path}`));
    });
    if (match?.label) previous = match.label;
    return match?.label || previous;
  });
}

export default function EpubReaderComponent({ url, title, bookKey }) {
  const { theme: siteTheme } = useTheme();
  const sourceId = sourceIdFor(url);
  const storage = useMemo(
    () => ({
      position: keys.position(bookKey, sourceId),
      locations: keys.locations(sourceId),
      bookmarks: keys.bookmarks(bookKey, sourceId),
      highlights: keys.highlights(bookKey, sourceId),
    }),
    [bookKey, sourceId]
  );

  const [settings, setSettings] = useState(loadSettings);
  const colors = resolveTheme(settings.theme, siteTheme);
  const isDarkTheme = colors === READER_THEMES.dark;
  const paginated = settings.flow === "paginated";
  const maxWidth = WIDTH_OPTIONS.find((w) => w.value === settings.width)?.maxWidth || 820;

  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState("loading");
  const [toc, setToc] = useState([]);
  const [locationsReady, setLocationsReady] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [loc, setLoc] = useState(null);
  const [panel, setPanel] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [bookmarks, setBookmarks] = useState(() => loadList(storage.bookmarks));
  const [highlights, setHighlights] = useState(() => loadList(storage.highlights));
  const [selection, setSelection] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState({ query: "", results: [], searching: false, capped: false });
  const [searchSeed, setSearchSeed] = useState("");
  const [scrub, setScrub] = useState(null);
  const [goTo, setGoTo] = useState(null);
  const [toast, setToast] = useState(null);

  const rootRef = useRef(null);
  const viewerRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);
  const tocRef = useRef([]);
  const sectionTitlesRef = useRef([]);
  const spineByLocationRef = useRef([]);
  const currentCfiRef = useRef(undefined);
  const resumedFromRef = useRef(null);
  const speedRef = useRef(null);
  const lastTurnRef = useRef({ page: null, at: 0 });
  const lastProgressRef = useRef(null);
  const touchRef = useRef(null);
  const searchTokenRef = useRef(0);
  const highlightsRef = useRef(highlights);
  const handlersRef = useRef({});
  const locationsReadyRef = useRef(false);

  if (currentCfiRef.current === undefined) {
    currentCfiRef.current = loadPosition(storage.position) || null;
    resumedFromRef.current = currentCfiRef.current;
  }

  useEffect(() => {
    highlightsRef.current = highlights;
  }, [highlights]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const markStyle = useCallback(
    (color) => ({
      fill: HIGHLIGHT_COLORS.find((c) => c.value === color)?.fill || HIGHLIGHT_COLORS[0].fill,
      "fill-opacity": isDarkTheme ? "0.3" : "0.38",
      "mix-blend-mode": isDarkTheme ? "normal" : "multiply",
    }),
    [isDarkTheme]
  );

  const addMark = useCallback(
    (rendition, h) => {
      try {
        rendition.annotations.highlight(
          h.cfiRange,
          {},
          () => handlersRef.current.markClicked?.(h.cfiRange),
          "inkshelf-highlight",
          markStyle(h.color)
        );
      } catch {}
    },
    [markStyle]
  );

  const contentCssRef = useRef("");
  contentCssRef.current = buildContentCss(settings, colors);
  const addMarkRef = useRef(addMark);
  addMarkRef.current = addMark;

  const removeMark = (rendition, cfiRange) => {
    try {
      rendition.annotations.remove(cfiRange, "highlight");
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    locationsReadyRef.current = false;
    setLocationsReady(false);
    setTotalPages(0);
    setToc([]);
    setLoc(null);

    const book = ePub(url, { openAs: "epub" });
    bookRef.current = book;

    book.loaded.navigation
      .then((nav) => {
        if (cancelled) return;
        const flat = flattenToc(nav.toc);
        tocRef.current = flat;
        setToc(flat);
        sectionTitlesRef.current = sectionTitlesFor(book, flat);
      })
      .catch(() => {});

    book.ready
      .then(async () => {
        if (cancelled) return;
        sectionTitlesRef.current = sectionTitlesFor(book, tocRef.current);
        const cached = sourceId === "upload" ? null : loadLocations(storage.locations);
        if (cached) {
          book.locations.load(cached);
        } else {
          await book.locations.generate(CHARS_PER_PAGE);
          if (cancelled) return;
          if (sourceId !== "upload") saveLocations(storage.locations, book.locations.save());
        }
        const cfis = JSON.parse(book.locations.save());
        spineByLocationRef.current = cfis.map((c) => {
          try {
            return new EpubCFI(c).spinePos;
          } catch {
            return -1;
          }
        });
        setTotalPages(book.locations.length());
        locationsReadyRef.current = true;
        setLocationsReady(true);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      searchTokenRef.current += 1;
      try {
        book.destroy();
      } catch {}
      if (bookRef.current === book) bookRef.current = null;
    };
  }, [url, sourceId, storage.locations, reloadKey]);

  useEffect(() => {
    const book = bookRef.current;
    const el = viewerRef.current;
    if (!book || !el) return;
    el.innerHTML = "";
    appliedCssRef.current = contentCssRef.current;

    const rendition = book.renderTo(el, {
      width: "100%",
      height: "100%",
      flow: settings.flow,
      manager: settings.flow === "paginated" ? "default" : "continuous",
      spread: settings.spread === "none" ? "none" : "auto",
      minSpreadWidth: 900,
      allowScriptedContent: false,
    });
    renditionRef.current = rendition;
    rendition.hooks.content.register(containOffscreenText);
    rendition.hooks.content.register((contents) => applyReaderCss(contents, contentCssRef.current));

    const forward = (name) => (...args) => handlersRef.current[name]?.(...args);
    rendition.on("relocated", forward("relocated"));
    rendition.on("selected", forward("selected"));
    rendition.on("click", forward("click"));
    rendition.on("keydown", forward("key"));
    rendition.on("touchstart", forward("touchstart"));
    rendition.on("touchend", forward("touchend"));

    highlightsRef.current.forEach((h) => addMarkRef.current(rendition, h));

    const anchor = currentCfiRef.current || undefined;
    let settleTimer;
    rendition
      .display(anchor)
      .catch(() => rendition.display())
      .then(() => {
        setStatus((s) => (s === "error" ? s : "ready"));
        if (settings.flow !== "paginated" && anchor) {
          settleTimer = setTimeout(() => {
            rendition.display(anchor).catch(() => {});
          }, 600);
        }
      })
      .catch(() => setStatus("error"));

    return () => {
      clearTimeout(settleTimer);
      try {
        rendition.destroy();
      } catch {}
      if (renditionRef.current === rendition) renditionRef.current = null;
    };
  }, [url, reloadKey, settings.flow, settings.spread]);

  const contentCss = contentCssRef.current;
  const appliedCssRef = useRef(null);
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition || status !== "ready") return;
    const reflow = appliedCssRef.current !== null && appliedCssRef.current !== contentCss;
    const anchor = currentCfiRef.current;
    appliedCssRef.current = contentCss;
    rendition.getContents().forEach((contents) => applyReaderCss(contents, contentCss));
    highlightsRef.current.forEach((h) => {
      try {
        rendition.annotations.remove(h.cfiRange, "highlight");
      } catch {}
      addMarkRef.current(rendition, h);
    });
    if (reflow && anchor) {
      const t = setTimeout(() => {
        rendition.display(anchor).catch(() => {});
      }, 120);
      return () => clearTimeout(t);
    }
  }, [contentCss, isDarkTheme, status]);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let frame;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        try {
          renditionRef.current?.resize();
        } catch {}
      });
    });
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!locationsReady) return;
    const page = pageForCfi(bookRef.current, currentCfiRef.current);
    setLoc((l) => (l ? { ...l, page } : l));
    if (resumedFromRef.current && page && page > 1) {
      setToast(`Welcome back — resumed on page ${page}`);
    }
    resumedFromRef.current = null;
  }, [locationsReady]);

  const chapterTitle = loc ? sectionTitlesRef.current[loc.spineIndex] || "" : "";
  const page = loc?.page || null;

  const pagesLeftInChapter = useMemo(() => {
    if (!page || !loc || !locationsReady) return null;
    const map = spineByLocationRef.current;
    let end = map.length;
    for (let i = page; i < map.length; i++) {
      if (map[i] > loc.spineIndex) {
        end = i;
        break;
      }
    }
    return Math.max(0, end - page);
  }, [page, loc, locationsReady]);

  if (speedRef.current === null && typeof window !== "undefined") speedRef.current = loadSpeed();
  const secondsPerPage = speedRef.current || 75;
  const percent = page && totalPages ? Math.round((page / totalPages) * 100) : null;
  const bookTimeLeft = page && totalPages ? formatDuration((totalPages - page) * secondsPerPage) : null;
  const chapterTimeLeft = pagesLeftInChapter ? formatDuration(pagesLeftInChapter * secondsPerPage) : null;

  const currentBookmarks = useMemo(() => {
    if (!loc) return [];
    return bookmarks.filter(
      (b) => compareCfi(b.cfi, loc.startCfi) >= 0 && compareCfi(b.cfi, loc.endCfi) <= 0
    );
  }, [bookmarks, loc]);
  const isBookmarked = currentBookmarks.length > 0;

  const next = useCallback(() => renditionRef.current?.next(), []);
  const prev = useCallback(() => renditionRef.current?.prev(), []);

  const clearSelection = useCallback(() => {
    try {
      selection?.contents?.window?.getSelection()?.removeAllRanges();
    } catch {}
    setSelection(null);
  }, [selection]);

  const flashSearchHit = (cfi) => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    try {
      rendition.annotations.highlight(cfi, {}, null, "inkshelf-search-hit", {
        fill: "#22c55e",
        "fill-opacity": "0.35",
      });
      setTimeout(() => {
        try {
          rendition.annotations.remove(cfi, "highlight");
          const kept = highlightsRef.current.find((h) => h.cfiRange === cfi);
          if (kept) addMark(rendition, kept);
        } catch {}
      }, 2500);
    } catch {}
  };

  const navigate = ({ cfi, href, flash }) => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    setPanel(null);
    rendition
      .display(cfi || href)
      .then(() => {
        if (flash && cfi) flashSearchHit(cfi);
      })
      .catch(() => {});
  };

  const goToPage = useCallback(
    (n) => {
      const book = bookRef.current;
      if (!book || !locationsReady || !totalPages) return;
      const target = Math.min(Math.max(1, Math.round(n)), totalPages);
      const cfi = book.locations.cfiFromLocation(target - 1);
      if (cfi) renditionRef.current?.display(cfi).catch(() => {});
    },
    [locationsReady, totalPages]
  );

  const excerptAt = (cfi) => {
    const rendition = renditionRef.current;
    for (const contents of rendition?.getContents?.() || []) {
      try {
        const range = contents.range(cfi);
        const text = range?.startContainer?.textContent?.trim();
        if (text) return text.slice(0, 140);
      } catch {}
    }
    return "";
  };

  const toggleBookmark = () => {
    if (!loc) return;
    let next;
    if (isBookmarked) {
      const remove = new Set(currentBookmarks.map((b) => b.cfi));
      next = bookmarks.filter((b) => !remove.has(b.cfi));
      setToast("Bookmark removed");
    } else {
      next = sortByCfi(
        [
          ...bookmarks,
          { cfi: loc.startCfi, page, chapter: chapterTitle, excerpt: excerptAt(loc.startCfi), createdAt: Date.now() },
        ],
        "cfi"
      );
      setToast(page ? `Bookmarked page ${page}` : "Page bookmarked");
    }
    setBookmarks(next);
    saveList(storage.bookmarks, next);
  };

  const removeBookmark = (cfi) => {
    const next = bookmarks.filter((b) => b.cfi !== cfi);
    setBookmarks(next);
    saveList(storage.bookmarks, next);
  };

  const upsertHighlight = (h) => {
    const next = sortByCfi([...highlightsRef.current.filter((x) => x.cfiRange !== h.cfiRange), h], "cfiRange");
    highlightsRef.current = next;
    setHighlights(next);
    saveList(storage.highlights, next);
  };

  const addHighlight = (color) => {
    if (!selection) return null;
    const existing = highlightsRef.current.find((h) => h.cfiRange === selection.cfiRange);
    const h = {
      cfiRange: selection.cfiRange,
      text: selection.text,
      color,
      note: existing?.note || "",
      page: page || pageForCfi(bookRef.current, selection.cfiRange),
      chapter: chapterTitle,
      createdAt: existing?.createdAt || Date.now(),
    };
    upsertHighlight(h);
    const rendition = renditionRef.current;
    if (rendition) {
      removeMark(rendition, h.cfiRange);
      addMark(rendition, h);
    }
    clearSelection();
    return h;
  };

  const removeHighlight = (cfiRange) => {
    const next = highlightsRef.current.filter((h) => h.cfiRange !== cfiRange);
    highlightsRef.current = next;
    setHighlights(next);
    saveList(storage.highlights, next);
    if (renditionRef.current) removeMark(renditionRef.current, cfiRange);
    setEditing(null);
  };

  const saveNote = (cfiRange, note) => {
    const h = highlightsRef.current.find((x) => x.cfiRange === cfiRange);
    if (h) upsertHighlight({ ...h, note });
    setEditing(null);
    setToast(note ? "Note saved" : "Note cleared");
  };

  const runSearch = useCallback(async (query) => {
    const book = bookRef.current;
    if (!book || !query) return;
    const token = ++searchTokenRef.current;
    setSearch({ query, results: [], searching: true, capped: false });
    try {
      await book.ready;
    } catch {
      return;
    }
    const results = [];
    let capped = false;
    for (const item of book.spine.spineItems) {
      if (token !== searchTokenRef.current) return;
      try {
        await item.load(book.load.bind(book));
        const found = typeof item.search === "function" ? item.search(query) : item.find(query);
        for (const r of found) {
          results.push({ cfi: r.cfi, excerpt: (r.excerpt || "").trim(), chapter: sectionTitlesRef.current[item.index] || "" });
        }
      } catch {
      } finally {
        try {
          item.unload();
        } catch {}
      }
      if (results.length >= 300) {
        capped = true;
        break;
      }
      if (token === searchTokenRef.current) {
        setSearch({ query, results: [...results], searching: true, capped: false });
      }
    }
    if (token === searchTokenRef.current) {
      setSearch({ query, results: results.slice(0, 300), searching: false, capped });
    }
  }, []);

  const changeFontSize = (delta) =>
    setSettings((s) => ({ ...s, fontSize: Math.min(200, Math.max(70, s.fontSize + delta)) }));

  const handleKey = (e) => {
    const target = e.target;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) {
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
      case "ArrowRight":
      case "PageDown":
        if (!paginated && e.key === "PageDown") return;
        e.preventDefault();
        next();
        break;
      case "ArrowLeft":
      case "PageUp":
        if (!paginated && e.key === "PageUp") return;
        e.preventDefault();
        prev();
        break;
      case " ":
        if (!paginated) return;
        e.preventDefault();
        if (e.shiftKey) prev();
        else next();
        break;
      case "b":
      case "B":
        toggleBookmark();
        break;
      case "t":
      case "T":
        setPanel((p) => (p === "toc" ? null : "toc"));
        break;
      case "n":
      case "N":
        setPanel((p) => (p === "notes" ? null : "notes"));
        break;
      case "/":
        e.preventDefault();
        setSearchSeed("");
        setPanel("search");
        break;
      case "f":
      case "F":
        setChromeVisible((v) => !v);
        break;
      case "+":
      case "=":
        changeFontSize(10);
        break;
      case "-":
      case "_":
        changeFontSize(-10);
        break;
      case "Escape":
        if (editing) setEditing(null);
        else if (selection) clearSelection();
        else if (showSettings) setShowSettings(false);
        else if (panel) setPanel(null);
        else if (goTo !== null) setGoTo(null);
        else if (!chromeVisible) setChromeVisible(true);
        else return;
        e.stopPropagation();
        break;
      default:
    }
  };

  handlersRef.current = {
    relocated: (location) => {
      const start = location.start;
      currentCfiRef.current = start.cfi;
      savePosition(storage.position, start.cfi);
      setSelection(null);
      const pageNow = locationsReadyRef.current ? pageForCfi(bookRef.current, start.cfi) : null;
      setLoc({
        startCfi: start.cfi,
        endCfi: location.end.cfi,
        href: hrefPath(start.href),
        spineIndex: start.index,
        atStart: location.atStart,
        atEnd: location.atEnd,
        page: pageNow,
      });

      const now = Date.now();
      const last = lastTurnRef.current;
      if (pageNow && last.page && pageNow === last.page + 1) {
        const dt = (now - last.at) / 1000;
        if (dt > 10 && dt < 600) {
          speedRef.current = (speedRef.current || 75) * 0.8 + dt * 0.2;
          saveSpeed(speedRef.current);
        }
      }
      lastTurnRef.current = { page: pageNow, at: now };

      const book = bookRef.current;
      if (bookKey && locationsReadyRef.current) {
        const progress = location.atEnd ? 100 : Math.round(book.locations.percentageFromCfi(start.cfi) * 100);
        if (Number.isFinite(progress) && progress !== lastProgressRef.current) {
          lastProgressRef.current = progress;
          window.dispatchEvent(new CustomEvent("inkshelf:reading-progress", { detail: { bookKey, progress } }));
        }
      }
    },
    selected: (cfiRange, contents) => {
      try {
        const range = contents.range(cfiRange);
        const text = range?.toString().trim();
        if (!text) return;
        const rect = range.getBoundingClientRect();
        const frame = contents.window.frameElement.getBoundingClientRect();
        const host = rootRef.current.getBoundingClientRect();
        const x = frame.left + rect.left + rect.width / 2 - host.left;
        setSelection({
          cfiRange,
          text: text.slice(0, 2000),
          contents,
          x: Math.min(Math.max(x, 170), host.width - 170),
          y: frame.top + rect.top - host.top,
        });
      } catch {}
    },
    click: (e) => {
      const win = e.view;
      if (win?.getSelection?.()?.toString().trim()) return;
      if (e.target?.closest?.("a")) return;
      if (selection) {
        setSelection(null);
        return;
      }
      const frame = win?.frameElement;
      const host = viewerRef.current;
      if (!frame || !host) return;
      const x = frame.getBoundingClientRect().left + e.clientX - host.getBoundingClientRect().left;
      const ratio = x / host.clientWidth;
      if (paginated && ratio < 0.25) prev();
      else if (paginated && ratio > 0.75) next();
      else setChromeVisible((v) => !v);
    },
    key: handleKey,
    touchstart: (e) => {
      const t = e.changedTouches?.[0];
      if (t) touchRef.current = { x: t.screenX, y: t.screenY, at: Date.now() };
    },
    touchend: (e) => {
      const start = touchRef.current;
      const t = e.changedTouches?.[0];
      touchRef.current = null;
      if (!paginated || !start || !t) return;
      const dx = t.screenX - start.x;
      const dy = t.screenY - start.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - start.at < 800) {
        if (dx < 0) next();
        else prev();
      }
    },
    markClicked: (cfiRange) => setEditing(cfiRange),
  };

  useEffect(() => {
    const onKey = (e) => handlersRef.current.key?.(e);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const scrubChapter =
    scrub && spineByLocationRef.current.length
      ? sectionTitlesRef.current[spineByLocationRef.current[scrub - 1]] || ""
      : "";

  const commitScrub = () => {
    if (scrub !== null) goToPage(scrub);
    setScrub(null);
  };

  const editingHighlight = editing ? highlights.find((h) => h.cfiRange === editing) : null;

  const chromeButton =
    "rounded-full p-2 text-[var(--r-muted)] transition-colors hover:bg-black/5 hover:text-[var(--r-text)] dark:hover:bg-white/10";

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 z-10 flex flex-col overflow-hidden bg-[var(--r-bg)] text-[var(--r-text)]"
      style={{
        "--r-bg": colors.bg,
        "--r-surface": colors.surface,
        "--r-border": colors.border,
        "--r-text": colors.text,
        "--r-muted": colors.muted,
        transition: "background-color .3s ease, color .3s ease",
      }}
    >
      <AnimatePresence initial={false}>
        {chromeVisible && (
          <motion.div
            key="top"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="relative z-20 flex h-12 shrink-0 items-center gap-1 border-b border-[var(--r-border)] px-2 sm:px-3"
          >
            <button onClick={() => setPanel("toc")} className={chromeButton} aria-label="Contents" title="Contents (T)">
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                setSearchSeed("");
                setPanel("search");
              }}
              className={chromeButton}
              aria-label="Search in book"
              title="Search (/)"
            >
              <Search className="h-5 w-5" />
            </button>
            <button onClick={() => setPanel("notes")} className={`${chromeButton} relative`} aria-label="Bookmarks and highlights" title="Notes (N)">
              <StickyNote className="h-5 w-5" />
              {bookmarks.length + highlights.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-500 px-1 text-[10px] font-bold text-black">
                  {bookmarks.length + highlights.length}
                </span>
              )}
            </button>

            <p className="mx-2 min-w-0 flex-1 truncate text-center text-sm font-medium text-[var(--r-muted)]" title={chapterTitle || title}>
              {chapterTitle || title}
            </p>

            <button
              onClick={toggleBookmark}
              className={chromeButton}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this page"}
              aria-pressed={isBookmarked}
              title="Bookmark (B)"
            >
              <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-green-500 text-green-500" : ""}`} />
            </button>
            <button
              onClick={() => setShowSettings((v) => !v)}
              className={chromeButton}
              aria-label="Display settings"
              aria-expanded={showSettings}
              title="Text & layout"
            >
              <Type className="h-5 w-5" />
            </button>
            <button onClick={() => setChromeVisible(false)} className={chromeButton} aria-label="Hide controls" title="Focus mode (F)">
              <EyeOff className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative min-h-0 flex-1">
        {paginated && (
          <>
            <button
              onClick={prev}
              aria-label="Previous page"
              disabled={loc?.atStart}
              className="absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-2 text-[var(--r-muted)] transition hover:bg-black/5 hover:text-[var(--r-text)] disabled:opacity-0 dark:hover:bg-white/10 md:block"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
            <button
              onClick={next}
              aria-label="Next page"
              disabled={loc?.atEnd}
              className="absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-2 text-[var(--r-muted)] transition hover:bg-black/5 hover:text-[var(--r-text)] disabled:opacity-0 dark:hover:bg-white/10 md:block"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          </>
        )}

        <div className="mx-auto h-full px-3 py-3 sm:px-10 md:px-14" style={{ maxWidth: maxWidth + 112 }}>
          <div ref={viewerRef} className="h-full w-full" />
        </div>

        {status === "loading" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[var(--r-bg)]">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            <p className="text-sm text-[var(--r-muted)]">Opening book…</p>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[var(--r-bg)] px-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-[var(--r-muted)]">We couldn&apos;t open this book. The file may be unavailable or damaged.</p>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-2 text-sm font-semibold text-black hover:bg-green-400"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          </div>
        )}

        {!chromeVisible && (
          <button
            onClick={() => setChromeVisible(true)}
            className="absolute bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1 text-xs tabular-nums text-[var(--r-muted)] opacity-70 hover:opacity-100"
            aria-label="Show controls"
          >
            {page && totalPages ? `${page} / ${totalPages}` : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {chromeVisible && (
          <motion.div
            key="bottom"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative z-20 shrink-0 border-t border-[var(--r-border)] px-3 pb-2 pt-1.5 sm:px-5"
          >
            <div className="relative">
              <AnimatePresence>
                {scrub !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute bottom-full mb-2 max-w-[80%] -translate-x-1/2 truncate rounded-lg border border-[var(--r-border)] bg-[var(--r-surface)] px-3 py-1.5 text-xs font-semibold shadow-lg"
                    style={{ left: `${totalPages > 1 ? ((scrub - 1) / (totalPages - 1)) * 100 : 0}%` }}
                  >
                    Page {scrub}
                    {scrubChapter ? ` · ${scrubChapter}` : ""}
                  </motion.div>
                )}
              </AnimatePresence>
              <input
                type="range"
                min={1}
                max={Math.max(totalPages, 1)}
                value={scrub ?? page ?? 1}
                disabled={!locationsReady}
                onChange={(e) => setScrub(Number(e.target.value))}
                onPointerUp={commitScrub}
                onKeyUp={commitScrub}
                onBlur={() => scrub !== null && commitScrub()}
                aria-label="Book position"
                aria-valuetext={page && totalPages ? `Page ${page} of ${totalPages}` : "Loading pages"}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--r-border)] accent-green-500 disabled:cursor-wait disabled:opacity-50"
              />
            </div>

            <div className="mt-1.5 flex items-center gap-3 text-xs text-[var(--r-muted)]">
              {goTo !== null ? (
                <form
                  className="flex items-center gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const n = Number(goTo);
                    if (Number.isFinite(n) && n >= 1) goToPage(n);
                    setGoTo(null);
                  }}
                >
                  <span>Page</span>
                  <input
                    autoFocus
                    inputMode="numeric"
                    value={goTo}
                    onChange={(e) => setGoTo(e.target.value.replace(/\D/g, ""))}
                    onBlur={() => setGoTo(null)}
                    className="w-14 rounded-md border border-[var(--r-border)] bg-[var(--r-surface)] px-1.5 py-0.5 text-center text-[var(--r-text)] outline-none focus:border-green-500"
                    aria-label="Go to page"
                  />
                  <span>/ {totalPages}</span>
                  <button type="submit" onMouseDown={(e) => e.preventDefault()} className="rounded-md bg-green-500 px-2 py-0.5 font-semibold text-black">
                    Go
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => locationsReady && setGoTo(String(page || ""))}
                  disabled={!locationsReady}
                  className="rounded-md px-1.5 py-0.5 font-semibold tabular-nums text-[var(--r-text)] hover:bg-black/5 disabled:font-normal disabled:text-[var(--r-muted)] dark:hover:bg-white/10"
                  title="Go to page"
                >
                  {locationsReady && page ? `Page ${page} / ${totalPages}` : "Counting pages…"}
                </button>
              )}

              <span className="hidden min-w-0 flex-1 truncate text-center sm:block">
                {pagesLeftInChapter === 0
                  ? "Last page in chapter"
                  : pagesLeftInChapter
                  ? `${pagesLeftInChapter} page${pagesLeftInChapter === 1 ? "" : "s"} left in chapter${chapterTimeLeft ? ` · ${chapterTimeLeft}` : ""}`
                  : ""}
              </span>

              <span className="ml-auto whitespace-nowrap tabular-nums">
                {percent !== null ? `${percent}%` : ""}
                {bookTimeLeft ? ` · ${bookTimeLeft} left` : ""}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel && (
          <ReaderSidebar
            tab={panel}
            onTab={setPanel}
            onClose={() => setPanel(null)}
            toc={toc}
            currentHref={loc?.href}
            onNavigate={({ cfi, href }) => navigate({ cfi, href, flash: panel === "search" })}
            onSearch={runSearch}
            searchState={search}
            initialQuery={searchSeed}
            bookmarks={bookmarks}
            highlights={highlights}
            onRemoveBookmark={removeBookmark}
            onRemoveHighlight={removeHighlight}
            onEditNote={(cfiRange) => {
              setPanel(null);
              setEditing(cfiRange);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <ReaderSettings settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      {selection && (
        <SelectionMenu
          position={selection}
          onHighlight={(color) => addHighlight(color)}
          onNote={() => {
            const h = addHighlight("yellow");
            if (h) setEditing(h.cfiRange);
          }}
          onCopy={async () => {
            try {
              await navigator.clipboard.writeText(selection.text);
              setToast("Copied to clipboard");
            } catch {
              setToast("Couldn't copy");
            }
            clearSelection();
          }}
          onSearch={() => {
            const q = selection.text.slice(0, 80);
            clearSelection();
            setSearchSeed(q);
            setPanel("search");
          }}
          onClose={clearSelection}
        />
      )}

      {editingHighlight && (
        <NoteEditor
          key={editingHighlight.cfiRange}
          highlight={editingHighlight}
          onSave={(note) => saveNote(editingHighlight.cfiRange, note)}
          onDelete={() => removeHighlight(editingHighlight.cfiRange)}
          onClose={() => setEditing(null)}
        />
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="pointer-events-none absolute bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[var(--r-text)] px-4 py-2 text-sm font-medium text-[var(--r-bg)] shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
