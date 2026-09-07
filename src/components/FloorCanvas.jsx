import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

const BASE_PITCH = 14; // px per cell at 1x zoom
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

const COLORS = {
  bg: "#ffffff",
  gridLine: "#e5e5e5",
  gridLineBold: "#d4d4d4", // every 5th line, like a math notebook grid
  active: "#d97706", // amber-600, drawn/filled cell
  occupied: "#2563eb", // blue-600, occupied by something else
  previewFill: "#16a34a", // green-600, rectangle about to be added
  previewErase: "#dc2626", // red-600, rectangle about to be removed
};

const edgeBtnClass =
  "flex h-5 w-5 items-center justify-center rounded border border-graphite-300 text-xs leading-none text-graphite-600 hover:bg-graphite-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:border-graphite-600 dark:text-graphite-400 dark:hover:bg-graphite-700";

/** Pair of +/- buttons for growing/shrinking the floor from one edge. */
function EdgeControl({ orientation, onAdd, onRemove, canAdd, canRemove }) {
  const isRow = orientation === "row"; // row edges (top/bottom) stack buttons horizontally
  return (
    <div
      className={
        isRow
          ? "flex items-center justify-center gap-1 py-1"
          : "flex flex-col items-center justify-center gap-1 px-1"
      }
    >
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className={edgeBtnClass}
        title="Remove"
      >
        −
      </button>
      <button
        type="button"
        onClick={onAdd}
        disabled={!canAdd}
        className={edgeBtnClass}
        title="Add"
      >
        +
      </button>
    </div>
  );
}

/**
 * Graph-paper style floor canvas. Draws only grid lines (not one shape per
 * cell) plus whatever's actually filled, so even very large floors (hundreds
 * of cells per side) render instantly — cost scales with rows+cols, not
 * rows*cols.
 *
 * Drag from one point to another to fill a straight rectangle (release =
 * commit). Starting the drag on an already-filled cell erases that
 * rectangle instead. Pass readOnly to disable drawing AND resizing.
 *
 * Zoom with the +/- buttons or Ctrl/Cmd + scroll wheel. Pan by scrolling
 * the container (trackpad, scrollbars, shift+scroll for horizontal).
 *
 * Resize with the +/- buttons on each edge of the grid: top/bottom add or
 * remove a row on that side, left/right add or remove a column. Like
 * `initialCells`, `rows`/`cols` are only the *initial* dimensions — this
 * component owns the live size after that. Read the current size via the
 * `getDimensions()` ref method, or via the `onResize` callback, which fires
 * as `{ side, delta, rows, cols }` any time the floor is resized (so a
 * parent can persist the new size or shift its own `occupied` coordinates).
 * Removing a row/col that contains an `occupied` cell is blocked and shows
 * a brief inline warning instead, since this component can't safely drop
 * data it doesn't own.
 *
 * Ref API: getCells() -> [{row, col}], clear(), getDimensions() -> {rows, cols}
 */
