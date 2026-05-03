import React, { useEffect, useState } from "react";
import { message } from "antd";
import { MessageSquare, Send } from "lucide-react";
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
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Feedback wall</span>
          <h3 className="text-base font-semibold text-slate-900 mt-1">What learners are saying</h3>
          <p className="text-sm text-slate-500 mt-1">Drop a quick note after your lesson and help the next learner know what to expect.</p>
        </div>
        <div className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 whitespace-nowrap">
          {feedbacks.length} recent
        </div>
      </div>

      <div className="space-y-3 mb-5">
        {feedbacks.length > 0 ? (
          feedbacks.map((item, index) => (
            <article key={item.id || index} className="flex items-start gap-3 p-3 rounded-md border border-slate-200 bg-slate-50">
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                {getAvatarLabel(index)}
              </div>
              <div className="min-w-0">
                <strong className="text-sm font-semibold text-slate-900">Learner {index + 1}</strong>
                <p className="text-sm text-slate-600 mt-0.5">{item.comment}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10 text-slate-500">
            <MessageSquare size={40} className="text-slate-300 mb-2" />
            <h4 className="text-base font-semibold text-slate-900">No feedback yet</h4>
            <p className="text-sm text-slate-500 mt-1">Be the first to share a quick note.</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Write your feedback..."
          className="flex-1 h-10 px-3 border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          onChange={(event) => setFeedback(event.target.value)}
          value={feedback}
        />
        <button
          type="button"
          onClick={sendFeedback}
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold rounded-md px-4 py-2 hover:bg-primary-dark transition-colors"
        >
          <Send size={15} /> Send
        </button>
      </div>
    </div>
  );
};

export default Feedback;
