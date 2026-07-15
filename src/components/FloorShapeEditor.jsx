import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Distance between dot centers, in px. Small enough that a 100x100 floor is
// still a reasonably sized canvas to draw on.
const PITCH = 6;
const DOT_RADIUS = 1.6;
const ACTIVE_RADIUS = 2.6;
const ACTIVE_COLOR = "#2563eb"; // blue-600
const DOT_COLOR = "#cbd5e1"; // slate-300

// A blank canvas full of dots. Click a dot to paint it in (part of the
// floor); click-and-drag to paint or erase several at once. Exposes
// getCells()/clear() via ref so the parent form can pull the drawing out
// on submit without re-rendering on every stroke.
const FloorShapeEditor = forwardRef(function FloorShapeEditor(
  { rows, cols, initialCells = [] },
  ref,
) {
  const canvasRef = useRef(null);
  const activeRef = useRef(
    new Set(initialCells.map((c) => `${c.row}-${c.col}`)),
  );
  const drawingRef = useRef(false);
  const paintValueRef = useRef(true);

  const width = cols * PITCH;
  const height = rows * PITCH;

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const active = activeRef.current.has(`${r}-${c}`);
        const cx = c * PITCH + PITCH / 2;
        const cy = r * PITCH + PITCH / 2;

        ctx.beginPath();
        ctx.arc(cx, cy, active ? ACTIVE_RADIUS : DOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = active ? ACTIVE_COLOR : DOT_COLOR;
        ctx.fill();
      }
    }
  };

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cols]);

  useImperativeHandle(ref, () => ({
    getCells: () =>
      Array.from(activeRef.current).map((key) => {
        const [row, col] = key.split("-").map(Number);
        return { row, col };
      }),
    clear: () => {
      activeRef.current = new Set();
      draw();
    },
  }));

  const cellFromEvent = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / PITCH);
    const row = Math.floor(y / PITCH);
    if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
    return { row, col };
  };

  const applyCell = (row, col, value) => {
    const key = `${row}-${col}`;
    if (value) activeRef.current.add(key);
    else activeRef.current.delete(key);
  };

  const handleDown = (e) => {
    const cell = cellFromEvent(e);
    if (!cell) return;

    // Dragging paints or erases depending on what the first dot touched was.
    const alreadyActive = activeRef.current.has(`${cell.row}-${cell.col}`);
    paintValueRef.current = !alreadyActive;
    drawingRef.current = true;

    applyCell(cell.row, cell.col, paintValueRef.current);
    draw();
  };

  const handleMove = (e) => {
    if (!drawingRef.current) return;
    const cell = cellFromEvent(e);
    if (!cell) return;

    applyCell(cell.row, cell.col, paintValueRef.current);
    draw();
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  return (
    <div className="inline-block max-w-full overflow-auto rounded-lg border border-slate-200 bg-white p-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="cursor-crosshair touch-none"
      />
    </div>
  );
});

export default FloorShapeEditor;
