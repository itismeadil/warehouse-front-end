import { useState, useEffect, useMemo } from "react";
import { getItems, updatePart } from "../api/items";
import PartDetail from "./PartDetail";

const ItemList = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

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

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.serialNumber?.toLowerCase().includes(q),
    );
  }, [items, query]);

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
  const handleBackFromPart = () => setSelectedPart(null);

  if (selectedPart) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <PartDetail
          item={selectedItem}
          part={selectedPart}
          onBack={handleBackFromPart}
          onUpdateField={updatePartField}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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

      <div className="relative mb-6">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35m1.35-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or serial number..."
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
          >
            ✕
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading inventory...</p>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">
            {query ? `No items match "${query}".` : "No items yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <button
              key={item._id}
              onClick={() => handleItemClick(item)}
              className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-slate-900 transition-colors group-hover:text-blue-700">
                  {item.name}
                </h3>
                {item.parts?.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    {item.parts.length} part
                    {item.parts.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Serial: {item.serialNumber}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Item Details Popup */}
      {selectedItem && (
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
    </div>
  );
};

export default ItemList;
