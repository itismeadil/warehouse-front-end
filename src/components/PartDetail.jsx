import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Plus, Minus, ImagePlus, X } from "lucide-react";
import { getFloorOccupancy, getFloors } from "../api/floors";
import { updatePart, uploadPartPhotos, deletePartPhoto } from "../api/items";
import { areaSize, decodeShape, expandArea } from "../lib/floorShape";
import { partLabel } from "../lib/Partlabel";
import { useAuth } from "../context/AuthContext";
import FloorGrid from "./FloorGrid";
import FloorPickerModal from "./FloorPickerModal";

const STATS = [
  { key: "stock", label: "stock", editable: false },
  { key: "damaged", label: "damaged", editable: true },
  { key: "reserved", label: "reserved", editable: true },
  { key: "sold", label: "sold", editable: true },
];

function StatCard({ label, value, editable, onDecrement, onIncrement, t }) {
  return (
    <div className="rounded-lg border border-graphite-200 bg-white p-3">
      <p className="text-xs text-graphite-500">{label}</p>
      {editable ? (
        <div className="mt-1.5 flex items-center justify-between">
          <button
            type="button"
            onClick={onDecrement}
            aria-label={t("decrease")}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-graphite-300 bg-white text-graphite-600 transition-colors hover:bg-graphite-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="text-lg font-semibold text-graphite-900">
            {value || 0}
          </span>
          <button
            type="button"
            onClick={onIncrement}
            aria-label={t("increase")}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-graphite-300 bg-white text-graphite-600 transition-colors hover:bg-graphite-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <p className="mt-1.5 text-lg font-semibold text-graphite-900">
          {value ?? 0}
        </p>
      )}
    </div>
  );
}

