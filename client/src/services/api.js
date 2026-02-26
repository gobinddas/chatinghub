import axios from "axios";

// ── No env needed! Same domain in production ──────────────────────────────────
const BASE_URL = import.meta.env.DEV
  ? `${import.meta.env.VITE_API_URL}/api` // development: http://localhost:5000/api
  : "/api"; // production:  /api (same domain)

const SERVER_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL // development: http://localhost:5000
  : ""; // production:  same domain

const getToken = () => localStorage.getItem("token");

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = token;
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

export const getAvatarUrl = (profilePicturePath) => {
  if (!profilePicturePath) return null;
  if (profilePicturePath.startsWith("http")) return profilePicturePath;
  return `${SERVER_URL}${profilePicturePath}`;
};

export default api;
