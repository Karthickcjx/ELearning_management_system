import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../../components/common/Footer";
import {
  Bell,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Search,
  ShoppingCart,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { authService } from "../../api/auth.service";
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
import userImage from "../../assets/images/user.png";
import LanguageModal from "../../components/common/LanguageModal";
import { useLanguageContext } from "../../contexts/LanguageContext";
import { profileService } from "../../api/profile.service";
import "./Home.css";

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

const EXPLORE_MENU_SECTIONS = [
  {
    title: "New & Featured",
    items: [
      {
        key: "new-ai-google",
        label: "Learn AI with Google",
        path: toCourseSearchPath("learn ai with google"),
        subItems: ["AI Fundamentals", "AI for Professionals", "AI for Developers", "AI for Creatives"],
      },
    ],
  },
  {
    title: "Explore by Goal",
    items: [
      {
        key: "goal-learn-ai",
        label: "Learn AI",
        path: toCourseSearchPath("learn ai"),
        subItems: ["Prompt Engineering", "Machine Learning", "Generative AI", "AI for Students"],
      },
      {
        key: "goal-career",
        label: "Launch a new career",
        path: toCourseSearchPath("career"),
        subItems: ["Interview Preparation", "Resume Building", "Job Ready Projects", "Career Planning"],
      },
      {
        key: "goal-cert",
        label: "Prepare for a certification",
        path: toCourseSearchPath("certification"),
        subItems: ["Cloud Certifications", "CompTIA Exams", "Data Certifications", "Project Management"],
      },
    ],
  },
  {
    items: [
      {
        key: "cat-development",
        label: "Development",
        path: toCourseSearchPath("development"),
        subItems: ["Web Development", "Programming Languages", "Mobile Development", "Game Development"],
      },
      {
        key: "cat-business",
        label: "Business",
        path: toCourseSearchPath("business"),
        subItems: ["Entrepreneurship", "Business Analytics", "Communication", "Leadership"],
      },
      {
        key: "cat-finance",
        label: "Finance & Accounting",
        path: toCourseSearchPath("finance"),
        subItems: ["Accounting", "Financial Analysis", "Investing", "Excel for Finance"],
      },
      {
        key: "cat-it",
        label: "IT & Software",
        path: toCourseSearchPath("it software"),
        subItems: ["Cyber Security", "Network & Security", "Cloud Computing", "DevOps"],
      },
      {
        key: "cat-design",
        label: "Design",
        path: toCourseSearchPath("design"),
        subItems: ["UI/UX Design", "Graphic Design", "3D & Animation", "Design Tools"],
      },
      {
        key: "cat-marketing",
        label: "Marketing",
        path: toCourseSearchPath("marketing"),
        subItems: ["Digital Marketing", "Social Media Marketing", "SEO", "Content Marketing"],
      },
    ],
  },
];

const EXPLORE_MENU_ITEMS = EXPLORE_MENU_SECTIONS.flatMap((section) => section.items);
const DEFAULT_EXPLORE_ITEM_KEY = EXPLORE_MENU_ITEMS[0]?.key ?? "";

const CATALOG_CATEGORIES = [
  {
    key: "development",
    label: "Development",
    subItems: [
      "Web Development",
      "Mobile Development",
      "Programming Languages",
      "Game Development",
      "Database Design & Development",
      "Software Testing",
    ],
  },
  {
    key: "business",
    label: "Business",
    subItems: ["Entrepreneurship", "Communication", "Management", "Sales", "Operations", "Business Strategy"],
  },
  {
    key: "finance",
    label: "Finance & Accounting",
    subItems: ["Accounting", "Financial Analysis", "Investing", "Cryptocurrency", "Taxes", "Excel for Finance"],
  },
  {
    key: "it",
    label: "IT & Software",
    subItems: ["IT Certifications", "Network & Security", "Operating Systems", "Cloud Computing", "DevOps", "Hardware"],
  },
  {
    key: "office",
    label: "Office Productivity",
    subItems: ["Microsoft Office", "Google Workspace", "SAP", "Productivity", "Typing", "Document Management"],
  },
  {
    key: "personal",
    label: "Personal Development",
    subItems: ["Personal Branding", "Time Management", "Leadership", "Career Growth", "Public Speaking", "Mindfulness"],
  },
  {
    key: "design",
    label: "Design",
    subItems: ["UI/UX Design", "Graphic Design", "Design Tools", "3D & Animation", "Fashion Design", "Architecture"],
  },
  {
    key: "marketing",
    label: "Marketing",
    subItems: ["Digital Marketing", "SEO", "Social Media Marketing", "Branding", "Content Marketing", "Affiliate Marketing"],
  },
  {
    key: "health",
    label: "Health & Fitness",
    subItems: ["Fitness", "Yoga", "Nutrition", "Sports", "Mental Health", "Meditation"],
  },
  {
    key: "music",
    label: "Music",
    subItems: ["Instruments", "Music Production", "Singing", "Music Theory", "Songwriting", "Audio Mixing"],
  },
];

const PROFILE_MENU_GROUPS = [
  ["My learning", "My cart", "Wishlist", "Refer a friend", "Teach on EduVerse"],
  ["Notifications", "Messages"],
  ["Account settings", "Payment methods", "Subscriptions", "EduVerse credits", "Purchase history"],
  ["Language", "Public profile"],
];

const PROFILE_MENU_PATHS = {
  "My learning": "/learnings",
  "My cart": "/courses",
  Wishlist: "/courses",
  "Refer a friend": "/dashboard",
  "Teach on EduVerse": "/dashboard",
  Notifications: "/notifications",
  Messages: "/messages",
  "Account settings": "/settings",
  "Payment methods": "/settings",
  Subscriptions: "/settings",
  "EduVerse credits": "/dashboard",
  "Purchase history": "/settings",
  Language: "/account-settings/profile",
  "Public profile": "/profile",
};

const PROFILE_MENU_TRANSLATION_KEYS = {
  "My learning": "profile.myLearning",
  "My cart": "profile.myCart",
  Wishlist: "profile.wishlist",
  "Refer a friend": "profile.referFriend",
  "Teach on EduVerse": "profile.teach",
  Notifications: "profile.notifications",
  Messages: "profile.messages",
  "Account settings": "profile.accountSettings",
  "Payment methods": "profile.paymentMethods",
  Subscriptions: "profile.subscriptions",
  "EduVerse credits": "profile.credits",
  "Purchase history": "profile.purchaseHistory",
  Language: "profile.language",
  "Public profile": "profile.publicProfile",
};

const SLIDES = [
  {
    id: "slide-1",
    title: "Learn AI with Google's experts",
    description:
      "Get the skills employers need now and earn a Google AI Professional Certificate to show what you know - all with one plan.",
    cta: "Explore plan",
    path: toCourseSearchPath("learn ai with google"),
    image: bannerImg,
    alt: "AI learning banner",
  },
  {
    id: "slide-2",
    title: "Unlock a world of knowledge",
    description: "Our real-world experts can't wait to share their experience to help you grow.",
    cta: "Explore courses",
    path: "/courses",
    image: c1,
    alt: "Coding and development class",
  },
  {
    id: "slide-3",
    title: "Level up your cloud and DevOps skills",
    description:
      "Structured learning paths, guided labs, and career-focused projects to keep your growth on track.",
    cta: "Start roadmap",
    path: "/roadmaps",
    image: c4,
    alt: "Cloud and DevOps course image",
  },
];

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
    return {
      badge: "Completed",
      helper: "Review lessons and certificate",
      cta: "Review course",
      tone: "success",
    };
  }

  if (progressPercent >= 85) {
    return {
      badge: "Almost there",
      helper: `${progressPercent}% complete`,
      cta: "Finish course",
      tone: "accent",
    };
  }

  if (progressPercent > 0) {
    return {
      badge: "In progress",
      helper: `${progressPercent}% complete`,
      cta: "Continue learning",
      tone: "primary",
    };
  }

  return {
    badge: "Ready to start",
    helper: "Start your first lesson",
    cta: "Start course",
    tone: "muted",
  };
};

