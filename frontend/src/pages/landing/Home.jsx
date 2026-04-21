import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/common/Footer";
import Navbar from "../../components/common/Navbar";
import {
  Award,
  Bell,
  BookOpen,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Inbox,
  MessageSquare,
  Search,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";
import { announcementService } from "../../api/announcement.service";
import { aiService } from "../../api/ai.service";
import { courseService } from "../../api/course.service";
import { learningService } from "../../api/learning.service";
import { messageService } from "../../api/message.service";
import { progressService } from "../../api/progress.service";
import { roomService } from "../../api/room.service";
import c1 from "../../assets/images/c1.jpg";
import c4 from "../../assets/images/python.jpg";
import bannerImg from "../../assets/images/home-banner.png";
import LanguageModal from "../../components/common/LanguageModal";
import { useLanguageContext } from "../../contexts/LanguageContext";
import { profileService } from "../../api/profile.service";

const toCourseSearchPath = (query) => `/courses?search=${encodeURIComponent(query)}`;

const LIVE_REFRESH_INTERVAL_MS = 30000;
const GUEST_REFRESH_INTERVAL_MS = 60000;
const SLIDE_ROTATION_INTERVAL_MS = 7000;

const DEFAULT_DASHBOARD_STATS = {
  enrolledCourses: 0,
  completed: 0,
  hoursLearned: 0,
  certificates: 0,
};

const DEFAULT_PROGRESS_SUMMARY = {
  playedTime: 0,
  duration: 0,
  progressPercent: 0,
};

const CATEGORY_CHIPS = [
  { key: "development", label: "Development" },
  { key: "business", label: "Business" },
  { key: "finance", label: "Finance" },
  { key: "it", label: "IT & Software" },
  { key: "design", label: "Design" },
  { key: "marketing", label: "Marketing" },
  { key: "personal", label: "Personal growth" },
  { key: "health", label: "Health" },
  { key: "music", label: "Music" },
];

const SLIDES = [
  {
    id: "slide-1",
    title: "Learn AI with Google's experts",
    description:
      "Get the skills employers need now and earn a Google AI Professional Certificate - all with one plan.",
    cta: "Explore plan",
    path: toCourseSearchPath("learn ai with google"),
    image: bannerImg,
    alt: "AI learning banner",
  },
  {
    id: "slide-2",
    title: "Unlock a world of knowledge",
    description: "Real-world experts ready to share their experience to help you grow.",
    cta: "Explore courses",
    path: "/courses",
    image: c1,
    alt: "Coding and development class",
  },
  {
    id: "slide-3",
    title: "Level up your cloud and DevOps skills",
    description:
      "Structured paths, guided labs, and career-focused projects to keep your growth on track.",
    cta: "Start roadmap",
    path: "/roadmaps",
    image: c4,
    alt: "Cloud and DevOps course image",
  },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const getCourseProgressPercent = (course, progressSummary) => {
  const summaryPercent = Number(progressSummary?.progressPercent);

  if (Number.isFinite(summaryPercent)) {
    return Math.max(0, Math.min(Math.round(summaryPercent), 100));
  }

  const rawProgress = Number(course?.progress ?? course?.completion ?? course?.percent ?? 0);

  if (!Number.isFinite(rawProgress)) {
    return 0;
  }

  if (rawProgress > 1) {
    return Math.max(0, Math.min(Math.round(rawProgress), 100));
  }

  return Math.max(0, Math.min(Math.round(rawProgress * 100), 100));
};

const getLearningStatus = (progressPercent) => {
  if (progressPercent >= 100) {
    return { badge: "Completed", helper: "Review lessons and certificate", cta: "Review course", tone: "success" };
  }
  if (progressPercent >= 85) {
    return { badge: "Almost there", helper: `${progressPercent}% complete`, cta: "Finish course", tone: "accent" };
  }
  if (progressPercent > 0) {
    return { badge: "In progress", helper: `${progressPercent}% complete`, cta: "Continue learning", tone: "primary" };
  }
  return { badge: "Ready to start", helper: "Start your first lesson", cta: "Start course", tone: "muted" };
};

const getCourseSortPriority = (progressPercent) => {
  if (progressPercent > 0 && progressPercent < 100) return 0;
  if (progressPercent === 0) return 1;
  return 2;
};

const toDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (Array.isArray(value)) {
    const [year, month, day, hours = 0, minutes = 0, seconds = 0] = value;
    const date = new Date(year, month - 1, day, hours, minutes, seconds);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatRelativeTime = (value) => {
  const date = toDateValue(value);
  if (!date) return "recently";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatShortDate = (value) => {
  const date = toDateValue(value);
  if (!date) return "No date";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const truncateText = (value, maxLength = 120) => {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
};

const statusToneClass = (tone) => {
  switch (tone) {
    case "success":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "accent":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "primary":
      return "bg-indigo-50 text-indigo-700 border border-indigo-200";
    default:
      return "bg-slate-100 text-slate-600 border border-slate-200";
  }
};

function Home() {
  const navigate = useNavigate();
  const { t } = useLanguageContext();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [allCourses, setAllCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [courseProgressById, setCourseProgressById] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [messages, setMessages] = useState([]);
  const [roomHistory, setRoomHistory] = useState([]);
  const [aiUsage, setAiUsage] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(DEFAULT_DASHBOARD_STATS);
  const [isEnrollmentsLoading, setIsEnrollmentsLoading] = useState(false);
  const [isHomeLoading, setIsHomeLoading] = useState(true);
  const [isLiveRefreshing, setIsLiveRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [userProfession, setUserProfession] = useState("");

  const chipScrollRef = useRef(null);

  const isAuthenticated = Boolean(localStorage.getItem("token"));
  const userId = localStorage.getItem("id") || localStorage.getItem("userId");
  const storedName = localStorage.getItem("name") || "Learner";
  const firstName = storedName.split(" ")[0] || "Learner";
  const activeHero = SLIDES[activeSlide];
  const greeting = useMemo(() => getGreeting(), []);

  const learningCoursesWithProgress = useMemo(
    () =>
      [...enrolledCourses]
        .map((course) => {
          const progressSummary = courseProgressById[course.course_id] || DEFAULT_PROGRESS_SUMMARY;
          const progressPercent = getCourseProgressPercent(course, progressSummary);
          return {
            ...course,
            progressPercent,
            playedTime: Number(progressSummary.playedTime) || 0,
            duration: Number(progressSummary.duration) || 0,
            status: getLearningStatus(progressPercent),
          };
        })
        .sort((a, b) => {
          const diff = getCourseSortPriority(a.progressPercent) - getCourseSortPriority(b.progressPercent);
          return diff !== 0 ? diff : b.progressPercent - a.progressPercent;
        }),
    [courseProgressById, enrolledCourses]
  );

  const learningPreviewCourses = useMemo(() => learningCoursesWithProgress.slice(0, 3), [learningCoursesWithProgress]);
  const featuredCatalogCourses = useMemo(() => allCourses.slice(0, 4), [allCourses]);

  const announcementPreview = useMemo(
    () =>
      [...announcements]
        .sort((a, b) => (toDateValue(b.date)?.getTime() ?? 0) - (toDateValue(a.date)?.getTime() ?? 0))
        .slice(0, 3),
    [announcements]
  );

  const recentRoomSessions = useMemo(
    () =>
      [...roomHistory]
        .sort(
          (a, b) =>
            (toDateValue(b.startedAt || b.endedAt)?.getTime() ?? 0) -
            (toDateValue(a.startedAt || a.endedAt)?.getTime() ?? 0)
        )
        .slice(0, 3),
    [roomHistory]
  );

  const unreadMessagesCount = useMemo(
    () => messages.filter((message) => message.status !== "READ").length,
    [messages]
  );

  const statCards = useMemo(() => {
    if (!isAuthenticated) {
      return [
        { label: "Courses available", value: allCourses.length, icon: BookOpen, iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
        { label: "Published updates", value: announcements.length, icon: Bell, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
        { label: "Top categories", value: CATEGORY_CHIPS.length, icon: Sparkles, iconBg: "bg-violet-100", iconColor: "text-violet-600" },
        { label: "AI tutor", value: "24/7", icon: BrainCircuit, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
      ];
    }
    return [
      { label: "Enrolled", value: dashboardStats.enrolledCourses, icon: BookOpen, iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
      { label: "Completed", value: dashboardStats.completed, icon: Award, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
      { label: "Hours learned", value: dashboardStats.hoursLearned, icon: Clock3, iconBg: "bg-violet-100", iconColor: "text-violet-600" },
      { label: "Certificates", value: dashboardStats.certificates, icon: Award, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
    ];
  }, [allCourses.length, announcements.length, dashboardStats, isAuthenticated]);

  const livePulseItems = useMemo(() => {
    if (!isAuthenticated) {
      return [
        { label: "Announcements", value: announcementPreview.length, helper: announcementPreview[0] ? formatShortDate(announcementPreview[0].date) : "Waiting for updates", icon: Bell },
        { label: "Catalog picks", value: featuredCatalogCourses.length, helper: "Fresh spotlights", icon: BookOpen },
        { label: "Learning tools", value: "AI", helper: "Tutor + rooms + tracking", icon: BrainCircuit },
        { label: "Last sync", value: lastSyncedAt ? formatRelativeTime(lastSyncedAt) : "pending", helper: "Auto refresh is on", icon: Sparkles },
      ];
    }
    return [
      { label: "Unread", value: unreadMessagesCount, helper: unreadMessagesCount > 0 ? "Needs your attention" : "Inbox is clear", icon: MessageSquare },
      { label: "Announcements", value: announcementPreview.length, helper: announcementPreview[0] ? formatShortDate(announcementPreview[0].date) : "No new posts", icon: Bell },
      { label: "AI requests", value: aiUsage?.requestCount ?? 0, helper: aiUsage != null ? `${(aiUsage.inputTokens ?? 0) + (aiUsage.outputTokens ?? 0)} tokens` : "Tutor ready", icon: BrainCircuit },
      { label: "Rooms", value: roomHistory.length, helper: recentRoomSessions[0] ? formatRelativeTime(recentRoomSessions[0].startedAt || recentRoomSessions[0].endedAt) : "Start a new room", icon: Users },
    ];
  }, [aiUsage, announcementPreview, featuredCatalogCourses.length, isAuthenticated, lastSyncedAt, recentRoomSessions, roomHistory.length, unreadMessagesCount]);

  const moveSlide = (direction) => {
    setActiveSlide((prev) => (prev + direction + SLIDES.length) % SLIDES.length);
  };

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_ROTATION_INTERVAL_MS);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadLandingData = async ({ background = false } = {}) => {
      if (!background) {
        setIsHomeLoading(true);
        setIsEnrollmentsLoading(Boolean(isAuthenticated && userId));
      } else {
        setIsLiveRefreshing(true);
      }

      const [coursesRes, announcementsRes, enrollmentsRes, statsRes, userRes, inboxRes, roomsRes, usageRes] = await Promise.all([
        courseService.getAllCourses(),
        announcementService.getPublishedAnnouncements(),
        isAuthenticated && userId ? learningService.getEnrollments(userId) : Promise.resolve({ success: false, data: [] }),
        isAuthenticated && userId ? profileService.getUserDashboardStats(userId) : Promise.resolve({ success: false, data: DEFAULT_DASHBOARD_STATS }),
        isAuthenticated && userId ? profileService.getUserDetails(userId) : Promise.resolve({ success: false, data: null }),
        isAuthenticated && userId ? messageService.getStudentMessages(userId) : Promise.resolve({ success: false, data: [] }),
        isAuthenticated
          ? roomService.getHistory().then((data) => ({ success: true, data })).catch(() => ({ success: false, data: [] }))
          : Promise.resolve({ success: false, data: [] }),
        isAuthenticated
          ? aiService.getDailyUsage().then((response) => ({ success: true, data: response.data })).catch(() => ({ success: false, data: null }))
          : Promise.resolve({ success: false, data: null }),
      ]);

      if (!isActive) return;

      if (coursesRes.success && Array.isArray(coursesRes.data)) setAllCourses(coursesRes.data);
      else if (!background) setAllCourses([]);

      if (announcementsRes.success && Array.isArray(announcementsRes.data)) setAnnouncements(announcementsRes.data);
      else if (!background) setAnnouncements([]);

      if (!isAuthenticated || !userId) {
        setEnrolledCourses([]);
        setCourseProgressById({});
        setDashboardStats(DEFAULT_DASHBOARD_STATS);
        setMessages([]);
        setRoomHistory([]);
        setAiUsage(null);
        setUserProfession("");
        setLastSyncedAt(new Date());
        setIsHomeLoading(false);
        setIsEnrollmentsLoading(false);
        setIsLiveRefreshing(false);
        return;
      }

      if (statsRes.success && statsRes.data) setDashboardStats({ ...DEFAULT_DASHBOARD_STATS, ...statsRes.data });
      else if (!background) setDashboardStats(DEFAULT_DASHBOARD_STATS);

      if (userRes.success && userRes.data) setUserProfession(userRes.data.occupation || userRes.data.profession || "");
      else if (!background) setUserProfession("");

      if (inboxRes.success && Array.isArray(inboxRes.data)) setMessages(inboxRes.data);
      else if (!background) setMessages([]);

      if (roomsRes.success && Array.isArray(roomsRes.data)) setRoomHistory(roomsRes.data);
      else if (!background) setRoomHistory([]);

      if (usageRes.success) setAiUsage(usageRes.data);
      else if (!background) setAiUsage(null);

      if (enrollmentsRes.success && Array.isArray(enrollmentsRes.data)) {
        setEnrolledCourses(enrollmentsRes.data);
        const progressEntries = await Promise.all(
          enrollmentsRes.data.map(async (course) => {
            const response = await progressService.getProgressSummary(userId, course.course_id);
            return [course.course_id, response.success ? response.data : DEFAULT_PROGRESS_SUMMARY];
          })
        );
        if (!isActive) return;
        setCourseProgressById(Object.fromEntries(progressEntries));
      } else if (!background) {
        setEnrolledCourses([]);
        setCourseProgressById({});
      }

      setLastSyncedAt(new Date());
      setIsHomeLoading(false);
      setIsEnrollmentsLoading(false);
      setIsLiveRefreshing(false);
    };

    loadLandingData();

    const refreshInterval = window.setInterval(
      () => loadLandingData({ background: true }),
      isAuthenticated && userId ? LIVE_REFRESH_INTERVAL_MS : GUEST_REFRESH_INTERVAL_MS
    );

    return () => {
      isActive = false;
      window.clearInterval(refreshInterval);
    };
  }, [isAuthenticated, userId]);

  const scrollChips = (direction) => {
    if (!chipScrollRef.current) return;
    chipScrollRef.current.scrollBy({ left: direction * 240, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar page="home" />

      <main className="flex-1">
        <div className="max-w-container-xl mx-auto px-6 py-8">
          {/* Category chip row */}
          <div className="relative mb-8">
            <div
              ref={chipScrollRef}
              className="flex gap-2 overflow-x-auto scroll-smooth pb-1"
              style={{ scrollbarWidth: "none" }}
            >
              {CATEGORY_CHIPS.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => navigate(toCourseSearchPath(category.label))}
                  className="shrink-0 bg-white rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:text-primary hover:border-primary/40 hover:bg-slate-50 transition-colors"
                >
                  {category.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Scroll categories right"
              onClick={() => scrollChips(1)}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full w-8 h-8 items-center justify-center shadow-sm text-slate-500 hover:text-primary"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Greeting */}
          <section className="mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                {greeting}, {firstName}
              </h1>
              <button
                type="button"
                onClick={() => navigate("/profile/personalize/field")}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:bg-primary/5 rounded-full px-3 py-1.5 transition-colors"
              >
                <Settings2 size={14} />
                Edit occupation & interests
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {userProfession
                ? `${userProfession} · Keep your learning momentum going today.`
                : "Here's what's happening across your learning space."}
            </p>
          </section>

          {/* Hero carousel */}
          <section className="relative mb-8">
            <article className="lms-card overflow-hidden p-0">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-8 md:p-10 flex flex-col justify-center gap-4">
                  <span className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-primary bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1">
                    <Sparkles size={12} /> Featured
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                    {activeHero.title}
                  </h2>
                  <p className="text-sm md:text-base text-slate-500 max-w-md">
                    {activeHero.description}
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      className="lms-btn lms-btn-primary"
                      onClick={() => navigate(activeHero.path)}
                    >
                      {activeHero.cta}
                    </button>
                    <div className="flex items-center gap-1.5">
                      {SLIDES.map((slide, index) => (
                        <button
                          key={slide.id}
                          type="button"
                          aria-label={`Go to slide ${index + 1}`}
                          onClick={() => setActiveSlide(index)}
                          className={`h-1.5 rounded-full transition-all ${
                            index === activeSlide ? "w-6 bg-primary" : "w-1.5 bg-slate-300 hover:bg-slate-400"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="relative bg-slate-100 min-h-[220px] md:min-h-[260px]">
                  <img
                    src={activeHero.image}
                    alt={activeHero.alt}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            </article>

            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => moveSlide(-1)}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full w-10 h-10 items-center justify-center shadow-sm text-slate-600 hover:text-primary hover:border-primary/40"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => moveSlide(1)}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full w-10 h-10 items-center justify-center shadow-sm text-slate-600 hover:text-primary hover:border-primary/40"
            >
              <ChevronRight size={18} />
            </button>
          </section>

          {/* Stat cards */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm"
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${stat.iconBg}`}>
                    <Icon size={20} className={stat.iconColor} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-3xl font-bold text-slate-900 leading-none">{stat.value}</p>
                    <p className="mt-1 text-sm text-slate-500 truncate">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Continue learning + Live pulse */}
          <section className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2 lms-card">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-primary/80">
                    {t("home.myLearningTitle")}
                  </p>
                  <h3 className="text-xl font-semibold text-slate-900 mt-1">
                    Pick up where you left off
                  </h3>
                </div>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline shrink-0"
                  onClick={() => navigate(isAuthenticated ? "/learnings" : "/login")}
                >
                  {isAuthenticated ? "Open my learning" : "Sign in"}
                </button>
              </div>

              {isAuthenticated ? (
                isHomeLoading || isEnrollmentsLoading ? (
                  <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                    Loading your learning dashboard...
                  </div>
                ) : learningPreviewCourses.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {learningPreviewCourses.map((course) => (
                      <article
                        key={course.course_id}
                        className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-video bg-slate-100 overflow-hidden">
                          <img
                            src={course.p_link || c1}
                            alt={course.course_name || "Course"}
                            className="w-full h-full object-cover"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = c1;
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-3 p-4 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${statusToneClass(course.status.tone)}`}>
                              {course.status.badge}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">{course.progressPercent}%</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">
                              {course.course_name || "Untitled course"}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">{course.status.helper}</p>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${course.progressPercent}%` }}
                            />
                          </div>
                          <button
                            type="button"
                            className="lms-btn lms-btn-secondary lms-btn-sm mt-auto"
                            onClick={() => navigate(`/course/${course.course_id}`)}
                          >
                            {course.status.cta}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-10">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Inbox size={22} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">You haven't enrolled yet</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      Start with a featured course below - your progress will appear here.
                    </p>
                    <button
                      type="button"
                      className="lms-btn lms-btn-primary lms-btn-sm"
                      onClick={() => navigate("/courses")}
                    >
                      Explore courses
                    </button>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Inbox size={22} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Sign in to personalize</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Synced progress, AI suggestions, rooms, and notifications in one place.
                  </p>
                  <button
                    type="button"
                    className="lms-btn lms-btn-primary lms-btn-sm"
                    onClick={() => navigate("/login")}
                  >
                    Login to personalize
                  </button>
                </div>
              )}
            </div>

            {/* Live Learner Pulse - dark panel */}
            <aside className="rounded-xl bg-slate-900 text-slate-100 p-6 border border-slate-800 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-indigo-300/80">
                    Live learner pulse
                  </p>
                  <h3 className="text-lg font-semibold mt-1">Auto-synced from your LMS</h3>
                </div>
                <span
                  className={`text-xs rounded-full px-2 py-0.5 border ${
                    isLiveRefreshing
                      ? "bg-amber-500/10 text-amber-300 border-amber-400/30"
                      : "bg-emerald-500/10 text-emerald-300 border-emerald-400/30"
                  }`}
                >
                  {isLiveRefreshing ? "Syncing" : "Live"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                {lastSyncedAt ? `Last synced ${formatRelativeTime(lastSyncedAt)}` : "Waiting for first sync..."}
              </p>

              <div className="grid grid-cols-2 gap-3 flex-1">
                {livePulseItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="rounded-lg bg-slate-800/60 border border-slate-700 p-3 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between text-slate-300">
                        <Icon size={14} />
                        <span className="font-mono text-lg font-semibold text-white">{item.value}</span>
                      </div>
                      <span className="text-xs font-medium text-slate-200">{item.label}</span>
                      <span className="text-[11px] text-slate-400 truncate">{item.helper}</span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => navigate(isAuthenticated ? "/notifications" : "/login")}
                className="mt-4 text-sm font-medium text-indigo-300 hover:text-indigo-200 text-left"
              >
                {isAuthenticated ? "Open notifications >" : "Sign in for live updates >"}
              </button>
            </aside>
          </section>

          {/* Featured catalog */}
          <section className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary/80">Featured catalog</p>
                <h3 className="text-xl font-semibold text-slate-900 mt-1">
                  High-signal courses in your platform
                </h3>
              </div>
              <button
                type="button"
                className="text-sm text-primary hover:underline shrink-0"
                onClick={() => navigate("/courses")}
              >
                View all courses
              </button>
            </div>

            {featuredCatalogCourses.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredCatalogCourses.map((course) => (
                  <article
                    key={course.course_id}
                    className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-video bg-slate-100 overflow-hidden">
                      <img
                        src={course.p_link || c1}
                        alt={course.course_name || "Course"}
                        className="w-full h-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = c1;
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-2 p-4 flex-1">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="truncate">{course.instructor || "EduVerse instructor"}</span>
                        <strong className="text-slate-900 font-mono">
                          {course.price ? `Rs ${course.price}` : "Free"}
                        </strong>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">
                        {course.course_name || "Untitled course"}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {truncateText(course.description, 110) || "Practical learning content from the EduVerse catalog."}
                      </p>
                      <button
                        type="button"
                        className="lms-btn lms-btn-secondary lms-btn-sm mt-auto"
                        onClick={() => navigate(`/course/${course.course_id}`)}
                      >
                        Explore course
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-12 px-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Search size={22} className="text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">We're curating courses for you</p>
                <p className="text-xs text-slate-500 mt-1">
                  Featured picks will appear here once the catalog syncs.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <LanguageModal open={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} />
      <Footer />
    </div>
  );
}

export default Home;
