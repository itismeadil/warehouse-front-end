import { useState, useEffect, useMemo } from "react";
import { getFloorOccupancy } from "../api/floors";
import { X } from "lucide-react";
import { decodeShape, expandArea } from "../lib/floorShape";
import FloorGrid from "./FloorGrid";

const MIN_CELLS = 4;

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
}) {
  const [floorId, setFloorId] = useState(initialFloorId || "");
  const [occupancy, setOccupancy] = useState(null);
  const [selectedCells, setSelectedCells] = useState(
    initialArea ? expandArea(initialArea) : [],
  );
  const [loading, setLoading] = useState(!!initialFloorId);

  const selectedFloor = floors.find((f) => f._id === floorId);

  const shapeCells = useMemo(() => {
    if (!occupancy) return [];
    return decodeShape(
      occupancy.floor.rows,
      occupancy.floor.cols,
      occupancy.floor.shape,
    );
  }, [occupancy]);

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

  // Once 4+ points are selected, snap them to the bounding rectangle so the
  // person gets a clean block instead of a scattered set of dots.
  const fillRectangle = (points) => {
    if (points.length < MIN_CELLS) return points;

    const rows = points.map((p) => p.row);
    const cols = points.map((p) => p.col);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    const filled = [];
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        filled.push({ row: r, col: c });
      }
    }
    return filled;
  };

  const toggleCell = (row, col) => {
    setSelectedCells((prev) => {
      const isSelected = prev.some((c) => c.row === row && c.col === col);
      let next = isSelected
        ? prev.filter((c) => !(c.row === row && c.col === col))
        : [...prev, { row, col }];

      if (next.length >= MIN_CELLS) {
        next = fillRectangle(next);
      }

      return next.sort((a, b) => a.row - b.row || a.col - b.col);
    });
  };

  const clearSelection = () => setSelectedCells([]);

  const handleConfirm = () => {
    if (!floorId || selectedCells.length === 0) {
      showToast("Please select a location", "error");
      return;
    }
    if (selectedCells.length < MIN_CELLS) {
      showToast(
        `Please select at least ${MIN_CELLS} squares to define a space`,
        "error",
      );
      return;
    }

    // selectedCells is always a filled rectangle by this point, so its
    // bounding box fully describes it — that's all that gets stored.
    const area = {
      rowStart: Math.min(...selectedCells.map((c) => c.row)),
      rowEnd: Math.max(...selectedCells.map((c) => c.row)),
      colStart: Math.min(...selectedCells.map((c) => c.col)),
      colEnd: Math.max(...selectedCells.map((c) => c.col)),
    };

    onConfirm({
      floorId,
      floorName: selectedFloor?.name,
      area,
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
            Pick a location
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">
            Floor
          </label>
          <select
            value={floorId}
            onChange={(e) => setFloorId(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Select a floor</option>
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
              Choose a floor to see its map.
            </p>
          ) : loading || !occupancy ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading floor...
            </p>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border border-slate-300 bg-slate-200" />
                    Empty
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border border-blue-700 bg-blue-600" />
                    Occupied
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border border-emerald-600 bg-emerald-500" />
                    Selected
                  </span>
                </div>

                <button
                  onClick={clearSelection}
                  className="text-sm text-slate-500 transition-colors hover:text-red-600"
                >
                  Clear
                </button>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <FloorGrid
                  rows={occupancy.floor.rows}
                  cols={occupancy.floor.cols}
                  shapeCells={shapeCells}
                  occupied={occupancy.occupied}
                  selectedCells={selectedCells}
                  onCellClick={toggleCell}
                />
              </div>

              <p className="mt-3 text-sm text-slate-600">
                {selectedCells.length} square
                {selectedCells.length !== 1 ? "s" : ""} selected
                {selectedCells.length > 0 &&
                  selectedCells.length < MIN_CELLS &&
                  ` — pick ${MIN_CELLS - selectedCells.length} more`}
              </p>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!floorId || selectedCells.length < MIN_CELLS}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm location
          </button>
        </div>
      </div>
    </div>
  );
}
