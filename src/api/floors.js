import { api } from "./client";

export const getFloors = (includeDeleted = false) =>
  api.get("/floors", { params: { includeDeleted } }).then((res) => res.data);

export const createFloor = (payload) =>
  api.post("/floors", payload).then((res) => res.data);

export const getFloorOccupancy = (floorId) =>
  api.get(`/floors/${floorId}/occupancy`).then((res) => res.data);

export const deleteFloor = (floorId) =>
  api.delete(`/floors/${floorId}`).then((res) => res.data);

export const restoreFloor = (floorId) =>
  api.post(`/floors/${floorId}/restore`).then((res) => res.data);
