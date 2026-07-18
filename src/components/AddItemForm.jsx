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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemSerialNumber || !itemName || !itemColor) {
      toast.error(t("requiredFieldsError"));
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

      toast.success(t("itemAddedSuccess"));
      navigate("/");

      // Reset
      setItemSerialNumber("");
      setItemName("");
      setItemColor("");
      setParts([emptyPart(1)]);
      setNextId(2);
    } catch (error) {
      console.error(error);
      toast.error(
        t("itemAddedError", {
          message: error.response?.data?.message || error.message,
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-graphite-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-graphite-900">
          {t("addNewItem")}
        </h2>
        <p className="mt-1 text-sm text-graphite-500">
          {t("addItemDescription")}
        </p>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="serialNumber"
                className="block text-sm font-medium text-graphite-700"
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
                className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="itemName"
                className="block text-sm font-medium text-graphite-700"
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
                className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="itemColor"
                className="block text-sm font-medium text-graphite-700"
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
                className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          <div className="mt-8 border-t border-graphite-200 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-graphite-500">
                {t("parts")}
              </h3>
              {floors.length === 0 && (
                <span className="text-xs text-primary-600">
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
              className="mt-3 w-full rounded-lg border border-dashed border-graphite-300 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:border-primary-400 hover:bg-primary-50"
            >
              {t("addPart")}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
