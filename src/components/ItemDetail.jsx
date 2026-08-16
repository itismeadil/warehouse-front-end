import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  Save,
  X,
} from "lucide-react";
import {
  getItems,
  updatePart,
  updateItem,
  deleteItem,
  addPart,
} from "../api/items";
import { getUsers } from "../api/users";
import { getFloors } from "../api/floors";
import { useAuth } from "../context/AuthContext";
import { partLabel } from "../lib/Partlabel";
import PartDetail from "./PartDetail";
import ConfirmDialog from "./ConfirmDialog";
import AddItemPartForm from "./AddItemPartForm";
import AlertModal from "./AlertModal";
import { useAlert } from "../hooks/useAlert";

export default function ItemDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n: translation } = useTranslation();
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "manager";
  const { alert, showAlert, hideAlert } = useAlert();

  // If we navigated here from ItemList, the item is already in memory —
  // avoids an extra fetch. Falls back to fetching all items (and finding
  // this one) if the page was opened directly, e.g. via a refresh.
  const [item, setItem] = useState(location.state?.item ?? null);
  const [loading, setLoading] = useState(!location.state?.item);
  const [expandedPartId, setExpandedPartId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    serialNumber: "",
    name: "",
    color: "",
    supplierId: "",
    stock: "",
  });
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [floors, setFloors] = useState([]);
  const [showAddPart, setShowAddPart] = useState(false);
  const [draftPart, setDraftPart] = useState(null);
  const [addingPart, setAddingPart] = useState(false);

  const fetchItem = () => {
    setLoading(true);
    getItems()
      .then((items) => {
        setItem(items.find((i) => i._id === id) ?? null);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (item) return; // already have it
    fetchItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // Load suppliers for the edit form
    getUsers()
      .then((users) => setSuppliers(users.filter((u) => u.role === "supplier")))
      .catch((err) => console.error("Failed to load suppliers:", err));

    // Load floors for part addition
    getFloors()
      .then(setFloors)
      .catch((err) => console.error("Failed to load floors:", err));
  }, []);

  useEffect(() => {
    // Sync edit form with current item data
    if (item) {
      setEditForm({
        serialNumber: item.serialNumber || "",
        name: item.name || "",
        color: item.color || "",
        supplierId: item.supplierId?._id || "",
        stock: item.stock || "",
      });
    }
  }, [item]);

  const updatePartField = async (partId, field, change) => {
    try {
      const updated = await updatePart(id, partId, { field, change });
      setItem((prev) => ({
        ...prev,
        parts: prev.parts.map((p) => (p._id === partId ? updated : p)),
      }));
    } catch (error) {
      showAlert(
        t("updateFailed", "Update failed") +
          ": " +
          (error.response?.data?.message || error.message),
        { type: "error", title: t("error", "Error") },
      );
    }
  };

  const handlePartUpdated = (updated) => {
    setItem((prev) => ({
      ...prev,
      parts: prev.parts.map((p) => (p._id === updated._id ? updated : p)),
    }));
  };

  const handleDeleteItem = async () => {
    setDeleting(true);
    try {
      await deleteItem(id);
      navigate("/");
    } catch (error) {
      showAlert(error.response?.data?.message || error.message, {
        type: "error",
        title: t("error", "Error"),
      });
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setEditForm({
      serialNumber: item.serialNumber || "",
      name: item.name || "",
      color: item.color || "",
      supplierId: item.supplierId?._id || "",
      stock: item.stock || "",
    });
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleEditSave = async () => {
    if (!editForm.serialNumber || !editForm.name || !editForm.color) {
      showAlert(t("requiredFieldsError"), {
        type: "error",
        title: t("error", "Error"),
      });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateItem(id, {
        serialNumber: editForm.serialNumber,
        name: editForm.name,
        color: editForm.color,
        supplierId: editForm.supplierId || null,
        stock: parseInt(editForm.stock) || 0,
      });
      setItem(updated);
      setIsEditing(false);
      showAlert(t("itemUpdatedSuccess"), {
        type: "success",
        title: t("success", "Success"),
      });
    } catch (error) {
      showAlert(
        t("itemUpdatedError") +
          ": " +
          (error.response?.data?.message || error.message),
        { type: "error", title: t("error", "Error") },
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddPartClick = () => {
    setDraftPart({
      id: Date.now(),
      floorId: null,
      floorName: null,
      area: null,
    });
    setShowAddPart(true);
  };

  const handleAddPartSave = async () => {
    if (!draftPart.floorId || (!draftPart.areas && !draftPart.area)) {
      showAlert(t("requiredFieldsError"), {
        type: "error",
        title: t("error", "Error"),
      });
      return;
    }

    setAddingPart(true);
    try {
      const newPart = await addPart(id, {
        floorId: draftPart.floorId,
        areas: draftPart.areas || (draftPart.area ? [draftPart.area] : []),
      });
      setItem((prev) => ({
        ...prev,
        parts: [...prev.parts, newPart],
      }));
      setShowAddPart(false);
      setDraftPart(null);
      showAlert(t("partAddedSuccess"), {
        type: "success",
        title: t("success", "Success"),
      });
    } catch (error) {
      showAlert(
        t("failedToAddPart", "Failed to add part") +
          ": " +
          (error.response?.data?.message || error.message),
        { type: "error", title: t("error", "Error") },
      );
    } finally {
      setAddingPart(false);
    }
  };

  const handleAddPartCancel = () => {
    setShowAddPart(false);
    setDraftPart(null);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-sm text-graphite-500">{t("loadingItem")}</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-sm text-graphite-500">{t("itemNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => navigate("/")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-graphite-600 transition-colors hover:text-graphite-900"
      >
        {translation.dir() === "rtl" ? (
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        )}
        {t("backToItems")}
      </button>

      {/* Item summary card */}
      <div className="rounded-lg border border-graphite-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span
              className="h-9 w-9 shrink-0 rounded-lg border border-graphite-300"
              style={{ backgroundColor: item.color }}
              title={item.color}
            />
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm text-graphite-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    placeholder={t("itemNamePlaceholder")}
                  />
                  <input
                    type="text"
                    value={editForm.serialNumber}
                    onChange={(e) =>
                      setEditForm({ ...editForm, serialNumber: e.target.value })
                    }
                    className="block w-full rounded-lg border border-graphite-300 px-3 py-2 text-sm font-mono text-graphite-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    placeholder={t("serialNumberPlaceholder")}
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editForm.color}
                      onChange={(e) =>
                        setEditForm({ ...editForm, color: e.target.value })
                      }
                      className="flex-1 rounded-lg border border-graphite-300 px-3 py-2 text-sm text-graphite-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      placeholder={t("colorPlaceholder")}
                    />
                    <input
                      type="number"
                      value={editForm.stock}
                      onChange={(e) =>
                        setEditForm({ ...editForm, stock: e.target.value })
                      }
                      className="w-24 rounded-lg border border-graphite-300 px-3 py-2 text-sm text-graphite-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      placeholder={t("stock")}
                      min="0"
                    />
                  </div>
                  <select
                    value={editForm.supplierId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, supplierId: e.target.value })
                    }
                    className="block w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm text-graphite-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="">{t("noSupplier")}</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <h1 className="truncate text-base font-semibold text-graphite-900">
                    {item.name}
                  </h1>
                  <p className="mt-0.5 font-mono text-xs text-graphite-500">
                    {item.serialNumber}
                  </p>
                </>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2 shrink-0">
              {isEditing ? (
                <>
                  <button
                    onClick={handleEditSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 px-3 py-1.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("saveChanges")}</span>
                  </button>
                  <button
                    onClick={handleEditCancel}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-graphite-200 px-3 py-1.5 text-sm font-medium text-graphite-600 transition-colors hover:bg-graphite-50 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("cancelEdit")}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleEditStart}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 px-3 py-1.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("editItem")}</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("deleteItem")}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Item-level stock/sold/reserved - read-only, synced from accountant */}
      <div className="mt-6 rounded-xl border border-graphite-200 bg-graphite-50 p-4 shadow-sm">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-graphite-500">
          {t("stock")}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "stock", label: t("stock") },
            { key: "sold", label: t("sold") },
            { key: "reserved", label: t("reserved") },
          ].map(({ key, label }) => (
            <div
              key={key}
              className="rounded-lg border border-graphite-200 bg-white p-3"
            >
              <p className="text-xs text-graphite-500">{label}</p>
              <p className="mt-1.5 text-lg font-semibold text-graphite-900">
                {item[key] ?? 0}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-graphite-400">
          {t("stockSyncedFromAccountant")}
        </p>
      </div>

      {/* Legend for floor grid colors and Parts section - only show when stock > 0 or has damaged parts */}
      {!(item.stock === 0 && !item.parts?.some((part) => part.damaged > 0)) && (
        <div>
          {/* Legend for floor grid colors */}
          <div className="mt-6 rounded-xl border border-graphite-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-graphite-500">
              {t("locationLegend")}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-xs text-graphite-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border border-emerald-600 bg-emerald-500" />
                {t("itemLocation")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border border-slate-300 bg-slate-200" />
                {t("empty")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border border-blue-700 bg-blue-600" />
                {t("otherItems")}
              </span>
            </div>
          </div>

          {/* Parts: each is a card; clicking expands Location/Stats tabs inline */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-graphite-500">
                {t("parts")}
              </h3>
              {canEdit && (
                <button
                  onClick={handleAddPartClick}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {t("addPart")}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {showAddPart && draftPart && (
                <div className="rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/50 p-4">
                  <AddItemPartForm
                    part={draftPart}
                    index={item.parts?.length || 0}
                    totalParts={(item.parts?.length || 0) + 1}
                    floors={floors}
                    onChange={() => {}}
                    onLocationChange={(id, location) => {
                      setDraftPart((prev) => ({ ...prev, ...location }));
                    }}
                    onRemove={handleAddPartCancel}
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleAddPartSave}
                      disabled={addingPart}
                      className="flex-1 rounded-lg bg-primary-600 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                    >
                      {addingPart ? t("saving") : t("savePart")}
                    </button>
                    <button
                      onClick={handleAddPartCancel}
                      disabled={addingPart}
                      className="rounded-lg border border-graphite-300 bg-white px-4 py-2 text-sm font-medium text-graphite-700 transition-colors hover:bg-graphite-50 disabled:opacity-50"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              )}

              {item.parts?.map((part) => {
                const isExpanded = expandedPartId === part._id;
                return (
                  <div
                    key={part._id}
                    className="overflow-hidden rounded-xl border border-graphite-200 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPartId(isExpanded ? null : part._id)
                      }
                      className="flex w-full items-center justify-between px-4 py-3 text-start"
                    >
                      <span className="text-sm font-semibold text-graphite-900 truncate">
                        PCS/CTN: {partLabel(item, part)}
                      </span>
                      <span className="ml-auto shrink-0 text-sm text-graphite-500 mr-3">
                        {`Damaged: ${part.damaged}`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-graphite-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-graphite-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-graphite-200 px-4 py-4">
                        <PartDetail
                          embedded
                          item={item}
                          part={part}
                          onUpdateField={updatePartField}
                          onPartUpdated={handlePartUpdated}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title={t("deleteItem")}
          message={t("confirmDeleteItem")}
          confirmLabel={deleting ? t("deleting") : t("deleteItem")}
          confirmDisabled={deleting}
          danger
          onConfirm={handleDeleteItem}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      <AlertModal
        isOpen={!!alert}
        onClose={hideAlert}
        title={alert?.title}
        message={alert?.message}
        type={alert?.type}
        showCancel={alert?.showCancel}
        confirmText={alert?.confirmText}
        cancelText={alert?.cancelText}
        onConfirm={alert?.onConfirm}
      />
    </div>
  );
}
