import React, { useState, useEffect, useRef } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { MessageSquare, Search, Send, User, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { messageService } from "../../api/message.service";
import { adminService } from "../../api/admin.service";

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

        const [inboxRes, sentRes] = await Promise.all([
            messageService.getInbox(myId),
            messageService.getSentMessages(),
        ]);

        const allMsgs = [
            ...((inboxRes.success ? inboxRes.data : []) || []),
            ...((sentRes.success ? sentRes.data : []) || []),
        ];

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
            try {
                const res = await adminService.getAllUsers();
                if (res.success) {
                    setAllUsers((res.data || []).filter((u) => u.id !== myId));
                }
            } catch {
                // ignore
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

    const inputCls = "w-full h-10 px-3 border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1";
    const labelCls = "text-sm font-medium text-slate-700 mb-1.5 block";

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar page="messages" />
            <div className="max-w-container-xl mx-auto px-6 py-6 lg:py-8">
                <div className="flex items-center gap-2">
                    <MessageSquare size={22} className="text-primary" />
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Messages</h1>
                </div>
                <p className="mt-1 text-sm text-slate-500">Communicate with admins and instructors.</p>

                <div className="mt-6 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-[560px]">
                        {/* Sidebar */}
                        <div className={`border-r border-slate-200 flex flex-col ${selectedPartnerId || showCompose ? 'hidden md:flex' : 'flex'}`}>
                            <div className="p-4 border-b border-slate-200 space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search conversations..."
                                            className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                                        />
                                    </div>
                                    <button
                                        className="inline-flex items-center gap-1 bg-primary text-white font-semibold text-sm rounded-md px-3 h-10 hover:bg-primary-dark transition-colors"
                                        onClick={openCompose}
                                    >
                                        <Plus size={14} /> New
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {loading ? (
                                    <p className="p-6 text-sm text-slate-500 text-center">Loading...</p>
                                ) : filtered.length === 0 ? (
                                    <p className="p-6 text-sm text-slate-500 text-center">No conversations yet</p>
                                ) : (
                                    filtered.map((c) => (
                                        <button
                                            key={c.partnerId}
                                            className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 flex items-start gap-3 transition-colors ${
                                                selectedPartnerId === c.partnerId ? "bg-primary/5" : ""
                                            }`}
                                            onClick={() => loadConversation(c.partnerId)}
                                        >
                                            <div className="w-10 h-10 bg-primary text-white font-semibold rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                                                {c.avatar}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">{c.partnerName}</p>
                                                    <span className="text-xs text-slate-500 whitespace-nowrap flex-shrink-0">{formatTime(c.lastTime)}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2 mt-1">
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {c.lastMessage && c.lastMessage.length > 40
                                                            ? c.lastMessage.substring(0, 40) + "..."
                                                            : c.lastMessage}
                                                    </p>
                                                    {c.unread > 0 && (
                                                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-primary text-white text-xs font-semibold rounded-full">
                                                            {c.unread}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Chat area */}
                        <div className={`flex flex-col ${selectedPartnerId || showCompose ? 'flex' : 'hidden md:flex'}`}>
                            {showCompose ? (
                                <>
                                    <div className="flex items-center gap-3 p-4 border-b border-slate-200">
                                        <button
                                            className="p-2 rounded-md hover:bg-slate-100 text-slate-600"
                                            onClick={() => setShowCompose(false)}
                                        >
                                            <ArrowLeft size={16} />
                                        </button>
                                        <p className="text-base font-semibold text-slate-900">New Message</p>
                                    </div>
                                    <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                                        <div>
                                            <label className={labelCls}>To</label>
                                            <select
                                                value={composeRecipient}
                                                onChange={(e) => setComposeRecipient(e.target.value)}
                                                className={inputCls}
                                            >
                                                <option value="">Select recipient...</option>
                                                {allUsers.map((u) => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.username || u.email} ({u.role === "ADMIN" ? "Admin" : "Student"})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Subject</label>
                                            <input
                                                value={composeSubject}
                                                onChange={(e) => setComposeSubject(e.target.value)}
                                                placeholder="Message subject..."
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Message</label>
                                            <textarea
                                                value={composeBody}
                                                onChange={(e) => setComposeBody(e.target.value)}
                                                placeholder="Write your message..."
                                                rows={6}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 resize-none"
                                            />
                                        </div>
                                        <button
                                            className="inline-flex items-center gap-2 bg-primary text-white font-semibold rounded-md px-4 py-2 hover:bg-primary-dark disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                                            onClick={handleCompose}
                                            disabled={sending || !composeRecipient || !composeSubject.trim() || !composeBody.trim()}
                                        >
                                            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                            {sending ? "Sending..." : "Send Message"}
                                        </button>
                                    </div>
                                </>
                            ) : selectedConvo ? (
                                <>
                                    <div className="flex items-center gap-3 p-4 border-b border-slate-200">
                                        <button
                                            className="p-2 rounded-md hover:bg-slate-100 text-slate-600 md:hidden"
                                            onClick={() => setSelectedPartnerId(null)}
                                        >
                                            <ArrowLeft size={16} />
                                        </button>
                                        <div className="w-10 h-10 bg-primary text-white font-semibold rounded-full flex items-center justify-center text-sm">
                                            {selectedConvo.avatar}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 truncate">{selectedConvo.partnerName}</p>
                                            <p className="text-xs text-slate-500 truncate">{selectedConvo.partnerEmail}</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                                        {threadLoading ? (
                                            <p className="text-center text-sm text-slate-500 py-8">Loading conversation...</p>
                                        ) : thread.length === 0 ? (
                                            <p className="text-center text-sm text-slate-500 py-8">No messages yet.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {thread.map((m) => {
                                                    const sent = m.senderId === myId;
                                                    return (
                                                        <div
                                                            key={m.messageId}
                                                            className={`flex ${sent ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                            <div
                                                                className={`max-w-[75%] px-4 py-2 rounded-lg ${
                                                                    sent
                                                                        ? 'bg-primary text-white rounded-br-sm'
                                                                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                                                                }`}
                                                            >
                                                                <p className="text-sm">{m.content}</p>
                                                                <span className={`block text-[10px] mt-1 ${sent ? 'text-white/70' : 'text-slate-400'}`}>
                                                                    {formatMessageTime(m.sentAt)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div ref={chatEndRef} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 p-4 border-t border-slate-200 bg-white">
                                        <input
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Type a message..."
                                            className={`flex-1 ${inputCls}`}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleReply();
                                                }
                                            }}
                                        />
                                        <button
                                            className="inline-flex items-center gap-2 bg-primary text-white font-semibold rounded-md px-4 h-10 hover:bg-primary-dark disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                                            onClick={handleReply}
                                            disabled={sending || !replyText.trim()}
                                        >
                                            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                            Send
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center flex-1 text-center p-12">
                                    <User size={40} className="text-slate-300 mb-2" />
                                    <h3 className="text-base font-semibold text-slate-900">No conversation selected</h3>
                                    <p className="text-sm text-slate-500 mt-1">Pick a conversation or start a new one.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default Messages;
