import api from "./api";

async function sendMessage(receiverId, subject, content) {
    try {
        const { data } = await api.post("/api/messages/send", {
            receiverId,
            subject,
            content,
        });
        return { success: true, data: data.data };
    } catch (error) {
        console.error("Error sending message:", error);
        return {
            success: false,
            error: error.response?.data?.message || "Could not send message",
        };
    }
}

async function broadcastMessage(subject, content) {
    try {
        const { data } = await api.post("/api/messages/broadcast", {
            subject,
            content,
        });
        return { success: true, data: data.data, message: data.message };
    } catch (error) {
        console.error("Error broadcasting message:", error);
        return {
            success: false,
            error: error.response?.data?.message || "Could not broadcast message",
        };
    }
}

async function getStudentMessages(studentId) {
    try {
        const { data } = await api.get(`/api/messages/student/${studentId}`);
        return { success: true, data: data.data };
    } catch (error) {
        console.error("Error fetching student messages:", error);
        return {
            success: false,
            error: error.response?.data?.message || "Could not fetch messages",
        };
    }
}

async function getSentMessages() {
    try {
        const { data } = await api.get("/api/messages/sent");
        return { success: true, data: data.data };
    } catch (error) {
        console.error("Error fetching sent messages:", error);
        return {
            success: false,
            error: error.response?.data?.message || "Could not fetch sent messages",
        };
    }
}

async function markAsRead(messageId) {
    try {
        const { data } = await api.patch(`/api/messages/${messageId}/read`);
        return { success: true, data: data.data };
    } catch (error) {
        console.error("Error marking message as read:", error);
        return {
            success: false,
            error:
                error.response?.data?.message || "Could not mark message as read",
        };
    }
}

export const messageService = {
    sendMessage,
    broadcastMessage,
    getStudentMessages,
    getSentMessages,
    markAsRead,
};
