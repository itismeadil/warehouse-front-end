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
import { useAlert } from "../hooks/useAlert";
import EmptyState from "./EmptyState";

function FloorCard({ floor, occupancy, onDelete, onRestore }) {
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
      className={`group rounded-2xl border bg-gradient-to-br from-white to-graphite-50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:from-graphite-800 dark:to-graphite-900 ${
        isDeleted
          ? "border-red-200 from-red-50 to-white dark:border-red-900/70 dark:from-red-950/40 dark:to-graphite-800"
          : "border-graphite-200 hover:border-primary-300 dark:border-graphite-700"
      }`}
    >
      <div className="mb-5 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2
              className={`text-xl font-bold ${isDeleted ? "text-red-900 dark:text-red-200" : "text-graphite-900 dark:text-graphite-100"}`}
            >
              {floor.name}
            </h2>
            {!isDeleted && (
              <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                {floor.rows}×{floor.cols}
              </span>
            )}
          </div>

          {!isDeleted && (
            <div className="mt-2 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-violet-500"></div>
                <span className="text-graphite-600 dark:text-graphite-300">{occupiedCount} occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-graphite-300 dark:bg-graphite-600"></div>
                <span className="text-graphite-600 dark:text-graphite-300">
                  {totalCells - occupiedCount} free
                </span>
              </div>
              <div className="ml-auto text-sm font-medium text-graphite-700 dark:text-graphite-200">
                {occupancyPercentage}% full
              </div>
            </div>
          )}

          {isDeleted && (
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                Deleted
              </span>
              <p className="text-xs text-red-600">
                {daysSinceDeletion === 0
                  ? "today"
                  : `${daysSinceDeletion} day(s) ago`}{" "}
                •{" "}
                {daysUntilPermanentDelete === 0
                  ? "Will be deleted permanently soon"
                  : `${daysUntilPermanentDelete} day(s) until permanent deletion`}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isDeleted && (
            <button
              onClick={() => onDelete(floor)}
              className="rounded-lg p-2 text-graphite-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:hover:bg-red-950/40"
              title="Delete floor"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          {isDeleted && (
            <button
              onClick={() => onRestore(floor)}
              className="rounded-lg p-2 text-red-400 transition-all duration-200 hover:bg-green-50 hover:text-green-600 hover:shadow-md"
              title="Restore floor"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {!isDeleted && (
        <div className="rounded-xl border border-graphite-200 bg-white p-4 shadow-inner dark:border-graphite-700 dark:bg-graphite-800">
          {occupancy ? (
            <FloorGrid
              rows={floor.rows}
              cols={floor.cols}
              shapeCells={shapeCells}
              occupied={occupancy.occupied}
            />
          ) : (
            <div className="flex items-center justify-center py-8 text-graphite-400">
              <p className="text-sm">Loading occupancy data...</p>
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
      showToast("Give the floor a name first");
      return;
    }
    if (!preset) {
      showToast("Pick a size first");
      return;
    }
    if (!template) {
      showToast("Pick a starting layout first");
      return;
    }

    const cells = editorRef.current?.getCells() || [];
    if (cells.length === 0) {
      showToast("Draw the floor's shape by tapping the dots");
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
      showToast("Error: " + (error.response?.data?.message || error.message));
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
      showToast("Floor restored successfully.");
      setShowDeleted(false); // Switch back to showing active floors
      loadFloors();
    } catch (error) {
      showToast("Error: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-graphite-50 to-graphite-100 dark:from-graphite-950 dark:to-graphite-900">
      <div className="fixed inset-x-0 top-4 z-50 flex justify-center pointer-events-none">
        {toast && (
          <div className="pointer-events-auto rounded-xl bg-graphite-900/95 px-6 py-3 text-sm text-white shadow-xl backdrop-blur-sm">
            {toast}
          </div>
        )}
      </div>

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-graphite-900 dark:text-graphite-100">
            {t("floorMaps")}
          </h1>
          <p className="mt-2 text-sm text-graphite-600 dark:text-graphite-300">
            {t("floorMapsDescription")}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowDeleted((v) => !v)}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium shadow-md transition-all duration-200 ${
              showDeleted
                ? "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg"
                : "border border-graphite-200 bg-white text-graphite-700 hover:bg-graphite-50 dark:border-graphite-700 dark:bg-graphite-800 dark:text-graphite-200 dark:hover:bg-graphite-700"
            }`}
          >
            {showDeleted ? "Hide Deleted" : "Show Deleted"}
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-primary-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <span className="text-lg leading-none">+</span>
            {t("addFloor")}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-5 rounded-2xl border border-graphite-200 bg-gradient-to-br from-white to-graphite-50 p-8 shadow-lg dark:border-graphite-700 dark:from-graphite-800 dark:to-graphite-900">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-graphite-900 dark:text-graphite-100">
              {t("newFloor")}
            </h2>
            <p className="mt-1 text-sm text-graphite-600 dark:text-graphite-300">
              {t("createFloorDescription")}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-graphite-700 dark:text-graphite-200">
                {t("name")}
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("floorNamePlaceholder")}
                className="mt-2 block w-full max-w-md rounded-xl border border-graphite-300 bg-white px-4 py-3 text-sm text-graphite-900 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-900 dark:text-graphite-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-graphite-700 dark:text-graphite-200">
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
                    className={`flex h-20 w-20 flex-col items-center justify-center gap-2 rounded-xl border-2 transition-all duration-200 ${
                      preset?.id === p.id
                        ? "border-primary-500 bg-primary-50 shadow-md"
                        : "border-graphite-200 bg-white hover:border-graphite-300 hover:shadow-sm dark:border-graphite-700 dark:bg-graphite-900 dark:hover:border-graphite-600"
                    }`}
                  >
                    <span
                      className={`rounded-md transition-all duration-200 ${
                        preset?.id === p.id ? "bg-primary-600" : "bg-graphite-400 dark:bg-graphite-600"
                      }`}
                      style={{
                        width: p.previewPx,
                        height: p.previewPx,
                      }}
                    />
                    <span className="text-xs font-medium text-graphite-600 dark:text-graphite-300">
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {preset && (
              <div>
                <label className="block text-sm font-semibold text-graphite-700 dark:text-graphite-200">
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
                <label className="block text-sm font-semibold text-graphite-700 dark:text-graphite-200">
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
                className="rounded-xl border border-graphite-300 px-6 py-2.5 text-sm font-medium text-graphite-700 transition-all duration-200 hover:bg-graphite-50 hover:shadow-sm dark:border-graphite-600 dark:text-graphite-200 dark:hover:bg-graphite-700"
              >
                {t("cancel")}
              </button>

              <button
                type="button"
                onClick={handleCreateFloor}
                disabled={saving}
                className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-primary-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? t("saving") : t("createFloor")}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-graphite-200 bg-gradient-to-br from-graphite-50 to-white py-16 shadow-sm dark:border-graphite-700 dark:from-graphite-900 dark:to-graphite-800">
          <div className="flex flex-col items-center gap-4 rounded-xl bg-white px-8 py-10 text-center shadow-md dark:bg-graphite-800">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-current border-t-transparent"
              style={{ color: "#317272" }}
              aria-hidden
            />
            <p className="text-base font-medium text-graphite-700 dark:text-graphite-200">
              {t("loading")}
            </p>
          </div>
        </div>
      ) : floors.length === 0 ? (
        <EmptyState
          icon={Map}
          title={t("noFloors")}
          description={t("createFirstFloorDescription")}
          action={{
            label: t("addFloor"),
            onClick: () => setShowForm(true),
          }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
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
