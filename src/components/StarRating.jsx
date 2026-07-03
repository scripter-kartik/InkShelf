"use client";
import { useState } from "react";
import { Star } from "lucide-react";
export default function StarRating({ rating, onChange, disabled }) {
    const [hoverRating, setHoverRating] = useState(0);
    const getLabel = (val) => {
        switch (val) {
            case 1:
                return "Hated it";
            case 2:
                return "Disliked it";
            case 3:
                return "It was OK";
            case 4:
                return "Liked it";
            case 5:
                return "Loved it!";
            default:
                return "Click to rate";
        }
    };
    const activeRating = hoverRating || rating;
    return (<div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Your Rating
      </span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= activeRating;
            return (<button key={star} type="button" disabled={disabled} onClick={() => onChange(star)} onMouseEnter={() => setHoverRating(star)} className="group relative focus:outline-none transition-transform duration-150 active:scale-90 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed" aria-label={`Rate ${star} out of 5 stars`}>
                <Star className={`h-7 w-7 transition-colors duration-200 ${isFilled
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]"
                    : "text-gray-300 dark:text-gray-600 group-hover:text-amber-300"}`}/>
              </button>);
        })}
        </div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 min-w-[80px]">
          {getLabel(activeRating)}
        </span>
      </div>
    </div>);
}
