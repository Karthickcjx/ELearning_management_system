import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  Compass,
  GraduationCap,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { learningService } from "../../api/learning.service";
import { progressService } from "../../api/progress.service";
import fallbackCourseImage from "../../assets/images/c1.jpg";
import "./Learnings.css";

const FILTERS = [
  { key: "all", label: "All courses" },
  { key: "active", label: "Continue" },
  { key: "ready", label: "Ready to start" },
  { key: "completed", label: "Completed" },
];

const DEFAULT_PROGRESS = {
  playedTime: 0,
  duration: 0,
  progressPercent: 0,
};

function formatCourseTitle(title) {
  if (!title) {
    return "Untitled course";
  }

  return title.length < 8 ? `${title} Tutorial` : title;
}

function formatDescription(description) {
  if (!description) {
    return "Continue building momentum with practical lessons, guided videos, and hands-on progress tracking.";
  }

  return description.length > 125 ? `${description.slice(0, 122)}...` : description;
}

function getStatusMeta(progressPercent) {
  if (progressPercent >= 100) {
    return {
      label: "Completed",
      tone: "success",
      helper: "Certificate unlocked",
    };
  }

  if (progressPercent >= 98) {
    return {
      label: "Quiz ready",
      tone: "accent",
      helper: "Assessment unlocked",
    };
  }

  if (progressPercent > 0) {
    return {
      label: "In progress",
      tone: "primary",
      helper: `${progressPercent}% completed`,
    };
  }

  return {
    label: "Ready to start",
    tone: "muted",
    helper: "Start your first lesson",
  };
}

function matchesFilter(course, activeFilter) {
  if (activeFilter === "active") {
    return course.progressPercent > 0 && course.progressPercent < 100;
  }

  if (activeFilter === "ready") {
    return course.progressPercent === 0;
  }

  if (activeFilter === "completed") {
    return course.progressPercent >= 100;
  }

  return true;
}

function getCoursePriority(course) {
  if (course.progressPercent > 0 && course.progressPercent < 100) {
    return 0;
  }

  if (course.progressPercent === 0) {
    return 1;
  }

  return 2;
}

