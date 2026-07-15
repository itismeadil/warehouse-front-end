import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const PITCH = 6; // px between dot centers
const DOT_RADIUS = 1.6;
const ACTIVE_RADIUS = 2.6;

const DOT_COLOR = "#cbd5e1"; // slate-300, empty
const ACTIVE_COLOR = "#2563eb"; // blue-600, committed part of floor
const PREVIEW_FILL_COLOR = "#10b981"; // emerald-500, rectangle about to be added
const PREVIEW_ERASE_COLOR = "#f87171"; // red-400, rectangle about to be removed

// A blank canvas full of dots. Drag from one corner to another to fill a
// straight rectangle — same rectangle-select gesture used when placing an
// item on a floor. Starting the drag on an already-painted dot erases that
// rectangle instead, which is how you cut a notch into the shape.
// Exposes getCells()/clear() via ref so the parent form can pull the
// drawing out on submit without re-rendering on every stroke.
const FloorShapeEditor = forwardRef(function FloorShapeEditor(
  { rows, cols, initialCells = [] },
  ref,
) {
  const canvasRef = useRef(null);
  const activeRef = useRef(
    new Set(initialCells.map((c) => `${c.row}-${c.col}`)),
  );
  const draggingRef = useRef(false);
  const startCellRef = useRef(null);
  const eraseModeRef = useRef(false);
  const previewRectRef = useRef(null); // { rowStart, rowEnd, colStart, colEnd }

  const width = cols * PITCH;
  const height = rows * PITCH;

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);

    const preview = previewRectRef.current;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const active = activeRef.current.has(`${r}-${c}`);
        const inPreview =
          preview &&
          r >= preview.rowStart &&
          r <= preview.rowEnd &&
          c >= preview.colStart &&
          c <= preview.colEnd;

        let color = active ? ACTIVE_COLOR : DOT_COLOR;
        let radius = active ? ACTIVE_RADIUS : DOT_RADIUS;

        if (inPreview) {
          color = eraseModeRef.current
            ? PREVIEW_ERASE_COLOR
            : PREVIEW_FILL_COLOR;
          radius = ACTIVE_RADIUS;
        }

        const cx = c * PITCH + PITCH / 2;
        const cy = r * PITCH + PITCH / 2;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
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
    const col = Math.min(cols - 1, Math.max(0, Math.floor(x / PITCH)));
    const row = Math.min(rows - 1, Math.max(0, Math.floor(y / PITCH)));
    return { row, col };
  };

  const rectBetween = (a, b) => ({
    rowStart: Math.min(a.row, b.row),
    rowEnd: Math.max(a.row, b.row),
    colStart: Math.min(a.col, b.col),
    colEnd: Math.max(a.col, b.col),
  });

  const commitPreview = () => {
    const rect = previewRectRef.current;
    if (!rect) return;

    for (let r = rect.rowStart; r <= rect.rowEnd; r++) {
      for (let c = rect.colStart; c <= rect.colEnd; c++) {
        const key = `${r}-${c}`;
        if (eraseModeRef.current) activeRef.current.delete(key);
        else activeRef.current.add(key);
      }
    }
    previewRectRef.current = null;
  };

  const handleDown = (e) => {
    const cell = cellFromEvent(e);
    startCellRef.current = cell;
    eraseModeRef.current = activeRef.current.has(`${cell.row}-${cell.col}`);
    draggingRef.current = true;
    previewRectRef.current = rectBetween(cell, cell);
    draw();
  };

  const handleMove = (e) => {
    if (!draggingRef.current) return;
    const cell = cellFromEvent(e);
    previewRectRef.current = rectBetween(startCellRef.current, cell);
    draw();
  };

  const finishDrag = () => {
    if (!draggingRef.current) return;
    commitPreview();
    draggingRef.current = false;
    draw();
  };

  // Catch mouseup even if it happens outside the canvas
  useEffect(() => {
    window.addEventListener("mouseup", finishDrag);
    return () => window.removeEventListener("mouseup", finishDrag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="inline-block max-w-full overflow-auto rounded-lg border border-slate-200 bg-white p-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        className="cursor-crosshair touch-none"
      />
    </div>
  );
});

export default FloorShapeEditor;
