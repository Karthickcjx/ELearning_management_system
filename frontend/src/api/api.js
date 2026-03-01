import axios from "axios";
import { message } from "antd";
import { API_BASE_URL } from "./constant";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const shouldSkipAuthRedirect = error.config?.skipAuthRedirect === true;
    const suppressErrorToast = error.config?.suppressErrorToast === true;
    const status = error.response?.status;

    if (status === 401) {
      if (shouldSkipAuthRedirect) {
        if (!suppressErrorToast) {
          message.error("AI assistant authorization failed. Please retry.");
        }
      } else {
        message.destroy();
        message.error("Session expired or unauthorized. Please log in again.");
        localStorage.clear();
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      }
    } else if (status === 403) {
      if (!suppressErrorToast) {
        message.error("You do not have permission to perform this action.");
      }
    } else if (status === 404) {
      if (!suppressErrorToast) {
        message.error("Requested resource not found.");
      }
    } else if (status >= 500) {
      if (!suppressErrorToast) {
        message.error("Server error. Please try again later.");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
