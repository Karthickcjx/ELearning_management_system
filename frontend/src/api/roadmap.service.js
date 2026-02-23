import api from "./api";

async function getDomains() {
  try {
    const { data } = await api.get("/api/roadmaps/domains");
    return { success: true, data: data.data || [] };
  } catch (error) {
    console.error("Error fetching roadmap domains:", error);
    return { success: false, error: "Could not fetch roadmap domains", data: [] };
  }
}

async function previewRoadmap(payload) {
  try {
    const { data } = await api.post("/api/roadmaps/preview", payload);
    return { success: true, data: data.data };
  } catch (error) {
    console.error("Error generating roadmap preview:", error);
    return { success: false, error: "Could not generate roadmap preview" };
  }
}

async function saveRoadmap(payload) {
  try {
    const { data } = await api.post("/api/roadmaps", payload);
    return { success: true, data: data.data };
  } catch (error) {
    console.error("Error saving roadmap:", error);
    return { success: false, error: "Could not save roadmap" };
  }
}

async function getMyRoadmaps() {
  try {
    const { data } = await api.get("/api/roadmaps/my");
    return { success: true, data: data.data || [] };
  } catch (error) {
    console.error("Error fetching user roadmaps:", error);
    return { success: false, error: "Could not fetch saved roadmaps", data: [] };
  }
}

async function updateStepStatus(planId, stepOrder, completed) {
  try {
    const { data } = await api.patch(`/api/roadmaps/${planId}/steps/${stepOrder}`, { completed });
    return { success: true, data: data.data };
  } catch (error) {
    console.error("Error updating roadmap step:", error);
    return { success: false, error: "Could not update step status" };
  }
}

export const roadmapService = {
  getDomains,
  previewRoadmap,
  saveRoadmap,
  getMyRoadmaps,
  updateStepStatus,
};
