import api from "./api";

function unwrapApiResponse(payload) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload;
}

async function getUserDetails(userId) {
  if (!userId) {
    return getCurrentUserDetails();
  }

  try {
    const { data } = await api.get(`/api/users/${userId}`);
    return { success: true, data: unwrapApiResponse(data) };
  } catch (err) {
    console.error("Error fetching user details:", err);
    return { success: false, error: "Unable to fetch user details" };
  }
}

async function getCurrentUserDetails() {
  try {
    const { data } = await api.get("/api/users/me");
    return { success: true, data: unwrapApiResponse(data) };
  } catch (err) {
    console.error("Error fetching user details:", err);
    return { success: false, error: "Unable to fetch user details" };
  }
}

async function getProfileImage(userId) {
  try {
    const res = await api.get(`/api/users/${userId}/profile-image`, {
      responseType: "blob",
      // A missing image is a valid state for new users.
      // Treat 404 as handled so the global interceptor doesn't toast an error.
      validateStatus: (status) => status === 200 || status === 404,
    });

    if (res.status === 404) {
      return { success: false, noImage: true };
    }

    const blobUrl = URL.createObjectURL(res.data);
    return { success: true, data: blobUrl };
  } catch (err) {
    console.error("Error fetching profile image:", err);
    return { success: false, error: "Unable to fetch profile image" };
  }
}

async function updateUser(userId, updatedData) {
  try {
    const { data } = await api.put(`/api/users/${userId}`, updatedData);
    return { success: true, data: unwrapApiResponse(data) };
  } catch (err) {
    console.error("Error updating user:", err);
    return { success: false, error: "Unable to update user" };
  }
}

async function uploadProfileImage(userId, file) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    await api.post(`/api/users/${userId}/upload-image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { success: true };
  } catch (err) {
    console.error("Error uploading profile image:", err);
    return { success: false, error: "Unable to upload image" };
  }
}

async function getUserDashboardStats(userId) {
  try {
    const { data } = await api.get(`/api/users/${userId}/dashboard-stats`);
    return { success: true, data: unwrapApiResponse(data) };
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    return { success: false, error: "Unable to fetch dashboard stats" };
  }
}

export const profileService = {
  getUserDashboardStats,
  getCurrentUserDetails,
  getUserDetails,
  getProfileImage,
  uploadProfileImage,
  updateUser,
};
