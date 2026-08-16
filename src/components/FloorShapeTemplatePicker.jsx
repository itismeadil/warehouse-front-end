import { useMemo } from "react";
import { FLOOR_SHAPE_TEMPLATES } from "./floorShapeTemplates";

const THUMB_SIZE = 56;

function TemplateThumbnail({ rows, cols, cells }) {
  const filled = useMemo(
    () => new Set(cells.map(({ row, col }) => `${row}-${col}`)),
    [cells],
  );

  const cellPx = THUMB_SIZE / Math.max(rows, cols);
  const w = cellPx * cols;
  const h = cellPx * rows;

  const rects = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rects.push(
        <rect
          key={`${r}-${c}`}
          x={c * cellPx}
          y={r * cellPx}
          width={cellPx}
          height={cellPx}
          rx={1}
          className={
            filled.has(`${r}-${c}`) ? "fill-blue-400" : "fill-slate-100"
          }
        />,
      );
    }
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      {rects}
    </svg>
  );
}

// Props:
// - rows, cols: the chosen size preset's grid dimensions
// - selectedId: id of the currently selected template (or null)
// - onSelect(template): called with the full template object when tapped
export default function FloorShapeTemplatePicker({
  rows,
  cols,
  selectedId,
  onSelect,
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {FLOOR_SHAPE_TEMPLATES.map((template) => {
        const cells = useMemo(
          () => template.getCells(rows, cols),
          [template, rows, cols],
        );
        const isSelected = selectedId === template.id;

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-center transition-colors ${
              isSelected
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 bg-slate-50 hover:border-slate-300"
            }`}
          >
            <TemplateThumbnail rows={rows} cols={cols} cells={cells} />
            <span className="text-xs font-medium text-slate-700">
              {template.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
