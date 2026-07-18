import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { getFloorOccupancy } from "../api/floors";
import { useTranslation } from "react-i18next";
import { areaSize, decodeShape, expandArea } from "../lib/floorShape";
import FloorGrid from "./FloorGrid";

const STATS = [
  { key: "stock", label: "stock", editable: false },
  { key: "reserved", label: "reserved", editable: true },
  { key: "sold", label: "sold", editable: true },
  { key: "damaged", label: "damaged", editable: true },
];

const StatCard = ({ label, value, editable, onDecrement, onIncrement }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <span className="text-3xl font-bold text-slate-900">{value || 0}</span>
        {editable && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onDecrement}
              aria-label={`decrease ${label}`}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <Minus size={16} />
            </button>
            <button
              onClick={onIncrement}
              aria-label={`increase ${label}`}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
const PartDetail = ({ item, part, onBack, onUpdateField }) => {
  const [partFloorMap, setPartFloorMap] = useState(null);
  const [partFloorMapLoading, setPartFloorMapLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("location");

  const { t } = useTranslation();

  useEffect(() => {
    const floorId = part?.floorId?._id;
    if (!floorId) {
      setPartFloorMap(null);
      return;
    }

    setPartFloorMapLoading(true);
    getFloorOccupancy(floorId)
      .then(setPartFloorMap)
      .catch((err) => {
        console.error(err);
        setPartFloorMap(null);
      })
      .finally(() => setPartFloorMapLoading(false));
  }, [part?.floorId?._id]);

  if (!part) return null;

  const hasLocation = part.floorId && part.area;

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
      >
        ← {t("backTo")} {item?.name || t("item")}
      </button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#613DC1]">
            {item?.name}
          </p>

          <h2 className="mt-0.5 text-2xl font-bold text-[#2C0735]">
            {part.name}
          </h2>
        </div>

        {hasLocation && (
          <span className="mt-1 shrink-0 rounded-full border border-slate-200 bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
            {part.floorId.name}
          </span>
        )}
      </div>

      {/* Floor map */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-1">
        <div className="flex gap-2">
          {[
            { id: "location", label: t("location") },
            { id: "stats", label: t("stats") },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "location" ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-700">
              {t("floorLocation")}
            </h3>

            {hasLocation && (
              <span className="text-xs font-medium text-slate-500">
                {areaSize(part.area)}{" "}
                {areaSize(part.area) === 1 ? t("square") : t("squares")}
              </span>
            )}
          </div>

          <div className="p-4">
            {!hasLocation ? (
              <p className="py-8 text-center text-sm text-slate-500">
                {t("noLocationAssigned")}
              </p>
            ) : partFloorMapLoading || !partFloorMap ? (
              <p className="py-8 text-center text-sm text-slate-500">
                {t("loadingMap")}
              </p>
            ) : (
              <div className="flex justify-center rounded-lg bg-white p-3 shadow-inner">
                <FloorGrid
                  rows={partFloorMap.floor.rows}
                  cols={partFloorMap.floor.cols}
                  shapeCells={decodeShape(
                    partFloorMap.floor.rows,
                    partFloorMap.floor.cols,
                    partFloorMap.floor.shape,
                  )}
                  occupied={partFloorMap.occupied}
                  selectedCells={expandArea(part.area)}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              {t("inventory")}
            </h3>

            <span className="text-xs text-slate-500">
              {part.stock !== undefined
                ? t("stockCount", { count: part.stock })
                : ""}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {STATS.map(({ key, label, editable }) => (
              <StatCard
                key={key}
                label={t(label)}
                value={part[key]}
                editable={editable}
                t={t}
                onDecrement={() => onUpdateField(part._id, key, -1)}
                onIncrement={() => onUpdateField(part._id, key, 1)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartDetail;
