import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  Compass,
  GraduationCap,
  Search,
  Target,
  TrendingUp,
  Loader2,
  Inbox,
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { learningService } from "../../api/learning.service";
import { progressService } from "../../api/progress.service";
import fallbackCourseImage from "../../assets/images/c1.jpg";

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
      className: "text-emerald-700 bg-emerald-50 border-emerald-200",
      helper: "Certificate unlocked",
    };
  }

  if (progressPercent >= 98) {
    return {
      label: "Quiz ready",
      className: "text-accent bg-accent/10 border-accent/20",
      helper: "Assessment unlocked",
    };
  }

  if (progressPercent > 0) {
    return {
      label: "In progress",
      className: "text-primary bg-primary/10 border-primary/20",
      helper: `${progressPercent}% completed`,
    };
  }

  return {
    label: "Ready to start",
    className: "text-slate-600 bg-slate-100 border-slate-200",
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
      <div className="min-h-screen bg-slate-50">
        <Navbar page="learnings" />
        <div className="max-w-container-xl mx-auto px-6 py-6 lg:py-8">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center py-16">
            <Loader2 size={28} className="text-primary animate-spin mb-2" />
            <p className="text-sm text-slate-500">Loading your courses...</p>
          </div>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar page="learnings" />
        <div className="max-w-container-xl mx-auto px-6 py-6 lg:py-8">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center py-16 max-w-md mx-auto">
            <GraduationCap size={40} className="text-slate-300 mb-3" />
            <h1 className="text-base font-semibold text-slate-900">Your learning space is ready</h1>
            <p className="text-sm text-slate-500 mt-1 mb-5">
              Enroll in a course to unlock progress tracking, quick resume actions, quizzes, and certificates in one place.
            </p>
            <button
              onClick={() => navigate("/courses")}
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold rounded-md px-4 py-2 hover:bg-primary-dark transition-colors"
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
    <div className="min-h-screen bg-slate-50">
      <Navbar page="learnings" />

      <main className="max-w-container-xl mx-auto px-6 py-6 lg:py-8">
        <div className="flex items-center gap-2">
          <GraduationCap size={22} className="text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">My Learning</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back, {firstName}. {heroMessage}
        </p>

        <div className="mt-6 space-y-6">
          {/* Featured / Next-up card */}
          {featuredCourse ? (
            <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr]">
              <div className="bg-slate-100 aspect-[16/9] md:aspect-auto md:h-full">
                <img
                  src={featuredCourse.p_link || fallbackCourseImage}
                  alt={featuredCourse.course_name}
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = fallbackCourseImage;
                  }}
                />
              </div>
              <div className="p-6 flex flex-col justify-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Next up</span>
                <span className={`inline-flex self-start items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border mb-2 ${featuredCourse.status.className}`}>
                  {featuredCourse.status.label}
                </span>
                <h2 className="text-lg font-semibold text-slate-900">{formatCourseTitle(featuredCourse.course_name)}</h2>
                <p className="text-sm text-slate-500 mt-0.5">by {featuredCourse.instructor || "EduVerse instructor"}</p>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                    <span>{featuredCourse.status.helper}</span>
                    <strong className="text-slate-900">{featuredCourse.progressPercent}%</strong>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${featuredCourse.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    to={`/course/${featuredCourse.course_id}`}
                    className="inline-flex items-center gap-2 bg-primary text-white font-semibold rounded-md px-4 py-2 hover:bg-primary-dark transition-colors"
                  >
                    Continue Learning
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-md px-4 py-2 transition-colors"
                  >
                    <Compass size={16} />
                    Explore More
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          {/* Stats */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <BookOpen size={18} />
              </div>
              <div>
                <span className="block text-xs text-slate-500">Enrolled courses</span>
                <strong className="text-lg font-semibold text-slate-900">{totalCourses}</strong>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} />
              </div>
              <div>
                <span className="block text-xs text-slate-500">Average progress</span>
                <strong className="text-lg font-semibold text-slate-900">{averageProgress}%</strong>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Award size={18} />
              </div>
              <div>
                <span className="block text-xs text-slate-500">Completed</span>
                <strong className="text-lg font-semibold text-slate-900">{completedCourses}</strong>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                <Target size={18} />
              </div>
              <div>
                <span className="block text-xs text-slate-500">Active now</span>
                <strong className="text-lg font-semibold text-slate-900">{activeCourses}</strong>
              </div>
            </div>
          </section>

          {/* Controls */}
          <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="relative md:max-w-sm w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search your courses or instructors"
                aria-label="Search enrolled courses"
                className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 bg-white"
              />
            </div>

            <div className="lms-filter-tabs !mb-0">
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
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="text-primary animate-spin" />
              Syncing your latest course progress...
            </div>
          ) : null}

          {visibleCourses.length === 0 ? (
            <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center py-12">
              <Inbox size={40} className="text-slate-300 mb-2" />
              <h2 className="text-base font-semibold text-slate-900">No courses match your current view</h2>
              <p className="text-sm text-slate-500 mt-1">Try a different search or switch filters.</p>
            </section>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleCourses.map((course) => (
                <article
                  key={course.course_id}
                  className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="bg-slate-100 aspect-[16/9]">
                    <img
                      src={course.p_link || fallbackCourseImage}
                      alt={course.course_name}
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackCourseImage;
                      }}
                    />
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${course.status.className}`}>
                        {course.status.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">{course.progressPercent}%</span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 line-clamp-2">{formatCourseTitle(course.course_name)}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">by {course.instructor || "EduVerse instructor"}</p>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{formatDescription(course.description)}</p>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span>{course.status.helper}</span>
                        <span>
                          {course.duration > 0
                            ? `${Math.round(course.playedTime / 60)} min watched`
                            : "Not started"}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${course.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-auto pt-5 flex flex-wrap gap-2">
                      <Link
                        to={`/course/${course.course_id}`}
                        className="inline-flex items-center gap-1.5 bg-primary text-white font-semibold text-sm rounded-md px-3 py-2 hover:bg-primary-dark transition-colors"
                      >
                        {course.progressPercent >= 100 ? "Review" : "Continue"}
                        <ArrowRight size={14} />
                      </Link>

                      {course.progressPercent === 100 ? (
                        <Link
                          to={`/certificate/${course.course_id}`}
                          className="inline-flex items-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm rounded-md px-3 py-2 transition-colors"
                        >
                          View Certificate
                        </Link>
                      ) : course.progressPercent >= 98 ? (
                        <Link
                          to={`/assessment/${course.course_id}`}
                          className="inline-flex items-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm rounded-md px-3 py-2 transition-colors"
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
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Learnings;