const FloorCanvas = forwardRef(function FloorCanvas(
  {
    rows,
    cols,
    initialCells = [],
    occupied = [],
    readOnly = false,
    height = 480,
    onResize,
    minRows = 1,
    minCols = 1,
    maxRows = 200,
    maxCols = 200,
  },
  ref,
) {
  const canvasRef = useRef(null);
  const activeRef = useRef(
    new Set(initialCells.map((c) => `${c.row}-${c.col}`)),
  );
  const occupiedMapRef = useRef(new Map());
  const draggingRef = useRef(false);
  const startCellRef = useRef(null);
  const eraseModeRef = useRef(false);
  const previewRectRef = useRef(null);
  const warningTimeoutRef = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [dims, setDims] = useState({ rows, cols });
  const [warning, setWarning] = useState("");

  const pitch = BASE_PITCH * zoom;
  const width = dims.cols * pitch;
  const heightPx = dims.rows * pitch;

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, heightPx);

    const paintCell = (r, c, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(c * pitch, r * pitch, pitch, pitch);
    };

    activeRef.current.forEach((key) => {
      const [r, c] = key.split("-").map(Number);
      paintCell(r, c, COLORS.active);
    });

    occupiedMapRef.current.forEach((_entry, key) => {
      if (!activeRef.current.has(key)) {
        const [r, c] = key.split("-").map(Number);
        paintCell(r, c, COLORS.occupied);
      }
    });

    const preview = previewRectRef.current;
    if (preview) {
      const color = eraseModeRef.current
        ? COLORS.previewErase
        : COLORS.previewFill;
      for (let r = preview.rowStart; r <= preview.rowEnd; r++) {
        for (let c = preview.colStart; c <= preview.colEnd; c++) {
          paintCell(r, c, color);
        }
      }
    }

    // Grid lines — the part that keeps this fast: O(rows+cols), not O(rows*cols)
    ctx.beginPath();
    for (let c = 0; c <= dims.cols; c++) {
      const x = Math.round(c * pitch) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, heightPx);
    }
    for (let r = 0; r <= dims.rows; r++) {
      const y = Math.round(r * pitch) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Bolder line every 5 cells, like a math notebook grid
    ctx.beginPath();
    for (let c = 0; c <= dims.cols; c += 5) {
      const x = Math.round(c * pitch) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, heightPx);
    }
    for (let r = 0; r <= dims.rows; r += 5) {
      const y = Math.round(r * pitch) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.strokeStyle = COLORS.gridLineBold;
    ctx.stroke();
  };

  useEffect(() => {
    const map = new Map();
    occupied.forEach((entry) => {
      const area = entry.area;
      if (!area) return;
      for (let r = area.rowStart; r <= area.rowEnd; r++) {
        for (let c = area.colStart; c <= area.colEnd; c++) {
          map.set(`${r}-${c}`, entry);
        }
      }
    });
    occupiedMapRef.current = map;
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [occupied]);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims, zoom]);

  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, []);

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
    getDimensions: () => ({ ...dims }),
  }));

  const cellFromEvent = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.min(dims.cols - 1, Math.max(0, Math.floor(x / pitch)));
    const row = Math.min(dims.rows - 1, Math.max(0, Math.floor(y / pitch)));
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
    if (readOnly) return;
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

  useEffect(() => {
    window.addEventListener("mouseup", finishDrag);
    return () => window.removeEventListener("mouseup", finishDrag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoomIn = () =>
    setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () =>
    setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));
  const zoomReset = () => setZoom(1);

  const handleWheel = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  // ---- Resize (add/remove rows & columns from a given edge) ----

  const showWarning = (msg) => {
    setWarning(msg);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(() => setWarning(""), 2200);
  };

  const shiftActiveCells = (rowDelta, colDelta) => {
    if (!rowDelta && !colDelta) return;
    const next = new Set();
    activeRef.current.forEach((key) => {
      const [r, c] = key.split("-").map(Number);
      next.add(`${r + rowDelta}-${c + colDelta}`);
    });
    activeRef.current = next;
  };

  const rowHasOccupied = (rowIndex) => {
    for (const key of occupiedMapRef.current.keys()) {
      if (Number(key.split("-")[0]) === rowIndex) return true;
    }
    return false;
  };

  const colHasOccupied = (colIndex) => {
    for (const key of occupiedMapRef.current.keys()) {
      if (Number(key.split("-")[1]) === colIndex) return true;
    }
    return false;
  };

  const commitResize = (partial, meta) => {
    const next = { ...dims, ...partial };
    setDims(next);
    onResize?.({ ...meta, rows: next.rows, cols: next.cols });
  };

  const addRow = (side) => {
    if (readOnly || dims.rows >= maxRows) return;
    if (side === "top") shiftActiveCells(1, 0);
    commitResize({ rows: dims.rows + 1 }, { side, delta: 1 });
  };

  const removeRow = (side) => {
    if (readOnly || dims.rows <= minRows) return;
    const target = side === "top" ? 0 : dims.rows - 1;
    if (rowHasOccupied(target)) {
      showWarning("Can't remove — that row has items on it");
      return;
    }
    const next = new Set();
    activeRef.current.forEach((key) => {
      const [r, c] = key.split("-").map(Number);
      if (r === target) return;
      next.add(`${side === "top" ? r - 1 : r}-${c}`);
    });
    activeRef.current = next;
    commitResize({ rows: dims.rows - 1 }, { side, delta: -1 });
  };

  const addCol = (side) => {
    if (readOnly || dims.cols >= maxCols) return;
    if (side === "left") shiftActiveCells(0, 1);
    commitResize({ cols: dims.cols + 1 }, { side, delta: 1 });
  };

  const removeCol = (side) => {
    if (readOnly || dims.cols <= minCols) return;
    const target = side === "left" ? 0 : dims.cols - 1;
    if (colHasOccupied(target)) {
      showWarning("Can't remove — that column has items on it");
      return;
    }
    const next = new Set();
    activeRef.current.forEach((key) => {
      const [r, c] = key.split("-").map(Number);
      if (c === target) return;
      next.add(`${r}-${side === "left" ? c - 1 : c}`);
    });
    activeRef.current = next;
    commitResize({ cols: dims.cols - 1 }, { side, delta: -1 });
  };

  return (
    <div className="inline-block max-w-full rounded-lg border border-graphite-300 bg-white dark:border-graphite-600 dark:bg-graphite-800">
      <div className="flex items-center justify-between border-b border-graphite-200 px-2 py-1.5 dark:border-graphite-700">
        <span className="text-xs text-graphite-500 dark:text-graphite-400">
          {dims.rows} × {dims.cols} · {Math.round(zoom * 100)}%
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={zoomOut}
            className="flex h-6 w-6 items-center justify-center rounded border border-graphite-300 text-sm text-graphite-600 hover:bg-graphite-100 dark:border-graphite-600 dark:text-graphite-400 dark:hover:bg-graphite-700"
          >
            −
          </button>
          <button
            type="button"
            onClick={zoomReset}
            className="rounded border border-graphite-300 px-1.5 text-xs text-graphite-600 hover:bg-graphite-100 dark:border-graphite-600 dark:text-graphite-400 dark:hover:bg-graphite-700"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={zoomIn}
            className="flex h-6 w-6 items-center justify-center rounded border border-graphite-300 text-sm text-graphite-600 hover:bg-graphite-100 dark:border-graphite-600 dark:text-graphite-400 dark:hover:bg-graphite-700"
          >
            +
          </button>
        </div>
      </div>

      {warning && (
        <div className="border-b border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          {warning}
        </div>
      )}

      {readOnly ? (
        <div
          onWheel={handleWheel}
          style={{ maxHeight: height, maxWidth: "100%" }}
          className="overflow-auto"
        >
          <canvas
            ref={canvasRef}
            width={width}
            height={heightPx}
            style={{ display: "block" }}
          />
        </div>
      ) : (
        <div className="flex items-stretch">
          <div className="flex flex-col items-center justify-center border-r border-graphite-200 dark:border-graphite-700">
            <EdgeControl
              orientation="col"
              onAdd={() => addCol("left")}
              onRemove={() => removeCol("left")}
              canAdd={dims.cols < maxCols}
              canRemove={dims.cols > minCols}
            />
          </div>

          <div className="flex flex-col">
            <EdgeControl
              orientation="row"
              onAdd={() => addRow("top")}
              onRemove={() => removeRow("top")}
              canAdd={dims.rows < maxRows}
              canRemove={dims.rows > minRows}
            />

            <div
              onWheel={handleWheel}
              style={{ maxHeight: height, maxWidth: "100%" }}
              className="overflow-auto"
            >
              <canvas
                ref={canvasRef}
                width={width}
                height={heightPx}
                onMouseDown={handleDown}
                onMouseMove={handleMove}
                className="cursor-crosshair"
                style={{ display: "block" }}
              />
            </div>

            <EdgeControl
              orientation="row"
              onAdd={() => addRow("bottom")}
              onRemove={() => removeRow("bottom")}
              canAdd={dims.rows < maxRows}
              canRemove={dims.rows > minRows}
            />
          </div>

          <div className="flex flex-col items-center justify-center border-l border-graphite-200 dark:border-graphite-700">
            <EdgeControl
              orientation="col"
              onAdd={() => addCol("right")}
              onRemove={() => removeCol("right")}
              canAdd={dims.cols < maxCols}
              canRemove={dims.cols > minCols}
            />
          </div>
        </div>
      )}
    </div>
  );
});

export default FloorCanvas;
