import axios from "axios";

const BASE_URL = "http://192.168.100.184:5000/api";

const getToken = () => localStorage.getItem("token");

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
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

export default api;
