import api from "./api";

async function getSettings() {
    try {
        const { data } = await api.get("/api/settings");
        return { success: true, data: data.data?.settings || {} };
    } catch (error) {
        console.error("Error fetching settings:", error);
        return {
            success: false,
            error: error.response?.data?.message || "Could not fetch settings",
        };
    }
}

async function updateSettings(settings) {
    try {
        const { data } = await api.put("/api/settings", { settings });
        return { success: true, data: data.data?.settings || {} };
    } catch (error) {
        console.error("Error updating settings:", error);
        return {
            success: false,
            error: error.response?.data?.message || "Could not update settings",
        };
    }
}

export const settingsService = {
    getSettings,
    updateSettings,
};
