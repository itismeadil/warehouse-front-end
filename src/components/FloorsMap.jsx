import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, RotateCcw, Map } from "lucide-react";
import {
  getFloors,
  createFloor,
  getFloorOccupancy,
  deleteFloor,
  restoreFloor,
} from "../api/floors";
import { FLOOR_SIZE_PRESETS } from "../floorSizePresets";
import { encodeShape, decodeShape, areaSize } from "../lib/floorShape";
import FloorShapeEditor from "./FloorShapeEditor";
import FloorShapeTemplatePicker from "./FloorShapeTemplatePicker";
import FloorGrid from "./FloorGrid";
import AlertModal from "./AlertModal";
import EmptyState from "./EmptyState";
import { useAlert } from "../hooks/useAlert";

function FloorCard({ floor, occupancy, onDelete, onRestore }) {
  const { t } = useTranslation();

  const shapeCells = useMemo(
    () => decodeShape(floor.rows, floor.cols, floor.shape),
    [floor],
  );

  const occupiedCount = useMemo(
    () =>
      occupancy
        ? occupancy.occupied.reduce((sum, o) => sum + areaSize(o.area), 0)
        : 0,
    [occupancy],
  );

  const totalCells = shapeCells.length;
  const occupancyPercentage =
    totalCells > 0 ? Math.round((occupiedCount / totalCells) * 100) : 0;

  const isDeleted = !!floor.deletedAt;
  const daysSinceDeletion = isDeleted
    ? Math.floor(
        (Date.now() - new Date(floor.deletedAt).getTime()) /
          (24 * 60 * 60 * 1000),
      )
    : 0;
  const daysUntilPermanentDelete = isDeleted
    ? Math.max(0, 3 - daysSinceDeletion)
    : 0;

  return (
    <div
      className={`group rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-graphite-800 ${
        isDeleted
          ? "border-red-200 dark:border-red-800"
          : "border-graphite-200 hover:border-primary-300 dark:border-graphite-700"
      }`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2
              className={`text-base font-semibold ${isDeleted ? "text-red-900 dark:text-red-300" : "text-graphite-900 dark:text-graphite-100"}`}
            >
              {floor.name}
            </h2>
            {!isDeleted && (
              <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                {floor.rows}×{floor.cols}
              </span>
            )}
          </div>

          {!isDeleted && (
            <div className="mt-2 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-violet-500"></div>
                <span className="text-graphite-600 dark:text-graphite-400">
                  {t("occupiedCount", { value: occupiedCount })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-graphite-300 dark:bg-graphite-600"></div>
                <span className="text-graphite-600 dark:text-graphite-400">
                  {t("freeCount", { value: totalCells - occupiedCount })}
                </span>
              </div>
              <div className="ml-auto text-sm font-medium text-graphite-700 dark:text-graphite-300">
                {t("percentFull", { percent: occupancyPercentage })}
              </div>
            </div>
          )}

          {isDeleted && (
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                {t("deleted")}
              </span>
              <p className="text-xs text-red-600 dark:text-red-400">
                {daysSinceDeletion === 0
                  ? t("today")
                  : t("daysAgo", { value: daysSinceDeletion })}{" "}
                •{" "}
                {daysUntilPermanentDelete === 0
                  ? t("deletedPermanentlySoon")
                  : t("daysUntilPermanentDeletion", {
                      value: daysUntilPermanentDelete,
                    })}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isDeleted && (
            <button
              onClick={() => onDelete(floor)}
              className="rounded-lg p-2 text-graphite-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-graphite-500 dark:hover:bg-red-900/30"
              title={t("deleteFloor")}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          {isDeleted && (
            <button
              onClick={() => onRestore(floor)}
              className="rounded-lg p-2 text-red-400 transition-colors hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/30"
              title={t("restoreFloor")}
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {!isDeleted && (
        <div className="rounded-xl border border-graphite-200 bg-white p-4 dark:border-graphite-700 dark:bg-graphite-900">
          {occupancy ? (
            <FloorGrid
              rows={floor.rows}
              cols={floor.cols}
              shapeCells={shapeCells}
              occupied={occupancy.occupied}
            />
          ) : (
            <div className="flex items-center justify-center py-8 text-graphite-400 dark:text-graphite-500">
              <p className="text-sm">{t("loadingOccupancy")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FloorsMap() {
  const [floors, setFloors] = useState([]);
  const [occupancyByFloor, setOccupancyByFloor] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  const [name, setName] = useState("");
  const [preset, setPreset] = useState(null);
  const [template, setTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const editorRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const { t } = useTranslation();
  const { alert, showAlert, hideAlert, showConfirm } = useAlert();

  const loadFloors = async () => {
    setLoading(true);
    try {
      const data = await getFloors(showDeleted);
      const sortedData = data.sort((a, b) => b.name.localeCompare(a.name));
      setFloors(sortedData);

      // Only load occupancy for non-deleted floors
      const nonDeletedFloors = sortedData.filter((floor) => !floor.deletedAt);
      const occupancyEntries = await Promise.all(
        nonDeletedFloors.map((floor) =>
          getFloorOccupancy(floor._id).then((res) => [floor._id, res]),
        ),
      );
      setOccupancyByFloor(Object.fromEntries(occupancyEntries));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFloors();
  }, [showDeleted]);

  const resetForm = () => {
    setName("");
    setPreset(null);
    setTemplate(null);
    setShowForm(false);
  };

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 3500);
  };

  const handleCreateFloor = async () => {
    if (!name) {
      showToast(t("floorNameRequired"));
      return;
    }
    if (!preset) {
      showToast(t("floorSizeRequired"));
      return;
    }
    if (!template) {
      showToast(t("floorLayoutRequired"));
      return;
    }

    const cells = editorRef.current?.getCells() || [];
    if (cells.length === 0) {
      showToast(t("floorShapeRequired"));
      return;
    }

    const shape = encodeShape(preset.rows, preset.cols, cells);

    setSaving(true);
    try {
      await createFloor({
        name,
        rows: preset.rows,
        cols: preset.cols,
        shape,
      });
      resetForm();
      loadFloors();
    } catch (error) {
      showToast(
        t("error") + ": " + (error.response?.data?.message || error.message),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFloor = async (floor) => {
    const confirmed = await showConfirm(
      `${t("confirmDeleteFloor", "Are you sure you want to delete")} "${floor.name}"? ${t("undoWarning", "You can undo this action within 3 days.")}`,
      {
        title: t("deleteFloor", "Delete Floor"),
        type: "warning",
        confirmText: t("delete", "Delete"),
        cancelText: t("cancel", "Cancel"),
      },
    );

    if (!confirmed) return;

    try {
      await deleteFloor(floor._id);
      showToast(
        t("floorDeleted", "Floor deleted. You can undo this within 3 days."),
      );
      loadFloors();
    } catch (error) {
      showToast(
        t("error", "Error") +
          ": " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const handleRestoreFloor = async (floor) => {
    try {
      await restoreFloor(floor._id);
      showToast(t("floorRestored"));
      setShowDeleted(false); // Switch back to showing active floors
      loadFloors();
    } catch (error) {
      showToast(
        t("error") + ": " + (error.response?.data?.message || error.message),
      );
    }
  };

  return (
    <div>
      <div className="fixed inset-x-0 top-4 z-50 flex justify-center pointer-events-none">
        {toast && (
          <div className="pointer-events-auto rounded-xl bg-graphite-900/95 px-4 py-3 text-sm text-white shadow-xl backdrop-blur-sm dark:bg-graphite-700/95">
            {toast}
          </div>
        )}
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-graphite-900 dark:text-graphite-100">
            {t("floorMaps")}
          </h1>
          <p className="mt-1 text-sm text-graphite-600 dark:text-graphite-400">
            {t("floorMapsDescription")}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowDeleted((v) => !v)}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              showDeleted
                ? "bg-red-600 text-white hover:bg-red-700"
                : "border border-graphite-300 bg-white text-graphite-700 hover:bg-graphite-50 dark:border-graphite-600 dark:bg-graphite-800 dark:text-graphite-300 dark:hover:bg-graphite-700"
            }`}
          >
            {showDeleted ? t("hideDeleted") : t("showDeleted")}
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-graphite-900"
          >
            <span className="text-lg leading-none">+</span>
            {t("addFloor")}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-5 rounded-xl border border-graphite-200 bg-white p-4 shadow-sm dark:border-graphite-700 dark:bg-graphite-800">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-graphite-900 dark:text-graphite-100">
              {t("newFloor")}
            </h2>
            <p className="mt-1 text-sm text-graphite-600 dark:text-graphite-400">
              {t("newFloorDescription")}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-graphite-700 dark:text-graphite-300">
                {t("name")}
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("floorNamePlaceholder")}
                className="mt-1.5 block w-full max-w-md rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-700 dark:text-graphite-100 dark:placeholder:text-graphite-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-graphite-700 dark:text-graphite-300">
                {t("size")}
              </label>

              <div className="mt-3 flex items-end gap-4">
                {FLOOR_SIZE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPreset(p);
                      setTemplate(null); // changing size invalidates the previous template pick
                    }}
                    className={`flex h-20 w-20 flex-col items-center justify-center gap-2 rounded-xl border-2 transition-colors ${
                      preset?.id === p.id
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30"
                        : "border-graphite-200 bg-white hover:border-graphite-300 dark:border-graphite-700 dark:bg-graphite-800 dark:hover:border-graphite-600"
                    }`}
                  >
                    <span
                      className={`rounded-md transition-colors ${
                        preset?.id === p.id
                          ? "bg-primary-600"
                          : "bg-graphite-400"
                      }`}
                      style={{
                        width: p.previewPx,
                        height: p.previewPx,
                      }}
                    />
                    <span className="text-xs font-medium text-graphite-600 dark:text-graphite-400">
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {preset && (
              <div>
                <label className="block text-sm font-semibold text-graphite-700 dark:text-graphite-300">
                  {t("chooseStartingLayout", "Starting layout")}
                </label>
                <p className="mt-1 text-sm text-graphite-500 dark:text-graphite-400">
                  {t(
                    "chooseStartingLayoutHelp",
                    "Pick the shape closest to your floor. You can still fine-tune it below.",
                  )}
                </p>

                <div className="mt-3">
                  <FloorShapeTemplatePicker
                    rows={preset.rows}
                    cols={preset.cols}
                    selectedId={template?.id}
                    onSelect={setTemplate}
                  />
                </div>
              </div>
            )}

            {preset && template && (
              <div>
                <label className="block text-sm font-semibold text-graphite-700 dark:text-graphite-300">
                  {t("drawFloorShape")}
                </label>
                <p className="mt-1 text-sm text-graphite-500 dark:text-graphite-400">
                  {t(
                    "fineTuneShapeHelp",
                    "Tap dots to add or remove cells and adjust the edges.",
                  )}
                </p>

                <div className="mt-3">
                  <FloorShapeEditor
                    // Re-key on both preset and template so switching either
                    // remounts the editor with a fresh, pre-filled starting shape.
                    key={`${preset.id}-${template.id}`}
                    ref={editorRef}
                    rows={preset.rows}
                    cols={preset.cols}
                    initialCells={template.getCells(preset.rows, preset.cols)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => editorRef.current?.clear()}
                  className="mt-3 text-sm font-medium text-graphite-500 transition-colors hover:text-red-600 dark:text-graphite-400"
                >
                  {t("clearDrawing")}
                </button>
              </div>
            )}

            <div className="flex gap-3 border-t border-graphite-200 pt-4 dark:border-graphite-700">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-graphite-300 px-4 py-2 text-sm font-medium text-graphite-700 transition-colors hover:bg-graphite-50 dark:border-graphite-600 dark:text-graphite-300 dark:hover:bg-graphite-700"
              >
                {t("cancel")}
              </button>

              <button
                type="button"
                onClick={handleCreateFloor}
                disabled={saving}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? t("saving") : t("createFloor")}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-graphite-200 bg-white py-16 shadow-sm dark:border-graphite-700 dark:bg-graphite-800">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-current border-t-transparent"
            style={{ color: "#317272" }}
            aria-hidden
          />
          <p className="text-sm font-medium text-graphite-700 dark:text-graphite-300">
            {t("loading")}
          </p>
        </div>
      ) : floors.length === 0 ? (
        <EmptyState
          icon={Map}
          title={t("noFloorsTitle")}
          description={t("noFloorsDescription")}
          action={{ label: t("createFloor"), onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {floors.map((floor) => (
            <FloorCard
              key={floor._id}
              floor={floor}
              occupancy={occupancyByFloor[floor._id]}
              onDelete={handleDeleteFloor}
              onRestore={handleRestoreFloor}
            />
          ))}
        </div>
      )}

      <AlertModal
        isOpen={!!alert}
        onClose={hideAlert}
        title={alert?.title}
        message={alert?.message}
        type={alert?.type}
        showCancel={alert?.showCancel}
        confirmText={alert?.confirmText}
        cancelText={alert?.cancelText}
        onConfirm={alert?.onConfirm}
      />
    </div>
  );
}
