// import { useCallback, useMemo, useState } from "react";

// /**
//  * Floor shape canvas.
//  *
//  * Draw:
//  * 1) Click first cell, then second cell
//  *    - same row  → fill row segment
//  *    - same col  → fill column segment
//  *    - otherwise → fill rectangle between corners
//  *
//  * When the outline is closed, click "Fill interior" to paint
//  * everything inside the closed line as floor.
//  */
// const FloorCanvas = ({
//   rows = 15,
//   cols = 15,
//   value = [],
//   onChange,
//   cellSize = 14,
//   readOnly = false,
//   title,
// }) => {
//   const [start, setStart] = useState(null);
//   const [mode, setMode] = useState("draw"); // "draw" | "erase"
//   const [hint, setHint] = useState("");

//   const selected = useMemo(() => {
//     const set = new Set();
//     (value || []).forEach((cell) => {
//       if (cell?.row != null && cell?.col != null) {
//         set.add(`${cell.row}-${cell.col}`);
//       }
//     });
//     return set;
//   }, [value]);

//   const commit = useCallback(
//     (nextSet) => {
//       if (!onChange) return;
//       const cells = [];
//       nextSet.forEach((key) => {
//         const [r, c] = key.split("-").map(Number);
//         cells.push({ row: r, col: c });
//       });
//       cells.sort((a, b) => a.row - b.row || a.col - b.col);
//       onChange(cells);
//     },
//     [onChange],
//   );

//   const fillBetween = useCallback(
//     (a, b) => {
//       const next = new Set(selected);
//       const r1 = Math.min(a.row, b.row);
//       const r2 = Math.max(a.row, b.row);
//       const c1 = Math.min(a.col, b.col);
//       const c2 = Math.max(a.col, b.col);

//       for (let row = r1; row <= r2; row += 1) {
//         for (let col = c1; col <= c2; col += 1) {
//           next.add(`${row}-${col}`);
//         }
//       }
//       return next;
//     },
//     [selected],
//   );

//   /**
//    * Flood-fill from canvas edges through empty cells = exterior.
//    * Any empty cell that is NOT exterior is interior of a closed shape.
//    */
//   const fillInterior = useCallback(() => {
//     if (!selected.size) {
//       setHint("Draw an outline first, then fill the interior.");
//       return;
//     }

//     const exterior = new Set();
//     const queue = [];

//     const tryEnqueue = (row, col) => {
//       if (row < 0 || col < 0 || row >= rows || col >= cols) return;
//       const key = `${row}-${col}`;
//       if (selected.has(key) || exterior.has(key)) return;
//       exterior.add(key);
//       queue.push([row, col]);
//     };

//     // Start from every edge cell that is not part of the outline
//     for (let col = 0; col < cols; col += 1) {
//       tryEnqueue(0, col);
//       tryEnqueue(rows - 1, col);
//     }
//     for (let row = 0; row < rows; row += 1) {
//       tryEnqueue(row, 0);
//       tryEnqueue(row, cols - 1);
//     }

//     while (queue.length) {
//       const [row, col] = queue.shift();
//       tryEnqueue(row - 1, col);
//       tryEnqueue(row + 1, col);
//       tryEnqueue(row, col - 1);
//       tryEnqueue(row, col + 1);
//     }

//     const next = new Set(selected);
//     let filled = 0;

//     for (let row = 0; row < rows; row += 1) {
//       for (let col = 0; col < cols; col += 1) {
//         const key = `${row}-${col}`;
//         if (!selected.has(key) && !exterior.has(key)) {
//           next.add(key);
//           filled += 1;
//         }
//       }
//     }

//     if (filled === 0) {
//       setHint(
//         "No closed interior found. Make sure the outline connects all the way around with no gaps.",
//       );
//       return;
//     }

//     commit(next);
//     setHint(`Filled ${filled} interior cells. Whole shape is now floor.`);
//   }, [commit, cols, rows, selected]);

//   const handleCellClick = (row, col) => {
//     if (readOnly) return;
//     const key = `${row}-${col}`;
//     setHint("");

//     if (mode === "erase") {
//       const next = new Set(selected);
//       next.delete(key);
//       commit(next);
//       setStart(null);
//       return;
//     }

