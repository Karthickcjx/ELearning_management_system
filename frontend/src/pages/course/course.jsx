import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import { message, Modal } from "antd";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Clock,
  Edit3,
  GraduationCap,
  Lock,
  MessageSquare,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Feedback from "./Feedback";
import Forum from "./forum";
import { courseService } from "../../api/course.service";
import { progressService } from "../../api/progress.service";
import { reviewService } from "../../api/review.service";
import Navbar from "../../components/common/Navbar";
import CourseRatingSummary from "../../components/reviews/CourseRatingSummary";
import EditReviewModal from "../../components/reviews/EditReviewModal";
import ReviewList from "../../components/reviews/ReviewList";
import ReviewModal from "../../components/reviews/ReviewModal";
import fallbackCourseImage from "../../assets/images/c1.jpg";

const DEFAULT_PROGRESS = {
  playedTime: 0,
  duration: 0,
  progressPercent: 0,
};

const CERTIFICATE_UNLOCK_PERCENT = 85;
const QUIZ_UNLOCK_PERCENT = 98;
const REVIEW_UNLOCK_PERCENT = CERTIFICATE_UNLOCK_PERCENT;

function getProgressPercent(playedTime, duration, fallbackPercent = 0) {
  if (!duration || duration <= 0) {
    return fallbackPercent;
  }

  return Math.min(100, Math.round((playedTime / duration) * 100));
}

function formatMinutes(seconds) {
  if (!seconds || seconds <= 0) {
    return "0 min";
  }

  return `${Math.max(1, Math.ceil(seconds / 60))} min`;
}

function formatCourseTitle(title) {
  if (!title) {
    return "Untitled course";
  }

  return title.length < 8 ? `${title} Tutorial` : title;
}

function getCourseStatus(progressPercent) {
  if (progressPercent >= 100) {
    return {
      label: "Completed",
      className: "text-emerald-700 bg-emerald-50 border-emerald-200",
      helper: "Certificate ready to download",
    };
  }

  if (progressPercent >= QUIZ_UNLOCK_PERCENT) {
    return {
      label: "Assessment ready",
      className: "text-accent bg-accent/10 border-accent/20",
      helper: "Quiz and certificate are unlocked",
    };
  }

  if (progressPercent >= CERTIFICATE_UNLOCK_PERCENT) {
    return {
      label: "Certificate ready",
      className: "text-emerald-700 bg-emerald-50 border-emerald-200",
      helper: `Quiz unlocks at ${QUIZ_UNLOCK_PERCENT}%`,
    };
  }

  if (progressPercent > 0) {
    return {
      label: "In progress",
      className: "text-primary bg-primary/10 border-primary/20",
      helper: `${Math.max(CERTIFICATE_UNLOCK_PERCENT - progressPercent, 0)}% more to unlock your certificate`,
    };
  }

  return {
    label: "Ready to start",
    className: "text-slate-600 bg-slate-100 border-slate-200",
    helper: "Begin the lesson to track progress",
  };
}

