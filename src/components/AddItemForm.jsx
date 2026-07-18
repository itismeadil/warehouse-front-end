import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createItem } from "../api/items";
import { getFloors } from "../api/floors";
import AddItemPartForm from "./AddItemPartForm";

const emptyPart = (id) => ({
  id,
  floorId: null,
  floorName: null,
  area: null,
  stock: "",
});

export default function AddItemForm() {
  const { t } = useTranslation();
  const [itemSerialNumber, setItemSerialNumber] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemColor, setItemColor] = useState("");
  const [parts, setParts] = useState([emptyPart(1)]);
  const [nextId, setNextId] = useState(2);
  const [loading, setLoading] = useState(false);
  const [floors, setFloors] = useState([]);
  const navigate = useNavigate();

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

  const validateForm = () => {
    if (!itemSerialNumber.trim() || !itemName.trim() || !itemColor.trim()) {
      toast.warn("Serial Number, Item Name, and Color are required");
      return false;
    }

    if (parts.length === 0) {
      toast.warn("At least one part is required");
      return false;
    }

    for (let index = 0; index < parts.length; index += 1) {
      const part = parts[index];
      const stockValue = part.stock?.toString().trim();

      if (!part.floorId || !part.area?.toString().trim() || !stockValue) {
        toast.warn(`Part ${index + 1} must include location and stock number`);
        return false;
      }

      if (Number.isNaN(parseInt(stockValue, 10))) {
        toast.warn(`Stock must be a valid number for part ${index + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    let created = false;

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
          area: part.area || null,
          stock: stockVal,
          damaged: parseInt(part.damaged) || 0,
          reserved: parseInt(part.reserved) || 0,
          sold: parseInt(part.sold) || 0,
        };
      });

      await createItem({
        serialNumber: itemSerialNumber,
        name: itemName,
        color: itemColor,
        parts: partsToInsert,
      });

      toast.success("Item and parts added successfully!");
      created = true;

      // Reset
      setItemSerialNumber("");
      setItemName("");
      setItemColor("");
      setParts([emptyPart(1)]);
      setNextId(2);
    } catch (error) {
      console.error(error);
      toast.error("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      if (created) navigate("/");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">
          {t("addNewItem")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{t("addItemDescription")}</p>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="serialNumber"
                className="block text-sm font-medium text-slate-700"
              >
                {t("serialNumber")}
              </label>
              <input
                type="text"
                id="serialNumber"
                value={itemSerialNumber}
                autoComplete="off"
                onChange={(e) => setItemSerialNumber(e.target.value)}
                placeholder={t("serialNumberPlaceholder")}
                required
                className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="itemName"
                className="block text-sm font-medium text-slate-700"
              >
                {t("itemName")}
              </label>
              <input
                type="text"
                id="itemName"
                value={itemName}
                autoComplete="off"
                onChange={(e) => setItemName(e.target.value)}
                placeholder={t("itemNamePlaceholder")}
                required
                className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="itemColor"
                className="block text-sm font-medium text-slate-700"
              >
                {t("color")}
              </label>
              <input
                type="text"
                id="itemColor"
                autoComplete="off"
                value={itemColor}
                onChange={(e) => setItemColor(e.target.value)}
                placeholder={t("colorPlaceholder")}
                required
                className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("parts")}
              </h3>
              {floors.length === 0 && (
                <span className="text-xs text-amber-600">
                  {t("noFloorsWarning")}
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
              {t("addPart")}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t("saving") : t("submit")}
          </button>
        </form>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </div>
  );
}
