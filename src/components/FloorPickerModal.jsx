import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getFloorOccupancy } from "../api/floors";
import { X } from "lucide-react";
import { decodeShape, expandArea } from "../lib/floorShape";
import FloorGrid from "./FloorGrid";

const MIN_CELLS = 1;

const toastRootId = "floor-picker-toast-root";
const showToast = (message, type = "info") => {
  if (typeof document === "undefined") return;

  let root = document.getElementById(toastRootId);
  if (!root) {
    root = document.createElement("div");
    root.id = toastRootId;
    Object.assign(root.style, {
      position: "fixed",
      right: "1rem",
      bottom: "1rem",
      zIndex: "9999",
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      alignItems: "flex-end",
      pointerEvents: "none",
    });
    document.body.appendChild(root);
  }

  const toast = document.createElement("div");
  Object.assign(toast.style, {
    backgroundColor: type === "error" ? "#dc2626" : "#0f172a",
    color: "white",
    padding: "0.75rem 1rem",
    borderRadius: "0.5rem",
    boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
    fontSize: "0.875rem",
    maxWidth: "320px",
    pointerEvents: "auto",
  });
  toast.textContent = message;
  root.appendChild(toast);

  setTimeout(() => {
    toast.remove();
    if (root.childElementCount === 0) {
      root.remove();
    }
  }, 4000);
};

