import { useState, useEffect } from "react";
import { createItem } from "../api/items";
import { getFloors } from "../api/floors";
import AddItemPartForm from "./AddItemPartForm";

const emptyPart = (id) => ({
  id,
  floorId: null,
  floorName: null,
  row: null,
  col: null,
  cells: [],
  stock: "",
});

export default function AddItemForm() {
  const [itemSerialNumber, setItemSerialNumber] = useState("");
  const [itemName, setItemName] = useState("");
  const [parts, setParts] = useState([emptyPart(1)]);
  const [nextId, setNextId] = useState(2);
  const [loading, setLoading] = useState(false);
  const [floors, setFloors] = useState([]);

  useEffect(() => {
    getFloors()
      .then(setFloors)
      .catch((err) => console.error("Failed to load floors:", err));
  }, []);

  const handlePartChange = (id, field, value) => {
    setParts(
      parts.map((part) =>
        part.id === id ? { ...part, [field]: value } : part,
      ),
    );
  };

  const handlePartLocationChange = (id, location) => {
    setParts(
      parts.map((part) => (part.id === id ? { ...part, ...location } : part)),
    );
  };

  const handleAddPart = () => {
    setParts([...parts, emptyPart(nextId)]);
    setNextId(nextId + 1);
  };

  const handleRemovePart = (id) => {
    if (parts.length > 1) {
      setParts(parts.filter((part) => part.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemSerialNumber || !itemName) {
      alert("Serial Number and Item Name are required");
      return;
    }

    setLoading(true);

    try {
      const partsToInsert = parts.map((part, index) => {
        const stockVal =
          (parseInt(part.stock) || 0) +
          (parseInt(part.damaged) || 0) +
          (parseInt(part.reserved) || 0) +
          (parseInt(part.sold) || 0);

        return {
          // format: "totalParts/index pcs/ctn" e.g. "3/1 pcs/ctn"
          name: `${parts.length}/${index + 1} pcs/ctn`,
          floorId: part.floorId || null,
          row: part.row,
          col: part.col,
          cells: part.cells || [],
          stock: stockVal,
          damaged: parseInt(part.damaged) || 0,
          reserved: parseInt(part.reserved) || 0,
          sold: parseInt(part.sold) || 0,
        };
      });

      await createItem({
        serialNumber: itemSerialNumber,
        name: itemName,
        parts: partsToInsert,
      });

      alert("✅ Item and parts added successfully!");

      // Reset
      setItemSerialNumber("");
      setItemName("");
      setParts([emptyPart(1)]);
      setNextId(2);
    } catch (error) {
      console.error(error);
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Add New Item</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter the item details and at least one storage location.
        </p>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="serialNumber"
                className="block text-sm font-medium text-slate-700"
              >
                Item Serial Number
              </label>
              <input
                type="text"
                id="serialNumber"
                value={itemSerialNumber}
                onChange={(e) => setItemSerialNumber(e.target.value)}
                placeholder="Enter item serial number"
                required
                className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="itemName"
                className="block text-sm font-medium text-slate-700"
              >
                Item Name
              </label>
              <input
                type="text"
                id="itemName"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Enter item name"
                required
                className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Parts
              </h3>
              {floors.length === 0 && (
                <span className="text-xs text-amber-600">
                  No floors yet — add one on the Floor Maps page
                </span>
              )}
            </div>

            <div className="mt-3 space-y-3">
              {parts.map((part, index) => (
                <AddItemPartForm
                  key={part.id}
                  part={part}
                  index={index}
                  totalParts={parts.length}
                  floors={floors}
                  onChange={handlePartChange}
                  onLocationChange={handlePartLocationChange}
                  onRemove={handleRemovePart}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddPart}
              className="mt-3 w-full rounded-lg border border-dashed border-slate-300 py-2.5 text-sm font-medium text-blue-600 transition-colors hover:border-blue-400 hover:bg-blue-50"
            >
              + Add Part
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
