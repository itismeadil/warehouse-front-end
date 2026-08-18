import { api } from "./client";

// Optionally pass an itemId to only get the shared parts linked to one item.
export const getSharedParts = (itemId) =>
  api
    .get("/shared-parts", { params: itemId ? { itemId } : {} })
    .then((res) => res.data);

// payload: { name, items: [itemId, ...], floorId, areas }
export const createSharedPart = (payload) =>
  api.post("/shared-parts", payload).then((res) => res.data);

export const linkSharedPart = (sharedPartId, itemId) =>
  api
    .post(`/shared-parts/${sharedPartId}/link`, { itemId })
    .then((res) => res.data);

export const unlinkSharedPart = (sharedPartId, itemId) =>
  api
    .post(`/shared-parts/${sharedPartId}/unlink`, { itemId })
    .then((res) => res.data);

// updates: { name?, floorId?, areas?, field?, change?, damageDescription? }
export const updateSharedPart = (sharedPartId, updates) =>
  api.patch(`/shared-parts/${sharedPartId}`, updates).then((res) => res.data);

export const uploadSharedPartPhotos = (sharedPartId, formData) =>
  api
    .post(`/shared-parts/${sharedPartId}/photos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);

export const deleteSharedPartPhoto = (sharedPartId, photoId) =>
  api
    .delete(`/shared-parts/${sharedPartId}/photos/${photoId}`)
    .then((res) => res.data);

export const deleteSharedPart = (sharedPartId) =>
  api.delete(`/shared-parts/${sharedPartId}`).then((res) => res.data);