//     if (!start) {
//       if (selected.has(key)) {
//         const next = new Set(selected);
//         next.delete(key);
//         commit(next);
//         return;
//       }
//       setStart({ row, col });
//       return;
//     }

//     const next = fillBetween(start, { row, col });
//     commit(next);
//     setStart(null);
//   };

//   const gap = 2;
//   const gridWidth = cols * cellSize + (cols - 1) * gap;
//   const gridHeight = rows * cellSize + (rows - 1) * gap;

//   return (
//     <div className="space-y-2">
//       <div className="flex flex-wrap items-center justify-between gap-2">
//         <div>
//           {title && (
//             <p className="text-sm font-medium text-slate-900">{title}</p>
//           )}
//           <p className="text-xs text-slate-500">
//             {selected.size} cell{selected.size === 1 ? "" : "s"} selected
//             {!readOnly &&
//               (mode === "erase"
//                 ? " · erase mode"
//                 : start
//                   ? " · click second cell to fill line/rectangle"
//                   : " · click first cell, then second cell")}
//           </p>
//         </div>

//         <div className="flex flex-wrap items-center gap-2">
//           {!readOnly && (
//             <>
//               <button
//                 type="button"
//                 onClick={() => {
//                   setMode("draw");
//                   setStart(null);
//                 }}
//                 className={`rounded-md border px-2.5 py-1 text-[11px] font-medium ${
//                   mode === "draw"
//                     ? "border-blue-600 bg-blue-50 text-blue-700"
//                     : "border-slate-300 bg-white text-slate-600"
//                 }`}
//               >
//                 Draw
//               </button>
//               <button
//                 type="button"
//                 onClick={() => {
//                   setMode("erase");
//                   setStart(null);
//                 }}
//                 className={`rounded-md border px-2.5 py-1 text-[11px] font-medium ${
//                   mode === "erase"
//                     ? "border-blue-600 bg-blue-50 text-blue-700"
//                     : "border-slate-300 bg-white text-slate-600"
//                 }`}
//               >
//                 Erase
//               </button>
//               <button
//                 type="button"
//                 onClick={fillInterior}
//                 className="rounded-md border border-blue-600 bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-blue-700"
//               >
//                 Fill interior
//               </button>
//               {start && (
//                 <button
//                   type="button"
//                   onClick={() => setStart(null)}
//                   className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600"
//                 >
//                   Cancel pick
//                 </button>
//               )}
//             </>
//           )}

//           <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500">
//             <span className="inline-flex items-center gap-1">
//               <span
//                 className="inline-block bg-blue-500"
//                 style={{
//                   width: 8,
//                   height: 8,
//                   border: "1px solid #1d4ed8",
//                   borderRadius: 1,
//                 }}
//               />
//               Floor
//             </span>
//             <span className="inline-flex items-center gap-1">
//               <span
//                 className="inline-block bg-slate-100"
//                 style={{
//                   width: 8,
//                   height: 8,
//                   border: "1px solid #94a3b8",
//                   borderRadius: 1,
//                 }}
//               />
//               Empty
//             </span>
//           </div>
//         </div>
//       </div>

//       {hint && (
//         <p className="rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs text-blue-800">
//           {hint}
//         </p>
//       )}

//       <div className="flex justify-center">
//         <div
//           className="inline-block select-none rounded-md bg-white shadow-sm"
//           style={{ border: "2px solid #334155", padding: 8 }}
//         >
//           <div
//             className="rounded-sm"
//             style={{
//               border: "1px solid #94a3b8",
//               background: "#f8fafc",
//               padding: 6,
//             }}
//           >
//             <div
//               role="grid"
//               aria-label={title || "Floor canvas"}
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
//                 gap: `${gap}px`,
//                 width: gridWidth,
//                 height: gridHeight,
//               }}
//             >
//               {Array.from({ length: rows }, (_, row) =>
//                 Array.from({ length: cols }, (_, col) => {
//                   const key = `${row}-${col}`;
//                   const isFloor = selected.has(key);
//                   const isStart = start?.row === row && start?.col === col;

//                   let background = "#e2e8f0";
//                   let borderColor = "#94a3b8";
//                   let borderWidth = 1;

