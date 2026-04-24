import React, { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import ImgUpload from "./ImgUpload";
import Performance from "./Performance";
import {
  Mail,
  Phone,
  Calendar,
  Briefcase,
  MapPin,
  BookOpen,
  Pencil,
  User,
  Venus,
  Mars,
  Github,
  Linkedin,
} from "lucide-react";
import { authService } from "../../api/auth.service";
import { profileService } from "../../api/profile.service";
import EditProfileModal from "./EditProfileModal";

function Profile() {
  const [userDetails, setUserDetails] = useState(null);
  const [profileImage, setProfileImage] = useState(localStorage.getItem("profileImage") || "");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingImage, setLoadingImage] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const refreshProfile = async () => {
    setLoadingProfile(true);
    setLoadingImage(true);
    setProfileError("");

    try {
      const userRes = await profileService.getCurrentUserDetails();

      if (!userRes.success || !userRes.data) {
        throw new Error(userRes.error || "Unable to load your profile.");
      }

      authService.syncStoredUserProfile(userRes.data);
      setUserDetails(userRes.data);

      const imgRes = await profileService.getProfileImage(userRes.data.id);
      if (imgRes.success) {
        setProfileImage(imgRes.data);
        localStorage.setItem("profileImage", imgRes.data);
      } else if (imgRes.noImage) {
        setProfileImage("");
        localStorage.removeItem("profileImage");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setProfileError(error.message || "Unable to load your profile right now.");
    } finally {
      setLoadingProfile(false);
      setLoadingImage(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const updateUser = async (updatedData) => {
    if (!userDetails?.id) {
      return false;
    }

    try {
      const response = await profileService.updateUser(userDetails.id, updatedData);
      if (!response.success || !response.data) {
        return false;
      }

      setUserDetails(response.data);
      authService.syncStoredUserProfile(response.data);

      return true;
    } catch (err) {
      console.error("Error updating user:", err);
      return false;
    }
  };

  const handleEditProfile = () => setIsEditModalVisible(true);
  const handleModalClose = () => setIsEditModalVisible(false);
  const handleProfileUpdate = async (updatedData) => await updateUser(updatedData);

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !userDetails?.id) return;

    const res = await profileService.uploadProfileImage(userDetails.id, file);
    if (res.success) {
      const nextPreview = URL.createObjectURL(file);
      setProfileImage(nextPreview);
      localStorage.setItem("profileImage", nextPreview);
    }
  };

  const getGenderIcon = (gender) => {
    if (gender?.toLowerCase() === "female") return Venus;
    if (gender?.toLowerCase() === "male") return Mars;
    return User;
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar page="profile" />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar page="profile" />
        <div className="max-w-container-lg mx-auto px-6 py-12">
          <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Unable to load profile</h2>
            <p className="mt-2 text-sm text-slate-600">{profileError}</p>
            <button
              type="button"
              onClick={refreshProfile}
              className="lms-btn lms-btn-primary mt-4"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar page="profile" />

      <main className="max-w-container-lg mx-auto px-6 py-6 lg:py-8 w-full flex-1">
        {/* Header card */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <ImgUpload
              variant="avatar"
              onChange={handleImageChange}
              src={loadingImage ? null : profileImage}
              isLoading={loadingImage}
            />

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-slate-900 truncate">
                    {userDetails?.username || "User"}
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {userDetails?.profession || "Learner"}
                  </p>
                  {userDetails?.location && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                      <MapPin size={14} /> {userDetails.location}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleEditProfile}
                  className="lms-btn lms-btn-primary self-start sm:self-auto"
                >
                  <Pencil size={14} />
                  Edit Profile
                </button>
              </div>

              {(userDetails?.linkedin_url || userDetails?.github_url) && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {userDetails?.linkedin_url && (
                    <a
                      href={userDetails.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-primary transition-colors"
                    >
                      <Linkedin size={14} /> LinkedIn
                    </a>
                  )}
                  {userDetails?.github_url && (
                    <a
                      href={userDetails.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-primary transition-colors"
                    >
                      <Github size={14} /> GitHub
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-slate-200 flex gap-6">
            <TabButton
              label="Overview"
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            />
            <TabButton
              label="Performance"
              active={activeTab === "performance"}
              onClick={() => setActiveTab("performance")}
            />
          </div>
        </section>

        {/* Content */}
        {activeTab === "overview" ? (
          <section className="mt-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow icon={Mail} label="Email Address" value={userDetails?.email} />
              <InfoRow icon={Phone} label="Phone Number" value={userDetails?.mobileNumber} />
              <InfoRow
                icon={getGenderIcon(userDetails?.gender)}
                label="Gender"
                value={userDetails?.gender}
              />
              <InfoRow icon={Calendar} label="Date of Birth" value={formatDateValue(userDetails?.dob)} />
              <InfoRow icon={Briefcase} label="Profession" value={userDetails?.profession} />
              <InfoRow
                icon={BookOpen}
                label="Learning Courses"
                value={userDetails?.learningCourseCount ?? 0}
              />
            </div>
          </section>
        ) : (
          <div className="mt-6">
            <Performance embedded />
          </div>
        )}
      </main>

      <EditProfileModal
        visible={isEditModalVisible}
        onCancel={handleModalClose}
        userDetails={userDetails}
        onUpdate={handleProfileUpdate}
      />

      <Footer />
    </div>
  );
}

function formatDateValue(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px pb-3 text-sm font-medium transition-colors ${
        active
          ? "text-primary border-b-2 border-primary"
          : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {label}
    </button>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  const hasValue = value !== null && value !== undefined && value !== "";

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
        {Icon ? <Icon size={16} className="text-slate-400" /> : null}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-sm text-slate-800">
        {hasValue ? value : <span className="text-slate-400">—</span>}
      </div>
    </div>
  );
}

export default Profile;
