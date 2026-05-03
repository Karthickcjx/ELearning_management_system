import React, { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Loader2, MessageSquare } from "lucide-react";
import { message } from "antd";
import { reviewService } from "../../api/review.service";
import StarRating from "./StarRating";
import "./Review.css";

function formatDate(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ReviewList({ courseId, refreshKey = 0 }) {
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadReviews = useCallback(
    async ({ nextPage = 0, append = false } = {}) => {
      if (!courseId) return;
      append ? setLoadingMore(true) : setLoading(true);

      const response = await reviewService.getCourseReviews(courseId, {
        page: nextPage,
        size: 5,
        sort,
      });

      if (response.success) {
        const data = response.data || {};
        const content = data.content || [];
        setReviews((previous) => (append ? [...previous, ...content] : content));
        setTotalElements(Number(data.totalElements) || content.length);
        setPage(Number(data.number) || nextPage);
      } else {
        message.error(response.error || "Unable to load reviews");
      }

      setLoading(false);
      setLoadingMore(false);
    },
    [courseId, sort]
  );

  useEffect(() => {
    setPage(0);
    loadReviews({ nextPage: 0, append: false });
  }, [loadReviews, refreshKey]);

  const hasMore = reviews.length < totalElements;

  return (
    <div className="review-list-card">
      <div className="review-list-header">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Learner reviews</span>
          <h3 className="text-base font-semibold text-slate-900 mt-1">What students think</h3>
        </div>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="review-sort-select"
          aria-label="Sort reviews"
        >
          <option value="newest">Newest</option>
          <option value="highest">Highest rated</option>
          <option value="lowest">Lowest rated</option>
        </select>
      </div>

      {loading ? (
        <div className="review-list-state">
          <Loader2 size={20} className="animate-spin text-primary" />
          <span>Loading reviews...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="review-list-empty">
          <MessageSquare size={34} />
          <strong>No reviews yet</strong>
          <span>Ratings from learners will appear here after they complete enough of the course.</span>
        </div>
      ) : (
        <div className="review-list-items">
          {reviews.map((review) => (
            <article key={review.id} className="review-list-item">
              <div className="review-avatar" aria-hidden="true">
                {(review.userName || "L").trim().charAt(0).toUpperCase()}
              </div>
              <div className="review-body">
                <div className="review-row">
                  <div>
                    <strong>{review.userName || "Learner"}</strong>
                    <span className="review-verified">
                      <BadgeCheck size={13} />
                      Verified learner
                    </span>
                  </div>
                  <span className="review-date">{formatDate(review.updatedAt || review.createdAt)}</span>
                </div>
                <StarRating value={review.rating} readOnly size={16} className="review-item-stars" />
                {review.reviewText ? <p>{review.reviewText}</p> : <p className="review-muted">No written feedback.</p>}
              </div>
            </article>
          ))}
        </div>
      )}

      {hasMore ? (
        <button
          type="button"
          className="review-load-more"
          onClick={() => loadReviews({ nextPage: page + 1, append: true })}
          disabled={loadingMore}
        >
          {loadingMore ? "Loading..." : "Load more reviews"}
        </button>
      ) : null}
    </div>
  );
}

export default ReviewList;