//                   if (isFloor) {
//                     background = "#3b82f6";
//                     borderColor = "#1d4ed8";
//                   }
//                   if (isStart) {
//                     background = isFloor ? "#2563eb" : "#dbeafe";
//                     borderColor = "#1d4ed8";
//                     borderWidth = 2;
//                   }

//                   return (
//                     <button
//                       key={key}
//                       type="button"
//                       role="gridcell"
//                       title={`Row ${row + 1}, Col ${col + 1}`}
//                       aria-label={`Row ${row + 1}, Col ${col + 1}`}
//                       aria-pressed={isFloor}
//                       disabled={readOnly}
//                       onClick={() => handleCellClick(row, col)}
//                       style={{
//                         width: cellSize,
//                         height: cellSize,
//                         borderRadius: 1,
//                         background,
//                         border: `${borderWidth}px solid ${borderColor}`,
//                         padding: 0,
//                         cursor: readOnly ? "default" : "pointer",
//                         boxSizing: "border-box",
//                       }}
//                     />
//                   );
//                 }),
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {!readOnly && (
//         <p className="text-center text-xs text-slate-500">
//           Draw the outline (closed line), then press{" "}
//           <span className="font-medium text-slate-700">Fill interior</span> so
//           the whole inside becomes floor.
//         </p>
//       )}
//     </div>
//   );
// };

// export default FloorCanvas;

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

/**
 * Graph-paper style floor canvas. Draws only grid lines (not one shape per
 * cell) plus whatever's actually filled, so even very large floors (hundreds
 * of cells per side) render instantly — cost scales with rows+cols, not
 * rows*cols.
 *
 * Drag from one point to another to fill a straight rectangle (release =
 * commit). Starting the drag on an already-filled cell erases that
 * rectangle instead. Pass readOnly to disable drawing.
 *
 * Zoom with the +/- buttons or Ctrl/Cmd + scroll wheel. Pan by scrolling
 * the container (trackpad, scrollbars, shift+scroll for horizontal).
 *
 * Ref API: getCells() -> [{row, col}], clear()
 */
const FloorCanvas = forwardRef(function FloorCanvas(
  {
    rows,
    cols,
    initialCells = [],
    occupied = [],
    readOnly = false,
    height = 480,
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

  const [zoom, setZoom] = useState(1);

  const pitch = BASE_PITCH * zoom;
  const width = cols * pitch;
  const heightPx = rows * pitch;

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
    for (let c = 0; c <= cols; c++) {
      const x = Math.round(c * pitch) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, heightPx);
    }
    for (let r = 0; r <= rows; r++) {
      const y = Math.round(r * pitch) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Bolder line every 5 cells, like a math notebook grid
    ctx.beginPath();
    for (let c = 0; c <= cols; c += 5) {
      const x = Math.round(c * pitch) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, heightPx);
    }
    for (let r = 0; r <= rows; r += 5) {
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
  }, [rows, cols, zoom]);

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
    const col = Math.min(cols - 1, Math.max(0, Math.floor(x / pitch)));
    const row = Math.min(rows - 1, Math.max(0, Math.floor(y / pitch)));
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

  return (
    <div className="inline-block max-w-full rounded-lg border border-stone-300 bg-white">
      <div className="flex items-center justify-between border-b border-stone-200 px-2 py-1.5">
        <span className="text-xs text-stone-500">
          {rows} × {cols} · {Math.round(zoom * 100)}%
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={zoomOut}
            className="flex h-6 w-6 items-center justify-center rounded border border-stone-300 text-sm text-stone-600 hover:bg-stone-100"
          >
            −
          </button>
          <button
            type="button"
            onClick={zoomReset}
            className="rounded border border-stone-300 px-1.5 text-xs text-stone-600 hover:bg-stone-100"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={zoomIn}
            className="flex h-6 w-6 items-center justify-center rounded border border-stone-300 text-sm text-stone-600 hover:bg-stone-100"
          >
            +
          </button>
        </div>
      </div>

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
          className={readOnly ? "" : "cursor-crosshair"}
          style={{ display: "block" }}
        />
      </div>
    </div>
  );
});

export default FloorCanvas;
