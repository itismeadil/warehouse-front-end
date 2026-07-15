import { useRef, useEffect, useState } from "react";

const PITCH = 6;
const RADIUS = 2.4;

const EMPTY_COLOR = "#e2e8f0"; // slate-200
const OCCUPIED_COLOR = "#2563eb"; // blue-600
const SELECTED_COLOR = "#10b981"; // emerald-500

// Renders a floor's drawn shape as dots. Only cells the person actually
// painted in (shapeCells) are drawn — everything else is left blank, so the
// floor looks like the shape it was drawn as, not a rectangle.
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

  const shapeSet = new Set(shapeCells.map((c) => `${c.row}-${c.col}`));
  const occupiedMap = new Map();
  occupied.forEach((c) => occupiedMap.set(`${c.row}-${c.col}`, c));
  const selectedSet = new Set(selectedCells.map((c) => `${c.row}-${c.col}`));

  const width = cols * PITCH;
  const height = rows * PITCH;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);

    shapeCells.forEach(({ row, col }) => {
      const key = `${row}-${col}`;
      const cx = col * PITCH + PITCH / 2;
      const cy = row * PITCH + PITCH / 2;

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
  }, [rows, cols, shapeCells, occupied, selectedCells]);

  const cellFromEvent = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      row: Math.floor(y / PITCH),
      col: Math.floor(x / PITCH),
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
    if (!onCellClick) return;
    const { row, col } = cellFromEvent(e);
    const key = `${row}-${col}`;
    setHover(shapeSet.has(key) ? occupiedMap.get(key) || null : null);
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
        <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white shadow">
          {hover.itemName}
          {hover.partName ? ` — ${hover.partName}` : ""}
        </div>
      )}
    </div>
  );
}
