import { useState } from "react";
import axios from "axios";
import AddItemPartForm from "./AddItemPartForm";

export default function AddItemForm() {
  const [itemSerialNumber, setItemSerialNumber] = useState("");
  const [itemName, setItemName] = useState("");
  const [parts, setParts] = useState([{ id: 1, location: "", stock: "" }]);
  const [nextId, setNextId] = useState(2);
  const [loading, setLoading] = useState(false);

  const handlePartChange = (id, field, value) => {
    setParts(
      parts.map((part) =>
        part.id === id ? { ...part, [field]: value } : part,
      ),
    );
  };

  const handleAddPart = () => {
    setParts([...parts, { id: nextId, location: "", stock: "" }]);
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
      const item = {
        serialNumber: itemSerialNumber,
        name: itemName,
        parts: parts.map((part, index) => ({
          name: `${parts.length}/${index + 1} pcs/ctn`,
          location: part.location,
          stock: Number(part.stock) || 0,
          reserved: Number(part.reserved) || 0,
          damaged: Number(part.damaged) || 0,
          sold: Number(part.sold) || 0,
        })),
      };

      await axios.post(`${import.meta.env.VITE_API_URL}/items`, item);

      alert("✅ Item added successfully!");

      setItemSerialNumber("");
      setItemName("");
      setParts([{ id: 1, location: "", stock: "" }]);
      setNextId(2);
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "Failed to save item.");
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
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Parts
            </h3>

            <div className="mt-3 space-y-3">
              {parts.map((part, index) => (
                <AddItemPartForm
                  key={part.id}
                  part={part}
                  index={index}
                  totalParts={parts.length}
                  onChange={handlePartChange}
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
