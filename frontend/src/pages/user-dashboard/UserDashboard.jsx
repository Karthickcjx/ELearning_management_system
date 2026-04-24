import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import {
    BookOpen,
    Clock,
    Layout,
    Star,
    TrendingUp,
    Users,
    FileText,
    Bell,
    Inbox,
    ArrowRight,
} from "lucide-react";
import { announcementService } from "../../api/announcement.service";
import { profileService } from "../../api/profile.service";
import "./UserDashboard.css";

const quickActions = [
    { icon: BookOpen, label: "Browse Courses", path: "/courses" },
    { icon: Users, label: "Collab Rooms", path: "/rooms" },
    { icon: TrendingUp, label: "Roadmaps", path: "/roadmaps" },
    { icon: Star, label: "My Learning", path: "/Learnings" },
    { icon: FileText, label: "Assignments", path: "/assignments" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
];

const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
};

const toDisplayValue = (v) => {
    if (v === null || v === undefined || v === "—" || v === "--" || Number.isNaN(v)) return 0;
    return v;
};

function UserDashboard() {
    const navigate = useNavigate();
    const storedName = (localStorage.getItem("name") || "Learner").split(" ")[0];
    const userId = localStorage.getItem("id") || localStorage.getItem("userId");

    const [announcements, setAnnouncements] = useState([]);
    const [stats, setStats] = useState({
        enrolledCourses: "—",
        completed: "—",
        hoursLearned: "—",
        certificates: "—",
    });
    const [learning, setLearning] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (userId) {
                const statRes = await profileService.getUserDashboardStats(userId);
                if (statRes.success) {
                    setStats({
                        enrolledCourses: statRes.data.enrolledCourses,
                        completed: statRes.data.completed,
                        hoursLearned: Math.round(statRes.data.hoursLearned),
                        certificates: statRes.data.certificates,
                    });
                    if (Array.isArray(statRes.data.learning)) {
                        setLearning(statRes.data.learning);
                    }
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
        {
            label: "Enrolled Courses",
            value: stats.enrolledCourses,
            icon: BookOpen,
            iconBg: "bg-indigo-100",
            iconColor: "text-indigo-600",
        },
        {
            label: "Completed",
            value: stats.completed,
            icon: Star,
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
        },
        {
            label: "Hours Learned",
            value: stats.hoursLearned,
            icon: Clock,
            iconBg: "bg-violet-100",
            iconColor: "text-violet-600",
        },
        {
            label: "Certificates",
            value: stats.certificates,
            icon: Layout,
            iconBg: "bg-amber-100",
            iconColor: "text-amber-600",
        },
    ];

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const greeting = getGreeting();
    const recent = Array.isArray(learning) ? learning.slice(0, 3) : [];

    return (
        <div className="dash-page min-h-screen bg-slate-50">
            <Navbar page="dashboard" />
            <div className="max-w-container-xl mx-auto px-6 py-8 animate-fadeInUp">
                {/* Greeting */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-primary">
                        {greeting}, {storedName}
                    </h1>
                    <p className="mt-1 text-base text-slate-500">
                        Here's what's happening with your learning journey.
                    </p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {statCards.map((s) => {
                        const Icon = s.icon;
                        return (
                            <div
                                key={s.label}
                                className="flex items-center gap-4 p-5 bg-white rounded-lg border border-slate-200 shadow-sm"
                            >
                                <div
                                    className={`flex items-center justify-center w-10 h-10 rounded-lg ${s.iconBg}`}
                                >
                                    <Icon size={20} className={s.iconColor} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-3xl font-bold text-slate-900 leading-none">
                                        {toDisplayValue(s.value)}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500 truncate">
                                        {s.label}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Actions + Announcements */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Quick Actions */}
                    <div className="flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm p-6 h-full">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">
                            Quick Actions
                        </h2>
                        <div className="grid grid-cols-2 gap-2 flex-1">
                            {quickActions.map((a) => {
                                const Icon = a.icon;
                                return (
                                    <button
                                        key={a.label}
                                        onClick={() => navigate(a.path)}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                    >
                                        <Icon size={18} className="text-slate-500" />
                                        <span className="truncate">{a.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Announcements */}
                    <div className="flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm p-6 h-full">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">
                            Announcements
                        </h2>
                        {announcements.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                    <Inbox size={22} className="text-slate-400" />
                                </div>
                                <p className="text-sm font-medium text-slate-700">
                                    You're all caught up
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    No announcements at this time.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 overflow-auto">
                                {announcements.map((a) => (
                                    <div
                                        key={a.id}
                                        className="rounded-lg border border-slate-100 bg-slate-50/60 p-3"
                                    >
                                        <p className="text-sm font-semibold text-slate-900">
                                            {a.title}
                                        </p>
                                        <p className="text-sm text-slate-600 mt-1">
                                            {a.body}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            {formatDate(a.date)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Continue learning */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Continue learning
                        </h2>
                        <button
                            onClick={() => navigate("/Learnings")}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
                        >
                            View all <ArrowRight size={14} />
                        </button>
                    </div>

                    {recent.length === 0 ? (
                        <div className="bg-white rounded-lg border border-dashed border-slate-300 p-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                                <BookOpen size={22} className="text-indigo-600" />
                            </div>
                            <p className="text-sm font-medium text-slate-700">
                                You haven't started any courses yet.
                            </p>
                            <p className="text-xs text-slate-500 mt-1 mb-4">
                                Pick a course and begin your learning journey.
                            </p>
                            <button
                                onClick={() => navigate("/courses")}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                            >
                                Browse courses <ArrowRight size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {recent.map((c, idx) => {
                                const progress = Math.max(
                                    0,
                                    Math.min(100, Number(c.progress ?? 0))
                                );
                                return (
                                    <button
                                        key={c.id ?? c.courseId ?? idx}
                                        onClick={() =>
                                            navigate(
                                                c.path ||
                                                    `/courses/${c.id ?? c.courseId ?? ""}`
                                            )
                                        }
                                        className="text-left bg-white rounded-lg border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                <BookOpen
                                                    size={20}
                                                    className="text-indigo-600"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">
                                                    {c.title || c.name || "Course"}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {c.instructor || c.category || "In progress"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                            {progress}% complete
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default UserDashboard;
