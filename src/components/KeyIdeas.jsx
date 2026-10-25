"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Lightbulb, RefreshCw, AlertCircle, List, Layers, Target } from "lucide-react";

export default function KeyIdeas({ book }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [view, setView] = useState("cards");

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "ideas",
          title: book.title,
          author: book.author,
          description: book.description || "",
          subjects: book.subjects || [],
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Couldn't build key ideas. Please try again.");
      setData(json.ideas);
      setIndex(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center dark:border-ink-800 dark:bg-ink-900/50">
        <RefreshCw className="mb-4 h-8 w-8 animate-spin text-amber-500" />
        <p className="animate-pulse font-medium text-gray-600 dark:text-ink-400">
          Distilling the key ideas of {book.title}…
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center dark:border-amber-900/30 dark:from-amber-950/20 dark:to-ink-900">
        <Lightbulb className="mb-3 h-8 w-8 text-amber-500" />
        <p className="mb-1 max-w-md font-semibold text-gray-800 dark:text-ink-100">The book&apos;s key ideas in about 15 minutes</p>
        <p className="mb-4 max-w-md text-sm text-gray-600 dark:text-ink-300">
          Get the core lessons of this book as bite-sized cards with practical takeaways — free.
        </p>
        <button
          onClick={generate}
          className="flex items-center gap-2 rounded-full bg-amber-500 px-6 py-2.5 font-semibold text-black shadow-lg shadow-amber-500/25 transition-colors hover:bg-amber-400"
        >
          <Lightbulb className="h-4 w-4" /> Show key ideas
        </button>
        {error && (
          <p className="mt-3 flex items-center gap-1 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" /> {error}
          </p>
        )}
      </div>
    );
  }

  if (data.basedOn === "insufficient" || data.ideas.length === 0) {
    return (
      <p className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center text-sm text-gray-500 dark:border-ink-800 dark:bg-ink-900/50 dark:text-ink-400">
        There isn&apos;t enough information about this book to build reliable key ideas.
      </p>
    );
  }

  const total = data.ideas.length;
  const idea = data.ideas[index];

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-xl shadow-amber-900/5 dark:border-amber-900/40 dark:bg-ink-900">
      <div className="border-b border-amber-100 bg-amber-50/70 px-5 py-4 dark:border-amber-900/30 dark:bg-amber-950/20">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          {total} key ideas{data.readingMinutes ? ` · ${data.readingMinutes}-min read` : ""}
          {data.basedOn === "description" ? " · based on the publisher's description" : ""}
        </p>
        {data.oneLiner && <p className="mt-1 font-lato text-base font-semibold text-gray-900 dark:text-white">{data.oneLiner}</p>}
        <div className="mt-3 flex gap-1.5">
          <ViewButton active={view === "cards"} onClick={() => setView("cards")} icon={Layers} label="Cards" />
          <ViewButton active={view === "list"} onClick={() => setView("list")} icon={List} label="All ideas" />
        </div>
      </div>

      {view === "cards" ? (
        <div className="p-5">
          <div className="mb-4 flex gap-1" aria-hidden="true">
            {data.ideas.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                tabIndex={-1}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i <= index ? "bg-amber-500" : "bg-gray-200 dark:bg-ink-700"}`}
              />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
              className="min-h-[200px]"
              aria-live="polite"
            >
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Idea {index + 1} of {total}
              </p>
              <h3 className="mt-1 font-winky text-xl font-bold text-gray-900 dark:text-white">{idea.title}</h3>
              <p className="mt-3 font-lato leading-relaxed text-gray-700 dark:text-ink-300">{idea.explanation}</p>
              {idea.takeaway && (
                <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <Target className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {idea.takeaway}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-30 dark:text-ink-300 dark:hover:bg-ink-800"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            {index < total - 1 ? (
              <button
                onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-black hover:bg-amber-400"
              >
                Next idea <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setView("list")}
                className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-black hover:bg-amber-400"
              >
                Review all ideas
              </button>
            )}
          </div>
        </div>
      ) : (
        <ol className="divide-y divide-gray-100 dark:divide-ink-800">
          {data.ideas.map((it, i) => (
            <li key={i} className="px-5 py-4">
              <p className="font-winky font-bold text-gray-900 dark:text-white">
                <span className="mr-2 text-amber-500">{i + 1}.</span>
                {it.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-ink-300">{it.explanation}</p>
              {it.takeaway && <p className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-300">→ {it.takeaway}</p>}
            </li>
          ))}
        </ol>
      )}

      <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500 dark:border-ink-800 dark:text-ink-400">
        {data.whoShouldRead && <p className="mb-1"><span className="font-semibold">Who it&apos;s for:</span> {data.whoShouldRead}</p>}
        <p>Written by AI in its own words — not text from the book. Read the full book for the complete experience.</p>
      </div>
    </div>
  );
}

function ViewButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        active ? "bg-amber-500 text-black" : "bg-white text-gray-600 hover:bg-amber-100 dark:bg-ink-800 dark:text-ink-300"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
