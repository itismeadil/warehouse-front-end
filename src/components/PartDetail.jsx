import FloorMap from "./FloorMap";

/**
 * Part details panel / modal.
 * Shows stock counters and an interactive floor map for navigation.
 */
const PartDetail = ({ item, part, onClose, onUpdateField, onCellClick }) => {
  if (!part) return null;

  const locationLabel = part.floorId?.name
    ? `${part.floorId.name} · Row ${Number(part.row) + 1}, Col ${Number(part.col) + 1}`
    : part.floorName
      ? `${part.floorName} · Row ${Number(part.row) + 1}, Col ${Number(part.col) + 1}`
      : "No floor assigned";

  const fields = [
    { key: "stock", label: "Stock", value: part.stock, allowDecrement: true },
    {
      key: "damaged",
      label: "Damaged",
      value: part.damaged || 0,
      allowDecrement: true,
    },
    {
      key: "reserved",
      label: "Reserved",
      value: part.reserved || 0,
      allowDecrement: true,
    },
    {
      key: "sold",
      label: "Sold",
      value: part.sold || 0,
      allowDecrement: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {item?.name || "Item"}
            </p>
            <h2 className="text-lg font-semibold text-slate-900">
              {part.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{locationLabel}</p>
            {part.locationType && (
              <p className="mt-0.5 text-xs capitalize text-slate-400">
                Location type: {part.locationType}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close part details"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          {fields.map(({ key, label, value }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5"
            >
              <span className="text-sm text-slate-500">{label}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateField?.(part._id, key, -1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  aria-label={`Decrease ${label}`}
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-medium text-slate-900">
                  {value}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateField?.(part._id, key, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  aria-label={`Increase ${label}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Floor map
          </h3>
          <FloorMap part={part} onCellClick={onCellClick} />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Back to Parts
        </button>
      </div>
    </div>
  );
};

export default PartDetail;
