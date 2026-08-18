import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link2, Plus } from "lucide-react";
import { getSharedParts, createSharedPart, linkSharedPart } from "../api/sharedParts";
import { areasSize } from "../lib/floorShape";
import FloorPickerModal from "./FloorPickerModal";

// Lets an admin/manager either:
//  - "Link existing": attach an already-created shared part (e.g. the
//    "Bottom" that item 1622-Silver already placed) to this item, with no
//    new location needed — this is what avoids double-booking a spot for
//    a part that's physically the same across color variants.
//  - "Create new": define a brand-new shared part starting out linked to
//    just this item; more color variants can link to it later the same way.
export default function AddSharedPartForm({
  itemId,
  floors,
  existingSharedPartIds = [],
  onLinked,
  onCancel,
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState("link"); // "link" | "new"

  // Link-existing mode
  const [available, setAvailable] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [linking, setLinking] = useState(false);

  // New shared part mode
  const [name, setName] = useState("");
  const [floorId, setFloorId] = useState(null);
  const [floorName, setFloorName] = useState(null);
  const [areas, setAreas] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    getSharedParts()
      .then((parts) =>
        setAvailable(
          parts.filter((p) => !existingSharedPartIds.includes(p._id)),
        ),
      )
      .catch((err) => console.error("Failed to load shared parts:", err))
      .finally(() => setLoadingAvailable(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLink = async () => {
    if (!selectedId) {
      setError(t("selectSharedPartError", "Choose a shared part to link"));
      return;
    }
    setLinking(true);
    setError("");
    try {
      const updated = await linkSharedPart(selectedId, itemId);
      onLinked?.(updated);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLinking(false);
    }
  };

  const handleCreate = async () => {
    if (!floorId || areas.length === 0) {
      setError(t("completeCurrentPartError"));
      return;
    }
    setCreating(true);
    setError("");
    try {
      const created = await createSharedPart({
        name: name.trim(),
        items: [itemId],
        floorId,
        areas,
      });
      onLinked?.(created);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/50 p-4">
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("link")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            mode === "link"
              ? "bg-primary-600 text-white"
              : "border border-graphite-300 bg-white text-graphite-700"
          }`}
        >
          <Link2 className="me-1.5 inline h-4 w-4" />
          {t("linkExistingSharedPart", "Link existing shared part")}
        </button>
        <button
          type="button"
          onClick={() => setMode("new")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            mode === "new"
              ? "bg-primary-600 text-white"
              : "border border-graphite-300 bg-white text-graphite-700"
          }`}
        >
          <Plus className="me-1.5 inline h-4 w-4" />
          {t("createNewSharedPart", "Create new shared part")}
        </button>
      </div>

      {mode === "link" ? (
        <div>
          <p className="mb-2 text-xs text-graphite-500">
            {t(
              "linkSharedPartHint",
              "Reuse a part that's already placed for another color of this item — no new location needed.",
            )}
          </p>
          {loadingAvailable ? (
            <p className="text-sm text-graphite-500">{t("loading")}</p>
          ) : available.length === 0 ? (
            <p className="text-sm text-graphite-500">
              {t(
                "noSharedPartsAvailable",
                "No shared parts exist yet — create one instead.",
              )}
            </p>
          ) : (
            <div className="space-y-2">
              {available.map((sp) => (
                <label
                  key={sp._id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                    selectedId === sp._id
                      ? "border-primary-400 bg-primary-50"
                      : "border-graphite-200 bg-white hover:bg-graphite-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="sharedPart"
                    value={sp._id}
                    checked={selectedId === sp._id}
                    onChange={() => setSelectedId(sp._id)}
                    className="text-primary-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-graphite-900">
                      {sp.name || t("sharedPart", "Shared part")}
                    </div>
                    <div className="text-xs text-graphite-500">
                      {sp.floorId?.name ?? t("floor")} ·{" "}
                      {t("usedBy", "Used by")}:{" "}
                      {(sp.linkedItems || [])
                        .map((i) => `${i.name} (${i.color})`)
                        .join(", ")}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleLink}
              disabled={linking || available.length === 0}
              className="flex-1 rounded-lg bg-primary-600 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {linking ? t("saving") : t("link", "Link")}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={linking}
              className="rounded-lg border border-graphite-300 bg-white px-4 py-2 text-sm font-medium text-graphite-700 transition-colors hover:bg-graphite-50"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-graphite-700">
            {t("sharedPartName", "Part name")}{" "}
            <span className="font-normal text-graphite-400">
              ({t("optional")})
            </span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("sharedPartNamePlaceholder", "e.g. Bottom, Legs")}
            className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />

          <label className="mt-3 block text-sm font-medium text-graphite-700">
            {t("location")}
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm text-graphite-900">
              {floorId && areas.length > 0 ? (
                <>
                  {floorName ?? t("floor")} · {areasSize(areas)}{" "}
                  {areasSize(areas) === 1 ? t("square") : t("squares")}
                </>
              ) : (
                <span className="text-graphite-400">
                  {t("noLocationSet")}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="whitespace-nowrap rounded-lg border border-graphite-300 px-3 py-2 text-sm font-medium text-graphite-700 transition-colors hover:bg-graphite-100"
            >
              {floorId ? t("change") : t("choose")}
            </button>
          </div>

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 rounded-lg bg-primary-600 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? t("saving") : t("savePart")}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={creating}
              className="rounded-lg border border-graphite-300 bg-white px-4 py-2 text-sm font-medium text-graphite-700 transition-colors hover:bg-graphite-50"
            >
              {t("cancel")}
            </button>
          </div>

          {showPicker && (
            <FloorPickerModal
              floors={floors}
              initialFloorId={floorId}
              initialArea={areas.length > 0 ? areas : null}
              onClose={() => setShowPicker(false)}
              onConfirm={({ floorId: fId, floorName: fName, areas: a, area }) => {
                setFloorId(fId);
                setFloorName(fName);
                setAreas(a || (area ? [area] : []));
                setShowPicker(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