const getCourseSortPriority = (progressPercent) => {
  if (progressPercent > 0 && progressPercent < 100) {
    return 0;
  }

  if (progressPercent === 0) {
    return 1;
  }

  return 2;
};

const toDateValue = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

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

  if (!date) {
    return "recently";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatShortDate = (value) => {
  const date = toDateValue(value);

  if (!date) {
    return "No date";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const truncateText = (value, maxLength = 120) => {
  if (!value) {
    return "";
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
};

function Home() {
  const navigate = useNavigate();
  const { language, t, getLanguageNativeLabel } = useLanguageContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openTopMenu, setOpenTopMenu] = useState(null);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [activeExploreItemKey, setActiveExploreItemKey] = useState(DEFAULT_EXPLORE_ITEM_KEY);
  const [activeCatalogKey, setActiveCatalogKey] = useState(CATALOG_CATEGORIES[0].key);
  const [isCatalogPanelOpen, setIsCatalogPanelOpen] = useState(false);
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

  const topMenuCloseTimerRef = useRef(null);
  const catalogCloseTimerRef = useRef(null);

  const isAuthenticated = Boolean(localStorage.getItem("token"));
  const userId = localStorage.getItem("id") || localStorage.getItem("userId");
  const storedName = localStorage.getItem("name") || "Learner";
  const storedEmail = localStorage.getItem("email") || "learner@eduverse.com";
  const profileImage = localStorage.getItem("profileImage");
  const firstName = storedName.split(" ")[0] || "Learner";
  const firstLetter = firstName.charAt(0).toUpperCase();
  const activeHero = SLIDES[activeSlide];

  const activeExploreItem = useMemo(
    () => EXPLORE_MENU_ITEMS.find((item) => item.key === activeExploreItemKey) ?? EXPLORE_MENU_ITEMS[0],
    [activeExploreItemKey]
  );

  const activeCatalogCategory = useMemo(
    () => CATALOG_CATEGORIES.find((category) => category.key === activeCatalogKey) ?? CATALOG_CATEGORIES[0],
    [activeCatalogKey]
  );

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
        .sort((courseA, courseB) => {
          const priorityDifference = getCourseSortPriority(courseA.progressPercent) - getCourseSortPriority(courseB.progressPercent);

          if (priorityDifference !== 0) {
            return priorityDifference;
          }

          return courseB.progressPercent - courseA.progressPercent;
        }),
    [courseProgressById, enrolledCourses]
  );

  const learningPreviewCourses = useMemo(() => learningCoursesWithProgress.slice(0, 3), [learningCoursesWithProgress]);

  const featuredCatalogCourses = useMemo(() => allCourses.slice(0, 4), [allCourses]);

  const announcementPreview = useMemo(
    () =>
      [...announcements]
        .sort((announcementA, announcementB) => {
          const firstDate = toDateValue(announcementA.date)?.getTime() ?? 0;
          const secondDate = toDateValue(announcementB.date)?.getTime() ?? 0;
          return secondDate - firstDate;
        })
        .slice(0, 3),
    [announcements]
  );

  const recentRoomSessions = useMemo(
    () =>
      [...roomHistory]
        .sort((roomA, roomB) => {
          const firstDate = toDateValue(roomA.startedAt || roomA.endedAt)?.getTime() ?? 0;
          const secondDate = toDateValue(roomB.startedAt || roomB.endedAt)?.getTime() ?? 0;
          return secondDate - firstDate;
        })
        .slice(0, 3),
    [roomHistory]
  );

  const unreadMessagesCount = useMemo(
    () => messages.filter((message) => message.status !== "READ").length,
    [messages]
  );

  const overviewCards = useMemo(() => {
    if (!isAuthenticated) {
      return [
        {
          label: "Courses available",
          value: allCourses.length,
          helper: "Browse the full catalog",
          icon: BookOpen,
          tone: "primary",
        },
        {
          label: "Published updates",
          value: announcements.length,
          helper: "Announcements from EduVerse",
          icon: CalendarDays,
          tone: "accent",
        },
        {
          label: "Top categories",
          value: CATALOG_CATEGORIES.length,
          helper: "From code to creativity",
          icon: Sparkles,
          tone: "success",
        },
        {
          label: "AI tutor",
          value: "24/7",
          helper: "Instant guidance after sign in",
          icon: BrainCircuit,
          tone: "info",
        },
      ];
    }

    return [
      {
        label: "Enrolled courses",
        value: dashboardStats.enrolledCourses,
        helper: `${learningCoursesWithProgress.length} courses in your space`,
        icon: BookOpen,
        tone: "primary",
      },
      {
        label: "Completed",
        value: dashboardStats.completed,
        helper: "Courses wrapped up successfully",
        icon: Trophy,
        tone: "success",
      },
      {
        label: "Hours learned",
        value: dashboardStats.hoursLearned,
        helper: "Tracked from your watch progress",
        icon: Clock3,
        tone: "accent",
      },
      {
        label: "Certificates",
        value: dashboardStats.certificates,
        helper: "Proof of your momentum",
        icon: LayoutDashboard,
        tone: "info",
      },
    ];
  }, [allCourses.length, announcements.length, dashboardStats, isAuthenticated, learningCoursesWithProgress.length]);

  const heroInsightPills = useMemo(() => {
    if (!isAuthenticated) {
      return [
        { label: "Featured", value: featuredCatalogCourses.length || "4" },
        { label: "Categories", value: CATALOG_CATEGORIES.length },
        { label: "Updates", value: announcementPreview.length },
      ];
    }

    return [
      { label: "Unread", value: unreadMessagesCount },
      { label: "AI today", value: aiUsage?.requestCount ?? 0 },
      { label: "Rooms", value: roomHistory.length },
    ];
  }, [aiUsage?.requestCount, announcementPreview.length, featuredCatalogCourses.length, isAuthenticated, roomHistory.length, unreadMessagesCount]);

  const livePulseItems = useMemo(() => {
    if (!isAuthenticated) {
      return [
        {
          label: "Announcements",
          value: announcementPreview.length,
          helper: announcementPreview[0] ? formatShortDate(announcementPreview[0].date) : "Waiting for updates",
          icon: Bell,
        },
        {
          label: "Catalog picks",
          value: featuredCatalogCourses.length,
          helper: "Fresh course spotlight",
          icon: BookOpen,
        },
        {
          label: "Learning tools",
          value: "AI",
          helper: "Tutor, rooms, and progress tracking",
          icon: BrainCircuit,
        },
        {
          label: "Last sync",
          value: lastSyncedAt ? formatRelativeTime(lastSyncedAt) : "pending",
          helper: "Auto refresh is on",
          icon: Sparkles,
        },
      ];
    }

    return [
      {
        label: "Unread messages",
        value: unreadMessagesCount,
        helper: unreadMessagesCount > 0 ? "Needs your attention" : "Inbox is clear",
        icon: MessageSquare,
      },
      {
        label: "Announcements",
        value: announcementPreview.length,
        helper: announcementPreview[0] ? formatShortDate(announcementPreview[0].date) : "No new posts",
        icon: Bell,
      },
      {
        label: "AI requests today",
        value: aiUsage?.requestCount ?? 0,
        helper:
          aiUsage != null
            ? `${(aiUsage.inputTokens ?? 0) + (aiUsage.outputTokens ?? 0)} tokens used`
            : "AI tutor is ready when you are",
        icon: BrainCircuit,
      },
      {
        label: "Room sessions",
        value: roomHistory.length,
        helper: recentRoomSessions[0] ? formatRelativeTime(recentRoomSessions[0].startedAt || recentRoomSessions[0].endedAt) : "Start a new room",
        icon: Users,
      },
    ];
  }, [
    aiUsage,
    announcementPreview,
    featuredCatalogCourses.length,
    isAuthenticated,
    lastSyncedAt,
    recentRoomSessions,
    roomHistory.length,
    unreadMessagesCount,
  ]);

  const clearTopMenuTimer = () => {
    if (topMenuCloseTimerRef.current) {
      window.clearTimeout(topMenuCloseTimerRef.current);
      topMenuCloseTimerRef.current = null;
    }
  };

  const clearCatalogTimer = () => {
    if (catalogCloseTimerRef.current) {
      window.clearTimeout(catalogCloseTimerRef.current);
      catalogCloseTimerRef.current = null;
    }
  };

  const openMenu = (menuName) => {
    clearTopMenuTimer();
    setOpenTopMenu(menuName);
  };

  const closeMenu = () => {
    clearTopMenuTimer();
    setOpenTopMenu(null);
  };

  const scheduleCloseMenu = () => {
    clearTopMenuTimer();
    topMenuCloseTimerRef.current = window.setTimeout(() => {
      setOpenTopMenu(null);
      topMenuCloseTimerRef.current = null;
    }, 120);
  };

  const openCatalogPanel = (key) => {
    clearCatalogTimer();
    setActiveCatalogKey(key);
    setIsCatalogPanelOpen(true);
  };

  const scheduleCloseCatalogPanel = () => {
    clearCatalogTimer();
    catalogCloseTimerRef.current = window.setTimeout(() => {
      setIsCatalogPanelOpen(false);
      catalogCloseTimerRef.current = null;
    }, 120);
  };

  const navigateWithClose = (path) => {
    closeMenu();
    clearCatalogTimer();
    setIsCatalogPanelOpen(false);
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  const openLanguageModal = () => {
    closeMenu();
    setIsMobileMenuOpen(false);
    setIsLanguageModalOpen(true);
  };

  const translateProfileMenuItem = (item) => {
    const key = PROFILE_MENU_TRANSLATION_KEYS[item];
    return key ? t(key) : item;
  };

  const moveSlide = (direction) => {
    setActiveSlide((prev) => (prev + direction + SLIDES.length) % SLIDES.length);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (!searchTerm.trim()) {
      navigateWithClose("/courses");
      return;
    }
    navigateWithClose(`/courses?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  const handleLogout = async () => {
    await authService.logout();
    closeMenu();
    navigate("/login");
  };

  useEffect(
    () => () => {
      clearTopMenuTimer();
      clearCatalogTimer();
    },
    []
  );

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

      const [
        coursesRes,
        announcementsRes,
        enrollmentsRes,
        statsRes,
        userRes,
        inboxRes,
        roomsRes,
        usageRes,
      ] = await Promise.all([
        courseService.getAllCourses(),
        announcementService.getPublishedAnnouncements(),
        isAuthenticated && userId
          ? learningService.getEnrollments(userId)
          : Promise.resolve({ success: false, data: [] }),
        isAuthenticated && userId
          ? profileService.getUserDashboardStats(userId)
          : Promise.resolve({ success: false, data: DEFAULT_DASHBOARD_STATS }),
        isAuthenticated && userId
          ? profileService.getUserDetails(userId)
          : Promise.resolve({ success: false, data: null }),
        isAuthenticated && userId
          ? messageService.getStudentMessages(userId)
          : Promise.resolve({ success: false, data: [] }),
        isAuthenticated
          ? roomService
            .getHistory()
            .then((data) => ({ success: true, data }))
            .catch(() => ({ success: false, data: [] }))
          : Promise.resolve({ success: false, data: [] }),
        isAuthenticated
          ? aiService
              .getDailyUsage()
              .then((response) => ({ success: true, data: response.data }))
              .catch(() => ({ success: false, data: null }))
          : Promise.resolve({ success: false, data: null }),
      ]);

      if (!isActive) {
        return;
      }

      if (coursesRes.success && Array.isArray(coursesRes.data)) {
        setAllCourses(coursesRes.data);
      } else if (!background) {
        setAllCourses([]);
      }

      if (announcementsRes.success && Array.isArray(announcementsRes.data)) {
        setAnnouncements(announcementsRes.data);
      } else if (!background) {
        setAnnouncements([]);
      }

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

      if (statsRes.success && statsRes.data) {
        setDashboardStats({
          ...DEFAULT_DASHBOARD_STATS,
          ...statsRes.data,
        });
      } else if (!background) {
        setDashboardStats(DEFAULT_DASHBOARD_STATS);
      }

      if (userRes.success && userRes.data) {
        setUserProfession(userRes.data.occupation || userRes.data.profession || "");
      } else if (!background) {
        setUserProfession("");
      }

      if (inboxRes.success && Array.isArray(inboxRes.data)) {
        setMessages(inboxRes.data);
      } else if (!background) {
        setMessages([]);
      }

      if (roomsRes.success && Array.isArray(roomsRes.data)) {
        setRoomHistory(roomsRes.data);
      } else if (!background) {
        setRoomHistory([]);
      }

      if (usageRes.success) {
        setAiUsage(usageRes.data);
      } else if (!background) {
        setAiUsage(null);
      }

      if (enrollmentsRes.success && Array.isArray(enrollmentsRes.data)) {
        setEnrolledCourses(enrollmentsRes.data);

        const progressEntries = await Promise.all(
          enrollmentsRes.data.map(async (course) => {
            const response = await progressService.getProgressSummary(userId, course.course_id);
            return [course.course_id, response.success ? response.data : DEFAULT_PROGRESS_SUMMARY];
          })
        );

        if (!isActive) {
          return;
        }

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
      () => {
        loadLandingData({ background: true });
      },
      isAuthenticated && userId ? LIVE_REFRESH_INTERVAL_MS : GUEST_REFRESH_INTERVAL_MS
    );

    return () => {
      isActive = false;
      window.clearInterval(refreshInterval);
    };
  }, [isAuthenticated, userId]);

  return (
    <div className="market-home">
      <header className="market-header">
        <div className="market-mainbar">
          <div className="market-brand">
            <button
              type="button"
              className="market-mobile-menu"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <button type="button" className="market-logo" onClick={() => navigateWithClose("/")}>
              <span className="market-logo-mark" aria-hidden="true" />
              EduVerse
            </button>

            <div
              className="market-popover-wrap market-explore-wrap"
              onMouseEnter={() => openMenu("explore")}
              onMouseLeave={scheduleCloseMenu}
              onFocusCapture={() => openMenu("explore")}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  scheduleCloseMenu();
                }
              }}
            >
              <button
                type="button"
                className={`market-plain-link ${openTopMenu === "explore" ? "active" : ""}`}
                onClick={() => setOpenTopMenu((prev) => (prev === "explore" ? null : "explore"))}
              >
                {t("nav.explore")}
              </button>

              <div className={`market-popover market-explore-menu ${openTopMenu === "explore" ? "open" : ""}`}>
                <div className="market-explore-columns">
                  <div className="market-explore-primary">
                    {EXPLORE_MENU_SECTIONS.map((section) => (
                      <div
                        key={section.title || section.items[0]?.key}
                        className={`market-explore-section ${section.title ? "" : "no-title"}`}
                      >
                        {section.title ? <p className="market-explore-title">{section.title}</p> : null}
                        {section.items.map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            className={`market-explore-item ${activeExploreItem?.key === item.key ? "active" : ""}`}
                            onMouseEnter={() => setActiveExploreItemKey(item.key)}
                            onFocus={() => setActiveExploreItemKey(item.key)}
                            onClick={() => navigateWithClose(item.path)}
                          >
                            <span>{item.label}</span>
                            <span className="market-chev" aria-hidden="true">
                              &gt;
                            </span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="market-explore-secondary">
                    {activeExploreItem?.subItems?.length ? (
                      activeExploreItem.subItems.map((subItem) => (
                        <button
                          key={subItem}
                          type="button"
                          className="market-explore-subitem"
                          onClick={() => navigateWithClose(toCourseSearchPath(subItem))}
                        >
                          <span>{subItem}</span>
                          <span className="market-chev" aria-hidden="true">
                            &gt;
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="market-empty">Browse all courses</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button type="button" className="market-plain-link" onClick={() => navigateWithClose("/courses")}>
              {t("nav.subscribe")}
            </button>
          </div>

          <form className="market-search" onSubmit={handleSearch}>
            <Search size={18} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t("nav.searchPlaceholder")}
              aria-label="Search courses"
            />
          </form>

          <div className={`market-actions ${isMobileMenuOpen ? "is-open" : ""}`}>
            <div
              className="market-popover-wrap market-business-wrap"
              onMouseEnter={() => openMenu("business")}
              onMouseLeave={scheduleCloseMenu}
              onFocusCapture={() => openMenu("business")}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  scheduleCloseMenu();
                }
              }}
            >
              <button
                type="button"
                className={`market-action-link ${openTopMenu === "business" ? "active" : ""}`}
                onClick={() => setOpenTopMenu((prev) => (prev === "business" ? null : "business"))}
              >
                {t("nav.business")}
              </button>
              <div className={`market-popover market-business-menu ${openTopMenu === "business" ? "open" : ""}`}>
                <button type="button" onClick={() => navigateWithClose("/dashboard")}>
                  Compare Plans
                </button>
                <button type="button" onClick={() => navigateWithClose("/dashboard")}>
                  {t("nav.business")}
                </button>
              </div>
            </div>

            <button type="button" className="market-action-link" onClick={() => navigateWithClose("/dashboard")}>
              {t("nav.teach")}
            </button>

            <div
              className="market-popover-wrap market-learning-wrap"
              onMouseEnter={() => openMenu("learning")}
              onMouseLeave={scheduleCloseMenu}
              onFocusCapture={() => openMenu("learning")}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  scheduleCloseMenu();
                }
              }}
            >
              <button
                type="button"
                className={`market-action-link ${openTopMenu === "learning" ? "active" : ""}`}
                onClick={() => setOpenTopMenu((prev) => (prev === "learning" ? null : "learning"))}
              >
                {t("nav.myLearning")}
              </button>
              <div className={`market-popover market-learning-menu ${openTopMenu === "learning" ? "open" : ""}`}>
                {isEnrollmentsLoading ? (
                  <p className="market-learning-empty">{t("home.loadingCourses")}</p>
                ) : learningPreviewCourses.length > 0 ? (
                  learningPreviewCourses.map((course) => (
                    <button
                      key={course.course_id}
                      type="button"
                      className="market-learning-item"
                      onClick={() => navigateWithClose(`/course/${course.course_id}`)}
                    >
                      <img src={course.p_link || userImage} alt={course.course_name || "Course"} />
                      <div className="market-learning-copy">
                        <p>{course.course_name || "Untitled course"}</p>
                        <span>{t("home.continueLearning")}</span>
                        <div className="market-progress-track" aria-hidden="true">
                          <div className="market-progress-fill" style={{ width: `${course.progressPercent}%` }} />
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="market-learning-empty">{t("home.noEnrolledCourses")}</p>
                )}
                <button type="button" className="market-learning-cta" onClick={() => navigateWithClose("/learnings")}>
                  {t("home.goToMyLearning")}
                </button>
              </div>
            </div>

            <button type="button" className="market-icon-btn" aria-label={t("nav.wishlist")} onClick={() => navigateWithClose("/courses")}>
              <Heart size={18} />
            </button>
            <button type="button" className="market-icon-btn" aria-label={t("nav.cart")} onClick={() => navigateWithClose("/courses")}>
              <ShoppingCart size={18} />
            </button>
            <button type="button" className="market-icon-btn" aria-label={t("nav.notifications")} onClick={() => navigateWithClose("/notifications")}>
              <Bell size={18} />
            </button>

            {isAuthenticated ? (
              <>
                <div
                  className="market-popover-wrap market-profile-wrap"
                  onMouseEnter={() => openMenu("profile")}
                  onMouseLeave={scheduleCloseMenu}
                  onFocusCapture={() => openMenu("profile")}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      scheduleCloseMenu();
                    }
                  }}
                >
                  <button
                    type="button"
                    className={`market-avatar ${openTopMenu === "profile" ? "active" : ""}`}
                    aria-label="Open profile"
                    onClick={() => setOpenTopMenu((prev) => (prev === "profile" ? null : "profile"))}
                  >
                    {profileImage ? <img src={profileImage} alt={storedName} /> : <span>{firstLetter}</span>}
                    <span className="market-avatar-badge" aria-hidden="true" />
                  </button>

                  <div className={`market-popover market-profile-menu ${openTopMenu === "profile" ? "open" : ""}`}>
                    <button type="button" className="market-profile-header" onClick={() => navigateWithClose("/profile")}>
                      <div className="market-profile-avatar">
                        {profileImage ? <img src={profileImage} alt={storedName} /> : <img src={userImage} alt={storedName} />}
                      </div>
                      <div className="market-profile-id">
                        <strong>{storedName}</strong>
                        <span>{storedEmail}</span>
                      </div>
                    </button>

                    {PROFILE_MENU_GROUPS.map((group, index) => (
                      <div key={`profile-group-${index}`} className="market-profile-group">
                        {group.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              if (item === "Language") {
                                openLanguageModal();
                                return;
                              }
                              navigateWithClose(PROFILE_MENU_PATHS[item] || "/courses");
                            }}
                          >
                            <span>{translateProfileMenuItem(item)}</span>
                            {item === "Messages" && unreadMessagesCount > 0 ? <em>{unreadMessagesCount}</em> : null}
                            {item === "Language" ? <small>{getLanguageNativeLabel(language)}</small> : null}
                          </button>
                        ))}
                      </div>
                    ))}

                    <button type="button" className="market-signout-btn" onClick={handleLogout}>
                      {t("profile.signOut")}
                    </button>
                  </div>
                </div>

                <button type="button" className="market-action-link market-mobile-only-signout" onClick={handleLogout}>
                  {t("profile.signOut")}
                </button>
              </>
            ) : (
              <button type="button" className="market-login-btn" onClick={() => navigateWithClose("/login")}>
                {t("nav.loginSignup")}
              </button>
            )}
          </div>
        </div>

        <div
          className="market-catalog-wrap"
          onMouseEnter={clearCatalogTimer}
          onMouseLeave={scheduleCloseCatalogPanel}
          onFocusCapture={clearCatalogTimer}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              scheduleCloseCatalogPanel();
            }
          }}
        >
          <nav className="market-categories" aria-label="Course categories">
            {CATALOG_CATEGORIES.map((category) => (
              <button
                key={category.key}
                type="button"
                className={`market-category-btn ${isCatalogPanelOpen && activeCatalogCategory?.key === category.key ? "active" : ""
                  }`}
                onMouseEnter={() => openCatalogPanel(category.key)}
                onFocus={() => openCatalogPanel(category.key)}
                onClick={() => navigateWithClose(toCourseSearchPath(category.label))}
              >
                {category.label}
              </button>
            ))}
          </nav>

          <div className={`market-subcategory-bar ${isCatalogPanelOpen ? "open" : ""}`}>
            <div className="market-subcategory-inner">
              {activeCatalogCategory?.subItems?.map((subItem) => (
                <button key={subItem} type="button" onClick={() => navigateWithClose(toCourseSearchPath(subItem))}>
                  {subItem}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="market-main">
        <section className="market-welcome">
          <img src={profileImage || userImage} alt={firstName} className="market-welcome-avatar" />
          <div>
            <h1>{t("home.welcomeBack")}, {firstName}</h1>
            <p>
              {userProfession ? `${userProfession} ` : ""}
              <Link to="/profile/personalize/field" className="market-edit-link">
                {t("home.editOccupation")}
              </Link>
            </p>
          </div>
        </section>

        <section className="market-hero">
          <button type="button" className="hero-control left" onClick={() => moveSlide(-1)} aria-label="Previous slide">
            <ChevronLeft size={23} />
          </button>

          <article className="hero-stage">
            <div className="hero-panel">
              <h2>{activeHero.title}</h2>
              <p>{activeHero.description}</p>
              <button type="button" onClick={() => navigateWithClose(activeHero.path)}>
                {activeHero.cta}
              </button>
            </div>
            <div className="hero-image-wrap">
              <img src={activeHero.image} alt={activeHero.alt} />
              <div className="market-hero-insights">
                {heroInsightPills.map((pill) => (
                  <div key={pill.label} className="market-hero-pill">
                    <span>{pill.label}</span>
                    <strong>{pill.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <button type="button" className="hero-control right" onClick={() => moveSlide(1)} aria-label="Next slide">
            <ChevronRight size={23} />
          </button>
        </section>

        <section className="market-overview-grid">
          {overviewCards.map((card) => (
            <article key={card.label} className="market-overview-card">
              <div className={`market-overview-icon tone-${card.tone}`}>
                <card.icon size={18} />
              </div>
              <div className="market-overview-copy">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.helper}</small>
              </div>
            </article>
          ))}
        </section>

        <section className="market-content-grid market-content-grid-primary">
          <div className="market-section-card market-section-card-wide">
            <div className="market-section-head">
              <div>
                <p className="market-section-eyebrow">{t("home.myLearningTitle")}</p>
                <h3 className="market-section-title">Continue where your momentum is strongest</h3>
                <p className="market-section-subtitle">
                  Your latest courses, synced progress, and the next best action are all in one place.
                </p>
              </div>
              <button
                type="button"
                className="market-section-link"
                onClick={() => navigateWithClose(isAuthenticated ? "/learnings" : "/login")}
              >
                {isAuthenticated ? "Open my learning" : "Sign in"}
              </button>
            </div>

            {isAuthenticated ? (
              isHomeLoading ? (
                <div className="market-empty-state">
                  <p>Loading your learning dashboard...</p>
                </div>
              ) : learningPreviewCourses.length > 0 ? (
                <div className="market-learning-grid">
                  {learningPreviewCourses.map((course) => (
                    <article key={course.course_id} className="market-course-card">
                      <div className="market-course-media">
                        <img
                          src={course.p_link || c1}
                          alt={course.course_name || "Course"}
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = c1;
                          }}
                        />
                      </div>
                      <div className="market-course-body">
                        <div className="market-course-topline">
                          <span className={`market-status-badge tone-${course.status.tone}`}>{course.status.badge}</span>
                          <span className="market-course-progress-label">{course.progressPercent}%</span>
                        </div>
                        <div>
                          <h4>{course.course_name || "Untitled course"}</h4>
                          <p className="market-course-helper">{course.status.helper}</p>
                        </div>
                        <div className="market-progress-track" aria-hidden="true">
                          <div className="market-progress-fill" style={{ width: `${course.progressPercent}%` }} />
                        </div>
                        <button
                          type="button"
                          className="market-card-cta"
                          onClick={() => navigateWithClose(`/course/${course.course_id}`)}
                        >
                          {course.status.cta}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="market-empty-state">
                  <p>You have not enrolled in any courses yet. Start with a featured course below and your progress will appear here.</p>
                  <button type="button" className="market-card-cta" onClick={() => navigateWithClose("/courses")}>
                    Explore courses
                  </button>
                </div>
              )
            ) : (
              <div className="market-empty-state">
                <p>Sign in to turn this page into a personalized learning hub with synced progress, AI suggestions, rooms, and notifications.</p>
                <button type="button" className="market-card-cta" onClick={() => navigateWithClose("/login")}>
                  Login to personalize
                </button>
              </div>
            )}
          </div>

          <aside className="market-section-card market-live-card">
            <div className="market-section-head market-section-head-live">
              <div>
                <p className="market-section-eyebrow">Live learner pulse</p>
                <h3 className="market-section-title">Auto-refreshing from your LMS data</h3>
              </div>
              <span className={`market-live-chip ${isLiveRefreshing ? "is-refreshing" : ""}`}>
                {isLiveRefreshing ? "Syncing" : "Live"}
              </span>
            </div>

            <p className="market-live-caption">
              {lastSyncedAt ? `Last synced ${formatRelativeTime(lastSyncedAt)}` : "Waiting for the first sync..."}
            </p>

            <div className="market-live-grid">
              {livePulseItems.map((item) => (
                <article key={item.label} className="market-live-item">
                  <div className="market-live-item-top">
                    <item.icon size={16} />
                    <strong>{item.value}</strong>
                  </div>
                  <span>{item.label}</span>
                  <small>{item.helper}</small>
                </article>
              ))}
            </div>

            <button
              type="button"
              className="market-live-link"
              onClick={() => navigateWithClose(isAuthenticated ? "/notifications" : "/login")}
            >
              {isAuthenticated ? "Open notifications" : "Sign in for live updates"}
            </button>
          </aside>
        </section>

        <section className="market-section-card market-catalog-card">
          <div className="market-section-head">
            <div>
              <p className="market-section-eyebrow">Featured catalog</p>
              <h3 className="market-section-title">Explore high-signal courses already in your platform</h3>
            </div>
            <button type="button" className="market-section-link" onClick={() => navigateWithClose("/courses")}>
              View all courses
            </button>
          </div>

          {featuredCatalogCourses.length > 0 ? (
            <div className="market-catalog-grid">
              {featuredCatalogCourses.map((course) => (
                <article key={course.course_id} className="market-catalog-item">
                  <div className="market-catalog-media">
                    <img
                      src={course.p_link || c1}
                      alt={course.course_name || "Course"}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = c1;
                      }}
                    />
                  </div>
                  <div className="market-catalog-body">
                    <div className="market-catalog-topline">
                      <span>{course.instructor || "EduVerse instructor"}</span>
                      <strong>{course.price ? `Rs ${course.price}` : "Free"}</strong>
                    </div>
                    <h4>{course.course_name || "Untitled course"}</h4>
                    <p>{truncateText(course.description, 120) || "Practical learning content from the EduVerse catalog."}</p>
                    <button type="button" className="market-card-cta" onClick={() => navigateWithClose(`/course/${course.course_id}`)}>
                      Explore course
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="market-empty-state compact">
              <p>Course data is still loading. Refresh in a moment to see featured picks.</p>
            </div>
          )}
        </section>
      </main>

      <LanguageModal open={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} />

      <Footer />
    </div>
  );
}

export default Home;

