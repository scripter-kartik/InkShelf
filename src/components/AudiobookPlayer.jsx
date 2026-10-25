"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, Play, Pause, SkipBack, SkipForward, RotateCcw, RotateCw, ChevronDown, ExternalLink } from "lucide-react";

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

function formatLength(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
}

function loadState(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function saveState(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export default function AudiobookPlayer({ title, author, bookKey }) {
  const [book, setBook] = useState(null);
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [resumeAt, setResumeAt] = useState(null);
  const audioRef = useRef(null);
  const pendingSeekRef = useRef(null);
  const storageKey = `inkshelf:audio:${bookKey}`;

  useEffect(() => {
    if (!title) return;
    let active = true;
    fetch(`/api/audiobook?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author || "")}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active || !d.audiobook) return;
        setBook(d.audiobook);
        const saved = loadState(storageKey);
        if (saved && saved.section < d.audiobook.sections.length) {
          setSection(saved.section);
          setSpeed(saved.speed || 1);
          if (saved.time > 5 || saved.section > 0) setResumeAt(saved);
          pendingSeekRef.current = saved.time || 0;
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [title, author, storageKey]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed, section]);

  useEffect(() => {
    if (!book) return;
    const t = setInterval(() => {
      const el = audioRef.current;
      if (el && !el.paused) saveState(storageKey, { section, time: el.currentTime, speed });
    }, 5000);
    return () => clearInterval(t);
  }, [book, section, speed, storageKey]);

  const playSection = useCallback((index, startAt = 0) => {
    pendingSeekRef.current = startAt;
    setSection(index);
    setResumeAt(null);
    requestAnimationFrame(() => {
      const el = audioRef.current;
      if (!el) return;
      el.load();
      el.play().catch(() => {});
    });
  }, []);

  if (!book) return null;

  const current = book.sections[section];
  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };
  const skip = (delta) => {
    const el = audioRef.current;
    if (el) el.currentTime = Math.max(0, Math.min((el.duration || 0) - 1, el.currentTime + delta));
  };

  const iconButton =
    "rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30 dark:text-ink-300 dark:hover:bg-ink-800";

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-violet-200 bg-white dark:border-violet-900/40 dark:bg-ink-900">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 bg-violet-50 px-5 py-4 text-left dark:bg-violet-950/20"
        aria-expanded={open}
      >
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-violet-500 text-white">
          <Headphones className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-winky text-lg font-bold text-gray-900 dark:text-white">Listen free — full audiobook</span>
          <span className="block text-xs text-gray-600 dark:text-ink-300">
            {formatLength(book.totalSeconds)} · {book.sections.length} chapters · read by LibriVox volunteers
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-5">
              {resumeAt && (
                <button
                  onClick={() => playSection(resumeAt.section, resumeAt.time)}
                  className="mb-4 w-full rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-600"
                >
                  Resume “{book.sections[resumeAt.section]?.title}” at {formatTime(resumeAt.time)}
                </button>
              )}

              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Chapter {section + 1} of {book.sections.length}
              </p>
              <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">{current.title}</p>
              {current.reader && <p className="text-xs text-gray-500 dark:text-ink-400">Read by {current.reader}</p>}

              <audio
                ref={audioRef}
                src={current.url}
                preload="none"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => {
                  setDuration(e.currentTarget.duration);
                  e.currentTarget.playbackRate = speed;
                  if (pendingSeekRef.current) {
                    e.currentTarget.currentTime = pendingSeekRef.current;
                    pendingSeekRef.current = null;
                  }
                }}
                onEnded={() => {
                  if (section < book.sections.length - 1) playSection(section + 1);
                  else saveState(storageKey, { section: 0, time: 0, speed });
                }}
                className="hidden"
              />

              <input
                type="range"
                min={0}
                max={duration || current.seconds || 1}
                step={1}
                value={Math.min(time, duration || current.seconds || 1)}
                onChange={(e) => {
                  if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
                }}
                aria-label="Playback position"
                className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-violet-500 dark:bg-ink-700"
              />
              <div className="mt-1 flex justify-between text-xs tabular-nums text-gray-500 dark:text-ink-400">
                <span>{formatTime(time)}</span>
                <span>{formatTime(duration || current.seconds)}</span>
              </div>

              <div className="mt-3 flex items-center justify-center gap-1 sm:gap-2">
                <button onClick={() => playSection(section - 1)} disabled={section === 0} className={iconButton} aria-label="Previous chapter">
                  <SkipBack className="h-5 w-5" />
                </button>
                <button onClick={() => skip(-15)} className={iconButton} aria-label="Back 15 seconds">
                  <RotateCcw className="h-5 w-5" />
                </button>
                <button
                  onClick={toggle}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg shadow-violet-500/30 hover:bg-violet-600"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
                </button>
                <button onClick={() => skip(30)} className={iconButton} aria-label="Forward 30 seconds">
                  <RotateCw className="h-5 w-5" />
                </button>
                <button
                  onClick={() => playSection(section + 1)}
                  disabled={section >= book.sections.length - 1}
                  className={iconButton}
                  aria-label="Next chapter"
                >
                  <SkipForward className="h-5 w-5" />
                </button>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  aria-label="Playback speed"
                  className="ml-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
                >
                  {SPEEDS.map((s) => (
                    <option key={s} value={s}>
                      {s}×
                    </option>
                  ))}
                </select>
              </div>

              <ol className="mt-5 max-h-64 overflow-y-auto rounded-xl border border-gray-100 dark:border-ink-800">
                {book.sections.map((s, i) => (
                  <li key={s.url}>
                    <button
                      onClick={() => playSection(i)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-violet-50 dark:hover:bg-violet-950/20 ${
                        i === section ? "bg-violet-50 font-semibold text-violet-700 dark:bg-violet-950/30 dark:text-violet-300" : "text-gray-700 dark:text-ink-300"
                      }`}
                      aria-current={i === section ? "true" : undefined}
                    >
                      <span className="w-6 text-xs tabular-nums text-gray-400">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate">{s.title}</span>
                      <span className="text-xs tabular-nums text-gray-400">{formatTime(s.seconds)}</span>
                    </button>
                  </li>
                ))}
              </ol>

              {book.librivoxUrl && (
                <a
                  href={book.librivoxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-gray-500 hover:underline dark:text-ink-400"
                >
                  Public-domain recording from LibriVox <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
