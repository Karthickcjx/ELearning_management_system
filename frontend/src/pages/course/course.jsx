import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import { Modal } from "antd";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Clock,
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
import Navbar from "../../Components/common/Navbar";
import fallbackCourseImage from "../../assets/images/c1.jpg";
import "./Course.css";

const DEFAULT_PROGRESS = {
  playedTime: 0,
  duration: 0,
  progressPercent: 0,
};

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
      tone: "success",
      helper: "Certificate ready to download",
    };
  }

  if (progressPercent >= 98) {
    return {
      label: "Assessment ready",
      tone: "accent",
      helper: "Your quiz is unlocked",
    };
  }

  if (progressPercent > 0) {
    return {
      label: "In progress",
      tone: "primary",
      helper: `${Math.max(98 - progressPercent, 0)}% more to unlock the quiz`,
    };
  }

  return {
    label: "Ready to start",
    tone: "muted",
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
  const userId = localStorage.getItem("id");
  const navigate = useNavigate();
  const { id: courseId } = useParams();
  const playerRef = useRef(null);
  const hasRestoredPositionRef = useRef(false);

  useEffect(() => {
    hasRestoredPositionRef.current = false;
    setError(false);
    setCourse({});
    setIsPlayerReady(false);
    setPlayed(0);
    setDuration(0);
    setCheckpointPlayed(0);
    setProgressSnapshot(DEFAULT_PROGRESS);
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
        setProgressSnapshot((previous) => {
          const nextPlayedTime = Math.max(previous.playedTime || 0, checkpointPlayed);
          return {
            ...previous,
            playedTime: nextPlayedTime,
            duration,
            progressPercent: getProgressPercent(nextPlayedTime, duration, previous.progressPercent),
          };
        });
      }
    }

    syncProgress();

    return () => {
      isCancelled = true;
    };
  }, [checkpointPlayed, courseId, duration, progressSnapshot.playedTime, userId]);

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
  const quizUnlocked = progressPercent >= 98;
  const certificateUnlocked = progressPercent >= 100;

  if (loading) {
    return (
      <div className="course-page">
        <Navbar page="learnings" />
        <div className="course-state-shell">
          <div className="lms-spinner"></div>
          <p>Loading your course workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-page">
        <Navbar page="learnings" />
        <div className="course-state-shell">
          <div className="course-state-card">
            <h1>We could not load this course</h1>
            <p>Please try again or head back to your learning library.</p>
            <button
              type="button"
              className="course-action-button course-action-button-primary"
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
    <div className="course-page">
      <Navbar page="learnings" />

      <main className="course-shell">
        <section className="course-hero">
          <div className="course-hero-main">
            <button
              type="button"
              onClick={() => navigate("/learnings")}
              className="course-back-button"
            >
              <ArrowLeft size={16} />
              <span>Back to My Learning</span>
            </button>

            <div className="course-hero-pill">
              <Sparkles size={14} />
              <span>Learning session</span>
            </div>

            <h1>The Complete {formatCourseTitle(course.course_name)} Course</h1>
            <p className="course-hero-description">
              {course.description ||
                "Stay focused, track your progress, and move through the course at your own pace with assessments and discussion support."}
            </p>

            <div className="course-meta-row">
              <span className={`course-status-badge tone-${courseStatus.tone}`}>
                {courseStatus.label}
              </span>
              <span className="course-meta-chip">
                <GraduationCap size={15} />
                {course.instructor || "EduVerse instructor"}
              </span>
              <span className="course-meta-chip">
                <Clock size={15} />
                {effectiveDuration > 0 ? `${totalTimeLabel} total video` : "Self-paced course"}
              </span>
            </div>
          </div>

          <div className="course-hero-progress-card">
            <span className="course-hero-progress-label">Course progress</span>
            <strong>{progressPercent}%</strong>
            <p>{courseStatus.helper}</p>
            <div className="course-progress-track" aria-hidden="true">
              <div
                className="course-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="course-hero-progress-meta">
              <span>{watchedTimeLabel} watched</span>
              <span>{remainingTimeLabel} left</span>
            </div>
          </div>
        </section>

        <section className="course-layout">
          <div className="course-main-column">
            <div className="course-player-card">
              <div className="course-card-head">
                <div>
                  <span className="course-section-kicker">Lesson video</span>
                  <h2>Pick up where you left off</h2>
                </div>
                <span className="course-card-badge">
                  <Play size={14} />
                  Resume learning
                </span>
              </div>

              <div className="course-player-frame">
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
                    className="course-player"
                  />
                ) : (
                  <div className="course-player-fallback">
                    <img
                      src={course.p_link || fallbackCourseImage}
                      alt={course.course_name}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackCourseImage;
                      }}
                    />
                    <div className="course-player-fallback-copy">
                      <h3>Video unavailable</h3>
                      <p>The lesson preview is not available right now, but the rest of the course details are ready below.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="course-stats-grid">
              <article className="course-stat-card">
                <div className="course-stat-icon tone-primary">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <span>Progress</span>
                  <strong>{progressPercent}%</strong>
                </div>
              </article>

              <article className="course-stat-card">
                <div className="course-stat-icon tone-cyan">
                  <Clock size={18} />
                </div>
                <div>
                  <span>Watched</span>
                  <strong>{watchedTimeLabel}</strong>
                </div>
              </article>

              <article className="course-stat-card">
                <div className="course-stat-icon tone-accent">
                  <Target size={18} />
                </div>
                <div>
                  <span>Remaining</span>
                  <strong>{remainingTimeLabel}</strong>
                </div>
              </article>
            </div>

            <div className="course-info-card">
              <div className="course-card-head">
                <div>
                  <span className="course-section-kicker">Overview</span>
                  <h2>About this course</h2>
                </div>
              </div>
              <p className="course-info-copy">
                {course.description ||
                  "This course blends video lessons, practical explanations, and checkpoints so you can move steadily from basics to confidence."}
              </p>
            </div>

            <div className="course-info-card">
              <div className="course-card-head">
                <div>
                  <span className="course-section-kicker">Progress tracker</span>
                  <h2>Keep momentum visible</h2>
                </div>
                {progressLoading ? <span className="course-inline-note">Syncing...</span> : null}
              </div>

              {progressLoading ? (
                <div className="course-progress-loading">
                  <div className="lms-spinner"></div>
                  <span>Loading your latest progress...</span>
                </div>
              ) : (
                <>
                  <div className="course-progress-track" aria-hidden="true">
                    <div
                      className="course-progress-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="course-progress-summary">
                    <p>
                      You have completed <strong>{progressPercent}%</strong> of this course.
                    </p>
                    <p>
                      {quizUnlocked
                        ? "Your assessment is now unlocked."
                        : `Reach 98% progress to unlock the quiz. You are ${Math.max(98 - progressPercent, 0)}% away.`}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <aside className="course-sidebar">
            <div className="course-info-card course-sidebar-card">
              <div className="course-card-head">
                <div>
                  <span className="course-section-kicker">Course guide</span>
                  <h2>How this course works</h2>
                </div>
              </div>

              <div className="course-guide-list">
                <article className="course-guide-item">
                  <div className="course-guide-icon">
                    <Play size={16} />
                  </div>
                  <div>
                    <h3>Course format</h3>
                    <p>Self-paced video lessons with practical checkpoints so you can learn on your own schedule.</p>
                  </div>
                </article>

                <article className="course-guide-item">
                  <div className="course-guide-icon">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <h3>Prerequisites</h3>
                    <p>No prior experience is required. Basic computer familiarity is enough to get started.</p>
                  </div>
                </article>

                <article className="course-guide-item">
                  <div className="course-guide-icon">
                    <Users size={16} />
                  </div>
                  <div>
                    <h3>Who this helps</h3>
                    <p>Beginners, upskillers, and students who want to build {course.course_name || "new"} skills confidently.</p>
                  </div>
                </article>

                <article className="course-guide-item">
                  <div className="course-guide-icon">
                    <Award size={16} />
                  </div>
                  <div>
                    <h3>Assessment</h3>
                    <p>Unlock the quiz at 98% progress and complete the full course to access your certificate.</p>
                  </div>
                </article>
              </div>
            </div>

            <div className="course-info-card course-sidebar-card">
              <div className="course-card-head">
                <div>
                  <span className="course-section-kicker">Actions</span>
                  <h2>Stay in motion</h2>
                </div>
              </div>

              <div className="course-action-stack">
                <button
                  type="button"
                  className="course-action-button course-action-button-secondary"
                  onClick={() => setIsDiscussionOpen(true)}
                >
                  <MessageSquare size={16} />
                  Open Discussion
                </button>

                {quizUnlocked ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/assessment/${course.course_id}`)}
                    className="course-action-button course-action-button-primary"
                  >
                    <Award size={16} />
                    Take Quiz
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsQuizModalOpen(true)}
                    className="course-action-button course-action-button-disabled"
                  >
                    <Lock size={16} />
                    Quiz Locked
                  </button>
                )}

                {certificateUnlocked ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/certificate/${course.course_id}`)}
                    className="course-action-button course-action-button-accent"
                  >
                    <Award size={16} />
                    Download Certificate
                  </button>
                ) : null}
              </div>
            </div>
          </aside>
        </section>

        <section className="course-feedback-shell">
          <Feedback courseid={courseId} />
        </section>
      </main>

      <Modal
        title="Quiz unlock"
        open={isQuizModalOpen}
        onOk={() => setIsQuizModalOpen(false)}
        onCancel={() => setIsQuizModalOpen(false)}
        className="course-modal"
      >
        <p className="course-modal-copy">
          Reach 98% course progress to unlock the assessment. You are currently at {progressPercent}%.
        </p>
      </Modal>

      <Modal
        title={null}
        open={isDiscussionOpen}
        onCancel={() => setIsDiscussionOpen(false)}
        footer={null}
        width={860}
        className="course-modal course-modal-discussion"
      >
        <div className="course-discussion-header">
          <span className="course-section-kicker">Community discussion</span>
          <h2>{formatCourseTitle(course.course_name)} Forum</h2>
          <p>Ask questions, share tips, and learn with other people taking the same course.</p>
        </div>
        <Forum courseId={courseId} />
      </Modal>
    </div>
  );
};

export default Course;
