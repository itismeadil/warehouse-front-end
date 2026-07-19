import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createItem, addPart } from "../api/items";
import { getFloors } from "../api/floors";
import { getUsers } from "../api/users";
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
  const [itemSupplierId, setItemSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState([]);

  // The part currently being filled in (not yet saved to backend)
  const [draftPart, setDraftPart] = useState(emptyPart(1));

  // Parts already saved to the backend (locked, read-only)
  const [savedParts, setSavedParts] = useState([]);

  const [itemId, setItemId] = useState(null); // null until Part 1 is submitted
  const [addingAnother, setAddingAnother] = useState(false);

  const [loading, setLoading] = useState(false);
  const [floors, setFloors] = useState([]);
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
    area: part.area || null,
    stock: parseInt(part.stock) || 0,
  });

  // Phase 1: create the item with Part 1
  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!itemSerialNumber || !itemName || !itemColor) {
      toast.error(t("requiredFieldsError"));
      return;
    }
    if (!draftPart.floorId || !draftPart.area || draftPart.stock === "") {
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
        parts: [buildPartPayload(draftPart)],
      });

      setItemId(created._id);
      setSavedParts(created.parts); // parts come back with real _id + populated floorId
      toast.success(t("itemAddedSuccess"));
    } catch (error) {
      toast.error(
        t("itemAddedError", {
          message: error.response?.data?.message || error.message,
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  // Phase 2: save an additional part to the existing item
  const handleSavePart = async () => {
    if (!draftPart.floorId || !draftPart.area || draftPart.stock === "") {
      toast.error(t("completeCurrentPartError"));
      return;
    }

    setLoading(true);
    try {
      const newPart = await addPart(itemId, buildPartPayload(draftPart));
      setSavedParts((prev) => [...prev, newPart]);
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
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-graphite-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-graphite-900">
          {t("addNewItem")}
        </h2>
        <p className="mt-1 text-sm text-graphite-500">
          {t("addItemDescription")}
        </p>

        <form onSubmit={handleCreateItem} className="mt-6">
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
                disabled={Boolean(itemId)}
                onChange={(e) => setItemSerialNumber(e.target.value)}
                placeholder={t("serialNumberPlaceholder")}
                required
                className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-graphite-100 disabled:text-graphite-500"
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
                disabled={Boolean(itemId)}
                onChange={(e) => setItemName(e.target.value)}
                placeholder={t("itemNamePlaceholder")}
                required
                className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-graphite-100 disabled:text-graphite-500"
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
                disabled={Boolean(itemId)}
                onChange={(e) => setItemColor(e.target.value)}
                placeholder={t("colorPlaceholder")}
                required
                className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-graphite-100 disabled:text-graphite-500"
              />
            </div>

            <div>
              <label
                htmlFor="itemSupplier"
                className="block text-sm font-medium text-graphite-700"
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
                className="mt-1.5 block w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm text-graphite-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-graphite-100 disabled:text-graphite-500"
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

          <div className="mt-8 border-t border-graphite-200 pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-graphite-500">
              {t("parts")}
            </h3>

            {/* Already-saved parts: read-only summaries */}
            {savedParts.length > 0 && (
              <div className="mt-3 space-y-2">
                {savedParts.map((part, index) => (
                  <div
                    key={part._id}
                    className="rounded-lg border border-graphite-200 bg-graphite-50 px-4 py-2.5 text-sm text-graphite-700"
                  >
                    <span className="font-medium">
                      PCS/CTN {savedParts.length}/{index + 1}
                    </span>{" "}
                    — {part.floorId?.name ?? t("floor")}, {t("stock")}:{" "}
                    {part.stock}
                  </div>
                ))}
              </div>
            )}

            {/* Draft part: only shown before the item is created */}
            {!itemId && (
              <div className="mt-3">
                <AddItemPartForm
                  part={draftPart}
                  index={0}
                  totalParts={totalPartsPreview}
                  floors={floors}
                  onChange={handleDraftChange}
                  onLocationChange={handleDraftLocationChange}
                  onRemove={() => {}}
                />
              </div>
            )}
          </div>

          {!itemId && (
            <button
              type="submit"
              disabled={loading}
              className="mt-8 w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? t("saving") : t("submit")}
            </button>
          )}
        </form>

        {/* Phase 2: item already exists — ask about more parts */}
        {itemId && (
          <div className="mt-6 border-t border-graphite-200 pt-6">
            {addingAnother ? (
              <>
                <AddItemPartForm
                  part={draftPart}
                  index={savedParts.length}
                  totalParts={savedParts.length + 1}
                  floors={floors}
                  onChange={handleDraftChange}
                  onLocationChange={handleDraftLocationChange}
                  onRemove={() => setAddingAnother(false)}
                />
                <button
                  type="button"
                  onClick={handleSavePart}
                  disabled={loading}
                  className="mt-3 w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? t("saving") : t("savePart")}
                </button>
              </>
            ) : (
              <>
                <p className="mb-3 text-sm font-medium text-graphite-700">
                  {t("anotherPartQuestion")}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftPart(emptyPart(Date.now()));
                      setAddingAnother(true);
                    }}
                    className="flex-1 rounded-lg border border-dashed border-graphite-300 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:border-primary-400 hover:bg-primary-50"
                  >
                    {t("yesAnotherPart")}
                  </button>
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="flex-1 rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
                  >
                    {t("noFinish")}
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
