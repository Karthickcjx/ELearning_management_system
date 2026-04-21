import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { BookOpen, Clock, Layout, Star, TrendingUp, Users, FileText, Bell } from "lucide-react";
import { announcementService } from "../../api/announcement.service";
import { profileService } from "../../api/profile.service";
import "./UserDashboard.css";

const quickActions = [
    { icon: BookOpen, label: "Browse Courses", path: "/courses", color: "#2563eb" },
    { icon: Users, label: "Collab Rooms", path: "/rooms", color: "#7c3aed" },
    { icon: TrendingUp, label: "Roadmaps", path: "/roadmaps", color: "#059669" },
    { icon: Star, label: "My Learning", path: "/Learnings", color: "#d97706" },
    { icon: FileText, label: "Assignments", path: "/assignments", color: "#dc2626" },
    { icon: Bell, label: "Notifications", path: "/notifications", color: "#0891b2" },
];

function UserDashboard() {
    const navigate = useNavigate();
    const storedName = (localStorage.getItem("name") || "Learner").split(" ")[0];
    const userId = localStorage.getItem("userId");

    const [announcements, setAnnouncements] = useState([]);
    const [stats, setStats] = useState({
        enrolledCourses: "—",
        completed: "—",
        hoursLearned: "—",
        certificates: "—"
    });

    useEffect(() => {
        const fetchData = async () => {
            if (userId) {
                const statRes = await profileService.getUserDashboardStats(userId);
                if (statRes.success) {
                    setStats({
                        enrolledCourses: statRes.data.enrolledCourses,
                        completed: statRes.data.completed,
                        hoursLearned: Math.round(statRes.data.hoursLearned),
                        certificates: statRes.data.certificates
                    });
                }
            }

            const annRes = await announcementService.getPublishedAnnouncements();
            if (annRes.success) {
                setAnnouncements(annRes.data);
            }
        };
        fetchData();
    }, [userId]);

    const statCards = [
        { label: "Enrolled Courses", value: stats.enrolledCourses, icon: BookOpen, gradient: "linear-gradient(135deg,#2563eb,#3b82f6)" },
        { label: "Completed", value: stats.completed, icon: Star, gradient: "linear-gradient(135deg,#059669,#10b981)" },
        { label: "Hours Learned", value: stats.hoursLearned, icon: Clock, gradient: "linear-gradient(135deg,#7c3aed,#8b5cf6)" },
        { label: "Certificates", value: stats.certificates, icon: Layout, gradient: "linear-gradient(135deg,#d97706,#f59e0b)" },
    ];

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

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
                            {announcements.length === 0 && (
                                <p style={{ color: "#64748b", margin: "1rem 0", fontSize: "0.9rem" }}>No announcements at this time.</p>
                            )}
                            {announcements.map((a) => (
                                <div key={a.id} className="dash-announce-item">
                                    <p className="dash-announce-title">{a.title}</p>
                                    <p className="dash-announce-detail">{a.body}</p>
                                    <p className="dash-announce-time">{formatDate(a.date)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default UserDashboard;
