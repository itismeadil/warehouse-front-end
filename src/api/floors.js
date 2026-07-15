import { api } from "./client";

export const getFloors = () => api.get("/floors").then((res) => res.data);

export const createFloor = (payload) =>
  api.post("/floors", payload).then((res) => res.data);

export const getFloorOccupancy = (floorId) =>
  api.get(`/floors/${floorId}/occupancy`).then((res) => res.data);

export const deleteFloor = (floorId) =>
  api.delete(`/floors/${floorId}`).then((res) => res.data);
