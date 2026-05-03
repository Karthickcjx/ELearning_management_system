import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  Briefcase,
  ChevronDown,
  GraduationCap,
  Heart,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { authService } from "../../api/auth.service";
import LanguageModal from "./LanguageModal";
import { useLanguageContext } from "../../contexts/LanguageContext";

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

const BUSINESS_MENU_ITEMS = [
  { key: "business", labelKey: "nav.business", path: "/dashboard" },
  { key: "teach", labelKey: "nav.teach", path: "/dashboard" },
];

function Navbar() {
  const navigate = useNavigate();
  const { language, t, getLanguageNativeLabel } = useLanguageContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isBusinessMenuOpen, setIsBusinessMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  const businessCloseTimerRef = useRef(null);
  const profileCloseTimerRef = useRef(null);
  const businessWrapRef = useRef(null);
  const profileWrapRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  const isAuthenticated = Boolean(localStorage.getItem("token"));
  const storedName = (localStorage.getItem("name") || "Learner").trim();
  const storedEmail = localStorage.getItem("email") || "learner@eduverse.com";
  const profileImage = localStorage.getItem("profileImage");
  const profileInitial = storedName.charAt(0).toUpperCase() || "L";

  const primaryNavLinks = useMemo(
    () => [
      { key: "courses", label: t("nav.courses"), path: "/courses" },
      ...(isAuthenticated
        ? [
            { key: "learnings", label: t("nav.myLearning"), path: "/Learnings" },
            { key: "rooms", label: t("profile.rooms"), path: "/rooms" },
          ]
        : []),
    ],
    [isAuthenticated, t]
  );

  const clearBusinessTimer = () => {
    if (businessCloseTimerRef.current) {
      window.clearTimeout(businessCloseTimerRef.current);
      businessCloseTimerRef.current = null;
    }
  };
  const clearProfileTimer = () => {
    if (profileCloseTimerRef.current) {
      window.clearTimeout(profileCloseTimerRef.current);
      profileCloseTimerRef.current = null;
    }
  };

  const scheduleCloseBusiness = () => {
    clearBusinessTimer();
    businessCloseTimerRef.current = window.setTimeout(() => {
      setIsBusinessMenuOpen(false);
      businessCloseTimerRef.current = null;
    }, 130);
  };
  const scheduleCloseProfile = () => {
    clearProfileTimer();
    profileCloseTimerRef.current = window.setTimeout(() => {
      setIsProfileMenuOpen(false);
      profileCloseTimerRef.current = null;
    }, 130);
  };

  const closeAllMenus = () => {
    setIsMobileDrawerOpen(false);
    setIsMobileSearchOpen(false);
    setIsBusinessMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  const go = (path) => {
    closeAllMenus();
    navigate(path);
  };

  const handleLogOut = async () => {
    await authService.logout();
    closeAllMenus();
    navigate("/login");
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const q = searchTerm.trim();
    closeAllMenus();
    navigate(q ? `/courses?search=${encodeURIComponent(q)}` : "/courses");
  };

  // Close popovers on outside click / Escape
  useEffect(() => {
    const handleDocClick = (e) => {
      if (businessWrapRef.current && !businessWrapRef.current.contains(e.target)) {
        setIsBusinessMenuOpen(false);
      }
      if (profileWrapRef.current && !profileWrapRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setIsBusinessMenuOpen(false);
        setIsProfileMenuOpen(false);
        setIsMobileDrawerOpen(false);
        setIsMobileSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleKey);
      clearBusinessTimer();
      clearProfileTimer();
    };
  }, []);

  // Lock body scroll when drawer/overlay open
  useEffect(() => {
    const locked = isMobileDrawerOpen || isMobileSearchOpen;
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileDrawerOpen, isMobileSearchOpen]);

  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  const openLanguageModal = () => {
    setIsProfileMenuOpen(false);
    setIsMobileDrawerOpen(false);
    setIsLanguageModalOpen(true);
  };

  const navLinkClass = ({ isActive }) =>
    `relative inline-flex items-center h-16 px-3 text-sm font-medium transition-all duration-150 ${
      isActive
        ? "text-primary after:content-[''] after:absolute after:left-3 after:right-3 after:bottom-3 after:h-0.5 after:bg-primary after:rounded-full"
        : "text-slate-700 hover:text-primary"
    }`;

  const iconBtnClass =
    "inline-flex items-center justify-center w-9 h-9 rounded-full text-slate-700 hover:text-primary hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-150";

  return (
    <>
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-100">
        <div className="max-w-container-xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center gap-3">
          {/* Left: hamburger (mobile) + logo */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md text-slate-700 hover:bg-slate-100 transition-all duration-150"
            aria-label="Open menu"
            aria-expanded={isMobileDrawerOpen}
            onClick={() => setIsMobileDrawerOpen(true)}
          >
            <Menu size={20} />
          </button>

          <button
            type="button"
            className="flex items-center gap-2 text-slate-900 hover:text-primary transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1"
            onClick={() => go("/")}
            aria-label="EduVerse home"
          >
            <GraduationCap size={22} className="text-primary" />
            <span className="font-semibold text-base tracking-tight hidden sm:inline">
              EduVerse
            </span>
          </button>

          {/* Desktop primary nav */}
          <nav className="hidden md:flex items-center ml-2" aria-label="Primary">
            {primaryNavLinks.map((item) => (
              <NavLink
                key={item.key}
                to={item.path}
                end={item.path === "/"}
                className={navLinkClass}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop search — narrower, expands on focus */}
          <form
            onSubmit={handleSearchSubmit}
            className={`hidden md:flex items-center ml-auto h-9 rounded-full bg-slate-100 border border-transparent focus-within:border-primary focus-within:bg-white transition-all duration-150 ${
              isSearchExpanded ? "w-80" : "w-56"
            }`}
            role="search"
          >
            <Search size={16} className="ml-3 text-slate-500 shrink-0" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchExpanded(true)}
              onBlur={() => setIsSearchExpanded(false)}
              placeholder={t("nav.searchPlaceholder")}
              aria-label="Search courses"
              className="flex-1 min-w-0 bg-transparent px-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </form>

          {/* Right cluster */}
          <div className="flex items-center gap-1 ml-auto md:ml-2">
            {/* Mobile search trigger */}
            <button
              type="button"
              className={`md:hidden ${iconBtnClass}`}
              aria-label="Open search"
              onClick={() => setIsMobileSearchOpen(true)}
            >
              <Search size={18} />
            </button>

            {/* Desktop: For business dropdown */}
            <div
              ref={businessWrapRef}
              className="hidden md:block relative"
              onMouseEnter={() => {
                clearBusinessTimer();
                setIsBusinessMenuOpen(true);
              }}
              onMouseLeave={scheduleCloseBusiness}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1 h-9 px-3 rounded-full text-sm text-slate-700 hover:text-primary hover:bg-slate-100 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-haspopup="menu"
                aria-expanded={isBusinessMenuOpen}
                onClick={() => setIsBusinessMenuOpen((p) => !p)}
              >
                <Briefcase size={15} />
                <span className="hidden lg:inline">For business</span>
                <ChevronDown size={14} className={`transition-transform duration-150 ${isBusinessMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {isBusinessMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-100 py-2 transition-all duration-150"
                >
                  {BUSINESS_MENU_ITEMS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      role="menuitem"
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-all duration-150"
                      onClick={() => go(item.path)}
                    >
                      {t(item.labelKey)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <>
                {/* Icon cluster — desktop only, keep avatar visible on mobile */}
                <button
                  type="button"
                  className={`hidden md:inline-flex ${iconBtnClass}`}
                  aria-label={t("nav.wishlist")}
                  title={t("nav.wishlist")}
                  onClick={() => navigate("/courses")}
                >
                  <Heart size={18} />
                </button>
                <button
                  type="button"
                  className={`hidden md:inline-flex ${iconBtnClass}`}
                  aria-label={t("nav.cart")}
                  title={t("nav.cart")}
                  onClick={() => navigate("/courses")}
                >
                  <ShoppingCart size={18} />
                </button>
                <button
                  type="button"
                  className={`hidden md:inline-flex ${iconBtnClass}`}
                  aria-label={t("nav.notifications")}
                  title={t("nav.notifications")}
                  onClick={() => navigate("/notifications")}
                >
                  <Bell size={18} />
                </button>

                {/* Avatar + dropdown */}
                <div
                  ref={profileWrapRef}
                  className="relative"
                  onMouseEnter={() => {
                    clearProfileTimer();
                    setIsProfileMenuOpen(true);
                  }}
                  onMouseLeave={scheduleCloseProfile}
                >
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white text-sm font-semibold overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Open profile menu"
                    aria-haspopup="menu"
                    aria-expanded={isProfileMenuOpen}
                    onClick={() => setIsProfileMenuOpen((p) => !p)}
                  >
                    {profileImage ? (
                      <img src={profileImage} alt={storedName} className="w-full h-full object-cover" />
                    ) : (
                      profileInitial
                    )}
                  </button>

                  {isProfileMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-slate-100 py-2 transition-all duration-150"
                    >
                      <button
                        type="button"
                        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-slate-50 transition-all duration-150"
                        onClick={() => go("/profile")}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold overflow-hidden">
                          {profileImage ? (
                            <img src={profileImage} alt={storedName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{profileInitial}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">{storedName}</div>
                          <div className="text-xs text-slate-500 truncate">{storedEmail}</div>
                        </div>
                      </button>
                      <div className="h-px bg-slate-100 my-1" />
                      <div className="max-h-72 overflow-y-auto py-1">
                        {PROFILE_MENU_ITEMS.map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            role="menuitem"
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-all duration-150"
                            onClick={() => go(item.path)}
                          >
                            {t(item.labelKey)}
                          </button>
                        ))}
                      </div>
                      <div className="h-px bg-slate-100 my-1" />
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-all duration-150"
                        onClick={openLanguageModal}
                      >
                        {t("profile.language")} ({getLanguageNativeLabel(language)})
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-accent hover:bg-slate-50 transition-all duration-150"
                        onClick={handleLogOut}
                      >
                        <LogOut size={15} />
                        {t("profile.signOut")}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => go("/login")}
                  className="inline-flex items-center h-9 px-4 rounded-md text-sm font-medium text-slate-700 hover:text-primary hover:bg-slate-100 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => go("/login")}
                  className="inline-flex items-center h-9 px-4 rounded-md text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile search overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden flex flex-col">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 h-14 px-3 border-b border-slate-100"
            role="search"
          >
            <button
              type="button"
              className={iconBtnClass}
              aria-label="Close search"
              onClick={() => setIsMobileSearchOpen(false)}
            >
              <X size={20} />
            </button>
            <div className="flex-1 flex items-center h-9 rounded-full bg-slate-100 px-3">
              <Search size={16} className="text-slate-500 shrink-0" />
              <input
                ref={mobileSearchInputRef}
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("nav.searchPlaceholder")}
                aria-label="Search courses"
                className="flex-1 min-w-0 bg-transparent px-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </form>
        </div>
      )}

      {/* Mobile drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 transition-all duration-150"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="absolute right-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-xl flex flex-col transition-all duration-150"
            role="dialog"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between h-14 px-4 border-b border-slate-100">
              <span className="font-semibold text-slate-900">Menu</span>
              <button
                type="button"
                className={iconBtnClass}
                aria-label="Close menu"
                onClick={() => setIsMobileDrawerOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => go("/profile")}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 transition-all duration-150"
                >
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold overflow-hidden">
                    {profileImage ? (
                      <img src={profileImage} alt={storedName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{profileInitial}</span>
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-sm font-semibold text-slate-900 truncate">{storedName}</div>
                    <div className="text-xs text-slate-500 truncate">{storedEmail}</div>
                  </div>
                </button>
              )}

              <div className="h-px bg-slate-100 my-1" />

              <nav className="flex flex-col py-1" aria-label="Mobile primary">
                {primaryNavLinks.map((item) => (
                  <NavLink
                    key={item.key}
                    to={item.path}
                    end={item.path === "/"}
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-3 text-sm transition-all duration-150 ${
                        isActive
                          ? "text-primary font-semibold bg-slate-50 border-l-2 border-primary"
                          : "text-slate-700 hover:bg-slate-50"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="h-px bg-slate-100 my-1" />

              {isAuthenticated ? (
                <>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => go("/courses")}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-all duration-150"
                    >
                      <Heart size={18} /> {t("nav.wishlist")}
                    </button>
                    <button
                      type="button"
                      onClick={() => go("/courses")}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-all duration-150"
                    >
                      <ShoppingCart size={18} /> {t("nav.cart")}
                    </button>
                    <button
                      type="button"
                      onClick={() => go("/notifications")}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-all duration-150"
                    >
                      <Bell size={18} /> {t("nav.notifications")}
                    </button>
                  </div>
                  <div className="h-px bg-slate-100 my-1" />
                  <div className="py-1">
                    {PROFILE_MENU_ITEMS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => go(item.path)}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-all duration-150"
                      >
                        {t(item.labelKey)}
                      </button>
                    ))}
                  </div>
                  <div className="h-px bg-slate-100 my-1" />
                  <div className="py-1">
                    {BUSINESS_MENU_ITEMS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => go(item.path)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-all duration-150"
                      >
                        <Briefcase size={16} /> {t(item.labelKey)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={openLanguageModal}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-all duration-150"
                    >
                      <Settings size={16} /> {t("profile.language")} ({getLanguageNativeLabel(language)})
                    </button>
                  </div>
                  <div className="h-px bg-slate-100 my-1" />
                  <button
                    type="button"
                    onClick={handleLogOut}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-accent hover:bg-slate-50 transition-all duration-150"
                  >
                    <LogOut size={16} /> {t("profile.signOut")}
                  </button>
                </>
              ) : (
                <div className="p-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => go("/login")}
                    className="w-full inline-flex justify-center items-center h-10 rounded-md text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-all duration-150"
                  >
                    Sign up
                  </button>
                  <button
                    type="button"
                    onClick={() => go("/login")}
                    className="w-full inline-flex justify-center items-center h-10 rounded-md text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all duration-150"
                  >
                    Log in
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  {BUSINESS_MENU_ITEMS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => go(item.path)}
                      className="flex items-center gap-2 w-full px-2 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-all duration-150"
                    >
                      <Briefcase size={16} /> {t(item.labelKey)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={openLanguageModal}
                    className="flex items-center gap-2 w-full px-2 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-all duration-150"
                  >
                    <User size={16} /> {t("profile.language")} ({getLanguageNativeLabel(language)})
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      <LanguageModal open={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} />
    </>
  );
}

export default Navbar;
