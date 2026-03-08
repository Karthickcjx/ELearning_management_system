import React, { useState } from "react";
import Navbar from "../../Components/common/Navbar";
import { Bell, BookOpen, Calendar, CheckCircle, Info, Star, Trash2 } from "lucide-react";
import "./Notifications.css";

const initialNotifications = [
    { id: 1, type: "assignment", icon: Calendar, title: "Assignment Due Tomorrow", detail: "Data Structures Quiz #3 is due on Mar 12, 2026.", time: "30m ago", read: false },
    { id: 2, type: "announcement", icon: Info, title: "New Course Material Available", detail: "Prof. Sarah Chen uploaded new slides for Full Stack Web Development.", time: "2h ago", read: false },
    { id: 3, type: "grade", icon: Star, title: "Grade Posted", detail: "You scored 92% on Python Basics Homework.", time: "5h ago", read: false },
    { id: 4, type: "enrollment", icon: BookOpen, title: "Enrollment Confirmed", detail: "You are now enrolled in 'Machine Learning Fundamentals'.", time: "1d ago", read: true },
    { id: 5, type: "system", icon: Info, title: "Password Changed", detail: "Your account password was successfully updated.", time: "2d ago", read: true },
    { id: 6, type: "announcement", icon: Info, title: "Platform Update", detail: "Voice chat is now available in collaborative rooms!", time: "3d ago", read: true },
];

const typeColors = {
    assignment: { color: "#d97706", bg: "#fffbeb" },
    announcement: { color: "#2563eb", bg: "#eff6ff" },
    grade: { color: "#059669", bg: "#ecfdf5" },
    enrollment: { color: "#7c3aed", bg: "#f5f3ff" },
    system: { color: "#64748b", bg: "#f8fafc" },
};

const filterTabs = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "read", label: "Read" },
];

function Notifications() {
    const [notifications, setNotifications] = useState(initialNotifications);
    const [filter, setFilter] = useState("all");

    const unreadCount = notifications.filter((n) => !n.read).length;
    const filtered =
        filter === "all"
            ? notifications
            : filter === "unread"
                ? notifications.filter((n) => !n.read)
                : notifications.filter((n) => n.read);

    const markAllRead = () =>
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const toggleRead = (id) =>
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
    const deleteNotification = (id) =>
        setNotifications((prev) => prev.filter((n) => n.id !== id));

    return (
        <div className="notif-page">
            <Navbar page="notifications" />
            <div className="notif-container">
                <div className="notif-header-row">
                    <div className="notif-header-left">
                        <Bell size={22} color="#2563eb" />
                        <h1>Notifications</h1>
                        {unreadCount > 0 && (
                            <span className="notif-new-badge">{unreadCount} new</span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button className="notif-mark-read-btn" onClick={markAllRead}>
                            <CheckCircle size={13} /> Mark all read
                        </button>
                    )}
                </div>
                <p className="notif-subtitle">Stay updated on assignments, grades, and platform announcements.</p>

                {/* Filter tabs */}
                <div className="notif-tabs">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab.key}
                            className={`notif-tab ${filter === tab.key ? "active" : ""}`}
                            onClick={() => setFilter(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Notification list */}
                <div className="notif-list">
                    {filtered.length === 0 && (
                        <p className="notif-empty">No notifications to show.</p>
                    )}
                    {filtered.map((n) => {
                        const tc = typeColors[n.type] || typeColors.system;
                        return (
                            <div
                                key={n.id}
                                className={`notif-card ${n.read ? "read" : "unread"}`}
                            >
                                <div className="notif-type-icon" style={{ background: tc.bg }}>
                                    <n.icon size={15} color={tc.color} />
                                </div>
                                <div className="notif-content">
                                    <div className="notif-content-top">
                                        <p className="notif-title">{n.title}</p>
                                        <span className="notif-time">{n.time}</span>
                                    </div>
                                    <p className="notif-detail">{n.detail}</p>
                                </div>
                                <div className="notif-actions">
                                    <button
                                        className="notif-action-btn"
                                        title={n.read ? "Mark unread" : "Mark read"}
                                        onClick={() => toggleRead(n.id)}
                                    >
                                        <CheckCircle size={13} />
                                    </button>
                                    <button
                                        className="notif-action-btn delete"
                                        title="Delete"
                                        onClick={() => deleteNotification(n.id)}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default Notifications;
