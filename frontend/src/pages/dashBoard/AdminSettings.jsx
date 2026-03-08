import React, { useState } from "react";
import { Save, Globe, Bell, Lock, UserPlus } from "lucide-react";

function AdminSettings() {
    const [platformName, setPlatformName] = useState("EduVerse");
    const [supportEmail, setSupportEmail] = useState("support@eduverse.com");
    const [toggles, setToggles] = useState({
        emailNotifs: true,
        enrollmentNotifs: true,
        assignmentReminders: true,
        openRegistration: true,
        requireEmailVerify: true,
        twoFactorAuth: false,
        sessionTimeout: true,
    });

    const toggle = (key) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

    const ToggleBtn = ({ k }) => (
        <button
            className={`admin-toggle ${toggles[k] ? "on" : "off"}`}
            onClick={() => toggle(k)}
        />
    );

    return (
        <>
            <div className="admin-page-header">
                <h1>System Settings</h1>
                <p>Configure platform-wide settings and preferences.</p>
            </div>

            {/* Platform Settings */}
            <div className="admin-card">
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: "1rem" }}>
                    <Globe size={18} color="#2563eb" />
                    <h2 style={{ margin: 0 }}>Platform Settings</h2>
                </div>
                <div className="admin-form-row">
                    <div className="admin-form-group">
                        <label>Platform Name</label>
                        <input value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
                    </div>
                    <div className="admin-form-group">
                        <label>Support Email</label>
                        <input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                    </div>
                </div>
                <button className="admin-btn admin-btn-primary">
                    <Save size={14} /> Save Changes
                </button>
            </div>

            {/* Email Notifications */}
            <div className="admin-card">
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".5rem" }}>
                    <Bell size={18} color="#d97706" />
                    <h2 style={{ margin: 0 }}>Email Notifications</h2>
                </div>
                <div className="admin-setting-row">
                    <div>
                        <div className="admin-setting-label">Email Notifications</div>
                        <div className="admin-setting-desc">Send email notifications when there are important updates</div>
                    </div>
                    <ToggleBtn k="emailNotifs" />
                </div>
                <div className="admin-setting-row">
                    <div>
                        <div className="admin-setting-label">Enrollment Notifications</div>
                        <div className="admin-setting-desc">Notify students when they are enrolled in a new course</div>
                    </div>
                    <ToggleBtn k="enrollmentNotifs" />
                </div>
                <div className="admin-setting-row">
                    <div>
                        <div className="admin-setting-label">Assignment Reminders</div>
                        <div className="admin-setting-desc">Send reminders before assignment due dates</div>
                    </div>
                    <ToggleBtn k="assignmentReminders" />
                </div>
            </div>

            {/* User Registration */}
            <div className="admin-card">
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".5rem" }}>
                    <UserPlus size={18} color="#059669" />
                    <h2 style={{ margin: 0 }}>User Registration</h2>
                </div>
                <div className="admin-setting-row">
                    <div>
                        <div className="admin-setting-label">Open Registration</div>
                        <div className="admin-setting-desc">Allow new users to register on the platform</div>
                    </div>
                    <ToggleBtn k="openRegistration" />
                </div>
                <div className="admin-setting-row">
                    <div>
                        <div className="admin-setting-label">Require Email Verification</div>
                        <div className="admin-setting-desc">New users must verify their email before accessing courses</div>
                    </div>
                    <ToggleBtn k="requireEmailVerify" />
                </div>
            </div>

            {/* Security */}
            <div className="admin-card">
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".5rem" }}>
                    <Lock size={18} color="#dc2626" />
                    <h2 style={{ margin: 0 }}>Security Settings</h2>
                </div>
                <div className="admin-setting-row">
                    <div>
                        <div className="admin-setting-label">Two-Factor Authentication</div>
                        <div className="admin-setting-desc">Require 2FA for admin accounts</div>
                    </div>
                    <ToggleBtn k="twoFactorAuth" />
                </div>
                <div className="admin-setting-row">
                    <div>
                        <div className="admin-setting-label">Auto Session Timeout</div>
                        <div className="admin-setting-desc">Automatically log out inactive users after 30 minutes</div>
                    </div>
                    <ToggleBtn k="sessionTimeout" />
                </div>
            </div>
        </>
    );
}

export default AdminSettings;
