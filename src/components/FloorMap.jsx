import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/**
 * Small floor locator map shown inside PartDetail.
 * Whole map stays compact; only shows where the part sits.
 *
 * NOTE: this reads part.row / part.col / part.area.{minRow,maxRow,minCol,
 * maxCol,totalCells} — the backend's Part.area shape is actually
 * { rowStart, rowEnd, colStart, colEnd } with no standalone row/col fields.
 * Left exactly as-is per request; flagging here since it means the
 * "Position"/"Area rows..." caption below and cell size never populate from
 * real data until the field names are reconciled.
 *
 * Expected part shape (as currently read):
 * {
 *   floorId: { name, rows, cols },
 *   cells: [{ row, col }],
 *   row, col,
 *   area?: { minRow, maxRow, minCol, maxCol, totalCells }
 * }
 */
const FloorMap = ({ part, onCellClick }) => {
  const { t } = useTranslation();
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
    return <p className="text-sm text-graphite-500">{t("noPartSelected")}</p>;
  }

  if (!rows || !cols) {
    return (
      <div className="rounded-lg border border-dashed border-graphite-300 bg-graphite-50 px-3 py-4 text-center">
        <p className="text-sm text-graphite-500">
          {t("floorDimensionsMissing")}
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
          <p className="text-sm font-medium text-graphite-900">
            {floor.name || part.floorName || t("floor")}
          </p>
          <p className="text-xs text-graphite-500">
            {rows} × {cols}
            {part.area?.totalCells != null
              ? ` · ${part.area.totalCells} ${t("cells")}`
              : occupied.size
                ? ` · ${occupied.size} ${t("cells")}`
                : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-graphite-500">
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block bg-primary-500"
              style={{
                width: 6,
                height: 6,
                border: "1px solid var(--color-primary-700)",
                borderRadius: 1,
              }}
            />
            {t("part")}
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block bg-graphite-200"
              style={{
                width: 6,
                height: 6,
                border: "1px solid var(--color-graphite-400)",
                borderRadius: 1,
              }}
            />
            {t("empty")}
          </span>
        </div>
      </div>

      {/* Compact floor card — does NOT stretch full modal width */}
      <div className="flex justify-center">
        <div
          className="inline-block rounded-md bg-white shadow-sm"
          style={{
            border: "2px solid var(--color-graphite-700)", // strong outer floor border
            padding: 8,
          }}
        >
          <div
            className="rounded-sm"
            style={{
              border: "1px solid var(--color-graphite-400)", // inner border
              background: "var(--color-graphite-50)",
              padding: 6,
            }}
          >
            <div
              role="grid"
              aria-label={t("floorMapAriaLabel", {
                floor: floor.name || t("floor"),
              })}
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

                  const background = isOccupied
                    ? "var(--color-primary-500)"
                    : "var(--color-graphite-200)";
                  const borderColor = isOccupied
                    ? "var(--color-primary-700)"
                    : "var(--color-graphite-400)";

                  const label = `${t("row")} ${row + 1}, ${t("col")} ${col + 1}${
                    isOccupied ? ` (${t("part")})` : ""
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
        <p className="text-center text-xs text-graphite-500">
          {part.row != null && part.col != null && (
            <>
              {t("position")}: {t("row")} {part.row + 1}, {t("col")}{" "}
              {part.col + 1}
            </>
          )}
          {part.area && (
            <>
              {part.row != null ? " · " : ""}
              {t("areaRows")} {part.area.minRow + 1}–{part.area.maxRow + 1},{" "}
              {t("areaCols")} {part.area.minCol + 1}–{part.area.maxCol + 1}
            </>
          )}
        </p>
      )}
    </div>
  );
};

export default FloorMap;
