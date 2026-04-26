import React, { useEffect, useMemo, useState } from "react";
import { message, Modal } from "antd";
import { MessageSquareText } from "lucide-react";
import StarRating from "./StarRating";
import "./Review.css";

const MAX_REVIEW_LENGTH = 500;

function hasSpamPattern(text) {
  if (!text) return false;
  return /(.)\1{8,}/i.test(text) || /\b(\w+)\b(?:\s+\1\b){4,}/i.test(text);
}

function ReviewModal({
  open,
  course,
  initialReview,
  mode = "create",
  loading = false,
  onSubmit,
  onSkip,
  onClose,
}) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setRating(initialReview?.rating || 0);
    setReviewText(initialReview?.reviewText || "");
    setValidationMessage("");
  }, [initialReview, open]);

  const trimmedText = useMemo(() => reviewText.trim(), [reviewText]);
  const charsRemaining = MAX_REVIEW_LENGTH - reviewText.length;

  const handleSubmit = async () => {
    if (!rating) {
      setValidationMessage("Please select rating");
      message.warning("Please select rating");
      return;
    }

    if (hasSpamPattern(trimmedText)) {
      setValidationMessage("Please avoid repeated characters or repeated words.");
      return;
    }

    setValidationMessage("");
    await onSubmit?.({ rating, reviewText: trimmedText });
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      className="review-modal"
      destroyOnClose
    >
      <div className="review-modal-shell">
        <div className="review-modal-icon">
          <MessageSquareText size={24} />
        </div>

        <div className="review-modal-copy">
          <span className="review-modal-kicker">{mode === "edit" ? "Edit review" : "Course milestone reached"}</span>
          <h2>Rate Your Course Experience</h2>
          <p>{course?.course_name || course?.courseName || "This course"}</p>
        </div>

        <div className="review-modal-stars">
          <StarRating value={rating} onChange={setRating} size={34} label="Select course rating" />
        </div>

        {validationMessage ? <div className="review-modal-error">{validationMessage}</div> : null}

        <div className="review-modal-field">
          <textarea
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value.slice(0, MAX_REVIEW_LENGTH))}
            maxLength={MAX_REVIEW_LENGTH}
            placeholder="Share what worked well, what could improve, or what helped you most."
            rows={5}
          />
          <span className={charsRemaining < 40 ? "review-counter warning" : "review-counter"}>
            {reviewText.length}/{MAX_REVIEW_LENGTH}
          </span>
        </div>

        <div className="review-modal-actions">
          {mode === "create" ? (
            <button type="button" className="review-btn review-btn-ghost" onClick={onSkip} disabled={loading}>
              Skip
            </button>
          ) : (
            <button type="button" className="review-btn review-btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          )}
          <button type="button" className="review-btn review-btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : mode === "edit" ? "Save Updates" : "Submit Review"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ReviewModal;
