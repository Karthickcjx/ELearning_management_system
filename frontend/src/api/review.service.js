import api from "./api";

function unwrapApiResponse(response) {
  return response?.data?.data ?? response?.data;
}

async function getCourseReviews(courseId, { page = 0, size = 5, sort = "newest" } = {}) {
  try {
    const response = await api.get(`/api/reviews/course/${courseId}`, {
      params: { page, size, sort },
    });
    return { success: true, data: unwrapApiResponse(response) };
  } catch (error) {
    console.error("Error fetching course reviews:", error);
    return { success: false, error: error.response?.data?.message || "Unable to fetch reviews" };
  }
}

async function getCourseRatingSummary(courseId) {
  try {
    const response = await api.get(`/api/reviews/course/${courseId}/summary`);
    return { success: true, data: unwrapApiResponse(response) };
  } catch (error) {
    console.error("Error fetching rating summary:", error);
    return { success: false, error: error.response?.data?.message || "Unable to fetch rating summary" };
  }
}

async function getMyReview(courseId) {
  try {
    const response = await api.get(`/api/reviews/my/${courseId}`);
    return { success: true, data: unwrapApiResponse(response) };
  } catch (error) {
    console.error("Error fetching my review:", error);
    return { success: false, error: error.response?.data?.message || "Unable to fetch your review" };
  }
}

async function getPendingReviewPrompts() {
  try {
    const response = await api.get("/api/reviews/pending", {
      suppressErrorToast: true,
    });
    return { success: true, data: unwrapApiResponse(response) };
  } catch (error) {
    console.error("Error fetching pending reviews:", error);
    return { success: false, error: error.response?.data?.message || "Unable to fetch pending reviews" };
  }
}

async function createReview(courseId, rating, reviewText = "") {
  try {
    const response = await api.post("/api/reviews", { courseId, rating, reviewText });
    return { success: true, data: unwrapApiResponse(response) };
  } catch (error) {
    console.error("Error creating review:", error);
    return { success: false, error: error.response?.data?.message || "Error submitting review" };
  }
}

async function updateReview(reviewId, courseId, rating, reviewText = "") {
  try {
    const response = await api.put(`/api/reviews/${reviewId}`, { courseId, rating, reviewText });
    return { success: true, data: unwrapApiResponse(response) };
  } catch (error) {
    console.error("Error updating review:", error);
    return { success: false, error: error.response?.data?.message || "Error updating review" };
  }
}

async function deleteReview(reviewId) {
  try {
    await api.delete(`/api/reviews/${reviewId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting review:", error);
    return { success: false, error: error.response?.data?.message || "Unable to delete review" };
  }
}

async function getAdminReviews({ search = "", rating = "", page = 0, size = 10 } = {}) {
  try {
    const response = await api.get("/api/admin/reviews", {
      params: {
        search: search || undefined,
        rating: rating || undefined,
        page,
        size,
      },
    });
    return { success: true, data: unwrapApiResponse(response) };
  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    return { success: false, error: error.response?.data?.message || "Unable to fetch reviews" };
  }
}

export const reviewService = {
  getCourseReviews,
  getCourseRatingSummary,
  getMyReview,
  getPendingReviewPrompts,
  createReview,
  updateReview,
  deleteReview,
  getAdminReviews,
};