export default function PartDetail({
  item,
  part,
  onBack,
  onUpdateField,
  onPartUpdated,
  embedded = false, // true when rendered inline inside an accordion card
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "manager";

  const [activeTab, setActiveTab] = useState("location");
  const [partFloorMap, setPartFloorMap] = useState(null);
  const [partFloorMapLoading, setPartFloorMapLoading] = useState(false);
  const [floors, setFloors] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);

  // Damage photos — capped at part.damaged (one photo per damaged unit).
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [damageDescription, setDamageDescription] = useState(
    part.damageDescription || "",
  );
  const [savingDescription, setSavingDescription] = useState(false);
  const fileInputRef = useRef(null);

  const photos = (part.photos || []).map((p) => ({ id: p._id, url: p.url }));
  const hasLocation = Boolean(part.floorId && part.area);
  const maxPhotos = part.damaged || 0;
  const remainingSlots = Math.max(0, maxPhotos - photos.length);

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const accepted = files.slice(0, remainingSlots);
    if (files.length > accepted.length) {
      alert(t("photoLimitReached", { count: maxPhotos }));
    }
    if (accepted.length === 0) return;

    const formData = new FormData();
    accepted.forEach((file) => formData.append("photos", file));

    setUploadingPhotos(true);
    try {
      const updated = await uploadPartPhotos(item._id, part._id, formData);
      onPartUpdated?.(updated);
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleRemovePhoto = async (photoId) => {
    setDeletingPhotoId(photoId);
    try {
      const updated = await deletePartPhoto(item._id, part._id, photoId);
      onPartUpdated?.(updated);
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setDeletingPhotoId(null);
    }
  };

  useEffect(() => {
    setDamageDescription(part.damageDescription || "");
  }, [part._id, part.damageDescription]);

  const handleSaveDescription = async () => {
    setSavingDescription(true);
    try {
      const updated = await updatePart(item._id, part._id, {
        damageDescription: damageDescription.trim() || null,
      });
      onPartUpdated?.(updated);
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setSavingDescription(false);
    }
  };

  const descriptionDirty =
    damageDescription.trim() !== (part.damageDescription || "").trim();

  useEffect(() => {
    const floorId = part?.floorId?._id;
    if (!floorId) {
      setPartFloorMap(null);
      return;
    }

    setPartFloorMapLoading(true);
    getFloorOccupancy(floorId)
      .then(setPartFloorMap)
      .catch((err) => {
        console.error(err);
        setPartFloorMap(null);
      })
      .finally(() => setPartFloorMapLoading(false));
  }, [part?.floorId?._id]);

  useEffect(() => {
    if (!canEdit) return;
    getFloors()
      .then(setFloors)
      .catch((err) => console.error("Failed to load floors:", err));
  }, [canEdit]);

  const handleLocationConfirm = async ({ floorId, area }) => {
    setSavingLocation(true);
    try {
      const updated = await updatePart(item._id, part._id, {
        floorId,
        area,
      });
      onPartUpdated?.(updated);
      setShowPicker(false);
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setSavingLocation(false);
    }
  };

  const handleClearLocation = async () => {
    if (!confirm(t("confirmClearLocation"))) return;

    setSavingLocation(true);
    try {
      const updated = await updatePart(item._id, part._id, {
        floorId: null,
        area: null,
      });
      onPartUpdated?.(updated);
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setSavingLocation(false);
    }
  };

  return (
    <div className={embedded ? "" : "mx-auto max-w-2xl"}>
      {!embedded && (
        <>
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-graphite-600 transition-colors hover:text-graphite-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("backTo")} {item?.name || t("item")}
          </button>

          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
                {item?.name}
              </p>

              <h2 className="mt-0.5 text-2xl font-bold text-graphite-900">
                {partLabel(item, part)}
              </h2>
            </div>

            {hasLocation && (
              <span className="mt-1 shrink-0 rounded-full border border-graphite-200 bg-graphite-200 px-3 py-1 text-xs font-semibold text-graphite-700">
                {part.floorId.name}
              </span>
            )}
          </div>
        </>
      )}

      {/* Tab switcher */}
      <div
        className={`${embedded ? "" : "mt-6"} rounded-xl border border-graphite-200 bg-graphite-50 p-1`}
      >
        <div className="flex gap-2">
          {[
            { id: "location", label: t("location") },
            { id: "stats", label: t("stats") },
            { id: "pictures", label: t("pictures") },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-white text-graphite-900 shadow-sm"
                  : "text-graphite-500 hover:text-graphite-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "location" && (
        <div className="mt-4 overflow-hidden rounded-xl border border-graphite-200 bg-graphite-50 shadow-sm">
          <div className="flex items-center justify-between border-b border-graphite-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-graphite-700">
              {t("floorLocation")}
            </h3>

            {hasLocation && (
              <span className="text-xs font-medium text-graphite-500">
                {areaSize(part.area)}{" "}
                {areaSize(part.area) === 1 ? t("square") : t("squares")}
              </span>
            )}
          </div>

          <div className="p-4">
            {!hasLocation ? (
              <p className="py-8 text-center text-sm text-graphite-500">
                {t("noLocationAssigned")}
              </p>
            ) : partFloorMapLoading || !partFloorMap ? (
              <div className="flex flex-col items-center gap-3 rounded-md bg-graphite-50 px-6 py-8 text-center">
                <div
                  className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent"
                  style={{ color: "#45a1a1" }}
                  aria-hidden
                />
                <p className="text-sm text-graphite-600">{t("loading")}</p>
              </div>
            ) : (
              <div className="flex justify-center rounded-lg bg-white p-3 shadow-inner">
                <FloorGrid
                  rows={partFloorMap.floor.rows}
                  cols={partFloorMap.floor.cols}
                  shapeCells={decodeShape(
                    partFloorMap.floor.rows,
                    partFloorMap.floor.cols,
                    partFloorMap.floor.shape,
                  )}
                  occupied={partFloorMap.occupied}
                  selectedCells={expandArea(part.area)}
                />
              </div>
            )}

            {canEdit && (
              <div className="mt-4 flex gap-2">
                {hasLocation ? (
                  <button
                    type="button"
                    onClick={handleClearLocation}
                    disabled={savingLocation}
                    className="flex-1 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("clearLocation")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPicker(true)}
                    disabled={savingLocation}
                    className="flex-1 rounded-lg border border-graphite-300 py-2 text-sm font-medium text-graphite-700 transition-colors hover:bg-graphite-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("setLocation")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="mt-4 rounded-xl border border-graphite-200 bg-graphite-50 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-graphite-700">
              {t("inventory")}
            </h3>

            <span className="text-xs text-graphite-500">
              {part.stock !== undefined
                ? t("stockCount", { count: part.stock })
                : ""}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {STATS.map(({ key, label, editable }) => (
              <StatCard
                key={key}
                label={t(label)}
                value={part[key]}
                editable={editable && canEdit}
                t={t}
                onDecrement={() => onUpdateField(part._id, key, -1)}
                onIncrement={() => onUpdateField(part._id, key, 1)}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === "pictures" && (
        <div className="mt-4 rounded-xl border border-graphite-200 bg-graphite-50 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-graphite-700">
              {t("damagePhotos")}
            </h3>
            <span className="text-xs text-graphite-500">
              {t("photoCount", { count: photos.length, max: maxPhotos })}
            </span>
          </div>

          {maxPhotos === 0 ? (
            <p className="py-8 text-center text-sm text-graphite-500">
              {t("noDamagedItems")}
            </p>
          ) : (
            <>
              {canEdit && (
                <div className="mb-4">
                  <label
                    htmlFor={`damage-desc-${part._id}`}
                    className="mb-1.5 block text-xs font-medium text-graphite-600"
                  >
                    {t("damageDescription")}{" "}
                    <span className="font-normal text-graphite-400">
                      ({t("optional")})
                    </span>
                  </label>
                  <textarea
                    id={`damage-desc-${part._id}`}
                    value={damageDescription}
                    onChange={(e) => setDamageDescription(e.target.value)}
                    rows={3}
                    placeholder={t("damageDescriptionPlaceholder")}
                    className="w-full resize-none rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                  {descriptionDirty && (
                    <button
                      type="button"
                      onClick={handleSaveDescription}
                      disabled={savingDescription}
                      className="mt-2 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingDescription ? t("saving") : t("saveDescription")}
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-graphite-200 bg-white"
                  >
                    <img
                      src={photo.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        disabled={deletingPhotoId === photo.id || uploadingPhotos}
                        aria-label={t("removePhoto")}
                        className="absolute inset-e-1 top-1 rounded-full bg-graphite-900/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingPhotoId === photo.id ? (
                          <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                ))}

                {canEdit && remainingSlots > 0 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhotos || deletingPhotoId !== null}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-graphite-300 text-graphite-400 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadingPhotos ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <ImagePlus className="h-5 w-5" />
                    )}
                    <span className="text-xs font-medium">
                      {uploadingPhotos ? t("uploading") : t("addPhoto")}
                    </span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                disabled={uploadingPhotos}
                onChange={handleFilesSelected}
                className="hidden"
              />

              <p className="mt-3 text-xs text-graphite-400">
                {remainingSlots > 0
                  ? t("photoSlotsRemaining", { count: remainingSlots })
                  : t("photoLimitReached", { count: maxPhotos })}
              </p>
            </>
          )}
        </div>
      )}

      {showPicker && (
        <FloorPickerModal
          floors={floors}
          initialFloorId={part.floorId?._id}
          initialArea={hasLocation ? part.area : null}
          onClose={() => setShowPicker(false)}
          onConfirm={handleLocationConfirm}
        />
      )}
    </div>
  );
}
