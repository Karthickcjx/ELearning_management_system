import React, { useState, useEffect } from "react";
import Navbar from "../../Components/common/Navbar";
import Footer from "../../Components/common/Footer";
import { Bell, Mail, Megaphone, CheckCircle, Trash2, Info } from "lucide-react";
import { messageService } from "../../api/message.service";
import "./Notifications.css";

const filterTabs = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "read", label: "Read" },
];

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        const studentId = localStorage.getItem("id");
        if (!studentId) {
            setLoading(false);
            return;
        }

        // Load all messages received — we show them as lightweight notifications
        const res = await messageService.getStudentMessages(studentId);
        if (res.success) {
            const items = (res.data || []).map((msg) => ({
                id: msg.messageId,
                type: msg.messageType === "NOTIFICATION" ? "announcement" : "message",
                icon: msg.messageType === "NOTIFICATION" ? Megaphone : Mail,
                title:
                    msg.messageType === "NOTIFICATION"
                        ? msg.subject
                        : `${msg.senderName} sent you a message`,
                detail:
                    msg.messageType === "NOTIFICATION"
                        ? msg.content
                        : msg.subject,
                time: formatTime(msg.sentAt),
                read: msg.status === "READ",
                senderName: msg.senderName,
            }));
            setNotifications(items);
        }
        setLoading(false);
    };

    const formatTime = (sentAt) => {
        if (!sentAt) return "";
        try {
            let date;
            if (Array.isArray(sentAt)) {
                const [y, mo, d, h = 0, mi = 0] = sentAt;
                date = new Date(y, mo - 1, d, h, mi);
            } else {
                date = new Date(sentAt);
            }
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 1) return "Just now";
            if (diffMins < 60) return `${diffMins}m ago`;
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours}h ago`;
            const diffDays = Math.floor(diffHours / 24);
            return `${diffDays}d ago`;
        } catch {
            return "";
        }
    };

    const unreadCount = notifications.filter((n) => !n.read).length;
    const filtered =
        filter === "all"
            ? notifications
            : filter === "unread"
                ? notifications.filter((n) => !n.read)
                : notifications.filter((n) => n.read);

    const markAllRead = async () => {
        const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
        for (const id of unreadIds) {
            await messageService.markAsRead(id);
        }
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const toggleRead = async (id) => {
        const notif = notifications.find((n) => n.id === id);
        if (notif && !notif.read) {
            await messageService.markAsRead(id);
        }
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
        );
    };

    const deleteNotification = (id) =>
        setNotifications((prev) => prev.filter((n) => n.id !== id));

    const typeColors = {
        message: { color: "#2563eb", bg: "#eff6ff" },
        announcement: { color: "#d97706", bg: "#fffbeb" },
    };

    const handleCardClick = (e, n) => {
        // Only redirect to messages if the user didn't click an action button
        if (e.target.closest('.notif-actions')) return;

        if (n.type === 'message') {
            // mark as read and redirect
            if (!n.read) toggleRead(n.id);
            window.location.href = '/messages';
        }
    };

    return (
        <div className="notif-page">
            <Navbar page="notifications" />
            <div className="notif-container">
                <div className="notif-header-row">
                    <div className="notif-header-left">
                        <Bell size={26} color="#2563eb" />
                        <h1>Notifications</h1>
                        {unreadCount > 0 && (
                            <span className="notif-new-badge">{unreadCount} new</span>
                        )}
                    </div>
                </div>
                <p className="notif-subtitle">
                    Stay updated — see who messaged you and important announcements.
                </p>

                {/* Tabs & Mark Read Wrapper */}
                <div className="notif-tabs-wrapper">
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
                    {unreadCount > 0 && filter !== "read" && (
                        <button className="notif-mark-read-btn" onClick={markAllRead}>
                            <CheckCircle size={16} /> Mark all read
                        </button>
                    )}
                </div>

                {/* Notification list */}
                <div className="notif-list">
                    {loading ? (
                        <div className="notif-empty">
                            <span className="udemy-spinner" style={{ width: '2rem', height: '2rem', borderWidth: '3px' }}></span>
                            <p>Loading notifications...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="notif-empty">
                            <div className="notif-empty-icon">
                                <Bell size={24} />
                            </div>
                            <p>No notifications yet</p>
                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>You'll see updates here when something new happens.</span>
                        </div>
                    ) : (
                        filtered.map((n) => {
                            const tc = typeColors[n.type] || typeColors.message;
                            return (
                                <div
                                    key={n.id}
                                    className={`notif-card ${n.read ? "read" : "unread"}`}
                                    onClick={(e) => handleCardClick(e, n)}
                                >
                                    <div className="notif-type-icon" style={{ background: tc.bg }}>
                                        <n.icon size={20} color={tc.color} />
                                    </div>
                                    <div className="notif-content">
                                        <p className="notif-sender">{n.senderName || 'System'}</p>
                                        <p className="notif-title">{n.title}</p>
                                        <p className="notif-detail">{n.detail}</p>
                                    </div>
                                    <div className="notif-right">
                                        <span className="notif-time">{n.time}</span>
                                        <div className="notif-actions">
                                            {!n.read && (
                                                <button
                                                    className="notif-action-btn primary"
                                                    title="Mark read"
                                                    onClick={(e) => { e.stopPropagation(); toggleRead(n.id); }}
                                                >
                                                    <CheckCircle size={15} /> Read
                                                </button>
                                            )}
                                            <button
                                                className="notif-action-btn delete"
                                                title="Delete"
                                                onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                            >
                                                <Trash2 size={15} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default Notifications;
