import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { message } from "antd";
import Navbar from "../../Components/common/Navbar";
import { profileService } from "../../api/profile.service";
import userFallbackImage from "../../assets/images/user.png";
import "./AccountSettings.css";

const SETTINGS_SECTIONS = [
  { key: "profile", label: "Profile" },
  { key: "photo", label: "Photo" },
  { key: "account-security", label: "Account Security" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "payment-methods", label: "Payment methods" },
  { key: "privacy", label: "Privacy" },
  { key: "notification-preferences", label: "Notification Preferences" },
  { key: "api-clients", label: "API clients" },
  { key: "close-account", label: "Close account" },
];

const SECTION_COPY = {
  profile: {
    title: "Public profile",
    subtitle: "Add information about yourself",
  },
  photo: {
    title: "Photo",
    subtitle: "Add a profile photo for your EduVerse account",
  },
  "account-security": {
    title: "Account",
    subtitle: "Edit your account settings and change your password here",
  },
  subscriptions: {
    title: "Subscriptions",
    subtitle: "Manage your EduVerse subscriptions",
  },
  "payment-methods": {
    title: "Payment methods",
    subtitle: "Manage your saved payment methods",
  },
  privacy: {
    title: "Privacy",
    subtitle: "Modify your privacy settings here",
  },
  "notification-preferences": {
    title: "Notification preferences",
    subtitle: "Manage the types of communications you receive",
  },
  "api-clients": {
    title: "API Clients",
    subtitle: "Create and list your API clients",
  },
  "close-account": {
    title: "Close Account",
    subtitle: "Close your account permanently",
  },
};

const DEFAULT_SECTION = "account-security";

const createUpdatePayload = (userDetails, overrides = {}) => ({
  username: userDetails?.username || "",
  email: userDetails?.email || "",
  dob: userDetails?.dob || "",
  mobileNumber: userDetails?.mobileNumber || "",
  gender: userDetails?.gender || "",
  location: userDetails?.location || "",
  profession: userDetails?.profession || "",
  linkedin_url: userDetails?.linkedin_url || "",
  github_url: userDetails?.github_url || "",
  ...overrides,
});

