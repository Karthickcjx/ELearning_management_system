import React, { useState } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { FileText, Calendar, CheckCircle2, Clock, AlertCircle, Inbox } from "lucide-react";

const sampleAssignments = [
    { id: 1, title: "Data Structures Quiz #3", course: "Data Structures & Algorithms", due: "Mar 12, 2026", status: "pending" },
    { id: 2, title: "React Component Project", course: "Full Stack Web Development", due: "Mar 15, 2026", status: "pending" },
    { id: 3, title: "SQL Practice Exercises", course: "Database Management", due: "Mar 8, 2026", status: "submitted" },
    { id: 4, title: "Python Basics Homework", course: "Python for Beginners", due: "Mar 5, 2026", status: "graded" },
    { id: 5, title: "CSS Layout Challenge", course: "Frontend Development", due: "Mar 3, 2026", status: "graded" },
];

const statusConfig = {
    pending: { label: "Pending", className: "text-amber-700 bg-amber-50 border-amber-200", icon: Clock },
    submitted: { label: "Submitted", className: "text-primary bg-primary/10 border-primary/20", icon: CheckCircle2 },
    graded: { label: "Graded", className: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
    overdue: { label: "Overdue", className: "text-red-700 bg-red-50 border-red-200", icon: AlertCircle },
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
        <div className="min-h-screen bg-slate-50">
            <Navbar page="assignments" />
            <div className="max-w-container-xl mx-auto px-6 py-6 lg:py-8">
                <div className="flex items-center gap-2">
                    <FileText size={22} className="text-primary" />
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Assignments</h1>
                </div>
                <p className="mt-1 text-sm text-slate-500">Track your assignments, submissions, and deadlines.</p>

                <div className="mt-6">
                    <div className="lms-filter-tabs">
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

                    <div className="space-y-3">
                        {filtered.length === 0 && (
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center py-12">
                                <Inbox size={40} className="text-slate-300 mb-2" />
                                <h3 className="text-base font-semibold text-slate-900">No assignments found</h3>
                                <p className="text-sm text-slate-500 mt-1">Try switching the filter above.</p>
                            </div>
                        )}
                        {filtered.map((a) => {
                            const sc = statusConfig[a.status] || statusConfig.pending;
                            const Icon = sc.icon;
                            return (
                                <div
                                    key={a.id}
                                    className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="min-w-0">
                                        <p className="text-base font-semibold text-slate-900">{a.title}</p>
                                        <p className="text-sm text-slate-500 mt-0.5">{a.course}</p>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <span className="flex items-center gap-1.5 text-sm text-slate-500">
                                            <Calendar size={14} /> {a.due}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.className}`}
                                        >
                                            <Icon size={12} /> {sc.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default Assignments;
