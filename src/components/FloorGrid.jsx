import { useRef, useEffect, useState, useMemo } from "react";
import { expandArea } from "../lib/floorShape";

const PITCH = 6;
const RADIUS = 2.4;
const RECT_SIZE = 4; // Size of rectangle cells for empty cells
const FILLED_SIZE = 5; // Size for filled cells (small gap between them)

const EMPTY_COLOR = "#e2e8f0"; // slate-200
const OCCUPIED_COLOR = "#6366f1"; // indigo-500 (modern purple)
const SAVED_PART_COLOR = "#f59e0b"; // amber-500
const SELECTED_COLOR = "#10b981"; // emerald-500
const BORDER_COLOR = "#ffffff"; // white border between parts
const HIGHLIGHT_COLOR = "#f472b6"; // pink-400 for hover effects

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
  selectionMode = "dots",
  onSelectionChange,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [mouseDownPos, setMouseDownPos] = useState(null);

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
      const isHovered =
        hover &&
        hover.entry &&
        occupiedMap.get(key)?.partId === hover.entry.partId;

      let color = EMPTY_COLOR;
      let partId = null;
      if (isSelected) color = SELECTED_COLOR;
      else if (isHovered) color = HIGHLIGHT_COLOR;
      else if (isOccupied) {
        const entry = occupiedMap.get(key);
        color = entry?.isSavedPart ? SAVED_PART_COLOR : OCCUPIED_COLOR;
        partId = entry?.partId || entry?.area?.partId;
      }

      // For selected/occupied cells, use larger size with small gaps
      // For empty cells, use smaller rectangles with larger gaps
      const isFilled = isSelected || isOccupied || isHovered;
      const size = isFilled ? FILLED_SIZE : RECT_SIZE;
      const rectX = cx - size / 2;
      const rectY = cy - size / 2;

      // Add subtle shadow for filled cells
      if (isFilled) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
      } else {
        ctx.shadowColor = "transparent";
      }

      ctx.fillStyle = color;
      ctx.fillRect(rectX, rectY, size, size);

      // Reset shadow
      ctx.shadowColor = "transparent";

      // Draw borders between different parts
      if (isFilled && partId) {
        const directions = [
          { dr: -1, dc: 0 }, // top
          { dr: 1, dc: 0 }, // bottom
          { dr: 0, dc: -1 }, // left
          { dr: 0, dc: 1 }, // right
        ];

        directions.forEach(({ dr, dc }) => {
          const neighborKey = `${row + dr}-${col + dc}`;
          const neighborEntry = occupiedMap.get(neighborKey);
          const neighborPartId =
            neighborEntry?.partId || neighborEntry?.area?.partId;

          // If neighbor exists and belongs to a different part, draw border
          if (neighborEntry && neighborPartId !== partId) {
            ctx.strokeStyle = BORDER_COLOR;
            ctx.lineWidth = 1;

            const borderX = cx - size / 2;
            const borderY = cy - size / 2;

            if (dr === -1) {
              // top border
              ctx.beginPath();
              ctx.moveTo(borderX, borderY);
              ctx.lineTo(borderX + size, borderY);
              ctx.stroke();
            } else if (dr === 1) {
              // bottom border
              ctx.beginPath();
              ctx.moveTo(borderX, borderY + size);
              ctx.lineTo(borderX + size, borderY + size);
              ctx.stroke();
            } else if (dc === -1) {
              // left border
              ctx.beginPath();
              ctx.moveTo(borderX, borderY);
              ctx.lineTo(borderX, borderY + size);
              ctx.stroke();
            } else if (dc === 1) {
              // right border
              ctx.beginPath();
              ctx.moveTo(borderX + size, borderY);
              ctx.lineTo(borderX + size, borderY + size);
              ctx.stroke();
            }
          }
        });
      }
    });

    // Draw drag selection rectangle in squares mode
    if (selectionMode === "squares" && isDragging && dragStart && dragEnd) {
      const startX = Math.min(dragStart.col, dragEnd.col);
      const endX = Math.max(dragStart.col, dragEnd.col);
      const startY = Math.min(dragStart.row, dragEnd.row);
      const endY = Math.max(dragStart.row, dragEnd.row);

      const rectX = (startX - minCol) * PITCH;
      const rectY = (startY - minRow) * PITCH;
      const rectWidth = (endX - startX + 1) * PITCH;
      const rectHeight = (endY - startY + 1) * PITCH;

      ctx.strokeStyle = SELECTED_COLOR;
      ctx.lineWidth = 2;
      ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
      ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
      ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    rows,
    cols,
    shapeCells,
    occupied,
    selectedCells,
    minRow,
    minCol,
    selectionMode,
    isDragging,
    dragStart,
    dragEnd,
    hover,
  ]);

  const cellFromEvent = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      row: Math.floor(y / PITCH) + minRow,
      col: Math.floor(x / PITCH) + minCol,
    };
  };

  const entryFromEvent = (e) => {
    const { row, col } = cellFromEvent(e);
    const key = `${row}-${col}`;
    return occupiedMap.get(key);
  };

  const handleClick = (e) => {
    if (!onCellClick) return;

    // In squares mode, handle drag selection
    if (selectionMode === "squares") {
      return;
    }

    // In dots mode, use the original click behavior
    const { row, col } = cellFromEvent(e);
    const key = `${row}-${col}`;

    if (!shapeSet.has(key)) return;

    const isSelected = selectedSet.has(key);
    const occupiedEntry = occupiedMap.get(key);
    // Allow selecting cells that are occupied by saved parts of the same item
    // but not cells occupied by other items
    if (occupiedEntry && !isSelected && !occupiedEntry.isSavedPart) return;

    onCellClick(row, col);
  };

  const handleMouseDown = (e) => {
    if (selectionMode !== "squares") return;

    const { row, col } = cellFromEvent(e);
    const key = `${row}-${col}`;

    if (!shapeSet.has(key)) return;

    setMouseDownPos({ row, col, clientX: e.clientX, clientY: e.clientY });
    setIsDragging(true);
    setDragStart({ row, col });
    setDragEnd({ row, col });
  };

  const handleMouseMove = (e) => {
    const { row, col } = cellFromEvent(e);
    const key = `${row}-${col}`;
    const entry = shapeSet.has(key) ? occupiedMap.get(key) : null;

    if (selectionMode === "squares" && isDragging) {
      setDragEnd({ row, col });
      setHover(null);
      return;
    }

    // Always set hover for tooltip positioning, even if no entry
    setHover({
      entry,
      x: (col - minCol) * PITCH + PITCH / 2,
      y: (row - minRow) * PITCH + PITCH / 2,
    });
  };

  const handleMouseUp = (e) => {
    if (selectionMode === "squares" && isDragging && dragStart && dragEnd) {
      // Check if this was a click (minimal movement) or a drag
      const movementThreshold = 5; // pixels
      const dx = Math.abs(e.clientX - mouseDownPos.clientX);
      const dy = Math.abs(e.clientY - mouseDownPos.clientY);
      const isClick = dx < movementThreshold && dy < movementThreshold;

      if (isClick) {
        // Treat as click - toggle individual cell
        const { row, col } = dragStart;
        const key = `${row}-${col}`;

        if (onSelectionChange) {
          onSelectionChange((prev) => {
            const isSelected = prev.some((c) => c.row === row && c.col === col);
            let next = isSelected
              ? prev.filter((c) => !(c.row === row && c.col === col))
              : [...prev, { row, col }];
            return next.sort((a, b) => a.row - b.row || a.col - b.col);
          });
        }
      } else {
        // Treat as drag - select rectangle
        const startRow = Math.min(dragStart.row, dragEnd.row);
        const endRow = Math.max(dragStart.row, dragEnd.row);
        const startCol = Math.min(dragStart.col, dragEnd.col);
        const endCol = Math.max(dragStart.col, dragEnd.col);

        // Collect all cells in the drag rectangle
        const newSelectedCells = [];
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            const key = `${r}-${c}`;
            if (shapeSet.has(key)) {
              const occupiedEntry = occupiedMap.get(key);
              // Allow selecting cells that are occupied by saved parts of the same item
              // but not cells occupied by other items
              const isOccupiedByOther =
                occupiedEntry && !occupiedEntry.isSavedPart;
              if (!isOccupiedByOther) {
                newSelectedCells.push({ row: r, col: c });
              }
            }
          }
        }

        // Add new selection to existing selected cells (for multiple squares)
        if (onSelectionChange && newSelectedCells.length > 0) {
          onSelectionChange((prev) => {
            const existingSet = new Set(prev.map((c) => `${c.row}-${c.col}`));
            const combined = [...prev];
            newSelectedCells.forEach((cell) => {
              const key = `${cell.row}-${cell.col}`;
              if (!existingSet.has(key)) {
                combined.push(cell);
              }
            });
            return combined.sort((a, b) => a.row - b.row || a.col - b.col);
          });
        }
      }

      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      setMouseDownPos(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-block max-w-full overflow-auto rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 shadow-md"
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setHover(null);
          if (isDragging) {
            setIsDragging(false);
            setDragStart(null);
            setDragEnd(null);
            setMouseDownPos(null);
          }
        }}
        className={
          selectionMode === "squares"
            ? "cursor-crosshair"
            : onCellClick
              ? "cursor-pointer"
              : ""
        }
      />
      {hover && hover.entry && containerRef.current && (
        <div
          className="pointer-events-none absolute whitespace-nowrap rounded-lg bg-slate-900/95 px-3 py-2 text-xs text-white shadow-xl backdrop-blur-sm z-10 border border-slate-700/50"
          style={{
            left: hover.x + 8,
            top: hover.y + 8,
            transform: (() => {
              const containerRect =
                containerRef.current.getBoundingClientRect();
              const tooltipX = hover.x + 8;
              const tooltipY = hover.y + 8;

              // Check if tooltip would be too close to right edge
              const tooCloseToRight = tooltipX > containerRect.width - 100;
              // Check if tooltip would be too close to left edge
              const tooCloseToLeft = tooltipX < 100;
              // Check if tooltip would be too close to top edge
              const tooCloseToTop = tooltipY < 50;

              let transform = "translate(-50%, calc(-100% - 8px))";

              if (tooCloseToRight) {
                transform = "translate(-100%, calc(-100% - 8px))";
              } else if (tooCloseToLeft) {
                transform = "translate(0%, calc(-100% - 8px))";
              }

              if (tooCloseToTop) {
                // Show below instead of above
                transform = transform.replace("calc(-100% - 8px)", "8px");
              }

              return transform;
            })(),
            maxWidth: "250px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {hover.entry.isSavedPart ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                Part {hover.entry.partIndex}
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="font-semibold">{hover.entry.itemName}</div>
              {hover.entry.partName && (
                <div className="text-slate-300">{hover.entry.partName}</div>
              )}
              {/* Shared parts (see sharedPartId) have no serial number or
                  single item stock of their own — they belong to more
                  than one item at once, so skip this line for them. */}
              {hover.entry.serialNumber != null && (
                <div className="flex items-center gap-2 text-slate-300">
                  <span>SN: #{hover.entry.serialNumber}</span>
                  <span>·</span>
                  <span>Qty: {hover.entry.stock}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
