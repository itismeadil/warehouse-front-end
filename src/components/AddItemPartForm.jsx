export default function AddItemPartForm({
  part,
  index,
  totalParts,
  onChange,
  onRemove,
}) {
  return (
    <div className="relative rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
          Part {index + 1} of {totalParts}
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
          <label
            htmlFor={`location-${part.id}`}
            className="block text-sm font-medium text-slate-700"
          >
            Location
          </label>
          <input
            type="text"
            id={`location-${part.id}`}
            value={part.location}
            onChange={(e) => onChange(part.id, "location", e.target.value)}
            placeholder="Enter location"
            required
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
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
    </div>
  );
}
