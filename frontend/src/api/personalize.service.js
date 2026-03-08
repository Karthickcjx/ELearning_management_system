import api from "./api";

async function getOccupations(field) {
    try {
        const { data } = await api.get(`/api/occupations/${encodeURIComponent(field)}`);
        return { success: true, data };
    } catch (err) {
        console.error("Error fetching occupations:", err);
        return { success: false, error: "Unable to fetch occupations" };
    }
}

async function getAllFields() {
    try {
        const { data } = await api.get("/api/occupations");
        return { success: true, data };
    } catch (err) {
        console.error("Error fetching fields:", err);
        return { success: false, error: "Unable to fetch fields" };
    }
}

async function saveInterests(payload) {
    try {
        const { data } = await api.post("/api/profile/interests", payload);
        return { success: true, data };
    } catch (err) {
        console.error("Error saving interests:", err);
        return { success: false, error: "Unable to save interests" };
    }
}

export const personalizeService = {
    getOccupations,
    getAllFields,
    saveInterests,
};
