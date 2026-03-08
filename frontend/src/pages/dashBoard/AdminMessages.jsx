import React, { useState } from "react";
import { Send, Users, UserCheck, Radio, Mail, Clock } from "lucide-react";

const recipientOptions = [
    { key: "all-students", label: "All Students", icon: Users },
    { key: "all-teachers", label: "All Teachers", icon: UserCheck },
    { key: "broadcast", label: "Broadcast (Everyone)", icon: Radio },
    { key: "individual", label: "Individual User", icon: Mail },
];

const sampleSentMessages = [
    { id: 1, subject: "Assignment Deadline Reminder", recipient: "All Students", time: "2 hours ago", preview: "Please remember to submit your assignments before the deadline on March 15..." },
    { id: 2, subject: "New Course Available", recipient: "Broadcast", time: "1 day ago", preview: "We are excited to announce a new Machine Learning course is now available..." },
    { id: 3, subject: "System Maintenance Notice", recipient: "Broadcast", time: "3 days ago", preview: "Scheduled maintenance on Sunday 2am–4am UTC. The platform will be briefly unavailable..." },
    { id: 4, subject: "Grading Update", recipient: "All Teachers", time: "5 days ago", preview: "Please ensure all grades are submitted by end of the week..." },
];

function AdminMessages() {
    const [recipient, setRecipient] = useState("all-students");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [individualEmail, setIndividualEmail] = useState("");

    const handleSend = () => {
        if (!subject.trim() || !body.trim()) return;
        alert(`Message sent to: ${recipient}\nSubject: ${subject}`);
        setSubject("");
        setBody("");
        setIndividualEmail("");
    };

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
                            <input
                                type="email"
                                placeholder="student@eduverse.com"
                                value={individualEmail}
                                onChange={(e) => setIndividualEmail(e.target.value)}
                            />
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

                    <button className="admin-btn admin-btn-primary" onClick={handleSend}>
                        <Send size={14} /> Send Message
                    </button>
                </div>

                {/* Sent Messages */}
                <div className="admin-card">
                    <h2>Sent Messages</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
                        {sampleSentMessages.map((m) => (
                            <div
                                key={m.id}
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
                                        <Clock size={10} /> {m.time}
                                    </span>
                                </div>
                                <span className="admin-badge" style={{ background: "#eff6ff", color: "#2563eb", margin: ".3rem 0" }}>
                                    {m.recipient}
                                </span>
                                <p style={{ margin: ".3rem 0 0", fontSize: ".78rem", color: "#64748b", lineHeight: 1.4 }}>{m.preview}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export default AdminMessages;
