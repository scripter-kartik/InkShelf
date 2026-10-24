"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Bookmark, Copy, Trash2, Minus, Plus, StickyNote, Loader2 } from "lucide-react";
import {
  THEME_OPTIONS,
  READER_THEMES,
  FONT_OPTIONS,
  WIDTH_OPTIONS,
  LINE_HEIGHTS,
  HIGHLIGHT_COLORS,
} from "./readerConfig";

const TABS = [
  { value: "toc", label: "Contents" },
  { value: "search", label: "Search" },
  { value: "notes", label: "Notes" },
];

export function ReaderSidebar({
  tab,
  onTab,
  onClose,
  toc,
  currentHref,
  onNavigate,
  onSearch,
  searchState,
  initialQuery,
  bookmarks,
  highlights,
  onRemoveBookmark,
  onRemoveHighlight,
  onEditNote,
}) {
  return (
    <>
      <motion.div
        className="absolute inset-0 z-30 bg-black/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.aside
        role="dialog"
        aria-label="Reader navigation"
        className="absolute inset-y-0 left-0 z-40 flex w-[min(22rem,90%)] flex-col border-r border-[var(--r-border)] bg-[var(--r-surface)] text-[var(--r-text)] shadow-2xl"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
      >
        <div className="flex items-center gap-1 border-b border-[var(--r-border)] px-3 py-2">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => onTab(t.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                tab === t.value ? "bg-green-500 text-black" : "text-[var(--r-muted)] hover:text-[var(--r-text)]"
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="ml-auto rounded-full p-1.5 text-[var(--r-muted)] hover:text-[var(--r-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === "toc" && <TocList toc={toc} currentHref={currentHref} onNavigate={onNavigate} />}
          {tab === "search" && (
            <SearchPanel onSearch={onSearch} state={searchState} initialQuery={initialQuery} onNavigate={onNavigate} />
          )}
          {tab === "notes" && (
            <NotesPanel
              bookmarks={bookmarks}
              highlights={highlights}
              onNavigate={onNavigate}
              onRemoveBookmark={onRemoveBookmark}
              onRemoveHighlight={onRemoveHighlight}
              onEditNote={onEditNote}
            />
          )}
        </div>
      </motion.aside>
    </>
  );
}

function TocList({ toc, currentHref, onNavigate }) {
  const activeRef = useRef(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center" });
  }, []);

  if (!toc.length) {
    return <p className="p-5 text-sm text-[var(--r-muted)]">This book has no table of contents.</p>;
  }
  return (
    <ul className="py-2">
      {toc.map((item) => {
        const active = currentHref && item.href && currentHref === item.href.split("#")[0].replace(/^\.?\//, "");
        return (
          <li key={`${item.id}-${item.href}`}>
            <button
              ref={active ? activeRef : undefined}
              onClick={() => onNavigate({ href: item.href })}
              style={{ paddingLeft: `${1.25 + item.depth * 1}rem` }}
              className={`w-full py-2.5 pr-4 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                active ? "font-semibold text-green-600 dark:text-green-400" : ""
              }`}
              aria-current={active ? "location" : undefined}
            >
              {item.label || "Untitled section"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SearchPanel({ onSearch, state, initialQuery, onNavigate }) {
  const [query, setQuery] = useState(initialQuery || state.query || "");
  const inputRef = useRef(null);
  const lastQueryRef = useRef(state.query);

  useEffect(() => {
    inputRef.current?.focus();
    if (initialQuery && initialQuery !== lastQueryRef.current) {
      lastQueryRef.current = initialQuery;
      onSearch(initialQuery);
    }
  }, [initialQuery, onSearch]);

  return (
    <div className="flex h-full flex-col">
      <form
        className="border-b border-[var(--r-border)] p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim().length >= 2) onSearch(query.trim());
        }}
      >
        <div className="flex items-center gap-2 rounded-xl border border-[var(--r-border)] bg-[var(--r-bg)] px-3">
          <Search className="h-4 w-4 text-[var(--r-muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in this book…"
            className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--r-muted)]"
          />
        </div>
      </form>
      <div className="flex-1 overflow-y-auto">
        {state.searching && (
          <p className="flex items-center gap-2 px-4 py-3 text-xs text-[var(--r-muted)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching… {state.results.length} found so far
          </p>
        )}
        {!state.searching && state.query && (
          <p className="px-4 py-3 text-xs text-[var(--r-muted)]">
            {state.results.length === 0
              ? `No matches for “${state.query}”.`
              : `${state.results.length}${state.capped ? "+" : ""} matches for “${state.query}”`}
          </p>
        )}
        <ul>
          {state.results.map((r, i) => (
            <li key={`${r.cfi}-${i}`}>
              <button
                onClick={() => onNavigate({ cfi: r.cfi })}
                className="w-full border-b border-[var(--r-border)] px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/5"
              >
                {r.chapter && <span className="mb-1 block text-xs font-semibold text-green-600 dark:text-green-400">{r.chapter}</span>}
                <span className="line-clamp-3 text-sm">
                  <Excerpt text={r.excerpt} query={state.query} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Excerpt({ text, query }) {
  if (!query) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-green-400/40 px-0.5 text-inherit">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

function NotesPanel({ bookmarks, highlights, onNavigate, onRemoveBookmark, onRemoveHighlight, onEditNote }) {
  if (!bookmarks.length && !highlights.length) {
    return (
      <div className="p-6 text-center text-sm text-[var(--r-muted)]">
        <StickyNote className="mx-auto mb-3 h-8 w-8 opacity-60" />
        <p>No bookmarks or highlights yet.</p>
        <p className="mt-2 text-xs">Tap the bookmark icon to save a page, or select text to highlight it and add a note.</p>
      </div>
    );
  }
  return (
    <div className="py-2">
      {bookmarks.length > 0 && (
        <section>
          <h3 className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-[var(--r-muted)]">
            Bookmarks · {bookmarks.length}
          </h3>
          <ul>
            {bookmarks.map((b) => (
              <li key={b.cfi} className="group flex items-start gap-2 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5">
                <Bookmark className="mt-0.5 h-4 w-4 flex-shrink-0 fill-green-500 text-green-500" />
                <button onClick={() => onNavigate({ cfi: b.cfi })} className="min-w-0 flex-1 text-left">
                  <span className="block text-sm font-medium">
                    {b.page ? `Page ${b.page}` : "Bookmark"}
                    {b.chapter ? ` · ${b.chapter}` : ""}
                  </span>
                  {b.excerpt && <span className="line-clamp-2 text-xs text-[var(--r-muted)]">{b.excerpt}</span>}
                </button>
                <button
                  onClick={() => onRemoveBookmark(b.cfi)}
                  aria-label="Remove bookmark"
                  className="rounded p-1 text-[var(--r-muted)] opacity-0 hover:text-red-500 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {highlights.length > 0 && (
        <section className="mt-2">
          <h3 className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-[var(--r-muted)]">
            Highlights · {highlights.length}
          </h3>
          <ul>
            {highlights.map((h) => {
              const color = HIGHLIGHT_COLORS.find((c) => c.value === h.color)?.fill || HIGHLIGHT_COLORS[0].fill;
              return (
                <li key={h.cfiRange} className="group px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5">
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-3 w-3 flex-shrink-0 rounded-full" style={{ background: color }} />
                    <button onClick={() => onNavigate({ cfi: h.cfiRange })} className="min-w-0 flex-1 text-left">
                      <span className="line-clamp-3 text-sm">“{h.text}”</span>
                      <span className="mt-0.5 block text-xs text-[var(--r-muted)]">
                        {h.page ? `Page ${h.page}` : ""}
                        {h.chapter ? `${h.page ? " · " : ""}${h.chapter}` : ""}
                      </span>
                    </button>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                      <button onClick={() => onEditNote(h.cfiRange)} aria-label="Edit note" className="rounded p-1 text-[var(--r-muted)] hover:text-green-500">
                        <StickyNote className="h-4 w-4" />
                      </button>
                      <button onClick={() => onRemoveHighlight(h.cfiRange)} aria-label="Remove highlight" className="rounded p-1 text-[var(--r-muted)] hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {h.note && (
                    <p className="ml-5 mt-1.5 whitespace-pre-line rounded-lg bg-[var(--r-bg)] px-3 py-2 text-xs">{h.note}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

export function ReaderSettings({ settings, onChange, onClose }) {
  const set = (patch) => onChange({ ...settings, ...patch });
  const option = (active) =>
    `flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
      active ? "bg-green-500 text-black" : "bg-[var(--r-bg)] text-[var(--r-text)] hover:bg-black/5 dark:hover:bg-white/5"
    }`;

  return (
    <>
      <div className="absolute inset-0 z-30" onClick={onClose} />
      <motion.div
        role="dialog"
        aria-label="Display settings"
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.16 }}
        className="absolute right-3 top-14 z-40 w-[min(20rem,calc(100%-1.5rem))] space-y-4 rounded-2xl border border-[var(--r-border)] bg-[var(--r-surface)] p-4 text-[var(--r-text)] shadow-2xl"
      >
        <Row label="Text size">
          <div className="flex items-center gap-2">
            <button
              onClick={() => set({ fontSize: Math.max(70, settings.fontSize - 10) })}
              aria-label="Smaller text"
              className="rounded-lg bg-[var(--r-bg)] p-2 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-14 text-center text-sm font-semibold tabular-nums">{settings.fontSize}%</span>
            <button
              onClick={() => set({ fontSize: Math.min(200, settings.fontSize + 10) })}
              aria-label="Larger text"
              className="rounded-lg bg-[var(--r-bg)] p-2 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </Row>

        <Row label="Theme">
          <div className="flex gap-1.5">
            {THEME_OPTIONS.map((t) => {
              const swatch = READER_THEMES[t.value];
              return (
                <button key={t.value} onClick={() => set({ theme: t.value })} className={option(settings.theme === t.value)}>
                  <span
                    className="mx-auto mb-1 block h-4 w-4 rounded-full border border-black/10"
                    style={{
                      background: swatch ? swatch.bg : "linear-gradient(135deg, #ffffff 50%, #080c0a 50%)",
                    }}
                  />
                  {t.label}
                </button>
              );
            })}
          </div>
        </Row>

        <Row label="Font">
          <div className="grid grid-cols-2 gap-1.5">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.value}
                onClick={() => set({ font: f.value })}
                className={option(settings.font === f.value)}
                style={f.family ? { fontFamily: f.family } : undefined}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Row>

        <Row label="Line spacing">
          <div className="flex gap-1.5">
            {LINE_HEIGHTS.map((lh) => (
              <button key={lh} onClick={() => set({ lineHeight: lh })} className={option(settings.lineHeight === lh)}>
                {lh}
              </button>
            ))}
          </div>
        </Row>

        <Row label="Page width">
          <div className="flex gap-1.5">
            {WIDTH_OPTIONS.map((w) => (
              <button key={w.value} onClick={() => set({ width: w.value })} className={option(settings.width === w.value)}>
                {w.label}
              </button>
            ))}
          </div>
        </Row>

        <Row label="Layout">
          <div className="flex gap-1.5">
            <button onClick={() => set({ flow: "paginated" })} className={option(settings.flow === "paginated")}>
              Pages
            </button>
            <button onClick={() => set({ flow: "scrolled-doc" })} className={option(settings.flow === "scrolled-doc")}>
              Scroll
            </button>
          </div>
          {settings.flow === "paginated" && (
            <div className="mt-1.5 flex gap-1.5">
              <button onClick={() => set({ spread: "none" })} className={option(settings.spread === "none")}>
                One page
              </button>
              <button onClick={() => set({ spread: "auto" })} className={option(settings.spread === "auto")}>
                Two on wide screens
              </button>
            </div>
          )}
        </Row>
      </motion.div>
    </>
  );
}

function Row({ label, children }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--r-muted)]">{label}</p>
      {children}
    </div>
  );
}

export function SelectionMenu({ position, onHighlight, onNote, onCopy, onSearch, onClose }) {
  return (
    <motion.div
      role="toolbar"
      aria-label="Selection actions"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute z-40 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-full border border-[var(--r-border)] bg-[var(--r-surface)] px-2 py-1.5 text-[var(--r-text)] shadow-2xl"
      style={{ left: position.x, top: Math.max(position.y - 10, 56) }}
    >
      {HIGHLIGHT_COLORS.map((c) => (
        <button
          key={c.value}
          onClick={() => onHighlight(c.value)}
          aria-label={`Highlight ${c.label}`}
          className="h-6 w-6 rounded-full border-2 border-white/60 transition-transform hover:scale-110"
          style={{ background: c.fill }}
        />
      ))}
      <span className="mx-1 h-5 w-px bg-[var(--r-border)]" />
      <MenuButton onClick={onNote} label="Note" icon={StickyNote} />
      <MenuButton onClick={onSearch} label="Search" icon={Search} />
      <MenuButton onClick={onCopy} label="Copy" icon={Copy} />
      <button onClick={onClose} aria-label="Dismiss" className="rounded-full p-1 text-[var(--r-muted)] hover:text-[var(--r-text)]">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

function MenuButton({ onClick, label, icon: Icon }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export function NoteEditor({ highlight, onSave, onDelete, onClose }) {
  const [text, setText] = useState(highlight.note || "");
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Edit note"
        className="w-full max-w-md rounded-2xl border border-[var(--r-border)] bg-[var(--r-surface)] p-5 text-[var(--r-text)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-3 line-clamp-3 border-l-4 border-green-500 pl-3 text-sm italic text-[var(--r-muted)]">“{highlight.text}”</p>
        <textarea
          autoFocus
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a note…"
          className="w-full rounded-xl border border-[var(--r-border)] bg-[var(--r-bg)] p-3 text-sm outline-none focus:border-green-500"
        />
        <div className="mt-3 flex items-center gap-2">
          <button onClick={onDelete} className="mr-auto text-sm font-semibold text-red-500 hover:underline">
            Remove highlight
          </button>
          <button onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--r-muted)] hover:text-[var(--r-text)]">
            Cancel
          </button>
          <button
            onClick={() => onSave(text.trim())}
            className="rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-black hover:bg-green-400"
          >
            Save note
          </button>
        </div>
      </div>
    </div>
  );
}

export { AnimatePresence };
