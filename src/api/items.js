import { api } from "./client";

export const getItems = () => api.get("/items").then((res) => res.data);

export const createItem = (payload) =>
  api.post("/items", payload).then((res) => res.data);

export const addPart = (itemId, payload) =>
  api.post(`/items/${itemId}/parts`, payload).then((res) => res.data);

export const deleteItem = (itemId) =>
  api.delete(`/items/${itemId}`).then((res) => res.data);

// field/change is used for stock adjustments (+1 / -1 on damaged, reserved, sold).
// floorId/area is used for changing a part's location.
// damageDescription is an optional note visible to the assigned supplier.
export const updatePart = (itemId, partId, updates) =>
  api
    .patch(`/items/${itemId}/parts/${partId}`, updates)
    .then((res) => res.data);

export const uploadPartPhotos = (itemId, partId, formData) =>
  api
    .post(`/items/${itemId}/parts/${partId}/photos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);

export const deletePartPhoto = (itemId, partId, photoId) =>
  api
    .delete(`/items/${itemId}/parts/${partId}/photos/${photoId}`)
    .then((res) => res.data);
