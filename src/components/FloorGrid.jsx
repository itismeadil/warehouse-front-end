import { useRef, useEffect, useState, useMemo } from "react";
import { expandArea } from "../lib/floorShape";

const PITCH = 6;
const RADIUS = 2.4;

const EMPTY_COLOR = "#e2e8f0"; // slate-200
const OCCUPIED_COLOR = "#2563eb"; // blue-600
const SELECTED_COLOR = "#10b981"; // emerald-500

// Renders a floor's drawn shape as dots. Only cells the person actually
// painted in (shapeCells — already decoded from the floor's bitmap) are
// drawn; everything else is left blank.
//
// The canvas is cropped to the bounding box of shapeCells, not the full
// rows x cols grid — a floor created with a large grid but a small painted
// shape would otherwise render a mostly-empty canvas with scrollbars.
//
// `occupied` is a list of parts, each with a rectangular `area` — this
// component expands those into individual dots itself, so nothing upstream
// has to send or store per-cell data.
//
// Read-only when no onCellClick is passed. Otherwise, clicking a shape dot
// toggles it in/out of selectedCells; a dot already occupied by something
// else (not in selectedCells) can't be picked.
export default function FloorGrid({
  rows,
  cols,
  shapeCells = [],
  occupied = [],
  selectedCells = [],
  onCellClick,
}) {
  const canvasRef = useRef(null);
  const [hover, setHover] = useState(null);

  // Bounding box of the actual painted shape — falls back to the full
  // rows/cols grid if there's no shape yet (e.g. still being drawn).
  const bounds = useMemo(() => {
    if (shapeCells.length === 0) {
      return { minRow: 0, minCol: 0, maxRow: rows - 1, maxCol: cols - 1 };
    }
    const rowsArr = shapeCells.map((c) => c.row);
    const colsArr = shapeCells.map((c) => c.col);
    return {
      minRow: Math.min(...rowsArr),
      maxRow: Math.max(...rowsArr),
      minCol: Math.min(...colsArr),
      maxCol: Math.max(...colsArr),
    };
  }, [shapeCells, rows, cols]);

  const { minRow, minCol, maxRow, maxCol } = bounds;
  const gridRows = maxRow - minRow + 1;
  const gridCols = maxCol - minCol + 1;

  const shapeSet = new Set(shapeCells.map((c) => `${c.row}-${c.col}`));

  const occupiedMap = new Map();
  occupied.forEach((entry) => {
    expandArea(entry.area).forEach(({ row, col }) => {
      occupiedMap.set(`${row}-${col}`, entry);
    });
  });

  const selectedSet = new Set(selectedCells.map((c) => `${c.row}-${c.col}`));

  const width = gridCols * PITCH;
  const height = gridRows * PITCH;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);

    shapeCells.forEach(({ row, col }) => {
      const key = `${row}-${col}`;
      const cx = (col - minCol) * PITCH + PITCH / 2;
      const cy = (row - minRow) * PITCH + PITCH / 2;

      const isSelected = selectedSet.has(key);
      const isOccupied = occupiedMap.has(key);

      let color = EMPTY_COLOR;
      if (isSelected) color = SELECTED_COLOR;
      else if (isOccupied) color = OCCUPIED_COLOR;

      ctx.beginPath();
      ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cols, shapeCells, occupied, selectedCells, minRow, minCol]);

  const cellFromEvent = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      row: Math.floor(y / PITCH) + minRow,
      col: Math.floor(x / PITCH) + minCol,
    };
  };

  const handleClick = (e) => {
    if (!onCellClick) return;
    const { row, col } = cellFromEvent(e);
    const key = `${row}-${col}`;

    if (!shapeSet.has(key)) return;

    const isSelected = selectedSet.has(key);
    if (occupiedMap.has(key) && !isSelected) return;

    onCellClick(row, col);
  };

  const handleMouseMove = (e) => {
    const { row, col } = cellFromEvent(e);
    const key = `${row}-${col}`;
    const entry = shapeSet.has(key) ? occupiedMap.get(key) : null;

    if (!entry) {
      setHover(null);
      return;
    }

    setHover({
      entry,
      x: (col - minCol) * PITCH + PITCH / 2,
      y: (row - minRow) * PITCH + PITCH / 2,
    });
  };

  return (
    <div className="relative inline-block max-w-full overflow-auto rounded-lg border border-slate-200 bg-white p-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
        className={onCellClick ? "cursor-pointer" : ""}
      />
      {hover && (
        <div
          className="pointer-events-none absolute whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white shadow"
          style={{
            left: hover.x + 8, // +8 accounts for the container's p-2 padding
            top: hover.y + 8,
            transform: "translate(-50%, calc(-100% - 8px))",
          }}
        >
          {hover.entry.itemName}
          {hover.entry.partName ? ` — ${hover.entry.partName}` : ""}
          {" · SN: #"}
          {hover.entry.serialNumber}
          {" · Qty: "}
          {hover.entry.stock}
        </div>
      )}
    </div>
  );
}
