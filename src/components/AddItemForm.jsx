import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Package, Plus, Check, ArrowRight, Box } from "lucide-react";
import { createItem, addPart } from "../api/items";
import { getFloors } from "../api/floors";
import { getUsers } from "../api/users";
import AddItemPartForm from "./AddItemPartForm";

const emptyPart = (id) => ({
  id,
  floorId: null,
  floorName: null,
  area: null,
});

// Maps a raw backend error into { field, message } so the UI can show a
// human-readable message and highlight the offending field, instead of
// surfacing a raw Mongo/driver error like:
// "E11000 duplicate key error collection: test.items index: serialNumber_1 dup key: { serialNumber: \"1522\" }"
const parseItemError = (error, t, serialNumber) => {
  const raw = error.response?.data?.message || error.message || "";

  if (raw.includes("E11000") && raw.includes("serialNumber")) {
    return {
      field: "serialNumber",
      message: t("duplicateSerialNumberError", { serial: serialNumber }),
    };
  }

  if (raw.includes("E11000")) {
    return { field: null, message: t("duplicateEntryError") };
  }

  return { field: null, message: t("itemAddedError", { message: raw }) };
};

export default function AddItemForm() {
  const { t } = useTranslation();

  const [itemSerialNumber, setItemSerialNumber] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemColor, setItemColor] = useState("");
  const [itemSupplierId, setItemSupplierId] = useState("");
  const [itemStock, setItemStock] = useState("");
  const [suppliers, setSuppliers] = useState([]);

  // The part currently being filled in (not yet saved to backend)
  const [draftPart, setDraftPart] = useState(emptyPart(1));

  // Parts already saved to the backend (locked, read-only)
  const [savedParts, setSavedParts] = useState([]);

  // Enhance saved parts with their IDs and indices for display
  const enhancedSavedParts = savedParts.map((part, index) => ({
    ...part,
    id: part._id || `saved-${index}`,
    partIndex: index + 1,
  }));

  const [itemId, setItemId] = useState(null); // null until Part 1 is submitted
  const [addingAnother, setAddingAnother] = useState(false);

  const [loading, setLoading] = useState(false);
  const [floors, setFloors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    getFloors()
      .then(setFloors)
      .catch((err) => console.error("Failed to load floors:", err));

    getUsers()
      .then((users) => setSuppliers(users.filter((u) => u.role === "supplier")))
      .catch((err) => console.error("Failed to load suppliers:", err));
  }, []);

  const handleDraftChange = (id, field, value) => {
    setDraftPart((prev) => ({ ...prev, [field]: value }));
  };

  const handleDraftLocationChange = (id, location) => {
    setDraftPart((prev) => ({ ...prev, ...location }));
  };

  const buildPartPayload = (part) => ({
    floorId: part.floorId || null,
    areas: part.areas || (part.area ? [part.area] : []),
  });

  // Phase 1: create the item with Part 1
  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!itemSerialNumber || !itemName || !itemColor || itemStock === "") {
      toast.error(t("requiredFieldsError"));
      return;
    }
    if (!draftPart.floorId || (!draftPart.areas && !draftPart.area)) {
      toast.error(t("completeCurrentPartError"));
      return;
    }

    setLoading(true);
    try {
      const created = await createItem({
        serialNumber: itemSerialNumber,
        name: itemName,
        color: itemColor,
        supplierId: itemSupplierId || null,
        stock: parseInt(itemStock) || 0,
        parts: [buildPartPayload(draftPart)],
      });

      setItemId(created._id);
      // Enhance parts with their IDs and indices for display
      setSavedParts(
        created.parts.map((part, index) => ({
          ...part,
          id: part._id || `saved-${index}`,
          partIndex: index + 1,
        })),
      );
      toast.success(t("itemAddedSuccess"));
    } catch (error) {
      const { field, message } = parseItemError(error, t, itemSerialNumber);
      if (field) {
        setFieldErrors((prev) => ({ ...prev, [field]: message }));
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Phase 2: save an additional part to the existing item
  const handleSavePart = async () => {
    if (!draftPart.floorId || (!draftPart.areas && !draftPart.area)) {
      toast.error(t("completeCurrentPartError"));
      return;
    }

    setLoading(true);
    try {
      const newPart = await addPart(itemId, buildPartPayload(draftPart));
      setSavedParts((prev) => [
        ...prev,
        {
          ...newPart,
          id: newPart._id || `saved-${prev.length}`,
          partIndex: prev.length + 1,
        },
      ]);
      setDraftPart(emptyPart(Date.now()));
      setAddingAnother(false); // back to the yes/no prompt
      toast.success(t("partAddedSuccess"));
    } catch (error) {
      toast.error(
        t("partAddedError", {
          message: error.response?.data?.message || error.message,
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    navigate("/");
  };

  const totalPartsPreview = savedParts.length + (itemId ? 0 : 1);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-graphite-900">
              {t("addNewItem")}
            </h1>
            <p className="text-sm text-graphite-500">
              {t("addItemDescription")}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-graphite-200 bg-white p-6 shadow-lg sm:p-8">
        <form onSubmit={handleCreateItem}>
          {/* Item Details Section */}
          <div className="mb-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="serialNumber"
                  className="block text-sm font-medium text-graphite-700 mb-1.5"
                >
                  {t("serialNumber")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="serialNumber"
                    value={itemSerialNumber}
                    autoComplete="off"
                    disabled={Boolean(itemId)}
                    onChange={(e) => {
                      setItemSerialNumber(e.target.value);
                      if (fieldErrors.serialNumber) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          serialNumber: null,
                        }));
                      }
                    }}
                    placeholder={t("serialNumberPlaceholder")}
                    required
                    aria-invalid={Boolean(fieldErrors.serialNumber)}
                    className={`block w-full rounded-xl border px-4 py-3 text-sm text-graphite-900 placeholder:text-graphite-400 focus:outline-none focus:ring-2 disabled:bg-graphite-50 disabled:text-graphite-500 transition-all ${
                      fieldErrors.serialNumber
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                        : "border-graphite-300 focus:border-primary-500 focus:ring-primary-500/20"
                    }`}
                  />
                </div>
                {fieldErrors.serialNumber && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {fieldErrors.serialNumber}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="itemName"
                  className="block text-sm font-medium text-graphite-700 mb-1.5"
                >
                  {t("itemName")}
                </label>
                <input
                  type="text"
                  id="itemName"
                  value={itemName}
                  autoComplete="off"
                  disabled={Boolean(itemId)}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder={t("itemNamePlaceholder")}
                  required
                  className="block w-full rounded-xl border border-graphite-300 px-4 py-3 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-graphite-50 disabled:text-graphite-500 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="itemColor"
                  className="block text-sm font-medium text-graphite-700 mb-1.5"
                >
                  {t("color")}
                </label>
                <input
                  type="text"
                  id="itemColor"
                  autoComplete="off"
                  value={itemColor}
                  disabled={Boolean(itemId)}
                  onChange={(e) => setItemColor(e.target.value)}
                  placeholder={t("colorPlaceholder")}
                  required
                  className="block w-full rounded-xl border border-graphite-300 px-4 py-3 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-graphite-50 disabled:text-graphite-500 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="itemStock"
                  className="block text-sm font-medium text-graphite-700 mb-1.5"
                >
                  {t("stock")}
                </label>
                <input
                  type="number"
                  id="itemStock"
                  value={itemStock}
                  autoComplete="off"
                  disabled={Boolean(itemId)}
                  onChange={(e) => setItemStock(e.target.value)}
                  placeholder="0"
                  min="0"
                  required
                  className="block w-full rounded-xl border border-graphite-300 px-4 py-3 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-graphite-50 disabled:text-graphite-500 transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="itemSupplier"
                  className="block text-sm font-medium text-graphite-700 mb-1.5"
                >
                  {t("supplier")}{" "}
                  <span className="font-normal text-graphite-400">
                    ({t("optional")})
                  </span>
                </label>
                <select
                  id="itemSupplier"
                  value={itemSupplierId}
                  disabled={Boolean(itemId)}
                  onChange={(e) => setItemSupplierId(e.target.value)}
                  className="block w-full rounded-xl border border-graphite-300 bg-white px-4 py-3 text-sm text-graphite-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-graphite-50 disabled:text-graphite-500 transition-all"
                >
                  <option value="">{t("noSupplier")}</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Parts Section */}
          <div className="border-t border-graphite-200 pt-8">
            <div className="mb-4 flex items-center gap-2">
              <Box className="h-5 w-5 text-primary-600" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-graphite-900">
                {t("parts")}
              </h3>
              {savedParts.length > 0 && (
                <span className="ml-auto flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                  <Check className="h-3.5 w-3.5" />
                  {savedParts.length}{" "}
                  {savedParts.length === 1 ? t("part") : t("parts")}
                </span>
              )}
            </div>

            {/* Already-saved parts: read-only summaries */}
            {savedParts.length > 0 && (
              <div className="mb-4 space-y-2">
                {savedParts.map((part, index) => (
                  <div
                    key={part._id}
                    className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">PCS/CTN {index + 1}</span>
                      <span className="mx-2 text-primary-400">•</span>
                      <span className="text-primary-700">
                        {part.floorId?.name ?? t("floor")}
                      </span>
                    </div>
                    <Check className="h-5 w-5 text-primary-600" />
                  </div>
                ))}
              </div>
            )}

            {/* Draft part: only shown before the item is created */}
            {!itemId && (
              <div className="rounded-xl border-2 border-dashed border-graphite-300 bg-graphite-50/50 p-4">
                <AddItemPartForm
                  part={draftPart}
                  index={0}
                  totalParts={totalPartsPreview}
                  floors={floors}
                  onChange={handleDraftChange}
                  onLocationChange={handleDraftLocationChange}
                  onRemove={() => {}}
                  savedParts={enhancedSavedParts}
                />
              </div>
            )}
          </div>

          {!itemId && (
            <button
              type="submit"
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t("saving")}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  {t("submit")}
                </>
              )}
            </button>
          )}
        </form>

        {/* Phase 2: item already exists — ask about more parts */}
        {itemId && (
          <div className="mt-6 border-t border-graphite-200 pt-6">
            {addingAnother ? (
              <>
                <div className="rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/50 p-4">
                  <AddItemPartForm
                    part={draftPart}
                    index={savedParts.length}
                    totalParts={savedParts.length + 1}
                    floors={floors}
                    onChange={handleDraftChange}
                    onLocationChange={handleDraftLocationChange}
                    onRemove={() => setAddingAnother(false)}
                    savedParts={enhancedSavedParts}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSavePart}
                  disabled={loading}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-primary-700 hover:to-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {t("saving")}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {t("savePart")}
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="mb-4 rounded-xl bg-gradient-to-r from-primary-50 to-primary-100/50 p-4">
                  <p className="text-sm font-medium text-primary-900">
                    {t("anotherPartQuestion")}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftPart(emptyPart(Date.now()));
                      setAddingAnother(true);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary-300 py-3.5 text-sm font-semibold text-primary-600 transition-all hover:border-primary-400 hover:bg-primary-50"
                  >
                    <Plus className="h-4 w-4" />
                    {t("yesAnotherPart")}
                  </button>
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-primary-700 hover:to-primary-800"
                  >
                    {t("noFinish")}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

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