const Course = () => {
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const [course, setCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [duration, setDuration] = useState(0);
  const [played, setPlayed] = useState(0);
  const [checkpointPlayed, setCheckpointPlayed] = useState(0);
  const [progressSnapshot, setProgressSnapshot] = useState(DEFAULT_PROGRESS);
  const [progressLoading, setProgressLoading] = useState(true);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [ratingSummary, setRatingSummary] = useState({ averageRating: 0, reviewCount: 0 });
  const [reviewStatus, setReviewStatus] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isEditReviewModalOpen, setIsEditReviewModalOpen] = useState(false);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);
  const userId = localStorage.getItem("id");
  const navigate = useNavigate();
  const { id: courseId } = useParams();
  const playerRef = useRef(null);
  const hasRestoredPositionRef = useRef(false);
  const skippedReviewPromptRef = useRef(false);

  const loadRatingSummary = useCallback(async () => {
    if (!courseId) return;

    const response = await reviewService.getCourseRatingSummary(courseId);
    if (response.success) {
      setRatingSummary(response.data || { averageRating: 0, reviewCount: 0 });
    }
  }, [courseId]);

  const loadReviewStatus = useCallback(async () => {
    if (!courseId || !userId) return null;

    const response = await reviewService.getMyReview(courseId);
    if (response.success) {
      setReviewStatus(response.data);
      return response.data;
    }

    return null;
  }, [courseId, userId]);

  useEffect(() => {
    hasRestoredPositionRef.current = false;
    skippedReviewPromptRef.current = false;
    setError(false);
    setCourse({});
    setIsPlayerReady(false);
    setPlayed(0);
    setDuration(0);
    setCheckpointPlayed(0);
    setProgressSnapshot(DEFAULT_PROGRESS);
    setReviewStatus(null);
    setIsReviewModalOpen(false);
    setIsEditReviewModalOpen(false);
  }, [courseId]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCourse() {
      try {
        setLoading(true);
        const response = await courseService.getCourseById(courseId);
        if (isMounted && response.success) {
          setCourse(response.data || {});
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching course:", err);
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (courseId) {
      fetchCourse();
    }

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  useEffect(() => {
    loadRatingSummary();
  }, [loadRatingSummary]);

  useEffect(() => {
    let isMounted = true;

    async function fetchProgressSummary() {
      if (!userId || !courseId) {
        setProgressLoading(false);
        return;
      }

      try {
        setProgressLoading(true);
        const response = await progressService.getProgressSummary(userId, courseId);
        const snapshot = response.success ? response.data || DEFAULT_PROGRESS : DEFAULT_PROGRESS;
        const savedPlayedTime = Number(snapshot.playedTime) || 0;
        const savedDuration = Number(snapshot.duration) || 0;

        if (isMounted) {
          setProgressSnapshot(snapshot);
          setPlayed(savedPlayedTime);
          setCheckpointPlayed(savedPlayedTime);
          if (savedDuration > 0) {
            setDuration(savedDuration);
          }
        }
      } catch (err) {
        console.error("Error fetching progress summary:", err);
      } finally {
        if (isMounted) {
          setProgressLoading(false);
        }
      }
    }

    fetchProgressSummary();

    return () => {
      isMounted = false;
    };
  }, [courseId, userId]);

  useEffect(() => {
    if (!isPlayerReady || !playerRef.current || hasRestoredPositionRef.current || played <= 0) {
      return;
    }

    try {
      playerRef.current.seekTo(played, "seconds");
      hasRestoredPositionRef.current = true;
    } catch (err) {
      console.error("Unable to restore playback position:", err);
    }
  }, [isPlayerReady, played]);

  useEffect(() => {
    let isCancelled = false;

    async function syncProgress() {
      if (!courseId || !userId || !duration || checkpointPlayed <= progressSnapshot.playedTime) {
        return;
      }

      const response = await progressService.updateProgress(userId, courseId, checkpointPlayed, duration);

      if (!isCancelled && response.success) {
        const nextProgressPercent = getProgressPercent(
          Math.max(progressSnapshot.playedTime || 0, checkpointPlayed),
          duration,
          progressSnapshot.progressPercent
        );
        setProgressSnapshot((previous) => {
          const nextPlayedTime = Math.max(previous.playedTime || 0, checkpointPlayed);
          return {
            ...previous,
            playedTime: nextPlayedTime,
            duration,
            progressPercent: getProgressPercent(nextPlayedTime, duration, previous.progressPercent),
          };
        });

        if (nextProgressPercent >= REVIEW_UNLOCK_PERCENT) {
          loadReviewStatus();
        }
      }
    }

    syncProgress();

    return () => {
      isCancelled = true;
    };
  }, [checkpointPlayed, courseId, duration, loadReviewStatus, progressSnapshot.playedTime, progressSnapshot.progressPercent, userId]);

  const handleDuration = () => {
    const videoDuration = playerRef.current?.getDuration?.() || 0;

    if (videoDuration > 0) {
      setDuration((previous) => {
        if (previous > 0 && Math.abs(previous - videoDuration) < 1) {
          return previous;
        }

        return videoDuration;
      });

      setProgressSnapshot((previous) => ({
        ...previous,
        duration: videoDuration,
        progressPercent: getProgressPercent(
          Math.max(previous.playedTime || 0, played),
          videoDuration,
          previous.progressPercent
        ),
      }));

      if (userId && courseId) {
        progressService.updateDuration(userId, courseId, videoDuration);
      }
    }
  };

  const handlePlayerProgress = ({ playedSeconds }) => {
    const safePlayedSeconds = Math.floor(playedSeconds || 0);

    setPlayed((previous) => Math.max(previous, safePlayedSeconds));

    if (safePlayedSeconds - checkpointPlayed >= 10) {
      setCheckpointPlayed(safePlayedSeconds);
    }
  };

  const effectivePlayed = Math.max(Number(progressSnapshot.playedTime) || 0, played);
  const effectiveDuration = duration || Number(progressSnapshot.duration) || 0;
  const progressPercent = getProgressPercent(
    effectivePlayed,
    effectiveDuration,
    Number(progressSnapshot.progressPercent) || 0
  );
  const courseStatus = getCourseStatus(progressPercent);
  const watchedTimeLabel = formatMinutes(effectivePlayed);
  const totalTimeLabel = formatMinutes(effectiveDuration);
  const remainingTimeLabel = formatMinutes(Math.max(effectiveDuration - effectivePlayed, 0));
  const quizUnlocked = progressPercent >= QUIZ_UNLOCK_PERCENT;
  const certificateUnlocked = progressPercent >= CERTIFICATE_UNLOCK_PERCENT;
  const effectiveAverageRating = ratingSummary.averageRating ?? course.averageRating ?? 0;
  const effectiveReviewCount = ratingSummary.reviewCount ?? course.reviewCount ?? 0;

  useEffect(() => {
    if (!userId || !courseId || progressPercent < REVIEW_UNLOCK_PERCENT) {
      return;
    }

    loadReviewStatus();
  }, [courseId, loadReviewStatus, progressPercent, userId]);

  useEffect(() => {
    if (
      progressPercent >= REVIEW_UNLOCK_PERCENT &&
      reviewStatus?.eligible &&
      !reviewStatus?.hasReview &&
      !skippedReviewPromptRef.current
    ) {
      setIsReviewModalOpen(true);
    }
  }, [progressPercent, reviewStatus]);

  const closeReviewPrompt = () => {
    skippedReviewPromptRef.current = true;
    setIsReviewModalOpen(false);
  };

  const handleReviewSubmitted = async ({ rating, reviewText }) => {
    setIsReviewSubmitting(true);
    const response = await reviewService.createReview(courseId, rating, reviewText);
    setIsReviewSubmitting(false);

    if (response.success) {
      message.success("Review submitted successfully");
      setIsReviewModalOpen(false);
      setReviewStatus((previous) => ({
        ...(previous || {}),
        hasReview: true,
        eligible: true,
        review: response.data,
      }));
      setReviewRefreshKey((previous) => previous + 1);
      loadRatingSummary();
    } else {
      message.error(response.error || "Error submitting review");
    }
  };

  const handleReviewUpdated = async ({ rating, reviewText }) => {
    if (!reviewStatus?.review?.id) {
      message.error("Unable to find your review");
      return;
    }

    setIsReviewSubmitting(true);
    const response = await reviewService.updateReview(reviewStatus.review.id, courseId, rating, reviewText);
    setIsReviewSubmitting(false);

    if (response.success) {
      message.success("Review updated");
      setIsEditReviewModalOpen(false);
      setReviewStatus((previous) => ({
        ...(previous || {}),
        hasReview: true,
        review: response.data,
      }));
      setReviewRefreshKey((previous) => previous + 1);
      loadRatingSummary();
    } else {
      message.error(response.error || "Error submitting review");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar page="learnings" />
        <div className="max-w-container-xl mx-auto px-6 py-6 lg:py-8">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center py-16">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-slate-500">Loading your course workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar page="learnings" />
        <div className="max-w-container-xl mx-auto px-6 py-6 lg:py-8">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center py-16 max-w-md mx-auto">
            <h1 className="text-base font-semibold text-slate-900">We could not load this course</h1>
            <p className="text-sm text-slate-500 mt-1 mb-5">Please try again or head back to your learning library.</p>
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold rounded-md px-4 py-2 hover:bg-primary-dark transition-colors"
              onClick={() => navigate("/learnings")}
            >
              <ArrowLeft size={16} />
              Back to My Learning
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar page="learnings" />

      <main className="max-w-container-xl mx-auto px-6 py-6 lg:py-8">
        <button
          type="button"
          onClick={() => navigate("/learnings")}
          className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm rounded-md px-3 py-2 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          <span>Back to My Learning</span>
        </button>

        <div className="flex items-center gap-2">
          <Sparkles size={22} className="text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            The Complete {formatCourseTitle(course.course_name)} Course
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-500 max-w-3xl">
          {course.description ||
            "Stay focused, track your progress, and move through the course at your own pace with assessments and discussion support."}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${courseStatus.className}`}>
            {courseStatus.label}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1">
            <GraduationCap size={13} />
            {course.instructor || "EduVerse instructor"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1">
            <Clock size={13} />
            {effectiveDuration > 0 ? `${totalTimeLabel} total video` : "Self-paced course"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1">
            <CourseRatingSummary
              averageRating={effectiveAverageRating}
              reviewCount={effectiveReviewCount}
              compact
            />
          </span>
        </div>

        <div className="mt-6 space-y-6">
          {/* Progress overview card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Course progress</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <strong className="text-2xl font-bold text-slate-900">{progressPercent}%</strong>
                  <p className="text-sm text-slate-500">{courseStatus.helper}</p>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span>{watchedTimeLabel} watched</span>
                <span>{remainingTimeLabel} left</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <div className="space-y-6">
              {/* Player card */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">Lesson video</span>
                    <h2 className="text-base font-semibold text-slate-900 mt-1">Pick up where you left off</h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary rounded-full px-2.5 py-1">
                    <Play size={12} />
                    Resume
                  </span>
                </div>

                <div className="aspect-video bg-slate-900 rounded-md overflow-hidden">
                  {course.y_link ? (
                    <ReactPlayer
                      ref={playerRef}
                      url={course.y_link}
                      controls
                      width="100%"
                      height="100%"
                      progressInterval={1000}
                      onReady={() => setIsPlayerReady(true)}
                      onDuration={handleDuration}
                      onProgress={handlePlayerProgress}
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <img
                        src={course.p_link || fallbackCourseImage}
                        alt={course.course_name}
                        className="w-full h-full object-cover opacity-70"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = fallbackCourseImage;
                        }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6 bg-slate-900/50">
                        <h3 className="text-base font-semibold">Video unavailable</h3>
                        <p className="text-sm text-slate-200 mt-1 max-w-md">The lesson preview is not available right now, but the rest of the course details are ready below.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Progress</span>
                    <strong className="text-lg font-semibold text-slate-900">{progressPercent}%</strong>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Watched</span>
                    <strong className="text-lg font-semibold text-slate-900">{watchedTimeLabel}</strong>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                    <Target size={18} />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Remaining</span>
                    <strong className="text-lg font-semibold text-slate-900">{remainingTimeLabel}</strong>
                  </div>
                </div>
              </div>

              {/* About card */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Overview</span>
                <h2 className="text-base font-semibold text-slate-900 mt-1 mb-2">About this course</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {course.description ||
                    "This course blends video lessons, practical explanations, and checkpoints so you can move steadily from basics to confidence."}
                </p>
              </div>

              {/* Progress tracker card */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">Progress tracker</span>
                    <h2 className="text-base font-semibold text-slate-900 mt-1">Keep momentum visible</h2>
                  </div>
                  {progressLoading ? <span className="text-xs text-slate-500">Syncing...</span> : null}
                </div>

                {progressLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading your latest progress...</span>
                  </div>
                ) : (
                  <>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p>
                        You have completed <strong className="text-slate-900">{progressPercent}%</strong> of this course.
                      </p>
                      <p>
                        {certificateUnlocked
                          ? "Your certificate is now unlocked."
                          : `Reach ${CERTIFICATE_UNLOCK_PERCENT}% progress to unlock your certificate. You are ${Math.max(CERTIFICATE_UNLOCK_PERCENT - progressPercent, 0)}% away.`}
                      </p>
                      <p>
                        {quizUnlocked
                          ? "Your assessment is now unlocked."
                          : `Reach ${QUIZ_UNLOCK_PERCENT}% progress to unlock the quiz. You are ${Math.max(QUIZ_UNLOCK_PERCENT - progressPercent, 0)}% away.`}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Course guide</span>
                <h2 className="text-base font-semibold text-slate-900 mt-1 mb-4">How this course works</h2>

                <div className="space-y-4">
                  <article className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Play size={14} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Course format</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Self-paced video lessons with practical checkpoints so you can learn on your own schedule.</p>
                    </div>
                  </article>

                  <article className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <BookOpen size={14} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Prerequisites</h3>
                      <p className="text-xs text-slate-500 mt-0.5">No prior experience is required. Basic computer familiarity is enough to get started.</p>
                    </div>
                  </article>

                  <article className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Users size={14} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Who this helps</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Beginners, upskillers, and students who want to build {course.course_name || "new"} skills confidently.</p>
                    </div>
                  </article>

                  <article className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Award size={14} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Assessment</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Unlock your certificate at 85% progress and the quiz at 98% progress.</p>
                    </div>
                  </article>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Actions</span>
                <h2 className="text-base font-semibold text-slate-900 mt-1 mb-4">Stay in motion</h2>

                <div className="space-y-2">
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-md px-4 py-2 transition-colors"
                    onClick={() => setIsDiscussionOpen(true)}
                  >
                    <MessageSquare size={16} />
                    Open Discussion
                  </button>

                  {quizUnlocked ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/assessment/${course.course_id}`)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold rounded-md px-4 py-2 hover:bg-primary-dark transition-colors"
                    >
                      <Award size={16} />
                      Take Quiz
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsQuizModalOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-400 font-semibold rounded-md px-4 py-2 cursor-not-allowed"
                    >
                      <Lock size={16} />
                      Quiz Locked
                    </button>
                  )}

                  {certificateUnlocked ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/certificate/${course.course_id}`)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-accent text-white font-semibold rounded-md px-4 py-2 hover:bg-accent-dark transition-colors"
                    >
                      <Award size={16} />
                      Download Certificate
                    </button>
                  ) : null}
                </div>
              </div>
            </aside>
          </section>

          <section className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">Course rating</span>
                  <h2 className="text-base font-semibold text-slate-900 mt-1 mb-2">Reviews and ratings</h2>
                  <CourseRatingSummary
                    averageRating={effectiveAverageRating}
                    reviewCount={effectiveReviewCount}
                  />
                </div>

                {reviewStatus?.hasReview ? (
                  <button
                    type="button"
                    onClick={() => setIsEditReviewModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-md px-4 py-2 transition-colors"
                  >
                    <Edit3 size={15} />
                    Edit Your Review
                  </button>
                ) : reviewStatus?.eligible ? (
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold rounded-md px-4 py-2 hover:bg-primary-dark transition-colors"
                  >
                    <MessageSquare size={15} />
                    Rate This Course
                  </button>
                ) : null}
              </div>
            </div>

            <ReviewList courseId={courseId} refreshKey={reviewRefreshKey} />
          </section>

          <section>
            <Feedback courseid={courseId} />
          </section>
        </div>
      </main>

      <Modal
        title="Quiz unlock"
        open={isQuizModalOpen}
        onOk={() => setIsQuizModalOpen(false)}
        onCancel={() => setIsQuizModalOpen(false)}
      >
        <p className="text-sm text-slate-600">
          Reach {QUIZ_UNLOCK_PERCENT}% course progress to unlock the assessment. You are currently at {progressPercent}%.
        </p>
      </Modal>

      <Modal
        title={null}
        open={isDiscussionOpen}
        onCancel={() => setIsDiscussionOpen(false)}
        footer={null}
        width={860}
      >
        <div className="mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Community discussion</span>
          <h2 className="text-base font-semibold text-slate-900 mt-1">{formatCourseTitle(course.course_name)} Forum</h2>
          <p className="text-sm text-slate-500 mt-1">Ask questions, share tips, and learn with other people taking the same course.</p>
        </div>
        <Forum courseId={courseId} />
      </Modal>

      <ReviewModal
        open={isReviewModalOpen}
        course={course}
        loading={isReviewSubmitting}
        onSubmit={handleReviewSubmitted}
        onSkip={closeReviewPrompt}
        onClose={closeReviewPrompt}
      />

      <EditReviewModal
        open={isEditReviewModalOpen}
        course={course}
        initialReview={reviewStatus?.review}
        loading={isReviewSubmitting}
        onSubmit={handleReviewUpdated}
        onClose={() => setIsEditReviewModalOpen(false)}
      />
    </div>
  );
};

export default Course;
