import axios from "axios";

// e.g. http://localhost:5000/api — set in .env as VITE_API_URL
const baseURL = import.meta.env.VITE_API_URL;

export const api = axios.create({ baseURL });
