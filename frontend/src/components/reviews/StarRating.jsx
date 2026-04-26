import React, { useState } from "react";
import { Star } from "lucide-react";
import "./Review.css";

function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = 22,
  className = "",
  label = "Course rating",
}) {
  const [hoverValue, setHoverValue] = useState(0);
  const activeValue = hoverValue || Number(value) || 0;

  return (
    <div className={`review-stars ${className}`} role={readOnly ? "img" : "radiogroup"} aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = activeValue >= star;
        const content = (
          <Star
            size={size}
            strokeWidth={1.8}
            className={isActive ? "review-star-icon active" : "review-star-icon"}
            fill={isActive ? "currentColor" : "none"}
          />
        );

        if (readOnly) {
          return (
            <span key={star} className="review-star-static" aria-hidden="true">
              {content}
            </span>
          );
        }

        return (
          <button
            key={star}
            type="button"
            className="review-star-button"
            role="radio"
            aria-checked={Number(value) === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            onFocus={() => setHoverValue(star)}
            onBlur={() => setHoverValue(0)}
            onClick={() => onChange?.(star)}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

export default StarRating;
