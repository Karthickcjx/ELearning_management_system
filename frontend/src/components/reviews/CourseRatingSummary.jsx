import React from "react";
import StarRating from "./StarRating";
import "./Review.css";

function formatAverage(value) {
  const numeric = Number(value) || 0;
  return numeric > 0 ? numeric.toFixed(1) : "0.0";
}

function CourseRatingSummary({ averageRating = 0, reviewCount = 0, compact = false, className = "" }) {
  const count = Number(reviewCount) || 0;

  if (compact) {
    return (
      <div className={`course-rating-compact ${className}`.trim()}>
        <StarRating value={Math.round(Number(averageRating) || 0)} readOnly size={15} />
        <span>{formatAverage(averageRating)}</span>
        <span className="course-rating-muted">({count})</span>
      </div>
    );
  }

  return (
    <div className={`course-rating-summary ${className}`.trim()}>
      <div className="course-rating-score">
        <StarRating value={Math.round(Number(averageRating) || 0)} readOnly size={22} />
        <strong>{formatAverage(averageRating)}</strong>
      </div>
      <span className="course-rating-count">
        {count} {count === 1 ? "review" : "reviews"}
      </span>
    </div>
  );
}

export default CourseRatingSummary;
