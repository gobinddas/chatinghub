import axios from "axios";

// ── Update this to your ngrok URL when testing on mobile ─────────────────────
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const SERVER_URL = import.meta.env.VITE_API_URL; // for building avatar image URLs

const getToken = () => localStorage.getItem("token");

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Your existing authMiddleware reads: req.headers.authorization directly ────
// It does NOT expect "Bearer " prefix — so we send the raw token.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = token; // raw token, no "Bearer "
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginUser = (email, password) =>
  api.post("/auth/login", { email, password });

export const registerUser = (username, email, password) =>
  api.post("/auth/register", { username, email, password });

// ─── Users ────────────────────────────────────────────────────────────────────
export const getAllUsers = (userId) => api.get(`/users?userId=${userId}`);

export const searchByProfileId = (profileId) =>
  api.get(`/users/search?profileId=${profileId}`);

// ─── Messages ─────────────────────────────────────────────────────────────────
export const getMessages = (userId, targetId) =>
  api.get(`/messages/${userId}/${targetId}`);

// ─── Profile ──────────────────────────────────────────────────────────────────
export const getUserProfile = (userId) => api.get(`/profile/${userId}`);

export const updateProfile = (data) => api.put("/profile/update", data);

export const uploadAvatar = (formData) =>
  api.post("/profile/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Build the full image URL from the stored relative path like "/uploads/avatars/1_123.jpg"
export const getAvatarUrl = (profilePicturePath) => {
  if (!profilePicturePath) return null;
  if (profilePicturePath.startsWith("http")) return profilePicturePath;
  return `${SERVER_URL}${profilePicturePath}`;
};

export default api;
