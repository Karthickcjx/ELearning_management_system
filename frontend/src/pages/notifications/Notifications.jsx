import React, { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { Bell, Mail, Megaphone, CheckCircle, Trash2, Loader2 } from "lucide-react";
import { messageService } from "../../api/message.service";

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

    const typeClasses = {
        message: "text-primary bg-primary/10",
        announcement: "text-amber-600 bg-amber-50",
    };

    const handleCardClick = (e, n) => {
        if (e.target.closest('[data-notif-actions]')) return;
        if (n.type === 'message') {
            if (!n.read) toggleRead(n.id);
            window.location.href = '/messages';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar page="notifications" />
            <div className="max-w-container-xl mx-auto px-6 py-6 lg:py-8">
                <div className="flex items-center gap-2">
                    <Bell size={24} className="text-primary" />
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
                    {unreadCount > 0 && (
                        <span className="ml-2 inline-flex items-center text-xs font-semibold bg-primary text-white rounded-full px-2.5 py-0.5">
                            {unreadCount} new
                        </span>
                    )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                    Stay updated — see who messaged you and important announcements.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="lms-filter-tabs !mb-0">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab.key}
                                className={`lms-filter-tab ${filter === tab.key ? "active" : ""}`}
                                onClick={() => setFilter(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    {unreadCount > 0 && filter !== "read" && (
                        <button
                            className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm rounded-md px-3 py-2 transition-colors"
                            onClick={markAllRead}
                        >
                            <CheckCircle size={16} /> Mark all read
                        </button>
                    )}
                </div>

                <div className="mt-4 space-y-3">
                    {loading ? (
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center py-12">
                            <Loader2 size={28} className="text-slate-400 animate-spin mb-2" />
                            <p className="text-sm text-slate-500">Loading notifications...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center py-12">
                            <Bell size={40} className="text-slate-300 mb-2" />
                            <h3 className="text-base font-semibold text-slate-900">No notifications yet</h3>
                            <p className="text-sm text-slate-500 mt-1">You'll see updates here when something new happens.</p>
                        </div>
                    ) : (
                        filtered.map((n) => {
                            const typeClass = typeClasses[n.type] || typeClasses.message;
                            const Icon = n.icon;
                            return (
                                <div
                                    key={n.id}
                                    className={`bg-white rounded-lg border shadow-sm p-5 flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow ${
                                        n.read ? "border-slate-200" : "border-primary/30 bg-primary/[0.02]"
                                    }`}
                                    onClick={(e) => handleCardClick(e, n)}
                                >
                                    <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${typeClass}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{n.senderName || 'System'}</p>
                                        <p className="text-sm font-semibold text-slate-900 mt-0.5">{n.title}</p>
                                        <p className="text-sm text-slate-600 mt-1">{n.detail}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                        <span className="text-xs text-slate-500 whitespace-nowrap">{n.time}</span>
                                        <div className="flex items-center gap-1" data-notif-actions>
                                            {!n.read && (
                                                <button
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded-md px-2 py-1 transition-colors"
                                                    title="Mark read"
                                                    onClick={(e) => { e.stopPropagation(); toggleRead(n.id); }}
                                                >
                                                    <CheckCircle size={14} /> Read
                                                </button>
                                            )}
                                            <button
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-md px-2 py-1 transition-colors"
                                                title="Delete"
                                                onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                            >
                                                <Trash2 size={14} /> Delete
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
