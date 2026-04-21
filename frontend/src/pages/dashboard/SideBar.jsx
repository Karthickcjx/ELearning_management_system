import React from "react";
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

function SideBar({ current, onSelect }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  const renderItems = (items) =>
    items.map((item) => (
      <li key={item.key}>
        <button
          onClick={() => onSelect(item.key)}
          className={`admin-sidebar-item ${current === item.key ? "active" : ""}`}
        >
          <item.icon size={18} />
          <span>{item.label}</span>
        </button>
      </li>
    ));

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-brand" onClick={() => onSelect("dashboard")}>
        <div className="admin-sidebar-brand-icon">
          <GraduationCap size={20} />
        </div>
        <span>EduVerse Admin</span>
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
        <button className="admin-sidebar-item" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export default SideBar;
