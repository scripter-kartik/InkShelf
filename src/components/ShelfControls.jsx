"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { SHELF_STATUSES } from "@/lib/constants";
import { useToast } from "@/components/ToastProvider";
import StarRating from "@/components/StarRating";
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
    useEffect(() => {
        if (status !== "authenticated")
            return;
        let active = true;
        fetch(`/api/shelf?bookKey=${encodeURIComponent(book.id)}`)
            .then((r) => (r.ok ? r.json() : { items: [] }))
            .then(({ items }) => {
            if (!active)
                return;
            const existing = items?.[0];
            if (existing) {
                setFavorite(!!existing.favorite);
                setShelfStatus(existing.status || "");
                setProgress(existing.progress ?? 0);
                setRating(existing.rating ?? 0);
                setNotes(existing.notes ?? "");
            }
        })
            .catch(() => { });
        return () => {
            active = false;
        };
    }, [status, book.id]);
    const persist = async (patch) => {
        setSaving(true);
        try {
            const res = await fetch("/api/shelf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookKey: book.id,
                    title: book.title,
                    coverId: book.coverId,
                    author: book.author,
                    favorite,
                    status: shelfStatus || "want",
                    progress,
                    rating,
                    notes,
                    ...patch,
                }),
            });
            if (res.status === 401) {
                toast("Please log in to save books.", "error");
                return false;
            }
            if (res.status === 503) {
                toast("Saving needs a database (set MONGODB_URI).", "error");
                return false;
            }
            if (!res.ok)
                throw new Error();
            return true;
        }
        catch {
            toast("Couldn't save. Try again.", "error");
            return false;
        }
        finally {
            setSaving(false);
        }
    };
    const toggleFavorite = async () => {
        const next = !favorite;
        setFavorite(next);
        const ok = await persist({ favorite: next });
        if (ok)
            toast(next ? "Added to favorites" : "Removed from favorites", "success");
        else
            setFavorite(!next);
    };
    const changeStatus = async (value) => {
        const prev = shelfStatus;
        setShelfStatus(value);
        if (!value)
            setProgress(0);
        const ok = await persist({ status: value, progress: value ? progress : 0 });
        if (ok)
            toast("Shelf updated", "success");
        else
            setShelfStatus(prev);
    };
    const changeRating = async (value) => {
        const prev = rating;
        setRating(value);
        const ok = await persist({ rating: value });
        if (ok)
            toast("Rating updated", "success");
        else
            setRating(prev);
    };
    const handleNotesChange = (e) => {
        const value = e.target.value;
        setNotes(value);
        setIsSavingNotes(true);
        clearTimeout(notesTimerRef.current);
        notesTimerRef.current = setTimeout(async () => {
            const ok = await persist({ notes: value });
            if (ok)
                toast("Notes saved", "success");
            setIsSavingNotes(false);
        }, 1000);
    };
    const handleProgressChange = (e) => {
        const value = Number(e.target.value);
        setProgress(value);
        clearTimeout(progressTimerRef.current);
        progressTimerRef.current = setTimeout(async () => {
            const ok = await persist({ progress: value });
            if (ok && value === 100)
                toast("🎉 Finished reading!", "success");
        }, 600);
    };
    if (status === "unauthenticated") {
        return (<p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
        Log in to add this book to your favorites or reading shelf.
      </p>);
    }
    return (<div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={toggleFavorite} disabled={saving} className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 font-semibold transition disabled:opacity-60 ${favorite
            ? "border-red-500 bg-red-500 text-white"
            : "border-gray-400 text-gray-700 hover:border-red-400 dark:text-gray-200"}`}>
          <Heart className="h-5 w-5" fill={favorite ? "currentColor" : "none"}/>
          {favorite ? "Favorited" : "Favorite"}
        </button>

        <select value={shelfStatus} onChange={(e) => changeStatus(e.target.value)} disabled={saving} className="rounded-full border-2 border-gray-400 bg-white px-4 py-2 font-semibold text-gray-700 outline-none disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
          <option value="">Add to shelf…</option>
          {SHELF_STATUSES.map((s) => (<option key={s.value} value={s.value}>
              {s.label}
            </option>))}
        </select>
      </div>

      
      {shelfStatus === "reading" && (<div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="reading-progress" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Reading progress
            </label>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              {progress}%
            </span>
          </div>
          <input id="reading-progress" type="range" min="0" max="100" step="1" value={progress} onChange={handleProgressChange} disabled={saving} className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-green-500 disabled:opacity-60 dark:bg-gray-700"/>
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>)}

      
      {shelfStatus && (<div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
          <StarRating rating={rating} onChange={changeRating} disabled={saving}/>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="personal-notes" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Personal Notes
              </label>
              {isSavingNotes ? (<span className="text-xs text-amber-500 animate-pulse">Saving...</span>) : (notes && <span className="text-xs text-green-500">Saved</span>)}
            </div>
            <textarea id="personal-notes" value={notes} onChange={handleNotesChange} placeholder="Write your review, favorite quotes, or thoughts on this book..." disabled={saving} rows={4} className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"/>
          </div>
        </div>)}
    </div>);
}
