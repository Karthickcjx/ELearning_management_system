import api from "./api";

const AI_REQUEST_CONFIG = {
  skipAuthRedirect: true,
};

const AI_BACKGROUND_REQUEST_CONFIG = {
  ...AI_REQUEST_CONFIG,
  suppressErrorToast: true,
};

export const aiService = {
  createSession(payload = {}) {
    return api.post("/api/ai/sessions", payload, AI_BACKGROUND_REQUEST_CONFIG);
  },

  getSession(sessionId) {
    return api.get(`/api/ai/sessions/${sessionId}`, AI_REQUEST_CONFIG);
  },

  getMessages(sessionId, limit = 50) {
    return api.get(`/api/ai/sessions/${sessionId}/messages`, {
      ...AI_REQUEST_CONFIG,
      params: { limit },
    });
  },

  getRecommendations(courseId) {
    return api.get("/api/ai/recommendations", {
      ...AI_BACKGROUND_REQUEST_CONFIG,
      params: courseId ? { courseId } : {},
    });
  },

  submitFeedback(messageId, payload) {
    return api.post(`/api/ai/messages/${messageId}/feedback`, payload, AI_REQUEST_CONFIG);
  },

  getDailyUsage() {
    return api.get("/api/ai/usage/daily", AI_BACKGROUND_REQUEST_CONFIG);
  },
};
