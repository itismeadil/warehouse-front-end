import axios from "axios";

// e.g. http://localhost:5000/api — set in .env as VITE_API_URL
const baseURL = import.meta.env.VITE_API_URL;

const TOKEN_KEY = "token";

export const api = axios.create({ baseURL });

// Attach the stored token to every outgoing request, if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearStoredToken = () => localStorage.removeItem(TOKEN_KEY);
