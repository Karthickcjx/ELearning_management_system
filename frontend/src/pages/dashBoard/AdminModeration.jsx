import React, { useState } from "react";
import { Shield, AlertTriangle, CheckCircle, XCircle, MessageSquare, FileText } from "lucide-react";

const sampleFlagged = [
    { id: 1, type: "discussion", user: "mike_ross", content: "This is spam content that was flagged by the automated filter...", course: "Python for Beginners", time: "1h ago", severity: "high" },
    { id: 2, type: "chat", user: "jane_doe", content: "Inappropriate language detected in the collaborative room chat...", course: "Collab Room - DSA", time: "3h ago", severity: "medium" },
    { id: 3, type: "discussion", user: "mark_smith", content: "Off-topic promotional link posted in course discussion forum...", course: "Web Development", time: "6h ago", severity: "low" },
    { id: 4, type: "chat", user: "sara_lee", content: "Repeated hostile messages towards another student in study group...", course: "Collab Room - ML", time: "1d ago", severity: "high" },
    { id: 5, type: "discussion", user: "alex_kim", content: "Suspected plagiarism in assignment discussion thread...", course: "Database Management", time: "2d ago", severity: "medium" },
];

const severityConfig = {
    high: { label: "High", color: "#dc2626", bg: "#fef2f2" },
    medium: { label: "Medium", color: "#d97706", bg: "#fffbeb" },
    low: { label: "Low", color: "#2563eb", bg: "#eff6ff" },
};

const filterTabs = [
    { key: "all", label: "All" },
    { key: "discussion", label: "Discussions" },
    { key: "chat", label: "Chat" },
];

function AdminModeration() {
    const [items, setItems] = useState(sampleFlagged);
    const [filter, setFilter] = useState("all");

    const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

    const approveItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
    const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

    return (
        <>
            <div className="admin-page-header">
                <h1>Content Moderation</h1>
                <p>Review and manage flagged content across the platform.</p>
            </div>

            <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <div className="admin-stat-card">
                    <div className="admin-stat-icon" style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)" }}>
                        <AlertTriangle size={18} color="#fff" />
                    </div>
                    <div>
                        <p className="admin-stat-value">{items.filter((i) => i.severity === "high").length}</p>
                        <p className="admin-stat-label">High Severity</p>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-icon" style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)" }}>
                        <Shield size={18} color="#fff" />
                    </div>
                    <div>
                        <p className="admin-stat-value">{items.filter((i) => i.severity === "medium").length}</p>
                        <p className="admin-stat-label">Medium Severity</p>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-icon" style={{ background: "linear-gradient(135deg, #2563eb, #3b82f6)" }}>
                        <FileText size={18} color="#fff" />
                    </div>
                    <div>
                        <p className="admin-stat-value">{items.length}</p>
                        <p className="admin-stat-label">Total Flagged</p>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2 style={{ margin: 0 }}>Flagged Content</h2>
                    <div className="admin-tabs" style={{ marginBottom: 0 }}>
                        {filterTabs.map((tab) => (
                            <button
                                key={tab.key}
                                className={`admin-tab ${filter === tab.key ? "active" : ""}`}
                                onClick={() => setFilter(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#94a3b8", padding: "2rem 0" }}>No flagged content to review. 🎉</p>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Content</th>
                                    <th>User</th>
                                    <th>Source</th>
                                    <th>Severity</th>
                                    <th>Time</th>
                                    <th style={{ width: 140 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item) => {
                                    const sev = severityConfig[item.severity];
                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <p style={{ margin: 0, fontSize: ".84rem", color: "#1e293b", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {item.content}
                                                </p>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>@{item.user}</td>
                                            <td>
                                                <span className="admin-badge" style={{ background: "#f1f5f9", color: "#475569" }}>
                                                    {item.type === "chat" ? <MessageSquare size={10} /> : <FileText size={10} />}
                                                    {item.course}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="admin-badge" style={{ background: sev.bg, color: sev.color }}>
                                                    {sev.label}
                                                </span>
                                            </td>
                                            <td style={{ whiteSpace: "nowrap", fontSize: ".78rem", color: "#94a3b8" }}>{item.time}</td>
                                            <td>
                                                <div style={{ display: "flex", gap: ".3rem" }}>
                                                    <button className="admin-btn admin-btn-success" onClick={() => approveItem(item.id)} title="Approve">
                                                        <CheckCircle size={13} />
                                                    </button>
                                                    <button className="admin-btn admin-btn-danger" onClick={() => removeItem(item.id)} title="Remove">
                                                        <XCircle size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

export default AdminModeration;
