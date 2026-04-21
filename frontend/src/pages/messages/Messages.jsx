import React, { useState, useEffect, useRef } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { MessageSquare, Search, Send, User, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { messageService } from "../../api/message.service";
import { adminService } from "../../api/admin.service";
import "./Messages.css";

function Messages() {
    const [conversations, setConversations] = useState([]);
    const [selectedPartnerId, setSelectedPartnerId] = useState(null);
    const [thread, setThread] = useState([]);
    const [search, setSearch] = useState("");
    const [replyText, setReplyText] = useState("");
    const [loading, setLoading] = useState(true);
    const [threadLoading, setThreadLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [showCompose, setShowCompose] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [composeRecipient, setComposeRecipient] = useState("");
    const [composeSubject, setComposeSubject] = useState("");
    const [composeBody, setComposeBody] = useState("");
    const chatEndRef = useRef(null);

    const myId = localStorage.getItem("id");
    const myRole = localStorage.getItem("role");

    useEffect(() => {
        loadInbox();
    }, []);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [thread]);

    const loadInbox = async () => {
        setLoading(true);
        if (!myId) { setLoading(false); return; }

        // Fetch received + sent and merge into conversation list
        const [inboxRes, sentRes] = await Promise.all([
            messageService.getInbox(myId),
            messageService.getSentMessages(),
        ]);

        const allMsgs = [
            ...((inboxRes.success ? inboxRes.data : []) || []),
            ...((sentRes.success ? sentRes.data : []) || []),
        ];

        // Group by conversation partner
        const partnerMap = {};
        allMsgs.forEach((msg) => {
            const partnerId = msg.senderId === myId ? msg.receiverId : msg.senderId;
            const partnerName = msg.senderId === myId ? msg.receiverName : msg.senderName;
            const partnerEmail = msg.senderId === myId ? msg.receiverEmail : msg.senderEmail;

            if (!partnerMap[partnerId]) {
                partnerMap[partnerId] = {
                    partnerId,
                    partnerName: partnerName || partnerEmail,
                    partnerEmail,
                    lastMessage: msg.content,
                    lastSubject: msg.subject,
                    lastTime: msg.sentAt,
                    unread: 0,
                    avatar: (partnerName || "?").charAt(0).toUpperCase(),
                };
            }

            // Check if this message is newer
            const existingTime = parseTime(partnerMap[partnerId].lastTime);
            const thisTime = parseTime(msg.sentAt);
            if (thisTime > existingTime) {
                partnerMap[partnerId].lastMessage = msg.content;
                partnerMap[partnerId].lastSubject = msg.subject;
                partnerMap[partnerId].lastTime = msg.sentAt;
            }

            if (msg.receiverId === myId && msg.status === "UNREAD") {
                partnerMap[partnerId].unread++;
            }
        });

        const sorted = Object.values(partnerMap).sort(
            (a, b) => parseTime(b.lastTime) - parseTime(a.lastTime)
        );
        setConversations(sorted);
        setLoading(false);
    };

    const parseTime = (sentAt) => {
        if (!sentAt) return 0;
        if (Array.isArray(sentAt)) {
            const [y, mo, d, h = 0, mi = 0, s = 0] = sentAt;
            return new Date(y, mo - 1, d, h, mi, s).getTime();
        }
        return new Date(sentAt).getTime();
    };

    const formatTime = (sentAt) => {
        if (!sentAt) return "";
        try {
            const ts = parseTime(sentAt);
            const date = new Date(ts);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 1) return "Just now";
            if (diffMins < 60) return `${diffMins}m ago`;
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours}h ago`;
            const diffDays = Math.floor(diffHours / 24);
            if (diffDays < 7) return `${diffDays}d ago`;
            return date.toLocaleDateString();
        } catch { return ""; }
    };

    const formatMessageTime = (sentAt) => {
        const ts = parseTime(sentAt);
        if (!ts) return "";
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
            " · " + d.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    const loadConversation = async (partnerId) => {
        setSelectedPartnerId(partnerId);
        setShowCompose(false);
        setThreadLoading(true);
        const res = await messageService.getConversation(myId, partnerId);
        if (res.success) {
            setThread(res.data || []);
            // Mark unread messages as read
            const unread = (res.data || []).filter(
                (m) => m.receiverId === myId && m.status === "UNREAD"
            );
            for (const m of unread) {
                await messageService.markAsRead(m.messageId);
            }
            if (unread.length > 0) {
                setConversations((prev) =>
                    prev.map((c) =>
                        c.partnerId === partnerId ? { ...c, unread: 0 } : c
                    )
                );
            }
        }
        setThreadLoading(false);
    };

    const handleReply = async () => {
        if (!replyText.trim() || !selectedPartnerId) return;
        setSending(true);
        const convo = conversations.find((c) => c.partnerId === selectedPartnerId);
        const subject = thread.length > 0 ? thread[0].subject : "Message";
        const res = await messageService.sendMessage(selectedPartnerId, subject, replyText.trim());
        if (res.success) {
            setReplyText("");
            await loadConversation(selectedPartnerId);
            await loadInbox();
        }
        setSending(false);
    };

    const handleCompose = async () => {
        if (!composeRecipient || !composeSubject.trim() || !composeBody.trim()) return;
        setSending(true);
        const res = await messageService.sendMessage(composeRecipient, composeSubject.trim(), composeBody.trim());
        if (res.success) {
            setComposeRecipient("");
            setComposeSubject("");
            setComposeBody("");
            setShowCompose(false);
            await loadInbox();
            loadConversation(composeRecipient);
        }
        setSending(false);
    };

    const openCompose = async () => {
        setShowCompose(true);
        setSelectedPartnerId(null);
        if (allUsers.length === 0) {
            // Load user list for recipient selection
            try {
                const res = await adminService.getAllUsers();
                if (res.success) {
                    setAllUsers((res.data || []).filter((u) => u.id !== myId));
                }
            } catch {
                // If not admin, they can only message admins — we'll filter
            }
        }
    };

    const selectedConvo = conversations.find((c) => c.partnerId === selectedPartnerId);
    const filtered = search
        ? conversations.filter((c) =>
            c.partnerName.toLowerCase().includes(search.toLowerCase()) ||
            c.partnerEmail.toLowerCase().includes(search.toLowerCase())
        )
        : conversations;

    return (
        <div className="msg-page">
            <Navbar page="messages" />
            <div className="msg-container">
                <div className="msg-header">
                    <MessageSquare size={22} color="#2563eb" />
                    <h1>Messages</h1>
                </div>
                <p className="msg-subtitle">Communicate with admins and instructors.</p>

                <div className="msg-layout">
                    {/* Sidebar */}
                    <div className="msg-sidebar">
                        <div className="msg-search-wrap">
                            <div className="msg-search-box">
                                <Search size={14} color="#94a3b8" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search conversations..."
                                />
                            </div>
                            <button className="msg-new-btn" onClick={openCompose}>
                                <Plus size={14} /> New
                            </button>
                        </div>
                        <div className="msg-convo-list">
                            {loading ? (
                                <p className="msg-empty-list">Loading...</p>
                            ) : filtered.length === 0 ? (
                                <p className="msg-empty-list">No conversations yet</p>
                            ) : (
                                filtered.map((c) => (
                                    <button
                                        key={c.partnerId}
                                        className={`msg-convo-btn ${selectedPartnerId === c.partnerId ? "active" : ""}`}
                                        onClick={() => loadConversation(c.partnerId)}
                                    >
                                        <div className="msg-avatar">{c.avatar}</div>
                                        <div className="msg-convo-info">
                                            <div className="msg-convo-top">
                                                <p className="msg-convo-name">{c.partnerName}</p>
                                                <span className="msg-convo-time">{formatTime(c.lastTime)}</span>
                                            </div>
                                            <div className="msg-convo-bottom">
                                                <p className="msg-convo-preview">
                                                    {c.lastMessage && c.lastMessage.length > 40
                                                        ? c.lastMessage.substring(0, 40) + "..."
                                                        : c.lastMessage}
                                                </p>
                                                {c.unread > 0 && (
                                                    <span className="msg-unread-badge">{c.unread}</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat area */}
                    <div className="msg-chat">
                        {showCompose ? (
                            /* Compose new message */
                            <div className="msg-compose">
                                <div className="msg-chat-header">
                                    <button className="msg-back-btn" onClick={() => setShowCompose(false)}>
                                        <ArrowLeft size={16} />
                                    </button>
                                    <p className="msg-chat-header-name">New Message</p>
                                </div>
                                <div className="msg-compose-form">
                                    <div className="msg-compose-field">
                                        <label>To</label>
                                        <select
                                            value={composeRecipient}
                                            onChange={(e) => setComposeRecipient(e.target.value)}
                                        >
                                            <option value="">Select recipient...</option>
                                            {allUsers.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.username || u.email} ({u.role === "ADMIN" ? "Admin" : "Student"})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="msg-compose-field">
                                        <label>Subject</label>
                                        <input
                                            value={composeSubject}
                                            onChange={(e) => setComposeSubject(e.target.value)}
                                            placeholder="Message subject..."
                                        />
                                    </div>
                                    <div className="msg-compose-field">
                                        <label>Message</label>
                                        <textarea
                                            value={composeBody}
                                            onChange={(e) => setComposeBody(e.target.value)}
                                            placeholder="Write your message..."
                                            rows={5}
                                        />
                                    </div>
                                    <button
                                        className="msg-send-btn"
                                        onClick={handleCompose}
                                        disabled={sending || !composeRecipient || !composeSubject.trim() || !composeBody.trim()}
                                    >
                                        {sending ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                                        {sending ? "Sending..." : "Send Message"}
                                    </button>
                                </div>
                            </div>
                        ) : selectedConvo ? (
                            /* Conversation thread */
                            <>
                                <div className="msg-chat-header">
                                    <button className="msg-back-btn msg-back-mobile" onClick={() => setSelectedPartnerId(null)}>
                                        <ArrowLeft size={16} />
                                    </button>
                                    <div className="msg-chat-header-avatar">{selectedConvo.avatar}</div>
                                    <div>
                                        <p className="msg-chat-header-name">{selectedConvo.partnerName}</p>
                                        <p className="msg-chat-header-role">{selectedConvo.partnerEmail}</p>
                                    </div>
                                </div>
                                <div className="msg-chat-body">
                                    {threadLoading ? (
                                        <p className="msg-chat-placeholder">Loading conversation...</p>
                                    ) : thread.length === 0 ? (
                                        <p className="msg-chat-placeholder">No messages yet.</p>
                                    ) : (
                                        <div className="msg-thread">
                                            {thread.map((m) => (
                                                <div
                                                    key={m.messageId}
                                                    className={`msg-bubble ${m.senderId === myId ? "sent" : "received"}`}
                                                >
                                                    <p className="msg-bubble-text">{m.content}</p>
                                                    <span className="msg-bubble-time">{formatMessageTime(m.sentAt)}</span>
                                                </div>
                                            ))}
                                            <div ref={chatEndRef} />
                                        </div>
                                    )}
                                </div>
                                <div className="msg-input-bar">
                                    <input
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type a message..."
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleReply();
                                            }
                                        }}
                                    />
                                    <button
                                        className="msg-send-btn"
                                        onClick={handleReply}
                                        disabled={sending || !replyText.trim()}
                                    >
                                        {sending ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                                        Send
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* Empty state */
                            <div className="msg-chat-empty">
                                <User size={40} className="msg-chat-empty-icon" />
                                <p>Select a conversation or start a new one</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default Messages;
