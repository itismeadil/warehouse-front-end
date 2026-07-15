import { useMemo } from "react";

/**
 * Small floor locator map.
 * Whole map stays compact; only shows where the part sits.
 *
 * Expected part shape:
 * {
 *   floorId: { name, rows, cols },
 *   cells: [{ row, col }],
 *   row, col,
 *   area?: { minRow, maxRow, minCol, maxCol, totalCells }
 * }
 */
const FloorMap = ({ part, onCellClick }) => {
  const floor = part?.floorId || {};
  const rows = Number(floor.rows) || 0;
  const cols = Number(floor.cols) || 0;

  // Keep the whole map small even when floors get large
  const cellSize = rows > 20 || cols > 20 ? 5 : rows > 12 || cols > 12 ? 6 : 7;
  const gap = 2;

  const occupied = useMemo(() => {
    const set = new Set();
    (part?.cells || []).forEach((cell) => {
      if (cell?.row != null && cell?.col != null) {
        set.add(`${cell.row}-${cell.col}`);
      }
    });
    return set;
  }, [part?.cells]);

  if (!part) {
    return <p className="text-sm text-slate-500">No part selected.</p>;
  }

  if (!rows || !cols) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center">
        <p className="text-sm text-slate-500">
          Floor dimensions are missing for this part.
        </p>
      </div>
    );
  }

  const gridWidth = cols * cellSize + (cols - 1) * gap;
  const gridHeight = rows * cellSize + (rows - 1) * gap;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {floor.name || part.floorName || "Floor"}
          </p>
          <p className="text-xs text-slate-500">
            {rows} × {cols}
            {part.area?.totalCells != null
              ? ` · ${part.area.totalCells} cells`
              : occupied.size
                ? ` · ${occupied.size} cells`
                : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block bg-blue-500"
              style={{
                width: 6,
                height: 6,
                border: "1px solid #1d4ed8",
                borderRadius: 1,
              }}
            />
            Part
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block bg-slate-200"
              style={{
                width: 6,
                height: 6,
                border: "1px solid #64748b",
                borderRadius: 1,
              }}
            />
            Empty
          </span>
        </div>
      </div>

      {/* Compact floor card — does NOT stretch full modal width */}
      <div className="flex justify-center">
        <div
          className="inline-block rounded-md bg-white shadow-sm"
          style={{
            border: "2px solid #334155", // strong outer floor border
            padding: 8,
          }}
        >
          <div
            className="rounded-sm"
            style={{
              border: "1px solid #94a3b8", // inner border
              background: "#f8fafc",
              padding: 6,
            }}
          >
            <div
              role="grid"
              aria-label={`${floor.name || "Floor"} map`}
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                gap: `${gap}px`,
                width: gridWidth,
                height: gridHeight,
              }}
            >
              {Array.from({ length: rows }, (_, row) =>
                Array.from({ length: cols }, (_, col) => {
                  const key = `${row}-${col}`;
                  const isOccupied = occupied.has(key);

                  const background = isOccupied ? "#3b82f6" : "#e2e8f0";
                  const borderColor = isOccupied ? "#1d4ed8" : "#64748b";

                  const label = `Row ${row + 1}, Col ${col + 1}${
                    isOccupied ? " (part)" : ""
                  }`;

                  return (
                    <button
                      key={key}
                      type="button"
                      role="gridcell"
                      title={label}
                      aria-label={label}
                      aria-pressed={isOccupied}
                      onClick={() =>
                        onCellClick?.({
                          row,
                          col,
                          isOccupied,
                          isOrigin: false,
                        })
                      }
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: 1, // square cells
                        background,
                        border: `1px solid ${borderColor}`,
                        padding: 0,
                        cursor: "pointer",
                        boxSizing: "border-box",
                      }}
                    />
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </div>

      {(part.row != null || part.area) && (
        <p className="text-center text-xs text-slate-500">
          {part.row != null && part.col != null && (
            <>
              Position: Row {part.row + 1}, Col {part.col + 1}
            </>
          )}
          {part.area && (
            <>
              {part.row != null ? " · " : ""}
              Area rows {part.area.minRow + 1}–{part.area.maxRow + 1}, cols{" "}
              {part.area.minCol + 1}–{part.area.maxCol + 1}
            </>
          )}
        </p>
      )}
    </div>
  );
};

export default FloorMap;
