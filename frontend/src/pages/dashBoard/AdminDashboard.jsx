import { useState } from "react";
import Courses from "./DCourses";
import Dashboard from "./Dashboard";
import SideBar from "./SideBar";
import Users from "./DUsers";
import AdminMessages from "./AdminMessages";
import AdminAnnouncements from "./AdminAnnouncements";
import AdminModeration from "./AdminModeration";
import AdminAnalytics from "./AdminAnalytics";
import AdminSettings from "./AdminSettings";
import { authService } from "../../api/auth.service";
import "./AdminPanel.css";

function AdminDashboard() {
  const [current, setCurrent] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAdminAuthenticated());
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const renderContent = () => {
    switch (current) {
      case "dashboard":
        return <Dashboard isAuthenticated={isAuthenticated} />;
      case "user":
        return <Users />;
      case "courses":
        return <Courses />;
      case "messages":
        return <AdminMessages />;
      case "announcements":
        return <AdminAnnouncements />;
      case "moderation":
        return <AdminModeration />;
      case "analytics":
        return <AdminAnalytics />;
      case "settings":
        return <AdminSettings />;
      default:
        return <Dashboard isAuthenticated={isAuthenticated} />;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const result = await authService.login(username, password);

    if (result.success && result.user.role === "ROLE_ADMIN") {
      setIsAuthenticated(true);
      setError("");
    } else if (result.success && result.user.role !== "ROLE_ADMIN") {
      setError("You are not authorized as admin.");
    } else {
      setError(result.error || "Invalid username or password");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <SideBar current={current} onSelect={setCurrent} />
      <div className="admin-main">
        <div className="admin-main-inner">{renderContent()}</div>
      </div>

      {!isAuthenticated && (
        <div className="admin-login-overlay">
          <div className="admin-login-card">
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin} className="admin-login-form">
              <div className="admin-login-field">
                <label>Email</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div className="admin-login-field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              {error && <p className="admin-login-error">{error}</p>}
              <button type="submit" className="admin-login-submit">
                Sign In
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
