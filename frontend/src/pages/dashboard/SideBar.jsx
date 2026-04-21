import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  Megaphone,
  Shield,
  BarChart3,
  Settings,
  LogOut,
  GraduationCap,
  X,
} from "lucide-react";
import { authService } from "../../api/auth.service";
import { useNavigate } from "react-router-dom";
import "./AdminPanel.css";

const mainItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "user", label: "Users", icon: Users },
  { key: "courses", label: "Courses", icon: BookOpen },
];

const manageItems = [
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "announcements", label: "Announcements", icon: Megaphone },
  { key: "moderation", label: "Moderation", icon: Shield },
];

const insightItems = [
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings },
];

function SideBar({ current, onSelect, isOpen = false, onClose }) {
  const navigate = useNavigate();
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsTablet(w >= 768 && w < 1024);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  const handleSelect = (key) => {
    onSelect(key);
    if (onClose) onClose();
  };

  const renderItems = (items) =>
    items.map((item) => {
      const Icon = item.icon;
      const active = current === item.key;
      return (
        <li key={item.key}>
          <button
            type="button"
            onClick={() => handleSelect(item.key)}
            title={isTablet ? item.label : undefined}
            className={`admin-sidebar-item ${active ? "active" : ""}`}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </button>
        </li>
      );
    });

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`admin-sidebar-backdrop ${isOpen ? "show" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`admin-sidebar ${isOpen ? "open" : ""}`}
        aria-label="Admin navigation"
      >
        <div
          className="admin-sidebar-brand"
          onClick={() => handleSelect("dashboard")}
        >
          <div className="admin-sidebar-brand-icon">
            <GraduationCap size={20} />
          </div>
          <span>EduVerse Admin</span>
          <button
            type="button"
            className="admin-sidebar-close"
            onClick={(e) => {
              e.stopPropagation();
              onClose && onClose();
            }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <ul className="admin-sidebar-nav">
          <li className="admin-sidebar-section-label">Overview</li>
          {renderItems(mainItems)}

          <li className="admin-sidebar-section-label">Management</li>
          {renderItems(manageItems)}

          <li className="admin-sidebar-section-label">Insights</li>
          {renderItems(insightItems)}
        </ul>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-sidebar-item"
            onClick={handleLogout}
            title={isTablet ? "Sign Out" : undefined}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default SideBar;
