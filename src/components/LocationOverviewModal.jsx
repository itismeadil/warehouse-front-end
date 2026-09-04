import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Map } from "lucide-react";
import { getFloorOccupancy } from "../api/floors";
import { decodeShape, expandAreas, areaSize, areasSize } from "../lib/floorShape";
import FloorGrid from "./FloorGrid";
import { partLabel } from "../lib/Partlabel";

export default function LocationOverviewModal({ item, onClose }) {
  const { t } = useTranslation();
  const [floorMaps, setFloorMaps] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Group all parts (owned + shared) by floor
  const partsByFloor = {};
  
  [...(item.parts || []), ...(item.sharedParts || [])].forEach((part) => {
    if (!part.floorId?._id) return;
    
    const floorId = part.floorId._id;
    const floorName = part.floorId.name;
    
    if (!partsByFloor[floorId]) {
      partsByFloor[floorId] = {
        floorId,
        floorName,
        parts: []
      };
    }
    
    partsByFloor[floorId].parts.push({
      ...part,
      isShared: (item.sharedParts || []).some(sp => sp._id === part._id)
    });
  });

  const floors = Object.values(partsByFloor);

  useEffect(() => {
    const loadFloorMaps = async () => {
      setLoading(true);
      setError("");
      
      try {
        const floorIds = floors.map(f => f.floorId);
        const mapPromises = floorIds.map(id => 
          getFloorOccupancy(id)
            .then(data => ({ floorId: id, data }))
            .catch(err => ({ floorId: id, error: err.message }))
        );
        
        const results = await Promise.all(mapPromises);
        
        const maps = {};
        results.forEach(({ floorId, data, error: err }) => {
          if (err) {
            maps[floorId] = { error: err };
          } else {
            maps[floorId] = data;
          }
        });
        
        setFloorMaps(maps);
      } catch (err) {
        setError(err.message || "Failed to load floor maps");
      } finally {
        setLoading(false);
      }
    };

    if (floors.length > 0) {
      loadFloorMaps();
    } else {
      setLoading(false);
    }
  }, [item._id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-graphite-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-graphite-200 px-6 py-4 dark:border-graphite-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
              <Map className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-graphite-900 dark:text-graphite-100">
                {t("locationOverview", "Location Overview")}
              </h2>
              <p className="text-sm text-graphite-500 dark:text-graphite-400">
                {item.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-graphite-400 transition-colors hover:bg-graphite-100 hover:text-graphite-600 dark:hover:bg-graphite-700 dark:hover:text-graphite-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent text-primary-600" />
              <p className="mt-4 text-sm text-graphite-500 dark:text-graphite-400">
                {t("loading")}
              </p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : floors.length === 0 ? (
            <div className="rounded-lg border border-dashed border-graphite-200 p-8 text-center dark:border-graphite-700">
              <Map className="mx-auto h-12 w-12 text-graphite-300 dark:text-graphite-600" />
              <p className="mt-4 text-sm text-graphite-500 dark:text-graphite-400">
                {t("noLocationsSet", "No locations set for this item")}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {floors.map((floor) => {
                const mapData = floorMaps[floor.floorId];
                const hasError = mapData?.error;
                const hasMap = mapData && !hasError;

                return (
                  <div key={floor.floorId} className="rounded-xl border border-graphite-200 bg-white dark:border-graphite-700 dark:bg-graphite-800">
                    {/* Floor Header */}
                    <div className="flex items-center justify-between border-b border-graphite-200 px-4 py-3 dark:border-graphite-700">
                      <div>
                        <h3 className="font-semibold text-graphite-900 dark:text-graphite-100">
                          {floor.floorName}
                        </h3>
                        <p className="text-xs text-graphite-500 dark:text-graphite-400">
                          {floor.parts.length} part{floor.parts.length !== 1 ? "s" : ""} on this floor
                        </p>
                      </div>
                    </div>

                    {/* Floor Map */}
                    {hasMap && (
                      <div className="p-4">
                        <div className="flex justify-center rounded-lg bg-graphite-50 p-3 dark:bg-graphite-900">
                          <FloorGrid
                            rows={mapData.floor.rows}
                            cols={mapData.floor.cols}
                            shapeCells={decodeShape(
                              mapData.floor.rows,
                              mapData.floor.cols,
                              mapData.floor.shape
                            )}
                            occupied={mapData.occupied}
                            selectedCells={Array.from(floor.parts.reduce((cells, part) => {
                              const areas = part.areas?.length ? part.areas : part.area ? [part.area] : [];
                              expandAreas(areas).forEach(cell => cells.add(cell));
                              return cells;
                            }, new Set()))}
                          />
                        </div>
                      </div>
                    )}

                    {hasError && (
                      <div className="p-4 text-center">
                        <p className="text-sm text-red-500">{hasError}</p>
                      </div>
                    )}

                    {/* Parts List */}
                    <div className="border-t border-graphite-200 px-4 py-3 dark:border-graphite-700">
                      <div className="space-y-2">
                        {floor.parts.map((part) => {
                          const areas = part.areas?.length ? part.areas : part.area ? [part.area] : [];
                          const size = areasSize(areas);
                          
                          return (
                            <div
                              key={part._id}
                              className="flex items-center justify-between rounded-lg bg-graphite-50 px-3 py-2 dark:bg-graphite-900"
                            >
                              <div className="flex items-center gap-3">
                                {part.isShared && (
                                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                                    Shared
                                  </span>
                                )}
                                <span className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
                                  {partLabel(item, part)}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-graphite-500 dark:text-graphite-400">
                                <span>{size} square{size !== 1 ? "s" : ""}</span>
                                {part.damaged > 0 && (
                                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                    {part.damaged} damaged
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-graphite-200 px-6 py-4 dark:border-graphite-700 shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg border border-graphite-300 px-4 py-2 text-sm font-medium text-graphite-700 transition-colors hover:bg-graphite-50 dark:border-graphite-600 dark:text-graphite-300 dark:hover:bg-graphite-700"
          >
            {t("close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
