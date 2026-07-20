import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { getItems, updatePart, deleteItem } from "../api/items";
import { useAuth } from "../context/AuthContext";
import { partLabel } from "../lib/Partlabel";
import PartDetail from "./PartDetail";
import ConfirmDialog from "./ConfirmDialog";

export default function ItemDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "manager";

  // If we navigated here from ItemList, the item is already in memory —
  // avoids an extra fetch. Falls back to fetching all items (and finding
  // this one) if the page was opened directly, e.g. via a refresh.
  const [item, setItem] = useState(location.state?.item ?? null);
  const [loading, setLoading] = useState(!location.state?.item);
  const [expandedPartId, setExpandedPartId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const updatePartField = async (partId, field, change) => {
    try {
      const updated = await updatePart(id, partId, { field, change });
      setItem((prev) => ({
        ...prev,
        parts: prev.parts.map((p) => (p._id === partId ? updated : p)),
      }));
    } catch (error) {
      alert(
        "Update failed: " + (error.response?.data?.message || error.message),
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
      alert(error.response?.data?.message || error.message);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
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
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("backToItems")}
      </button>

      {/* Item summary card */}
      <div className="relative rounded-lg border border-graphite-200 bg-white p-4 shadow-sm">
        {canEdit && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="absolute inset-e-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            {t("deleteItem")}
          </button>
        )}

        <div className="flex items-center gap-3 pe-8">
          <span
            className="h-9 w-9 shrink-0 rounded-lg border border-graphite-300"
            style={{ backgroundColor: item.color }}
            title={item.color}
          />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-graphite-900">
              {item.name}
            </h1>
            <p className="mt-0.5 font-mono text-xs text-graphite-500">
              {item.serialNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Parts: each is a card; clicking expands Location/Stats tabs inline */}
      <div className="mt-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-graphite-500">
          {t("parts")}
        </h3>

        <div className="space-y-3">
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
                    {`Stock: ${item.parts[0].stock}`}
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
    </div>
  );
}
