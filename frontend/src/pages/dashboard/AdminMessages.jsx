import React, { useState, useEffect } from "react";
import { Send, Users, UserCheck, Radio, Mail, Clock, Loader2 } from "lucide-react";
import { messageService } from "../../api/message.service";
import { adminService } from "../../api/admin.service";
import { message as antdMessage } from "antd";

function AdminMessages() {
    const [recipient, setRecipient] = useState("all-students");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [individualEmail, setIndividualEmail] = useState("");
    const [sentMessages, setSentMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [sentRes, usersRes] = await Promise.all([
            messageService.getSentMessages(),
            adminService.getAllUsers(),
        ]);
        if (sentRes.success) setSentMessages(sentRes.data || []);
        if (usersRes.success) setUsers(usersRes.data || []);
        setLoading(false);
    };

    const selectedUser = users.find((u) => u.email === individualEmail);

    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) {
            antdMessage.warning("Please fill in subject and message body.");
            return;
        }

        setSending(true);
        let result;

        if (recipient === "individual") {
            if (!selectedUser) {
                antdMessage.error("Please select a valid user email.");
                setSending(false);
                return;
            }
            result = await messageService.sendMessage(selectedUser.id, subject, body);
        } else {
            // broadcast for all-students, all-teachers, broadcast
            result = await messageService.broadcastMessage(subject, body);
        }

        if (result.success) {
            antdMessage.success(result.message || "Message sent successfully!");
            setSubject("");
            setBody("");
            setIndividualEmail("");
            // Refresh sent messages
            const sentRes = await messageService.getSentMessages();
            if (sentRes.success) setSentMessages(sentRes.data || []);
        } else {
            antdMessage.error(result.error || "Failed to send message.");
        }
        setSending(false);
    };

    const recipientOptions = [
        { key: "all-students", label: "All Students", icon: Users },
        { key: "all-teachers", label: "All Teachers", icon: UserCheck },
        { key: "broadcast", label: "Broadcast (Everyone)", icon: Radio },
        { key: "individual", label: "Individual User", icon: Mail },
    ];

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
            if (diffMins < 60) return `${diffMins}m ago`;
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours}h ago`;
            const diffDays = Math.floor(diffHours / 24);
            return `${diffDays}d ago`;
        } catch {
            return "";
        }
    };

    const studentEmails = users
        .filter((u) => u.role === "USER" || u.role === "ROLE_USER")
        .map((u) => u.email);

    return (
        <>
            <div className="admin-page-header">
                <h1>Messaging</h1>
                <p>Send messages to students, teachers, or the entire platform.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                {/* Compose */}
                <div className="admin-card">
                    <h2>Compose Message</h2>

                    <div className="admin-form-group">
                        <label>Recipient</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".4rem" }}>
                            {recipientOptions.map((opt) => (
                                <button
                                    key={opt.key}
                                    className={`admin-btn ${recipient === opt.key ? "admin-btn-primary" : "admin-btn-secondary"}`}
                                    onClick={() => setRecipient(opt.key)}
                                    style={{ justifyContent: "flex-start" }}
                                >
                                    <opt.icon size={14} /> {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {recipient === "individual" && (
                        <div className="admin-form-group">
                            <label>User Email</label>
                            <select
                                value={individualEmail}
                                onChange={(e) => setIndividualEmail(e.target.value)}
                            >
                                <option value="">Select a student...</option>
                                {studentEmails.map((email) => (
                                    <option key={email} value={email}>
                                        {email}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="admin-form-group">
                        <label>Subject</label>
                        <input
                            placeholder="Enter message subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    <div className="admin-form-group">
                        <label>Message Body</label>
                        <textarea
                            placeholder="Write your message here..."
                            rows={5}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        />
                    </div>

                    <button
                        className="admin-btn admin-btn-primary"
                        onClick={handleSend}
                        disabled={sending}
                    >
                        {sending ? (
                            <><Loader2 size={14} className="spin" /> Sending...</>
                        ) : (
                            <><Send size={14} /> Send Message</>
                        )}
                    </button>
                </div>

                {/* Sent Messages */}
                <div className="admin-card">
                    <h2>Sent Messages</h2>
                    {loading ? (
                        <p style={{ textAlign: "center", color: "#94a3b8", padding: "2rem 0" }}>Loading...</p>
                    ) : sentMessages.length === 0 ? (
                        <p style={{ textAlign: "center", color: "#94a3b8", padding: "2rem 0" }}>No messages sent yet.</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: ".6rem", maxHeight: "500px", overflowY: "auto" }}>
                            {sentMessages.map((m) => (
                                <div
                                    key={m.messageId}
                                    style={{
                                        padding: ".75rem .85rem",
                                        borderRadius: ".6rem",
                                        background: "#f8fafc",
                                        border: "1px solid #f1f5f9",
                                        transition: "background .12s",
                                        cursor: "default",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                        <p style={{ margin: 0, fontSize: ".88rem", fontWeight: 600, color: "#1e293b" }}>{m.subject}</p>
                                        <span style={{ fontSize: ".7rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: ".2rem" }}>
                                            <Clock size={10} /> {formatTime(m.sentAt)}
                                        </span>
                                    </div>
                                    <span className="admin-badge" style={{ background: "#eff6ff", color: "#2563eb", margin: ".3rem 0" }}>
                                        To: {m.receiverName || m.receiverEmail}
                                    </span>
                                    <p style={{ margin: ".3rem 0 0", fontSize: ".78rem", color: "#64748b", lineHeight: 1.4 }}>
                                        {m.content && m.content.length > 100 ? m.content.substring(0, 100) + "..." : m.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default AdminMessages;
