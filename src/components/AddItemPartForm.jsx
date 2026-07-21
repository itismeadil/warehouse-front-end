import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { areaSize } from "../lib/floorShape";
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
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  const hasLocation = Boolean(part.floorId && part.area);

  return (
    <div className="relative rounded-lg border border-graphite-200 bg-graphite-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center rounded-md border border-graphite-200 bg-white px-2 py-0.5 text-xs font-medium text-graphite-500">
          PCS/CTN {totalParts}/{index + 1}
        </span>

        {totalParts > 1 && (
          <button
            type="button"
            onClick={() => onRemove(part.id)}
            aria-label={t("removePart")}
            className="rounded-md p-1 text-graphite-400 transition-colors hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-graphite-700">
            {t("location")}
          </label>

          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm text-graphite-900">
              {hasLocation ? (
                <>
                  {part.floorName ?? t("floor")} · {areaSize(part.area)}{" "}
                  {areaSize(part.area) === 1 ? t("square") : t("squares")}
                </>
              ) : (
                <span className="text-graphite-400">{t("noLocationSet")}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="whitespace-nowrap rounded-lg border border-graphite-300 px-3 py-2 text-sm font-medium text-graphite-700 transition-colors hover:bg-graphite-100"
            >
              {hasLocation ? t("change") : t("choose")}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor={`stock-${part.id}`}
            className="block text-sm font-medium text-graphite-700"
          >
            {t("stock")}
          </label>

          <input
            type="number"
            id={`stock-${part.id}`}
            value={part.stock}
            onChange={(e) => onChange(part.id, "stock", e.target.value)}
            placeholder={t("stockPlaceholder")}
            min="0"
            required
            className="mt-1.5 block w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {showPicker && (
        <FloorPickerModal
          floors={floors}
          initialFloorId={part.floorId}
          initialArea={hasLocation ? part.area : null}
          onClose={() => setShowPicker(false)}
          onConfirm={({ floorId, floorName, area }) => {
            onLocationChange(part.id, { floorId, floorName, area });
            setShowPicker(false);
          }}
        />
      )}
    </div>
  );
}
