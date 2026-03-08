import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/common/Navbar";
import { BookOpen, Clock, Layout, Star, TrendingUp, Users, FileText, Bell } from "lucide-react";
import "./UserDashboard.css";

const quickActions = [
    { icon: BookOpen, label: "Browse Courses", path: "/courses", color: "#2563eb" },
    { icon: Users, label: "Collab Rooms", path: "/rooms", color: "#7c3aed" },
    { icon: TrendingUp, label: "Roadmaps", path: "/roadmaps", color: "#059669" },
    { icon: Star, label: "My Learning", path: "/Learnings", color: "#d97706" },
    { icon: FileText, label: "Assignments", path: "/assignments", color: "#dc2626" },
    { icon: Bell, label: "Notifications", path: "/notifications", color: "#0891b2" },
];

const statCards = [
    { label: "Enrolled Courses", value: "—", icon: BookOpen, gradient: "linear-gradient(135deg,#2563eb,#3b82f6)" },
    { label: "Completed", value: "—", icon: Star, gradient: "linear-gradient(135deg,#059669,#10b981)" },
    { label: "Hours Learned", value: "—", icon: Clock, gradient: "linear-gradient(135deg,#7c3aed,#8b5cf6)" },
    { label: "Certificates", value: "—", icon: Layout, gradient: "linear-gradient(135deg,#d97706,#f59e0b)" },
];

const announcements = [
    { id: 1, title: "Platform maintenance scheduled", detail: "Scheduled downtime on Sunday 2am–4am UTC for server upgrades.", time: "2 hours ago" },
    { id: 2, title: "New AI-powered features released", detail: "Check out the AI Moderator and Roadmap Planner in your rooms.", time: "1 day ago" },
    { id: 3, title: "Certificate downloads now available", detail: "Completed course certificates can now be downloaded from the course page.", time: "3 days ago" },
];

function UserDashboard() {
    const navigate = useNavigate();
    const storedName = (localStorage.getItem("name") || "Learner").split(" ")[0];

    return (
        <div className="dash-page">
            <Navbar page="dashboard" />
            <div className="dash-container">
                <div className="dash-greeting">
                    <h1>Welcome back, {storedName} 👋</h1>
                    <p>Here's what's happening with your learning journey.</p>
                </div>

                {/* Stats Row */}
                <div className="dash-stats">
                    {statCards.map((s) => (
                        <div key={s.label} className="dash-stat-card">
                            <div className="dash-stat-icon" style={{ background: s.gradient }}>
                                <s.icon size={18} color="#fff" />
                            </div>
                            <div>
                                <p className="dash-stat-value">{s.value}</p>
                                <p className="dash-stat-label">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="dash-columns">
                    {/* Quick Actions */}
                    <div className="dash-card">
                        <h2>Quick Actions</h2>
                        <div className="dash-actions-grid">
                            {quickActions.map((a) => (
                                <button
                                    key={a.label}
                                    className="dash-action-btn"
                                    onClick={() => navigate(a.path)}
                                >
                                    <a.icon size={16} color={a.color} />
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Announcements */}
                    <div className="dash-card">
                        <h2>Announcements</h2>
                        <div className="dash-announcements">
                            {announcements.map((a) => (
                                <div key={a.id} className="dash-announce-item">
                                    <p className="dash-announce-title">{a.title}</p>
                                    <p className="dash-announce-detail">{a.detail}</p>
                                    <p className="dash-announce-time">{a.time}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserDashboard;
