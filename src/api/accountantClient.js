import axios from "axios";

// The accountant service is a SEPARATE backend from the main warehouse API
// (its own server, its own database) — so it gets its own axios instance
// and its own base URL env var rather than reusing "api" from client.js.
// e.g. http://localhost:5100/api/accountant — set in .env as
// VITE_ACCOUNTANT_API_URL
const baseURL = import.meta.env.VITE_ACCOUNTANT_API_URL;

export const accountantApi = axios.create({ baseURL });

// Optional shared-secret header, matching the service's optional
// ACCOUNTANT_API_KEY check. Leave VITE_ACCOUNTANT_API_KEY unset to skip.
const apiKey = import.meta.env.VITE_ACCOUNTANT_API_KEY;
if (apiKey) {
  accountantApi.defaults.headers.common["x-api-key"] = apiKey;
}
