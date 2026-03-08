import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  GraduationCap,
  Heart,
  Menu,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { authService } from "../../api/auth.service";
import LanguageModal from "./LanguageModal";
import { useLanguageContext } from "../../contexts/LanguageContext";

const toCourseSearchPath = (query) => `/courses?search=${encodeURIComponent(query)}`;

const EXPLORE_MENU_SECTIONS = [
  {
    title: "New & Featured",
    items: [
      {
        key: "new-ai-google",
        label: "Learn AI with Google",
        path: toCourseSearchPath("learn ai with google"),
        subItems: [
          { label: "AI Fundamentals", path: toCourseSearchPath("ai fundamentals") },
          { label: "AI for Professionals", path: toCourseSearchPath("ai for professionals") },
          { label: "AI for Developers", path: toCourseSearchPath("ai for developers") },
          { label: "AI for Creatives", path: toCourseSearchPath("ai for creatives") },
        ],
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
        subItems: [
          { label: "Prompt Engineering", path: toCourseSearchPath("prompt engineering") },
          { label: "Machine Learning", path: toCourseSearchPath("machine learning") },
          { label: "Generative AI", path: toCourseSearchPath("generative ai") },
          { label: "AI for Students", path: toCourseSearchPath("ai for students") },
        ],
      },
      {
        key: "goal-career",
        label: "Launch a new career",
        path: toCourseSearchPath("career"),
        subItems: [
          { label: "Interview Preparation", path: toCourseSearchPath("interview preparation") },
          { label: "Resume Building", path: toCourseSearchPath("resume building") },
          { label: "Job Ready Projects", path: toCourseSearchPath("job projects") },
          { label: "Career Planning", path: toCourseSearchPath("career planning") },
        ],
      },
      {
        key: "goal-certification",
        label: "Prepare for a certification",
        path: toCourseSearchPath("certification"),
        subItems: [
          { label: "Cloud Certifications", path: toCourseSearchPath("cloud certification") },
          { label: "CompTIA Exams", path: toCourseSearchPath("comptia") },
          { label: "Data Certifications", path: toCourseSearchPath("data certification") },
          { label: "Project Management", path: toCourseSearchPath("pmp certification") },
        ],
      },
      {
        key: "goal-practice",
        label: "Practice with Role Play",
        path: toCourseSearchPath("role play"),
        subItems: [
          { label: "Mock Interviews", path: toCourseSearchPath("mock interview") },
          { label: "Presentation Skills", path: toCourseSearchPath("presentation skills") },
          { label: "Customer Scenarios", path: toCourseSearchPath("customer scenarios") },
          { label: "Leadership Simulation", path: toCourseSearchPath("leadership simulation") },
        ],
      },
    ],
  },
  {
    items: [
      {
        key: "cat-development",
        label: "Development",
        path: toCourseSearchPath("development"),
        subItems: [
          { label: "Web Development", path: toCourseSearchPath("web development") },
          { label: "Programming Languages", path: toCourseSearchPath("programming") },
          { label: "Mobile Development", path: toCourseSearchPath("mobile development") },
          { label: "Game Development", path: toCourseSearchPath("game development") },
        ],
      },
      {
        key: "cat-business",
        label: "Business",
        path: toCourseSearchPath("business"),
        subItems: [
          { label: "Entrepreneurship", path: toCourseSearchPath("entrepreneurship") },
          { label: "Business Analytics", path: toCourseSearchPath("business analytics") },
          { label: "Communication", path: toCourseSearchPath("business communication") },
          { label: "Leadership", path: toCourseSearchPath("leadership") },
        ],
      },
      {
        key: "cat-finance",
        label: "Finance & Accounting",
        path: toCourseSearchPath("finance"),
        subItems: [
          { label: "Accounting", path: toCourseSearchPath("accounting") },
          { label: "Financial Analysis", path: toCourseSearchPath("financial analysis") },
          { label: "Investing", path: toCourseSearchPath("investing") },
          { label: "Excel for Finance", path: toCourseSearchPath("excel finance") },
        ],
      },
      {
        key: "cat-it",
        label: "IT & Software",
        path: toCourseSearchPath("it software"),
        subItems: [
          { label: "Cyber Security", path: toCourseSearchPath("cyber security") },
          { label: "Network & Security", path: toCourseSearchPath("network security") },
          { label: "Cloud Computing", path: toCourseSearchPath("cloud computing") },
          { label: "DevOps", path: toCourseSearchPath("devops") },
        ],
      },
      {
        key: "cat-office",
        label: "Office Productivity",
        path: toCourseSearchPath("office productivity"),
        subItems: [
          { label: "Microsoft Office", path: toCourseSearchPath("microsoft office") },
          { label: "Google Workspace", path: toCourseSearchPath("google workspace") },
          { label: "Time Management", path: toCourseSearchPath("time management") },
          { label: "Productivity Systems", path: toCourseSearchPath("productivity") },
        ],
      },
      {
        key: "cat-personal",
        label: "Personal Development",
        path: toCourseSearchPath("personal development"),
        subItems: [
          { label: "Personal Branding", path: toCourseSearchPath("personal branding") },
          { label: "Self Confidence", path: toCourseSearchPath("self confidence") },
          { label: "Public Speaking", path: toCourseSearchPath("public speaking") },
          { label: "Mindfulness", path: toCourseSearchPath("mindfulness") },
        ],
      },
      {
        key: "cat-design",
        label: "Design",
        path: toCourseSearchPath("design"),
        subItems: [
          { label: "UI/UX Design", path: toCourseSearchPath("ui ux") },
          { label: "Graphic Design", path: toCourseSearchPath("graphic design") },
          { label: "3D & Animation", path: toCourseSearchPath("3d animation") },
          { label: "Design Tools", path: toCourseSearchPath("figma photoshop") },
        ],
      },
      {
        key: "cat-marketing",
        label: "Marketing",
        path: toCourseSearchPath("marketing"),
        subItems: [
          { label: "Digital Marketing", path: toCourseSearchPath("digital marketing") },
          { label: "Social Media", path: toCourseSearchPath("social media marketing") },
          { label: "SEO", path: toCourseSearchPath("seo") },
          { label: "Content Marketing", path: toCourseSearchPath("content marketing") },
        ],
      },
      {
        key: "cat-lifestyle",
        label: "Lifestyle",
        path: toCourseSearchPath("lifestyle"),
        subItems: [
          { label: "Photography", path: toCourseSearchPath("photography") },
          { label: "Health & Fitness", path: toCourseSearchPath("fitness") },
          { label: "Cooking", path: toCourseSearchPath("cooking") },
          { label: "Music", path: toCourseSearchPath("music") },
        ],
      },
    ],
  },
];

