import { API_BASE_URL } from "./constant";

function persistSession(jwtData) {
  localStorage.setItem("token", jwtData.token);
  localStorage.setItem("email", jwtData.email);
  localStorage.setItem("name", jwtData.name);
  localStorage.setItem("id", jwtData.id);
  localStorage.setItem("userId", jwtData.id);
  localStorage.setItem("role", jwtData.role);
}

function syncStoredUserProfile(user) {
  if (!user) {
    return;
  }

  if (user.id) {
    localStorage.setItem("id", user.id);
    localStorage.setItem("userId", user.id);
  }
  if (user.email) {
    localStorage.setItem("email", user.email);
  }
  if (user.username) {
    localStorage.setItem("name", user.username);
  }
}

async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (response.ok) {
      const jwtData = result.data;
      persistSession(jwtData);

      return {
        success: true,
        token: jwtData.token,
        user: {
          id: jwtData.id,
          name: jwtData.name,
          email: jwtData.email,
          role: jwtData.role,
        },
      };
    } else {
      return {
        success: false,
        error: result.message || "Login failed",
      };
    }
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}

async function register(formData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      const loginResult = await login(formData.email, formData.password);

      return {
        success: true,
        message: data.message || "Registration successful",
        autoLoggedIn: loginResult.success,
        user: loginResult.user,
        warning: loginResult.success
          ? null
          : loginResult.error || "Account created, but automatic sign-in failed.",
      };
    } else {
      return {
        success: false,
        error: data.message || data.error || "Registration failed",
      };
    }
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}

async function sendOtp(email) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();
    return {
      success: response.ok,
      message: result.message || "OTP sent successfully",
    };
  } catch (error) {
    console.error("Send OTP error:", error);
    return { success: false, error: "Network error" };
  }
}

async function resetPassword(email, otp, newPassword) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp, newPassword }),
    });

    const result = await response.json();
    return {
      success: response.ok,
      message: result.message || "Password reset successfully",
    };
  } catch (error) {
    console.error("Reset Password error:", error);
    return { success: false, error: "Network error" };
  }
}

async function getUserDetails(email) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/users/details?email=${email}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: data.data,
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to fetch user details",
      };
    }
  } catch (error) {
    console.error("Get user details error:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}

async function logout() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      console.log("Backend logout successful");
    }

  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    localStorage.clear()
    window.location.href = "/login";
  }
}

function isAdminAuthenticated() {
  return !!localStorage.getItem("token") && localStorage.getItem("role") === "ROLE_ADMIN";
}

function isUserAuthenticated() {
  return !!localStorage.getItem("token") && localStorage.getItem("role") === "ROLE_USER";
}

function getCurrentUser() {
  return {
    token: localStorage.getItem("token"),
    id: localStorage.getItem("id") || localStorage.getItem("userId"),
    name: localStorage.getItem("name"),
    email: localStorage.getItem("email"),
    role: localStorage.getItem("role"),
  };
}

function getCurrentUserId() {
  return localStorage.getItem("id") || localStorage.getItem("userId");
}

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const authService = {
  login,
  register,
  sendOtp,
  resetPassword,
  getUserDetails,
  logout,
  isAdminAuthenticated,
  isUserAuthenticated,
  getCurrentUser,
  getCurrentUserId,
  getAuthHeader,
  syncStoredUserProfile,
};
