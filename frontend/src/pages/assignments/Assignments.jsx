import React, { useState } from "react";
import Navbar from "../../Components/common/Navbar";
import Footer from "../../Components/common/Footer";
import { FileText, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import "./Assignments.css";

const sampleAssignments = [
    { id: 1, title: "Data Structures Quiz #3", course: "Data Structures & Algorithms", due: "Mar 12, 2026", status: "pending" },
    { id: 2, title: "React Component Project", course: "Full Stack Web Development", due: "Mar 15, 2026", status: "pending" },
    { id: 3, title: "SQL Practice Exercises", course: "Database Management", due: "Mar 8, 2026", status: "submitted" },
    { id: 4, title: "Python Basics Homework", course: "Python for Beginners", due: "Mar 5, 2026", status: "graded" },
    { id: 5, title: "CSS Layout Challenge", course: "Frontend Development", due: "Mar 3, 2026", status: "graded" },
];

const statusConfig = {
    pending: { label: "Pending", color: "#d97706", bg: "#fffbeb", icon: Clock },
    submitted: { label: "Submitted", color: "#2563eb", bg: "#eff6ff", icon: CheckCircle2 },
    graded: { label: "Graded", color: "#059669", bg: "#ecfdf5", icon: CheckCircle2 },
    overdue: { label: "Overdue", color: "#dc2626", bg: "#fef2f2", icon: AlertCircle },
};

const filterTabs = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "submitted", label: "Submitted" },
    { key: "graded", label: "Graded" },
];

function Assignments() {
    const [filter, setFilter] = useState("all");

    const filtered = filter === "all"
        ? sampleAssignments
        : sampleAssignments.filter((a) => a.status === filter);

    return (
        <div className="assign-page">
            <Navbar page="assignments" />
            <div className="assign-container">
                <div className="assign-header">
                    <FileText size={22} color="#2563eb" />
                    <h1>Assignments</h1>
                </div>
                <p className="assign-subtitle">Track your assignments, submissions, and deadlines.</p>

                {/* Filter tabs */}
                <div className="assign-tabs">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab.key}
                            className={`assign-tab ${filter === tab.key ? "active" : ""}`}
                            onClick={() => setFilter(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Assignment list */}
                <div className="assign-list">
                    {filtered.length === 0 && (
                        <p className="assign-empty">No assignments found.</p>
                    )}
                    {filtered.map((a) => {
                        const sc = statusConfig[a.status] || statusConfig.pending;
                        return (
                            <div key={a.id} className="assign-card">
                                <div className="assign-card-info">
                                    <p className="assign-card-title">{a.title}</p>
                                    <p className="assign-card-course">{a.course}</p>
                                </div>
                                <div className="assign-card-meta">
                                    <span className="assign-date">
                                        <Calendar size={13} /> {a.due}
                                    </span>
                                    <span
                                        className="assign-badge"
                                        style={{ color: sc.color, background: sc.bg }}
                                    >
                                        <sc.icon size={12} /> {sc.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <Footer />
            </div>
        </div>
    );
}

export default Assignments;