function Learnings() {
  const userId = localStorage.getItem("id");
  const storedName = (localStorage.getItem("name") || "Learner").trim();
  const firstName = storedName.split(" ")[0] || "Learner";
  const [courses, setCourses] = useState([]);
  const [progressByCourse, setProgressByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function fetchCourses() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await learningService.getEnrollments(userId);
        if (isMounted && response.success) {
          setCourses(response.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCourses();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    let isMounted = true;

    async function fetchProgressSummaries() {
      if (!userId || courses.length === 0) {
        setProgressLoading(false);
        setProgressByCourse({});
        return;
      }

      setProgressLoading(true);

      try {
        const progressEntries = await Promise.all(
          courses.map(async (course) => {
            const response = await progressService.getProgressSummary(userId, course.course_id);
            return [course.course_id, response.success ? response.data : DEFAULT_PROGRESS];
          })
        );

        if (isMounted) {
          setProgressByCourse(Object.fromEntries(progressEntries));
        }
      } catch (err) {
        console.error("Error loading learning progress:", err);
      } finally {
        if (isMounted) {
          setProgressLoading(false);
        }
      }
    }

    fetchProgressSummaries();

    return () => {
      isMounted = false;
    };
  }, [courses, userId]);

  const coursesWithMeta = [...courses]
    .map((course) => {
      const progress = progressByCourse[course.course_id] || DEFAULT_PROGRESS;
      const progressPercent = Number(progress.progressPercent) || 0;

      return {
        ...course,
        progressPercent,
        playedTime: Number(progress.playedTime) || 0,
        duration: Number(progress.duration) || 0,
        status: getStatusMeta(progressPercent),
      };
    })
    .sort((courseA, courseB) => {
      const priorityDifference = getCoursePriority(courseA) - getCoursePriority(courseB);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return courseB.progressPercent - courseA.progressPercent;
    });

  const totalCourses = coursesWithMeta.length;
  const activeCourses = coursesWithMeta.filter(
    (course) => course.progressPercent > 0 && course.progressPercent < 100
  ).length;
  const completedCourses = coursesWithMeta.filter((course) => course.progressPercent >= 100).length;
  const averageProgress = totalCourses
    ? Math.round(
      coursesWithMeta.reduce((total, course) => total + course.progressPercent, 0) / totalCourses
    )
    : 0;
  const featuredCourse =
    coursesWithMeta.find((course) => course.progressPercent < 100) || coursesWithMeta[0];

  const visibleCourses = coursesWithMeta.filter((course) => {
    const title = course.course_name?.toLowerCase() || "";
    const instructor = course.instructor?.toLowerCase() || "";
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || title.includes(query) || instructor.includes(query);

    return matchesSearch && matchesFilter(course, activeFilter);
  });

  const heroMessage = featuredCourse
    ? featuredCourse.progressPercent >= 100
      ? "You have wrapped up your enrolled courses. Revisit a favorite lesson or discover something new."
      : featuredCourse.progressPercent >= 98
        ? `You are almost done with ${formatCourseTitle(featuredCourse.course_name)}. Your quiz is ready whenever you are.`
        : featuredCourse.progressPercent > 0
          ? `You are ${featuredCourse.progressPercent}% through ${formatCourseTitle(featuredCourse.course_name)}. Pick up right where you left off.`
          : `Your next course is ${formatCourseTitle(featuredCourse.course_name)}. Start learning whenever you are ready.`
    : "Track your enrolled courses, return to lessons quickly, and keep your momentum going.";

  if (loading) {
    return (
      <div className="learn-page">
        <Navbar page="learnings" />
        <div className="lms-loading">
          <div className="lms-spinner"></div>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="learn-page">
        <Navbar page="learnings" />
        <div className="learn-empty-shell">
          <div className="learn-empty-card">
            <div className="learn-empty-icon">
              <GraduationCap size={28} />
            </div>
            <h1 className="learn-empty-title">Your learning space is ready</h1>
            <p className="learn-empty-desc">
              Enroll in a course to unlock progress tracking, quick resume actions, quizzes,
              and certificates in one place.
            </p>
            <button
              onClick={() => navigate("/courses")}
              className="lms-btn lms-btn-primary learn-empty-button"
            >
              Explore Courses
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="learn-page">
      <Navbar page="learnings" />

      <main className="learn-container">
        <section className="learn-hero">
          <div className="learn-hero-copy">
            <div className="learn-hero-pill">
              <Sparkles size={14} />
              <span>Learning hub</span>
            </div>

            <h1>My Learning</h1>
            <p className="learn-hero-subtitle">
              Welcome back, {firstName}. {heroMessage}
            </p>

            <div className="learn-hero-actions">
              {featuredCourse ? (
                <Link to={`/course/${featuredCourse.course_id}`} className="learn-cta-btn learn-cta-btn-primary">
                  Continue Learning
                  <ArrowRight size={16} />
                </Link>
              ) : null}

              <Link to="/courses" className="learn-cta-btn learn-cta-btn-secondary">
                <Compass size={16} />
                Explore More Courses
              </Link>
            </div>
          </div>

          {featuredCourse ? (
            <div className="learn-hero-panel">
              <div className="learn-featured-label">Next up</div>
              <div className="learn-featured-media">
                <img
                  src={featuredCourse.p_link || fallbackCourseImage}
                  alt={featuredCourse.course_name}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = fallbackCourseImage;
                  }}
                />
              </div>
              <div className="learn-featured-body">
                <span className={`learn-status-badge tone-${featuredCourse.status.tone}`}>
                  {featuredCourse.status.label}
                </span>
                <h2>{formatCourseTitle(featuredCourse.course_name)}</h2>
                <p>by {featuredCourse.instructor || "EduVerse instructor"}</p>

                <div className="learn-featured-progress">
                  <div className="learn-featured-progress-top">
                    <span>{featuredCourse.status.helper}</span>
                    <strong>{featuredCourse.progressPercent}%</strong>
                  </div>
                  <div className="learn-progress-track" aria-hidden="true">
                    <div
                      className="learn-progress-fill"
                      style={{ width: `${featuredCourse.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="learn-stats-grid">
          <article className="learn-stat-card">
            <div className="learn-stat-icon tone-primary">
              <BookOpen size={18} />
            </div>
            <div>
              <span className="learn-stat-label">Enrolled courses</span>
              <strong>{totalCourses}</strong>
            </div>
          </article>

          <article className="learn-stat-card">
            <div className="learn-stat-icon tone-cyan">
              <TrendingUp size={18} />
            </div>
            <div>
              <span className="learn-stat-label">Average progress</span>
              <strong>{averageProgress}%</strong>
            </div>
          </article>

          <article className="learn-stat-card">
            <div className="learn-stat-icon tone-success">
              <Award size={18} />
            </div>
            <div>
              <span className="learn-stat-label">Completed</span>
              <strong>{completedCourses}</strong>
            </div>
          </article>

          <article className="learn-stat-card">
            <div className="learn-stat-icon tone-accent">
              <Target size={18} />
            </div>
            <div>
              <span className="learn-stat-label">Active now</span>
              <strong>{activeCourses}</strong>
            </div>
          </article>
        </section>

        <section className="learn-controls">
          <div className="learn-search-box">
            <Search size={16} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search your courses or instructors"
              aria-label="Search enrolled courses"
            />
          </div>

          <div className="lms-filter-tabs learn-filter-tabs">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`lms-filter-tab ${activeFilter === filter.key ? "active" : ""}`}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {progressLoading ? (
          <div className="learn-sync-banner">
            <div className="lms-spinner"></div>
            <span>Syncing your latest course progress...</span>
          </div>
        ) : null}

        {visibleCourses.length === 0 ? (
          <section className="learn-empty-results">
            <h2>No courses match your current view</h2>
            <p>Try a different search or switch filters to see the rest of your enrollments.</p>
          </section>
        ) : (
          <section className="learn-course-grid">
            {visibleCourses.map((course) => (
              <article key={course.course_id} className="learn-course-card">
                <div className="learn-course-media">
                  <img
                    src={course.p_link || fallbackCourseImage}
                    alt={course.course_name}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = fallbackCourseImage;
                    }}
                  />
                </div>

                <div className="learn-course-body">
                  <div className="learn-course-top">
                    <span className={`learn-status-badge tone-${course.status.tone}`}>
                      {course.status.label}
                    </span>
                    <span className="learn-course-progress-number">{course.progressPercent}%</span>
                  </div>

                  <div className="learn-course-copy">
                    <h3>{formatCourseTitle(course.course_name)}</h3>
                    <p className="learn-course-instructor">by {course.instructor || "EduVerse instructor"}</p>
                    <p className="learn-course-description">{formatDescription(course.description)}</p>
                  </div>

                  <div className="learn-course-progress">
                    <div className="learn-course-progress-top">
                      <span>{course.status.helper}</span>
                      <span>
                        {course.duration > 0
                          ? `${Math.round(course.playedTime / 60)} min watched`
                          : "Progress will appear after you start the lesson"}
                      </span>
                    </div>
                    <div className="learn-progress-track" aria-hidden="true">
                      <div
                        className="learn-progress-fill"
                        style={{ width: `${course.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="learn-course-actions">
                    <Link to={`/course/${course.course_id}`} className="learn-card-link learn-card-link-primary">
                      {course.progressPercent >= 100 ? "Review Course" : "Continue Learning"}
                      <ArrowRight size={15} />
                    </Link>

                    {course.progressPercent === 100 ? (
                      <Link
                        to={`/certificate/${course.course_id}`}
                        className="learn-card-link learn-card-link-secondary"
                      >
                        View Certificate
                      </Link>
                    ) : course.progressPercent >= 98 ? (
                      <Link
                        to={`/assessment/${course.course_id}`}
                        className="learn-card-link learn-card-link-secondary"
                      >
                        Take Quiz
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default Learnings;
