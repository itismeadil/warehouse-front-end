import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { updatePart } from "../api/items";
import PartDetail from "./PartDetail";

const ItemList = ({ items, loading, searchTerm = "" }) => {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(term) ||
        item.serialNumber?.toLowerCase().includes(term) ||
        item.color?.toLowerCase().includes(term),
    );
  }, [items, searchTerm]);

  const updatePartField = async (partId, field, change) => {
    if (!selectedItem || !selectedPart) return;

    try {
      const updated = await updatePart(selectedItem._id, partId, {
        field,
        change,
      });
      setSelectedPart(updated);
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
  const handleClosePartPage = () => {
    setSelectedPart(null);
  };

  return (
    <div>
      {selectedPart ? (
        <div className="min-h-screen bg-slate-50 p-4">
          <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-lg">
            <PartDetail
              item={selectedItem}
              part={selectedPart}
              onBack={handleClosePartPage}
              onUpdateField={updatePartField}
            />
          </div>
        </div>
      ) : (
        <>
          {loading ? (
            <p className="text-sm text-slate-500">Loading inventory...</p>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white py-12 text-center">
              <p className="text-sm text-slate-500">
                {items.length === 0
                  ? "No items yet."
                  : "No items match your search."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filteredItems.map((item) => (
                <button
                  key={item._id}
                  onClick={() => handleItemClick(item)}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-4 w-4 shrink-0 rounded-sm border border-slate-300"
                      style={{ backgroundColor: item.color }}
                      title={item.color}
                    />
                    <span className="truncate font-medium text-slate-900">
                      {item.name}
                    </span>
                  </div>
                  <span className="shrink-0 pl-3 text-sm text-slate-500">
                    {item.serialNumber}
                  </span>
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
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-3 pr-8">
                  <span
                    className="h-6 w-6 shrink-0 rounded-md border border-slate-300"
                    style={{ backgroundColor: selectedItem.color }}
                    title={selectedItem.color}
                  />
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selectedItem.name}
                  </h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  <span className="font-medium text-slate-700">
                    {t("serialNumber")}:
                  </span>{" "}
                  {selectedItem.serialNumber}
                  <span className="mx-1.5">·</span>
                  <span className="font-medium text-slate-700">
                    {t("color")}:
                  </span>{" "}
                  {selectedItem.color}
                </p>

                <div className="mt-6 border-t border-slate-200 pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("parts")}
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
        </>
      )}
    </div>
  );
};

export default ItemList;