const EXPLORE_MENU_ITEMS = EXPLORE_MENU_SECTIONS.flatMap((section) => section.items);
const DEFAULT_EXPLORE_ITEM_KEY = EXPLORE_MENU_ITEMS[0]?.key ?? "";
const PROFILE_MENU_ITEMS = [
  { key: "dashboard", labelKey: "nav.dashboard", path: "/dashboard" },
  { key: "profile", labelKey: "profile.profile", path: "/profile" },
  { key: "account-settings", labelKey: "profile.accountSettings", path: "/settings" },
  { key: "learnings", labelKey: "profile.myLearning", path: "/Learnings" },
  { key: "assignments", labelKey: "nav.assignments", path: "/assignments" },
  { key: "messages", labelKey: "nav.messages", path: "/messages" },
  { key: "notifications", labelKey: "nav.notifications", path: "/notifications" },
  { key: "roadmaps", labelKey: "profile.roadmaps", path: "/roadmaps" },
  { key: "rooms", labelKey: "profile.rooms", path: "/rooms" },
];

function Navbar({ page }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t, getLanguageNativeLabel } = useLanguageContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExploreMenuOpen, setIsExploreMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [activeExploreItemKey, setActiveExploreItemKey] = useState(DEFAULT_EXPLORE_ITEM_KEY);
  const exploreCloseTimerRef = useRef(null);
  const profileCloseTimerRef = useRef(null);
  const isAuthenticated = Boolean(localStorage.getItem("token"));

  const activePage = useMemo(() => {
    if (page) {
      return page;
    }

    const path = location.pathname.toLowerCase();
    if (path === "/") return "home";
    if (path.startsWith("/courses") || path.startsWith("/course")) return "courses";
    if (path.startsWith("/profile")) return "profile";
    if (path.startsWith("/settings")) return "profile";
    if (path.startsWith("/account-settings")) return "profile";
    if (path.startsWith("/learnings")) return "learnings";
    if (path.startsWith("/roadmaps")) return "roadmaps";
    if (path.startsWith("/rooms")) return "rooms";
    if (path.startsWith("/dashboard")) return "dashboard";
    if (path.startsWith("/assignments")) return "assignments";
    if (path.startsWith("/messages")) return "messages";
    if (path.startsWith("/notifications")) return "notifications";

    return "";
  }, [location.pathname, page]);

  const storedName = (localStorage.getItem("name") || "Learner").trim();
  const storedEmail = localStorage.getItem("email") || "learner@eduverse.com";
  const profileImage = localStorage.getItem("profileImage");
  const profileInitial = storedName.charAt(0).toUpperCase() || "L";

  const navLinks = [
    { key: "home", label: t("nav.home"), path: "/" },
    { key: "courses", label: t("nav.courses"), path: "/courses" },
    ...(isAuthenticated ? [{ key: "learnings", label: t("nav.myLearning"), path: "/Learnings" }] : []),
  ];

  const handleLogOut = async () => {
    await authService.logout();
    setIsMobileMenuOpen(false);
    navigate("/login");
  };

  const closeMenuAndNavigate = (path) => {
    setIsMobileMenuOpen(false);
    setIsExploreMenuOpen(false);
    setIsProfileMenuOpen(false);
    navigate(path);
  };

  const clearExploreCloseTimer = () => {
    if (exploreCloseTimerRef.current) {
      window.clearTimeout(exploreCloseTimerRef.current);
      exploreCloseTimerRef.current = null;
    }
  };

  const clearProfileCloseTimer = () => {
    if (profileCloseTimerRef.current) {
      window.clearTimeout(profileCloseTimerRef.current);
      profileCloseTimerRef.current = null;
    }
  };

  const activeExploreItem = useMemo(
    () =>
      EXPLORE_MENU_ITEMS.find((item) => item.key === activeExploreItemKey) ??
      EXPLORE_MENU_ITEMS[0],
    [activeExploreItemKey]
  );

  const openExploreMenu = () => {
    clearExploreCloseTimer();
    clearProfileCloseTimer();
    setIsProfileMenuOpen(false);
    setIsExploreMenuOpen(true);
    if (!activeExploreItemKey && EXPLORE_MENU_ITEMS[0]) {
      setActiveExploreItemKey(EXPLORE_MENU_ITEMS[0].key);
    }
  };

  const closeExploreMenu = () => {
    clearExploreCloseTimer();
    setIsExploreMenuOpen(false);
  };

  const scheduleCloseExploreMenu = () => {
    clearExploreCloseTimer();
    exploreCloseTimerRef.current = window.setTimeout(() => {
      setIsExploreMenuOpen(false);
      exploreCloseTimerRef.current = null;
    }, 130);
  };

  const handleExploreNavigate = (path) => {
    closeExploreMenu();
    closeMenuAndNavigate(path);
  };

  const openProfileMenu = () => {
    clearProfileCloseTimer();
    clearExploreCloseTimer();
    setIsExploreMenuOpen(false);
    setIsProfileMenuOpen(true);
  };

  const closeProfileMenu = () => {
    clearProfileCloseTimer();
    setIsProfileMenuOpen(false);
  };

  const scheduleCloseProfileMenu = () => {
    clearProfileCloseTimer();
    profileCloseTimerRef.current = window.setTimeout(() => {
      setIsProfileMenuOpen(false);
      profileCloseTimerRef.current = null;
    }, 130);
  };

  const handleProfileNavigate = (path) => {
    closeProfileMenu();
    closeMenuAndNavigate(path);
  };

  const openLanguageModal = () => {
    closeProfileMenu();
    setIsMobileMenuOpen(false);
    setIsLanguageModalOpen(true);
  };

  useEffect(
    () => () => {
      clearExploreCloseTimer();
      clearProfileCloseTimer();
    },
    []
  );

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (!searchTerm.trim()) {
      closeMenuAndNavigate("/courses");
      return;
    }
    closeMenuAndNavigate(`/courses?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <header className="udemy-navbar">
      <div className="udemy-navbar-row">
        <div className="udemy-brand-group">
          <button
            type="button"
            className="udemy-nav-toggle"
            aria-label="Toggle menu"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <button
            type="button"
            className="udemy-brand-button"
            onClick={() => closeMenuAndNavigate("/")}
          >
            <GraduationCap size={20} />
            <span>EduVerse</span>
          </button>

          <div
            className="udemy-explore-menu-wrap"
            onMouseEnter={openExploreMenu}
            onMouseLeave={scheduleCloseExploreMenu}
            onFocusCapture={openExploreMenu}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                scheduleCloseExploreMenu();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                closeExploreMenu();
              }
            }}
          >
            <button
              type="button"
              className={`udemy-pill-btn ${isExploreMenuOpen ? "expanded" : ""}`}
              aria-haspopup="menu"
              aria-expanded={isExploreMenuOpen}
              onClick={() => {
                clearExploreCloseTimer();
                setIsExploreMenuOpen((prev) => !prev);
              }}
            >
              {t("nav.explore")}
            </button>

            <div className={`udemy-explore-dropdown ${isExploreMenuOpen ? "open" : ""}`} role="menu">
              <div className="udemy-explore-columns">
                <div className="udemy-explore-primary">
                  {EXPLORE_MENU_SECTIONS.map((section) => (
                    <div
                      key={section.title || section.items[0]?.key}
                      className={`udemy-explore-section ${section.title ? "" : "no-heading"}`}
                    >
                      {section.title ? (
                        <p className="udemy-explore-section-title">{section.title}</p>
                      ) : null}

                      {section.items.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          className={`udemy-explore-item ${activeExploreItem?.key === item.key ? "active" : ""
                            }`}
                          onMouseEnter={() => setActiveExploreItemKey(item.key)}
                          onFocus={() => setActiveExploreItemKey(item.key)}
                          onClick={() => handleExploreNavigate(item.path)}
                        >
                          <span>{item.label}</span>
                          {item.subItems?.length ? <ChevronRight size={14} /> : null}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="udemy-explore-secondary">
                  {activeExploreItem?.subItems?.length ? (
                    <>
                      <p className="udemy-explore-secondary-title">{activeExploreItem.label}</p>
                      {activeExploreItem.subItems.map((subItem) => (
                        <button
                          key={subItem.label}
                          type="button"
                          className="udemy-explore-subitem"
                          onClick={() => handleExploreNavigate(subItem.path)}
                        >
                          <span>{subItem.label}</span>
                          <ChevronRight size={13} />
                        </button>
                      ))}
                    </>
                  ) : (
                    <p className="udemy-explore-empty">Browse all courses</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <form className="udemy-search" onSubmit={handleSearchSubmit}>
          <Search size={16} />
          <input
            type="search"
            placeholder={t("nav.searchPlaceholder")}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search courses"
          />
        </form>

        <div className={`udemy-nav-links ${isMobileMenuOpen ? "open" : ""}`}>
          <button
            type="button"
            className="udemy-link-btn desktop-only"
            onClick={() => closeMenuAndNavigate("/dashboard")}
          >
            {t("nav.business")}
          </button>
          <button
            type="button"
            className="udemy-link-btn desktop-only"
            onClick={() => closeMenuAndNavigate("/dashboard")}
          >
            {t("nav.teach")}
          </button>

          {navLinks.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`udemy-link-btn ${activePage === item.key ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}

          <button type="button" className="udemy-icon-btn" aria-label={t("nav.wishlist")} onClick={() => navigate("/courses")}>
            <Heart size={15} />
          </button>
          <button type="button" className="udemy-icon-btn" aria-label={t("nav.cart")} onClick={() => navigate("/courses")}>
            <ShoppingCart size={15} />
          </button>
          <button type="button" className="udemy-icon-btn" aria-label={t("nav.notifications")} onClick={() => navigate("/notifications")}>
            <Bell size={15} />
          </button>

          {isAuthenticated ? (
            <div
              className="udemy-profile-menu-wrap"
              onMouseEnter={openProfileMenu}
              onMouseLeave={scheduleCloseProfileMenu}
              onFocusCapture={openProfileMenu}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  scheduleCloseProfileMenu();
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  closeProfileMenu();
                }
              }}
            >
              <button
                type="button"
                className={`udemy-avatar udemy-avatar-btn ${isProfileMenuOpen ? "active" : ""}`}
                aria-label="Open profile menu"
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
                onClick={() => {
                  clearProfileCloseTimer();
                  setIsProfileMenuOpen((prev) => !prev);
                }}
              >
                {profileImage ? <img src={profileImage} alt={storedName} /> : profileInitial}
                <span className="udemy-avatar-dot" aria-hidden="true" />
              </button>

              <div className={`udemy-profile-dropdown ${isProfileMenuOpen ? "open" : ""}`} role="menu">
                <button type="button" className="udemy-profile-header" onClick={() => handleProfileNavigate("/profile")}>
                  <div className="udemy-profile-image">
                    {profileImage ? <img src={profileImage} alt={storedName} /> : <span>{profileInitial}</span>}
                  </div>
                  <div className="udemy-profile-copy">
                    <strong>{storedName}</strong>
                    <span>{storedEmail}</span>
                  </div>
                </button>

                <div className="udemy-profile-group">
                  {PROFILE_MENU_ITEMS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className="udemy-profile-item"
                      onClick={() => handleProfileNavigate(item.path)}
                    >
                      {t(item.labelKey)}
                    </button>
                  ))}
                </div>

                <div className="udemy-profile-group">
                  <button type="button" className="udemy-profile-item" onClick={openLanguageModal}>
                    {t("profile.language")} ({getLanguageNativeLabel(language)})
                  </button>
                </div>

                <button type="button" className="udemy-profile-signout" onClick={handleLogOut}>
                  {t("profile.signOut")}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="udemy-auth-btn"
              onClick={() => closeMenuAndNavigate("/login")}
            >
              {t("nav.loginSignup")}
            </button>
          )}
        </div>
      </div>
      <LanguageModal open={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} />
    </header>
  );
}

export default Navbar;
