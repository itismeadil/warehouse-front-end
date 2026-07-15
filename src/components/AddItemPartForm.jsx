import { useState } from "react";
import FloorPickerModal from "./FloorPickerModal";

export default function AddItemPartForm({
  part,
  index,
  totalParts,
  floors,
  onChange,
  onLocationChange,
  onRemove,
}) {
  const [showPicker, setShowPicker] = useState(false);

  const hasLocation = part.floorId && part.cells && part.cells.length > 0;

  return (
    <div className="relative rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
          PCS/CTN {totalParts}/{index + 1}
        </span>

        {totalParts > 1 && (
          <button
            type="button"
            onClick={() => onRemove(part.id)}
            aria-label="Remove part"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Location
          </label>

          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
              {hasLocation ? (
                <>
                  {part.floorName ?? "Floor"} · {part.cells.length} square
                  {part.cells.length !== 1 ? "s" : ""}
                </>
              ) : (
                <span className="text-slate-400">No location set</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="whitespace-nowrap rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              {hasLocation ? "Change" : "Choose"}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor={`stock-${part.id}`}
            className="block text-sm font-medium text-slate-700"
          >
            Stock
          </label>
          <input
            type="number"
            id={`stock-${part.id}`}
            value={part.stock}
            onChange={(e) => onChange(part.id, "stock", e.target.value)}
            placeholder="Enter stock quantity"
            min="0"
            required
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {showPicker && (
        <FloorPickerModal
          floors={floors}
          initialFloorId={part.floorId}
          initialCells={hasLocation ? part.cells : []}
          onClose={() => setShowPicker(false)}
          onConfirm={({ floorId, floorName, row, col, cells }) => {
            onLocationChange(part.id, { floorId, floorName, row, col, cells });
            setShowPicker(false);
          }}
        />
      )}
    </div>
  );
}
