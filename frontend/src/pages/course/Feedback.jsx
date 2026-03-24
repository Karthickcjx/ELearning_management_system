import React, { useEffect, useState } from "react";
import { message } from "antd";
import { courseService } from "../../api/course.service";

function getAvatarLabel(index) {
  return String.fromCharCode(65 + (index % 26));
}

const Feedback = ({ courseid }) => {
  const [feedback, setFeedback] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadFeedbacks() {
      const res = await courseService.getFeedbacks(courseid);

      if (!isMounted) {
        return;
      }

      if (res.success) {
        setFeedbacks((res.data || []).slice(0, 5));
      } else {
        message.error(res.error || "Failed to load feedbacks");
      }
    }

    if (courseid) {
      loadFeedbacks();
    }

    return () => {
      isMounted = false;
    };
  }, [courseid]);

  const sendFeedback = async () => {
    if (!feedback.trim()) {
      message.warning("Please enter feedback before submitting");
      return;
    }

    const res = await courseService.postFeedback(courseid, feedback.trim());
    if (res.success) {
      message.success("Feedback submitted successfully");
      setFeedback("");

      const refresh = await courseService.getFeedbacks(courseid);
      if (refresh.success) {
        setFeedbacks((refresh.data || []).slice(0, 5));
      }
    } else {
      message.error(res.error || "Failed to submit feedback");
    }
  };

  return (
    <div className="course-feedback-card">
      <div className="course-feedback-header">
        <div>
          <span className="course-section-kicker">Feedback wall</span>
          <h3>What learners are saying</h3>
          <p>Drop a quick note after your lesson and help the next learner know what to expect.</p>
        </div>
        <div className="course-feedback-count">{feedbacks.length} recent</div>
      </div>

      <div className="course-feedback-list">
        {feedbacks.length > 0 ? (
          feedbacks.map((item, index) => (
            <article key={item.id || index} className="course-feedback-item">
              <div className="course-feedback-avatar">{getAvatarLabel(index)}</div>
              <div>
                <strong>Learner {index + 1}</strong>
                <p>{item.comment}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="course-feedback-empty">No feedback yet. Be the first to share a quick note.</div>
        )}
      </div>

      <div className="course-feedback-form">
        <input
          type="text"
          placeholder="Write your feedback..."
          className="course-feedback-input"
          onChange={(event) => setFeedback(event.target.value)}
          value={feedback}
        />
        <button
          type="button"
          onClick={sendFeedback}
          className="course-action-button course-action-button-primary course-feedback-submit"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Feedback;
