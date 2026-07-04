"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { SHELF_STATUSES } from "@/lib/constants";
import { useToast } from "@/components/ToastProvider";
import StarRating from "@/components/StarRating";
import gsap from "gsap";

export default function ShelfControls({ book }) {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [favorite, setFavorite] = useState(false);
  const [shelfStatus, setShelfStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const progressTimerRef = useRef(null);
  const notesTimerRef = useRef(null);
  const heartRef = useRef(null);
  const progressFillRef = useRef(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    fetch(`/api/shelf?bookKey=${encodeURIComponent(book.id)}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then(({ items }) => {
        if (!active) return;
        const existing = items?.[0];
        if (existing) {
          setFavorite(!!existing.favorite);
          setShelfStatus(existing.status || "");
          setProgress(existing.progress ?? 0);
          setRating(existing.rating ?? 0);
          setNotes(existing.notes ?? "");
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [status, book.id]);

  /* GSAP progress bar animation */
  useEffect(() => {
    const el = progressFillRef.current;
    if (!el) return;
    gsap.to(el, {
      width: `${progress}%`,
      duration: 0.8,
      ease: "power3.out",
    });
  }, [progress]);

  const persist = async (patch) => {
    setSaving(true);
    try {
      const mergedStatus = patch.status !== undefined ? patch.status : shelfStatus;
      
      // If we are clearing both favorite and status, just delete it.
      const isFav = patch.favorite !== undefined ? patch.favorite : favorite;
      if (!isFav && !mergedStatus) {
        const res = await fetch(`/api/shelf?bookKey=${encodeURIComponent(book.id)}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        return true;
      }

      const bodyData = {
        bookKey: book.id,
        title: book.title,
        coverId: book.coverId,
        author: book.author,
        favorite: isFav,
        progress: patch.progress !== undefined ? patch.progress : progress,
        rating: patch.rating !== undefined ? patch.rating : rating,
        notes: patch.notes !== undefined ? patch.notes : notes,
      };
      
      // Only include status if it's truthy to avoid Mongoose enum validation errors on ""
      if (mergedStatus) {
        bodyData.status = mergedStatus;
      }

      const res = await fetch("/api/shelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      if (res.status === 401) { toast("Please log in to save books.", "error"); return false; }
      if (res.status === 503) { toast("Saving needs a database (set MONGODB_URI).", "error"); return false; }
      if (!res.ok) throw new Error();
      return true;
    } catch {
      toast("Couldn't save. Try again.", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleFavorite = async () => {
    const next = !favorite;
    setFavorite(next);

    /* GSAP heart burst */
    const el = heartRef.current;
    if (el && next) {
      gsap.fromTo(
        el,
        { scale: 0.5, rotate: -20 },
        { scale: 1.3, rotate: 0, duration: 0.3, ease: "back.out(3)", yoyo: true, repeat: 1 }
      );
    }

    const ok = await persist({ favorite: next });
    if (ok) toast(next ? "❤️ Added to favorites" : "Removed from favorites", "success");
    else setFavorite(!next);
  };

  const changeStatus = async (value) => {
    const prev = shelfStatus;
    setShelfStatus(value);
    if (!value) setProgress(0);
    const ok = await persist({ status: value, progress: value ? progress : 0 });
    if (ok) toast(value ? "Shelf updated ✓" : "Removed from shelf", "success");
    else setShelfStatus(prev);
  };

  const changeRating = async (value) => {
    const prev = rating;
    setRating(value);
    const ok = await persist({ rating: value });
    if (ok) toast("Rating updated ✓", "success");
    else setRating(prev);
  };

  const handleNotesChange = (e) => {
    const value = e.target.value;
    setNotes(value);
    setIsSavingNotes(true);
    clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(async () => {
      const ok = await persist({ notes: value });
      if (ok) toast("Notes saved ✓", "success");
      setIsSavingNotes(false);
    }, 1000);
  };

  const handleProgressChange = (e) => {
    const value = Number(e.target.value);
    setProgress(value);
    clearTimeout(progressTimerRef.current);
    progressTimerRef.current = setTimeout(async () => {
      const ok = await persist({ progress: value });
      if (ok && value === 100) toast("🎉 Finished reading!", "success");
    }, 600);
  };

  if (status === "unauthenticated") {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border-2 border-dashed border-gray-300 p-5 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400"
      >
        Log in to add this book to your favorites or reading shelf.
      </motion.p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Favorite button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={toggleFavorite}
          disabled={saving}
          className={`flex items-center gap-2 rounded-full border-2 px-5 py-2.5 font-semibold transition-colors disabled:opacity-60 ${
            favorite
              ? "border-red-500 bg-red-500 text-white shadow-red-200 dark:shadow-red-900 shadow-lg"
              : "border-gray-400 text-gray-700 hover:border-red-400 dark:text-gray-200"
          }`}
        >
          <span ref={heartRef} className="inline-flex">
            <Heart
              className="h-5 w-5 transition-all duration-200"
              fill={favorite ? "currentColor" : "none"}
            />
          </span>
          {favorite ? "Favorited" : "Favorite"}
        </motion.button>

        {/* Status select */}
        <motion.select
          whileFocus={{ scale: 1.02 }}
          value={shelfStatus}
          onChange={(e) => changeStatus(e.target.value)}
          disabled={saving}
          className="rounded-full border-2 border-gray-400 bg-white px-4 py-2.5 font-semibold text-gray-700 outline-none disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 cursor-pointer hover:border-green-500 transition-colors"
        >
          <option value="">Add to shelf…</option>
          {SHELF_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </motion.select>
      </div>

      {/* Progress section */}
      <AnimatePresence>
        {shelfStatus === "reading" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="reading-progress" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reading progress
                </label>
                <motion.span
                  key={progress}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="text-sm font-bold text-green-600 dark:text-green-400"
                >
                  {progress}%
                </motion.span>
              </div>
              <input
                id="reading-progress"
                type="range"
                min="0"
                max="100"
                step="1"
                value={progress}
                onChange={handleProgressChange}
                disabled={saving}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-green-500 disabled:opacity-60 dark:bg-gray-700"
              />
              {/* Custom GSAP-animated bar */}
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  ref={progressFillRef}
                  className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating + Notes */}
      <AnimatePresence>
        {shelfStatus && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
              <StarRating rating={rating} onChange={changeRating} disabled={saving} />
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="personal-notes" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Personal Notes
                  </label>
                  <AnimatePresence mode="wait">
                    {isSavingNotes ? (
                      <motion.span
                        key="saving"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-amber-500"
                      >
                        Saving…
                      </motion.span>
                    ) : notes ? (
                      <motion.span
                        key="saved"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-green-500"
                      >
                        Saved ✓
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
                <textarea
                  id="personal-notes"
                  value={notes}
                  onChange={handleNotesChange}
                  placeholder="Write your review, favorite quotes, or thoughts on this book..."
                  disabled={saving}
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 transition-all"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
