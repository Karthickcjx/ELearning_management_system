import React, { useState } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";

const initialAnnouncements = [
    { id: 1, title: "Platform Maintenance Scheduled", body: "Scheduled downtime on Sunday 2am–4am UTC for server upgrades.", published: true, date: "Mar 8, 2026" },
    { id: 2, title: "New AI-Powered Features Released", body: "Check out the AI Moderator and Roadmap Planner in your rooms.", published: true, date: "Mar 7, 2026" },
    { id: 3, title: "Certificate Downloads Now Available", body: "Completed course certificates can now be downloaded from the course page.", published: false, date: "Mar 5, 2026" },
    { id: 4, title: "Registration Opens for Spring Semester", body: "Students can now enroll in Spring 2026 courses. Early bird discount available until March 20.", published: false, date: "Mar 3, 2026" },
];

function AdminAnnouncements() {
    const [announcements, setAnnouncements] = useState(initialAnnouncements);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ title: "", body: "" });

    const openCreate = () => {
        setEditing("new");
        setForm({ title: "", body: "" });
    };

    const openEdit = (a) => {
        setEditing(a.id);
        setForm({ title: a.title, body: a.body });
    };

    const handleSave = () => {
        if (!form.title.trim()) return;
        if (editing === "new") {
            setAnnouncements((prev) => [
                { id: Date.now(), title: form.title, body: form.body, published: false, date: "Just now" },
                ...prev,
            ]);
        } else {
            setAnnouncements((prev) =>
                prev.map((a) => (a.id === editing ? { ...a, title: form.title, body: form.body } : a))
            );
        }
        setEditing(null);
        setForm({ title: "", body: "" });
    };

    const togglePublish = (id) =>
        setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, published: !a.published } : a)));

    const deleteAnnouncement = (id) =>
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));

    return (
        <>
            <div className="admin-page-header">
                <h1>Announcements</h1>
                <p>Create and manage platform-wide announcements.</p>
            </div>

            {editing !== null && (
                <div className="admin-card">
                    <h2>{editing === "new" ? "Create Announcement" : "Edit Announcement"}</h2>
                    <div className="admin-form-group">
                        <label>Title</label>
                        <input
                            placeholder="Announcement title"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </div>
                    <div className="admin-form-group">
                        <label>Body</label>
                        <textarea
                            placeholder="Announcement content..."
                            value={form.body}
                            onChange={(e) => setForm({ ...form, body: e.target.value })}
                            rows={4}
                        />
                    </div>
                    <div style={{ display: "flex", gap: ".5rem" }}>
                        <button className="admin-btn admin-btn-primary" onClick={handleSave}>Save</button>
                        <button className="admin-btn admin-btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                </div>
            )}

            <div className="admin-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2 style={{ margin: 0 }}>All Announcements</h2>
                    <button className="admin-btn admin-btn-primary" onClick={openCreate}>
                        <Plus size={14} /> New Announcement
                    </button>
                </div>

                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th style={{ width: 160 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {announcements.map((a) => (
                                <tr key={a.id}>
                                    <td>
                                        <p style={{ margin: 0, fontWeight: 600, color: "#1e293b" }}>{a.title}</p>
                                        <p style={{ margin: ".15rem 0 0", fontSize: ".76rem", color: "#94a3b8" }}>{a.body.substring(0, 80)}...</p>
                                    </td>
                                    <td style={{ whiteSpace: "nowrap" }}>{a.date}</td>
                                    <td>
                                        <span
                                            className="admin-badge"
                                            style={{
                                                background: a.published ? "#ecfdf5" : "#f1f5f9",
                                                color: a.published ? "#059669" : "#64748b",
                                            }}
                                        >
                                            {a.published ? "Published" : "Draft"}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", gap: ".3rem" }}>
                                            <button className="admin-btn admin-btn-secondary" onClick={() => togglePublish(a.id)} title={a.published ? "Unpublish" : "Publish"}>
                                                {a.published ? <EyeOff size={13} /> : <Eye size={13} />}
                                            </button>
                                            <button className="admin-btn admin-btn-secondary" onClick={() => openEdit(a)} title="Edit">
                                                <Edit2 size={13} />
                                            </button>
                                            <button className="admin-btn admin-btn-danger" onClick={() => deleteAnnouncement(a.id)} title="Delete">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

export default AdminAnnouncements;
