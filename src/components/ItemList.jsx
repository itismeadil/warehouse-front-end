import { useState, useEffect } from "react";
import { getItems, updatePart } from "../api/items";
import { getFloorOccupancy } from "../api/floors";
import { areaSize, decodeShape, expandArea } from "../lib/floorShape";
import FloorGrid from "./FloorGrid";

const ItemList = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partFloorMap, setPartFloorMap] = useState(null);
  const [partFloorMapLoading, setPartFloorMapLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getItems();
      setItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const floorId = selectedPart?.floorId?._id;
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
  }, [selectedPart?.floorId?._id]);

  const updatePartField = async (partId, field, change) => {
    if (!selectedItem || !selectedPart) return;

    try {
      const updated = await updatePart(selectedItem._id, partId, {
        field,
        change,
      });
      setSelectedPart(updated);
      // Refresh full list in background
      fetchItems();
    } catch (error) {
      alert(
        "Update failed: " + (error.response?.data?.message || error.message),
      );
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setSelectedPart(null);
  };

  const handlePartClick = (part) => setSelectedPart(part);
  const handleCloseItemPopup = () => {
    setSelectedItem(null);
    setSelectedPart(null);
  };
  const handleClosePartPopup = () => {
    setSelectedPart(null);
    setPartFloorMap(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          Furniture Store Inventory
        </h1>
        <button
          onClick={fetchItems}
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading inventory...</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">No items yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <button
              key={item._id}
              onClick={() => handleItemClick(item)}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <h3 className="font-medium text-slate-900">{item.name}</h3>
              <p className="mt-0.5 text-sm text-slate-500">
                Serial: {item.serialNumber}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Item Details Popup */}
      {selectedItem && !selectedPart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={handleCloseItemPopup}
        >
          <div
            className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseItemPopup}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              ✕
            </button>

            <h2 className="pr-8 text-lg font-semibold text-slate-900">
              {selectedItem.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-medium text-slate-700">Serial:</span>{" "}
              {selectedItem.serialNumber}
            </p>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Parts
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedItem.parts?.map((part) => (
                  <button
                    key={part._id}
                    onClick={() => handlePartClick(part)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {part.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Part Details Popup */}
      {selectedPart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={handleClosePartPopup}
        >
          <div
            className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClosePartPopup}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              ✕
            </button>

            <h2 className="pr-8 text-lg font-semibold text-slate-900">
              {selectedItem?.name}
            </h2>
            <p className="mt-0.5 text-sm font-medium text-blue-600">
              {selectedPart.name}
            </p>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="text-sm text-slate-500">Location</span>
                <span className="text-sm font-medium text-slate-900">
                  {selectedPart.floorId && selectedPart.area ? (
                    <>
                      {selectedPart.floorId.name} · {areaSize(selectedPart.area)}{" "}
                      square{areaSize(selectedPart.area) !== 1 ? "s" : ""}
                    </>
                  ) : (
                    <span className="text-slate-400">Not set</span>
                  )}
                </span>
              </div>

              {selectedPart.floorId && selectedPart.area && (
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
                      selectedCells={expandArea(selectedPart.area)}
                    />
                  )}
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="text-sm text-slate-500">Stock</span>
                <span className="text-sm font-medium text-slate-900">
                  {selectedPart.stock}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="text-sm text-slate-500">Damaged</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      updatePartField(selectedPart._id, "damaged", -1)
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-sm font-medium text-slate-900">
                    {selectedPart.damaged || 0}
                  </span>
                  <button
                    onClick={() =>
                      updatePartField(selectedPart._id, "damaged", 1)
                    }
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
                    onClick={() =>
                      updatePartField(selectedPart._id, "reserved", -1)
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-sm font-medium text-slate-900">
                    {selectedPart.reserved || 0}
                  </span>
                  <button
                    onClick={() =>
                      updatePartField(selectedPart._id, "reserved", 1)
                    }
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
                    onClick={() =>
                      updatePartField(selectedPart._id, "sold", -1)
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-sm font-medium text-slate-900">
                    {selectedPart.sold || 0}
                  </span>
                  <button
                    onClick={() =>
                      updatePartField(selectedPart._id, "sold", 1)
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleClosePartPopup}
              className="mt-6 w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Back to Parts
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemList;
