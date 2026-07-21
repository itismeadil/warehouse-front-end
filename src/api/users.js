import { api } from "./client";

export const getUsers = () => api.get("/users").then((res) => res.data);

export const createUser = (payload) =>
  api.post("/users", payload).then((res) => res.data);

export const deleteUser = (userId) =>
  api.delete(`/users/${userId}`).then((res) => res.data);
