import api from "./api";

async function getAllAnnouncements() {
    try {
        const { data } = await api.get("/api/announcements");
        return { success: true, data };
    } catch (err) {
        console.error("Error fetching announcements:", err);
        return { success: false, error: "Unable to fetch announcements" };
    }
}

async function getPublishedAnnouncements() {
    try {
        const { data } = await api.get("/api/announcements/published");
        return { success: true, data };
    } catch (err) {
        console.error("Error fetching published announcements:", err);
        return { success: false, error: "Unable to fetch published announcements" };
    }
}

async function createAnnouncement(announcementData) {
    try {
        const { data } = await api.post("/api/announcements", announcementData);
        return { success: true, data };
    } catch (err) {
        console.error("Error creating announcement:", err);
        return { success: false, error: "Unable to create announcement" };
    }
}

async function updateAnnouncement(id, announcementData) {
    try {
        const { data } = await api.put(`/api/announcements/${id}`, announcementData);
        return { success: true, data };
    } catch (err) {
        console.error("Error updating announcement:", err);
        return { success: false, error: "Unable to update announcement" };
    }
}

async function togglePublish(id) {
    try {
        const { data } = await api.put(`/api/announcements/${id}/toggle-publish`);
        return { success: true, data };
    } catch (err) {
        console.error("Error toggling publish status:", err);
        return { success: false, error: "Unable to toggle publish status" };
    }
}

async function deleteAnnouncement(id) {
    try {
        await api.delete(`/api/announcements/${id}`);
        return { success: true };
    } catch (err) {
        console.error("Error deleting announcement:", err);
        return { success: false, error: "Unable to delete announcement" };
    }
}

export const announcementService = {
    getAllAnnouncements,
    getPublishedAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    togglePublish,
    deleteAnnouncement,
};
