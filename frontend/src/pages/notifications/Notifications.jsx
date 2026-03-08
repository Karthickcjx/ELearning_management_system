import React, { useState, useEffect } from "react";
import Navbar from "../../Components/common/Navbar";
import { Bell, Mail, CheckCircle, Trash2 } from "lucide-react";
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
        loadMessages();
    }, []);

    const loadMessages = async () => {
        setLoading(true);
        const studentId = localStorage.getItem("id");
        if (!studentId) {
            setLoading(false);
            return;
        }
        const res = await messageService.getStudentMessages(studentId);
        if (res.success) {
            setNotifications(
                (res.data || []).map((msg) => ({
                    id: msg.messageId,
                    type: "message",
                    icon: Mail,
                    title: msg.subject,
                    detail: msg.content,
                    time: formatTime(msg.sentAt),
                    read: msg.status === "READ",
                    senderName: msg.senderName,
                    senderEmail: msg.senderEmail,
                }))
            );
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
    };

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
                <p className="notif-subtitle">Stay updated on messages from your instructors and administrators.</p>

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
                    {loading ? (
                        <p className="notif-empty">Loading messages...</p>
                    ) : filtered.length === 0 ? (
                        <p className="notif-empty">No notifications to show.</p>
                    ) : (
                        filtered.map((n) => {
                            const tc = typeColors[n.type] || typeColors.message;
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
                                        {n.senderName && (
                                            <p style={{ margin: "0 0 .15rem", fontSize: ".72rem", color: "#94a3b8" }}>
                                                From: {n.senderName}
                                            </p>
                                        )}
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
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

export default Notifications;