export default function FloorPickerModal({
  floors,
  initialFloorId,
  initialArea,
  onConfirm,
  onClose,
  savedParts = [],
  currentPartId = null,
}) {
  const [floorId, setFloorId] = useState(initialFloorId || "");
  const [occupancy, setOccupancy] = useState(null);
  const [selectedCells, setSelectedCells] = useState(
    initialArea ? expandArea(initialArea) : [],
  );
  const [loading, setLoading] = useState(!!initialFloorId);
  const [selectionMode, setSelectionMode] = useState("dots"); // "dots" or "squares"

  const { t } = useTranslation();

  const selectedFloor = floors.find((f) => f._id === floorId);

  const shapeCells = useMemo(() => {
    if (!occupancy) return [];
    return decodeShape(
      occupancy.floor.rows,
      occupancy.floor.cols,
      occupancy.floor.shape,
    );
  }, [occupancy]);

  // Combine occupied data with saved parts to show them on the map
  const enhancedOccupied = useMemo(() => {
    if (!occupancy) return [];

    const occupiedWithSavedParts = [...occupancy.occupied];

    // Add saved parts to the occupied data so they show on the map
    savedParts.forEach((savedPart) => {
      // Skip the current part being edited
      if (savedPart.id === currentPartId) return;

      // Handle both floorId formats (can be object with _id or string)
      const savedFloorId = savedPart.floorId?._id || savedPart.floorId;

      if (savedFloorId === floorId && (savedPart.areas || savedPart.area)) {
        const areas =
          savedPart.areas || (savedPart.area ? [savedPart.area] : []);
        areas.forEach((area) => {
          occupiedWithSavedParts.push({
            area,
            isSavedPart: true,
            partIndex: savedPart.partIndex || 0,
          });
        });
      }
    });

    return occupiedWithSavedParts;
  }, [occupancy, savedParts, currentPartId, floorId]);

  useEffect(() => {
    if (!floorId) {
      setOccupancy(null);
      setSelectedCells([]);
      setLoading(false);
      return;
    }

    // Only keep the incoming selection if we're viewing the floor it belongs to
    setSelectedCells(
      floorId === initialFloorId && initialArea ? expandArea(initialArea) : [],
    );

    setLoading(true);
    getFloorOccupancy(floorId)
      .then((data) => setOccupancy(data))
      .catch((err) => {
        console.error(err);
        showToast("Failed to load floor: " + err.message, "error");
        setOccupancy(null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorId]);

  const toggleCell = (row, col) => {
    setSelectedCells((prev) => {
      const isSelected = prev.some((c) => c.row === row && c.col === col);
      let next = isSelected
        ? prev.filter((c) => !(c.row === row && c.col === col))
        : [...prev, { row, col }];

      return next.sort((a, b) => a.row - b.row || a.col - b.col);
    });
  };

  const clearSelection = () => setSelectedCells([]);

  const handleConfirm = () => {
    if (!floorId || selectedCells.length === 0) {
      showToast("Please select a location", "error");
      return;
    }

    // Group selected cells into contiguous rectangles
    const areas = [];
    const remaining = [...selectedCells];

    while (remaining.length > 0) {
      const start = remaining[0];
      const sameRow = remaining.filter((c) => c.row === start.row);

      if (sameRow.length > 1) {
        // Horizontal line
        const cols = sameRow.map((c) => c.col).sort((a, b) => a - b);
        // Check if cols are contiguous
        const isContiguous = cols.every(
          (col, i) => i === 0 || col === cols[i - 1] + 1,
        );

        if (isContiguous) {
          areas.push({
            rowStart: start.row,
            rowEnd: start.row,
            colStart: cols[0],
            colEnd: cols[cols.length - 1],
          });
          sameRow.forEach((c) => {
            const idx = remaining.findIndex(
              (r) => r.row === c.row && r.col === c.col,
            );
            if (idx !== -1) remaining.splice(idx, 1);
          });
          continue;
        }
      }

      // Single cell or non-contiguous - treat as 1x1 rectangle
      areas.push({
        rowStart: start.row,
        rowEnd: start.row,
        colStart: start.col,
        colEnd: start.col,
      });
      remaining.shift();
    }

    onConfirm({
      floorId,
      floorName: selectedFloor?.name,
      areas,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("pickLocation")}
          </h2>

          <button
            onClick={onClose}
            aria-label={t("close")}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">
            {t("floor")}
          </label>

          <select
            value={floorId}
            onChange={(e) => setFloorId(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">{t("selectFloor")}</option>

            {floors.map((floor) => (
              <option key={floor._id} value={floor._id}>
                {floor.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          {!floorId ? (
            <p className="py-8 text-center text-sm text-slate-500">
              {t("chooseFloorToSeeMap")}
            </p>
          ) : loading || !occupancy ? (
            <div className="flex flex-col items-center gap-3 rounded-md bg-graphite-50 px-6 py-8 text-center">
              <div
                className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent"
                style={{ color: "#45a1a1" }}
                aria-hidden
              />
              <p className="text-sm text-graphite-600">{t("loading")}</p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">
                    Selection Mode:
                  </span>
                  <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                    <button
                      onClick={() => setSelectionMode("dots")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        selectionMode === "dots"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Click Dots
                    </button>
                    <button
                      onClick={() => setSelectionMode("squares")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        selectionMode === "squares"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Drag Squares
                    </button>
                  </div>
                </div>

                <button
                  onClick={clearSelection}
                  className="text-sm text-slate-500 transition-colors hover:text-red-600"
                >
                  {t("clear")}
                </button>
              </div>

              <div className="mb-3 flex items-center gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border border-slate-300 bg-slate-200" />
                  {t("empty")}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border border-blue-700 bg-blue-600" />
                  {t("occupied")}
                </span>

                {savedParts.length > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border border-amber-600 bg-amber-500" />
                    {t("itemPart")}
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border border-emerald-600 bg-emerald-500" />
                  {t("selected")}
                </span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <FloorGrid
                  rows={occupancy.floor.rows}
                  cols={occupancy.floor.cols}
                  shapeCells={shapeCells}
                  occupied={enhancedOccupied}
                  selectedCells={selectedCells}
                  onCellClick={toggleCell}
                  selectionMode={selectionMode}
                  onSelectionChange={setSelectedCells}
                />
              </div>

              <p className="mt-3 text-sm text-slate-600">
                {selectedCells.length}{" "}
                {selectedCells.length === 1 ? t("square") : t("squares")}{" "}
                {t("selected")}
              </p>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            {t("cancel")}
          </button>

          <button
            onClick={handleConfirm}
            disabled={!floorId || selectedCells.length === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("confirmLocation")}
          </button>
        </div>
      </div>
    </div>
  );
}
