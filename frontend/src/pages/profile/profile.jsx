import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import ImgUpload from "./ImgUpload";
import Performance from "./Performance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faLinkedin
} from "@fortawesome/free-brands-svg-icons";
import {
  faUser,
  faEnvelope,
  faPhone,
  faVenus,
  faMars,
  faCalendar,
  faBriefcase,
  faMapMarkerAlt,
  faBookOpen,
  faEdit,
  faTrophy
} from "@fortawesome/free-solid-svg-icons";
import { profileService } from "../../api/profile.service";
import EditProfileModal from "./EditProfileModal";
import "./Profile.css";

function Profile() {
  const id = localStorage.getItem("id");
  const [userDetails, setUserDetails] = useState(null);
  const [profileImage, setProfileImage] = useState(localStorage.getItem("profileImage") || "");
  const [loadingImage, setLoadingImage] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    async function fetchUserDetails() {
      try {
        const userRes = await profileService.getUserDetails(id);
        if (userRes.success) {
          setUserDetails(userRes.data);
        }

        const imgRes = await profileService.getProfileImage(id);
        if (imgRes.success) {
          setProfileImage(imgRes.data);
        }
      } finally {
        setLoadingImage(false);
      }
    }
    fetchUserDetails();
  }, [id]);

  const updateUser = async (updatedData) => {
    try {
      const res = await profileService.updateUser(id, updatedData);

      setUserDetails(prevDetails => ({
        ...prevDetails,
        ...updatedData
      }));

      return true;
    } catch (err) {
      console.error("Error updating user:", err);
      return false;
    }
  };

  const handleEditProfile = () => {
    setIsEditModalVisible(true);
  };

  const handleModalClose = () => {
    setIsEditModalVisible(false);
  };

  const handleProfileUpdate = async (updatedData) => {
    const success = await updateUser(updatedData);
    return success;
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const res = await profileService.uploadProfileImage(id, file);
    if (res.success) {
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const getGenderIcon = (gender) => {
    if (gender?.toLowerCase() === 'female') return faVenus;
    if (gender?.toLowerCase() === 'male') return faMars;
    return faUser;
  };

  if (!userDetails && !loadingImage) {
    return (
      <div className="profile-page">
        <Navbar page="profile" />
        <div className="profile-loading">
          <div className="lms-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Navbar page="profile" />

      <div className="profile-container">

        {/* Profile Header Card */}
        <div className="profile-header-card">
          <div className="profile-header-inner">
            {/* Profile row */}
            <div className="profile-top-row">
              <div className="profile-avatar-wrap">
                <ImgUpload
                  onChange={handleImageChange}
                  src={loadingImage ? null : profileImage}
                  isLoading={loadingImage}
                />
              </div>

              <div className="profile-user-info">
                <div className="profile-user-header">
                  <div>
                    <h2 className="profile-username">
                      {userDetails?.username || "User"}
                    </h2>
                    <p className="profile-profession">{userDetails?.profession || "Learner"}</p>
                    {userDetails?.location && (
                      <div className="profile-location">
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                        {userDetails?.location}
                      </div>
                    )}
                  </div>

                  <button onClick={handleEditProfile} className="profile-edit-btn">
                    <FontAwesomeIcon icon={faEdit} />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Social Links */}
            {(userDetails?.linkedin_url || userDetails?.github_url) && (
              <div className="profile-social-links">
                {userDetails?.linkedin_url && (
                  <a
                    href={userDetails.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-social-link profile-social-link--linkedin"
                  >
                    <FontAwesomeIcon icon={faLinkedin} />
                    LinkedIn
                  </a>
                )}
                {userDetails?.github_url && (
                  <a
                    href={userDetails.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-social-link profile-social-link--github"
                  >
                    <FontAwesomeIcon icon={faGithub} />
                    GitHub
                  </a>
                )}
              </div>
            )}

            {/* Tab Navigation */}
            <div className="profile-tabs">
              <button
                onClick={() => setActiveTab("overview")}
                className={`profile-tab ${activeTab === "overview" ? "active" : ""}`}
              >
                <FontAwesomeIcon icon={faUser} />
                Overview
              </button>
              <button
                onClick={() => setActiveTab("performance")}
                className={`profile-tab ${activeTab === "performance" ? "active" : ""}`}
              >
                <FontAwesomeIcon icon={faTrophy} />
                Performance
              </button>
            </div>
          </div>
        </div>

        {activeTab === "overview" ? (
          <div className="profile-info-section">
            <h3 className="profile-info-title">
              <FontAwesomeIcon icon={faUser} />
              Personal Information
            </h3>

            <div className="profile-info-grid">
              <InfoCard
                icon={faEnvelope}
                label="Email Address"
                value={userDetails?.email}
                iconClass="profile-info-icon--red"
              />
              <InfoCard
                icon={faPhone}
                label="Phone Number"
                value={userDetails?.mobileNumber}
                iconClass="profile-info-icon--green"
              />
              <InfoCard
                icon={getGenderIcon(userDetails?.gender)}
                label="Gender"
                value={userDetails?.gender}
                iconClass="profile-info-icon--purple"
              />
              <InfoCard
                icon={faCalendar}
                label="Date of Birth"
                value={userDetails?.dob}
                iconClass="profile-info-icon--blue"
              />
              <InfoCard
                icon={faBriefcase}
                label="Profession"
                value={userDetails?.profession}
                iconClass="profile-info-icon--orange"
              />
              <InfoCard
                icon={faBookOpen}
                label="Learning Courses"
                value={userDetails?.learningCourses?.length || 0}
                iconClass="profile-info-icon--indigo"
              />
            </div>
          </div>
        ) : (
          <Performance embedded />
        )}
      </div>

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

function InfoCard({ icon, label, value, iconClass = "" }) {
  return (
    <div className="profile-info-card">
      <div className="profile-info-card-inner">
        <div className={`profile-info-icon ${iconClass}`}>
          <FontAwesomeIcon icon={icon} />
        </div>
        <div>
          <h4 className="profile-info-label">{label}</h4>
          <p className="profile-info-value">
            {value || "Not specified"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Profile;
