import api from "./api";

const ROOM_REQUEST_CONFIG = {
  skipAuthRedirect: true,
  suppressErrorToast: true,
};

async function getHistory() {
  const { data } = await api.get("/api/rooms/history", ROOM_REQUEST_CONFIG);
  return data || [];
}

async function getMessages(roomId, limit = 100) {
  const { data } = await api.get(`/api/rooms/${roomId}/messages`, {
    ...ROOM_REQUEST_CONFIG,
    params: { limit },
  });
  return data || [];
}

async function getMembers(roomId) {
  const { data } = await api.get(`/api/rooms/${roomId}/members`, ROOM_REQUEST_CONFIG);
  return data || [];
}

async function leaveRoom(roomId) {
  await api.post(`/api/rooms/${roomId}/leave`, {}, ROOM_REQUEST_CONFIG);
}

export const roomService = {
  getHistory,
  getMessages,
  getMembers,
  leaveRoom,
};

