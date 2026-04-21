import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Megaphone } from "lucide-react";
import { announcementService } from "../../api/announcement.service";
import { message } from "antd";

function AdminAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ title: "", body: "" });

    const fetchAnnouncements = async () => {
        const res = await announcementService.getAllAnnouncements();
        if (res.success) {
            setAnnouncements(res.data);
        } else {
            message.error(res.error);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const openCreate = () => {
        setEditing("new");
        setForm({ title: "", body: "" });
    };

    const openEdit = (a) => {
        setEditing(a.id);
        setForm({ title: a.title, body: a.body });
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.body.trim()) {
            message.warning("Title and body are required");
            return;
        }

        if (editing === "new") {
            const res = await announcementService.createAnnouncement({ ...form, published: false });
            if (res.success) {
                message.success("Announcement created");
                fetchAnnouncements();
            } else {
                message.error(res.error);
            }
        } else {
            const res = await announcementService.updateAnnouncement(editing, { ...form });
            if (res.success) {
                message.success("Announcement updated");
                fetchAnnouncements();
            } else {
                message.error(res.error);
            }
        }
        setEditing(null);
        setForm({ title: "", body: "" });
    };

    const togglePublish = async (id) => {
        const res = await announcementService.togglePublish(id);
        if (res.success) {
            message.success("Status updated");
            fetchAnnouncements();
        } else {
            message.error(res.error);
        }
    };

    const deleteAnnouncement = async (id) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;

        const res = await announcementService.deleteAnnouncement(id);
        if (res.success) {
            message.success("Announcement deleted");
            fetchAnnouncements();
        } else {
            message.error(res.error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

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
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <h2 style={{ margin: 0 }}>All Announcements</h2>
                    <button className="admin-btn admin-btn-primary" onClick={openCreate}>
                        <Plus size={14} /> New Announcement
                    </button>
                </div>

                {announcements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-12 text-slate-400">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                            <Megaphone size={22} />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-600 m-0">No announcements yet</h3>
                        <p className="text-xs text-slate-400 mt-1 m-0">Create your first announcement to notify users.</p>
                    </div>
                ) : (
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
                                        <td style={{ whiteSpace: "nowrap" }}>{formatDate(a.date)}</td>
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
                )}
            </div>
        </>
    );
}

export default AdminAnnouncements;