function AccountSettings() {
  const navigate = useNavigate();
  const { section } = useParams();
  const userId = localStorage.getItem("id");
  const fallbackName = (localStorage.getItem("name") || "Learner").trim();
  const fallbackEmail = localStorage.getItem("email") || "learner@eduverse.com";

  const [isLoading, setIsLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [profileImage, setProfileImage] = useState(localStorage.getItem("profileImage") || "");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [showSavedPaymentsOnCheckout, setShowSavedPaymentsOnCheckout] = useState(true);

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    headline: "",
    biography: "",
    language: "English (US)",
    linkedinUrl: "",
    githubUrl: "",
  });

  const [securityForm, setSecurityForm] = useState({
    email: fallbackEmail,
    newPassword: "",
    confirmPassword: "",
  });

  const [privacyForm, setPrivacyForm] = useState({
    showProfile: true,
    showCourses: true,
  });

  const [notificationForm, setNotificationForm] = useState({
    updatesEnabled: true,
    productLaunches: true,
    offersPromotions: true,
    learningEnabled: true,
    learningStats: true,
    inspiration: true,
    recommendations: true,
    instructorNotifications: true,
  });

  const validSectionKeys = useMemo(() => SETTINGS_SECTIONS.map((item) => item.key), []);
  const activeSection = validSectionKeys.includes(section || "") ? section : DEFAULT_SECTION;
  const sectionCopy = SECTION_COPY[activeSection];
  const displayName = userDetails?.username || fallbackName || "Learner";
  const displayEmail = userDetails?.email || fallbackEmail;

  useEffect(() => {
    if (!section) {
      navigate(`/account-settings/${DEFAULT_SECTION}`, { replace: true });
    }
  }, [navigate, section]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const [userRes, imageRes] = await Promise.all([
        profileService.getUserDetails(userId),
        profileService.getProfileImage(userId),
      ]);

      if (!isMounted) {
        return;
      }

      if (userRes.success && userRes.data) {
        const userData = userRes.data;
        const nameParts = (userData.username || fallbackName || "").trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ");

        setUserDetails(userData);
        setProfileForm((prev) => ({
          ...prev,
          firstName,
          lastName,
          headline: userData.profession || "",
          linkedinUrl: userData.linkedin_url || "",
          githubUrl: userData.github_url || "",
        }));

        setSecurityForm((prev) => ({
          ...prev,
          email: userData.email || fallbackEmail,
        }));
      }

      if (imageRes.success && imageRes.data) {
        setProfileImage(imageRes.data);
        localStorage.setItem("profileImage", imageRes.data);
      }

      setIsLoading(false);
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [fallbackEmail, fallbackName, userId]);

  useEffect(
    () => () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    },
    [photoPreview]
  );

  const goToSection = (nextSection) => {
    navigate(`/account-settings/${nextSection}`);
  };

  const handleProfileInput = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSecurityInput = (event) => {
    const { name, value } = event.target;
    setSecurityForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async () => {
    if (!userId || !userDetails) {
      message.error("Please login again to update your profile.");
      return;
    }

    const fullName = `${profileForm.firstName} ${profileForm.lastName}`.trim();
    if (!fullName) {
      message.error("First name is required.");
      return;
    }

    const payload = createUpdatePayload(userDetails, {
      username: fullName,
      profession: profileForm.headline,
      linkedin_url: profileForm.linkedinUrl,
      github_url: profileForm.githubUrl,
    });

    const response = await profileService.updateUser(userId, payload);
    if (!response.success) {
      message.error("Unable to update profile right now.");
      return;
    }

    setUserDetails((prev) => ({ ...prev, ...payload }));
    localStorage.setItem("name", fullName);
    message.success("Profile updated.");
  };

  const handlePhotoSelection = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    const preview = URL.createObjectURL(file);
    setSelectedPhoto(file);
    setPhotoPreview(preview);
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto || !userId) {
      message.warning("Choose an image before uploading.");
      return;
    }

    const uploadRes = await profileService.uploadProfileImage(userId, selectedPhoto);
    if (!uploadRes.success) {
      message.error("Image upload failed.");
      return;
    }

    const latestPreview = photoPreview || profileImage;
    setProfileImage(latestPreview);
    localStorage.setItem("profileImage", latestPreview);
    setSelectedPhoto(null);
    message.success("Profile photo updated.");
  };

  const handleAccountSave = async () => {
    if (!userId || !userDetails) {
      message.error("Please login again to update account settings.");
      return;
    }

    const newPassword = securityForm.newPassword.trim();
    const confirmPassword = securityForm.confirmPassword.trim();

    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        message.error("New password must be at least 6 characters.");
        return;
      }

      if (newPassword !== confirmPassword) {
        message.error("Password confirmation does not match.");
        return;
      }
    }

    const nextEmail = securityForm.email.trim();
    const currentEmail = userDetails.email || fallbackEmail;

    if (!nextEmail) {
      message.error("Email is required.");
      return;
    }

    if (nextEmail !== currentEmail) {
      const payload = createUpdatePayload(userDetails, { email: nextEmail });
      const updateRes = await profileService.updateUser(userId, payload);

      if (!updateRes.success) {
        message.error("Unable to update email right now.");
        return;
      }

      setUserDetails((prev) => ({ ...prev, email: nextEmail }));
      localStorage.setItem("email", nextEmail);
    }

    if (newPassword) {
      message.info("Password update endpoint is not available in backend yet.");
    } else {
      message.success("Account settings saved.");
    }

    setSecurityForm((prev) => ({
      ...prev,
      newPassword: "",
      confirmPassword: "",
    }));
  };

  const renderSectionContent = () => {
    if (isLoading) {
      return <p className="account-settings-loading">Loading your account settings...</p>;
    }

    switch (activeSection) {
      case "profile":
        return (
          <div className="account-settings-content-body">
            <div className="account-settings-form-grid">
              <label>
                Basics:
                <input
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleProfileInput}
                  placeholder="First name"
                />
              </label>
              <label>
                &nbsp;
                <input
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleProfileInput}
                  placeholder="Last name"
                />
              </label>
            </div>

            <label>
              Headline
              <input
                name="headline"
                value={profileForm.headline}
                onChange={handleProfileInput}
                placeholder="Role or professional headline"
              />
            </label>

            <label>
              Biography
              <textarea
                name="biography"
                value={profileForm.biography}
                onChange={handleProfileInput}
                rows={4}
                placeholder="Share a short profile summary"
              />
            </label>

            <label>
              Language
              <select name="language" value={profileForm.language} onChange={handleProfileInput}>
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </label>

            <div className="account-settings-form-grid">
              <label>
                LinkedIn
                <input
                  name="linkedinUrl"
                  value={profileForm.linkedinUrl}
                  onChange={handleProfileInput}
                  placeholder="https://linkedin.com/in/yourname"
                />
              </label>
              <label>
                GitHub
                <input
                  name="githubUrl"
                  value={profileForm.githubUrl}
                  onChange={handleProfileInput}
                  placeholder="https://github.com/yourname"
                />
              </label>
            </div>

            <button type="button" className="account-settings-primary-btn" onClick={handleProfileSave}>
              Save
            </button>
          </div>
        );

      case "photo":
        return (
          <div className="account-settings-content-body">
            <label className="account-settings-label">Image preview</label>
            <div className="account-settings-photo-preview">
              <img
                src={photoPreview || profileImage || userFallbackImage}
                alt={displayName}
              />
            </div>

            <label>
              Add / Change image
              <input type="file" accept="image/*" onChange={handlePhotoSelection} />
            </label>

            <div className="account-settings-button-row">
              <button type="button" className="account-settings-secondary-btn" onClick={handlePhotoUpload}>
                Upload image
              </button>
            </div>
          </div>
        );

      case "account-security":
        return (
          <div className="account-settings-content-body">
            <label>
              Email
              <input
                type="email"
                name="email"
                value={securityForm.email}
                onChange={handleSecurityInput}
                placeholder="Email address"
              />
            </label>

            <label>
              New password
              <input
                type="password"
                name="newPassword"
                value={securityForm.newPassword}
                onChange={handleSecurityInput}
                placeholder="Enter new password"
              />
            </label>

            <label>
              Confirm new password
              <input
                type="password"
                name="confirmPassword"
                value={securityForm.confirmPassword}
                onChange={handleSecurityInput}
                placeholder="Re-type new password"
              />
            </label>

            <button type="button" className="account-settings-primary-btn" onClick={handleAccountSave}>
              Save account settings
            </button>
          </div>
        );

      case "subscriptions":
        return (
          <div className="account-settings-content-body">
            <h3 className="account-settings-subtitle">Active plans</h3>
            <div className="account-settings-empty-box">You do not have any active subscriptions</div>

            <h3 className="account-settings-subtitle">Subscription plans available</h3>
            <div className="account-settings-plan-card">
              <h4>Personal Plan</h4>
              <ul>
                <li>Access to top courses in tech and business.</li>
                <li>Practice tests and guided exercises.</li>
                <li>New courses added regularly.</li>
              </ul>
              <div className="account-settings-button-row">
                <button type="button" className="account-settings-primary-btn">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        );

      case "payment-methods":
        return (
          <div className="account-settings-content-body">
            <label className="account-settings-checkbox">
              <input
                type="checkbox"
                checked={showSavedPaymentsOnCheckout}
                onChange={(event) => setShowSavedPaymentsOnCheckout(event.target.checked)}
              />
              Show my saved payment methods on the checkout step
            </label>

            <h3 className="account-settings-subtitle">Your saved payment methods</h3>
            <div className="account-settings-empty-box">You do not have any saved payment methods.</div>
          </div>
        );

      case "privacy":
        return (
          <div className="account-settings-content-body">
            <h3 className="account-settings-subtitle">Profile page settings</h3>
            <label className="account-settings-checkbox">
              <input
                type="checkbox"
                checked={privacyForm.showProfile}
                onChange={(event) =>
                  setPrivacyForm((prev) => ({ ...prev, showProfile: event.target.checked }))
                }
              />
              Show your profile to logged-in users
            </label>
            <label className="account-settings-checkbox">
              <input
                type="checkbox"
                checked={privacyForm.showCourses}
                onChange={(event) =>
                  setPrivacyForm((prev) => ({ ...prev, showCourses: event.target.checked }))
                }
              />
              Show courses you are taking on your profile page
            </label>

            <button type="button" className="account-settings-primary-btn" onClick={() => message.success("Privacy settings saved.")}>
              Save
            </button>
          </div>
        );

      case "notification-preferences":
        return (
          <div className="account-settings-content-body">
            <div className="account-settings-notification-box">
              <div className="account-settings-notification-header">
                <h3>Updates and offerings</h3>
                <label className="account-settings-toggle">
                  <input
                    type="checkbox"
                    checked={notificationForm.updatesEnabled}
                    onChange={(event) =>
                      setNotificationForm((prev) => ({ ...prev, updatesEnabled: event.target.checked }))
                    }
                  />
                  <span />
                </label>
              </div>

              <label className="account-settings-checkbox">
                <input
                  type="checkbox"
                  checked={notificationForm.productLaunches}
                  onChange={(event) =>
                    setNotificationForm((prev) => ({ ...prev, productLaunches: event.target.checked }))
                  }
                />
                Product launches and announcements
              </label>

              <label className="account-settings-checkbox">
                <input
                  type="checkbox"
                  checked={notificationForm.offersPromotions}
                  onChange={(event) =>
                    setNotificationForm((prev) => ({ ...prev, offersPromotions: event.target.checked }))
                  }
                />
                Offers and promotions
              </label>
            </div>

            <div className="account-settings-notification-box">
              <div className="account-settings-notification-header">
                <h3>Your learning</h3>
                <label className="account-settings-toggle">
                  <input
                    type="checkbox"
                    checked={notificationForm.learningEnabled}
                    onChange={(event) =>
                      setNotificationForm((prev) => ({ ...prev, learningEnabled: event.target.checked }))
                    }
                  />
                  <span />
                </label>
              </div>

              <label className="account-settings-checkbox">
                <input
                  type="checkbox"
                  checked={notificationForm.learningStats}
                  onChange={(event) =>
                    setNotificationForm((prev) => ({ ...prev, learningStats: event.target.checked }))
                  }
                />
                Learning stats
              </label>
              <label className="account-settings-checkbox">
                <input
                  type="checkbox"
                  checked={notificationForm.inspiration}
                  onChange={(event) =>
                    setNotificationForm((prev) => ({ ...prev, inspiration: event.target.checked }))
                  }
                />
                Inspiration (tips and stories)
              </label>
              <label className="account-settings-checkbox">
                <input
                  type="checkbox"
                  checked={notificationForm.recommendations}
                  onChange={(event) =>
                    setNotificationForm((prev) => ({ ...prev, recommendations: event.target.checked }))
                  }
                />
                Course recommendations
              </label>
              <label className="account-settings-checkbox">
                <input
                  type="checkbox"
                  checked={notificationForm.instructorNotifications}
                  onChange={(event) =>
                    setNotificationForm((prev) => ({
                      ...prev,
                      instructorNotifications: event.target.checked,
                    }))
                  }
                />
                Notifications from instructors
              </label>
            </div>

            <button type="button" className="account-settings-primary-btn" onClick={() => message.success("Notification preferences saved.")}>
              Save
            </button>
          </div>
        );

      case "api-clients":
        return (
          <div className="account-settings-content-body">
            <h3 className="account-settings-subtitle">Affiliate API</h3>
            <p className="account-settings-note">
              Create API clients for custom EduVerse integrations and automation workflows.
            </p>
            <div className="account-settings-button-row">
              <button type="button" className="account-settings-secondary-btn">
                Request Affiliate API Client
              </button>
            </div>
            <div className="account-settings-info-box">You do not have any API clients yet.</div>
          </div>
        );

      case "close-account":
        return (
          <div className="account-settings-content-body">
            <p className="account-settings-danger">
              <strong>Warning:</strong> Closing your account is permanent and removes access to your enrolled courses.
            </p>
            <p className="account-settings-note">
              Contact support if you need help before closing your account.
            </p>
            <button
              type="button"
              className="account-settings-danger-btn"
              onClick={() => message.warning("Close account is currently disabled for safety.")}
            >
              Close account
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="udemy-page account-settings-page">
      <Navbar page="profile" />

      <main className="account-settings-layout">
        <aside className="account-settings-sidebar">
          <div className="account-settings-user-card">
            <img src={profileImage || userFallbackImage} alt={displayName} />
            <h2>{displayName}</h2>
          </div>

          <button
            type="button"
            className="account-settings-link"
            onClick={() => navigate("/profile")}
          >
            View public profile
          </button>

          <nav className="account-settings-nav" aria-label="Account settings sections">
            {SETTINGS_SECTIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`account-settings-nav-item ${activeSection === item.key ? "active" : ""}`}
                onClick={() => goToSection(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="account-settings-content">
          <header className="account-settings-content-header">
            <h1>{sectionCopy.title}</h1>
            <p>{sectionCopy.subtitle}</p>
          </header>

          {renderSectionContent()}

          <footer className="account-settings-content-footer">
            Signed in as <strong>{displayEmail}</strong>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default AccountSettings;
