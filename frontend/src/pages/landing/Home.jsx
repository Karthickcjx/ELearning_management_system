import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../../Components/common/Footer";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Heart,
  Menu,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { authService } from "../../api/auth.service";
import { learningService } from "../../api/learning.service";
import c1 from "../../assets/images/c1.jpg";
import c4 from "../../assets/images/python.jpg";
import bannerImg from "../../assets/images/home-banner.png";
import userImage from "../../assets/images/user.png";
import LanguageModal from "../../Components/common/LanguageModal";
import { useLanguageContext } from "../../contexts/LanguageContext";
import "./Home.css";

const toCourseSearchPath = (query) => `/courses?search=${encodeURIComponent(query)}`;

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
  "Refer a friend": "/courses",
  "Teach on EduVerse": "/courses",
  Notifications: "/account-settings/notification-preferences",
  Messages: "/rooms",
  "Account settings": "/account-settings/account-security",
  "Payment methods": "/account-settings/payment-methods",
  Subscriptions: "/account-settings/subscriptions",
  "EduVerse credits": "/courses",
  "Purchase history": "/courses",
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
    image: bannerImg,
    alt: "AI learning banner",
  },
  {
    id: "slide-2",
    title: "Unlock a world of knowledge",
    description: "Our real-world experts can't wait to share their experience to help you grow.",
    cta: "Explore courses",
    image: c1,
    alt: "Coding and development class",
  },
  {
    id: "slide-3",
    title: "Level up your cloud and DevOps skills",
    description:
      "Structured learning paths, guided labs, and career-focused projects to keep your growth on track.",
    cta: "Start learning",
    image: c4,
    alt: "Cloud and DevOps course image",
  },
];

const getCourseProgressPercent = (course) => {
  const rawProgress = Number(course?.progress ?? course?.completion ?? course?.percent ?? 0);

  if (!Number.isFinite(rawProgress)) {
    return 12;
  }

  if (rawProgress > 1) {
    return Math.max(0, Math.min(Math.round(rawProgress), 100));
  }

  return Math.max(0, Math.min(Math.round(rawProgress * 100), 100));
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
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [isEnrollmentsLoading, setIsEnrollmentsLoading] = useState(false);

  const topMenuCloseTimerRef = useRef(null);
  const catalogCloseTimerRef = useRef(null);

  const isAuthenticated = Boolean(localStorage.getItem("token"));
  const userId = localStorage.getItem("id");
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

  const learningPreviewCourses = useMemo(() => enrolledCourses.slice(0, 3), [enrolledCourses]);

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
    let isActive = true;

    if (!isAuthenticated || !userId) {
      setEnrolledCourses([]);
      setIsEnrollmentsLoading(false);
      return () => {
        isActive = false;
      };
    }

    const fetchEnrolledCourses = async () => {
      setIsEnrollmentsLoading(true);
      const response = await learningService.getEnrollments(userId);

      if (!isActive) {
        return;
      }

      if (response.success && Array.isArray(response.data)) {
        setEnrolledCourses(response.data);
      } else {
        setEnrolledCourses([]);
      }

      setIsEnrollmentsLoading(false);
    };

    fetchEnrolledCourses();

    return () => {
      isActive = false;
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
                              >
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
                            >
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
                <button type="button" onClick={() => navigateWithClose("/courses")}>
                  Compare Plans
                </button>
                <button type="button" onClick={() => navigateWithClose("/courses")}>
                  {t("nav.business")}
                </button>
              </div>
            </div>

            <button type="button" className="market-action-link" onClick={() => navigateWithClose("/courses")}>
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
                  learningPreviewCourses.map((course) => {
                    const progressPercent = getCourseProgressPercent(course);

                    return (
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
                            <div className="market-progress-fill" style={{ width: `${progressPercent}%` }} />
                          </div>
                        </div>
                      </button>
                    );
                  })
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
            <button type="button" className="market-icon-btn" aria-label={t("nav.notifications")} onClick={() => navigateWithClose("/courses")}>
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
                            {item === "Messages" ? <em>1</em> : null}
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
                className={`market-category-btn ${
                  isCatalogPanelOpen && activeCatalogCategory?.key === category.key ? "active" : ""
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
          <img src={userImage} alt={firstName} className="market-welcome-avatar" />
          <div>
            <h1>{t("home.welcomeBack")}, {firstName}</h1>
            <p>
              {t("home.role")}{" "}
              <Link to="/profile" className="market-edit-link">
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
              <button type="button" onClick={() => navigateWithClose("/courses")}>
                {activeHero.cta}
              </button>
            </div>
            <div className="hero-image-wrap">
              <img src={activeHero.image} alt={activeHero.alt} />
            </div>
          </article>

          <button type="button" className="hero-control right" onClick={() => moveSlide(1)} aria-label="Next slide">
            <ChevronRight size={23} />
          </button>
        </section>

        <section className="market-learning-block">
          <h3>{t("home.myLearningTitle")}</h3>
        </section>
      </main>

      <LanguageModal open={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} />

      <Footer />
    </div>
  );
}

export default Home;

