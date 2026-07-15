import { useState, useEffect } from "react";
import { getFloorOccupancy } from "../api/floors";
import { areaSize, decodeShape, expandArea } from "../lib/floorShape";
import FloorGrid from "./FloorGrid";

const PartDetail = ({ item, part, onBack, onUpdateField }) => {
  const [partFloorMap, setPartFloorMap] = useState(null);
  const [partFloorMapLoading, setPartFloorMapLoading] = useState(false);

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

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
      >
        ← Back to {item?.name || "item"}
      </button>

      <h2 className="text-lg font-semibold text-slate-900">{item?.name}</h2>
      <p className="mt-0.5 text-sm font-medium text-blue-600">{part.name}</p>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
          <span className="text-sm text-slate-500">Location</span>
          <span className="text-sm font-medium text-slate-900">
            {part.floorId && part.area ? (
              <>
                {part.floorId.name} · {areaSize(part.area)} square
                {areaSize(part.area) !== 1 ? "s" : ""}
              </>
            ) : (
              <span className="text-slate-400">Not set</span>
            )}
          </span>
        </div>

        {part.floorId && part.area && (
          <div className="rounded-lg bg-slate-50 p-3">
            {partFloorMapLoading || !partFloorMap ? (
              <p className="py-4 text-center text-sm text-slate-500">
                Loading map...
              </p>
            ) : (
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
            )}
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
          <span className="text-sm text-slate-500">Stock</span>
          <span className="text-sm font-medium text-slate-900">
            {part.stock}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
          <span className="text-sm text-slate-500">Damaged</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpdateField(part._id, "damaged", -1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              −
            </button>
            <span className="w-4 text-center text-sm font-medium text-slate-900">
              {part.damaged || 0}
            </span>
            <button
              onClick={() => onUpdateField(part._id, "damaged", 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
          <span className="text-sm text-slate-500">Reserved</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpdateField(part._id, "reserved", -1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              −
            </button>
            <span className="w-4 text-center text-sm font-medium text-slate-900">
              {part.reserved || 0}
            </span>
            <button
              onClick={() => onUpdateField(part._id, "reserved", 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
          <span className="text-sm text-slate-500">Sold</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpdateField(part._id, "sold", -1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              −
            </button>
            <span className="w-4 text-center text-sm font-medium text-slate-900">
              {part.sold || 0}
            </span>
            <button
              onClick={() => onUpdateField(part._id, "sold", 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartDetail;
