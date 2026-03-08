import React, { useState } from "react";
import Navbar from "../../Components/common/Navbar";
import { MessageSquare, Search, Send, User } from "lucide-react";
import "./Messages.css";

const sampleConversations = [
    { id: 1, name: "Prof. Sarah Chen", role: "Instructor", lastMessage: "Great job on the assignment! I've...", time: "2h ago", unread: 2, avatar: "SC" },
    { id: 2, name: "Study Group — DSA", role: "Group", lastMessage: "Can someone explain binary search...", time: "5h ago", unread: 5, avatar: "SG" },
    { id: 3, name: "Admin Office", role: "Admin", lastMessage: "Your enrollment has been confirmed.", time: "1d ago", unread: 0, avatar: "AO" },
    { id: 4, name: "John Doe", role: "Student", lastMessage: "Hey, want to join a collab room later?", time: "2d ago", unread: 0, avatar: "JD" },
];

function Messages() {
    const [selectedId, setSelectedId] = useState(null);
    const [search, setSearch] = useState("");

    const selected = sampleConversations.find((c) => c.id === selectedId);
    const filtered = search
        ? sampleConversations.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
        : sampleConversations;

    return (
        <div className="msg-page">
            <Navbar page="messages" />
            <div className="msg-container">
                <div className="msg-header">
                    <MessageSquare size={22} color="#2563eb" />
                    <h1>Messages</h1>
                </div>
                <p className="msg-subtitle">Communicate with instructors and fellow students.</p>

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
                        </div>
                        <div className="msg-convo-list">
                            {filtered.map((c) => (
                                <button
                                    key={c.id}
                                    className={`msg-convo-btn ${selectedId === c.id ? "active" : ""}`}
                                    onClick={() => setSelectedId(c.id)}
                                >
                                    <div className="msg-avatar">{c.avatar}</div>
                                    <div className="msg-convo-info">
                                        <div className="msg-convo-top">
                                            <p className="msg-convo-name">{c.name}</p>
                                            <span className="msg-convo-time">{c.time}</span>
                                        </div>
                                        <div className="msg-convo-bottom">
                                            <p className="msg-convo-preview">{c.lastMessage}</p>
                                            {c.unread > 0 && (
                                                <span className="msg-unread-badge">{c.unread}</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat area */}
                    <div className="msg-chat">
                        {selected ? (
                            <>
                                <div className="msg-chat-header">
                                    <div className="msg-chat-header-avatar">{selected.avatar}</div>
                                    <div>
                                        <p className="msg-chat-header-name">{selected.name}</p>
                                        <p className="msg-chat-header-role">{selected.role}</p>
                                    </div>
                                </div>
                                <div className="msg-chat-body">
                                    <p className="msg-chat-placeholder">Messages will appear here once connected to the messaging service.</p>
                                </div>
                                <div className="msg-input-bar">
                                    <input placeholder="Type a message..." />
                                    <button className="msg-send-btn">
                                        <Send size={14} /> Send
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="msg-chat-empty">
                                <User size={40} className="msg-chat-empty-icon" />
                                <p>Select a conversation to start messaging</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Messages;
